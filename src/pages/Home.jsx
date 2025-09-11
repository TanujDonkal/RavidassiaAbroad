// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { Carousel } from "bootstrap";

export default function Home() {
  const carouselRef = useRef(null);
  const [carousel, setCarousel] = useState(null);

  useEffect(() => {
    document.title = "Ravidassia Abroad";

    if (carouselRef.current) {
      // create (or reuse) the Bootstrap instance from the module API
      const instance =
        Carousel.getInstance(carouselRef.current) ||
        new Carousel(carouselRef.current, {
          interval: 5000,
          pause: "hover",
          wrap: true,
        });
      setCarousel(instance);
    }
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
        <div
          id="carouselId"
          className="carousel slide"
          data-bs-ride="carousel"
          ref={carouselRef}
        >
          <div className="carousel-indicators">
            <button
              type="button"
              data-bs-target="#carouselId"
              data-bs-slide-to="0"
              className="active"
              aria-current="true"
              aria-label="Slide 1"
            />
            <button
              type="button"
              data-bs-target="#carouselId"
              data-bs-slide-to="1"
              aria-label="Slide 2"
            />
          </div>

          <div className="carousel-inner">
            {/* Slide 1 */}
            <div className="carousel-item active">
              <img
                src="/template/img/carousel-1.png"
                className="d-block w-100"
                alt="Ravidassia Abroad global community"
              />
              <div className="carousel-caption">
                <div className="text-center p-4" style={{ maxWidth: "900px" }}>
                  <h4 className="text-white text-uppercase fw-bold mb-3 mb-md-4">
                    Ravidassia Abroad
                  </h4>
                  <h1 className="display-1 text-capitalize text-white mb-3 mb-md-4">
                    A Global Platform for Chamar Community
                  </h1>
                  <p className="text-white mb-4 mb-md-5 fs-5">
                    Connecting Ravidassia abroad with culture, history,
                    teachings &amp; unity.
                  </p>
                  <a
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5"
                    href="#"
                  >
                    Guru Ravidass Maharaj{" "}
                  </a>
                </div>
              </div>
            </div>

            {/* Slide 2 */}
            <div className="carousel-item">
              <img
                src="/template/img/carousel-2.png"
                className="d-block w-100"
                alt="Ravidassia news and events abroad"
              />
              <div className="carousel-caption">
                <div className="text-center p-4" style={{ maxWidth: "900px" }}>
                  <h5 className="text-white text-uppercase fw-bold mb-3 mb-md-4">
                    Ravidassia Abroad{" "}
                  </h5>
                  <h1 className="display-1 text-capitalize text-white mb-3 mb-md-4">
                    News, Events &amp; Sangat Abroad{" "}
                  </h1>
                  <p className="text-white mb-4 mb-md-5 fs-5">
                    From Canada to the UK, USA and beyond—stay updated with our
                    global presence.
                  </p>
                  <a
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5"
                    href="#"
                  >
                    DR Ambedkar{" "}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Controls — call the instance directly */}
          <button
            className="carousel-control-prev"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              carousel && carousel.prev();
            }}
          >
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              carousel && carousel.next();
            }}
          >
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Next</span>
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
                  alt="Ravidassia Abroad community"
                />
                <img
                  src="/template/img/about-3.jpg"
                  className="img-fluid w-100 border-bottom border-5 border-primary"
                  style={{
                    borderTopRightRadius: "300px",
                    borderTopLeftRadius: "300px",
                  }}
                  alt="Global Sangat"
                />
              </div>
            </div>
            <div className="col-xl-7 wow fadeInRight" data-wow-delay="0.3s">
              <h5 className="sub-title pe-3">About the Community</h5>
              <h1 className="display-5 mb-4">About Ravidassia Abroad</h1>
              <p className="mb-4">
                Ravidassia Abroad is a volunteer-run platform for our global
                Sangat. We preserve and share the teachings of Guru Ravidass Ji,
                highlight our history and personalities, list temples &amp;
                centers, and support youth and families staying connected to our
                roots—wherever they live.
              </p>
              <div className="row gy-4 align-items-center">
                <div className="col-12 col-sm-6 d-flex align-items-center">
                  <i className="fas fa-map-marked-alt fa-3x text-secondary"></i>
                  <h5 className="ms-4">Canada Based</h5>
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-center">
                  <i className="fas fa-passport fa-3x text-secondary"></i>
                  <h5 className="ms-4">Uniting Globally</h5>
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
                      Authentic resources &amp; references
                    </p>
                    <p className="text-primary h6 mb-3">
                      <i className="fa fa-check-circle text-secondary me-2"></i>
                      Temples &amp; centers directory
                    </p>
                    <p className="text-primary h6 mb-3">
                      <i className="fa fa-check-circle text-secondary me-2"></i>
                      Youth guidance &amp; community support
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
                        <i className="fa fa-mail-alt text-primary fa-3x"></i>
                        <div
                          className="position-absolute"
                          style={{ top: 0, left: 25 }}
                        >
                          {/* <span>
                            <i className="fa fa-comment-dots text-secondary"></i>
                          </span> */}
                        </div>
                      </a>
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                      <span className="text-primary">Have any questions?</span>
                      <span
                        className="text-secondary fw-bold fs-5"
                        style={{ letterSpacing: "2px" }}
                      >
                        Mail: RavidassiaAbroad@gmail.com
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
                title: "Community Topics",
                value: "31",
                suffix: "+",
              },
              {
                icon: "fas fa-users",
                title: "Contributors",
                value: "377",
                suffix: "+",
              },
              {
                icon: "fas fa-user-check",
                title: "Temples & Centers",
                value: "120",
                suffix: "+",
              },
              {
                icon: "fas fa-handshake",
                title: "Sangat Reach",
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
              <h5 className="sub-title text-primary px-3">
                Jai Bhim Jai Gurudev Ji
              </h5>
            </div>
            <h1 className="display-5 mb-4">Community Highlights</h1>
            
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
                            Explore curated articles, images, and verified
                            references for our Sangat worldwide. Discover
                            culture, teachings, events, and ways to stay
                            connected.
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
            <h1 className="display-5 mb-4">What You’ll Find Here</h1>
            <p className="mb-0">
              Authentic resources, a global network, and community programs that
              help the Ravidassia diaspora stay rooted in values while thriving
              abroad.
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
                      Carefully compiled materials with clear explanations and
                      easy ways to participate in Sangat life abroad.
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
              From Canada and the UK to the USA and India—discover temples,
              events and Sangat groups near you and stay connected to our
              heritage.
            </p>
          </div>

          <div className="row g-4 text-center">
            {[
              {
                hero: "country-1.jpg",
                flag: "brazil.jpg",
                name: "Canada",
                delay: "0.1s",
              },
              {
                hero: "country-2.jpg",
                flag: "india.jpg",
                name: "United Kingdom",
                delay: "0.3s",
              },
              {
                hero: "country-3.jpg",
                flag: "usa.jpg",
                name: "United States",
                delay: "0.5s",
              },
              {
                hero: "country-4.jpg",
                flag: "italy.jpg",
                name: "India",
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
                VOICES FROM THE COMMUNITY
              </h5>
            </div>
            <h1 className="display-5 mb-4">What Our Sangat Says</h1>
            <p className="mb-0">
              Reflections from community members using Ravidassia Abroad to
              learn, connect, and celebrate our heritage.
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
                    {n === 1 &&
                      "This platform keeps me connected with my roots while studying in Canada."}
                    {n === 2 &&
                      "The teachings section helped my kids understand Guru Ravidass Ji’s message clearly."}
                    {n === 3 &&
                      "I found nearby temples and events right after moving—so helpful for settling in."}
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
                    <h5>
                      {n === 1 && "Gurpreet K."}
                      {n === 2 && "Simran D."}
                      {n === 3 && "Harjit S."}
                    </h5>
                    <p className="mb-0">
                      {n === 1 && "Student · Canada"}
                      {n === 2 && "Parent · United Kingdom"}
                      {n === 3 && "Community Volunteer · USA"}
                    </p>
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
                COMMUNITY PROGRAMS
              </h5>
            </div>
            <h1 className="display-5 mb-4">
              Guidance &amp; Learning for Youth and Families
            </h1>
            <p className="mb-0">
              Opportunities to learn Gurbani, celebrate culture, build
              leadership, and find local support—designed to keep our next
              generation rooted and confident.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                img: "training-1.jpg",
                a: "Gurbani",
                b: "Learning",
                title: "Gurbani Learning",
                delay: "0.1s",
              },
              {
                img: "training-2.jpg",
                a: "Cultural",
                b: "Workshops",
                title: "Cultural Workshops",
                delay: "0.3s",
              },
              {
                img: "training-3.jpg",
                a: "Youth",
                b: "Mentorship",
                title: "Youth Mentorship",
                delay: "0.5s",
              },
              {
                img: "training-4.jpg",
                a: "Newcomer",
                b: "Support",
                title: "Newcomer Support",
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
                      Learn, participate, and grow with programs created by and
                      for the community.
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
                <h5 className="sub-title text-primary px-3">Global Sangat</h5>
              </div>
              <h1 className="display-5 mb-4">Explore Our Sangat Worldwide</h1>
              <p className="mb-0">
                Find Shri Guru Ravidass Sabhas and community centers near you.
                This directory grows with community contributions—share updates
                from your city.
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              {[
                {
                  img: "office-2.jpg",
                  name: "Canada",
                  phone: "View Temples →",
                },
                {
                  img: "office-1.jpg",
                  name: "United Kingdom",
                  phone: "View Temples →",
                },
                {
                  img: "office-3.jpg",
                  name: "United States",
                  phone: "View Temples →",
                },
                { img: "office-4.jpg", name: "India", phone: "View Temples →" },
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
                        ravidassiaabroad@gmail.com
                      </a>
                      <p className="mb-0">
                        Submit your local Sabha/temple, city, contact, and event
                        details to help others connect with Sangat.
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
