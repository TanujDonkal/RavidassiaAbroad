// src/utils/api.js
// ✅ We keep "/api" only here — not in each fetch path
const API_BASE = process.env.REACT_APP_API_URL + "/api";

// ----------------------------
// Helper to get token
// ----------------------------
function getToken() {
  return localStorage.getItem("token") || null;
}

// ----------------------------
// Generic request wrapper
// ----------------------------
export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // attach JWT if logged in
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("API error response:", res.status, data);
    throw new Error(data.message || "API error");
  }
  return data;
}

// ----------------------------
// Auth endpoints
// ----------------------------
export function register(user) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function login(credentials) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getMe() {
  return apiFetch("/auth/me");
}

// ----------------------------
// SC/ST & Matrimonial Admin
// ----------------------------
export function getSCSTSubmissions() {
  return apiFetch("/admin/scst-submissions");
}

export function getMatrimonialSubmissions() {
  return apiFetch("/admin/matrimonial");
}

export function deleteSubmission(type, id) {
  return apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });
}

// ----------------------------
// Recipients & Users
// ----------------------------
export function getRecipients() {
  return apiFetch("/admin/recipients");
}

export function addRecipient(email) {
  return apiFetch("/admin/recipients", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function deleteRecipient(id) {
  return apiFetch(`/admin/recipients/${id}`, { method: "DELETE" });
}

// ----------------------------
// User Management
// ----------------------------
export function updateUserRole(userId, role) {
  return apiFetch(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export function createUser(data) {
  return apiFetch("/admin/create-user", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
