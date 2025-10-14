// src/components/Layout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import AuthMenu from "./AuthMenu";
import { apiFetch } from "../utils/api";

function ScrollAndInit() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.__initLegacy) window.__initLegacy();
  }, [pathname]);
  return null;
}

export default function Layout() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  // 🧹 Safe modal cleanup for frontend only
useEffect(() => {
  const cleanupFrontendModals = (event) => {
    // Get modal ID (like "donateModal", "searchModal", etc.)
    const modalId = event?.target?.id || "";

    // ✅ Only clean up these frontend modals
    const isFrontendModal =
      modalId.includes("donate") ||
      modalId.includes("contentRequest") ||
      modalId.includes("search");

    if (!isFrontendModal) return;

    // Remove leftover Bootstrap backdrops and reset body scroll
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };

  // Clean up when frontend modals open or close
  window.addEventListener("hidden.bs.modal", cleanupFrontendModals);
  window.addEventListener("shown.bs.modal", cleanupFrontendModals);

  // Run once on mount (in case something is stuck)
  cleanupFrontendModals({ target: { id: "donateModal" } });

  // Cleanup listeners on unmount
  return () => {
    window.removeEventListener("hidden.bs.modal", cleanupFrontendModals);
    window.removeEventListener("shown.bs.modal", cleanupFrontendModals);
  };
}, []);


  // ✅ New: Sync user from backend automatically
  useEffect(() => {
    const syncAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await apiFetch("/auth/me");
          const latest = res.user;

          localStorage.setItem("user", JSON.stringify(latest));
          setUser(latest);
        } catch (err) {
          console.warn("Session invalid or expired:", err.message);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      }
    };

    syncAuth(); // run on mount
    window.addEventListener("auth-updated", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth-updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // ✅ Navbar toggler fix for mobile menu open/close
// ✅ Navbar toggle + auto-close on link click (Bootstrap + React safe)
useEffect(() => {
  const toggler = document.getElementById("navbarToggler");
  const collapseEl = document.getElementById("navbarCollapse");

  if (!toggler || !collapseEl || !window.bootstrap) return;

  const collapse = new window.bootstrap.Collapse(collapseEl, {
    toggle: false,
  });

  // Toggle menu on burger icon click
  const handleToggle = (e) => {
    e.stopPropagation();
    const isOpen = collapseEl.classList.contains("show");
    if (isOpen) collapse.hide();
    else collapse.show();
  };

  // Close when clicking outside
  const handleOutsideClick = (e) => {
    const isDropdown = e.target.closest(".dropdown-menu, .dropdown-toggle");
    if (
      collapseEl.classList.contains("show") &&
      !collapseEl.contains(e.target) &&
      !toggler.contains(e.target) &&
      !isDropdown
    ) {
      collapse.hide();
    }
  };

  // 🔥 Auto-close when clicking any NavLink inside menu
  const handleNavLinkClick = () => {
    if (collapseEl.classList.contains("show")) {
      collapse.hide();
    }
  };

  // Attach listeners
  toggler.addEventListener("click", handleToggle);
  document.addEventListener("click", handleOutsideClick);
  collapseEl.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", handleNavLinkClick);
  });

  // Cleanup
  return () => {
    toggler.removeEventListener("click", handleToggle);
    document.removeEventListener("click", handleOutsideClick);
    collapseEl.querySelectorAll(".nav-link").forEach((link) => {
      link.removeEventListener("click", handleNavLinkClick);
    });
  };
}, []);



  const handleContentRequestSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      email: fd.get("email"),
      content_url: fd.get("contentUrl"),
      type: fd.get("type"),
      details: fd.get("details"),
    };

    try {
      await apiFetch("/content-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });

      alert("✅ Your request has been submitted!");
      e.target.reset();

      const modalEl = document.getElementById("contentRequestModal");
      if (modalEl && window.bootstrap) {
        const modal =
          window.bootstrap.Modal.getInstance(modalEl) ||
          new window.bootstrap.Modal(modalEl);
        modal.hide();
      }

      // ✅ Fix black overlay bug (force Bootstrap cleanup)
      setTimeout(() => {
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");

        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((b) => b.parentNode.removeChild(b));
      }, 400); // allow Bootstrap animation to complete
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit request.");
    }
  };

  return (
    <>
      <ScrollAndInit />

      {/* Topbar Start */}
      <div className="container-fluid bg-primary px-5 d-none d-lg-block">
        <div className="row gx-0 align-items-center">
          <div className="col-lg-5 text-center text-lg-start mb-lg-0">
            <div className="d-flex">
              <a href="#" className="text-muted me-4">
                <i className="fas fa-envelope text-secondary me-2"></i>
                RavidassiaAbroad@gmail.com
              </a>
              {/* <a href="#" className="text-muted me-0">
                <i className="fas fa-phone-alt text-secondary me-2"></i>
                +01234567890
              </a> */}
            </div>
          </div>
          <div className="col-lg-3 row-cols-1 text-center mb-2 mb-lg-0">
            <div
              className="d-inline-flex align-items-center"
              style={{ height: 45 }}
            >
              <a
                className="btn btn-sm btn-outline-light btn-square rounded-circle me-2"
                href="https://x.com/ravidassiabroad"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fab fa-twitter fw-normal text-secondary"></i>
              </a>
              <a
                className="btn btn-sm btn-outline-light btn-square rounded-circle me-2"
                href="https://www.facebook.com/RavidassiaAbroad"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fab fa-facebook-f fw-normal text-secondary"></i>
              </a>
              {/* <a className="btn btn-sm btn-outline-light btn-square rounded-circle me-2" href="">
                <i className="fab fa-linkedin-in fw-normal text-secondary"></i>
              </a> */}
              <a
                className="btn btn-sm btn-outline-light btn-square rounded-circle me-2"
                href="https://www.instagram.com/ravidassiaabroad/"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fab fa-instagram fw-normal text-secondary"></i>
              </a>
              <a
                className="btn btn-sm btn-outline-light btn-square rounded-circle"
                href="https://www.youtube.com/c/TheAmbedkarBrand"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fab fa-youtube fw-normal text-secondary"></i>
              </a>
            </div>
          </div>
          <div className="col-lg-4 text-center text-lg-end">
            <div
              className="d-inline-flex align-items-center"
              style={{ height: 45 }}
            >
              <a
                href="#"
                className="text-muted me-2"
                data-bs-toggle="modal"
                data-bs-target="#contentRequestModal"
              >
                Add-Remove-Report Content
              </a>
              {/* Auth (compact) */}
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
          <Link
            to="/"
            className="navbar-brand d-flex align-items-center gap-2 p-0"
          >
            <img
              src="/template/img/brand-logo.png"
              className="img-fluid"
              alt="Ravidassia Community"
            />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            id="navbarToggler"
          >
            <span className="fa fa-bars"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarCollapse">
            <div className="navbar-nav ms-auto py-0">
              <NavLink to="/" end className="nav-item nav-link">
                Home
              </NavLink>
              <NavLink to="/about" className="nav-item nav-link">
                About
              </NavLink>
              <NavLink to="/service" className="nav-item nav-link">
                Community
              </NavLink>

              {/* Pages dropdown (kept as plain dropdown; links inside use NavLink) */}
              <div className="nav-item dropdown">
                <a href="#" className="nav-link" data-bs-toggle="dropdown">
                  <span className="dropdown-toggle">History</span>
                </a>
                <div className="dropdown-menu m-0">
                  <NavLink to="/feature" className="dropdown-item">
                    Feature
                  </NavLink>
                  <NavLink to="/countries" className="dropdown-item">
                    Countries
                  </NavLink>
                  <NavLink to="/testimonial" className="dropdown-item">
                    Testimonial
                  </NavLink>
                  <NavLink to="/training" className="dropdown-item">
                    Training
                  </NavLink>
                  <NavLink to="/not-found" className="dropdown-item">
                    404 Page
                  </NavLink>
                </div>
              </div>

              <NavLink to="/contact" className="nav-item nav-link">
                Contact
              </NavLink>
            </div>

            <button
              className="btn btn-primary btn-md-square border-secondary mb-3 mb-md-3 mb-lg-0 me-3"
              data-bs-toggle="modal"
              data-bs-target="#searchModal"
            >
              <i className="fas fa-search"></i>
            </button>

            <button
              className="btn btn-primary border-secondary rounded-pill py-2 px-4 px-lg-3 mb-3 mb-md-3 mb-lg-0"
              data-bs-toggle="modal"
              data-bs-target="#donateModal"
            >
              Donate Us
            </button>

            {/* Auth section for mobile view */}
            <div className="d-lg-none mt-4 border-top pt-3">
              {user && user.name ? (
                <div className="text-center">
                  {/* User Info */}
                  <div className="d-flex flex-column align-items-center mb-3">
                    <i className="fa fa-user text-secondary fs-3 mb-2"></i>
                    <h6 className="mb-0">{user.name}</h6>
                    <small className="text-muted">
                      {user.role?.toUpperCase()}
                    </small>
                  </div>

                  {/* Auth Action Buttons */}
                  <div className="d-flex flex-column gap-2 px-4">
                    <Link
                      to="/profile"
                      className="btn btn-outline-dark rounded-pill"
                      onClick={() =>
                        document
                          .querySelector(".navbar-collapse")
                          ?.classList.remove("show")
                      }
                    >
                      My Profile
                    </Link>

                    {user.role?.includes("admin") && (
                      <Link
                        to="/admin"
                        className="btn btn-outline-dark rounded-pill"
                        onClick={() =>
                          document
                            .querySelector(".navbar-collapse")
                            ?.classList.remove("show")
                        }
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      className="btn btn-danger rounded-pill"
                      onClick={() => {
                        localStorage.removeItem("user");
                        localStorage.removeItem("token");
                        window.dispatchEvent(new Event("auth-updated"));
                        document
                          .querySelector(".navbar-collapse")
                          ?.classList.remove("show");
                        window.location.href = "/auth";
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center px-4">
                  <Link
                    to="/auth"
                    className="btn btn-outline-dark w-100 rounded-pill mt-2"
                    onClick={() =>
                      document
                        .querySelector(".navbar-collapse")
                        ?.classList.remove("show")
                    }
                  >
                    Sign In / Register
                  </Link>
                </div>
              )}
            </div>

            {/* Donate Modal */}
            <div
              className="modal fade"
              id="donateModal"
              tabIndex="-1"
              aria-labelledby="donateTitle"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="donateTitle">
                      Support Ravidassia Abroad
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Quick amounts */}
                    <div className="mb-3 d-flex flex-wrap gap-2">
                      <span className="text-muted me-2">Quick amount:</span>
                      {["5", "10", "20", "50"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="btn btn-outline-secondary btn-sm rounded-pill"
                          onClick={() => {
                            const input =
                              document.getElementById("donate-amount");
                            if (input) input.value = amt;
                          }}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {/* Form */}
                    <form id="donate-form" className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="donate-amount">
                          Amount (numbers only)
                        </label>
                        <input
                          id="donate-amount"
                          name="amount"
                          type="number"
                          min="1"
                          className="form-control"
                          placeholder="20"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="donate-currency">
                          Currency
                        </label>
                        <select
                          id="donate-currency"
                          name="currency"
                          className="form-select"
                          defaultValue="CAD"
                        >
                          <option>CAD</option>
                          <option>USD</option>
                          <option>INR</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="donate-frequency"
                        >
                          Frequency
                        </label>
                        <select
                          id="donate-frequency"
                          name="frequency"
                          className="form-select"
                          defaultValue="one-time"
                        >
                          <option value="one-time">One-time</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" htmlFor="donor-name">
                          Name (optional)
                        </label>
                        <input
                          id="donor-name"
                          name="name"
                          className="form-control"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="donor-email">
                          Email (for receipt)
                        </label>
                        <input
                          id="donor-email"
                          name="email"
                          type="email"
                          className="form-control"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label" htmlFor="donor-note">
                          Note (optional)
                        </label>
                        <textarea
                          id="donor-note"
                          name="note"
                          className="form-control"
                          rows="2"
                          placeholder="Add a short message"
                        ></textarea>
                      </div>

                      {/* Payment methods */}
                      <div className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-body">
                            <h6 className="mb-3">Choose a payment method</h6>

                            {/* Stripe / PayPal links – replace placeholders below */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              <button
                                type="button"
                                className="btn btn-dark"
                                onClick={() => {
                                  const cur =
                                    document.getElementById("donate-currency")
                                      ?.value || "CAD";
                                  const links = {
                                    CAD: "https://buy.stripe.com/your_cad_payment_link", // TODO replace
                                    USD: "https://buy.stripe.com/your_usd_payment_link", // TODO replace
                                    INR: "https://buy.stripe.com/your_inr_payment_link", // optional
                                  };
                                  window.open(
                                    links[cur] || links["CAD"],
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                              >
                                Pay with Card (Stripe)
                              </button>

                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                  window.open(
                                    "https://www.paypal.com/donate/?hosted_button_id=DVJGK2KP4YBD4",
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                              >
                                PayPal
                              </button>

                              {/* Interac e-Transfer (Canada) */}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={async () => {
                                  const email = "ravidassiaabroad@gmail.com";
                                  try {
                                    await navigator.clipboard.writeText(email);
                                    alert(
                                      "Interac e-Transfer email copied: " +
                                        email
                                    );
                                  } catch {
                                    alert(
                                      "Send Interac e-Transfer to: " + email
                                    );
                                  }
                                }}
                              >
                                Interac e-Transfer (Canada)
                              </button>

                              {/* India (UPI/Razorpay) – optional */}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  window.open(
                                    "https://rzp.io/l/YOUR_RAZORPAY_LINK",
                                    "_blank",
                                    "noopener,noreferrer"
                                  ); // TODO replace
                                }}
                              >
                                UPI / Razorpay (India)
                              </button>
                            </div>

                            <p className="small text-muted mb-0">
                              Your support helps us maintain the website, grow
                              country-wise Sangat groups, and organize community
                              resources.
                            </p>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
      {/* Navbar End */}

      {/* Search Modal (from template) */}
      <div
        className="modal fade"
        id="searchModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content rounded-0">
            <div className="modal-header">
              <h4
                className="modal-title text-secondary mb-0"
                id="exampleModalLabel"
              >
                Search by keyword
              </h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body d-flex align-items-center">
              <div className="input-group w-75 mx-auto d-flex">
                <input
                  type="search"
                  className="form-control p-3"
                  placeholder="keywords"
                  aria-describedby="search-icon-1"
                />
                <span id="search-icon-1" className="input-group-text p-3">
                  <i className="fa fa-search"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Request Modal (Add/Remove/Report) */}
      <div
        className="modal fade"
        id="contentRequestModal"
        tabIndex="-1"
        aria-labelledby="contentRequestTitle"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleContentRequestSubmit}>
              <div className="modal-header">
                <h5 className="modal-title" id="contentRequestTitle">
                  Request to Add / Remove / Report Content
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Your name</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Your email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Content URL or ID (website or social)
                  </label>
                  <input
                    name="contentUrl"
                    className="form-control"
                    placeholder="https://example.com/post/123 or @handle/postID"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Request type</label>
                  <select
                    name="type"
                    className="form-select"
                    defaultValue="Report"
                  >
                    <option value="Report">Report</option>
                    <option value="Add">Add</option>
                    <option value="Remove">Remove</option>
                  </select>
                </div>

                <div className="mb-0">
                  <label className="form-label">Details</label>
                  <textarea
                    name="details"
                    className="form-control"
                    rows="4"
                    placeholder="Explain what needs to be added/removed/reported and why."
                    required
                  />
                </div>

                <p className="text-muted small mt-3 mb-0">
                  By submitting, you agree we may contact you for verification.
                  We aim to review requests within 48 hours.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Page content */}
      <Outlet />

      {/* Footer Start */}
      <div
        className="container-fluid footer py-5 wow fadeIn"
        data-wow-delay="0.2s"
      >
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Contact Info</h4>
                <a href="">
                  <i className="fa fa-map-marker-alt me-2"></i> Halifax, Nova
                  Scotia, Canada
                </a>
                <a href="">
                  <i className="fas fa-envelope me-2"></i>{" "}
                  ravidassiaabroad@gmail.com
                </a>
                <a href="">
                  <i className="fas fa-phone me-2"></i> —{" "}
                </a>
                <a href="" className="mb-3">
                  <i className="fas fa-print me-2"></i> —{" "}
                </a>
                <div className="d-flex align-items-center">
                  <i className="fas fa-share fa-2x text-secondary me-2"></i>
                  <a
                    className="btn mx-1"
                    href="https://www.facebook.com/RavidassiaAbroad"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    className="btn mx-1"
                    href="https://x.com/ravidassiabroad"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    className="btn mx-1"
                    href="https://www.instagram.com/ravidassiaabroad/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    className="btn mx-1"
                    href="https://www.youtube.com/c/TheAmbedkarBrand"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Contact Hours</h4>
                <div className="mb-3">
                  <h6 className="text-muted mb-0">Mon – Fri:</h6>
                  <p className="text-white mb-0">10:00 am – 6:00 pm (AST)</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted mb-0">Saturday:</h6>
                  <p className="text-white mb-0">Community Events</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted mb-0">Sunday:</h6>
                  <p className="text-white mb-0">Closed</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="text-secondary mb-4">Site Links</h4>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> Teachings
                </a>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> History
                </a>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> Temples & Centers
                </a>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> Festivals & Events
                </a>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> Youth Programs
                </a>
                <a href="#" className="">
                  <i className="fas fa-angle-right me-2"></i> Contact
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-secondary mb-4">Newsletter</h4>
                <p className="text-white mb-3">
                  Get monthly updates on Guru Ravidass Ji’s teachings, global
                  Sangat news, festivals, and new community resources.
                </p>
                <div className="position-relative mx-auto rounded-pill">
                  <input
                    className="form-control border-0 rounded-pill w-100 py-3 ps-4 pe-5"
                    type="text"
                    placeholder="Enter your email"
                  />
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill position-absolute top-0 end-0 py-2 mt-2 me-2"
                  >
                    SignUp
                  </button>
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
                <a href="#" className="border-bottom text-white">
                  <i className="fas fa-copyright text-light me-2"></i>
                  Ravidassia Abroad
                </a>
                , All rights reserved.
              </span>
            </div>
            <div className="col-md-6 text-center text-md-end text-white">
              Designed By{" "}
              <a
                className="border-bottom text-white"
                href="https://htmlcodex.com"
              >
                HTML Codex
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Copyright End */}

      {/* Back to Top */}
      <a href="#" className="btn btn-primary btn-lg-square back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
}
