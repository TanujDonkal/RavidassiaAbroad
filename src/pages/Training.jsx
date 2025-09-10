// src/pages/Training.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Training() {
  useEffect(() => {
    document.title = "Training | Travisa - Visa & Immigration Website Template";
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
              <a href="#" className="text-white">Pages</a>
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
                      <a href="#" className="h4 text-white mb-0">{t.a}</a>
                      <a href="#" className="h4 text-white mb-0">{t.b}</a>
                    </div>
                  </div>
                  <div className="training-content bg-secondary rounded-bottom p-4">
                    <a href="#"><h4 className="text-white">{t.title}</h4></a>
                    <p className="text-white-50">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem, veritatis.
                    </p>
                    <a className="btn btn-secondary rounded-pill text-white p-0" href="#">
                      Read More <i className="fa fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12 text-center">
              <a className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp" data-wow-delay="0.1s" href="#">
                View More
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
