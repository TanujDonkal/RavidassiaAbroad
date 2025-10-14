// src/components/AuthMenu.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AuthMenu({ compact = false }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  // 🔄 React to login/logout events
  useEffect(() => {
    const syncAuth = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-updated", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-updated", syncAuth);
    };
  }, []);

  // 👇 Triggered when user logs out
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setOpen(false);
    navigate("/auth");
    window.dispatchEvent(new Event("auth-updated"));
  };

  // 👇 Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 👇 If not logged in
  if (!user) {
    return (
      <Link to="/auth" className="btn btn-outline-light btn-sm ms-2">
        Sign In / Register
      </Link>
    );
  }

  // 👇 Logged in dropdown
  return (
    <div
      className={`dropdown ${open ? "show" : ""}`}
      ref={menuRef}
      style={{ position: "relative" }}
    >
      <button
        className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <div
          className="rounded-circle bg-secondary text-white fw-bold d-flex justify-content-center align-items-center"
          style={{ width: 24, height: 24 }}
        >
          {user.name?.charAt(0).toUpperCase()}
        </div>
        {!compact && (
          <>
            <span>{user.name}</span>
            <i className="fa fa-chevron-down small"></i>
          </>
        )}
      </button>

      {open && (
        <ul
          className="dropdown-menu show"
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            display: "block",
            zIndex: 2000,
            minWidth: "180px",
          }}
        >
          <li>
            <h6 className="dropdown-header mb-0">{user.name}</h6>
            <small className="dropdown-item-text text-muted">
              {user.email}
            </small>
          </li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <Link
              className="dropdown-item"
              to="/profile"
              onClick={() => setOpen(false)}
            >
              My Profile
            </Link>
          </li>
          {user.role?.includes("admin") && (
            <li>
              <Link
                className="dropdown-item"
                to="/admin"
                onClick={() => setOpen(false)}
              >
                Admin Panel
              </Link>
            </li>
          )}
          <li>
            <button className="dropdown-item text-danger" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
