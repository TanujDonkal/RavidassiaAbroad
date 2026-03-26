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
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpStore = new Map();
const rateLimitStore = new Map();
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const resend = new Resend(process.env.RESEND_API_KEY);

// ---- CORS ----
const allowedPatterns = [
  /^http:\/\/localhost(:\d+)?$/, // local dev
  /^https:\/\/([a-z0-9-]+\.)?ravidassiaabroad\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?ravidassia-abroad\.vercel\.app$/,
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedPatterns.some((re) => re.test(origin))) {
        callback(null, true);
      } else {
        console.log("❌ Blocked CORS origin:", origin);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    // ✅ Added PATCH here
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; frame-src https:; font-src 'self' https: data:;"
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

// Safely decode token if exists in Authorization header
function decodeUserIfAny(req) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;

    // Verify and decode JWT using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return the essential user info
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || "user",
    };
  } catch (err) {
    console.warn("⚠️ JWT decode failed:", err.message);
    return null;
  }
}

// ✅ FIXED: Explicitly allow PATCH and preflight for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
    path: "/matrimonial",
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

// ---- HELPERS ----
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  return parts.length === 2 && parts[0].toLowerCase() === "bearer"
    ? parts[1]
    : null;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
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
app.get("/api/health", (req, res) =>
  res.json({ ok: true, app: "Ravidassia API" })
);

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

    res.status(201).json({ message: "User created successfully", token, user });
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

    // ✅ Return the complete user object including photo_url
    delete user.password_hash;
    res.json({ token, user });
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
    res.json({ token, user });
  } catch (err) {
    console.error("❌ Google auth error:", err);
    res.status(400).json({ message: "Invalid Google token" });
  }
});

// ✅ CURRENT USER – return full info from DB
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

      // Normalize fields from frontend
      d.origin_state = d.home_state_india || d.origin_state;
      d.current_status = d.status_type || d.current_status;
      d.partner_expectations = sanitizeRichText(d.partner_expectations || "");

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
            marketing_opt_in=$37
          WHERE user_id=$38`,
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
           consent_given, consent_version, consent_given_at, marketing_opt_in)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12,$13,
            $14,$15,$16,$17,$18,$19,
            $20,$21,$22,$23,$24,$25,
            $26,$27,$28,$29,$30,$31,
            $32,$33,$34,$35,$36,$37,NOW(),$38)`,
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
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});

initDB().catch((err) => console.error("DB init failed:", err));
