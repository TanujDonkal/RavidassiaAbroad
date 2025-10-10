// src/components/AuthMenu.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

function getStoredAuth() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token") || null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export default function AuthMenu({ compact = false }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(getStoredAuth());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") setAuth(getStoredAuth());
    };
    const onAuthChanged = () => setAuth(getStoredAuth());
    const onResize = () => setIsMobile(window.innerWidth < 992);

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:changed", onAuthChanged);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const { user } = auth;
  const initial = useMemo(
    () =>
      user?.name?.trim()?.[0]?.toUpperCase() ||
      user?.email?.[0]?.toUpperCase() ||
      "U",
    [user]
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/", { replace: true });
  };

  // =======================
  // LOGGED OUT
  // =======================
  if (!user) {
    return isMobile ? (
      <Link to="/auth" className="nav-item nav-link text-dark">
        Sign In / Register
      </Link>
    ) : compact ? (
      <Link to="/auth" className="text-muted me-3">
        Sign In / Register
      </Link>
    ) : (
      <Link
        to="/auth"
        className="btn btn-outline-secondary rounded-pill px-3 ms-2"
      >
        Sign In / Register
      </Link>
    );
  }

  // =======================
  // LOGGED IN — MOBILE VERSION (inside hamburger)
  // =======================
  if (isMobile) {
    return (
      <div className="auth-menu-mobile mt-3 border-top pt-3">
        <p className="fw-bold mb-1 text-dark text-center">
          👤 {user.name || user.email}
        </p>
        <p className="text-muted text-center mb-3">
          {user.role?.toUpperCase() || "USER"}
        </p>
        <div className="d-flex flex-column align-items-center gap-2">
          <Link to="/connect-scst" className="btn btn-outline-dark btn-sm w-75">
            My Submissions
          </Link>
          {(user.role === "main_admin" || user.role === "moderate_admin") && (
            <Link to="/admin" className="btn btn-outline-dark btn-sm w-75">
              Admin Dashboard
            </Link>
          )}

          <button onClick={logout} className="btn btn-danger btn-sm w-75">
            Logout
          </button>
        </div>
      </div>
    );
  }

  // =======================
  // LOGGED IN — DESKTOP VERSION (dropdown)
  // =======================
  return (
    <div className={`dropdown ${compact ? "" : "ms-2"}`}>
      <button
        className={`btn ${
          compact ? "btn-sm" : ""
        } btn-outline-secondary rounded-pill d-flex align-items-center gap-2`}
        data-bs-toggle="dropdown"
        aria-expanded="false"
        type="button"
      >
        <span
          className="rounded-circle d-inline-flex justify-content-center align-items-center"
          style={{
            width: 28,
            height: 28,
            fontWeight: 600,
            background: "#e9ecef",
          }}
        >
          {initial}
        </span>
        <span className="d-none d-sm-inline">{user.name || user.email}</span>
        <i className="fa fa-chevron-down small ms-1" />
      </button>

      <ul className="dropdown-menu dropdown-menu-end">
        <li className="dropdown-header">
          <div className="fw-semibold">{user.name || user.email}</div>
          <div className="text-muted small">
            {(user.role || "user").replace("_", " ").toUpperCase()}
          </div>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <Link className="dropdown-item" to="/connect-scst">
            My Submissions
          </Link>
        </li>
        {(user.role === "main_admin" || user.role === "moderate_admin") && (
          <li>
            <Link className="dropdown-item" to="/admin">
              <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
            </Link>
          </li>
        )}

        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <button className="dropdown-item text-danger" onClick={logout}>
            <i className="fa fa-sign-out-alt me-2" /> Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
