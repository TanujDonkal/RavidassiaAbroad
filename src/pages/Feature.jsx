// src/pages/Feature.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Feature() {
  useEffect(() => {
    document.title = "Features | Travisa - Visa & Immigration Website Template";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const features = [
    { icon: "fas fa-dollar-sign", title: "Cost-Effective", text: "Dolor, sit amet consectetur adipisicing elit. Soluta inventore cum accusamus,", delay: "0.1s" },
    { icon: "fab fa-cc-visa", title: "Visa Assistance", text: "Dolor, sit amet consectetur adipisicing elit. Soluta inventore cum accusamus,", delay: "0.3s" },
    { icon: "fas fa-atlas", title: "Faster Processing", text: "Dolor, sit amet consectetur adipisicing elit. Soluta inventore cum accusamus,", delay: "0.5s" },
    { icon: "fas fa-users", title: "Direct Interviews", text: "Dolor, sit amet consectetur adipisicing elit. Soluta inventore cum accusamus,", delay: "0.7s" },
  ];

  return (
    <>
      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: 900 }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            Features
          </h3>
          <ol className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown" data-wow-delay="0.3s">
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <a href="#" className="text-white">Pages</a>
            </li>
            <li className="breadcrumb-item active text-secondary">Features</li>
          </ol>
        </div>
      </div>

      {/* Features (from template) */}
      <div className="container-fluid features overflow-hidden py-5">
        <div className="container">
          <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">Why Choose Us</h5>
            </div>
            <h1 className="display-5 mb-4">Offer Tailor Made Services That Our Client Requires</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4 justify-content-center text-center">
            {features.map((f) => (
              <div key={f.title} className="col-md-6 col-lg-6 col-xl-3 wow fadeInUp" data-wow-delay={f.delay}>
                <div className="feature-item text-center p-4">
                  <div className="feature-icon p-3 mb-4">
                    <i className={`${f.icon} fa-4x text-primary`}></i>
                  </div>
                  <div className="feature-content d-flex flex-column">
                    <h5 className="mb-3">{f.title}</h5>
                    <p className="mb-3">{f.text}</p>
                    <a className="btn btn-secondary rounded-pill" href="#">
                      Read More<i className="fas fa-arrow-right ms-2"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12">
              <a className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp" data-wow-delay="0.1s" href="#">
                More Features
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top (optional if global) */}
      <a href="#" className="btn btn-primary btn-lg-square back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
}
