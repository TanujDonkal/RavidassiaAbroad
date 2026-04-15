// src/pages/Training.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Training() {
  useEffect(() => {
    document.title = "Programs and Learning | Ravidassia Abroad";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const trainings = [
    { img: "training-1.jpg", a: "IELTS", b: "Coaching", title: "IELTS Coaching", delay: "0.1s" },
    { img: "training-2.jpg", a: "TOEFL", b: "Coaching", title: "TOEFL Coaching", delay: "0.3s" },
    { img: "training-3.jpg", a: "PTE", b: "Coaching", title: "PTE Coaching", delay: "0.5s" },
    { img: "training-4.jpg", a: "OET",  b: "Coaching", title: "OET Coaching",  delay: "0.7s" },
  ];

  return (
    <>
      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: 900 }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            Training
          </h3>
          <ol className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown" data-wow-delay="0.3s">
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <span className="text-white" style={{ cursor: "default", textDecoration: "none" }} aria-current="page">Pages</span>
            </li>
            <li className="breadcrumb-item active text-secondary">Training</li>
          </ol>
        </div>
      </div>

      {/* Training Section (from template) */}
      <div className="container-fluid training overflow-hidden bg-light py-5">
        <div className="container py-5">
          <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">CHECK OUR TRAINING</h5>
            </div>
            <h1 className="display-5 mb-4">Get the Best Coacing Service Training with Our Travisa</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4">
            {trainings.map((t) => (
              <div key={t.title} className="col-lg-6 col-lg-6 col-xl-3 wow fadeInUp" data-wow-delay={t.delay}>
                <div className="training-item">
                  <div className="training-inner">
                    <img src={`/template/img/${t.img}`} className="img-fluid w-100 rounded" alt={t.title} />
                    <div className="training-title-name">
                      <span className="h4 text-white mb-0" style={{ cursor: "default" }}>{t.a}</span>
                      <span className="h4 text-white mb-0" style={{ cursor: "default" }}>{t.b}</span>
                    </div>
                  </div>
                  <div className="training-content bg-secondary rounded-bottom p-4">
                    <span className="text-white" style={{ cursor: "default" }}><h4>{t.title}</h4></span>
                    <p className="text-white-50">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem, veritatis.
                    </p>
                    <button className="btn btn-secondary rounded-pill text-white p-0" type="button" disabled style={{ pointerEvents: "none" }}>
                      Read More <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12 text-center">
              <button className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp" data-wow-delay="0.1s" type="button" disabled style={{ pointerEvents: "none" }}>
                View More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top (optional if global) */}
      <button
        type="button"
        className="btn btn-primary btn-lg-square back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <i className="fa fa-arrow-up"></i>
      </button>
    </>
  );
}
