// src/components/Navbar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/service" },
  { label: "Feature", to: "/feature" },
  { label: "Countries", to: "/countries" },
  { label: "Training", to: "/training" },
  { label: "Testimonials", to: "/testimonial" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  return (
    <header className="container-fluid border-bottom">
      <nav className="container d-flex gap-3 py-3 flex-wrap">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
            end={item.to === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
