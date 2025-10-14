// src/components/AuthMenu.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AuthMenu({ compact = false }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const syncAuth = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("auth-updated", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

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
    <div className="dropdown">
  <button
    className="btn dropdown-toggle p-0 border-0 bg-transparent d-flex align-items-center"
    id="userMenu"
    data-bs-toggle="dropdown"
    aria-expanded="false"
    style={{ width: 42, height: 42 }}
  >
    {avatarContent}
  </button>

  <ul
    className="dropdown-menu dropdown-menu-end shadow-sm mt-2"
    aria-labelledby="userMenu"
  >
    <li className="dropdown-item-text fw-semibold">{user.name}</li>
    <li>
      <Link to="/profile" className="dropdown-item">
        My Profile
      </Link>
    </li>
    {user.role?.includes("admin") && (
      <li>
        <Link to="/admin" className="dropdown-item">
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
