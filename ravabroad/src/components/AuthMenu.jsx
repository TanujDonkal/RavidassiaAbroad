// src/components/AuthMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function AuthMenu({ compact = false }) {
  const menuRef = useRef(null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  useEffect(() => {
    const syncAuth = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    window.addEventListener("auth-updated", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  if (!user)
    return (
      <Link
        to="/auth"
        className="btn btn-outline-light rounded-pill px-3 py-1 small"
      >
        Sign In / Register
      </Link>
    );

  // Determine what to show in avatar
const avatarContent = user.photo_url ? (
  <img
    src={user.photo_url}
    alt={user.name}
    className="rounded-circle"
    style={{
      width: 40,
      height: 40,
      objectFit: "cover",
    }}
  />
) : (
  <div
    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-semibold"
    style={{
      width: 40,
      height: 40,
    }}
  >
    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
  </div>
);

  return (
    <div className="dropdown topbar-auth-dropdown position-relative" ref={menuRef}>
      <button
        className="topbar-auth-toggle btn p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{ width: 42, height: 42 }}
        onClick={() => setOpen((current) => !current)}
      >
        {avatarContent}
      </button>

      <ul
        className={`topbar-user-menu dropdown-menu dropdown-menu-end shadow-sm mt-2${
          open ? " show" : ""
        }`}
        style={{ display: open ? "block" : "none" }}
      >
        <li className="dropdown-item-text fw-semibold">{user.name}</li>
        <li>
          <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>
            My Profile
          </Link>
        </li>
        {user.role?.includes("admin") && (
          <li>
            <Link to="/admin" className="dropdown-item" onClick={() => setOpen(false)}>
              Admin Dashboard
            </Link>
          </li>
        )}
        <li>
          <button
            className="dropdown-item text-danger"
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              window.dispatchEvent(new Event("auth-updated"));
              window.location.href = "/auth";
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
