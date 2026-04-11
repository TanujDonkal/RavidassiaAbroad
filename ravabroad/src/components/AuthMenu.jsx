// src/components/AuthMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { clearStoredAuth, getStoredUser } from "../utils/auth";

export default function AuthMenu({ compact = false }) {
  const menuRef = useRef(null);
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncAuth = () => {
      setUser(getStoredUser());
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

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Clear local auth state even if the server session has already expired.
    } finally {
      clearStoredAuth();
      window.location.href = "/auth";
    }
  };

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
            onClick={handleLogout}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
