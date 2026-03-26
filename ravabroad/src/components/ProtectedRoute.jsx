import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setPostAuthRedirect } from "../utils/formDrafts";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/auth" replace />;
  }

  const redirectTo = `${location.pathname}${location.search}${location.hash}`;

  if (!token) {
    setPostAuthRedirect(redirectTo);
    return <Navigate to="/auth" replace state={{ redirectTo }} />;
  }

  if (adminOnly && user.role !== "main_admin" && user.role !== "moderate_admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
