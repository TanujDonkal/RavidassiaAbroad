import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import {
  CURRENT_POLICY_VERSION,
  PRIVACY_CONTACT_EMAIL,
  RETENTION_POLICY,
  getRequestIp,
  isValidEmail,
  normalizeBooleanInput,
  normalizeEmail,
  normalizeOptionalText,
  normalizeRequiredText,
  sanitizeRichText,
  sanitizeUrl,
} from "./compliance.js";

dotenv.config();

const { Pool } = pkg;
const app = express();
app.set("trust proxy", 1);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpStore = new Map();
const rateLimitStore = new Map();
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const resend = new Resend(process.env.RESEND_API_KEY);
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ra_session";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const AUTH_COOKIE_SECURE =
  process.env.AUTH_COOKIE_SECURE === "true" || IS_PRODUCTION;
const AUTH_COOKIE_SAME_SITE =
  process.env.AUTH_COOKIE_SAME_SITE || (IS_PRODUCTION ? "None" : "Lax");
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const serverState = {
  dbReady: false,
  lastDbError: null,
};

// ---- CORS ----
const allowedPatterns = [
  /^http:\/\/localhost(:\d+)?$/, // local dev
  /^https:\/\/([a-z0-9-]+\.)?ravidassiaabroad\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?ravidassia-abroad\.vercel\.app$/,
];

function isAllowedOrigin(origin) {
  return !origin || allowedPatterns.some((re) => re.test(origin));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked CORS origin:", origin);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.fontawesome.com https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.paypal.com https://code.jquery.com https://cdn.jsdelivr.net; connect-src 'self' https: http://localhost:* ws://localhost:*; frame-src https://www.paypal.com https://www.youtube.com; font-src 'self' https://fonts.gstatic.com https://use.fontawesome.com https://cdn.jsdelivr.net data:;"
  );
  next();
});

function cleanupExpiredOtps() {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (!record?.expiresAt || now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}

setInterval(cleanupExpiredOtps, 60 * 1000).unref?.();

function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry?.resetAt || now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredRateLimits, 60 * 1000).unref?.();

function createRateLimiter({ windowMs, max, bucket }) {
  return (req, res, next) => {
    const ip = getRequestIp(req);
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      return res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
    }

    entry.count += 1;
    next();
  };
}

function makeUploader(folder) {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
        use_filename: false,
        unique_filename: true,
      },
    }),
    fileFilter: (_req, file, callback) => {
      if (IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(null, true);
        return;
      }
      callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

function parseCookies(req) {
  const rawCookie = req.headers.cookie || "";
  return rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index === -1) return acc;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getCookie(req, name) {
  return parseCookies(req)[name] || null;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  return parts.join("; ");
}

function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: AUTH_COOKIE_SECURE,
      sameSite: AUTH_COOKIE_SAME_SITE,
      path: "/",
      maxAge: Math.floor(AUTH_COOKIE_MAX_AGE_MS / 1000),
    })
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: AUTH_COOKIE_SECURE,
      sameSite: AUTH_COOKIE_SAME_SITE,
      path: "/",
      maxAge: 0,
    })
  );
}

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return getCookie(req, AUTH_COOKIE_NAME);
}

function requireTrustedOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (origin) {
    return isAllowedOrigin(origin)
      ? next()
      : res.status(403).json({ message: "Untrusted origin" });
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return isAllowedOrigin(refererOrigin)
        ? next()
        : res.status(403).json({ message: "Untrusted origin" });
    } catch {
      return res.status(403).json({ message: "Untrusted origin" });
    }
  }

  if (getCookie(req, AUTH_COOKIE_NAME)) {
    return res.status(403).json({ message: "Missing trusted origin" });
  }

  next();
}

app.use("/api", requireTrustedOrigin);

function decodeUserIfAny(req) {
  try {
    const token = getAuthToken(req);
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || "user",
    };
  } catch (err) {
    console.warn("JWT decode failed:", err.message);
    return null;
  }
}

// increase default size limits for text fields
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Dedicated uploaders for each feature
const uploadProfile = makeUploader("ravidassia_profile_dp");
const uploadMatrimonial = makeUploader("ravidassia_matrimonials");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ravidassia_matrimonials",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
// ---- ENV ----
const {
  PORT = 5000,
  PGHOST,
  PGPORT = 5432,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  JWT_SECRET,
  SMTP_USER,
  SMTP_PASS,
  ADMIN_NOTIFY_TO,
} = process.env;

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not set in environment variables. Exiting.");
  process.exit(1);
}

// ---- DB POOL ----
const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

// ---- EMAIL TRANSPORTER ----
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App password
  },
});


// ---- DB INIT ----
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scst_submissions (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL,
      country VARCHAR(100) NOT NULL,
      state VARCHAR(100),
      city VARCHAR(100),
      phone VARCHAR(50),
      platform VARCHAR(20) DEFAULT 'WhatsApp',
      instagram VARCHAR(100),
      proof VARCHAR(255),
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matrimonial_submissions (
      id BIGSERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(120),
      gender VARCHAR(20),
      age INT,
      dob DATE,
      height VARCHAR(20),
      marital_status VARCHAR(50),
      phone VARCHAR(50),
      email VARCHAR(255),
      instagram VARCHAR(100),
      country_living VARCHAR(100),
      state_living VARCHAR(100),
      city_living VARCHAR(100),
      origin_state VARCHAR(100),
      origin_district VARCHAR(100),
      current_status VARCHAR(100),
      education VARCHAR(150),
      occupation VARCHAR(150),
      company_or_institution VARCHAR(150),
      income_range VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matrimonial_interests (
      id BIGSERIAL PRIMARY KEY,
      sender_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      sender_profile_id BIGINT REFERENCES matrimonial_submissions(id) ON DELETE SET NULL,
      receiver_profile_id BIGINT REFERENCES matrimonial_submissions(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matrimonial_contact_requests (
      id BIGSERIAL PRIMARY KEY,
      interest_id BIGINT REFERENCES matrimonial_interests(id) ON DELETE CASCADE,
      requester_user_id INT REFERENCES users(id) ON DELETE CASCADE,
      owner_profile_id BIGINT REFERENCES matrimonial_submissions(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipients (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS content_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    content_url TEXT NOT NULL,
    request_type VARCHAR(20) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

  // ---- BLOG TABLES ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      parent_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
      description TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      excerpt TEXT,
      image_url TEXT,
      category_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
      author_id INT REFERENCES users(id) ON DELETE SET NULL,
      tags TEXT[],
      status TEXT DEFAULT 'published',
      views INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_comments (
      id SERIAL PRIMARY KEY,
      post_id INT REFERENCES blog_posts(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT,
      email TEXT,
      comment_text TEXT NOT NULL,
      is_approved BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS static_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id SERIAL PRIMARY KEY,
      article_id INT REFERENCES static_articles(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      parent_id INT REFERENCES article_comments(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      comment_text TEXT NOT NULL,
      is_approved BOOLEAN DEFAULT TRUE,
      deleted_by_user BOOLEAN DEFAULT FALSE,
      consent_given BOOLEAN DEFAULT FALSE,
      consent_version TEXT,
      consent_given_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_menus (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      path TEXT NOT NULL,
      parent_id INT REFERENCES site_menus(id) ON DELETE SET NULL,
      position INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS famous_personalities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      caste TEXT,
      category TEXT,
      region TEXT,
      sc_st_type TEXT,
      short_bio TEXT,
      full_bio TEXT,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS privacy_requests (
      id SERIAL PRIMARY KEY,
      request_type VARCHAR(40) NOT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      message TEXT,
      status VARCHAR(30) DEFAULT 'open',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP,
      resolved_by INT REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      admin_user_id INT REFERENCES users(id) ON DELETE SET NULL,
      admin_email TEXT,
      admin_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details JSONB,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS global_temples (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      location_label TEXT,
      address TEXT,
      description TEXT,
      image_url TEXT,
      gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
      maps_url TEXT,
      website_url TEXT,
      established_year INT,
      contact_info TEXT,
      seva_info TEXT,
      featured BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_types (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_variants (
      id SERIAL PRIMARY KEY,
      exam_type_id INT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
      slug VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (exam_type_id, slug)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_sections (
      id SERIAL PRIMARY KEY,
      exam_type_id INT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
      slug VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (exam_type_id, slug)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_tests (
      id SERIAL PRIMARY KEY,
      exam_type_id INT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
      exam_variant_id INT REFERENCES exam_variants(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      mode VARCHAR(40) DEFAULT 'full_mock',
      difficulty VARCHAR(40) DEFAULT 'standard',
      duration_seconds INT DEFAULT 0,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_test_parts (
      id SERIAL PRIMARY KEY,
      exam_test_id INT NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
      exam_section_id INT NOT NULL REFERENCES exam_sections(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      instructions TEXT,
      display_order INT DEFAULT 0,
      duration_seconds INT DEFAULT 0,
      config_json JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_questions (
      id SERIAL PRIMARY KEY,
      exam_test_part_id INT NOT NULL REFERENCES exam_test_parts(id) ON DELETE CASCADE,
      question_type VARCHAR(50) NOT NULL,
      prompt TEXT NOT NULL,
      passage_text TEXT,
      audio_url TEXT,
      image_url TEXT,
      metadata_json JSONB DEFAULT '{}'::JSONB,
      explanation_text TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_question_options (
      id SERIAL PRIMARY KEY,
      exam_question_id INT NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
      option_key VARCHAR(20) NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN,
      display_order INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id BIGSERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_test_id INT NOT NULL REFERENCES exam_tests(id) ON DELETE CASCADE,
      status VARCHAR(30) DEFAULT 'not_started',
      started_at TIMESTAMP,
      submitted_at TIMESTAMP,
      completed_at TIMESTAMP,
      total_score NUMERIC(8,2),
      result_json JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_attempt_answers (
      id BIGSERIAL PRIMARY KEY,
      exam_attempt_id BIGINT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
      exam_question_id INT NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
      answer_text TEXT,
      answer_option_key VARCHAR(20),
      answer_json JSONB,
      audio_response_url TEXT,
      is_correct BOOLEAN,
      score NUMERIC(8,2),
      feedback TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (exam_attempt_id, exam_question_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_attempt_section_states (
      id BIGSERIAL PRIMARY KEY,
      exam_attempt_id BIGINT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
      exam_section_id INT NOT NULL REFERENCES exam_sections(id) ON DELETE CASCADE,
      started_at TIMESTAMP,
      ended_at TIMESTAMP,
      time_spent_seconds INT DEFAULT 0,
      state_json JSONB DEFAULT '{}'::JSONB,
      UNIQUE (exam_attempt_id, exam_section_id)
    );
  `);

  const schemaPatches = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS policy_ack_version TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS policy_ack_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS consent_version TEXT`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP`,
    `ALTER TABLE scst_submissions ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS annual_income VARCHAR(100)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS father_name VARCHAR(150)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(150)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(150)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS siblings INT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS family_type VARCHAR(100)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS religion VARCHAR(100)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS caste VARCHAR(100)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS partner_expectations TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS partner_age_range VARCHAR(50)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS partner_country VARCHAR(100)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS partner_marital_status VARCHAR(50)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS privacy_accepted VARCHAR(20)`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS photo_url TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS religion_beliefs TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS about_me TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'pending'`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS moderation_notes TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS reviewed_by INT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS is_public_listing BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS contact_visibility VARCHAR(30) DEFAULT 'on_request'`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS photo_visibility VARCHAR(30) DEFAULT 'hidden'`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS show_profile_to VARCHAR(30) DEFAULT 'everyone'`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS want_to_see VARCHAR(30) DEFAULT 'everyone'`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS consent_version TEXT`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP`,
    `ALTER TABLE matrimonial_submissions ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE content_requests ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'open'`,
    `ALTER TABLE content_requests ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE content_requests ADD COLUMN IF NOT EXISTS consent_version TEXT`,
    `ALTER TABLE content_requests ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP`,
    `ALTER TABLE content_requests ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES blog_comments(id) ON DELETE CASCADE`,
    `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS consent_version TEXT`,
    `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP`,
    `ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS consent_version TEXT`,
    `ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP`,
  ];

  for (const query of schemaPatches) {
    await pool.query(query);
  }

  const templeCountResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM global_temples"
  );

  if (templeCountResult.rows[0]?.count === 0) {
    await pool.query(
      `
        INSERT INTO global_temples
          (name, country, city, location_label, address, description, image_url, gallery_urls, maps_url, website_url, established_year, contact_info, seva_info, featured, display_order)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15),
          ($16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30),
          ($31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45),
          ($46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60)
      `,
      [
        "Shri Guru Ravidass Sabha Temple",
        "Canada",
        "Brampton",
        "Ontario, Canada",
        "Near central Brampton community corridor",
        "A vibrant sangat space for weekly satsang, youth gatherings, and community seva with a strong Punjabi Ravidassia presence.",
        "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=1200&q=80",
        [
          "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1524499982521-1ffd58dd89ea?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1509099863731-ef4bff19e808?auto=format&fit=crop&w=1200&q=80",
        ],
        "https://maps.google.com/?q=Brampton+Ontario+Guru+Ravidass+Temple",
        "",
        2004,
        "Community desk available for sangat and event inquiries.",
        "Hosts langar seva, Gurpurab celebrations, and cultural programmes.",
        true,
        1,
        "Guru Ravidass Temple Southall",
        "United Kingdom",
        "London",
        "Southall, London",
        "Southall Broadway community zone",
        "A long-standing temple and cultural anchor for Ravidassia families in the UK, known for large gatherings and well-organized community events.",
        "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80",
        [
          "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        ],
        "https://maps.google.com/?q=Southall+Guru+Ravidass+Temple",
        "",
        1998,
        "Weekend sangat support and event coordination available.",
        "Special focus on youth engagement, keertan, and heritage events.",
        true,
        2,
        "Guru Ravidass Gurughar",
        "United States",
        "New York",
        "Queens, New York",
        "Queens community district",
        "A growing sangat center serving families across New York with prayer services, cultural education, and support for new immigrants.",
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=80",
        [
          "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        ],
        "https://maps.google.com/?q=Queens+New+York+Guru+Ravidass+Temple",
        "",
        2010,
        "Reachable through the temple office for visits and events.",
        "Supports sangat meetups, spiritual learning, and festive celebrations.",
        false,
        3,
        "Shri Guru Ravidass Mandir",
        "India",
        "Jalandhar",
        "Punjab, India",
        "Doaba region",
        "A heritage-rooted temple space connected with deep Ravidassia devotion, sangat gatherings, and festival observances across Punjab.",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
        [
          "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
        ],
        "https://maps.google.com/?q=Jalandhar+Punjab+Guru+Ravidass+Mandir",
        "",
        1987,
        "Temple office open during daily prayer and major programmes.",
        "Known for spiritual gatherings, kirtan, and Gurpurab events.",
        true,
        4,
      ]
    );
  }

  await pool.query(
    `
      INSERT INTO exam_types (slug, name, description, is_active)
      VALUES
        ('celpip', 'CELPIP', 'Canadian English practice hub with listening, reading, writing, and speaking.', TRUE),
        ('ielts', 'IELTS', 'Scaffolded IELTS architecture for future Academic and General training practice.', TRUE),
        ('pte', 'PTE', 'Scaffolded PTE architecture for future Academic and Core practice.', TRUE)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active
    `
  );

  const examTypeRows = await pool.query("SELECT id, slug FROM exam_types");
  const examTypeMap = Object.fromEntries(examTypeRows.rows.map((row) => [row.slug, row.id]));

  await pool.query(
    `
      INSERT INTO exam_variants (exam_type_id, slug, name, description, is_active)
      VALUES
        ($1, 'general', 'CELPIP General', 'Full four-skill route for Canadian study, work, and immigration prep.', TRUE),
        ($1, 'general-ls', 'CELPIP General LS', 'Listening and speaking focused pathway scaffolded for later.', TRUE),
        ($2, 'academic', 'IELTS Academic', 'Academic study pathway scaffold.', TRUE),
        ($2, 'general', 'IELTS General Training', 'Migration and work pathway scaffold.', TRUE),
        ($3, 'academic', 'PTE Academic', 'Primary PTE study-abroad pathway scaffold.', TRUE),
        ($3, 'core', 'PTE Core', 'Immigration-oriented PTE pathway scaffold.', TRUE)
      ON CONFLICT (exam_type_id, slug) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active
    `,
    [examTypeMap.celpip, examTypeMap.ielts, examTypeMap.pte]
  );

  await pool.query(
    `
      INSERT INTO exam_sections (exam_type_id, slug, name, display_order)
      VALUES
        ($1, 'listening', 'Listening', 1),
        ($1, 'reading', 'Reading', 2),
        ($1, 'writing', 'Writing', 3),
        ($1, 'speaking', 'Speaking', 4),
        ($2, 'listening', 'Listening', 1),
        ($2, 'reading', 'Reading', 2),
        ($2, 'writing', 'Writing', 3),
        ($2, 'speaking', 'Speaking', 4),
        ($3, 'speaking-writing', 'Speaking & Writing', 1),
        ($3, 'reading', 'Reading', 2),
        ($3, 'listening', 'Listening', 3)
      ON CONFLICT (exam_type_id, slug) DO UPDATE
      SET name = EXCLUDED.name, display_order = EXCLUDED.display_order
    `,
    [examTypeMap.celpip, examTypeMap.ielts, examTypeMap.pte]
  );

  const celpipVariantRows = await pool.query(
    "SELECT id, slug FROM exam_variants WHERE exam_type_id = $1",
    [examTypeMap.celpip]
  );
  const celpipVariantMap = Object.fromEntries(celpipVariantRows.rows.map((row) => [row.slug, row.id]));
  const celpipSectionRows = await pool.query(
    "SELECT id, slug FROM exam_sections WHERE exam_type_id = $1",
    [examTypeMap.celpip]
  );
  const celpipSectionMap = Object.fromEntries(celpipSectionRows.rows.map((row) => [row.slug, row.id]));

  const existingCelpipTest = await pool.query(
    "SELECT id FROM exam_tests WHERE exam_type_id = $1 AND title = $2 LIMIT 1",
    [examTypeMap.celpip, "CELPIP Starter Mock 01"]
  );

  if (!existingCelpipTest.rows.length) {
    const testInsert = await pool.query(
      `
        INSERT INTO exam_tests
          (exam_type_id, exam_variant_id, title, description, mode, difficulty, duration_seconds, is_published, updated_at)
        VALUES
          ($1, $2, $3, $4, 'full_mock', 'foundation', 4500, TRUE, NOW())
        RETURNING id
      `,
      [
        examTypeMap.celpip,
        celpipVariantMap.general,
        "CELPIP Starter Mock 01",
        "Original starter mock with objective listening/reading and placeholder writing/speaking tasks to prove the full practice flow.",
      ]
    );
    const testId = testInsert.rows[0].id;

    const parts = [
      {
        sectionSlug: "listening",
        title: "Listening Part 1",
        instructions:
          "Practice mode: audio replay rules can differ from the official exam. Read the prompt carefully and choose the best answer.",
        duration: 900,
        config: {
          mode: "practice",
          max_play_count: 2,
          allow_pause: true,
          allow_seek: false,
          show_replay_note: true,
          show_real_test_note: true,
        },
        questions: [
          {
            type: "single_select",
            prompt: "A student asks for the most direct way to reach the admissions office. Which response best solves the problem?",
            passage:
              "Reception note: The admissions office moved to the second floor. Take the elevator, turn right, and the first glass room is the correct office.",
            explanation:
              "The best answer identifies the second floor and right turn based on the receptionist note.",
            options: [
              ["a", "Go to the first floor and wait near the library desk.", false],
              ["b", "Take the elevator to the second floor and turn right.", true],
              ["c", "Use the back entrance near the cafeteria.", false],
              ["d", "Ask the finance office for a campus map.", false],
            ],
          },
          {
            type: "single_select",
            prompt: "Why did the speaker recommend arriving early for the workshop?",
            passage:
              "Workshop reminder: Seats are limited, check-in takes time, and a short orientation starts before the main session.",
            explanation:
              "The speaker mentions limited seats and orientation before the main session, so arriving early helps the learner settle in before the start.",
            options: [
              ["a", "To meet the instructor privately after class.", false],
              ["b", "To avoid the weather forecast later in the day.", false],
              ["c", "To finish check-in and attend the orientation segment.", true],
              ["d", "To receive a discount on the workshop fee.", false],
            ],
          },
        ],
      },
      {
        sectionSlug: "reading",
        title: "Reading Part 1",
        instructions:
          "Read the passage and answer the questions. Practice mode supports review after submission for objective items.",
        duration: 1200,
        config: { mode: "practice" },
        questions: [
          {
            type: "single_select",
            prompt: "What is the main purpose of the student support desk described below?",
            passage:
              "The support desk helps new students understand housing choices, transit options, and how to prepare documents for campus registration.",
            explanation:
              "The passage focuses on guidance and preparation for settling in, not on grades or tuition collection.",
            options: [
              ["a", "To assign final course grades", false],
              ["b", "To guide students through settling-in tasks", true],
              ["c", "To arrange airport security screening", false],
              ["d", "To provide official immigration decisions", false],
            ],
          },
          {
            type: "multi_select",
            prompt: "Which two topics are explicitly covered by the support desk?",
            passage:
              "The support desk helps new students understand housing choices, transit options, and how to prepare documents for campus registration.",
            explanation:
              "Housing choices and transit options are clearly mentioned. The desk does not handle scholarship interviews or final visa approval.",
            options: [
              ["a", "Housing choices", true],
              ["b", "Transit options", true],
              ["c", "Scholarship interview coaching", false],
              ["d", "Final visa approval", false],
            ],
          },
        ],
      },
      {
        sectionSlug: "writing",
        title: "Writing Task",
        instructions:
          "Write a concise response with clear structure. This sample is stored for future evaluation and feedback.",
        duration: 1200,
        config: { mode: "practice", expected_word_range: [150, 220] },
        questions: [
          {
            type: "written_response",
            prompt: "Write an email to a college advisor asking for help balancing a part-time job with your study schedule.",
          },
        ],
      },
      {
        sectionSlug: "speaking",
        title: "Speaking Task",
        instructions:
          "Practice mode allows transcript-style saving until browser recording is fully enabled.",
        duration: 1200,
        config: { prep_seconds: 30, response_seconds: 90 },
        questions: [
          {
            type: "spoken_response",
            prompt: "Describe a challenge you faced while preparing to study abroad and explain how you handled it.",
          },
        ],
      },
    ];

    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const part = parts[partIndex];
      const partInsert = await pool.query(
        `
          INSERT INTO exam_test_parts
            (exam_test_id, exam_section_id, title, instructions, display_order, duration_seconds, config_json)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7::jsonb)
          RETURNING id
        `,
        [
          testId,
          celpipSectionMap[part.sectionSlug],
          part.title,
          part.instructions,
          partIndex + 1,
          part.duration,
          JSON.stringify(part.config || {}),
        ]
      );

      const partId = partInsert.rows[0].id;

      for (let questionIndex = 0; questionIndex < part.questions.length; questionIndex += 1) {
        const question = part.questions[questionIndex];
        const questionInsert = await pool.query(
          `
            INSERT INTO exam_questions
              (exam_test_part_id, question_type, prompt, passage_text, metadata_json, explanation_text, display_order)
            VALUES
              ($1, $2, $3, $4, $5::jsonb, $6, $7)
            RETURNING id
          `,
          [
            partId,
            question.type,
            question.prompt,
            question.passage || null,
            JSON.stringify({ sample: true }),
            question.explanation || null,
            questionIndex + 1,
          ]
        );

        const questionId = questionInsert.rows[0].id;
        if (Array.isArray(question.options)) {
          for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
            const [optionKey, optionText, isCorrect] = question.options[optionIndex];
            await pool.query(
              `
                INSERT INTO exam_question_options
                  (exam_question_id, option_key, option_text, is_correct, display_order)
                VALUES
                  ($1, $2, $3, $4, $5)
              `,
              [questionId, optionKey, optionText, isCorrect, optionIndex + 1]
            );
          }
        }
      }
    }
  }

  const providedCelpipPracticeTest = await pool.query(
    "SELECT id FROM exam_tests WHERE exam_type_id = $1 AND title = $2 LIMIT 1",
    [examTypeMap.celpip, "CELPIP Practice Test 01"]
  );

  if (!providedCelpipPracticeTest.rows.length) {
    const testInsert = await pool.query(
      `
        INSERT INTO exam_tests
          (exam_type_id, exam_variant_id, title, description, mode, difficulty, duration_seconds, is_published, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
        RETURNING id
      `,
      [
        examTypeMap.celpip,
        celpipVariantMap.general,
        "CELPIP Practice Test 01",
        "Original CELPIP-style practice test for independent preparation.",
        "full_mock",
        "foundation",
        4500,
      ]
    );
    const testId = testInsert.rows[0].id;

    const parts = [
      {
        sectionSlug: "listening",
        title: "Listening Part 1",
        instructions:
          "Listen to the conversation and answer the questions. You may replay the audio in practice mode. Choose the best answer for each question.",
        duration: 900,
        config: {
          mode: "practice",
          max_play_count: 2,
          allow_pause: true,
          allow_seek: false,
          show_replay_note: true,
          show_real_test_note: true,
          audio_url: null,
        },
        questions: [
          {
            type: "single_select",
            prompt: "What is the main purpose of the conversation?",
            passage:
              "A student is speaking with a college advisor about switching from a full-time course load to part-time due to work commitments.",
            explanation:
              "The conversation focuses on adjusting the student's course load, which indicates the main purpose.",
            options: [
              ["a", "To apply for a new program", false],
              ["b", "To change course load status", true],
              ["c", "To discuss exam results", false],
              ["d", "To request financial aid", false],
            ],
          },
          {
            type: "single_select",
            prompt: "Why does the student want to reduce their course load?",
            passage:
              "The student explains they recently started a part-time job and are finding it difficult to manage both work and studies.",
            explanation:
              "The correct answer reflects the student's difficulty balancing work and studies.",
            options: [
              ["a", "They want to travel", false],
              ["b", "They are struggling with work-life balance", true],
              ["c", "They dislike their courses", false],
              ["d", "They are changing schools", false],
            ],
          },
          {
            type: "single_select",
            prompt: "What advice does the advisor give?",
            passage:
              "The advisor suggests checking visa conditions before reducing the course load, as it may affect the student's study permit.",
            explanation:
              "The advisor emphasizes checking visa rules, which is the key advice.",
            options: [
              ["a", "Drop all courses immediately", false],
              ["b", "Ignore work commitments", false],
              ["c", "Verify study permit requirements first", true],
              ["d", "Switch colleges", false],
            ],
          },
          {
            type: "single_select",
            prompt: "What will the student most likely do next?",
            passage:
              "The student agrees to review their visa conditions and then return to the advisor with a decision.",
            explanation:
              "The student plans to check visa conditions before making a decision.",
            options: [
              ["a", "Quit their job", false],
              ["b", "Drop out of school", false],
              ["c", "Review visa requirements", true],
              ["d", "Transfer programs immediately", false],
            ],
          },
        ],
      },
      {
        sectionSlug: "reading",
        title: "Reading Part 1",
        instructions:
          "Read the passage and answer the questions. Choose the best answer or answers as instructed.",
        duration: 1200,
        config: {
          mode: "practice",
        },
        questions: [
          {
            type: "single_select",
            prompt: "What is the main idea of the passage?",
            passage:
              "Many international students choose to work part-time while studying abroad. This allows them to gain practical experience, support their finances, and improve language skills. However, balancing work and academic responsibilities can be challenging, and students must manage their time carefully to succeed.",
            explanation:
              "The passage discusses both benefits and challenges of working while studying.",
            options: [
              ["a", "Students should avoid working abroad", false],
              ["b", "Working while studying has both advantages and challenges", true],
              ["c", "All students must work part-time", false],
              ["d", "Academic work is not important", false],
            ],
          },
          {
            type: "multi_select",
            prompt: "Select TWO benefits mentioned in the passage.",
            passage:
              "Many international students choose to work part-time while studying abroad. This allows them to gain practical experience, support their finances, and improve language skills.",
            explanation:
              "The passage lists practical experience, financial support, and language improvement as benefits.",
            options: [
              ["a", "Gain practical experience", true],
              ["b", "Support finances", true],
              ["c", "Reduce study time", false],
              ["d", "Avoid classes", false],
            ],
          },
          {
            type: "single_select",
            prompt: "What challenge is mentioned?",
            passage:
              "However, balancing work and academic responsibilities can be challenging.",
            explanation:
              "The passage clearly states that balancing responsibilities is difficult.",
            options: [
              ["a", "Finding accommodation", false],
              ["b", "Balancing work and study", true],
              ["c", "Learning new languages", false],
              ["d", "Meeting new people", false],
            ],
          },
          {
            type: "single_select",
            prompt: "What is the suggested solution to succeed?",
            passage:
              "Students must manage their time carefully to succeed.",
            explanation:
              "The passage directly suggests time management as the solution.",
            options: [
              ["a", "Work more hours", false],
              ["b", "Avoid studying", false],
              ["c", "Manage time effectively", true],
              ["d", "Take fewer breaks", false],
            ],
          },
        ],
      },
      {
        sectionSlug: "writing",
        title: "Writing Task",
        instructions:
          "Write a response to the task below. Aim for clear organization, appropriate tone, and correct grammar.",
        duration: 1200,
        config: {
          mode: "practice",
          expected_word_range: [150, 220],
        },
        questions: [
          {
            type: "written_response",
            prompt:
              "You recently moved to a new city for study or work. Write an email to a friend describing your experience so far. Include details about your new environment, challenges you faced, and what you enjoy most.",
          },
        ],
      },
      {
        sectionSlug: "speaking",
        title: "Speaking Task",
        instructions:
          "Speak clearly and organize your ideas. You will have time to prepare and then respond.",
        duration: 1200,
        config: {
          prep_seconds: 30,
          response_seconds: 90,
        },
        questions: [
          {
            type: "spoken_response",
            prompt:
              "Describe a skill you would like to learn in the future. Explain why it is important to you and how it could benefit your personal or professional life.",
          },
        ],
      },
    ];

    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const part = parts[partIndex];
      const partInsert = await pool.query(
        `
          INSERT INTO exam_test_parts
            (exam_test_id, exam_section_id, title, instructions, display_order, duration_seconds, config_json)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7::jsonb)
          RETURNING id
        `,
        [
          testId,
          celpipSectionMap[part.sectionSlug],
          part.title,
          part.instructions,
          partIndex + 1,
          part.duration,
          JSON.stringify(part.config || {}),
        ]
      );

      const partId = partInsert.rows[0].id;

      for (let questionIndex = 0; questionIndex < part.questions.length; questionIndex += 1) {
        const question = part.questions[questionIndex];
        const questionInsert = await pool.query(
          `
            INSERT INTO exam_questions
              (exam_test_part_id, question_type, prompt, passage_text, metadata_json, explanation_text, display_order)
            VALUES
              ($1, $2, $3, $4, $5::jsonb, $6, $7)
            RETURNING id
          `,
          [
            partId,
            question.type,
            question.prompt,
            question.passage || null,
            JSON.stringify({ sample: true, source: "user_provided_json" }),
            question.explanation || null,
            questionIndex + 1,
          ]
        );

        const questionId = questionInsert.rows[0].id;
        if (Array.isArray(question.options)) {
          for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
            const [optionKey, optionText, isCorrect] = question.options[optionIndex];
            await pool.query(
              `
                INSERT INTO exam_question_options
                  (exam_question_id, option_key, option_text, is_correct, display_order)
                VALUES
                  ($1, $2, $3, $4, $5)
              `,
              [questionId, optionKey, optionText, isCorrect, optionIndex + 1]
            );
          }
        }
      }
    }
  }

  const listeningBlueprints = [
    {
      title: "Course Load Change",
      conversation:
        "A student speaks with a college advisor about moving from full-time study to part-time because of a new part-time job.",
      purpose: "To change course load status",
      reason: "They are struggling to balance work and study",
      advice: "Check study permit rules before changing the schedule",
      nextStep: "Review visa requirements and return with a decision",
    },
    {
      title: "Apartment Viewing",
      conversation:
        "A newcomer calls a landlord to ask about a basement apartment near public transit and grocery stores.",
      purpose: "To ask about a rental apartment",
      reason: "They want housing close to transit and daily services",
      advice: "Bring proof of income and references to the viewing",
      nextStep: "Attend the viewing this weekend",
    },
    {
      title: "Library Membership",
      conversation:
        "A student talks to a library worker about getting a membership card and borrowing study materials.",
      purpose: "To register for library services",
      reason: "They need access to books and quiet study areas",
      advice: "Bring identification and proof of address",
      nextStep: "Complete the application form at the desk",
    },
    {
      title: "Driving Lesson Booking",
      conversation:
        "A newcomer contacts a driving school to arrange beginner lessons before taking a road test.",
      purpose: "To book driving lessons",
      reason: "They want to prepare for a road test",
      advice: "Start with an assessment lesson first",
      nextStep: "Confirm an assessment slot for next Tuesday",
    },
    {
      title: "Volunteer Orientation",
      conversation:
        "A volunteer coordinator explains orientation details to a student who wants local experience and community involvement.",
      purpose: "To confirm volunteer orientation details",
      reason: "They want Canadian experience and community involvement",
      advice: "Wear comfortable clothes and arrive early",
      nextStep: "Join the orientation session on Friday morning",
    },
    {
      title: "Internet Setup",
      conversation:
        "A tenant calls an internet company to choose a plan and set up service for a new apartment.",
      purpose: "To set up home internet service",
      reason: "They just moved into a new apartment",
      advice: "Compare speeds before selecting the final package",
      nextStep: "Book an installation appointment",
    },
    {
      title: "Campus Career Fair",
      conversation:
        "A student asks the career centre how to prepare for an upcoming employer networking event on campus.",
      purpose: "To prepare for a career fair",
      reason: "They want to speak confidently with employers",
      advice: "Bring a resume and practice a short introduction",
      nextStep: "Update the resume before the event",
    },
    {
      title: "Medical Appointment",
      conversation:
        "A clinic receptionist helps a student schedule a non-urgent appointment and explains what to bring.",
      purpose: "To schedule a clinic appointment",
      reason: "They need to discuss a health concern with a doctor",
      advice: "Bring a health card and list of symptoms",
      nextStep: "Arrive fifteen minutes early for check-in",
    },
    {
      title: "Gym Membership",
      conversation:
        "A resident asks a fitness centre representative about membership options, class access, and cancellation rules.",
      purpose: "To ask about a gym membership",
      reason: "They want a place to exercise regularly",
      advice: "Start with a monthly plan before committing long term",
      nextStep: "Try a free tour and choose a plan",
    },
    {
      title: "Airport Pickup",
      conversation:
        "An international student confirms arrival details with a community volunteer offering airport pickup assistance.",
      purpose: "To confirm airport pickup arrangements",
      reason: "They are arriving in a new city for the first time",
      advice: "Message when luggage is collected and ready",
      nextStep: "Send a text after leaving baggage claim",
    },
  ];

  const readingBlueprints = [
    {
      title: "Working While Studying",
      passage:
        "Many international students choose to work part-time while studying abroad. This allows them to gain practical experience, support their finances, and improve language skills. However, balancing work and academic responsibilities can be challenging, and students must manage their time carefully to succeed.",
      mainIdea: "Working while studying has both advantages and challenges",
      benefit1: "Gain practical experience",
      benefit2: "Support finances",
      challenge: "Balancing work and study",
      solution: "Manage time effectively",
    },
    {
      title: "Using Public Transit",
      passage:
        "Public transit helps newcomers travel affordably, reduce commuting stress, and reach schools or workplaces on time. Still, routes may feel confusing at first, so learning the map and checking schedules in advance can make daily travel easier.",
      mainIdea: "Public transit is useful but requires some planning",
      benefit1: "Travel affordably",
      benefit2: "Reach school or work on time",
      challenge: "Routes can feel confusing at first",
      solution: "Learn the map and check schedules in advance",
    },
    {
      title: "Joining a Study Group",
      passage:
        "Study groups can help learners review difficult topics, stay motivated, and hear different perspectives. At the same time, groups work best when members stay organized, divide tasks fairly, and keep meetings focused on the course goals.",
      mainIdea: "Study groups are helpful when they are organized well",
      benefit1: "Review difficult topics",
      benefit2: "Stay motivated",
      challenge: "Meetings can lose focus",
      solution: "Divide tasks fairly and stay organized",
    },
    {
      title: "Part-Time Volunteering",
      passage:
        "Volunteering gives students local experience, new contacts, and confidence in communication. However, students should choose commitments carefully so volunteer hours do not interfere with deadlines or essential coursework.",
      mainIdea: "Volunteering is valuable if students balance it carefully",
      benefit1: "Gain local experience",
      benefit2: "Build communication confidence",
      challenge: "Volunteer hours may interfere with deadlines",
      solution: "Choose commitments carefully",
    },
    {
      title: "Cooking at Home",
      passage:
        "Preparing meals at home can save money, support healthier eating, and help students feel more settled in a new city. The difficulty is that shopping, planning, and cooking all take time, so simple weekly meal planning is often the best solution.",
      mainIdea: "Cooking at home offers benefits but needs planning",
      benefit1: "Save money",
      benefit2: "Support healthier eating",
      challenge: "Shopping and cooking take time",
      solution: "Use simple weekly meal planning",
    },
    {
      title: "Career Centre Services",
      passage:
        "Career centres often provide resume reviews, interview practice, and employer networking events. These services can improve job readiness, but students benefit most when they start early rather than waiting until the last minute.",
      mainIdea: "Career centres are most effective when used early",
      benefit1: "Resume reviews",
      benefit2: "Interview practice",
      challenge: "Waiting too long reduces the benefit",
      solution: "Start using services early",
    },
    {
      title: "Building Language Confidence",
      passage:
        "Language confidence grows when learners speak regularly, listen actively, and accept small mistakes as part of improvement. Even so, fear of embarrassment can slow progress, which is why steady daily practice matters more than perfection.",
      mainIdea: "Language confidence improves through regular practice",
      benefit1: "Speak more comfortably",
      benefit2: "Improve through active listening",
      challenge: "Fear of embarrassment",
      solution: "Practice daily instead of chasing perfection",
    },
    {
      title: "Campus Housing",
      passage:
        "Campus housing can reduce commute time, create social connections, and simplify access to classes. On the other hand, space may be limited and rules can feel strict, so students should compare convenience with personal preference before deciding.",
      mainIdea: "Campus housing offers convenience but may not suit everyone",
      benefit1: "Reduce commute time",
      benefit2: "Create social connections",
      challenge: "Limited space and strict rules",
      solution: "Compare convenience with personal preference",
    },
    {
      title: "Time Management Apps",
      passage:
        "Digital planning tools can help learners organize deadlines, track priorities, and set reminders for important tasks. Still, no app works well without consistent habits, so students must review and update their plans regularly.",
      mainIdea: "Planning apps help only when paired with consistent habits",
      benefit1: "Organize deadlines",
      benefit2: "Track priorities",
      challenge: "Tools fail without consistent habits",
      solution: "Review and update plans regularly",
    },
    {
      title: "Community Events",
      passage:
        "Community events help newcomers meet people, learn local customs, and feel less isolated. Yet attending too many activities can become tiring, so choosing a few meaningful events usually leads to better balance and stronger connections.",
      mainIdea: "Community events are helpful when chosen thoughtfully",
      benefit1: "Meet new people",
      benefit2: "Feel less isolated",
      challenge: "Too many events can become tiring",
      solution: "Choose a few meaningful events",
    },
  ];

  const writingPrompts = [
    "Write an email to your class instructor explaining why you need an extension for an assignment and describe the steps you will take to finish it responsibly.",
    "Write to a friend about your first month in a new city. Describe what has surprised you, what has been difficult, and what is getting easier.",
    "Your building management plans to change laundry room hours. Write a message sharing your opinion and suggesting a practical alternative.",
    "Write an email to a college advisor asking for guidance on balancing part-time work, study time, and personal wellbeing.",
    "Your local library is collecting feedback from students. Write a response explaining what services are most useful and what should be improved.",
    "Write to a roommate about a shared-apartment problem and propose a respectful solution that works for both of you.",
    "Write an email thanking a volunteer coordinator for an opportunity and explain what you learned from the experience.",
    "Your workplace changed your schedule unexpectedly. Write a professional message requesting a revised schedule that better fits your classes.",
    "Write to a friend describing a community event you attended and explain why it was meaningful to you.",
    "Write an email to your college career centre asking for help preparing for an upcoming interview.",
  ];

  const speakingPrompts = [
    "Describe a skill you want to improve this year. Explain why it matters to you and how you plan to develop it.",
    "Talk about a place in your city that helps you feel productive or relaxed. Explain what makes it special.",
    "Describe a challenge you faced while adapting to a new environment and explain how you solved it.",
    "Talk about a person who gave you useful advice. Explain what the advice was and why it helped.",
    "Describe a daily habit that makes your life easier. Explain when you started it and why you continue it.",
    "Talk about a future goal you are working toward. Explain why it matters and what steps you are taking.",
    "Describe an event that helped you feel more connected to your community. Explain what happened and why it was important.",
    "Talk about a technology tool you find helpful for study or work. Explain how it supports you.",
    "Describe a decision that improved your routine or wellbeing. Explain what changed afterward.",
    "Talk about a subject you would enjoy teaching someone else. Explain why you would choose it.",
  ];

  const createOptions = (correct, distractors, correctIndex = 1) => {
    const keys = ["a", "b", "c", "d"];
    const ordered = [...distractors.slice(0, 3)];
    ordered.splice(correctIndex, 0, correct);
    return ordered.map((text, index) => [keys[index], text, index === correctIndex]);
  };

  const existingCelpipTitles = new Set(
    (
      await pool.query("SELECT title FROM exam_tests WHERE exam_type_id = $1", [examTypeMap.celpip])
    ).rows.map((row) => row.title)
  );

  async function insertGeneratedPracticeTest(testDefinition) {
    if (existingCelpipTitles.has(testDefinition.title)) {
      return;
    }

    const insertedTest = await pool.query(
      `
        INSERT INTO exam_tests
          (exam_type_id, exam_variant_id, title, description, mode, difficulty, duration_seconds, is_published, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
        RETURNING id
      `,
      [
        examTypeMap.celpip,
        celpipVariantMap.general,
        testDefinition.title,
        testDefinition.description,
        testDefinition.mode,
        testDefinition.difficulty,
        testDefinition.duration,
      ]
    );

    const testId = insertedTest.rows[0].id;
    for (let partIndex = 0; partIndex < testDefinition.parts.length; partIndex += 1) {
      const part = testDefinition.parts[partIndex];
      const insertedPart = await pool.query(
        `
          INSERT INTO exam_test_parts
            (exam_test_id, exam_section_id, title, instructions, display_order, duration_seconds, config_json)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7::jsonb)
          RETURNING id
        `,
        [
          testId,
          celpipSectionMap[part.sectionSlug],
          part.title,
          part.instructions,
          partIndex + 1,
          part.duration,
          JSON.stringify(part.config || {}),
        ]
      );

      const partId = insertedPart.rows[0].id;
      for (let questionIndex = 0; questionIndex < part.questions.length; questionIndex += 1) {
        const question = part.questions[questionIndex];
        const insertedQuestion = await pool.query(
          `
            INSERT INTO exam_questions
              (exam_test_part_id, question_type, prompt, passage_text, metadata_json, explanation_text, display_order)
            VALUES
              ($1, $2, $3, $4, $5::jsonb, $6, $7)
            RETURNING id
          `,
          [
            partId,
            question.type,
            question.prompt,
            question.passage || null,
            JSON.stringify({ sample: true, generated_bank: true }),
            question.explanation || null,
            questionIndex + 1,
          ]
        );

        if (Array.isArray(question.options)) {
          for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
            const [optionKey, optionText, isCorrect] = question.options[optionIndex];
            await pool.query(
              `
                INSERT INTO exam_question_options
                  (exam_question_id, option_key, option_text, is_correct, display_order)
                VALUES
                  ($1, $2, $3, $4, $5)
              `,
              [insertedQuestion.rows[0].id, optionKey, optionText, isCorrect, optionIndex + 1]
            );
          }
        }
      }
    }

    existingCelpipTitles.add(testDefinition.title);
  }

  for (let index = 0; index < listeningBlueprints.length; index += 1) {
    const blueprint = listeningBlueprints[index];
    await insertGeneratedPracticeTest({
      title: `CELPIP Listening Practice ${String(index + 1).padStart(2, "0")}`,
      description: `Original sectional listening practice based on the theme: ${blueprint.title}.`,
      mode: "sectional",
      difficulty: "foundation",
      duration: 900,
      parts: [
        {
          sectionSlug: "listening",
          title: blueprint.title,
          instructions:
            "Listen to the scenario and answer the questions. Practice mode may allow replay, but official test conditions can differ.",
          duration: 900,
          config: {
            mode: "practice",
            max_play_count: 2,
            allow_pause: true,
            allow_seek: false,
            show_replay_note: true,
            show_real_test_note: true,
          },
          questions: [
            {
              type: "single_select",
              prompt: "What is the main purpose of the conversation?",
              passage: blueprint.conversation,
              explanation: "The correct answer matches the main reason the people are speaking.",
              options: createOptions(blueprint.purpose, [
                "To discuss a travel itinerary",
                "To compare unrelated service providers",
                "To complain about a completed transaction",
              ]),
            },
            {
              type: "single_select",
              prompt: "Why is the speaker asking for help?",
              passage: blueprint.conversation,
              explanation: "The correct answer reflects the main challenge or need described in the scenario.",
              options: createOptions(blueprint.reason, [
                "They forgot an important document at home",
                "They want to cancel their plans entirely",
                "They are looking for a personal recommendation only",
              ]),
            },
            {
              type: "single_select",
              prompt: "What advice is given in the conversation?",
              passage: blueprint.conversation,
              explanation: "The best answer summarizes the guidance offered by the other speaker.",
              options: createOptions(blueprint.advice, [
                "Ignore the deadline and wait for another option",
                "Ask a friend to decide instead",
                "Start over from the beginning without checking details",
              ]),
            },
            {
              type: "single_select",
              prompt: "What will most likely happen next?",
              passage: blueprint.conversation,
              explanation: "The final action usually follows the practical next step mentioned in the scenario.",
              options: createOptions(blueprint.nextStep, [
                "The speaker will abandon the plan completely",
                "The speaker will switch to an unrelated goal",
                "The speaker will delay action for several months",
              ]),
            },
          ],
        },
      ],
    });
  }

  for (let index = 0; index < readingBlueprints.length; index += 1) {
    const blueprint = readingBlueprints[index];
    await insertGeneratedPracticeTest({
      title: `CELPIP Reading Practice ${String(index + 1).padStart(2, "0")}`,
      description: `Original sectional reading practice based on the theme: ${blueprint.title}.`,
      mode: "sectional",
      difficulty: "foundation",
      duration: 1200,
      parts: [
        {
          sectionSlug: "reading",
          title: blueprint.title,
          instructions:
            "Read the passage carefully and answer the questions. Choose the best answer or answers as instructed.",
          duration: 1200,
          config: { mode: "practice" },
          questions: [
            {
              type: "single_select",
              prompt: "What is the main idea of the passage?",
              passage: blueprint.passage,
              explanation: "The best answer summarizes the full passage, not just one detail.",
              options: createOptions(blueprint.mainIdea, [
                "The topic should be avoided completely",
                "Only one side of the issue matters",
                "The writer does not suggest any practical approach",
              ]),
            },
            {
              type: "multi_select",
              prompt: "Select TWO benefits mentioned in the passage.",
              passage: blueprint.passage,
              explanation: "The correct answers are the two specific advantages clearly stated in the passage.",
              options: [
                ["a", blueprint.benefit1, true],
                ["b", blueprint.benefit2, true],
                ["c", "Eliminate all personal responsibilities", false],
                ["d", "Guarantee perfect results immediately", false],
              ],
            },
            {
              type: "single_select",
              prompt: "What challenge is mentioned?",
              passage: blueprint.passage,
              explanation: "The challenge is the main difficulty the writer highlights.",
              options: createOptions(blueprint.challenge, [
                "The topic is illegal in most situations",
                "There are no useful resources available",
                "Nobody is interested in improving",
              ]),
            },
            {
              type: "single_select",
              prompt: "What is the suggested solution to succeed?",
              passage: blueprint.passage,
              explanation: "The best answer matches the practical step recommended by the passage.",
              options: createOptions(blueprint.solution, [
                "Give up when progress feels slow",
                "Depend only on luck",
                "Avoid planning or preparation",
              ]),
            },
          ],
        },
      ],
    });
  }

  for (let index = 0; index < writingPrompts.length; index += 1) {
    await insertGeneratedPracticeTest({
      title: `CELPIP Writing Practice ${String(index + 1).padStart(2, "0")}`,
      description: "Original sectional writing practice for structured CELPIP-style preparation.",
      mode: "sectional",
      difficulty: "foundation",
      duration: 1200,
      parts: [
        {
          sectionSlug: "writing",
          title: `Writing Prompt ${index + 1}`,
          instructions:
            "Write a clear, organized response with an appropriate tone, useful detail, and correct grammar.",
          duration: 1200,
          config: {
            mode: "practice",
            expected_word_range: [150, 220],
          },
          questions: [
            {
              type: "written_response",
              prompt: writingPrompts[index],
            },
          ],
        },
      ],
    });
  }

  for (let index = 0; index < speakingPrompts.length; index += 1) {
    await insertGeneratedPracticeTest({
      title: `CELPIP Speaking Practice ${String(index + 1).padStart(2, "0")}`,
      description: "Original sectional speaking practice for structured CELPIP-style preparation.",
      mode: "sectional",
      difficulty: "foundation",
      duration: 1200,
      parts: [
        {
          sectionSlug: "speaking",
          title: `Speaking Prompt ${index + 1}`,
          instructions:
            "Speak clearly, organize your ideas, and use the prep time to plan a short, focused response.",
          duration: 1200,
          config: {
            prep_seconds: 30,
            response_seconds: 90,
          },
          questions: [
            {
              type: "spoken_response",
              prompt: speakingPrompts[index],
            },
          ],
        },
      ],
    });
  }

  console.log("✅ Database initialized");
}

// ---- HTML ESCAPE HELPER (for safe email templates) ----
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SEARCHABLE_STATIC_PAGES = [
  {
    type: "page",
    title: "Home",
    path: "/",
    summary: "Main landing page with featured content and quick links.",
    meta: "Page",
    keywords: ["home", "landing", "community"],
  },
  {
    type: "page",
    title: "About",
    path: "/about",
    summary: "Learn about Ravidassia Abroad and the community mission.",
    meta: "Page",
    keywords: ["about", "mission", "community"],
  },
  {
    type: "page",
    title: "Blogs / News",
    path: "/blogs",
    summary: "Latest news, articles, updates, and featured stories.",
    meta: "Page",
    keywords: ["blogs", "news", "updates"],
  },
  {
    type: "page",
    title: "Famous Personalities",
    path: "/personalities",
    summary: "Explore notable personalities, leaders, scholars, and activists.",
    meta: "Page",
    keywords: ["personalities", "leaders", "scholars", "activists"],
  },
  {
    type: "page",
    title: "Connect SC/ST by Country",
    path: "/connect-scst",
    summary: "Join and connect with SC/ST community members by country.",
    meta: "Form",
    keywords: ["scst", "connect", "country", "community"],
  },
  {
    type: "page",
    title: "Ravidassia Abroad Matrimonial",
    path: "/matrimony",
    summary: "Create or manage your matrimonial biodata and profile.",
    meta: "Form",
    keywords: ["matrimonial", "biodata", "matchmaking"],
  },
  {
    type: "page",
    title: "Countries",
    path: "/countries",
    summary: "Browse country-specific community and location content.",
    meta: "Page",
    keywords: ["countries", "locations", "abroad"],
  },
  {
    type: "page",
    title: "Feature",
    path: "/feature",
    summary: "Featured highlights and curated site content.",
    meta: "Page",
    keywords: ["feature", "featured", "highlights"],
  },
  {
    type: "page",
    title: "Training",
    path: "/training",
    summary: "Training and coaching related content and resources.",
    meta: "Page",
    keywords: ["training", "coaching", "resources"],
  },
  {
    type: "page",
    title: "Testimonial",
    path: "/testimonial",
    summary: "Community feedback, testimonials, and shared experiences.",
    meta: "Page",
    keywords: ["testimonial", "feedback", "stories"],
  },
  {
    type: "page",
    title: "Contact",
    path: "/contact",
    summary: "Reach out to the Ravidassia Abroad team.",
    meta: "Page",
    keywords: ["contact", "email", "support"],
  },
  {
    type: "page",
    title: "Students",
    path: "/students",
    summary: "Premium student hub for English test practice, mock exams, and future abroad-study prep tools.",
    meta: "Students",
    keywords: ["students", "celpip", "ielts", "pte", "mock tests", "study abroad"],
  },
  {
    type: "page",
    title: "Temples Globally",
    path: "/temples-globally",
    summary: "Browse Guru Ravidass temples by country with photos, maps, and community details.",
    meta: "Directory",
    keywords: ["temples", "gurughar", "mandir", "directory", "countries"],
  },
  {
    type: "page",
    title: "Privacy Policy",
    path: "/privacy-policy",
    summary: "How the website currently collects, uses, and stores personal information.",
    meta: "Legal",
    keywords: ["privacy", "policy", "data"],
  },
  {
    type: "page",
    title: "Terms of Use",
    path: "/terms-of-use",
    summary: "Rules for using the current Ravidassia Abroad website.",
    meta: "Legal",
    keywords: ["terms", "use", "rules"],
  },
  {
    type: "page",
    title: "Community Guidelines",
    path: "/community-guidelines",
    summary: "Community behavior and moderation expectations for the current platform.",
    meta: "Legal",
    keywords: ["community", "guidelines", "moderation"],
  },
  {
    type: "page",
    title: "Privacy / Data Request",
    path: "/privacy-data-request",
    summary: "Request access, correction, deletion, or account deletion for your data.",
    meta: "Privacy",
    keywords: ["privacy", "data request", "deletion", "access"],
  },
];

function normalizeSearchTokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scoreSearchResult(query, result) {
  if (!query) return 1;

  const normalizedQuery = query.toLowerCase().trim();
  const title = String(result.title || "").toLowerCase();
  const summary = String(result.summary || "").toLowerCase();
  const meta = String(result.meta || "").toLowerCase();
  const keywordText = Array.isArray(result.keywords)
    ? result.keywords.join(" ").toLowerCase()
    : String(result.keywords || "").toLowerCase();

  let score = 0;
  if (title === normalizedQuery) score += 120;
  if (title.startsWith(normalizedQuery)) score += 80;
  if (title.includes(normalizedQuery)) score += 55;
  if (meta.includes(normalizedQuery)) score += 30;
  if (summary.includes(normalizedQuery)) score += 20;
  if (keywordText.includes(normalizedQuery)) score += 18;

  const queryTokens = normalizeSearchTokens(query);
  for (const token of queryTokens) {
    if (title.includes(token)) score += 12;
    if (summary.includes(token)) score += 6;
    if (meta.includes(token)) score += 6;
    if (keywordText.includes(token)) score += 5;
  }

  return score;
}

function buildStaticSearchResults(query, limit) {
  return SEARCHABLE_STATIC_PAGES.map((entry) => ({
    ...entry,
    score: scoreSearchResult(query, entry),
  }))
    .filter((entry) => (!query ? true : entry.score > 0))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function buildRelatedKeywords(query, results) {
  const queryTokens = new Set(normalizeSearchTokens(query));
  const seen = new Set();
  const keywords = [];

  for (const result of results) {
    const tokens = [
      ...normalizeSearchTokens(result.title),
      ...normalizeSearchTokens(result.meta),
      ...(Array.isArray(result.keywords)
        ? result.keywords.flatMap((keyword) => normalizeSearchTokens(keyword))
        : normalizeSearchTokens(result.keywords)),
    ];

    for (const token of tokens) {
      if (queryTokens.has(token) || seen.has(token)) continue;
      seen.add(token);
      keywords.push(token);
      if (keywords.length >= 10) return keywords;
    }
  }

  return keywords;
}

function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  const allowed = ["admin", "main_admin", "moderate_admin"];
  if (!req.user || !allowed.includes(req.user.role))
    return res.status(403).json({ message: "Forbidden" });
  next();
}

async function logAdminAction(req, action, entityType, entityId = null, details = {}) {
  if (!req.user) return;

  try {
    await pool.query(
      `INSERT INTO admin_audit_logs
        (admin_user_id, admin_email, admin_role, action, entity_type, entity_id, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        req.user.id,
        req.user.email || null,
        req.user.role || null,
        action,
        entityType,
        entityId ? String(entityId) : null,
        JSON.stringify(details || {}),
        getRequestIp(req),
      ]
    );
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}

function validatePassword(value) {
  return typeof value === "string" && value.trim().length >= 6;
}

function sendValidationError(res, message) {
  return res.status(400).json({ message });
}

function getSafePublicCommentFields(type) {
  const table = type === "articles" ? "article_comments" : "blog_comments";
  const field = type === "articles" ? "article_id" : "post_id";
  return { table, field };
}

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  bucket: "auth",
});
const commentRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  bucket: "comments",
});
const formRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  bucket: "sensitive-forms",
});
const studentActionRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 60,
  bucket: "student-exams",
});
const matrimonyActionRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  bucket: "matrimony-actions",
});

const MATRIMONY_MODERATION_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "hidden",
  "paused",
  "draft",
]);
const CONTACT_VISIBILITY_OPTIONS = new Set([
  "hidden",
  "on_request",
  "public_after_accept",
]);
const PHOTO_VISIBILITY_OPTIONS = new Set(["public", "blurred", "hidden"]);
const PROFILE_VISIBILITY_OPTIONS = new Set([
  "everyone",
  "males_only",
  "females_only",
]);
const WANT_TO_SEE_OPTIONS = new Set(["males", "females", "everyone"]);
const INTEREST_STATUSES = new Set(["pending", "accepted", "rejected", "blocked"]);
const CONTACT_REQUEST_STATUSES = new Set(["pending", "approved", "declined"]);
const OBJECTIVE_QUESTION_TYPES = new Set(["single_select", "multi_select"]);
const FREE_RESPONSE_QUESTION_TYPES = new Set(["written_response", "spoken_response"]);

function normalizeEnumInput(value, allowedValues, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return allowedValues.has(normalized) ? normalized : fallback;
}

function computeAgeFromDob(dob) {
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function normalizeGender(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  if (normalized === "other") return "other";
  return "";
}

function getPublicDisplayName(name) {
  const first = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];
  return first || "Community Member";
}

function canViewerSeeProfile(profile, viewerProfile) {
  const targetSetting = normalizeEnumInput(
    profile.show_profile_to,
    PROFILE_VISIBILITY_OPTIONS,
    "everyone"
  );
  const viewerGender = normalizeGender(viewerProfile?.gender);

  if (targetSetting === "everyone") {
    return true;
  }
  if (!viewerGender) {
    return false;
  }
  if (targetSetting === "males_only") {
    return viewerGender === "male";
  }
  if (targetSetting === "females_only") {
    return viewerGender === "female";
  }
  return false;
}

function formatDurationLabel(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatStudentDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAttemptStatusLabel(status) {
  const map = {
    not_started: "Not started",
    in_progress: "In progress",
    submitted: "Submitted",
    graded: "Auto-scored",
    abandoned: "Abandoned",
  };
  return map[status] || "Unknown";
}

function parseAttemptAnswerValue(answerRow) {
  if (answerRow.answer_option_key) return answerRow.answer_option_key;
  if (answerRow.answer_text) return answerRow.answer_text;
  if (answerRow.answer_json !== null && answerRow.answer_json !== undefined) {
    return answerRow.answer_json;
  }
  return "";
}

async function getExamCatalogSummary() {
  const examTypesResult = await pool.query(
    `
      SELECT
        et.id,
        et.slug,
        et.name,
        et.description,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ev.id,
              'slug', ev.slug,
              'name', ev.name,
              'description', ev.description
            )
            ORDER BY ev.id
          ) FILTER (WHERE ev.id IS NOT NULL),
          '[]'::json
        ) AS variants,
        COUNT(DISTINCT etest.id)::int AS test_count
      FROM exam_types et
      LEFT JOIN exam_variants ev ON ev.exam_type_id = et.id AND ev.is_active = TRUE
      LEFT JOIN exam_tests etest ON etest.exam_type_id = et.id AND etest.is_published = TRUE
      WHERE et.is_active = TRUE
      GROUP BY et.id
      ORDER BY et.id
    `
  );

  const variantCount = examTypesResult.rows.reduce(
    (total, row) => total + (Array.isArray(row.variants) ? row.variants.length : 0),
    0
  );

  return {
    examTypes: examTypesResult.rows,
    variantCount,
  };
}

async function getRecentStudentAttempts(userId, limit = 5, examSlug = null) {
  const values = [userId];
  let examFilter = "";
  if (examSlug) {
    values.push(examSlug);
    examFilter = `AND etype.slug = $${values.length}`;
  }
  values.push(limit);

  const result = await pool.query(
    `
      SELECT
        ea.id,
        ea.exam_test_id,
        ea.status,
        ea.updated_at,
        etype.slug AS exam_slug,
        et.title AS test_title,
        ev.name AS variant_name
      FROM exam_attempts ea
      JOIN exam_tests et ON et.id = ea.exam_test_id
      JOIN exam_types etype ON etype.id = et.exam_type_id
      LEFT JOIN exam_variants ev ON ev.id = et.exam_variant_id
      WHERE ea.user_id = $1
        ${examFilter}
      ORDER BY ea.updated_at DESC, ea.id DESC
      LIMIT $${values.length}
    `,
    values
  );

  return result.rows.map((row) => ({
    ...row,
    status_label: getAttemptStatusLabel(row.status),
    updated_at_label: formatStudentDate(row.updated_at),
  }));
}

async function getOwnedAttempt(attemptId, userId) {
  const result = await pool.query(
    `
      SELECT
        ea.*,
        et.exam_type_id,
        et.exam_variant_id,
        et.title AS test_title,
        et.mode,
        et.duration_seconds,
        etype.slug AS exam_slug,
        etype.name AS exam_name,
        ev.name AS variant_name
      FROM exam_attempts ea
      JOIN exam_tests et ON et.id = ea.exam_test_id
      JOIN exam_types etype ON etype.id = et.exam_type_id
      LEFT JOIN exam_variants ev ON ev.id = et.exam_variant_id
      WHERE ea.id = $1 AND ea.user_id = $2
      LIMIT 1
    `,
    [attemptId, userId]
  );

  return result.rows[0] || null;
}

async function scoreAttempt(attemptId) {
  const questionRows = await pool.query(
    `
      SELECT
        q.id,
        q.question_type,
        sec.slug AS section_slug,
        sec.name AS section_name,
        sec.display_order AS section_display_order,
        part.display_order AS part_display_order,
        q.display_order AS question_display_order,
        a.answer_option_key,
        a.answer_text,
        a.answer_json,
        array_remove(array_agg(opt.option_key ORDER BY opt.display_order) FILTER (WHERE opt.is_correct = TRUE), NULL) AS correct_option_keys
      FROM exam_questions q
      JOIN exam_test_parts part ON part.id = q.exam_test_part_id
      JOIN exam_sections sec ON sec.id = part.exam_section_id
      LEFT JOIN exam_question_options opt ON opt.exam_question_id = q.id
      LEFT JOIN exam_attempt_answers a
        ON a.exam_question_id = q.id
       AND a.exam_attempt_id = $1
      WHERE part.exam_test_id = (SELECT exam_test_id FROM exam_attempts WHERE id = $1)
      GROUP BY
        q.id,
        q.question_type,
        sec.slug,
        sec.name,
        sec.display_order,
        part.display_order,
        q.display_order,
        a.answer_option_key,
        a.answer_text,
        a.answer_json
      ORDER BY sec.display_order, part.display_order, q.display_order
    `,
    [attemptId]
  );

  const sectionSummary = {};
  let objectiveTotal = 0;
  let objectiveCorrect = 0;

  for (const row of questionRows.rows) {
    if (!sectionSummary[row.section_slug]) {
      sectionSummary[row.section_slug] = {
        slug: row.section_slug,
        name: row.section_name,
        objective_total: 0,
        objective_correct: 0,
        pending_total: 0,
      };
    }

    const section = sectionSummary[row.section_slug];
    let isCorrect = null;
    let score = null;

    if (row.question_type === "single_select") {
      section.objective_total += 1;
      objectiveTotal += 1;
      const correctKey = row.correct_option_keys?.[0] || null;
      isCorrect = correctKey !== null && row.answer_option_key === correctKey;
      score = isCorrect ? 1 : 0;
      if (isCorrect) {
        section.objective_correct += 1;
        objectiveCorrect += 1;
      }
    } else if (row.question_type === "multi_select") {
      section.objective_total += 1;
      objectiveTotal += 1;
      const selectedKeys = Array.isArray(row.answer_json)
        ? [...row.answer_json].sort()
        : [];
      const correctKeys = Array.isArray(row.correct_option_keys)
        ? [...row.correct_option_keys].sort()
        : [];
      isCorrect =
        selectedKeys.length === correctKeys.length &&
        selectedKeys.every((value, index) => value === correctKeys[index]);
      score = isCorrect ? 1 : 0;
      if (isCorrect) {
        section.objective_correct += 1;
        objectiveCorrect += 1;
      }
    } else {
      section.pending_total += 1;
    }

    await pool.query(
      `
        UPDATE exam_attempt_answers
        SET is_correct = $2, score = $3, updated_at = NOW()
        WHERE exam_attempt_id = $1 AND exam_question_id = $4
      `,
      [attemptId, isCorrect, score, row.id]
    );
  }

  const totalScore =
    objectiveTotal > 0 ? Number(((objectiveCorrect / objectiveTotal) * 100).toFixed(2)) : null;

  const resultJson = {
    objective_total: objectiveTotal,
    objective_correct: objectiveCorrect,
    scoring_status:
      objectiveTotal > 0
        ? Object.values(sectionSummary).some((item) => item.pending_total > 0)
          ? "partially_graded"
          : "auto_scored"
        : "pending_evaluation",
    sections: Object.values(sectionSummary).map((section) => ({
      ...section,
      score:
        section.objective_total > 0
          ? Number(((section.objective_correct / section.objective_total) * 100).toFixed(2))
          : null,
      status:
        section.objective_total > 0 && section.pending_total === 0
          ? "auto_scored"
          : section.objective_total > 0
            ? "partially_graded"
            : "pending_evaluation",
    })),
  };

  await pool.query(
    `
      UPDATE exam_attempts
      SET
        status = $2,
        submitted_at = COALESCE(submitted_at, NOW()),
        completed_at = NOW(),
        total_score = $3,
        result_json = $4::jsonb,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      attemptId,
      resultJson.scoring_status === "pending_evaluation" ? "submitted" : "graded",
      totalScore,
      JSON.stringify(resultJson),
    ]
  );

  return resultJson;
}

function doesProfileMatchViewerPreference(profile, viewerProfile) {
  const wantToSee = normalizeEnumInput(
    viewerProfile?.want_to_see,
    WANT_TO_SEE_OPTIONS,
    "everyone"
  );
  const profileGender = normalizeGender(profile.gender);

  if (wantToSee === "everyone" || !profileGender) {
    return true;
  }
  if (wantToSee === "males") {
    return profileGender === "male";
  }
  if (wantToSee === "females") {
    return profileGender === "female";
  }
  return true;
}

function makePublicMatrimonyProfile(profile, relation = null) {
  const age = profile.age || computeAgeFromDob(profile.dob);
  const photoVisibility = normalizeEnumInput(
    profile.photo_visibility,
    PHOTO_VISIBILITY_OPTIONS,
    "hidden"
  );

  return {
    id: profile.id,
    user_id: profile.user_id,
    display_name: getPublicDisplayName(profile.name),
    gender: profile.gender || "",
    age,
    city: profile.city_living || "",
    country: profile.country_living || "",
    occupation: profile.occupation || "",
    education: profile.education || "",
    marital_status: profile.marital_status || "",
    short_bio: profile.about_me || profile.partner_expectations || "",
    photo_url: photoVisibility === "hidden" ? null : profile.photo_url || null,
    photo_visibility: photoVisibility,
    contact_visibility: normalizeEnumInput(
      profile.contact_visibility,
      CONTACT_VISIBILITY_OPTIONS,
      "on_request"
    ),
    show_profile_to: normalizeEnumInput(
      profile.show_profile_to,
      PROFILE_VISIBILITY_OPTIONS,
      "everyone"
    ),
    want_to_see: normalizeEnumInput(
      profile.want_to_see,
      WANT_TO_SEE_OPTIONS,
      "everyone"
    ),
    relation,
  };
}

async function getLatestMatrimonyProfileForUser(userId) {
  const result = await pool.query(
    `SELECT * FROM matrimonial_submissions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function getProfileInterestRelation(profileId, viewerUserId) {
  if (!viewerUserId) return null;

  const interestResult = await pool.query(
    `SELECT mi.*,
            mcr.id AS contact_request_id,
            mcr.status AS contact_request_status
       FROM matrimonial_interests mi
       LEFT JOIN matrimonial_contact_requests mcr
         ON mcr.interest_id = mi.id
        AND mcr.requester_user_id = $2
      WHERE mi.receiver_profile_id = $1
        AND mi.sender_user_id = $2
      ORDER BY mi.created_at DESC, mcr.created_at DESC NULLS LAST
      LIMIT 1`,
    [profileId, viewerUserId]
  );

  if (!interestResult.rows.length) {
    return null;
  }

  const row = interestResult.rows[0];
  return {
    interest_id: row.id,
    interest_status: row.status,
    contact_request_id: row.contact_request_id || null,
    contact_request_status: row.contact_request_status || null,
    can_request_contact:
      row.status === "accepted" &&
      !["pending", "approved"].includes(row.contact_request_status || ""),
    can_view_contact: row.contact_request_status === "approved",
  };
}

// 🟢 Step 1: Request password reset (send OTP)

// 🟢 Step 1: Request password reset (send OTP)
app.post("/api/auth/request-reset", authRateLimit, async (req, res) => {
  try {
    cleanupExpiredOtps();
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return sendValidationError(res, "Valid email required");
    }

    const user = await pool.query(
      "SELECT id, email, name FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0)
      return res.status(404).json({ message: "No account with that email" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });

    // Send Email via Resend (CORRECT)
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔐 Ravidassia Abroad Password Reset",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#fecf2f;">Ravidassia Abroad</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ Reset request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// 🟢 Step 2: Verify OTP and reset password
app.post("/api/auth/reset-password", authRateLimit, async (req, res) => {
  try {
    cleanupExpiredOtps();
    const email = normalizeEmail(req.body?.email);
    const otp = normalizeRequiredText(req.body?.otp, 12);
    const newPassword = String(req.body?.newPassword || "");
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Missing fields" });
    if (!validatePassword(newPassword)) {
      return sendValidationError(
        res,
        "Password must be at least 6 characters"
      );
    }

    const record = otpStore.get(email);
    if (!record)
      return res.status(400).json({ message: "OTP expired or invalid" });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Incorrect OTP" });
    if (Date.now() > record.expiresAt)
      return res.status(400).json({ message: "OTP expired" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE email=$2", [
      passwordHash,
      email,
    ]);

    otpStore.delete(email);
    clearAuthCookie(res);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- EMAIL NOTIFICATION HELPER ----
async function sendNotificationEmail(subject, html) {
  try {
    const recipients = await pool.query("SELECT email FROM recipients");
    let toList = recipients.rows.map((r) => r.email);
    if (toList.length === 0 && ADMIN_NOTIFY_TO) toList = [ADMIN_NOTIFY_TO];
    if (toList.length === 0) return;

    await transporter.sendMail({
      from: `"Ravidassia Abroad" <${SMTP_USER}>`,
      to: toList.join(","),
      subject,
      html,
    });

    console.log(`📧 Email notification sent to: ${toList.join(", ")}`);
  } catch (err) {
    console.error("❌ Email send error:", err);
  }
}

// ---- ROUTES ----
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    serverState.dbReady = true;
    serverState.lastDbError = null;
    res.json({ ok: true, app: "Ravidassia API", db: "up" });
  } catch (err) {
    serverState.dbReady = false;
    serverState.lastDbError = err.message;
    res.status(503).json({
      ok: false,
      app: "Ravidassia API",
      db: "down",
      message: "Database unavailable",
    });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 20)
        : 12;

    if (!query) {
      const defaultResults = buildStaticSearchResults("", limit);
      return res.json({
        query: "",
        results: defaultResults,
        keywords: buildRelatedKeywords("", defaultResults),
      });
    }

    const pattern = `%${query}%`;

    const [
      blogResults,
      articleResults,
      personalityResults,
      menuResults,
      templeResults,
    ] =
      await Promise.all([
        pool.query(
          `
            SELECT
              'blog' AS type,
              b.id::text AS entity_id,
              b.title,
              '/blogs/' || b.slug AS path,
              COALESCE(b.excerpt, '') AS summary,
              COALESCE(c.name, 'Blog') AS meta,
              ARRAY_REMOVE(ARRAY[
                COALESCE(c.name, NULL),
                COALESCE(array_to_string(b.tags, ' '), NULL),
                COALESCE(u.name, NULL)
              ], NULL) AS keywords
            FROM blog_posts b
            LEFT JOIN blog_categories c ON b.category_id = c.id
            LEFT JOIN users u ON b.author_id = u.id
            WHERE b.status = 'published'
              AND (
                b.title ILIKE $1
                OR COALESCE(b.excerpt, '') ILIKE $1
                OR COALESCE(b.content, '') ILIKE $1
                OR COALESCE(c.name, '') ILIKE $1
                OR COALESCE(array_to_string(b.tags, ' '), '') ILIKE $1
              )
            ORDER BY b.created_at DESC
            LIMIT $2
          `,
          [pattern, limit]
        ),
        pool.query(
          `
            SELECT
              'article' AS type,
              id::text AS entity_id,
              title,
              '/articles/' || slug AS path,
              LEFT(COALESCE(content, ''), 220) AS summary,
              'Article' AS meta,
              ARRAY[]::text[] AS keywords
            FROM static_articles
            WHERE title ILIKE $1 OR COALESCE(content, '') ILIKE $1
            ORDER BY id DESC
            LIMIT $2
          `,
          [pattern, limit]
        ),
        pool.query(
          `
            SELECT
              'personality' AS type,
              id::text AS entity_id,
              name AS title,
              '/personalities?person=' || id AS path,
              COALESCE(short_bio, '') AS summary,
              COALESCE(category, 'Personality') AS meta,
              ARRAY_REMOVE(ARRAY[
                COALESCE(caste, NULL),
                COALESCE(region, NULL),
                COALESCE(category, NULL),
                COALESCE(sc_st_type, NULL)
              ], NULL) AS keywords
            FROM famous_personalities
            WHERE
              name ILIKE $1
              OR COALESCE(short_bio, '') ILIKE $1
              OR COALESCE(full_bio, '') ILIKE $1
              OR COALESCE(category, '') ILIKE $1
              OR COALESCE(region, '') ILIKE $1
              OR COALESCE(caste, '') ILIKE $1
            ORDER BY id DESC
            LIMIT $2
          `,
          [pattern, limit]
        ),
        pool.query(
          `
            SELECT
              'menu' AS type,
              id::text AS entity_id,
              label AS title,
              path,
              'Site navigation' AS summary,
              'Menu' AS meta,
              ARRAY[]::text[] AS keywords
            FROM site_menus
            WHERE label ILIKE $1 OR path ILIKE $1
            ORDER BY position ASC, id ASC
            LIMIT $2
          `,
          [pattern, limit]
        ),
        pool.query(
          `
            SELECT
              'temple' AS type,
              id::text AS entity_id,
              name AS title,
              '/temples-globally?country=' || REPLACE(country, ' ', '%20') || '&temple=' || id AS path,
              COALESCE(description, '') AS summary,
              country AS meta,
              ARRAY_REMOVE(ARRAY[
                COALESCE(city, NULL),
                COALESCE(location_label, NULL),
                COALESCE(country, NULL)
              ], NULL) AS keywords
            FROM global_temples
            WHERE
              name ILIKE $1
              OR country ILIKE $1
              OR city ILIKE $1
              OR COALESCE(location_label, '') ILIKE $1
              OR COALESCE(description, '') ILIKE $1
            ORDER BY featured DESC, display_order ASC, id DESC
            LIMIT $2
          `,
          [pattern, limit]
        ),
      ]);

    const staticResults = buildStaticSearchResults(query, limit);
    const mergedResults = [
      ...blogResults.rows,
      ...articleResults.rows,
      ...personalityResults.rows,
      ...menuResults.rows,
      ...templeResults.rows,
      ...staticResults,
    ]
      .map((result) => ({
        ...result,
        score: scoreSearchResult(query, result),
      }))
      .filter((result) => result.score > 0);

    const dedupedResults = [];
    const seen = new Set();

    for (const result of mergedResults.sort(
      (a, b) => b.score - a.score || a.title.localeCompare(b.title)
    )) {
      const key = `${result.type}:${result.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedupedResults.push(result);
      if (dedupedResults.length >= limit) break;
    }

    res.json({
      query,
      results: dedupedResults,
      keywords: buildRelatedKeywords(query, dedupedResults),
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/temples", async (req, res) => {
  try {
    const { country } = req.query;
    const params = [];
    let query = `
      SELECT *
      FROM global_temples
      WHERE 1=1
    `;

    if (country) {
      params.push(country);
      query += ` AND country = $${params.length}`;
    }

    query += " ORDER BY featured DESC, display_order ASC, country ASC, city ASC, name ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Temples fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER
app.post("/api/auth/register", authRateLimit, async (req, res) => {
  try {
    let { name, email, password, policyAccepted, marketingOptIn } =
      req.body || {};
    name = normalizeRequiredText(name, 100);
    email = normalizeEmail(email);
    if (!name || !email || !password) {
      return sendValidationError(res, "All fields required");
    }
    if (!isValidEmail(email)) {
      return sendValidationError(res, "Valid email required");
    }
    if (!validatePassword(password)) {
      return sendValidationError(
        res,
        "Password must be at least 6 characters"
      );
    }
    if (!normalizeBooleanInput(policyAccepted)) {
      return sendValidationError(
        res,
        "You must agree to the Terms of Use and Privacy Policy"
      );
    }
    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length)
      return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `INSERT INTO users
        (name, email, password_hash, marketing_opt_in, policy_ack_version, policy_ack_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       RETURNING id, name, email, role, photo_url, phone, city, marketing_opt_in`,
      [
        name,
        email,
        hash,
        normalizeBooleanInput(marketingOptIn),
        CURRENT_POLICY_VERSION,
      ]
    );

    const user = inserted.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
// LOGIN
app.post("/api/auth/login", authRateLimit, async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = normalizeEmail(email);
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // ✅ Now fetch photo_url, phone, and city as well
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash, photo_url, phone, city, marketing_opt_in FROM users WHERE email=$1",
      [email]
    );

    if (!result.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Create a token with user ID and role
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password_hash;
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/google", authRateLimit, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendValidationError(res, "Google credential required");
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let userRes = await pool.query("SELECT * FROM users WHERE email=$1", [
      email.toLowerCase(),
    ]);
    let user;

    if (userRes.rows.length === 0) {
      const hash = await bcrypt.hash(jwt.sign({ email }, JWT_SECRET), 10);
      const insert = await pool.query(
        `INSERT INTO users
          (name,email,password_hash,photo_url,marketing_opt_in,policy_ack_version,policy_ack_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         RETURNING *`,
        [name, email.toLowerCase(), hash, picture, false, CURRENT_POLICY_VERSION]
      );
      user = insert.rows[0];
    } else user = userRes.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password_hash;
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    console.error("❌ Google auth error:", err);
    res.status(400).json({ message: "Invalid Google token" });
  }
});

// ✅ CURRENT USER – return full info from DB
app.get("/api/students/overview", async (req, res) => {
  try {
    const catalog = await getExamCatalogSummary();
    const user = decodeUserIfAny(req);
    const recentAttempts = user ? await getRecentStudentAttempts(user.id, 5) : [];

    res.json({
      catalogSummary: {
        examTypeCount: catalog.examTypes.length,
        variantCount: catalog.variantCount,
      },
      examTypes: catalog.examTypes,
      recentAttempts,
    });
  } catch (err) {
    console.error("Students overview error:", err);
    res.status(500).json({ message: "Server error loading student overview" });
  }
});

app.get("/api/students/catalog", async (_req, res) => {
  try {
    const catalog = await getExamCatalogSummary();
    res.json(catalog);
  } catch (err) {
    console.error("Students catalog error:", err);
    res.status(500).json({ message: "Server error loading exam catalog" });
  }
});

app.get("/api/students/exams/:examSlug/dashboard", requireAuth, async (req, res) => {
  try {
    const examResult = await pool.query(
      "SELECT * FROM exam_types WHERE slug = $1 AND is_active = TRUE LIMIT 1",
      [req.params.examSlug]
    );
    if (!examResult.rows.length) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const examType = examResult.rows[0];
    const variantsResult = await pool.query(
      `
        SELECT
          ev.*,
          COUNT(et.id)::int AS test_count
        FROM exam_variants ev
        LEFT JOIN exam_tests et
          ON et.exam_variant_id = ev.id
         AND et.is_published = TRUE
        WHERE ev.exam_type_id = $1 AND ev.is_active = TRUE
        GROUP BY ev.id
        ORDER BY ev.id
      `,
      [examType.id]
    );
    const testsResult = await pool.query(
      `
        SELECT
          et.id,
          et.title,
          et.description,
          et.mode,
          et.difficulty,
          et.duration_seconds,
          ev.name AS variant_name,
          primary_part.section_slug,
          primary_part.section_name
        FROM exam_tests et
        LEFT JOIN exam_variants ev ON ev.id = et.exam_variant_id
        LEFT JOIN LATERAL (
          SELECT
            sec.slug AS section_slug,
            sec.name AS section_name
          FROM exam_test_parts part
          JOIN exam_sections sec ON sec.id = part.exam_section_id
          WHERE part.exam_test_id = et.id
          ORDER BY part.display_order ASC
          LIMIT 1
        ) AS primary_part ON TRUE
        WHERE et.exam_type_id = $1 AND et.is_published = TRUE
        ORDER BY et.created_at ASC, et.id ASC
      `,
      [examType.id]
    );

    res.json({
      examType,
      variants: variantsResult.rows.map((row) => ({
        ...row,
        testCount: row.test_count,
      })),
      tests: testsResult.rows.map((row) => ({
        ...row,
        mode_label: row.mode === "full_mock" ? "Full mock" : "Sectional",
        duration_label: formatDurationLabel(row.duration_seconds),
      })),
      recentAttempts: await getRecentStudentAttempts(req.user.id, 5, req.params.examSlug),
    });
  } catch (err) {
    console.error("Exam dashboard error:", err);
    res.status(500).json({ message: "Server error loading exam dashboard" });
  }
});

app.get("/api/students/exams/:examSlug/tests", requireAuth, async (req, res) => {
  try {
    const values = [req.params.examSlug];
    let variantSql = "";
    if (req.query.variant) {
      values.push(String(req.query.variant));
      variantSql = `AND ev.slug = $${values.length}`;
    }

    const testsResult = await pool.query(
      `
        SELECT
          et.id,
          et.title,
          et.description,
          et.mode,
          et.difficulty,
          et.duration_seconds,
          ev.name AS variant_name,
          ev.slug AS variant_slug,
          primary_part.section_slug,
          primary_part.section_name
        FROM exam_tests et
        JOIN exam_types etype ON etype.id = et.exam_type_id
        LEFT JOIN exam_variants ev ON ev.id = et.exam_variant_id
        LEFT JOIN LATERAL (
          SELECT
            sec.slug AS section_slug,
            sec.name AS section_name
          FROM exam_test_parts part
          JOIN exam_sections sec ON sec.id = part.exam_section_id
          WHERE part.exam_test_id = et.id
          ORDER BY part.display_order ASC
          LIMIT 1
        ) AS primary_part ON TRUE
        WHERE etype.slug = $1
          AND et.is_published = TRUE
          ${variantSql}
        ORDER BY et.created_at ASC, et.id ASC
      `,
      values
    );

    res.json({
      variantName: testsResult.rows[0]?.variant_name || null,
      tests: testsResult.rows.map((row) => ({
        ...row,
        mode_label: row.mode === "full_mock" ? "Full mock" : "Sectional",
        duration_label: formatDurationLabel(row.duration_seconds),
      })),
    });
  } catch (err) {
    console.error("Exam tests error:", err);
    res.status(500).json({ message: "Server error loading tests" });
  }
});

app.get("/api/students/tests/:testId", requireAuth, async (req, res) => {
  try {
    const testId = Number.parseInt(req.params.testId, 10);
    if (!Number.isInteger(testId)) {
      return sendValidationError(res, "Invalid test id");
    }

    const testResult = await pool.query(
      `
        SELECT
          et.*,
          etype.name AS exam_name,
          etype.slug AS exam_slug,
          ev.name AS variant_name
        FROM exam_tests et
        JOIN exam_types etype ON etype.id = et.exam_type_id
        LEFT JOIN exam_variants ev ON ev.id = et.exam_variant_id
        WHERE et.id = $1 AND et.is_published = TRUE
        LIMIT 1
      `,
      [testId]
    );

    if (!testResult.rows.length) {
      return res.status(404).json({ message: "Test not found" });
    }

    const partsResult = await pool.query(
      `
        SELECT
          part.id,
          part.title,
          part.duration_seconds,
          sec.name AS section_name
        FROM exam_test_parts part
        JOIN exam_sections sec ON sec.id = part.exam_section_id
        WHERE part.exam_test_id = $1
        ORDER BY part.display_order ASC, part.id ASC
      `,
      [testId]
    );

    res.json({
      examName: testResult.rows[0].exam_name,
      examSlug: testResult.rows[0].exam_slug,
      test: {
        ...testResult.rows[0],
        mode_label: testResult.rows[0].mode === "full_mock" ? "Full mock" : "Sectional",
        duration_label: formatDurationLabel(testResult.rows[0].duration_seconds),
      },
      parts: partsResult.rows.map((row) => ({
        ...row,
        duration_label: formatDurationLabel(row.duration_seconds),
      })),
    });
  } catch (err) {
    console.error("Test overview error:", err);
    res.status(500).json({ message: "Server error loading test overview" });
  }
});

app.post("/api/students/tests/:testId/attempts", requireAuth, studentActionRateLimit, async (req, res) => {
  try {
    const testId = Number.parseInt(req.params.testId, 10);
    if (!Number.isInteger(testId)) {
      return sendValidationError(res, "Invalid test id");
    }

    const testResult = await pool.query(
      "SELECT id FROM exam_tests WHERE id = $1 AND is_published = TRUE LIMIT 1",
      [testId]
    );
    if (!testResult.rows.length) {
      return res.status(404).json({ message: "Test not found" });
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM exam_attempts
        WHERE user_id = $1 AND exam_test_id = $2 AND status = 'in_progress'
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [req.user.id, testId]
    );

    if (existing.rows.length) {
      return res.json({ attempt: { id: existing.rows[0].id } });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO exam_attempts
          (user_id, exam_test_id, status, started_at, created_at, updated_at)
        VALUES
          ($1, $2, 'in_progress', NOW(), NOW(), NOW())
        RETURNING *
      `,
      [req.user.id, testId]
    );

    res.json({ attempt: insertResult.rows[0] });
  } catch (err) {
    console.error("Create attempt error:", err);
    res.status(500).json({ message: "Server error creating attempt" });
  }
});

app.get("/api/students/exams/:examSlug/attempts", requireAuth, async (req, res) => {
  try {
    res.json({
      attempts: await getRecentStudentAttempts(req.user.id, 50, req.params.examSlug),
    });
  } catch (err) {
    console.error("Attempt history error:", err);
    res.status(500).json({ message: "Server error loading attempts" });
  }
});

app.get("/api/students/attempts/:attemptId", requireAuth, async (req, res) => {
  try {
    const attemptId = Number.parseInt(req.params.attemptId, 10);
    if (!Number.isInteger(attemptId)) {
      return sendValidationError(res, "Invalid attempt id");
    }

    const attempt = await getOwnedAttempt(attemptId, req.user.id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const questionResult = await pool.query(
      `
        SELECT
          q.id,
          q.question_type,
          q.prompt,
          q.passage_text,
          q.audio_url,
          q.metadata_json,
          q.explanation_text,
          sec.id AS exam_section_id,
          sec.name AS section_name,
          part.instructions AS part_instructions,
          COALESCE(
            json_agg(
              json_build_object(
                'id', opt.id,
                'option_key', opt.option_key,
                'option_text', opt.option_text
              )
              ORDER BY opt.display_order
            ) FILTER (WHERE opt.id IS NOT NULL),
            '[]'::json
          ) AS options
        FROM exam_questions q
        JOIN exam_test_parts part ON part.id = q.exam_test_part_id
        JOIN exam_sections sec ON sec.id = part.exam_section_id
        LEFT JOIN exam_question_options opt ON opt.exam_question_id = q.id
        WHERE part.exam_test_id = $1
        GROUP BY q.id, sec.id, sec.name, part.instructions, part.display_order, q.display_order
        ORDER BY sec.display_order ASC, part.display_order ASC, q.display_order ASC
      `,
      [attempt.exam_test_id]
    );

    const answersResult = await pool.query(
      "SELECT * FROM exam_attempt_answers WHERE exam_attempt_id = $1",
      [attemptId]
    );

    const startedAt = attempt.started_at ? new Date(attempt.started_at).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

    res.json({
      attempt: {
        ...attempt,
        status_label: getAttemptStatusLabel(attempt.status),
      },
      test: {
        title: attempt.test_title,
        duration_seconds: attempt.duration_seconds,
      },
      questions: questionResult.rows,
      answers: answersResult.rows,
      remainingSeconds: Math.max(0, Number(attempt.duration_seconds || 0) - elapsedSeconds),
    });
  } catch (err) {
    console.error("Attempt detail error:", err);
    res.status(500).json({ message: "Server error loading attempt" });
  }
});

app.put("/api/students/attempts/:attemptId/answers", requireAuth, studentActionRateLimit, async (req, res) => {
  try {
    const attemptId = Number.parseInt(req.params.attemptId, 10);
    const examQuestionId = Number.parseInt(req.body?.examQuestionId, 10);
    const questionType = String(req.body?.questionType || "").trim();
    const attempt = await getOwnedAttempt(attemptId, req.user.id);

    if (!attempt || !Number.isInteger(examQuestionId)) {
      return sendValidationError(res, "Invalid attempt or question");
    }

    const questionResult = await pool.query(
      `
        SELECT q.id
        FROM exam_questions q
        JOIN exam_test_parts part ON part.id = q.exam_test_part_id
        WHERE q.id = $1 AND part.exam_test_id = $2
        LIMIT 1
      `,
      [examQuestionId, attempt.exam_test_id]
    );
    if (!questionResult.rows.length) {
      return sendValidationError(res, "Question does not belong to this attempt");
    }

    const answerPayload = req.body?.answer?.value;
    let answerText = null;
    let answerOptionKey = null;
    let answerJson = null;

    if (questionType === "single_select") {
      answerOptionKey = String(answerPayload || "").trim() || null;
    } else if (questionType === "multi_select") {
      answerJson = Array.isArray(answerPayload)
        ? answerPayload.map((value) => String(value).trim()).filter(Boolean)
        : [];
    } else if (FREE_RESPONSE_QUESTION_TYPES.has(questionType)) {
      answerText = String(answerPayload || "").trim();
    } else {
      return sendValidationError(res, "Unsupported question type");
    }

    await pool.query(
      `
        INSERT INTO exam_attempt_answers
          (exam_attempt_id, exam_question_id, answer_text, answer_option_key, answer_json, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        ON CONFLICT (exam_attempt_id, exam_question_id)
        DO UPDATE SET
          answer_text = EXCLUDED.answer_text,
          answer_option_key = EXCLUDED.answer_option_key,
          answer_json = EXCLUDED.answer_json,
          updated_at = NOW()
      `,
      [attemptId, examQuestionId, answerText, answerOptionKey, JSON.stringify(answerJson)]
    );

    await pool.query("UPDATE exam_attempts SET updated_at = NOW() WHERE id = $1", [attemptId]);

    res.json({ message: "Answer saved" });
  } catch (err) {
    console.error("Save answer error:", err);
    res.status(500).json({ message: "Server error saving answer" });
  }
});

app.post("/api/students/attempts/:attemptId/section-state", requireAuth, studentActionRateLimit, async (req, res) => {
  try {
    const attemptId = Number.parseInt(req.params.attemptId, 10);
    const examSectionId = Number.parseInt(req.body?.examSectionId, 10);
    const attempt = await getOwnedAttempt(attemptId, req.user.id);

    if (!attempt || !Number.isInteger(examSectionId)) {
      return sendValidationError(res, "Invalid attempt or section");
    }

    const sectionResult = await pool.query(
      `
        SELECT sec.id
        FROM exam_sections sec
        WHERE sec.id = $1 AND sec.exam_type_id = $2
        LIMIT 1
      `,
      [examSectionId, attempt.exam_type_id]
    );
    if (!sectionResult.rows.length) {
      return sendValidationError(res, "Section does not belong to this attempt");
    }

    await pool.query(
      `
        INSERT INTO exam_attempt_section_states
          (exam_attempt_id, exam_section_id, started_at, ended_at, time_spent_seconds, state_json)
        VALUES
          ($1, $2, NOW(), NOW(), $3, $4::jsonb)
        ON CONFLICT (exam_attempt_id, exam_section_id)
        DO UPDATE SET
          ended_at = NOW(),
          time_spent_seconds = EXCLUDED.time_spent_seconds,
          state_json = EXCLUDED.state_json
      `,
      [
        attemptId,
        examSectionId,
        Number.parseInt(req.body?.timeSpentSeconds, 10) || 0,
        JSON.stringify(req.body?.stateJson || {}),
      ]
    );

    await pool.query("UPDATE exam_attempts SET updated_at = NOW() WHERE id = $1", [attemptId]);

    res.json({ message: "Section state saved" });
  } catch (err) {
    console.error("Save section state error:", err);
    res.status(500).json({ message: "Server error saving section state" });
  }
});

app.post("/api/students/attempts/:attemptId/submit", requireAuth, studentActionRateLimit, async (req, res) => {
  try {
    const attemptId = Number.parseInt(req.params.attemptId, 10);
    const attempt = await getOwnedAttempt(attemptId, req.user.id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const resultJson = await scoreAttempt(attemptId);
    res.json({
      message: "Attempt submitted",
      scoringStatus: resultJson.scoring_status,
    });
  } catch (err) {
    console.error("Submit attempt error:", err);
    res.status(500).json({ message: "Server error submitting attempt" });
  }
});

app.get("/api/students/attempts/:attemptId/result", requireAuth, async (req, res) => {
  try {
    const attemptId = Number.parseInt(req.params.attemptId, 10);
    const attempt = await getOwnedAttempt(attemptId, req.user.id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (!attempt.result_json || !Object.keys(attempt.result_json).length) {
      await scoreAttempt(attemptId);
    }

    const refreshedAttempt = await getOwnedAttempt(attemptId, req.user.id);
    const questionRows = await pool.query(
      `
        SELECT
          q.id,
          q.prompt,
          q.question_type,
          q.explanation_text,
          sec.name AS section_name,
          a.answer_option_key,
          a.answer_text,
          a.answer_json,
          a.is_correct,
          a.score,
          array_remove(array_agg(opt.option_key ORDER BY opt.display_order) FILTER (WHERE opt.is_correct = TRUE), NULL) AS correct_option_keys
        FROM exam_questions q
        JOIN exam_test_parts part ON part.id = q.exam_test_part_id
        JOIN exam_sections sec ON sec.id = part.exam_section_id
        LEFT JOIN exam_question_options opt ON opt.exam_question_id = q.id
        LEFT JOIN exam_attempt_answers a
          ON a.exam_question_id = q.id
         AND a.exam_attempt_id = $1
        WHERE part.exam_test_id = $2
        GROUP BY q.id, sec.name, a.answer_option_key, a.answer_text, a.answer_json, a.is_correct, a.score
        ORDER BY sec.name ASC, q.display_order ASC
      `,
      [attemptId, refreshedAttempt.exam_test_id]
    );

    const resultJson = refreshedAttempt.result_json || {};
    res.json({
      test: {
        title: refreshedAttempt.test_title,
      },
      attempt: {
        ...refreshedAttempt,
        status_label: getAttemptStatusLabel(refreshedAttempt.status),
        total_score_label:
          refreshedAttempt.total_score !== null && refreshedAttempt.total_score !== undefined
            ? `${Number(refreshedAttempt.total_score).toFixed(0)}%`
            : "Pending evaluation",
        started_at_label: formatStudentDate(refreshedAttempt.started_at),
        completed_at_label: formatStudentDate(refreshedAttempt.completed_at),
      },
      sections: (resultJson.sections || []).map((section) => ({
        ...section,
        status_label: section.status === "auto_scored"
          ? "Auto-scored"
          : section.status === "partially_graded"
            ? "Partially graded"
            : "Pending evaluation",
        score_label: section.score !== null && section.score !== undefined ? `${Number(section.score).toFixed(0)}%` : "Pending",
      })),
      questions: questionRows.rows.map((row) => ({
        ...row,
        user_answer_label: Array.isArray(parseAttemptAnswerValue(row))
          ? parseAttemptAnswerValue(row).join(", ")
          : parseAttemptAnswerValue(row) || "No answer submitted",
        correct_answer_label: Array.isArray(row.correct_option_keys) && row.correct_option_keys.length
          ? row.correct_option_keys.join(", ")
          : OBJECTIVE_QUESTION_TYPES.has(row.question_type)
            ? "Not available"
            : "Pending evaluation",
        review_status_label:
          row.is_correct === true
            ? "Correct"
            : row.is_correct === false
              ? "Incorrect"
              : "Pending evaluation",
        explanation_label: row.explanation_text || "Explanation will be added later.",
      })),
    });
  } catch (err) {
    console.error("Attempt result error:", err);
    res.status(500).json({ message: "Server error loading result" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, photo_url, phone, city, created_at, marketing_opt_in FROM users WHERE id=$1",
      [req.user.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "User not found" });

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Fetch current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
});

// ---- SC/ST SUBMISSION ----
app.post("/api/scst-submissions", requireAuth, formRateLimit, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = normalizeRequiredText(req.body?.name, 120);
    const email = normalizeEmail(req.body?.email);
    const country = normalizeRequiredText(req.body?.country, 100);
    const state = normalizeOptionalText(req.body?.state, 100);
    const city = normalizeOptionalText(req.body?.city, 100);
    const phone = normalizeOptionalText(req.body?.phone, 50);
    const platform = normalizeOptionalText(req.body?.platform, 20) || "WhatsApp";
    const instagram = normalizeOptionalText(req.body?.instagram, 100);
    const proof = normalizeOptionalText(req.body?.proof, 255);
    const message = normalizeOptionalText(
      sanitizeRichText(req.body?.message),
      4000
    );
    const consentGiven = normalizeBooleanInput(req.body?.consent_given);
    const marketingOptIn = normalizeBooleanInput(req.body?.marketing_opt_in);

    if (!name || !email || !country) {
      return sendValidationError(res, "name, email, and country required");
    }
    if (!isValidEmail(email)) {
      return sendValidationError(res, "Valid email required");
    }
    if (!consentGiven) {
      return sendValidationError(res, "Consent is required");
    }

    const existing = await pool.query(
      "SELECT id FROM scst_submissions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (existing.rows.length > 0) {
      const existingId = existing.rows[0].id;
      await pool.query(
        `UPDATE scst_submissions SET
          name=$1, email=$2, country=$3, state=$4, city=$5,
          phone=$6, platform=$7, instagram=$8, proof=$9, message=$10,
          status='pending', replied=false, replied_at=NULL,
          consent_given=$11, consent_version=$12, consent_given_at=NOW(),
          marketing_opt_in=$13
         WHERE id=$14`,
        [
          name,
          email,
          country,
          state,
          city,
          phone,
          platform,
          instagram,
          proof,
          message,
          consentGiven,
          CURRENT_POLICY_VERSION,
          marketingOptIn,
          existingId,
        ]
      );

      await pool.query(
        "DELETE FROM scst_submissions WHERE user_id=$1 AND id <> $2",
        [userId, existingId]
      );

      return res.json({ message: "Submission updated successfully" });
    }

    await pool.query(
      `INSERT INTO scst_submissions
       (user_id,name,email,country,state,city,phone,platform,instagram,proof,message,status,consent_given,consent_version,consent_given_at,marketing_opt_in)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13,NOW(),$14)`,
      [
        userId,
        name,
        email,
        country,
        state,
        city,
        phone,
        platform,
        instagram,
        proof,
        message,
        consentGiven,
        CURRENT_POLICY_VERSION,
        marketingOptIn,
      ]
    );

    sendNotificationEmail(
      "📬 New SC/ST Connect Submission",
      `
        <h3>New SC/ST Connect Submission</h3>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Country:</strong> ${escapeHtml(country)}</p>
        <p><strong>City:</strong> ${escapeHtml(city) || "-"}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone) || "-"}</p>
        <p><strong>Platform:</strong> ${escapeHtml(platform) || "-"}</p>
        <p><strong>Instagram:</strong> ${escapeHtml(instagram) || "-"}</p>
        <p><strong>Proof:</strong> ${escapeHtml(proof) || "-"}</p>
        <p><strong>Message:</strong><br>${escapeHtml(message) || "(none)"}</p>
        <hr>
        <p>Log in to your admin dashboard to review it.</p>
      `
    ).catch((err) => console.error("⚠️ Email send async error:", err.message));

    res.json({ message: "Submission received" });
  } catch (err) {
    console.error("SCST submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch the logged-in user's SC/ST submission
app.get("/api/scst-submissions/mine", async (req, res) => {
  try {
    const user = decodeUserIfAny(req);
    if (!user)
      return res
        .status(401)
        .json({ message: "Unauthorized: user not logged in" });

    const result = await pool.query(
      "SELECT * FROM scst_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );

    if (!result.rows.length) return res.json({ exists: false, data: null });
    res.json({ exists: true, data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching SC/ST submission:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- MATRIMONIAL SUBMISSION (Updated with new fields) ----
// ✅ Create / Update Matrimonial Submission
app.post(
  "/api/matrimonial-submissions",
  requireAuth,
  formRateLimit,
  uploadMatrimonial.single("photo"),
  async (req, res) => {
    try {
      const d = req.body || {};
      const userId = req.user.id;
      const consentGiven = normalizeBooleanInput(d.consent_given);
      const marketingOptIn = normalizeBooleanInput(d.marketing_opt_in);
      const isPublicListing = normalizeBooleanInput(d.is_public_listing);
      const contactVisibility = normalizeEnumInput(
        d.contact_visibility,
        CONTACT_VISIBILITY_OPTIONS,
        "on_request"
      );
      const photoVisibility = normalizeEnumInput(
        d.photo_visibility,
        PHOTO_VISIBILITY_OPTIONS,
        "hidden"
      );
      const showProfileTo = normalizeEnumInput(
        d.show_profile_to,
        PROFILE_VISIBILITY_OPTIONS,
        "everyone"
      );
      const wantToSee = normalizeEnumInput(
        d.want_to_see,
        WANT_TO_SEE_OPTIONS,
        "everyone"
      );

      // Normalize fields from frontend
      d.origin_state = d.home_state_india || d.origin_state;
      d.current_status = d.status_type || d.current_status;
      d.partner_expectations = sanitizeRichText(d.partner_expectations || "");
      d.about_me = sanitizeRichText(d.about_me || "");

      // Validate minimum required fields
      if (!d.name?.trim() || !d.email?.trim() || !d.country_living?.trim()) {
        return res.status(400).json({ message: "Required fields missing" });
      }
      if (!isValidEmail(d.email)) {
        return sendValidationError(res, "Valid email required");
      }
      if (!consentGiven) {
        return sendValidationError(res, "Consent is required");
      }

      const dobValue = d.dob?.trim() ? d.dob : null;
      const photoUrl = req.file?.path || d.photo_url || null;

      // Check if this user already has a submission
      const existing = await pool.query(
        "SELECT id FROM matrimonial_submissions WHERE user_id=$1 ORDER BY created_at DESC",
        [userId]
      );

      if (existing.rows.length > 0) {
        // 🟡 UPDATE existing submission
        const id = existing.rows[0].id;
        await pool.query(
          `UPDATE matrimonial_submissions SET
            name=$1, gender=$2, age=$3, dob=$4, height=$5, marital_status=$6,
            phone=$7, email=$8, instagram=$9, country_living=$10, state_living=$11,
            city_living=$12, origin_state=$13, origin_district=$14,
            current_status=$15, education=$16, occupation=$17,
            company_or_institution=$18, income_range=$19, annual_income=$20,
            father_name=$21, father_occupation=$22, mother_name=$23, mother_occupation=$24,
            siblings=$25, family_type=$26, religion=$27, caste=$28,
            partner_expectations=$29, partner_age_range=$30, partner_country=$31,
            privacy_accepted=$32, photo_url=$33, religion_beliefs=$34,
            consent_given=$35, consent_version=$36, consent_given_at=NOW(),
            marketing_opt_in=$37, about_me=$38, moderation_status='pending',
            moderation_notes=NULL, reviewed_by=NULL, reviewed_at=NULL,
            is_public_listing=$39, contact_visibility=$40, photo_visibility=$41,
            show_profile_to=$42, want_to_see=$43
          WHERE user_id=$44`,
          [
            d.name,
            d.gender,
            d.age || null,
            dobValue,
            d.height || null,
            d.marital_status || null,
            d.phone || null,
            d.email,
            d.instagram || null,
            d.country_living || null,
            d.state_living || null,
            d.city_living || null,
            d.origin_state || null,
            d.origin_district || null,
            d.current_status || null,
            d.education || null,
            d.occupation || null,
            d.company_or_institution || null,
            d.income_range || null,
            d.annual_income || null,
            d.father_name || null,
            d.father_occupation || null,
            d.mother_name || null,
            d.mother_occupation || null,
            d.siblings ? parseInt(d.siblings) : null,
            d.family_type || null,
            d.religion || null,
            d.caste || null,
            d.partner_expectations || null,
            d.partner_age_range || null,
            d.partner_country || null,
            d.privacy_accepted || null,
            photoUrl || null,
            d.religion_beliefs || null,
            consentGiven,
            CURRENT_POLICY_VERSION,
            marketingOptIn,
            d.about_me || null,
            isPublicListing,
            contactVisibility,
            photoVisibility,
            showProfileTo,
            wantToSee,
            userId,
          ]
        );

        await pool.query(
          "DELETE FROM matrimonial_submissions WHERE user_id=$1 AND id <> $2",
          [userId, id]
        );

        return res.json({ message: "✅ Biodata updated successfully!" });
      }

      // 🟢 INSERT new submission
      await pool.query(
        `INSERT INTO matrimonial_submissions
          (user_id, name, gender, age, dob, height, marital_status,
           phone, email, instagram, country_living, state_living, city_living,
           origin_state, origin_district, current_status, education, occupation,
           company_or_institution, income_range, annual_income,
           father_name, father_occupation, mother_name, mother_occupation, siblings,
           family_type, religion, caste, partner_expectations, partner_age_range,
           partner_country, privacy_accepted, photo_url, religion_beliefs,
           consent_given, consent_version, consent_given_at, marketing_opt_in,
           about_me, moderation_status, is_public_listing, contact_visibility,
           photo_visibility, show_profile_to, want_to_see)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,
             $8,$9,$10,$11,$12,$13,
             $14,$15,$16,$17,$18,$19,
             $20,$21,$22,$23,$24,$25,
             $26,$27,$28,$29,$30,$31,
             $32,$33,$34,$35,$36,$37,NOW(),$38,
             $39,$40,$41,$42,$43,$44)`,
        [
          userId,
          d.name,
          d.gender,
          d.age || null,
          dobValue,
          d.height || null,
          d.marital_status || null,
          d.phone || null,
          d.email,
          d.instagram || null,
          d.country_living,
          d.state_living || null,
          d.city_living || null,
          d.origin_state || null,
          d.origin_district || null,
          d.current_status || null,
          d.education || null,
          d.occupation || null,
          d.company_or_institution || null,
          d.income_range || null,
          d.annual_income || null,
          d.father_name || null,
          d.father_occupation || null,
          d.mother_name || null,
          d.mother_occupation || null,
          d.siblings ? parseInt(d.siblings) : null,
          d.family_type || null,
          d.religion || null,
          d.caste || null,
          d.partner_expectations || null,
          d.partner_age_range || null,
          d.partner_country || null,
          d.privacy_accepted || null,
          photoUrl || null,
          d.religion_beliefs || null,
          consentGiven,
          CURRENT_POLICY_VERSION,
          marketingOptIn,
          d.about_me || null,
          "pending",
          isPublicListing,
          contactVisibility,
          photoVisibility,
          showProfileTo,
          wantToSee,
        ]
      );

      // ✅ Send notification to admins (optional)
      sendNotificationEmail(
        "💍 New Matrimonial Submission",
        `
          <h3>New Matrimonial Form Submitted</h3>
          <p><strong>Name:</strong> ${escapeHtml(d.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(d.email)}</p>
          <p><strong>Country:</strong> ${escapeHtml(d.country_living)}</p>
          <p><strong>City:</strong> ${escapeHtml(d.city_living) || "-"}</p>
          ${d.caste ? `<p><strong>Caste:</strong> ${escapeHtml(d.caste)}</p>` : ""}
          ${
            d.religion_beliefs
              ? `<p><strong>Beliefs:</strong> ${escapeHtml(d.religion_beliefs)}</p>`
              : ""
          }
          ${photoUrl ? `<p><img src="${escapeHtml(photoUrl)}" width="150"/></p>` : ""}
          <hr><p>Log in to your admin dashboard to view this biodata.</p>
        `
      ).catch((err) =>
        console.error("⚠️ Matrimonial email failed:", err.message)
      );

      res.json({ message: "✅ Biodata submitted successfully!" });
    } catch (err) {
      console.error("❌ Matrimonial submit error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ Fetch the logged-in user's submitted matrimonial biodata
app.get("/api/matrimonial-submissions/mine", async (req, res) => {
  try {
    const user = decodeUserIfAny(req); // use the helper you added earlier
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not logged in" });
    }

    const result = await pool.query(
      "SELECT * FROM matrimonial_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );

    if (!result.rows.length) {
      return res.json({ exists: false, data: null });
    }

    res.json({ exists: true, data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching my matrimonial submission:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/matrimonial/profiles", async (req, res) => {
  try {
    const viewer = decodeUserIfAny(req);
    const viewerProfile = viewer
      ? await getLatestMatrimonyProfileForUser(viewer.id)
      : null;
    const genderFilter = normalizeGender(req.query.gender);
    const cityFilter = String(req.query.city || "").trim().toLowerCase();
    const ageMin = Number.parseInt(req.query.ageMin, 10);
    const ageMax = Number.parseInt(req.query.ageMax, 10);

    const result = await pool.query(
      `SELECT * FROM matrimonial_submissions
       WHERE moderation_status = 'approved'
         AND is_public_listing = TRUE
       ORDER BY created_at DESC`
    );

    const filteredProfiles = result.rows.filter((profile) => {
      if (!canViewerSeeProfile(profile, viewerProfile)) {
        return false;
      }
      if (viewerProfile && !doesProfileMatchViewerPreference(profile, viewerProfile)) {
        return false;
      }
      if (genderFilter && normalizeGender(profile.gender) !== genderFilter) {
        return false;
      }
      if (
        cityFilter &&
        !String(profile.city_living || "")
          .trim()
          .toLowerCase()
          .includes(cityFilter)
      ) {
        return false;
      }

      const profileAge = profile.age || computeAgeFromDob(profile.dob);
      if (Number.isInteger(ageMin) && (profileAge === null || profileAge < ageMin)) {
        return false;
      }
      if (Number.isInteger(ageMax) && (profileAge === null || profileAge > ageMax)) {
        return false;
      }

      return true;
    });

    const profiles = await Promise.all(
      filteredProfiles.map(async (profile) =>
        makePublicMatrimonyProfile(
          profile,
          viewer ? await getProfileInterestRelation(profile.id, viewer.id) : null
        )
      )
    );

    res.json({ profiles });
  } catch (err) {
    console.error("Public matrimonial profiles fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/matrimonial/profiles/:id", async (req, res) => {
  try {
    const viewer = decodeUserIfAny(req);
    const viewerProfile = viewer
      ? await getLatestMatrimonyProfileForUser(viewer.id)
      : null;
    const result = await pool.query(
      `SELECT * FROM matrimonial_submissions
       WHERE id = $1
         AND moderation_status = 'approved'
         AND is_public_listing = TRUE
       LIMIT 1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = result.rows[0];
    if (!canViewerSeeProfile(profile, viewerProfile)) {
      return res.status(403).json({ message: "Profile is not available" });
    }
    if (viewerProfile && !doesProfileMatchViewerPreference(profile, viewerProfile)) {
      return res.status(403).json({ message: "Profile is not available" });
    }

    const relation = viewer
      ? await getProfileInterestRelation(profile.id, viewer.id)
      : null;

    res.json({
      profile: {
        ...makePublicMatrimonyProfile(profile, relation),
        about_me: profile.about_me || "",
        religion_beliefs: profile.religion_beliefs || "",
        family_type: profile.family_type || "",
        country_living: profile.country_living || "",
        city_living: profile.city_living || "",
        education: profile.education || "",
        partner_age_range: profile.partner_age_range || "",
        partner_country: profile.partner_country || "",
        partner_marital_status: profile.partner_marital_status || "",
      },
    });
  } catch (err) {
    console.error("Public matrimonial profile detail error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/matrimonial/profiles/:id/contact", requireAuth, async (req, res) => {
  try {
    const profileResult = await pool.query(
      `SELECT id, user_id, email, phone, instagram, contact_visibility
       FROM matrimonial_submissions
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = profileResult.rows[0];
    const contactVisibility = normalizeEnumInput(
      profile.contact_visibility,
      CONTACT_VISIBILITY_OPTIONS,
      "on_request"
    );

    if (profile.user_id === req.user.id) {
      return res.json({
        contact: {
          email: profile.email || "",
          phone: profile.phone || "",
          instagram: profile.instagram || "",
        },
      });
    }

    if (contactVisibility === "hidden") {
      return res.status(403).json({ message: "Contact details are hidden" });
    }

    const approvedRequest = await pool.query(
      `SELECT mcr.id
       FROM matrimonial_contact_requests mcr
       JOIN matrimonial_interests mi
         ON mi.id = mcr.interest_id
      WHERE mcr.owner_profile_id = $1
        AND mcr.requester_user_id = $2
        AND mcr.status = 'approved'
        AND mi.status = 'accepted'
      LIMIT 1`,
      [profile.id, req.user.id]
    );

    if (!approvedRequest.rows.length) {
      return res.status(403).json({ message: "Contact not approved yet" });
    }

    res.json({
      contact: {
        email: profile.email || "",
        phone: profile.phone || "",
        instagram: profile.instagram || "",
      },
    });
  } catch (err) {
    console.error("Matrimonial contact reveal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/api/matrimonial/interests",
  requireAuth,
  matrimonyActionRateLimit,
  async (req, res) => {
    try {
      const receiverProfileId = Number.parseInt(req.body?.receiver_profile_id, 10);
      if (!Number.isInteger(receiverProfileId)) {
        return sendValidationError(res, "Valid receiver profile is required");
      }

      const receiverProfileResult = await pool.query(
        `SELECT id, user_id FROM matrimonial_submissions WHERE id = $1 LIMIT 1`,
        [receiverProfileId]
      );
      if (!receiverProfileResult.rows.length) {
        return res.status(404).json({ message: "Receiver profile not found" });
      }

      const receiverProfile = receiverProfileResult.rows[0];
      if (receiverProfile.user_id === req.user.id) {
        return sendValidationError(res, "You cannot send interest to your own profile");
      }

      const senderProfile = await getLatestMatrimonyProfileForUser(req.user.id);
      const blockedCheck = await pool.query(
        `SELECT id
           FROM matrimonial_interests
          WHERE sender_user_id = $1
            AND receiver_profile_id = $2
            AND status = 'blocked'
          LIMIT 1`,
        [req.user.id, receiverProfileId]
      );
      if (blockedCheck.rows.length) {
        return res.status(403).json({ message: "You cannot send interest to this profile" });
      }

      const existingActive = await pool.query(
        `SELECT id, status
           FROM matrimonial_interests
          WHERE sender_user_id = $1
            AND receiver_profile_id = $2
            AND status IN ('pending', 'accepted')
          ORDER BY created_at DESC
          LIMIT 1`,
        [req.user.id, receiverProfileId]
      );
      if (existingActive.rows.length) {
        return res.json({
          message: "Interest already exists",
          interest: existingActive.rows[0],
        });
      }

      const insertResult = await pool.query(
        `INSERT INTO matrimonial_interests
          (sender_user_id, sender_profile_id, receiver_profile_id, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [req.user.id, senderProfile?.id || null, receiverProfileId]
      );

      res.status(201).json({
        message: "Interest sent successfully",
        interest: insertResult.rows[0],
      });
    } catch (err) {
      console.error("Send matrimonial interest error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get("/api/matrimonial/interests/sent", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mi.*,
              mp.name AS receiver_name,
              mp.gender AS receiver_gender,
              mp.city_living AS receiver_city,
              mp.country_living AS receiver_country,
              mp.photo_url AS receiver_photo_url,
              mp.photo_visibility AS receiver_photo_visibility,
              mcr.id AS contact_request_id,
              mcr.status AS contact_request_status
         FROM matrimonial_interests mi
         JOIN matrimonial_submissions mp
           ON mp.id = mi.receiver_profile_id
         LEFT JOIN matrimonial_contact_requests mcr
           ON mcr.interest_id = mi.id
          AND mcr.requester_user_id = mi.sender_user_id
        WHERE mi.sender_user_id = $1
        ORDER BY mi.created_at DESC`,
      [req.user.id]
    );

    res.json({
      interests: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        contact_request_id: row.contact_request_id || null,
        contact_request_status: row.contact_request_status || null,
        receiver_profile: {
          id: row.receiver_profile_id,
          display_name: getPublicDisplayName(row.receiver_name),
          gender: row.receiver_gender || "",
          city: row.receiver_city || "",
          country: row.receiver_country || "",
          photo_url:
            normalizeEnumInput(
              row.receiver_photo_visibility,
              PHOTO_VISIBILITY_OPTIONS,
              "hidden"
            ) === "hidden"
              ? null
              : row.receiver_photo_url || null,
          photo_visibility: normalizeEnumInput(
            row.receiver_photo_visibility,
            PHOTO_VISIBILITY_OPTIONS,
            "hidden"
          ),
        },
      })),
    });
  } catch (err) {
    console.error("Sent matrimonial interests fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/matrimonial/interests/received", requireAuth, async (req, res) => {
  try {
    const ownProfile = await getLatestMatrimonyProfileForUser(req.user.id);
    if (!ownProfile) {
      return res.json({ interests: [] });
    }

    const result = await pool.query(
      `SELECT mi.*,
              u.name AS sender_name,
              u.email AS sender_email,
              sp.photo_url AS sender_photo_url,
              sp.photo_visibility AS sender_photo_visibility
         FROM matrimonial_interests mi
         LEFT JOIN users u
           ON u.id = mi.sender_user_id
         LEFT JOIN matrimonial_submissions sp
           ON sp.id = mi.sender_profile_id
        WHERE mi.receiver_profile_id = $1
        ORDER BY mi.created_at DESC`,
      [ownProfile.id]
    );

    res.json({
      interests: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sender_user_id: row.sender_user_id,
        sender_name: getPublicDisplayName(row.sender_name),
        sender_email: row.sender_email || "",
        sender_photo_url:
          normalizeEnumInput(
            row.sender_photo_visibility,
            PHOTO_VISIBILITY_OPTIONS,
            "hidden"
          ) === "hidden"
            ? null
            : row.sender_photo_url || null,
      })),
    });
  } catch (err) {
    console.error("Received matrimonial interests fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch(
  "/api/matrimonial/interests/:id/status",
  requireAuth,
  matrimonyActionRateLimit,
  async (req, res) => {
    try {
      const nextStatus = normalizeEnumInput(
        req.body?.status,
        INTEREST_STATUSES,
        ""
      );
      if (!["accepted", "rejected", "blocked"].includes(nextStatus)) {
        return sendValidationError(res, "Invalid interest status");
      }

      const ownProfile = await getLatestMatrimonyProfileForUser(req.user.id);
      if (!ownProfile) {
        return res.status(403).json({ message: "Create your profile first" });
      }

      const updateResult = await pool.query(
        `UPDATE matrimonial_interests
            SET status = $1,
                updated_at = NOW()
          WHERE id = $2
            AND receiver_profile_id = $3
          RETURNING *`,
        [nextStatus, req.params.id, ownProfile.id]
      );

      if (!updateResult.rows.length) {
        return res.status(404).json({ message: "Interest not found" });
      }

      res.json({
        message: "Interest updated successfully",
        interest: updateResult.rows[0],
      });
    } catch (err) {
      console.error("Update matrimonial interest error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/matrimonial/contact-requests",
  requireAuth,
  matrimonyActionRateLimit,
  async (req, res) => {
    try {
      const interestId = Number.parseInt(req.body?.interest_id, 10);
      if (!Number.isInteger(interestId)) {
        return sendValidationError(res, "Valid interest is required");
      }

      const interestResult = await pool.query(
        `SELECT mi.*, mp.contact_visibility
           FROM matrimonial_interests mi
           JOIN matrimonial_submissions mp
             ON mp.id = mi.receiver_profile_id
          WHERE mi.id = $1
            AND mi.sender_user_id = $2
          LIMIT 1`,
        [interestId, req.user.id]
      );

      if (!interestResult.rows.length) {
        return res.status(404).json({ message: "Interest not found" });
      }

      const interest = interestResult.rows[0];
      if (interest.status !== "accepted") {
        return res.status(400).json({ message: "Interest must be accepted first" });
      }

      const visibility = normalizeEnumInput(
        interest.contact_visibility,
        CONTACT_VISIBILITY_OPTIONS,
        "on_request"
      );
      if (visibility === "hidden") {
        return res.status(403).json({ message: "Contact details are hidden" });
      }

      const existingRequest = await pool.query(
        `SELECT *
           FROM matrimonial_contact_requests
          WHERE interest_id = $1
            AND requester_user_id = $2
            AND status IN ('pending', 'approved')
          ORDER BY created_at DESC
          LIMIT 1`,
        [interestId, req.user.id]
      );

      if (existingRequest.rows.length) {
        return res.json({
          message: "Contact request already exists",
          contact_request: existingRequest.rows[0],
        });
      }

      const insertResult = await pool.query(
        `INSERT INTO matrimonial_contact_requests
          (interest_id, requester_user_id, owner_profile_id, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [interestId, req.user.id, interest.receiver_profile_id]
      );

      res.status(201).json({
        message: "Contact request sent successfully",
        contact_request: insertResult.rows[0],
      });
    } catch (err) {
      console.error("Create matrimonial contact request error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get("/api/matrimonial/contact-requests/sent", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mcr.*,
              mp.name AS owner_name,
              mp.city_living AS owner_city,
              mp.country_living AS owner_country
         FROM matrimonial_contact_requests mcr
         JOIN matrimonial_submissions mp
           ON mp.id = mcr.owner_profile_id
        WHERE mcr.requester_user_id = $1
        ORDER BY mcr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      requests: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        interest_id: row.interest_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        approved_at: row.approved_at,
        owner_profile: {
          id: row.owner_profile_id,
          display_name: getPublicDisplayName(row.owner_name),
          city: row.owner_city || "",
          country: row.owner_country || "",
        },
      })),
    });
  } catch (err) {
    console.error("Sent contact requests fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/matrimonial/contact-requests/received", requireAuth, async (req, res) => {
  try {
    const ownProfile = await getLatestMatrimonyProfileForUser(req.user.id);
    if (!ownProfile) {
      return res.json({ requests: [] });
    }

    const result = await pool.query(
      `SELECT mcr.*,
              u.name AS requester_name,
              u.email AS requester_email
         FROM matrimonial_contact_requests mcr
         JOIN users u
           ON u.id = mcr.requester_user_id
        WHERE mcr.owner_profile_id = $1
        ORDER BY mcr.created_at DESC`,
      [ownProfile.id]
    );

    res.json({
      requests: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        interest_id: row.interest_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        approved_at: row.approved_at,
        requester_user_id: row.requester_user_id,
        requester_name: getPublicDisplayName(row.requester_name),
        requester_email: row.requester_email || "",
      })),
    });
  } catch (err) {
    console.error("Received contact requests fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch(
  "/api/matrimonial/contact-requests/:id/status",
  requireAuth,
  matrimonyActionRateLimit,
  async (req, res) => {
    try {
      const nextStatus = normalizeEnumInput(
        req.body?.status,
        CONTACT_REQUEST_STATUSES,
        ""
      );
      if (!["approved", "declined"].includes(nextStatus)) {
        return sendValidationError(res, "Invalid contact request status");
      }

      const ownProfile = await getLatestMatrimonyProfileForUser(req.user.id);
      if (!ownProfile) {
        return res.status(403).json({ message: "Create your profile first" });
      }

      const updateResult = await pool.query(
        `UPDATE matrimonial_contact_requests
            SET status = $1,
                updated_at = NOW(),
                approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
          WHERE id = $2
            AND owner_profile_id = $3
          RETURNING *`,
        [nextStatus, req.params.id, ownProfile.id]
      );

      if (!updateResult.rows.length) {
        return res.status(404).json({ message: "Contact request not found" });
      }

      res.json({
        message: "Contact request updated successfully",
        contact_request: updateResult.rows[0],
      });
    } catch (err) {
      console.error("Update contact request error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---- ADMIN ROUTES ----
app.get(
  "/api/admin/scst-submissions",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM scst_submissions ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Admin SCST fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/scst-submissions/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;
      await pool.query("DELETE FROM scst_submissions WHERE id=$1", [id]);
      await logAdminAction(req, "delete", "scst_submission", id);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error("SC/ST delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get(
  "/api/admin/matrimonial",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM matrimonial_submissions ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Matrimonial fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.patch(
  "/api/admin/matrimonial/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const moderationStatus = normalizeEnumInput(
        req.body?.moderation_status,
        MATRIMONY_MODERATION_STATUSES,
        ""
      );
      const moderationNotes = normalizeOptionalText(
        sanitizeRichText(req.body?.moderation_notes || ""),
        4000
      );

      if (!moderationStatus) {
        return sendValidationError(res, "Invalid moderation status");
      }

      const result = await pool.query(
        `UPDATE matrimonial_submissions
            SET moderation_status = $1,
                moderation_notes = $2,
                reviewed_by = $3,
                reviewed_at = NOW()
          WHERE id = $4
          RETURNING *`,
        [moderationStatus, moderationNotes, req.user.id, req.params.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ message: "Matrimonial submission not found" });
      }

      await logAdminAction(req, "review", "matrimonial_submission", req.params.id, {
        moderation_status: moderationStatus,
      });

      res.json({
        message: "Matrimonial status updated successfully",
        submission: result.rows[0],
      });
    } catch (err) {
      console.error("Matrimonial moderation update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/matrimonial/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM matrimonial_submissions WHERE id=$1", [
        req.params.id,
      ]);
      await logAdminAction(req, "delete", "matrimonial_submission", req.params.id);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error("Matrimonial delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/matrimonial/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      await pool.query("DELETE FROM matrimonial_submissions WHERE id = ANY($1)", [
        ids,
      ]);
      await logAdminAction(req, "bulk_delete", "matrimonial_submission", null, {
        ids,
        count: ids.length,
      });

      res.json({
        message: `Deleted ${ids.length} matrimonial submissions successfully`,
      });
    } catch (err) {
      console.error("Matrimonial bulk delete error:", err);
      res.status(500).json({ message: "Server error during bulk delete" });
    }
  }
);

app.get(
  "/api/admin/recipients",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM recipients ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Recipients fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/recipients",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      await pool.query(
        "INSERT INTO recipients(email) VALUES($1) ON CONFLICT(email) DO NOTHING",
        [email]
      );
      res.json({ message: "Recipient added" });
    } catch (err) {
      console.error("Recipient add error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/recipients/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM recipients WHERE id=$1", [req.params.id]);
      res.json({ message: "Recipient removed" });
    } catch (err) {
      console.error("Recipient delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---- ADMIN USERS ----
app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put(
  "/api/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!["user", "moderate_admin", "main_admin", "admin"].includes(role)) {
        return sendValidationError(res, "Invalid role");
      }
      await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
      await logAdminAction(req, "role_change", "user", id, { role });
      res.json({ message: "Role updated" });
    } catch (err) {
      console.error("Role update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔒 DELETE SINGLE USER — only main_admin can delete, and cannot delete another main_admin
app.delete(
  "/api/admin/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch the user making the request
      const requester = req.user; // added by requireAuth middleware
      if (requester.role !== "main_admin") {
        return res
          .status(403)
          .json({ message: "Only main_admin can delete users" });
      }

      // Get target user
      const target = await pool.query("SELECT role FROM users WHERE id=$1", [
        id,
      ]);
      if (target.rows.length === 0)
        return res.status(404).json({ message: "User not found" });

      if (target.rows[0].role === "main_admin")
        return res
          .status(403)
          .json({ message: "Cannot delete another main_admin" });

      await pool.query("DELETE FROM users WHERE id=$1", [id]);
      await logAdminAction(req, "delete", "user", id);
      res.json({ message: "🗑️ User deleted successfully" });
    } catch (err) {
      console.error("❌ User delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔒 BULK DELETE USERS — only main_admin can bulk delete, and skips main_admin users
app.post(
  "/api/admin/users/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No user IDs provided" });
      }

      // Fetch requester
      const requester = req.user;
      if (requester.role !== "main_admin") {
        return res
          .status(403)
          .json({ message: "Only main_admin can bulk delete users" });
      }

      // Exclude main_admin users from deletion
      const { rows } = await pool.query(
        "SELECT id FROM users WHERE id = ANY($1) AND role != 'main_admin'",
        [ids]
      );

      if (rows.length === 0) {
        return res.status(400).json({ message: "No eligible users to delete" });
      }

      const eligibleIds = rows.map((r) => r.id);
      await pool.query("DELETE FROM users WHERE id = ANY($1)", [eligibleIds]);
      await logAdminAction(req, "bulk_delete", "user", null, {
        ids: eligibleIds,
        count: eligibleIds.length,
      });

      res.json({
        message: `🗑️ Deleted ${eligibleIds.length} users successfully`,
      });
    } catch (err) {
      console.error("❌ Bulk delete users error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🗑️ BULK DELETE SC/ST Submissions
app.post(
  "/api/admin/scst-submissions/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      // Delete all selected submissions
      await pool.query("DELETE FROM scst_submissions WHERE id = ANY($1)", [ids]);
      await logAdminAction(req, "bulk_delete", "scst_submission", null, {
        ids,
        count: ids.length,
      });

      res.json({
        message: `🗑️ Deleted ${ids.length} SC/ST submissions successfully`,
      });
    } catch (err) {
      
      res.status(500).json({ message: "Server error during bulk delete" });
    }
  }
);

app.post(
  "/api/user/update-profile",
  requireAuth,
  uploadProfile.single("photo"),
  async (req, res) => {
    try {
      const u = req.user;
      const d = req.body;
      const newPhotoUrl = req.file ? req.file.path : null;
      const name = normalizeRequiredText(d.name, 100);
      const phone = normalizeOptionalText(d.phone, 50);
      const city = normalizeOptionalText(d.city, 100);
      const marketingOptIn = normalizeBooleanInput(d.marketing_opt_in);
      if (!name) return sendValidationError(res, "Name is required");

      // Fetch old photo
      const oldPhotoRes = await pool.query(
        "SELECT photo_url FROM users WHERE id = $1",
        [u.id]
      );
      const oldPhotoUrl = oldPhotoRes.rows[0]?.photo_url || null;

      // Update user info
      await pool.query(
        `UPDATE users
       SET name=$1, phone=$2, city=$3, photo_url=COALESCE($4, photo_url), marketing_opt_in=$5
       WHERE id=$6`,
        [name, phone, city, newPhotoUrl, marketingOptIn, u.id]
      );

      // 🧹 Delete old Cloudinary photo if replaced
      if (newPhotoUrl && oldPhotoUrl) {
        try {
          const oldPublicId = oldPhotoUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(
            `ravidassia_profile_dp/${oldPublicId}`
          );
          console.log(`🧹 Deleted old profile photo: ${oldPublicId}`);
        } catch (err) {
          console.warn("⚠️ Failed to delete old profile photo:", err.message);
        }
      }

      res.json({
        message: "✅ Profile updated successfully!",
        photo_url: newPhotoUrl || oldPhotoUrl,
        marketing_opt_in: marketingOptIn,
      });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---- CONTENT REQUEST ----
// Public submission
app.post("/api/content-requests", formRateLimit, async (req, res) => {
  try {
    const name = normalizeRequiredText(req.body?.name, 100);
    const email = normalizeEmail(req.body?.email);
    const contentUrl = sanitizeUrl(req.body?.content_url);
    const requestType = normalizeRequiredText(
      req.body?.type || req.body?.request_type,
      20
    );
    const details = normalizeOptionalText(
      sanitizeRichText(req.body?.details),
      4000
    );
    const consentGiven = normalizeBooleanInput(req.body?.consent_given);
    const marketingOptIn = normalizeBooleanInput(req.body?.marketing_opt_in);
    if (!name || !email || !contentUrl || !requestType)
      return res.status(400).json({ message: "All fields required" });
    if (!isValidEmail(email)) {
      return sendValidationError(res, "Valid email required");
    }
    if (!consentGiven) {
      return sendValidationError(res, "Consent is required");
    }

    await pool.query(
      `INSERT INTO content_requests
        (name, email, content_url, request_type, details, status, consent_given, consent_version, consent_given_at, marketing_opt_in)
       VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, NOW(), $8)`,
      [
        name,
        email,
        contentUrl,
        requestType,
        details,
        consentGiven,
        CURRENT_POLICY_VERSION,
        marketingOptIn,
      ]
    );

    res.json({
      message: "Request submitted successfully!",
      privacy_contact_email: PRIVACY_CONTACT_EMAIL,
    });
  } catch (err) {
    console.error("Content request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin view
app.get(
  "/api/admin/content-requests",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM content_requests ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Fetch content requests error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Admin delete
app.delete(
  "/api/admin/content-requests/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM content_requests WHERE id=$1", [
        req.params.id,
      ]);
      await logAdminAction(req, "delete", "content_request", req.params.id);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error("Delete content request error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/content-requests/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      await pool.query("DELETE FROM content_requests WHERE id = ANY($1)", [ids]);
      await logAdminAction(req, "bulk_delete", "content_request", null, {
        ids,
        count: ids.length,
      });

      res.json({
        message: `Deleted ${ids.length} content requests successfully`,
      });
    } catch (err) {
      console.error("Bulk delete content requests error:", err);
      res.status(500).json({ message: "Server error during bulk delete" });
    }
  }
);

app.post("/api/privacy-requests", formRateLimit, async (req, res) => {
  try {
    const user = decodeUserIfAny(req);
    const requestType = normalizeRequiredText(req.body?.request_type, 40);
    const name = normalizeRequiredText(req.body?.name, 120);
    const email = normalizeEmail(req.body?.email);
    const message = normalizeOptionalText(
      sanitizeRichText(req.body?.message),
      4000
    );

    if (!["access", "correction", "deletion", "account_deletion"].includes(requestType)) {
      return sendValidationError(res, "Invalid request type");
    }
    if (!name || !email || !message) {
      return sendValidationError(res, "All fields required");
    }
    if (!isValidEmail(email)) {
      return sendValidationError(res, "Valid email required");
    }

    const insert = await pool.query(
      `INSERT INTO privacy_requests
        (request_type, name, email, user_id, message, status)
       VALUES ($1,$2,$3,$4,$5,'open')
       RETURNING *`,
      [requestType, name, email, user?.id || null, message]
    );

    if (requestType === "account_deletion" && user?.id) {
      await pool.query(
        "UPDATE users SET deletion_requested_at = NOW() WHERE id = $1",
        [user.id]
      );
    }

    res.status(201).json({
      message: "Privacy request submitted successfully",
      request: insert.rows[0],
      privacy_contact_email: PRIVACY_CONTACT_EMAIL,
    });
  } catch (err) {
    console.error("Privacy request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get(
  "/api/admin/privacy-requests",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM privacy_requests ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Privacy requests fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.patch(
  "/api/admin/privacy-requests/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const status = normalizeRequiredText(req.body?.status, 30) || "resolved";
      const adminNotes = normalizeOptionalText(req.body?.admin_notes, 4000);
      if (!["open", "in_review", "resolved", "closed"].includes(status)) {
        return sendValidationError(res, "Invalid status");
      }

      const result = await pool.query(
        `UPDATE privacy_requests
         SET status=$1, admin_notes=$2, resolved_at=CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE NULL END, resolved_by=$3
         WHERE id=$4
         RETURNING *`,
        [status, adminNotes, req.user.id, req.params.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Privacy request not found" });
      }

      await logAdminAction(req, "resolve", "privacy_request", req.params.id, {
        status,
      });

      res.json({
        message: "Privacy request updated successfully",
        request: result.rows[0],
      });
    } catch (err) {
      console.error("Privacy request update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.delete(
  "/api/admin/privacy-requests/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM privacy_requests WHERE id=$1", [req.params.id]);
      await logAdminAction(req, "delete", "privacy_request", req.params.id);
      res.json({ message: "Privacy request deleted successfully" });
    } catch (err) {
      console.error("Privacy request delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/privacy-requests/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return sendValidationError(res, "No IDs provided");
      }

      await pool.query("DELETE FROM privacy_requests WHERE id = ANY($1)", [ids]);
      await logAdminAction(req, "bulk_delete", "privacy_request", null, {
        ids,
        count: ids.length,
      });
      res.json({ message: `Deleted ${ids.length} privacy requests successfully` });
    } catch (err) {
      console.error("Privacy request bulk delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.post(
  "/api/admin/audit-events",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const action = normalizeRequiredText(req.body?.action, 100);
      const entityType = normalizeRequiredText(req.body?.entity_type, 100);
      const entityId = normalizeOptionalText(req.body?.entity_id, 100);
      const details = req.body?.details || {};
      if (!action || !entityType) {
        return sendValidationError(res, "Action and entity type are required");
      }
      await logAdminAction(req, action, entityType, entityId, details);
      res.json({ message: "Audit event recorded" });
    } catch (err) {
      console.error("Audit event error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
// -------------------- BLOG ROUTES --------------------
// 🗑️ BULK DELETE BLOGS
app.post(
  "/api/admin/blogs/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No blog IDs provided" });
      }
      await pool.query("DELETE FROM blog_posts WHERE id = ANY($1)", [ids]);
      res.json({ message: `🗑️ Deleted ${ids.length} blogs successfully` });
    } catch (err) {
      console.error("❌ Bulk delete blogs error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
// 🟢 Public: get all published blogs with category + author info
app.get("/api/blogs", async (req, res) => {
  try {
    const { category } = req.query;

    const query = category
      ? `
        SELECT 
          b.id, 
          b.title, 
          b.slug, 
          b.excerpt, 
          b.image_url, 
          b.status, 
          b.created_at, 
          b.views,
          c.name AS category_name,
          u.name AS author_name
        FROM blog_posts b
        LEFT JOIN blog_categories c ON b.category_id = c.id
        LEFT JOIN users u ON b.author_id = u.id
        WHERE b.category_id = $1 AND b.status = 'published'
        ORDER BY b.created_at DESC
      `
      : `
        SELECT 
          b.id, 
          b.title, 
          b.slug, 
          b.excerpt, 
          b.image_url, 
          b.status, 
          b.created_at, 
          b.views,
          c.name AS category_name,
          u.name AS author_name
        FROM blog_posts b
        LEFT JOIN blog_categories c ON b.category_id = c.id
        LEFT JOIN users u ON b.author_id = u.id
        WHERE b.status = 'published'
        ORDER BY b.created_at DESC
      `;

    const params = category ? [category] : [];
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Public: get single blog by slug (with category and author) + increment views
app.get("/api/blogs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // 🔹 1. Fetch blog details
    const query = `
      SELECT 
        b.*, 
        c.name AS category_name, 
        c.id AS category_id, 
        u.name AS author_name
      FROM blog_posts b
      LEFT JOIN blog_categories c ON b.category_id = c.id
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.slug = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [slug]);

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Blog not found" });

    const blog = result.rows[0];

    // 🔹 2. Increment views count
    await pool.query(`UPDATE blog_posts SET views = views + 1 WHERE id = $1`, [
      blog.id,
    ]);

    // 🔹 3. Return updated view count
    blog.views = blog.views + 1;

    res.json(blog);
  } catch (err) {
    console.error("❌ Error fetching blog detail:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin: Get all blogs (with category + author info)
app.get("/api/admin/blogs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.slug,
        b.status,
        b.views,
        b.created_at,
        b.updated_at,
        b.image_url,
        c.name AS category_name,
        u.name AS author_name
      FROM blog_posts b
      LEFT JOIN blog_categories c ON b.category_id = c.id
      LEFT JOIN users u ON b.author_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Admin blogs fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/blogs", requireAuth, requireAdmin, async (req, res) => {
  try {
    let {
      title,
      slug,
      content,
      excerpt,
      image_url,
      category_id,
      tags,
      status,
    } = req.body;
    const author_id = req.user.id;

    // ✅ Auto-generate slug if not provided
    if (!slug || slug.trim() === "") {
      slug = title
        ? title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")
        : "untitled-" + Date.now();
    }

    // ✅ Ensure slug uniqueness
    const check = await pool.query(
      "SELECT slug FROM blog_posts WHERE slug = $1",
      [slug]
    );
    if (check.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // ✅ Defaults
    if (!category_id) category_id = 1;
    if (!status) status = "published";
    title = normalizeRequiredText(title, 255);
    excerpt = sanitizeRichText(excerpt || "");
    content = sanitizeRichText(content || "");

    // ✅ Insert and return the new blog
    const insertRes = await pool.query(
      `INSERT INTO blog_posts 
        (title, slug, content, excerpt, image_url, category_id, author_id, tags, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, title, slug, status, image_url, created_at`,
      [
        title,
        slug,
        content,
        excerpt,
        image_url,
        category_id,
        author_id,
        tags || [],
        status,
      ]
    );

    const newBlog = insertRes.rows[0];
    console.log(`📝 Blog created by ${req.user.email}: ${title} (${slug})`);
    res.json({
      message: "✅ Blog post created successfully!",
      blog: newBlog, // <-- return blog object here
    });
  } catch (err) {
    console.error("❌ Blog create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/blogs/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    let { title, content, excerpt, image_url, category_id, status } =
      req.body;
    title = normalizeRequiredText(title, 255);
    excerpt = sanitizeRichText(excerpt || "");
    content = sanitizeRichText(content || "");

    // ✅ Update existing blog
    await pool.query(
      `UPDATE blog_posts
       SET title=$1, content=$2, excerpt=$3, image_url=$4, 
           category_id=$5, status=$6, updated_at=NOW()
       WHERE id=$7`,
      [title, content, excerpt, image_url, category_id, status, req.params.id]
    );

    // ✅ Fetch the updated row to return to frontend
    const result = await pool.query(
      `SELECT bp.*, 
              bc.name AS category_name, 
              u.name AS author_name
       FROM blog_posts bp
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.id = $1`,
      [req.params.id]
    );

    res.json({
      message: "✅ Blog post updated successfully!",
      blog: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Blog update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin delete blog + all related comments
app.delete(
  "/api/admin/blogs/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1️⃣ Delete the blog (cascade handles comments)
      const result = await pool.query(
        "DELETE FROM blog_posts WHERE id=$1 RETURNING *",
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json({
        message: "🗑️ Blog and all related comments deleted successfully",
      });
    } catch (err) {
      console.error("❌ Admin blog delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🖼️ Admin: Upload blog image
app.post(
  "/api/admin/blogs/upload",
  requireAuth,
  requireAdmin,
  makeUploader("ravidassia_blog_images").single("image"),
  async (req, res) => {
    try {
      if (!req.file?.path)
        return res.status(400).json({ message: "No file uploaded" });

      res.json({ image_url: req.file.path });
    } catch (err) {
      console.error("❌ Blog image upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// ==========================================================
// 🗨️ COMMENTS SYSTEM (Blogs + Articles, unified)
// ==========================================================

// 🟢 Get comments (blogs or articles)
app.get("/api/:type/:id/comments", async (req, res) => {
  try {
    const { type, id } = req.params;

    const { table, field } = getSafePublicCommentFields(type);

    const result = await pool.query(
      `SELECT
         c.id,
         c.parent_id,
         c.user_id,
         c.name,
         c.comment_text,
         c.created_at,
         u.photo_url
       FROM ${table} c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE ${field}=$1 
       AND is_approved=true 
       AND COALESCE(c.deleted_by_user,false)=false
       ORDER BY c.created_at ASC`,
      [id]
    );

    const comments = result.rows.filter((c) => !c.parent_id);
    const replies = result.rows.filter((c) => c.parent_id);

    comments.forEach((c) => {
      c.replies = replies.filter((r) => r.parent_id === c.id);
    });

    res.json(comments);
  } catch (err) {
    console.error("❌ Fetch comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Add a comment or reply (blogs or articles)
app.post("/api/:type/:id/comments", commentRateLimit, async (req, res) => {
  try {
    const { type, id } = req.params;
    const authUser = decodeUserIfAny(req);
    const { parent_id } = req.body || {};
    const commentText = normalizeRequiredText(
      sanitizeRichText(req.body?.comment_text),
      5000
    );
    const consentGiven = normalizeBooleanInput(req.body?.consent_given);
    const { table, field } = getSafePublicCommentFields(type);
    const name = authUser?.name || normalizeRequiredText(req.body?.name, 120);
    const email = authUser?.email || normalizeEmail(req.body?.email);

    if (!commentText) {
      return sendValidationError(res, "Comment text is required");
    }
    if (!authUser) {
      if (!name || !email) {
        return sendValidationError(res, "Name and email are required");
      }
      if (!isValidEmail(email)) {
        return sendValidationError(res, "Valid email required");
      }
      if (!consentGiven) {
        return sendValidationError(res, "Consent is required");
      }
    }

    // ✅ Parent check
    if (parent_id) {
      const parentCheck = await pool.query(
        `SELECT id FROM ${table} WHERE id=$1`,
        [parent_id]
      );
      if (parentCheck.rowCount === 0)
        return res.status(400).json({ message: "Parent comment not found" });
    }

    // ✅ Insert comment
    const result = await pool.query(
      `INSERT INTO ${table} (${field}, user_id, name, email, comment_text, parent_id, consent_given, consent_version, consent_given_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       RETURNING *`,
      [
        id,
        authUser?.id || null,
        name,
        email || null,
        commentText,
        parent_id || null,
        authUser ? true : consentGiven,
        CURRENT_POLICY_VERSION,
      ]
    );

    res.json({
      message: "✅ Comment added successfully!",
      comment: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Comment insert error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 USER SOFT DELETE (own comment only)
app.patch("/api/:type/comments/:id/delete", requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;

    const { table } = getSafePublicCommentFields(type);

    const check = await pool.query(`SELECT user_id FROM ${table} WHERE id=$1`, [
      id,
    ]);
    if (check.rowCount === 0)
      return res.status(404).json({ message: "Comment not found" });

    const ownerId = check.rows[0].user_id;
    if (ownerId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });

    await pool.query(`UPDATE ${table} SET deleted_by_user=true WHERE id=$1`, [
      id,
    ]);
    res.json({ message: "🗑️ Comment soft-deleted by user" });
  } catch (err) {
    console.error("❌ Soft delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 ADMIN HARD DELETE (cascade replies)
app.delete(
  "/api/:type/comments/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { type, id } = req.params;
      const { table } = getSafePublicCommentFields(type);

      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
      await logAdminAction(req, "delete", `${type}_comment`, id);
      res.json({ message: "🗑️ Comment deleted by admin (cascade applied)" });
    } catch (err) {
      console.error("❌ Admin delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---- BLOG CATEGORIES ----
// 🗑️ BULK DELETE CATEGORIES
app.post(
  "/api/admin/categories/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No category IDs provided" });
      }
      await pool.query("DELETE FROM blog_categories WHERE id = ANY($1)", [ids]);
      res.json({ message: `🗑️ Deleted ${ids.length} categories successfully` });
    } catch (err) {
      console.error("❌ Bulk delete categories error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
// 🗑️ BULK DELETE RECIPIENTS
app.post(
  "/api/admin/recipients/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No recipient IDs provided" });
      }
      await pool.query("DELETE FROM recipients WHERE id = ANY($1)", [ids]);
      res.json({ message: `🗑️ Deleted ${ids.length} recipients successfully` });
    } catch (err) {
      console.error("❌ Bulk delete recipients error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
app.get(
  "/api/admin/categories",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM blog_categories ORDER BY id ASC"
    );
    res.json(result.rows);
  }
);

app.post(
  "/api/admin/categories",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { name, slug, parent_id, description } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const slugValue =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    await pool.query(
      "INSERT INTO blog_categories (name, slug, parent_id, description) VALUES ($1,$2,$3,$4)",
      [name, slugValue, parent_id || null, description || null]
    );
    res.json({ message: "✅ Category created" });
  }
);

app.put(
  "/api/admin/categories/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { name, slug, parent_id, description } = req.body;
    await pool.query(
      "UPDATE blog_categories SET name=$1, slug=$2, parent_id=$3, description=$4 WHERE id=$5",
      [name, slug, parent_id || null, description || null, req.params.id]
    );
    res.json({ message: "✅ Category updated" });
  }
);

app.delete(
  "/api/admin/categories/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await pool.query("DELETE FROM blog_categories WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ message: "🗑 Category deleted" });
  }
);

// 🟢 Public: get all blog categories (for filters)
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, slug, parent_id FROM blog_categories ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===========================
// 🗑️ BULK DELETE MENUS
app.post(
  "/api/admin/menus/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No menu IDs provided" });
      }
      await pool.query("DELETE FROM site_menus WHERE id = ANY($1)", [ids]);
      res.json({ message: `🗑️ Deleted ${ids.length} menus successfully` });
    } catch (err) {
      console.error("❌ Bulk delete menus error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
// 🌐 SITE MENUS MANAGEMENT
// ===========================

// 🟢 Public: Fetch all menus
app.get("/api/menus", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM site_menus ORDER BY parent_id NULLS FIRST, position ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching menus:", err);
    res.status(500).json({ message: "Server error fetching menus" });
  }
});

// 🔒 Admin: Fetch all menus
app.get("/api/admin/menus", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM site_menus ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching admin menus:", err);
    res.status(500).json({ message: "Server error fetching menus" });
  }
});

// 🔒 Admin: Create new menu
app.post("/api/admin/menus", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { label, path, parent_id, position } = req.body;

    if (!label || !path) {
      return res.status(400).json({ message: "Label and path are required" });
    }

    const result = await pool.query(
      `INSERT INTO site_menus (label, path, parent_id, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [label, path, parent_id || null, position || 0]
    );

    res.json({ message: "✅ Menu created successfully", menu: result.rows[0] });
  } catch (err) {
    console.error("Error creating menu:", err);
    res.status(500).json({ message: "Server error creating menu" });
  }
});

// 🔒 Admin: Update menu
app.put("/api/admin/menus/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, path, parent_id, position } = req.body;

    const result = await pool.query(
      `UPDATE site_menus 
       SET label=$1, path=$2, parent_id=$3, position=$4
       WHERE id=$5 RETURNING *`,
      [label, path, parent_id || null, position || 0, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Menu not found" });

    res.json({ message: "✅ Menu updated", menu: result.rows[0] });
  } catch (err) {
    console.error("Error updating menu:", err);
    res.status(500).json({ message: "Server error updating menu" });
  }
});

// 🔒 Admin: Delete menu
app.delete(
  "/api/admin/menus/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM site_menus WHERE id=$1", [id]);
      res.json({ message: "🗑️ Menu deleted successfully" });
    } catch (err) {
      console.error("Error deleting menu:", err);
      res.status(500).json({ message: "Server error deleting menu" });
    }
  }
);

// 🌍 Public - get personalities with filters
app.post(
  "/api/admin/temples/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No temple IDs provided" });
      }

      await pool.query("DELETE FROM global_temples WHERE id = ANY($1)", [ids]);
      res.json({ message: `Deleted ${ids.length} temples successfully` });
    } catch (err) {
      console.error("Bulk delete temples error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get("/api/admin/temples", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM global_temples ORDER BY featured DESC, display_order ASC, country ASC, city ASC, name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin temples fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/temples", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      country,
      city,
      location_label,
      address,
      description,
      image_url,
      gallery_urls,
      maps_url,
      website_url,
      established_year,
      contact_info,
      seva_info,
      featured,
      display_order,
    } = req.body || {};

    if (!name || !country || !city) {
      return res.status(400).json({ message: "Name, country, and city are required" });
    }

    const result = await pool.query(
      `
        INSERT INTO global_temples
          (name, country, city, location_label, address, description, image_url, gallery_urls, maps_url, website_url, established_year, contact_info, seva_info, featured, display_order, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        RETURNING *
      `,
      [
        name,
        country,
        city,
        location_label || null,
        address || null,
        description || null,
        image_url || null,
        Array.isArray(gallery_urls) ? gallery_urls.filter(Boolean) : [],
        maps_url || null,
        website_url || null,
        established_year ? Number(established_year) : null,
        contact_info || null,
        seva_info || null,
        Boolean(featured),
        Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
      ]
    );

    res.json({ message: "Temple added successfully", temple: result.rows[0] });
  } catch (err) {
    console.error("Temple create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/temples/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      country,
      city,
      location_label,
      address,
      description,
      image_url,
      gallery_urls,
      maps_url,
      website_url,
      established_year,
      contact_info,
      seva_info,
      featured,
      display_order,
    } = req.body || {};

    if (!name || !country || !city) {
      return res.status(400).json({ message: "Name, country, and city are required" });
    }

    const result = await pool.query(
      `
        UPDATE global_temples
        SET
          name=$1,
          country=$2,
          city=$3,
          location_label=$4,
          address=$5,
          description=$6,
          image_url=$7,
          gallery_urls=$8,
          maps_url=$9,
          website_url=$10,
          established_year=$11,
          contact_info=$12,
          seva_info=$13,
          featured=$14,
          display_order=$15,
          updated_at=NOW()
        WHERE id=$16
        RETURNING *
      `,
      [
        name,
        country,
        city,
        location_label || null,
        address || null,
        description || null,
        image_url || null,
        Array.isArray(gallery_urls) ? gallery_urls.filter(Boolean) : [],
        maps_url || null,
        website_url || null,
        established_year ? Number(established_year) : null,
        contact_info || null,
        seva_info || null,
        Boolean(featured),
        Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
        req.params.id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Temple not found" });
    }

    res.json({ message: "Temple updated successfully", temple: result.rows[0] });
  } catch (err) {
    console.error("Temple update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete(
  "/api/admin/temples/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM global_temples WHERE id=$1", [req.params.id]);
      res.json({ message: "Temple deleted successfully" });
    } catch (err) {
      console.error("Temple delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get("/api/personalities", async (req, res) => {
  try {
    const { caste, region, category, sc_st_type } = req.query;
    let query = "SELECT * FROM famous_personalities WHERE 1=1";
    const params = [];

    if (caste) {
      params.push(caste);
      query += ` AND caste=$${params.length}`;
    }
    if (region) {
      params.push(region);
      query += ` AND region=$${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category=$${params.length}`;
    }
    if (sc_st_type) {
      params.push(sc_st_type);
      query += ` AND sc_st_type=$${params.length}`;
    }

    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching personalities:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin CRUD
app.get(
  "/api/admin/personalities",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM famous_personalities ORDER BY id DESC"
    );
    res.json(result.rows);
  }
);

app.post(
  "/api/admin/personalities",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const {
      name,
      caste,
      category,
      region,
      sc_st_type,
      short_bio,
      full_bio,
      photo_url,
    } = req.body;
    await pool.query(
      `INSERT INTO famous_personalities 
     (name, caste, category, region, sc_st_type, short_bio, full_bio, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        name,
        caste,
        category,
        region,
        sc_st_type,
        short_bio,
        full_bio,
        photo_url,
      ]
    );
    res.json({ message: "✅ Personality added successfully" });
  }
);

app.put(
  "/api/admin/personalities/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const {
      name,
      caste,
      category,
      region,
      sc_st_type,
      short_bio,
      full_bio,
      photo_url,
    } = req.body;
    await pool.query(
      `UPDATE famous_personalities SET
     name=$1, caste=$2, category=$3, region=$4, sc_st_type=$5,
     short_bio=$6, full_bio=$7, photo_url=$8 WHERE id=$9`,
      [
        name,
        caste,
        category,
        region,
        sc_st_type,
        short_bio,
        full_bio,
        photo_url,
        req.params.id,
      ]
    );
    res.json({ message: "✅ Updated successfully" });
  }
);

app.delete(
  "/api/admin/personalities/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await pool.query("DELETE FROM famous_personalities WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ message: "🗑️ Deleted successfully" });
  }
);

// 🗑️ BULK DELETE personalities
app.post(
  "/api/admin/personalities/bulk-delete",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      await pool.query(
        "DELETE FROM famous_personalities WHERE id = ANY($1)",
        [ids]
      );

      res.json({
        message: `🗑️ Deleted ${ids.length} personalities successfully`,
      });
    } catch (err) {
      console.error("❌ Bulk delete personalities error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/// =========================================
// 📝 Static Articles Management
// =========================================

// 🌍 Public – Get article by slug
app.get("/api/articles/:slug", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM static_articles WHERE slug=$1", [
      req.params.slug,
    ]);
    if (r.rowCount === 0)
      return res.status(404).json({ message: "Article not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin – Get all articles
app.get("/api/admin/articles", requireAuth, requireAdmin, async (_, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM static_articles ORDER BY id DESC"
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin – Create new article
app.post("/api/admin/articles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const title = normalizeRequiredText(req.body?.title, 255);
    const slug = normalizeRequiredText(req.body?.slug, 255);
    const content = sanitizeRichText(req.body?.content || "");
    const image_url = req.body?.image_url || null;
    await pool.query(
      `INSERT INTO static_articles (title, slug, content, image_url)
       VALUES ($1,$2,$3,$4)`,
      [title, slug, content, image_url]
    );
    res.json({ message: "✅ Article created successfully!" });
  } catch (err) {
    console.error("Error creating article:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin – Update article
app.put(
  "/api/admin/articles/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const title = normalizeRequiredText(req.body?.title, 255);
      const slug = normalizeRequiredText(req.body?.slug, 255);
      const content = sanitizeRichText(req.body?.content || "");
      const image_url = req.body?.image_url || null;
      await pool.query(
        `UPDATE static_articles 
       SET title=$1, slug=$2, content=$3, image_url=$4, updated_at=NOW()
       WHERE id=$5`,
        [title, slug, content, image_url, req.params.id]
      );
      res.json({ message: "✅ Article updated!" });
    } catch (err) {
      console.error("Error updating article:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔒 Admin – Delete article
app.delete(
  "/api/admin/articles/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM static_articles WHERE id=$1", [
        req.params.id,
      ]);
      res.json({ message: "🗑️ Article deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔒 ADMIN: Send reply email + WhatsApp message
app.post(
  "/api/admin/scst-reply",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        submissionId,
        name,
        email,
        country,
        phone,
        groupLink,
        rules: submittedRules,
      } = req.body;
      if (!email || !country || !groupLink)
        return res
          .status(400)
          .json({ message: "Email, country, and group link are required" });

      // 🟡 1️⃣ Dynamic Welcome Section
      const welcomeText = `🙏 Welcome to the Ravidassia Abroad ${country} WhatsApp group!

This group is a dedicated space for all Chamars living in ${country} to connect, share resources, and support one another. Our goal is to create a strong, united community where members can freely exchange advice on settling into life in ${country}, navigating job opportunities, and dealing with challenges that come our way.

We encourage discussions on cultural events, education, career development, and community issues. Whether you’re new to the country or have been here for years, this group is here to help you build connections, find guidance, and create lasting friendships.

Together, we can ensure that our community thrives and that every member feels supported. 🌍`;

      // 🟡 2️⃣ Group Rules (cleaned list)
      const defaultRules = [
        "Always keep discussions relevant to the community and avoid off-topic or spam posts.",
        "Respect all members and avoid hate speech, casteism, or political arguments.",
        "Do not share fake news, unverified forwards, or large media files.",
        "Keep long personal conversations private and use direct messages.",
        "Ask before adding anyone new to the group.",
        "Express gratitude privately and avoid flooding chat with thank you messages.",
      ];
      const rules =
        Array.isArray(submittedRules) && submittedRules.length > 0
          ? submittedRules.map((rule) => String(rule).trim()).filter(Boolean)
          : defaultRules;

      //🟡 3️⃣ Build Email HTML Template
      const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#ffcc00;">Jai Gurudev Ji, ${name}</h2>
        <p style="white-space:pre-line;">${welcomeText}</p>
        <p><strong>WhatsApp Group Link:</strong> 
          <a href="${groupLink}" target="_blank" style="color:#007bff;">Join Here</a>
        </p>
        <h3>Group Rules:</h3>
        <ul>
          ${rules.map((r) => `<li>${r}</li>`).join("")}
        </ul>
        <p>If you see fewer members right now, please be patient. We are adding more daily.</p>
        <p style="margin-top:20px;">Warm regards,<br/><strong>The Ravidassia Abroad Team</strong></p>
      </div>
    `;

      try {
        const sent = await resend.emails.send({
          from: "Ravidassia Abroad <onboarding@resend.dev>",
          to: email,
          subject: `Welcome to Ravidassia Abroad ${country} WhatsApp Group`,
          html,
        });
        console.log("✅ Reply email sent via Resend:", sent.id || sent);
      } catch (err) {
        console.error("❌ Resend email error:", err);
      }

      // 🟡 5️⃣ Build WhatsApp Message (same content as plain text)
      const whatsappMessage = `
Jai Gurudev Ji ${name}!

Welcome to the Ravidassia Abroad ${country} WhatsApp group!

This group is a dedicated space for all Chamars living in ${country} to connect, share resources, and support one another.
Our goal is to create a strong, united community where members can freely exchange advice on settling into life in ${country}, navigating job opportunities, and dealing with challenges that come our way.

We encourage discussions on cultural events, education, career development, and community issues.
Whether you’re new to the country or have been here for years, this group is here to help you build connections, find guidance, and create lasting friendships.

Together, we can ensure that our community thrives and that every member feels supported.

Join Group: ${groupLink}

Group Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

If you see fewer members right now, please be patient. We are adding more daily.

Warm regards,
The Ravidassia Abroad Team
`;

      const normalizedPhone = String(phone || "").replace(/\D/g, "");
      const whatsapp_link = normalizedPhone
        ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappMessage)}`
        : null;

      if (submissionId) {
        await pool.query(
          "UPDATE scst_submissions SET replied = true, replied_at = NOW() WHERE id = $1",
          [submissionId]
        );
        await logAdminAction(req, "reply", "scst_submission", submissionId, {
          email,
          country,
        });
      } else {
        await pool.query(
          "UPDATE scst_submissions SET replied = true, replied_at = NOW() WHERE email = $1",
          [email]
        );
        await logAdminAction(req, "reply", "scst_submission", null, {
          email,
          country,
        });
      }

      // 🟡 6️⃣ Respond to Frontend
      res.json({
        message: "Reply email sent successfully!",
        whatsapp_link,
      });
    } catch (err) {
      console.error("❌ SCST reply error:", err);
      res.status(500).json({ message: "Failed to send reply" });
    }
  }
);

// ---- START SERVER ----
async function startServer() {
  try {
    await initDB();
    await pool.query("SELECT 1");
    serverState.dbReady = true;
    serverState.lastDbError = null;
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    serverState.dbReady = false;
    serverState.lastDbError = err.message;
    console.error("DB init failed:", err);
    process.exit(1);
  }
}

startServer();
