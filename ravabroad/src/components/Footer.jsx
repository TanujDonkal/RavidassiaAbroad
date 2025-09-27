// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="container py-4 border-top">
      <small>© {new Date().getFullYear()} Your Site</small>
    </footer>
  );
}
