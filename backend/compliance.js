export const CURRENT_POLICY_VERSION =
  process.env.CONSENT_VERSION || "2026-03-25";

export const PRIVACY_CONTACT_EMAIL =
  process.env.PRIVACY_CONTACT_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "privacy@ravidassiaabroad.com";

export const RETENTION_POLICY = {
  guest_comment_emails: {
    status: "business_decision_needed",
    note: "Keep only as long as needed for moderation and abuse handling.",
  },
  content_requests: {
    status: "business_decision_needed",
    note: "Keep while open and for a defined admin review period after closure.",
  },
  scst_submissions: {
    status: "business_decision_needed",
    note: "Keep while request is active and for a defined follow-up/admin period.",
  },
  matrimonial_submissions: {
    status: "business_decision_needed",
    note: "Sensitive data. Keep only while the current submission remains active or required for admin processing.",
  },
  inactive_users: {
    status: "business_decision_needed",
    note: "Define inactivity threshold and account retention workflow.",
  },
  password_reset_otps: {
    status: "implemented",
    note: "Current implementation expires OTPs after 5 minutes.",
  },
  deleted_or_withdrawn_records: {
    status: "business_decision_needed",
    note: "Decide whether to hard delete immediately or hold briefly for fraud, abuse, or legal review.",
  },
};

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeRequiredText(value, max = 255) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max) : "";
}

export function normalizeOptionalText(value, max = 5000) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

export function normalizeBooleanInput(value) {
  return value === true ||
    value === "true" ||
    value === "on" ||
    value === "yes" ||
    value === 1 ||
    value === "1";
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function sanitizeRichText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[^>]*?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function sanitizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}
