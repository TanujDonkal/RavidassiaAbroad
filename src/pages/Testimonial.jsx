// src/pages/Testimonial.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Testimonial() {
  useEffect(() => {
    document.title = "Testimonials | Travisa - Visa & Immigration Website Template";
    if (window.__initLegacy) window.__initLegacy(); // re-init owl/wow/counters after route change
  }, []);

  const testimonials = [
    {
      img: "testimonial-1.jpg",
      name: "Person Name",
      role: "Profession",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitati eiusmod tempor incididunt.",
    },
    {
      img: "testimonial-2.jpg",
      name: "Person Name",
      role: "Profession",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitati eiusmod tempor incididunt.",
    },
    {
      img: "testimonial-3.jpg",
      name: "Person Name",
      role: "Profession",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitati eiusmod tempor incididunt.",
    },
  ];

  return (
    <>
      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: 900 }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            Testimonials
          </h3>
          <ol className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown" data-wow-delay="0.3s">
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <a href="#" className="text-white">Pages</a>
            </li>
            <li className="breadcrumb-item active text-secondary">Testimonial</li>
          </ol>
        </div>
      </div>

      {/* Testimonial Section (owl-carousel) */}
      <div className="container-fluid testimonial overflow-hidden pb-5">
        <div className="container py-5">
          <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">OUR CLIENTS RIVIEWS</h5>
            </div>
            <h1 className="display-5 mb-4">What Our Clients Say</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="owl-carousel testimonial-carousel wow zoomInDown" data-wow-delay="0.2s">
            {testimonials.map((t, idx) => (
              <div className="testimonial-item" key={idx}>
                <div className="testimonial-content p-4 mb-5">
                  <p className="fs-5 mb-0">{t.text}</p>
                  <div className="d-flex justify-content-end">
                    <i className="fas fa-star text-secondary"></i>
                    <i className="fas fa-star text-secondary"></i>
                    <i className="fas fa-star text-secondary"></i>
                    <i className="fas fa-star text-secondary"></i>
                    <i className="fas fa-star text-secondary"></i>
                  </div>
                </div>
                <div className="d-flex">
                  <div className="rounded-circle me-4" style={{ width: 100, height: 100 }}>
                    <img className="img-fluid rounded-circle" src={`/template/img/${t.img}`} alt={t.name} />
                  </div>
                  <div className="my-auto">
                    <h5>{t.name}</h5>
                    <p className="mb-0">{t.role}</p>
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
