// src/utils/api.js

// 🌍 Automatically detect local or production environment
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// ✅ Use the right backend based on where the site runs
const BASE_URL =
  (isLocalhost
    ? process.env.REACT_APP_API_URL_LOCAL
    : process.env.REACT_APP_API_URL_PROD) ||
  "http://localhost:5000"; // fallback for safety

// ✅ We keep "/api" only here — not in each fetch path
export const API_BASE = `${BASE_URL}/api`;


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
  let headers = options.headers || {};

  // 🧠 Detect if sending FormData (e.g. file upload)
  const isFormData = options.body instanceof FormData;

  // ✅ Only set JSON header for non-FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // ✅ Always attach token — works for both FormData & JSON
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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

const ADMIN_COLLECTION_PATHS = {
  users: "users",
  "scst-submissions": "scst-submissions",
  scst: "scst-submissions",
  matrimonial: "matrimonial",
  blogs: "blogs",
  categories: "categories",
  recipients: "recipients",
  "content-requests": "content-requests",
  menus: "menus",
  personalities: "personalities",
};

function resolveAdminCollectionPath(type) {
  return ADMIN_COLLECTION_PATHS[type] || type;
}

export function deleteSubmission(type, id) {
  const path = resolveAdminCollectionPath(type);
  return apiFetch(`/admin/${path}/${id}`, { method: "DELETE" });
}

export function bulkDeleteAdminItems(type, ids) {
  const path = resolveAdminCollectionPath(type);
  return apiFetch(`/admin/${path}/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export function uploadAdminImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  return apiFetch("/admin/blogs/upload", {
    method: "POST",
    body: formData,
  });
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


