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

dotenv.config();

const { Pool } = pkg;
const app = express();

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
// ---- CORS ----
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/, // local dev
        /^https:\/\/([a-z0-9-]+\.)?ravidassiaabroad\.com$/,
        /^https:\/\/([a-z0-9-]+\.)?ravidassia-abroad\.vercel\.app$/,
      ];
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
  JWT_SECRET = "dev_secret",
  SMTP_USER,
  SMTP_PASS,
  ADMIN_NOTIFY_TO,
} = process.env;

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
  auth: { user: SMTP_USER, pass: SMTP_PASS },
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

    await sendNotificationEmail(
      "📬 New SC/ST Connect Submission",
      `
        <h3>New SC/ST Connect Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>City:</strong> ${city || "-"}</p>
        <p><strong>Phone:</strong> ${phone || "-"}</p>
        <p><strong>Platform:</strong> ${platform || "-"}</p>
        <p><strong>Instagram:</strong> ${instagram || "-"}</p>
        <p><strong>Proof:</strong> ${proof || "-"}</p>
        <p><strong>Message:</strong><br>${message || "(none)"}</p>
        <hr>
        <p>Log in to your admin dashboard to review it.</p>
      `
    );

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

app.post(
  "/api/matrimonial-submissions",
  uploadMatrimonial.single("photo"),
  async (req, res) => {
    try {
      const d = req.body || {};
      const userId = decodeUserIfAny(req)?.id ?? null;

      // 🔹 Normalize frontend field names to match DB columns
      d.origin_state = d.home_state_india || d.origin_state;
      d.current_status = d.status_type || d.current_status;

      console.log("🧾 Parsed form body:", d);
      console.log("📸 File info:", req.file);

      // ✅ Safety checks
      if (!d.name?.trim() || !d.email?.trim() || !d.country_living?.trim()) {
        console.log("❌ Missing required:", {
          name: d.name,
          email: d.email,
          country: d.country_living,
        });
        return res.status(400).json({ message: "Required fields missing" });
      }

      // ✅ Normalize date
      const dobValue = d.dob && d.dob.trim() !== "" ? d.dob : null;

      // ✅ Insert into DB
      const insertRes = await pool.query(
        `INSERT INTO matrimonial_submissions
       (user_id, name, gender, age, dob, height, marital_status,
        phone, email, instagram, country_living, state_living, city_living,
        origin_state, origin_district, current_status, education, occupation,
        company_or_institution, income_range, caste, religion_beliefs)
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,
        $19,$20,$21,$22)
       RETURNING id`,
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
          d.caste || null,
          d.religion_beliefs || null,
        ]
      );

      const newId = insertRes.rows[0].id;

      // ✅ Save photo URL
      const photoUrl = req.file?.path || null;
      if (photoUrl) {
        await pool.query(
          "UPDATE matrimonial_submissions SET photo_url=$1 WHERE id=$2",
          [photoUrl, newId]
        );
      }

      // ✅ Notify admins
      sendNotificationEmail(
        "💍 New Matrimonial Submission",
        `
        <h3>New Matrimonial Form Submitted</h3>
        <p><strong>Name:</strong> ${d.name}</p>
        <p><strong>Email:</strong> ${d.email}</p>
        <p><strong>Country:</strong> ${d.country_living}</p>
        <p><strong>City:</strong> ${d.city_living || "-"}</p>
        ${d.caste ? `<p><strong>Caste:</strong> ${d.caste}</p>` : ""}
        ${
          d.religion_beliefs
            ? `<p><strong>Beliefs:</strong> ${d.religion_beliefs}</p>`
            : ""
        }
        ${photoUrl ? `<p><img src="${photoUrl}" width="150" /></p>` : ""}
        <hr>
        <p>Log in to your admin dashboard to view this biodata.</p>
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
    const result = await pool.query(
      "SELECT * FROM recipients ORDER BY created_at DESC"
    );
    res.json(result.rows);
  }
);

app.post(
  "/api/admin/recipients",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    await pool.query(
      "INSERT INTO recipients(email) VALUES($1) ON CONFLICT(email) DO NOTHING",
      [email]
    );
    res.json({ message: "Recipient added" });
  }
);

app.delete(
  "/api/admin/recipients/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await pool.query("DELETE FROM recipients WHERE id=$1", [req.params.id]);
    res.json({ message: "Recipient removed" });
  }
);

// Get all recipients
app.get(
  "/api/admin/recipients",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM recipients ORDER BY created_at DESC"
    );
    res.json(result.rows);
  }
);

// Add a recipient
app.post(
  "/api/admin/recipients",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    await pool.query(
      "INSERT INTO recipients(email) VALUES($1) ON CONFLICT(email) DO NOTHING",
      [email]
    );
    res.json({ message: "Recipient added" });
  }
);

// Delete a recipient
app.delete(
  "/api/admin/recipients/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await pool.query("DELETE FROM recipients WHERE id=$1", [req.params.id]);
    res.json({ message: "Recipient removed" });
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

// -------------------- BLOG COMMENTS SYSTEM --------------------

// 🟢 Get comments + replies (hide user-deleted ones)
app.get("/api/blogs/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM blog_comments 
       WHERE post_id=$1 
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

// 🟢 Public: add a comment or reply
// 🟢 Public: add a comment or reply
app.post("/api/blogs/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, name, email, comment_text, parent_id } = req.body;

    // 1️⃣ Validate blog existence
    const blogCheck = await pool.query("SELECT id FROM blog_posts WHERE id=$1", [id]);
    if (blogCheck.rowCount === 0)
      return res.status(404).json({ message: "Blog not found" });

    // 2️⃣ Validate parent (and inherit correct post_id)
    if (parent_id) {
      const parent = await pool.query(
        "SELECT id, post_id FROM blog_comments WHERE id=$1",
        [parent_id]
      );
      if (parent.rowCount === 0)
        return res.status(400).json({ message: "Parent comment not found" });

      // ✅ Ensure same blog (in case of reply-to-reply)
      if (parent.rows[0].post_id !== parseInt(id)) {
        return res
          .status(400)
          .json({ message: "Invalid parent comment relationship" });
      }
    }

    // 3️⃣ Insert comment (safe even for reply-of-reply)
    const result = await pool.query(
      `INSERT INTO blog_comments 
       (post_id, user_id, name, email, comment_text, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, user_id || null, name || null, email || null, comment_text, parent_id || null]
    );

    // 4️⃣ Return the newly created comment for instant UI update
    res.json({
      message: "✅ Comment added successfully!",
      comment: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Comment insert error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// 🔒 Admin: fetch all comments (with post title)
// 🔒 Admin: fetch all comments (including deleted)
app.get("/api/admin/comments", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, b.title AS post_title 
      FROM blog_comments c
      LEFT JOIN blog_posts b ON c.post_id=b.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Admin comments fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Admin: toggle approval
app.patch(
  "/api/admin/comments/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query(
        "UPDATE blog_comments SET is_approved = NOT is_approved WHERE id=$1",
        [req.params.id]
      );
      res.json({ message: "✅ Comment approval toggled" });
    } catch (err) {
      console.error("❌ Comment approve toggle error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔒 Admin: delete comment (and replies auto-deleted via cascade)
app.delete(
  "/api/admin/comments/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM blog_comments WHERE id=$1", [
        req.params.id,
      ]);
      res.json({ message: "🗑️ Comment deleted" });
    } catch (err) {
      console.error("❌ Comment delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🟢 USER SOFT DELETE
app.patch("/api/blogs/comments/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE blog_comments SET deleted_by_user = true WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Comment not found" });

    res.json({ message: "🗑️ Comment soft-deleted by user" });
  } catch (err) {
    console.error("❌ Soft delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 ADMIN HARD DELETE
app.delete(
  "/api/blogs/comments/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM blog_comments WHERE id=$1", [
        req.params.id,
      ]);
      res.json({ message: "🗑️ Comment permanently deleted by admin" });
    } catch (err) {
      console.error("❌ Admin delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// ---- BLOG CATEGORIES ----
app.get("/api/admin/categories", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM blog_categories ORDER BY id ASC");
  res.json(result.rows);
});

app.post("/api/admin/categories", requireAuth, requireAdmin, async (req, res) => {
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
});

app.put("/api/admin/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, slug, parent_id, description } = req.body;
  await pool.query(
    "UPDATE blog_categories SET name=$1, slug=$2, parent_id=$3, description=$4 WHERE id=$5",
    [name, slug, parent_id || null, description || null, req.params.id]
  );
  res.json({ message: "✅ Category updated" });
});

app.delete("/api/admin/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM blog_categories WHERE id=$1", [req.params.id]);
  res.json({ message: "🗑 Category deleted" });
});

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












// ---- START SERVER ----
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});

initDB().catch((err) => console.error("DB init failed:", err));
