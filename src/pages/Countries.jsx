// src/pages/Countries.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Countries() {
  useEffect(() => {
    document.title = "Countries | Travisa - Visa & Immigration Website Template";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const countries = [
    { hero: "country-1.jpg", flag: "brazil.jpg", name: "Brazil", delay: "0.1s" },
    { hero: "country-2.jpg", flag: "india.jpg", name: "india", delay: "0.3s" },
    { hero: "country-3.jpg", flag: "usa.jpg", name: "New York", delay: "0.5s" },
    { hero: "country-4.jpg", flag: "italy.jpg", name: "Italy", delay: "0.7s" },
  ];

  const counters = [
    { icon: "fas fa-passport", title: "Visa Categories", value: "31", suffix: "+" },
    { icon: "fas fa-users", title: "Team Members", value: "377", suffix: "+" },
    { icon: "fas fa-user-check", title: "Visa Process", value: "4.9", suffix: "K" },
    { icon: "fas fa-handshake", title: "Success Rates", value: "98", suffix: "%" },
  ];

  const trainings = [
    { img: "training-1.jpg", a: "IELTS", b: "Coaching", title: "IELTS Coaching", delay: "0.1s" },
    { img: "training-2.jpg", a: "TOEFL", b: "Coaching", title: "TOEFL Coaching", delay: "0.3s" },
    { img: "training-3.jpg", a: "PTE", b: "Coaching", title: "PTE Coaching", delay: "0.5s" },
    { img: "training-4.jpg", a: "OET", b: "Coaching", title: "OET Coaching", delay: "0.7s" },
  ];

  return (
    <>
      {/* Spinner (optional) */}
      <div
        id="spinner"
        className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      >
        <div className="spinner-border text-secondary" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Modal Search (optional; trigger can be in Navbar) */}
      <div className="modal fade" id="searchModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content rounded-0">
            <div className="modal-header">
              <h4 className="modal-title text-secondary mb-0" id="exampleModalLabel">
                Search by keyword
              </h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body d-flex align-items-center">
              <div className="input-group w-75 mx-auto d-flex">
                <input type="search" className="form-control p-3" placeholder="keywords" aria-describedby="search-icon-1" />
                <span id="search-icon-1" className="input-group-text p-3">
                  <i className="fa fa-search"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header / Breadcrumb */}
      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: "900px" }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            Our Countries Offer
          </h3>
          <ol className="breadcrumb justify-content-center text-white mb-0 wow fadeInDown" data-wow-delay="0.3s">
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
            <li className="breadcrumb-item active text-secondary">Countries</li>
          </ol>
        </div>
      </div>

      {/* Countries We Offer */}
      <div className="container-fluid country overflow-hidden py-5">
        <div className="container py-5">
          <div className="section-title text-center wow fadeInUp" data-wow-delay="0.1s" style={{ marginBottom: "70px" }}>
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">COUNTRIES WE OFFER</h5>
            </div>
            <h1 className="display-5 mb-4">Immigration & visa services following Countries</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam
              cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab?
              Repellat!
            </p>
          </div>

          <div className="row g-4 text-center">
            {countries.map((c) => (
              <div key={c.name} className="col-lg-6 col-xl-3 mb-5 mb-xl-0 wow fadeInUp" data-wow-delay={c.delay}>
                <div className="country-item">
                  <div className="rounded overflow-hidden">
                    <img src={`/template/img/${c.hero}`} className="img-fluid w-100 rounded" alt="Country" />
                  </div>
                  <div className="country-flag">
                    <img src={`/template/img/${c.flag}`} className="img-fluid rounded-circle" alt="Flag" />
                  </div>
                  <div className="country-name">
                    <a href="#" className="text-white fs-4">
                      {c.name}
                    </a>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-12">
              <a className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp" data-wow-delay="0.1s" href="#">
                More Countries
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Counter Facts */}
      <div className="container-fluid counter-facts overflow-hidden py-5">
        <div className="container py-5">
          <div className="row g-4">
            {counters.map((c, i) => (
              <div key={c.title} className="col-12 col-sm-6 col-md-6 col-xl-3 wow fadeInUp" data-wow-delay={`${0.1 + i * 0.2}s`}>
                <div className="counter">
                  <div className="counter-icon">
                    <i className={c.icon}></i>
                  </div>
                  <div className="counter-content">
                    <h3>{c.title}</h3>
                    <div className="d-flex align-items-center justify-content-center">
                      <span className="counter-value" data-toggle="counter-up">
                        {c.value}
                      </span>
                      <h4 className="text-secondary mb-0" style={{ fontWeight: 600, fontSize: 25 }}>
                        {c.suffix}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training */}
      <div className="container-fluid training overflow-hidden bg-light py-5">
        <div className="container py-5">
          <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">CHECK OUR TRAINING</h5>
            </div>
            <h1 className="display-5 mb-4">Get the Best Coacing Service Training with Our Travisa</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam
              cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in ab?
              Repellat!
            </p>
          </div>

          <div className="row g-4">
            {trainings.map((t) => (
              <div key={t.title} className="col-lg-6 col-lg-6 col-xl-3 wow fadeInUp" data-wow-delay={t.delay}>
                <div className="training-item">
                  <div className="training-inner">
                    <img src={`/template/img/${t.img}`} className="img-fluid w-100 rounded" alt="Training" />
                    <div className="training-title-name">
                      <a href="#" className="h4 text-white mb-0">
                        {t.a}
                      </a>
                      <a href="#" className="h4 text-white mb-0">
                        {t.b}
                      </a>
                    </div>
                  </div>
                  <div className="training-content bg-secondary rounded-bottom p-4">
                    <a href="#">
                      <h4 className="text-white">{t.title}</h4>
                    </a>
                    <p className="text-white-50">Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem, veritatis.</p>
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

      {/* Back to Top (optional if handled globally) */}
      <a href="#" className="btn btn-primary btn-lg-square back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
}
