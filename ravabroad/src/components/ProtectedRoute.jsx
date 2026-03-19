// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/auth" replace />;
  }

  // ❌ No token → redirect to login
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // 🔒 If adminOnly, check role
  if (adminOnly && user.role !== "main_admin" && user.role !== "moderate_admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized → show page
  return children;
}
