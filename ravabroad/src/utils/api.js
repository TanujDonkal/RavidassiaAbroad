// src/utils/api.js
const API_BASE = process.env.REACT_APP_API_URL + "/api";

// Helper to get token from localStorage
function getToken() {
  return localStorage.getItem("token") || null;
}

// Generic request wrapper
export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // attach JWT if logged in
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
    throw new Error(data.message || "API error");
  }
  return data;
}

// Convenience functions
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

export function submitSCST(payload) {
  return apiFetch("/scst-submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveSubmission(id) {
  return apiFetch(`/admin/scst-submissions/${id}/approve`, { method: "POST" });
}

export function rejectSubmission(id) {
  return apiFetch(`/admin/scst-submissions/${id}/reject`, { method: "POST" });
}


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
  return apiFetch(`/admin/recipients/${id}`, {
    method: "DELETE",
  });
}
