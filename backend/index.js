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


// ---- CORS ----
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^https:\/\/([a-z0-9-]+\.)?ravidassiaabroad\.com$/,
        /^https:\/\/([a-z0-9-]+\.)?ravidassia-abroad\.vercel\.app$/
      ];
      if (!origin || allowedPatterns.some((re) => re.test(origin))) {
        callback(null, true);
      } else {
        console.log("❌ Blocked CORS origin:", origin);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  ADMIN_NOTIFY_TO
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

function decodeUserIfAny(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
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
    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
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
app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    email = email.toLowerCase();
    const result = await pool.query(
      "SELECT id,name,email,role,password_hash FROM users WHERE email=$1",
      [email]
    );
    if (!result.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CURRENT USER
app.get("/api/auth/me", requireAuth, async (req, res) =>
  res.json({ user: req.user })
);

// ---- SC/ST SUBMISSION ----
app.post("/api/scst-submissions", async (req, res) => {
  try {
    const u = decodeUserIfAny(req);
    const userId = u?.id ?? null;
    const { name, email, country, state, city, phone, platform, instagram, proof, message } = req.body || {};

    if (!name || !email || !country)
      return res.status(400).json({ message: "name, email, and country required" });

    await pool.query(
      `INSERT INTO scst_submissions
       (user_id,name,email,country,state,city,phone,platform,instagram,proof,message,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')`,
      [userId, name, email, country, state, city, phone, platform, instagram, proof, message]
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

// ---- MATRIMONIAL SUBMISSION ----
const uploadFields = uploadMatrimonial.fields([{ name: "photo", maxCount: 1 }]);
app.post("/api/matrimonial-submissions", uploadFields, async (req, res) => {
  try {
    const d = req.body || {};
    const userId = decodeUserIfAny(req)?.id ?? null;
    const photoUrl = req.files?.photo?.[0]?.path || null;

    if (!d.name || !d.email || !d.country_living)
      return res.status(400).json({ message: "Required fields missing" });

    await pool.query(
      `INSERT INTO matrimonial_submissions
        (user_id,name,gender,age,dob,height,marital_status,phone,email,instagram,
         country_living,state_living,city_living,origin_state,origin_district,current_status,
         education,occupation,company_or_institution,income_range,photo_url)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        userId,
        d.name, d.gender, d.age, d.dob, d.height, d.marital_status,
        d.phone, d.email, d.instagram, d.country_living, d.state_living,
        d.city_living, d.origin_state, d.origin_district, d.current_status,
        d.education, d.occupation, d.company_or_institution, d.income_range,
        photoUrl
      ]
    );

    await sendNotificationEmail(
      "💍 New Matrimonial Submission",
      `
        <h3>New Matrimonial Form Submitted</h3>
        <p><strong>Name:</strong> ${d.name}</p>
        <p><strong>Email:</strong> ${d.email}</p>
        <p><strong>Country:</strong> ${d.country_living}</p>
        <p><strong>City:</strong> ${d.city_living}</p>
        ${photoUrl ? `<p><img src="${photoUrl}" width="150" /></p>` : ""}
        <hr>
        <p>Log in to your admin dashboard to view this biodata.</p>
      `
    );

    res.json({ message: "✅ Biodata submitted successfully!" });
  } catch (err) {
    console.error("Matrimonial submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// ---- ADMIN ROUTES ----
app.get("/api/admin/scst-submissions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scst_submissions ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Admin SCST fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/scst-submissions/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM scst_submissions WHERE id=$1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("SC/ST delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/matrimonial", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM matrimonial_submissions ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Matrimonial fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/matrimonial/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM matrimonial_submissions WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Matrimonial delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM recipients ORDER BY created_at DESC");
  res.json(result.rows);
});

app.post("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  await pool.query("INSERT INTO recipients(email) VALUES($1) ON CONFLICT(email) DO NOTHING", [email]);
  res.json({ message: "Recipient added" });
});

app.delete("/api/admin/recipients/:id", requireAuth, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM recipients WHERE id=$1", [req.params.id]);
  res.json({ message: "Recipient removed" });
});



// Get all recipients
app.get("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM recipients ORDER BY created_at DESC");
  res.json(result.rows);
});

// Add a recipient
app.post("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  await pool.query("INSERT INTO recipients(email) VALUES($1) ON CONFLICT(email) DO NOTHING", [email]);
  res.json({ message: "Recipient added" });
});

// Delete a recipient
app.delete("/api/admin/recipients/:id", requireAuth, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM recipients WHERE id=$1", [req.params.id]);
  res.json({ message: "Recipient removed" });
});


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


app.put("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
  res.json({ message: "Role updated" });
});


app.post("/api/user/update-profile", uploadProfile.single("photo"), async (req, res) => {
  try {
    const u = decodeUserIfAny(req);
    if (!u) return res.status(401).json({ message: "Unauthorized" });

    const d = req.body;
    const newPhotoUrl = req.file ? req.file.path : null;

    // Fetch old photo
    const oldPhotoRes = await pool.query("SELECT photo_url FROM users WHERE id = $1", [u.id]);
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
        await cloudinary.uploader.destroy(`ravidassia_profile_dp/${oldPublicId}`);
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
});



// ---- START SERVER ----
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});

initDB().catch((err) => console.error("DB init failed:", err));
