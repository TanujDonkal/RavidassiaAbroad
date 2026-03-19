import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";

dotenv.config();

const { Pool } = pkg;
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpStore = new Map();

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

// Helper function for reusable uploaders
function makeUploader(folder) {
  return multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  });
}

// Dedicated uploaders for each feature
const uploadProfile = makeUploader("ravidassia_profile_dp");
const uploadMatrimonial = makeUploader("ravidassia_matrimonials");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ravidassia_matrimonials",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const upload = multer({ storage });
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

// 🟢 Step 1: Request password reset (send OTP)

// 🟢 Step 1: Request password reset (send OTP)
app.post("/api/auth/request-reset", async (req, res) => {
  try {
    const { email } = req.body;  // <-- IMPORTANT
    if (!email) return res.status(400).json({ message: "Email required" });

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
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

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

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    email = email.toLowerCase();
    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length)
      return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3)",
      [name, email, hash]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    email = email.toLowerCase();

    // ✅ Now fetch photo_url, phone, and city as well
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash, photo_url, phone, city FROM users WHERE email=$1",
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

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
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
        "INSERT INTO users (name,email,password_hash,photo_url) VALUES ($1,$2,$3,$4) RETURNING *",
        [name, email.toLowerCase(), hash, picture]
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
      "SELECT id, name, email, role, photo_url, phone, city, created_at FROM users WHERE id=$1",
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
app.post("/api/scst-submissions", async (req, res) => {
  try {
    const u = decodeUserIfAny(req);
    const userId = u?.id ?? null;
    const {
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
    } = req.body || {};

    if (!name || !email || !country)
      return res
        .status(400)
        .json({ message: "name, email, and country required" });

    await pool.query(
      `INSERT INTO scst_submissions
       (user_id,name,email,country,state,city,phone,platform,instagram,proof,message,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')`,
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
  uploadMatrimonial.single("photo"),
  async (req, res) => {
    try {
      const d = req.body || {};
      const userId = decodeUserIfAny(req)?.id ?? null;

      // Normalize fields from frontend
      d.origin_state = d.home_state_india || d.origin_state;
      d.current_status = d.status_type || d.current_status;

      // Validate minimum required fields
      if (!d.name?.trim() || !d.email?.trim() || !d.country_living?.trim()) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const dobValue = d.dob?.trim() ? d.dob : null;
      const photoUrl = req.file?.path || d.photo_url || null;

      // Check if this user already has a submission
      const existing = await pool.query(
        "SELECT id FROM matrimonial_submissions WHERE user_id=$1",
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
            privacy_accepted=$32, photo_url=$33, religion_beliefs=$34
          WHERE user_id=$35`,
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
            userId,
          ]
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
           partner_country, privacy_accepted, photo_url, religion_beliefs)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,
           $8,$9,$10,$11,$12,$13,
           $14,$15,$16,$17,$18,$19,
           $20,$21,$22,$23,$24,$25,
           $26,$27,$28,$29,$30,$31,
           $32,$33,$34,$35)`,
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
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error("Matrimonial delete error:", err);
      res.status(500).json({ message: "Server error" });
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
    const { id } = req.params;
    const { role } = req.body;
    await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
    res.json({ message: "Role updated" });
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
  uploadProfile.single("photo"),
  async (req, res) => {
    try {
      const u = decodeUserIfAny(req);
      if (!u) return res.status(401).json({ message: "Unauthorized" });

      const d = req.body;
      const newPhotoUrl = req.file ? req.file.path : null;

      // Fetch old photo
      const oldPhotoRes = await pool.query(
        "SELECT photo_url FROM users WHERE id = $1",
        [u.id]
      );
      const oldPhotoUrl = oldPhotoRes.rows[0]?.photo_url || null;

      // Update user info
      await pool.query(
        `UPDATE users
       SET name=$1, phone=$2, city=$3, photo_url=COALESCE($4, photo_url)
       WHERE id=$5`,
        [d.name, d.phone, d.city, newPhotoUrl, u.id]
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
      });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ---- CONTENT REQUEST ----
// Public submission
app.post("/api/content-requests", async (req, res) => {
  try {
    const { name, email, content_url, type, details } = req.body || {};
    if (!name || !email || !content_url || !type)
      return res.status(400).json({ message: "All fields required" });

    await pool.query(
      `INSERT INTO content_requests (name, email, content_url, request_type, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, content_url, type, details]
    );

    res.json({ message: "Request submitted successfully!" });
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
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error("Delete content request error:", err);
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
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.put("/api/admin/blogs/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, image_url, category_id, status } =
      req.body;

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
    res.status(500).json({ message: err.message || "Server error" });
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

    const table = type === "articles" ? "article_comments" : "blog_comments";
    const field = type === "articles" ? "article_id" : "post_id";

    const result = await pool.query(
      `SELECT * FROM ${table}
       WHERE ${field}=$1 
       AND is_approved=true 
       AND deleted_by_user=false
       ORDER BY created_at ASC`,
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
app.post("/api/:type/:id/comments", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { user_id, name, email, comment_text, parent_id } = req.body;

    const table = type === "articles" ? "article_comments" : "blog_comments";
    const field = type === "articles" ? "article_id" : "post_id";

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
      `INSERT INTO ${table} (${field}, user_id, name, email, comment_text, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [id, user_id || null, name, email, comment_text, parent_id || null]
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
app.patch("/api/:type/comments/:id/delete", async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.body.user_id;

    const table = type === "articles" ? "article_comments" : "blog_comments";

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
      const table = type === "articles" ? "article_comments" : "blog_comments";

      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
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
    const { title, slug, content, image_url } = req.body;
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
      const { title, slug, content, image_url } = req.body;
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
      const { name, email, country, phone, groupLink } = req.body;
      if (!email || !country)
        return res.status(400).json({ message: "Email and country required" });

      // 🟡 1️⃣ Dynamic Welcome Section
      const welcomeText = `🙏 Welcome to the Ravidassia Abroad ${country} WhatsApp group!

This group is a dedicated space for all Chamars living in ${country} to connect, share resources, and support one another. Our goal is to create a strong, united community where members can freely exchange advice on settling into life in ${country}, navigating job opportunities, and dealing with challenges that come our way.

We encourage discussions on cultural events, education, career development, and community issues. Whether you’re new to the country or have been here for years, this group is here to help you build connections, find guidance, and create lasting friendships.

Together, we can ensure that our community thrives and that every member feels supported. 🌍`;

      // 🟡 2️⃣ Group Rules (cleaned list)
      const rules = [
        "Always keep discussions relevant to the community — avoid off-topic or spam posts.",
        "Respect all members; absolutely no hate speech, casteism, or political arguments.",
        "Don’t share fake news, unverified forwards, or large media files.",
        "Keep long personal conversations private (use direct messages).",
        "Ask before adding anyone new to the group.",
        "Express gratitude privately — avoid flooding chat with 'thank you' messages.",
      ];

      //🟡 3️⃣ Build Email HTML Template
      const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#ffcc00;">Jai Gurudev Ji, ${name}</h2>
        <p style="white-space:pre-line;">${welcomeText}</p>
        <p><strong>WhatsApp Group Link:</strong> 
          <a href="${groupLink}" target="_blank" style="color:#007bff;">Join Here</a>
        </p>
        <h3>📜 Group Rules:</h3>
        <ul>
          ${rules.map((r) => `<li>${r}</li>`).join("")}
        </ul>
        <p>🕊️ If you see fewer members right now, please be patient — we’re adding more daily.</p>
        <p style="margin-top:20px;">Warm regards,<br/><strong>The Ravidassia Abroad Team</strong></p>
      </div>
    `;

      try {
        const sent = await resend.emails.send({
          from: "Ravidassia Abroad <onboarding@resend.dev>",
          to: email,
          subject: `Welcome to Ravidassia Abroad ${country} WhatsApp Group 🎉`,
          html,
        });
        console.log("✅ Reply email sent via Resend:", sent.id || sent);
      } catch (err) {
        console.error("❌ Resend email error:", err);
      }

      // 🟡 5️⃣ Build WhatsApp Message (same content as plain text)
      const whatsappMessage = `
Jai Gurudev Ji ${name}! 🙏

Welcome to the Ravidassia Abroad ${country} WhatsApp group!

This group is a dedicated space for all Chamars living in ${country} to connect, share resources, and support one another.
Our goal is to create a strong, united community where members can freely exchange advice on settling into life in ${country}, navigating job opportunities, and dealing with challenges that come our way.

We encourage discussions on cultural events, education, career development, and community issues.
Whether you’re new to the country or have been here for years, this group is here to help you build connections, find guidance, and create lasting friendships.

Together, we can ensure that our community thrives and that every member feels supported. 🌍

📎 Join Group: ${groupLink}

📜 Group Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

🕊️ If you see fewer members right now, please be patient — we’re adding more daily.

Warm regards,
The Ravidassia Abroad Team
`;

      const whatsapp_link = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`
        : null;

      // ✅ Mark user as replied in DB
      await pool.query(
        "UPDATE scst_submissions SET replied = true, replied_at = NOW() WHERE email = $1",
        [email]
      );

      // 🟡 6️⃣ Respond to Frontend
      res.json({
        message: "✅ Reply email sent successfully!",
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
