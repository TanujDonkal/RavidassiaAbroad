// src/pages/Contact.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact Us | Ravidassia Abroad";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const phone = (fd.get("phone") || "").toString().trim();
    const subject = (fd.get("subject") || "").toString().trim();
    const message = (fd.get("message") || "").toString().trim();
    const project = (fd.get("project") || "").toString().trim();

    const mailTo = "ravidassiaabroad@gmail.com";
    const mailSub = encodeURIComponent(
      `${subject || "New message"} — Ravidassia Abroad Website`
    );
    const mailBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nTopic/Project: ${project}\n\nMessage:\n${message}\n`
    );

    window.location.href = `mailto:${mailTo}?subject=${mailSub}&body=${mailBody}`;
  };

  return (
    <>
      {/* Spinner (optional) */}
      <div
        id="spinner"
        className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      >
        <div
          className="spinner-border text-secondary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div
          className="container text-center py-5"
          style={{ maxWidth: "900px" }}
        >
          <h3
            className="text-white display-3 mb-4 wow fadeInDown"
            data-wow-delay="0.1s"
          >
            Contact Us
          </h3>
          <ol
            className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown"
            data-wow-delay="0.3s"
          >
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <a href="#" className="text-white">
                Pages
              </a>
            </li>
            <li className="breadcrumb-item active text-secondary">Contact</li>
          </ol>
        </div>
      </div>

      {/* Contact */}
      <div className="container-fluid contact overflow-hidden py-5">
        <div className="container py-5">
          <div className="row g-5 mb-5">
            {/* Left: Info */}
            <div className="col-lg-6 wow fadeInLeft" data-wow-delay="0.1s">
              <div className="sub-style">
                <h5 className="sub-title text-primary pe-3">Quick Contact</h5>
              </div>
              <h1 className="display-5 mb-4">
                We’re here for the global Ravidassia Sangat
              </h1>
              <p className="mb-5">
                Reach out for community listings, event updates, corrections, or
                to share resources. Students and newcomers are especially
                welcome—ask us anything and we’ll try to guide you to the right
                place.
              </p>

              <div className="d-flex border-bottom mb-4 pb-4">
                <i className="fas fa-map-marked-alt fa-4x text-primary bg-light p-3 rounded"></i>
                <div className="ps-3">
                  <h5>Location</h5>
                  <p className="mb-0">
                    Halifax, Nova Scotia, Canada (Atlantic Time)
                  </p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-xl-6">
                  <div className="d-flex">
                    <i className="fas fa-tty fa-3x text-primary"></i>
                    <div className="ps-3">
                      <h5 className="mb-3">Quick Contact</h5>
                      <div className="mb-3">
                        <h6 className="mb-0">Email:</h6>
                        <a
                          href="https://mail.google.com/mail/?view=cm&fs=1&to=ravidassiaabroad@gmail.com&su=Hello%20Ravidassia%20Abroad"
                          className="text-muted me-4"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="fas fa-envelope text-secondary me-2"></i>
                          RavidassiaAbroad@gmail.com
                        </a>
                      </div>
                      <div className="mb-3">
                        <h6 className="mb-0">Instagram:</h6>
                        <a
                          href="https://www.instagram.com/ravidassiaabroad/"
                          target="_blank"
                          rel="noreferrer"
                          className="fs-6 text-primary"
                        >
                          @ravidassiaabroad
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-6">
                  <div className="d-flex">
                    <i className="fas fa-clone fa-3x text-primary"></i>
                    <div className="ps-3">
                      <h5 className="mb-3">Contact Hours</h5>
                      <div className="mb-1">
                        <h6 className="mb-0">Mon–Fri:</h6>
                        <span className="fs-6 text-primary">
                          10:00 am – 6:00 pm (AST)
                        </span>
                      </div>
                      <div className="mb-1">
                        <h6 className="mb-0">Saturday:</h6>
                        <span className="fs-6 text-primary">
                          Community Events
                        </span>
                      </div>
                      <div>
                        <h6 className="mb-0">Sunday:</h6>
                        <span className="fs-6 text-primary">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="d-flex align-items-center pt-3">
                <div className="me-4">
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ width: 90, height: 90, borderRadius: 10 }}
                  >
                    <i className="fas fa-share fa-3x text-primary"></i>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <a
                    className="btn btn-secondary border-secondary me-2 p-0"
                    href="https://www.facebook.com/RavidassiaAbroad"
                    target="_blank"
                    rel="noreferrer"
                  >
                    facebook <i className="fas fa-chevron-circle-right"></i>
                  </a>
                  <a
                    className="btn btn-secondary border-secondary mx-2 p-0"
                    href="https://x.com/ravidassiabroad"
                    target="_blank"
                    rel="noreferrer"
                  >
                    twitter <i className="fas fa-chevron-circle-right"></i>
                  </a>
                  <a
                    className="btn btn-secondary border-secondary mx-2 p-0"
                    href="https://www.instagram.com/ravidassiaabroad/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    instagram <i className="fas fa-chevron-circle-right"></i>
                  </a>
                  <a
                    className="btn btn-secondary border-secondary mx-2 p-0"
                    href="https://www.youtube.com/c/TheAmbedkarBrand"
                    target="_blank"
                    rel="noreferrer"
                  >
                    youtube <i className="fas fa-chevron-circle-right"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="col-lg-6 wow fadeInRight" data-wow-delay="0.3s">
              <div className="sub-style">
                <h5 className="sub-title text-primary pe-3">Let’s Connect</h5>
              </div>
              <h1 className="display-5 mb-4">Send Your Message</h1>
              <p className="mb-3">
                This form will open your email client with the details
                pre-filled. Prefer direct email? Write to{" "}
                <a
                  className="text-primary fw-bold"
                  href="mailto:ravidassiaabroad@gmail.com"
                >
                  ravidassiaabroad@gmail.com
                </a>
                .
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        placeholder="Your Name"
                        required
                      />
                      <label htmlFor="name">Your Name</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="Your Email"
                        required
                      />
                      <label htmlFor="email">Your Email</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        placeholder="Phone"
                      />
                      <label htmlFor="phone">Your Phone (optional)</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="project"
                        name="project"
                        placeholder="Topic"
                      />
                      <label htmlFor="project">
                        Topic (e.g., Temple Listing)
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="subject"
                        name="subject"
                        placeholder="Subject"
                        required
                      />
                      <label htmlFor="subject">Subject</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        placeholder="Leave a message here"
                        style={{ height: 160 }}
                        required
                      ></textarea>
                      <label htmlFor="message">Message</label>
                    </div>
                  </div>
                  <div className="col-12 d-grid">
                    <button className="btn btn-primary py-3">
                      Send Message
                    </button>
                  </div>
                  <div className="col-12">
                    <p className="small text-muted mb-0">
                      Want to <strong>add / remove / report</strong> content
                      from the site or our socials? Use the link in the top bar
                      or{" "}
                      <a
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#contentRequestModal"
                      >
                        open the request form
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Map (Halifax) */}
          <div className="pt-4">
            <div
              className="section-title text-center mb-4 wow fadeInUp"
              data-wow-delay="0.1s"
            >
              <div className="sub-style">
                <h5 className="sub-title text-primary px-3">Find Us</h5>
              </div>
              <h1 className="display-6 mb-2">Halifax, Nova Scotia</h1>
              <p className="mb-0">
                We’re a digital-first, volunteer-led effort. Meetings are
                usually online; community meetups happen around major events.
              </p>
            </div>

            <div className="row justify-content-center">
              <div className="col-12 wow zoomIn" data-wow-delay="0.1s">
                <div className="rounded h-100">
                  <iframe
                    className="rounded w-100"
                    style={{ height: 480 }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44874.23294107347!2d-63.6204304!3d44.6510708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4b5a2246b7a6c8e9%3A0x8a95a3e8e7f0e9f0!2sHalifax%2C%20NS!5e0!3m2!1sen!2sca!4v1700000000000!5m2!1sen!2sca"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    title="Halifax, NS Map"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top (optional if handled globally) */}
      <a href="#" className="btn btn-primary btn-lg-square back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
}
