// src/components/Layout.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import AuthMenu from "./AuthMenu";
import SiteSearchModal from "./SiteSearchModal";
import ContentRequestModal from "./ContentRequestModal";
import {
  LEGAL_PATHS,
  PRIVACY_CONTACT_EMAIL,
  SUPPORT_CONTACT_EMAIL,
} from "../utils/compliance";

function ScrollAndInit() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.__initLegacy) window.__initLegacy();
  }, [pathname]);
  return null;
}

export default function Layout() {
  const { pathname } = useLocation();
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navbarRef = useRef(null);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const handlePointerDown = (event) => {
      if (window.innerWidth >= 992) return;
      if (!navbarRef.current?.contains(event.target)) {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMobileNavOpen]);
  // const { open: openPopup } = require("./PopupProvider").usePopup();
  // ...existing logic and effects...

  return (
    <>
      <ScrollAndInit />
      {/* Topbar Start */}
      <div className="site-topbar container-fluid bg-primary px-5 d-none d-lg-block">
        <div className="row gx-0 align-items-center">
          <div className="col-lg-5 text-center text-lg-start mb-lg-0">
            <div className="d-flex">
              <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`} className="text-muted me-4">
                <i className="fas fa-envelope text-secondary me-2"></i>
                {SUPPORT_CONTACT_EMAIL}
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
        <nav ref={navbarRef} className="site-navbar navbar navbar-expand-lg navbar-light bg-white px-3 px-sm-4 px-lg-5 py-3 py-lg-0">
          <div className="site-navbar-main d-flex align-items-center">
            <Link to="/" className="site-navbar-brand navbar-brand d-flex align-items-center gap-2 p-0">
              <img src="/template/img/brand-logo.png" className="img-fluid" alt="Ravidassia Community" />
            </Link>
            <div className="site-navbar-mobile-actions d-flex align-items-center ms-auto">
              <button className="site-navbar-mobile-icon site-navbar-action btn btn-primary btn-md-square border-secondary d-lg-none" data-bs-toggle="modal" data-bs-target="#searchModal" aria-label="Search">
                <i className="fas fa-search"></i>
              </button>
              <button className="site-navbar-mobile-donate site-navbar-action site-donate-btn btn btn-primary border-secondary rounded-pill d-lg-none" data-bs-toggle="modal" data-bs-target="#donateModal">
                <i className="fas fa-hand-holding-heart me-2"></i>
                Donate
              </button>
              <button
                className={`site-navbar-toggle navbar-toggler ${isMobileNavOpen ? "is-open" : ""}`}
                type="button"
                id="navbarToggler"
                aria-controls="navbarCollapse"
                aria-expanded={isMobileNavOpen}
                aria-label="Toggle navigation"
                onClick={() => setIsMobileNavOpen((open) => !open)}
              >
                <span className="site-navbar-toggle-lines" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
          </div>
          <div className={`site-navbar-collapse collapse navbar-collapse ${isMobileNavOpen ? "show" : ""}`} id="navbarCollapse">
            <div className="site-navbar-links navbar-nav ms-auto py-0">
              <NavLink to="/" end className="nav-item nav-link" onClick={() => setIsMobileNavOpen(false)}>Home</NavLink>
              <NavLink to="/about" className="nav-item nav-link" onClick={() => setIsMobileNavOpen(false)}>About</NavLink>
              <NavLink to="/blogs" className="nav-item nav-link" onClick={() => setIsMobileNavOpen(false)}>Blogs / News</NavLink>
              <div className="nav-item dropdown">
                <a href="/history" className="nav-link" data-bs-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" tabIndex={0}>
                  <span className="dropdown-toggle">History</span>
                </a>
                <div className="site-dropdown-menu dropdown-menu m-0">
                  <NavLink to="/feature" className="dropdown-item" onClick={() => setIsMobileNavOpen(false)}>Ravidassia Religion</NavLink>
                  <NavLink to="/countries" className="dropdown-item" onClick={() => setIsMobileNavOpen(false)}>Countries</NavLink>
                  <NavLink to="/testimonial" className="dropdown-item" onClick={() => setIsMobileNavOpen(false)}>Testimonial</NavLink>
                  <NavLink to="/training" className="dropdown-item" onClick={() => setIsMobileNavOpen(false)}>Training</NavLink>
                  <NavLink to="/not-found" className="dropdown-item" onClick={() => setIsMobileNavOpen(false)}>404 Page</NavLink>
                </div>
              </div>
              <NavLink to="/contact" className="nav-item nav-link" onClick={() => setIsMobileNavOpen(false)}>Contact</NavLink>
            </div>
            <button className="site-navbar-action btn btn-primary btn-md-square border-secondary mb-3 mb-md-3 mb-lg-0 me-lg-3 d-none d-lg-inline-flex" data-bs-toggle="modal" data-bs-target="#searchModal">
              <i className="fas fa-search"></i>
            </button>
            <button className="site-navbar-action site-donate-btn btn btn-primary border-secondary rounded-pill py-2 px-4 px-lg-3 mb-3 mb-md-3 mb-lg-0 d-none d-lg-inline-flex" data-bs-toggle="modal" data-bs-target="#donateModal">
              Donate Us
            </button>
            <div className="site-mobile-auth d-lg-none mt-4 border-top pt-3">
              {user && user.name ? (
                <div className="text-center">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <i className="fa fa-user text-secondary fs-3 mb-2"></i>
                    <h6 className="mb-0">{user.name}</h6>
                    <small className="text-muted">{user.role?.toUpperCase()}</small>
                  </div>
                  <div className="d-flex flex-column gap-2 px-4">
                    <Link to="/profile" className="btn btn-outline-dark rounded-pill" onClick={() => setIsMobileNavOpen(false)}>My Profile</Link>
                    {user.role?.includes("admin") && (
                      <Link to="/admin" className="btn btn-outline-dark rounded-pill" onClick={() => setIsMobileNavOpen(false)}>Admin Dashboard</Link>
                    )}
                    <button className="btn btn-danger rounded-pill" onClick={() => {
                      localStorage.removeItem("user");
                      localStorage.removeItem("token");
                      window.dispatchEvent(new Event("auth-updated"));
                      setIsMobileNavOpen(false);
                      window.location.href = "/auth";
                    }}>Logout</button>
                  </div>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Link to="/auth" className="btn btn-outline-dark w-100 rounded-pill mt-2" onClick={() => setIsMobileNavOpen(false)}>Sign In / Register</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
      {/* Navbar End */}

      <SiteSearchModal />
      <ContentRequestModal />

      {/* Page content */}
      <Outlet />

      {/* Footer Start */}
      <div className="site-footer container-fluid footer py-5 wow fadeIn" data-wow-delay="0.2s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Contact Info</h4>
                <span className="d-block"><i className="fa fa-map-marker-alt me-2"></i> Halifax, Nova Scotia, Canada</span>
                <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`}><i className="fas fa-envelope me-2"></i> {SUPPORT_CONTACT_EMAIL}</a>
                <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="mt-2"><i className="fas fa-shield-alt me-2"></i> {PRIVACY_CONTACT_EMAIL}</a>
                <span className="d-block"><i className="fas fa-phone me-2"></i> — </span>
                <span className="d-block mb-3"><i className="fas fa-print me-2"></i> — </span>
                <div className="site-footer-social d-flex align-items-center">
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
                <h4 className="text-secondary mb-4">Legal & Help</h4>
                <Link className="text-white" style={{ display: "block", marginBottom: "0.5rem" }} to={LEGAL_PATHS.privacy}><i className="fas fa-angle-right me-2"></i> Privacy Policy</Link>
                <Link className="text-white" style={{ display: "block", marginBottom: "0.5rem" }} to={LEGAL_PATHS.terms}><i className="fas fa-angle-right me-2"></i> Terms of Use</Link>
                <Link className="text-white" style={{ display: "block", marginBottom: "0.5rem" }} to={LEGAL_PATHS.guidelines}><i className="fas fa-angle-right me-2"></i> Community Guidelines</Link>
                <Link className="text-white" style={{ display: "block", marginBottom: "0.5rem" }} to={LEGAL_PATHS.dataRequest}><i className="fas fa-angle-right me-2"></i> Privacy / Data Request</Link>
                <Link className="text-white" style={{ display: "block", marginBottom: "0.5rem" }} to="/contact"><i className="fas fa-angle-right me-2"></i> Contact</Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-secondary mb-4">Newsletter</h4>
                <p className="text-white mb-3">Get monthly updates on Guru Ravidass Ji’s teachings, global Sangat news, festivals, and new community resources.</p>
                <div className="site-newsletter position-relative mx-auto rounded-pill">
                  <input className="form-control border-0 rounded-pill w-100 py-3 ps-4 pe-5" type="text" placeholder="Enter your email" />
                  <button type="button" className="site-newsletter-btn btn btn-primary rounded-pill position-absolute top-0 end-0 py-2 mt-2 me-2">SignUp</button>
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
              Designed By <a className="border-bottom text-white" href="https://codezypher.com" target="_blank" rel="noreferrer">Codezypher</a>
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
