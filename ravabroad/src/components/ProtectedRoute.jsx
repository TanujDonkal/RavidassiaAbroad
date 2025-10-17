// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
