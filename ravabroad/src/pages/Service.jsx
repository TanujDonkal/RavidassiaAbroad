// src/pages/Service.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Service() {
  useEffect(() => {
    document.title = "Services | Travisa - Visa & Immigration Website Template";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const services = [
    { img: "service-1.jpg", title: "Job Visa", delay: "0.1s" },
    { img: "service-2.jpg", title: "Business Visa", delay: "0.3s" },
    { img: "service-3.jpg", title: "Diplometic Visa", delay: "0.5s" },
    { img: "service-1.jpg", title: "Students Visa", delay: "0.1s" },
    { img: "service-2.jpg", title: "Residence Visa", delay: "0.3s" },
    { img: "service-3.jpg", title: "Tourist Visa", delay: "0.5s" },
  ];

  return (
    <>
      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: 900 }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            Services
          </h3>
          <ol className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown" data-wow-delay="0.3s">
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <a href="#" className="text-white">Pages</a>
            </li>
            <li className="breadcrumb-item active text-secondary">Services</li>
          </ol>
        </div>
      </div>

      {/* Services (from template) */}
      <div className="container-fluid service overflow-hidden pt-5">
        <div className="container py-5">
          <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">Visa Categories</h5>
            </div>
            <h1 className="display-5 mb-4">Enabling Your Immigration Successfully</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4">
            {services.map((s, idx) => (
              <div key={`${s.title}-${idx}`} className="col-lg-6 col-xl-4 wow fadeInUp" data-wow-delay={s.delay}>
                <div className="service-item">
                  <div className="service-inner">
                    <div className="service-img">
                      <img src={`/template/img/${s.img}`} className="img-fluid w-100 rounded" alt={s.title} />
                    </div>

                    <div className="service-title">
                      <div className="service-title-name">
                        <div className="bg-primary text-center rounded p-3 mx-5 mb-4">
                          <a href="#" className="h4 text-white mb-0">{s.title}</a>
                        </div>
                        <a className="btn bg-light text-secondary rounded-pill py-3 px-5 mb-4" href="#">
                          Explore More
                        </a>
                      </div>

                      <div className="service-content pb-4">
                        <a href="#"><h4 className="text-white mb-4 py-3">{s.title}</h4></a>
                        <div className="px-4">
                          <p className="mb-4">
                            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Mollitia fugit dolores nesciunt adipisci obcaecati veritatis cum, ratione aspernatur autem velit.
                          </p>
                          <a className="btn btn-primary border-secondary rounded-pill py-3 px-5" href="#">
                            Explore More
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
