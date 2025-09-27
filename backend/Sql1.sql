USE ravidassiaabroad;

-- Ensure users table exists (safe)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure scst_submissions exists (minimal shell if missing)
CREATE TABLE IF NOT EXISTS scst_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Allow anonymous submissions
ALTER TABLE scst_submissions
  MODIFY COLUMN user_id INT UNSIGNED NULL;

-- Core optional columns (only added if missing)
ALTER TABLE scst_submissions
  ADD COLUMN IF NOT EXISTS state   VARCHAR(100) NULL AFTER country,
  ADD COLUMN IF NOT EXISTS city    VARCHAR(100) NULL AFTER state,
  ADD COLUMN IF NOT EXISTS phone   VARCHAR(50)  NULL AFTER city,
  ADD COLUMN IF NOT EXISTS platform  ENUM('WhatsApp','Telegram','Discord','Other') DEFAULT 'WhatsApp' AFTER phone,
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(100) NULL AFTER platform,
  ADD COLUMN IF NOT EXISTS proof     VARCHAR(255) NULL AFTER instagram,
  ADD COLUMN IF NOT EXISTS message   TEXT NULL AFTER proof,
  ADD COLUMN IF NOT EXISTS status    ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER message,
  ADD COLUMN IF NOT EXISTS approved_by INT UNSIGNED NULL AFTER status,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL DEFAULT NULL AFTER approved_by;

-- Helpful indexes (only added if missing)
ALTER TABLE scst_submissions
  ADD INDEX IF NOT EXISTS idx_country (country),
  ADD INDEX IF NOT EXISTS idx_status (status),
  ADD INDEX IF NOT EXISTS idx_user (user_id),
  ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Foreign keys (run these if they don't exist in your schema yet)
-- If you already have similarly named constraints, comment these out.
ALTER TABLE scst_submissions
  ADD CONSTRAINT fk_scst_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_scst_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
