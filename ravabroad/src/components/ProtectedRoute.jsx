import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setPostAuthRedirect } from "../utils/formDrafts";
import { clearStoredAuth, getStoredUser, isAuthenticated } from "../utils/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const user = getStoredUser() || {};

  const redirectTo = `${location.pathname}${location.search}${location.hash}`;

  if (!isAuthenticated()) {
    clearStoredAuth({ notify: false });
    setPostAuthRedirect(redirectTo);
    return <Navigate to="/auth" replace state={{ redirectTo }} />;
  }

  if (adminOnly && user.role !== "main_admin" && user.role !== "moderate_admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
