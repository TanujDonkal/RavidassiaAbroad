// src/components/Layout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import AuthMenu from "./AuthMenu";
// import { apiFetch } from "../utils/api";

function ScrollAndInit() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.__initLegacy) window.__initLegacy();
  }, [pathname]);
  return null;
}

export default function Layout() {
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  // const { open: openPopup } = require("./PopupProvider").usePopup();
  // ...existing logic and effects...

  return (
    <>
      <ScrollAndInit />
      {/* Topbar Start */}
      <div className="container-fluid bg-primary px-5 d-none d-lg-block">
        <div className="row gx-0 align-items-center">
          <div className="col-lg-5 text-center text-lg-start mb-lg-0">
            <div className="d-flex">
              <a href="mailto:RavidassiaAbroad@gmail.com" className="text-muted me-4">
                <i className="fas fa-envelope text-secondary me-2"></i>
                RavidassiaAbroad@gmail.com
              </a>
            </div>
          </div>
          <div className="col-lg-3 row-cols-1 text-center mb-2 mb-lg-0">
            <div className="d-inline-flex align-items-center" style={{ height: 45 }}>
              <a className="btn btn-sm btn-outline-light btn-square rounded-circle me-2" href="https://x.com/ravidassiabroad" target="_blank" rel="noreferrer">
                <i className="fab fa-twitter fw-normal text-secondary"></i>
              </a>
              <a className="btn btn-sm btn-outline-light btn-square rounded-circle me-2" href="https://www.facebook.com/RavidassiaAbroad" target="_blank" rel="noreferrer">
                <i className="fab fa-facebook-f fw-normal text-secondary"></i>
              </a>
              <a className="btn btn-sm btn-outline-light btn-square rounded-circle me-2" href="https://www.instagram.com/ravidassiaabroad/" target="_blank" rel="noreferrer">
                <i className="fab fa-instagram fw-normal text-secondary"></i>
              </a>
              <a className="btn btn-sm btn-outline-light btn-square rounded-circle" href="https://www.youtube.com/c/TheAmbedkarBrand" target="_blank" rel="noreferrer">
                <i className="fab fa-youtube fw-normal text-secondary"></i>
              </a>
            </div>
          </div>
          <div className="col-lg-4 text-center text-lg-end">
            <div className="d-inline-flex align-items-center" style={{ height: 45 }}>
              <button type="button" className="text-muted me-2 btn btn-link p-0" data-bs-toggle="modal" data-bs-target="#contentRequestModal" style={{ textDecoration: "none" }}>
                Add-Remove-Report Content
              </button>
              <div className="d-none d-lg-block">
                <AuthMenu compact />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Topbar End */}

      {/* Navbar Start */}
      <div className="container-fluid nav-bar p-0">
        <nav className="navbar navbar-expand-lg navbar-light bg-white px-4 px-lg-5 py-3 py-lg-0">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 p-0">
            <img src="/template/img/brand-logo.png" className="img-fluid" alt="Ravidassia Community" />
          </Link>
          <button className="navbar-toggler" type="button" id="navbarToggler">
            <span className="fa fa-bars"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <div className="navbar-nav ms-auto py-0">
              <NavLink to="/" end className="nav-item nav-link">Home</NavLink>
              <NavLink to="/about" className="nav-item nav-link">About</NavLink>
              <NavLink to="/blogs" className="nav-item nav-link">Blogs / News</NavLink>
              <div className="nav-item dropdown">
                <a href="/history" className="nav-link" data-bs-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" tabIndex={0}>
                  <span className="dropdown-toggle">History</span>
                </a>
                <div className="dropdown-menu m-0">
                  <NavLink to="/feature" className="dropdown-item">Feature</NavLink>
                  <NavLink to="/countries" className="dropdown-item">Countries</NavLink>
                  <NavLink to="/testimonial" className="dropdown-item">Testimonial</NavLink>
                  <NavLink to="/training" className="dropdown-item">Training</NavLink>
                  <NavLink to="/not-found" className="dropdown-item">404 Page</NavLink>
                </div>
              </div>
              <NavLink to="/contact" className="nav-item nav-link">Contact</NavLink>
            </div>
            <button className="btn btn-primary btn-md-square border-secondary mb-3 mb-md-3 mb-lg-0 me-3" data-bs-toggle="modal" data-bs-target="#searchModal">
              <i className="fas fa-search"></i>
            </button>
            <button className="btn btn-primary border-secondary rounded-pill py-2 px-4 px-lg-3 mb-3 mb-md-3 mb-lg-0" data-bs-toggle="modal" data-bs-target="#donateModal">
              Donate Us
            </button>
            <div className="d-lg-none mt-4 border-top pt-3">
              {user && user.name ? (
                <div className="text-center">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <i className="fa fa-user text-secondary fs-3 mb-2"></i>
                    <h6 className="mb-0">{user.name}</h6>
                    <small className="text-muted">{user.role?.toUpperCase()}</small>
                  </div>
                  <div className="d-flex flex-column gap-2 px-4">
                    <Link to="/profile" className="btn btn-outline-dark rounded-pill" onClick={() => document.querySelector(".navbar-collapse")?.classList.remove("show")}>My Profile</Link>
                    {user.role?.includes("admin") && (
                      <Link to="/admin" className="btn btn-outline-dark rounded-pill" onClick={() => document.querySelector(".navbar-collapse")?.classList.remove("show")}>Admin Dashboard</Link>
                    )}
                    <button className="btn btn-danger rounded-pill" onClick={() => {
                      localStorage.removeItem("user");
                      localStorage.removeItem("token");
                      window.dispatchEvent(new Event("auth-updated"));
                      document.querySelector(".navbar-collapse")?.classList.remove("show");
                      window.location.href = "/auth";
                    }}>Logout</button>
                  </div>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Link to="/auth" className="btn btn-outline-dark w-100 rounded-pill mt-2" onClick={() => document.querySelector(".navbar-collapse")?.classList.remove("show")}>Sign In / Register</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
      {/* Navbar End */}

      {/* Page content */}
      <Outlet />

      {/* Footer Start */}
      <div className="container-fluid footer py-5 wow fadeIn" data-wow-delay="0.2s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Contact Info</h4>
                <span className="d-block"><i className="fa fa-map-marker-alt me-2"></i> Halifax, Nova Scotia, Canada</span>
                <a href="mailto:ravidassiaabroad@gmail.com"><i className="fas fa-envelope me-2"></i> ravidassiaabroad@gmail.com</a>
                <span className="d-block"><i className="fas fa-phone me-2"></i> — </span>
                <span className="d-block mb-3"><i className="fas fa-print me-2"></i> — </span>
                <div className="d-flex align-items-center">
                  <i className="fas fa-share fa-2x text-secondary me-2"></i>
                  <a className="btn mx-1" href="https://www.facebook.com/RavidassiaAbroad" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f"></i></a>
                  <a className="btn mx-1" href="https://x.com/ravidassiabroad" target="_blank" rel="noreferrer"><i className="fab fa-twitter"></i></a>
                  <a className="btn mx-1" href="https://www.instagram.com/ravidassiaabroad/" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
                  <a className="btn mx-1" href="https://www.youtube.com/c/TheAmbedkarBrand" target="_blank" rel="noreferrer"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Contact Hours</h4>
                <div className="mb-3"><h6 className="text-muted mb-0">Mon – Fri:</h6><p className="text-white mb-0">10:00 am – 6:00 pm (AST)</p></div>
                <div className="mb-3"><h6 className="text-muted mb-0">Saturday:</h6><p className="text-white mb-0">Community Events</p></div>
                <div className="mb-3"><h6 className="text-muted mb-0">Sunday:</h6><p className="text-white mb-0">Closed</p></div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Site Links</h4>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> Teachings</span>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> History</span>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> Temples & Centers</span>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> Festivals & Events</span>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> Youth Programs</span>
                <span className="text-white" style={{ cursor: "default", display: "block", marginBottom: "0.5rem" }}><i className="fas fa-angle-right me-2"></i> Contact</span>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-secondary mb-4">Newsletter</h4>
                <p className="text-white mb-3">Get monthly updates on Guru Ravidass Ji’s teachings, global Sangat news, festivals, and new community resources.</p>
                <div className="position-relative mx-auto rounded-pill">
                  <input className="form-control border-0 rounded-pill w-100 py-3 ps-4 pe-5" type="text" placeholder="Enter your email" />
                  <button type="button" className="btn btn-primary rounded-pill position-absolute top-0 end-0 py-2 mt-2 me-2">SignUp</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer End */}

      {/* Copyright Start */}
      <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6 text-center text-md-start mb-md-0">
              <span className="text-white">
                <span className="border-bottom text-white" style={{ cursor: "default" }}><i className="fas fa-copyright text-light me-2"></i>Ravidassia Abroad</span>, All rights reserved.
              </span>
            </div>
            <div className="col-md-6 text-center text-md-end text-white">
              Designed By <a className="border-bottom text-white" href="https://htmlcodex.com">HTML Codex</a>
            </div>
          </div>
        </div>
      </div>
      {/* Copyright End */}

      {/* Back to Top */}
      <button type="button" className="btn btn-primary btn-lg-square back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
        <i className="fa fa-arrow-up"></i>
      </button>
    </>
  );
}
