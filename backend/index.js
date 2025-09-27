// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

// ---- CORS / JSON ----
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // your React app
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---- ENV / DEFAULTS ----
const {
  PORT = 5000,
  DB_HOST = "127.0.0.1",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "ravidassiaabroad",
  JWT_SECRET = "dev_secret_change_me",
} = process.env;

let pool;

// ---- INIT DB (create DB & tables if missing) ----
async function initDB() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // users
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // scst_submissions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scst_submissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      user_id INT UNSIGNED NULL,

      name    VARCHAR(120) NOT NULL,
      email   VARCHAR(255) NOT NULL,
      country VARCHAR(100) NOT NULL,
      state   VARCHAR(100) NULL,
      city    VARCHAR(100) NULL,
      phone   VARCHAR(50)  NULL,

      platform  ENUM('WhatsApp','Telegram','Discord','Other') DEFAULT 'WhatsApp',
      instagram VARCHAR(100) NULL,
      proof     VARCHAR(255) NULL,

      message TEXT NULL,

      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      approved_by INT UNSIGNED NULL,
      approved_at TIMESTAMP NULL DEFAULT NULL,

      PRIMARY KEY (id),
      KEY idx_country (country),
      KEY idx_status (status),
      KEY idx_user (user_id),
      KEY idx_created_at (created_at),

      CONSTRAINT fk_scst_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_scst_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("DB ready.");
}

// -------- Helpers --------
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
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
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// ---- ROUTES ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "Ravidassia API" });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    res.status(201).json({ message: "User created successfully", id: result.insertId });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
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

// (Optional) current user
app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// ---- SC/ST SUBMISSIONS (no auth required; attach user_id if logged in) ----
app.post("/api/scst-submissions", async (req, res) => {
  try {
    const u = decodeUserIfAny(req); // null if no/invalid token
    const userId = u?.id ?? null;

    const {
      name,
      email,
      country,
      state = null,
      city = null,
      phone = null,
      platform = "WhatsApp",
      instagram = null,
      proof = null,
      message = null,
    } = req.body || {};

    if (!name || !email || !country) {
      return res.status(400).json({ message: "name, email, and country are required" });
    }

    await pool.query(
      `INSERT INTO scst_submissions
        (user_id, name, email, country, state, city, phone, platform, instagram, proof, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, name, email, country, state, city, phone, platform, instagram, proof, message]
    );

    res.status(201).json({ message: "Submission received. An admin will review and send you the WhatsApp invite." });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// (Later) Admin approve/reject examples
app.post("/api/admin/scst-submissions/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE scst_submissions
          SET status='approved', approved_by=?, approved_at=NOW()
        WHERE id=?`,
      [req.user.id, id]
    );
    res.json({ message: "Submission approved" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/scst-submissions/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE scst_submissions
          SET status='rejected', approved_by=?, approved_at=NOW()
        WHERE id=?`,
      [req.user.id, id]
    );
    res.json({ message: "Submission rejected" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---- START ----
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
