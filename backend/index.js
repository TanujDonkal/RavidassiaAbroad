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

// ---- CORS ----
const allowedOrigins = [
  "http://localhost:3000",
  "https://ravidassia-abroad.vercel.app",
  "https://ravidassiaabroad.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed for this origin: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
app.get("/api/health", (req, res) => res.json({ ok: true, app: "Ravidassia API" }));

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length)
      return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hash]
    );

    res.status(201).json({ message: "User created successfully", id: result.rows[0].id });
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CURRENT USER
app.get("/api/auth/me", requireAuth, async (req, res) => res.json({ user: req.user }));

// ---- SC/ST SUBMISSIONS ----
app.post("/api/scst-submissions", async (req, res) => {
  try {
    const u = decodeUserIfAny(req);
    const userId = u?.id ?? null;
    const { name, email, country, state, city, phone, platform, instagram, proof, message } = req.body || {};

    if (!name || !email || !country)
      return res.status(400).json({ message: "name, email, and country are required" });

    await pool.query(
      `INSERT INTO scst_submissions
       (user_id, name, email, country, state, city, phone, platform, instagram, proof, message, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')`,
      [userId, name, email, country, state, city, phone, platform, instagram, proof, message]
    );

    // Email notify
    try {
      const recipients = await pool.query("SELECT email FROM notify_recipients");
      const emails = recipients.rows.map(r => r.email);

      if (emails.length) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.NOTIFY_EMAIL,
            pass: process.env.NOTIFY_EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Ravidassia Abroad" <${process.env.NOTIFY_EMAIL}>`,
          to: emails,
          subject: "📩 New SC/ST Submission Received",
          html: `<h3>New SC/ST Submission</h3>
                 <p><b>Name:</b> ${name}</p>
                 <p><b>Email:</b> ${email}</p>
                 <p><b>Country:</b> ${country}</p>`,
        });
      }
    } catch (notifyErr) {
      console.error("❌ Email notification failed:", notifyErr);
    }

    res.json({ message: "Submission received" });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- ADMIN ROUTES ----
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

// Create new user (Main Admin only)
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

app.get("/api/admin/scst-submissions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scst_submissions ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Admin submissions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Recipients
app.get("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notify_recipients ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Recipients fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/recipients", requireAuth, requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    await pool.query(
      "INSERT INTO notify_recipients (email) VALUES ($1) ON CONFLICT DO NOTHING",
      [email]
    );
    res.json({ message: "Recipient added" });
  } catch (err) {
    console.error("Recipient add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/recipients/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM notify_recipients WHERE id=$1", [req.params.id]);
    res.json({ message: "Recipient removed" });
  } catch (err) {
    console.error("Recipient delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ---- ADMIN: Create User ----
app.post("/api/admin/create-user", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [name, email, hash, role || "user"]
    );

    res.json({ message: "✅ User created successfully" });
  } catch (err) {
    console.error("Create user error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- START ----
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
});
