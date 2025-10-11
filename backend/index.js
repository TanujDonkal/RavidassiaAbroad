import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(express.json());

// ---- CORS (updated, mobile-safe) ----
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:3000",
        "https://ravidassia-abroad.vercel.app",
        "https://ravidassiaabroad.com",
      ];

      // ✅ Allow requests with no Origin (like iOS Safari or same-origin)
      if (!origin || allowed.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
 
// ---- ENV / DEFAULTS ----
const {
  PORT = 5000,
  PGHOST,
  PGPORT = 5432,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  JWT_SECRET = "dev_secret_change_me",
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

// ---- INIT DB ----
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
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
      status VARCHAR(20) DEFAULT 'pending',
      approved_by INT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMP
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
      father_name VARCHAR(120),
      father_occupation VARCHAR(120),
      mother_name VARCHAR(120),
      mother_occupation VARCHAR(120),
      siblings VARCHAR(50),
      family_type VARCHAR(50),
      religion VARCHAR(100),
      caste VARCHAR(100),
      partner_expectations TEXT,
      partner_age_range VARCHAR(50),
      partner_country VARCHAR(100),
      privacy_accepted BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Neon Postgres DB ready.");
}

// ---- HELPERS ----
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
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

// ---- ROUTES ----
app.get("/api/health", (req, res) =>
  res.json({ ok: true, app: "Ravidassia API" })
);

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });
email = email.toLowerCase();

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length)
      return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hash]
    );

    res
      .status(201)
      .json({ message: "User created successfully", id: result.rows[0].id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });
    email = email.toLowerCase();
    const rows = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );
    if (!rows.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = rows.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CURRENT USER
app.get("/api/auth/me", requireAuth, async (req, res) =>
  res.json({ user: req.user })
);

// =============================
// PUBLIC SC/ST SUBMISSION
// =============================
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
        .json({ message: "name, email, and country are required" });

    await pool.query(
      `INSERT INTO scst_submissions
       (user_id, name, email, country, state, city, phone, platform, instagram, proof, message, status)
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

    res.json({ message: "Submission received" });
  } catch (err) {
    console.error("SCST submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// ADMIN: SC/ST SUBMISSIONS
// =============================
app.get("/api/admin/scst-submissions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email
       FROM scst_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin SCST fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN — delete SC/ST submission
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


// =============================
// ADMIN: USERS & MATRIMONIAL
// =============================
app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE USER
app.post("/api/admin/create-user", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    if (req.user.role !== "main_admin")
      return res.status(403).json({ message: "Only main admin can create users" });

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length)
      return res.status(409).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)",
      [name, email, hash, role]
    );

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// MATRIMONIAL (already correct)
app.post("/api/matrimonial-submissions", async (req, res) => {
  try {
    const d = req.body || {};

    let userId = null;
    try {
      const auth = req.headers.authorization?.split(" ")[1];
      if (auth) {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);
        userId = decoded?.id || null;
      }
    } catch {}

    if (!d.name || !d.email || !d.country_living)
      return res.status(400).json({ message: "Required fields missing" });

    await pool.query(
      `INSERT INTO matrimonial_submissions
      (user_id, name, gender, age, dob, height, marital_status, phone, email, instagram,
      country_living, state_living, city_living, origin_state, origin_district, current_status,
      education, occupation, company_or_institution, income_range, father_name, father_occupation,
      mother_name, mother_occupation, siblings, family_type, religion, caste, partner_expectations,
      partner_age_range, partner_country, privacy_accepted)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
      $26,$27,$28,$29,$30,$31,$32)`,
      [
        userId,
        d.name,
        d.gender,
        d.age,
        d.dob,
        d.height,
        d.marital_status,
        d.phone,
        d.email,
        d.instagram,
        d.country_living,
        d.state_living,
        d.city_living,
        d.origin_state,
        d.origin_district,
        d.current_status,
        d.education,
        d.occupation,
        d.company_or_institution,
        d.income_range,
        d.father_name,
        d.father_occupation,
        d.mother_name,
        d.mother_occupation,
        d.siblings,
        d.family_type,
        d.religion,
        d.caste,
        d.partner_expectations,
        d.partner_age_range,
        d.partner_country,
        d.privacy_accepted === true || d.privacy_accepted === "true",
      ]
    );

    res.json({ message: "✅ Biodata submitted successfully!" });
  } catch (err) {
    console.error("Matrimonial submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/matrimonial", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.name AS user_name, u.email AS user_email
       FROM matrimonial_submissions m
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Matrimonial fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/matrimonial/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM matrimonial_submissions WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Matrimonial delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- START ----
initDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 API running on http://localhost:${PORT}`)
  );
});
