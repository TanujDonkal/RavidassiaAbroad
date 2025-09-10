// src/pages/Home.jsx
import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "Ravidassia Abroad";
    // Re-init legacy plugins (Owl Carousel, WOW, counters...) after mount
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  return (
    <>
      {/* ===== Spinner (optional) ===== */}
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

      {/* ===== Navbar & Hero is handled by your Layout/Navbar components ===== */}

      {/* ===== Carousel Start ===== */}
      <div className="carousel-header">
        <div id="carouselId" className="carousel slide" data-bs-ride="carousel">
          <ol className="carousel-indicators">
            <li
              data-bs-target="#carouselId"
              data-bs-slide-to="0"
              className="active"
            ></li>
            <li data-bs-target="#carouselId" data-bs-slide-to="1"></li>
          </ol>
          <div className="carousel-inner" role="listbox">
            <div className="carousel-item active">
              <img
                src="/template/img/carousel-1.png"
                className="img-fluid"
                alt="Image"
              />
              <div className="carousel-caption">
                <div className="text-center p-4" style={{ maxWidth: "900px" }}>
                  <h4
                    className="text-white text-uppercase fw-bold mb-3 mb-md-4 wow fadeInUp"
                    data-wow-delay="0.1s"
                  >
                    Chamar Community{" "}
                  </h4>
                  <h1
                    className="display-1 text-capitalize text-white mb-3 mb-md-4 wow fadeInUp"
                    data-wow-delay="0.3s"
                  >
                    A Global Platform for Ravidassia Community
                  </h1>
                  <p
                    className="text-white mb-4 mb-md-5 fs-5 wow fadeInUp"
                    data-wow-delay="0.5s"
                  >
                    Connecting Ravidassia abroad with culture, history,
                    teachings & unity.
                  </p>
                  <a
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5 wow fadeInUp"
                    data-wow-delay="0.7s"
                    href="#"
                  >
                    More Details
                  </a>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="/template/img/carousel-2.jpg"
                className="img-fluid"
                alt="Image"
              />
              <div className="carousel-caption">
                <div className="text-center p-4" style={{ maxWidth: "900px" }}>
                  <h5
                    className="text-white text-uppercase fw-bold mb-3 mb-md-4 wow fadeInUp"
                    data-wow-delay="0.1s"
                  >
                    Solution For All Type Of Visas
                  </h5>
                  <h1
                    className="display-1 text-capitalize text-white mb-3 mb-md-4 wow fadeInUp"
                    data-wow-delay="0.3s"
                  >
                    Best Visa Immigrations Services
                  </h1>
                  <p
                    className="text-white mb-4 mb-md-5 fs-5 wow fadeInUp"
                    data-wow-delay="0.5s"
                  >
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s,
                  </p>
                  <a
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5 wow fadeInUp"
                    data-wow-delay="0.7s"
                    href="#"
                  >
                    More Details
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselId"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon bg-secondary wow fadeInLeft"
              data-wow-delay="0.2s"
              aria-hidden="false"
            ></span>
            <span className="visually-hidden-focusable">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselId"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon bg-secondary wow fadeInRight"
              data-wow-delay="0.2s"
              aria-hidden="false"
            ></span>
            <span className="visually-hidden-focusable">Next</span>
          </button>
        </div>
      </div>
      {/* ===== Carousel End ===== */}

      {/* ===== Modal Search Start (optional; trigger is in Navbar button) ===== */}
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
      {/* ===== Modal Search End ===== */}

      {/* ===== About Start ===== */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-xl-5 wow fadeInLeft" data-wow-delay="0.1s">
              <div className="bg-light rounded">
                <img
                  src="/template/img/about-2.png"
                  className="img-fluid w-100"
                  style={{ marginBottom: "-7px" }}
                  alt="Image"
                />
                <img
                  src="/template/img/about-3.jpg"
                  className="img-fluid w-100 border-bottom border-5 border-primary"
                  style={{
                    borderTopRightRadius: "300px",
                    borderTopLeftRadius: "300px",
                  }}
                  alt="Image"
                />
              </div>
            </div>
            <div className="col-xl-7 wow fadeInRight" data-wow-delay="0.3s">
              <h5 className="sub-title pe-3">About the company</h5>
              <h1 className="display-5 mb-4">About Ravidassia Abroad</h1>
              <p className="mb-4">
                Ravidassia Abroad is a community platform dedicated to
                connecting Ravidassia people worldwide. We share teachings of
                Guru Ravidass Ji, promote unity, and preserve our rich culture
                and traditions across the globe.
              </p>
              <div className="row gy-4 align-items-center">
                <div className="col-12 col-sm-6 d-flex align-items-center">
                  <i className="fas fa-map-marked-alt fa-3x text-secondary"></i>
                  <h5 className="ms-4">Best Immigration Resources</h5>
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-center">
                  <i className="fas fa-passport fa-3x text-secondary"></i>
                  <h5 className="ms-4">Return Visas Availabile</h5>
                </div>
                <div className="col-4 col-md-3">
                  <div className="bg-light text-center rounded p-3">
                    <div className="mb-2">
                      <i className="fas fa-ticket-alt fa-4x text-primary"></i>
                    </div>
                    <h1 className="display-5 fw-bold mb-2">50+</h1>
                    <p className="text-muted mb-0">Countries connected</p>
                  </div>
                </div>
                <div className="col-8 col-md-9">
                  <div className="mb-5">
                    <p className="text-primary h6 mb-3">
                      <i className="fa fa-check-circle text-secondary me-2"></i>
                      Rich cultural heritage
                    </p>
                    <p className="text-primary h6 mb-3">
                      <i className="fa fa-check-circle text-secondary me-2"></i>
                      Teachings of Guru Ravidass Ji
                    </p>
                    <p className="text-primary h6 mb-3">
                      <i className="fa fa-check-circle text-secondary me-2"></i>
                      Community support{" "}
                    </p>
                  </div>
                  <div className="d-flex flex-wrap">
                    <div
                      id="phone-tada"
                      className="d-flex align-items-center justify-content-center me-4"
                    >
                      <a
                        href=""
                        className="position-relative wow tada"
                        data-wow-delay=".9s"
                      >
                        <i className="fa fa-phone-alt text-primary fa-3x"></i>
                        <div
                          className="position-absolute"
                          style={{ top: 0, left: 25 }}
                        >
                          <span>
                            <i className="fa fa-comment-dots text-secondary"></i>
                          </span>
                        </div>
                      </a>
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                      <span className="text-primary">Have any questions?</span>
                      <span
                        className="text-secondary fw-bold fs-5"
                        style={{ letterSpacing: "2px" }}
                      >
                        Free: +0123 456 7890
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===== About End ===== */}

      {/* ===== Counter Facts Start ===== */}
      <div className="container-fluid counter-facts py-5">
        <div className="container py-5">
          <div className="row g-4">
            {[
              {
                icon: "fas fa-passport",
                title: "Visa Categories",
                value: "31",
                suffix: "+",
              },
              {
                icon: "fas fa-users",
                title: "Team Members",
                value: "377",
                suffix: "+",
              },
              {
                icon: "fas fa-user-check",
                title: "Visa Process",
                value: "4.9",
                suffix: "K",
              },
              {
                icon: "fas fa-handshake",
                title: "Success Rates",
                value: "98",
                suffix: "%",
              },
            ].map((c, i) => (
              <div
                key={c.title}
                className={`col-12 col-sm-6 col-md-6 col-xl-3 wow fadeInUp`}
                data-wow-delay={`${0.1 + i * 0.2}s`}
              >
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
                      <h4
                        className="text-secondary mb-0"
                        style={{ fontWeight: 600, fontSize: 25 }}
                      >
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
      {/* ===== Counter Facts End ===== */}

      {/* ===== Services Start ===== */}
      <div className="container-fluid service overflow-hidden pt-5">
        <div className="container py-5">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">Visa Categories</h5>
            </div>
            <h1 className="display-5 mb-4">Community Highlights</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
              deleniti amet at atque sequi quibusdam cumque itaque repudiandae
              temporibus, eius nam mollitia voluptas maxime veniam
              necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4">
            {[
              { img: "service-1.jpg", title: "History of Guru Ravidass Ji" },
              { img: "service-2.jpg", title: "Teachings & Gurbani" },
              { img: "service-3.jpg", title: "Festivals & Events" },
              { img: "service-1.jpg", title: "Community Leaders" },
              { img: "service-2.jpg", title: "Temples & Centers" },
              { img: "service-3.jpg", title: "Youth Abroad" },
            ].map((s, idx) => (
              <div
                key={s.title + idx}
                className={`col-lg-6 col-xl-4 wow fadeInUp`}
                data-wow-delay={`${0.1 + (idx % 3) * 0.2}s`}
              >
                <div className="service-item">
                  <div className="service-inner">
                    <div className="service-img">
                      <img
                        src={`/template/img/${s.img}`}
                        className="img-fluid w-100 rounded"
                        alt={s.title}
                      />
                    </div>
                    <div className="service-title">
                      <div className="service-title-name">
                        <div className="bg-primary text-center rounded p-3 mx-5 mb-4">
                          <a href="#" className="h4 text-white mb-0">
                            {s.title}
                          </a>
                        </div>
                        <a
                          className="btn bg-light text-secondary rounded-pill py-3 px-5 mb-4"
                          href="#"
                        >
                          Explore More
                        </a>
                      </div>
                      <div className="service-content pb-4">
                        <a href="#">
                          <h4 className="text-white mb-4 py-3">{s.title}</h4>
                        </a>
                        <div className="px-4">
                          <p className="mb-4">
                            Lorem ipsum dolor sit amet consectetur, adipisicing
                            elit. Mollitia fugit dolores nesciunt adipisci
                            obcaecati veritatis cum, ratione aspernatur autem
                            velit.
                          </p>
                          <a
                            className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5"
                            href="#"
                          >
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
      {/* ===== Services End ===== */}

      {/* ===== Features Start ===== */}
      <div className="container-fluid features overflow-hidden py-5">
        <div className="container">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                Why Ravidassia Abroad?
              </h5>
            </div>
            <h1 className="display-5 mb-4">Authentic Teachings </h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
              deleniti amet at atque sequi quibusdam cumque itaque repudiandae
              temporibus, eius nam mollitia voluptas maxime veniam
              necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4 justify-content-center text-center">
            {[
              { icon: "fas fa-dollar-sign", title: "Authentic Teachings" },
              { icon: "fab fa-cc-visa", title: "Global Community Network" },
              { icon: "fas fa-atlas", title: "Events & Festivals Updates" },
              { icon: "fas fa-users", title: "Support for Youth & Families" },
            ].map((f, i) => (
              <div
                key={f.title}
                className="col-md-6 col-lg-6 col-xl-3 wow fadeInUp"
                data-wow-delay={`${0.1 + i * 0.2}s`}
              >
                <div className="feature-item text-center p-4">
                  <div className="feature-icon p-3 mb-4">
                    <i className={`${f.icon} fa-4x text-primary`}></i>
                  </div>
                  <div className="feature-content d-flex flex-column">
                    <h5 className="mb-3">{f.title}</h5>
                    <p className="mb-3">
                      Dolor, sit amet consectetur adipisicing el55kit. Soluta
                      inventore cum accusamus,
                    </p>
                    <a className="btn btn-secondary rounded-pill" href="#">
                      Read More<i className="fas fa-arrow-right ms-2"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-12">
              <a
                className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp"
                data-wow-delay="0.1s"
                href="#"
              >
                More Features
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* ===== Features End ===== */}

      {/* ===== Countries We Offer Start ===== */}
      <div className="container-fluid country overflow-hidden py-5">
        <div className="container">
          <div
            className="section-title text-center wow fadeInUp"
            data-wow-delay="0.1s"
            style={{ marginBottom: "70px" }}
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                Our Global Presence
              </h5>
            </div>
            <h1 className="display-5 mb-4">
              Our Ravidassia Sangat is spread across many countries, keeping our
              heritage alive.
            </h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
              deleniti amet at atque sequi quibusdam cumque itaque repudiandae
              temporibus, eius nam mollitia voluptas maxime veniam
              necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4 text-center">
            {[
              {
                hero: "country-1.jpg",
                flag: "brazil.jpg",
                name: "Brazil",
                delay: "0.1s",
              },
              {
                hero: "country-2.jpg",
                flag: "india.jpg",
                name: "india",
                delay: "0.3s",
              },
              {
                hero: "country-3.jpg",
                flag: "usa.jpg",
                name: "New York",
                delay: "0.5s",
              },
              {
                hero: "country-4.jpg",
                flag: "italy.jpg",
                name: "Italy",
                delay: "0.7s",
              },
            ].map((c) => (
              <div
                key={c.name}
                className="col-lg-6 col-xl-3 mb-5 mb-xl-0 wow fadeInUp"
                data-wow-delay={c.delay}
              >
                <div className="country-item">
                  <div className="rounded overflow-hidden">
                    <img
                      src={`/template/img/${c.hero}`}
                      className="img-fluid w-100 rounded"
                      alt="Country"
                    />
                  </div>
                  <div className="country-flag">
                    <img
                      src={`/template/img/${c.flag}`}
                      className="img-fluid rounded-circle"
                      alt="Flag"
                    />
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
              <a
                className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp"
                data-wow-delay="0.1s"
                href="#"
              >
                More Countries
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* ===== Countries We Offer End ===== */}

      {/* ===== Testimonial Start ===== */}
      <div className="container-fluid testimonial overflow-hidden pb-5">
        <div className="container py-5">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                OUR CLIENTS RIVIEWS
              </h5>
            </div>
            <h1 className="display-5 mb-4">What Our Clients Say</h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
              deleniti amet at atque sequi quibusdam cumque itaque repudiandae
              temporibus, eius nam mollitia voluptas maxime veniam
              necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div
            className="owl-carousel testimonial-carousel wow zoomInDown"
            data-wow-delay="0.2s"
          >
            {[1, 2, 3].map((n) => (
              <div key={n} className="testimonial-item">
                <div className="testimonial-content p-4 mb-5">
                  <p className="fs-5 mb-0">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitati
                    eiusmod tempor incididunt.
                  </p>
                  <div className="d-flex justify-content-end">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="fas fa-star text-secondary"></i>
                    ))}
                  </div>
                </div>
                <div className="d-flex">
                  <div
                    className="rounded-circle me-4"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <img
                      className="img-fluid rounded-circle"
                      src={`/template/img/testimonial-${n}.jpg`}
                      alt="img"
                    />
                  </div>
                  <div className="my-auto">
                    <h5>Person Name</h5>
                    <p className="mb-0">Profession</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ===== Testimonial End ===== */}

      {/* ===== Training Start ===== */}
      <div className="container-fluid training overflow-hidden bg-light py-5">
        <div className="container py-5">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                CHECK OUR TRAINING
              </h5>
            </div>
            <h1 className="display-5 mb-4">
              Get the Best Coacing Service Training with Our Travisa
            </h1>
            <p className="mb-0">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
              deleniti amet at atque sequi quibusdam cumque itaque repudiandae
              temporibus, eius nam mollitia voluptas maxime veniam
              necessitatibus saepe in ab? Repellat!
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                img: "training-1.jpg",
                a: "IELTS",
                b: "Coaching",
                title: "IELTS Coaching",
                delay: "0.1s",
              },
              {
                img: "training-2.jpg",
                a: "TOEFL",
                b: "Coaching",
                title: "TOEFL Coaching",
                delay: "0.3s",
              },
              {
                img: "training-3.jpg",
                a: "PTE",
                b: "Coaching",
                title: "PTE Coaching",
                delay: "0.5s",
              },
              {
                img: "training-4.jpg",
                a: "OET",
                b: "Coaching",
                title: "OET Coaching",
                delay: "0.7s",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="col-lg-6 col-lg-6 col-xl-3 wow fadeInUp"
                data-wow-delay={t.delay}
              >
                <div className="training-item">
                  <div className="training-inner">
                    <img
                      src={`/template/img/${t.img}`}
                      className="img-fluid w-100 rounded"
                      alt="Training"
                    />
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
                    <p className="text-white-50">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit.
                      Autem, veritatis.
                    </p>
                    <a
                      className="btn btn-secondary rounded-pill text-white p-0"
                      href="#"
                    >
                      Read More <i className="fa fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-12 text-center">
              <a
                className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp"
                data-wow-delay="0.1s"
                href="#"
              >
                View More
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* ===== Training End ===== */}

      {/* ===== Contact (Offices) Start ===== */}
      <div className="container-fluid contact overflow-hidden pb-5">
        <div className="container py-5">
          <div className="office pt-5">
            <div
              className="section-title text-center mb-5 wow fadeInUp"
              data-wow-delay="0.1s"
            >
              <div className="sub-style">
                <h5 className="sub-title text-primary px-3">
                  Worlwide Offices
                </h5>
              </div>
              <h1 className="display-5 mb-4">Explore Our Office Worldwide</h1>
              <p className="mb-0">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat
                deleniti amet at atque sequi quibusdam cumque itaque repudiandae
                temporibus, eius nam mollitia voluptas maxime veniam
                necessitatibus saepe in ab? Repellat!
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              {[
                {
                  img: "office-2.jpg",
                  name: "Australia",
                  phone: "+123.456.7890",
                },
                {
                  img: "office-1.jpg",
                  name: "Canada",
                  phone: "(012) 0345 6789",
                },
                {
                  img: "office-3.jpg",
                  name: "United Kingdom",
                  phone: "01234.567.890",
                },
                { img: "office-4.jpg", name: "India", phone: "+123.45.67890" },
              ].map((o, i) => (
                <div
                  key={o.name}
                  className="col-md-6 col-lg-6 col-xl-3 wow fadeInUp"
                  data-wow-delay={`${0.1 + i * 0.2}s`}
                >
                  <div className="office-item p-4">
                    <div className="office-img mb-4">
                      <img
                        src={`/template/img/${o.img}`}
                        className="img-fluid w-100 rounded"
                        alt={o.name}
                      />
                    </div>
                    <div className="office-content d-flex flex-column">
                      <h4 className="mb-2">{o.name}</h4>
                      <a href="#" className="text-secondary fs-5 mb-2">
                        {o.phone}
                      </a>
                      <a href="#" className="text-muted fs-5 mb-2">
                        travisa@example.com
                      </a>
                      <p className="mb-0">
                        123, First Floor, 123 St Roots Terrace, Los Angeles
                        90010 Unitd States of America.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ===== Contact (Offices) End ===== */}

      {/* Back to Top (optional; could be global) */}
      <a href="#" className="btn btn-primary btn-lg-square back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
}
