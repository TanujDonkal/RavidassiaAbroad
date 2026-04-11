import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function About() {
  useEffect(() => {
    document.title = "About Us | Ravidassia Abroad";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const countryCards = [
    { hero: "country-canada.jpg", flag: "canada.jpg", name: "Canada", delay: "0.1s" },
    { hero: "country-india.jpg", flag: "india.jpg", name: "India", delay: "0.3s" },
    { hero: "country-uk.jpg", flag: "uk.jpg", name: "United Kingdom", delay: "0.5s" },
    { hero: "country-usa.jpg", flag: "usa.jpg", name: "United States", delay: "0.7s" },
  ];

  const programs = [
    {
      img: "prog-teachings.jpg",
      a: "Teachings",
      b: "Library",
      title: "Teachings & Gurbani Library",
      delay: "0.1s",
      desc: "Curated bani, kathas, and beginner-friendly resources on Guru Ravidass Ji's teachings.",
    },
    {
      img: "prog-temples.jpg",
      a: "Temples",
      b: "Centers",
      title: "Temples & Centers Directory",
      delay: "0.3s",
      desc: "Find nearby Gurdwaras and temples, contact information, service times, and community notices.",
    },
    {
      img: "prog-events.jpg",
      a: "Festivals",
      b: "Events",
      title: "Festivals & Events",
      delay: "0.5s",
      desc: "Stay updated on Gurpurabs, Nagar Kirtans, youth meets, and local seva opportunities.",
    },
    {
      img: "prog-youth.jpg",
      a: "Youth",
      b: "Support",
      title: "Youth & Newcomer Support",
      delay: "0.7s",
      desc: "Helpful guides for students and newcomers on study, housing, jobs, and community contacts.",
    },
  ];

  return (
    <>
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

      <div className="container-fluid bg-breadcrumb">
        <div className="container text-center py-5" style={{ maxWidth: "900px" }}>
          <h3 className="text-white display-3 mb-4 wow fadeInDown" data-wow-delay="0.1s">
            About Ravidassia Abroad
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
              <span
                className="text-white"
                style={{ cursor: "default", textDecoration: "none" }}
                aria-current="page"
              >
                Pages
              </span>
            </li>
            <li className="breadcrumb-item active text-secondary">About</li>
          </ol>
        </div>
      </div>

      <div className="container-fluid overflow-hidden py-5 about-page-shell">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-xl-5 wow fadeInLeft" data-wow-delay="0.1s">
              <div className="about-visual-stack bg-light rounded">
                <img
                  src="/template/img/ra-about-hero.jpg"
                  onError={(e) => {
                    e.currentTarget.src = "/template/img/about-2.png";
                  }}
                  className="img-fluid w-100 about-visual-primary"
                  alt="Ravidassia Abroad"
                />
                <img
                  src="/template/img/ra-sangat.jpg"
                  onError={(e) => {
                    e.currentTarget.src = "/template/img/about-3.jpg";
                  }}
                  className="img-fluid w-100 border-bottom border-5 border-primary about-visual-secondary"
                  alt="Global Sangat"
                />
              </div>
            </div>

            <div className="col-xl-7 wow fadeInRight" data-wow-delay="0.3s">
              <div className="about-copy-panel">
                <span className="about-kicker">Who We Are</span>
                <h1 className="display-5 mb-4 about-page-title">
                  Connecting the global Ravidassia Sangat with resources, history, and seva.
                </h1>
                <p className="mb-4 about-lead">
                  Ravidassia Abroad is a community-driven initiative that helps Sangat across the world
                  stay connected with Guru Ravidass Ji's teachings, explore history, find local temples
                  and centers, celebrate festivals, and support youth programs. We curate verified
                  resources, build country-wise groups, and highlight community events so students,
                  newcomers, and families can find support quickly and respectfully.
                </p>

                <div className="row gy-4 align-items-stretch about-feature-row">
                  <div className="col-12 col-sm-6">
                    <div className="about-feature-card d-flex align-items-center h-100">
                      <i className="fas fa-map-marked-alt fa-3x text-secondary"></i>
                      <h5 className="ms-4 mb-0">Country-wise Sangat and resources</h5>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="about-feature-card d-flex align-items-center h-100">
                      <i className="fas fa-hands-helping fa-3x text-secondary"></i>
                      <h5 className="ms-4 mb-0">Community support and seva</h5>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="about-stat-card bg-light text-center rounded p-4 h-100">
                      <div className="mb-2">
                        <i className="fas fa-globe fa-4x text-primary"></i>
                      </div>
                      <h2 className="display-5 fw-bold mb-2">10+</h2>
                      <p className="text-muted mb-0">Country Groups</p>
                    </div>
                  </div>

                  <div className="col-12 col-md-8">
                    <div className="about-checklist">
                      <p className="text-primary h6 mb-3">
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Verified information on temples, events, and teachings
                      </p>
                      <p className="text-primary h6 mb-3">
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Youth and newcomer-friendly resources for study, housing, and jobs
                      </p>
                      <p className="text-primary h6 mb-4">
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Transparent ways to add, remove, and report content
                      </p>

                      <div className="about-contact-cta d-flex flex-wrap">
                        <div
                          id="phone-tada"
                          className="d-flex align-items-center justify-content-center me-4"
                        >
                          <a
                            href="mailto:ravidassiaabroad@gmail.com"
                            className="position-relative wow tada"
                            data-wow-delay=".9s"
                          >
                            <i className="fa fa-envelope text-primary fa-3x"></i>
                            <div className="position-absolute" style={{ top: 0, left: 25 }}>
                              <span>
                                <i className="fa fa-comment-dots text-secondary"></i>
                              </span>
                            </div>
                          </a>
                        </div>
                        <div className="d-flex flex-column justify-content-center">
                          <span className="text-primary">Have questions or suggestions?</span>
                          <span className="text-secondary fw-bold fs-5 about-contact-email">
                            ravidassiaabroad@gmail.com
                          </span>
                          <span className="small text-muted">
                            You can also use the "Add/Remove/Report Content" link in the top bar.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid counter-facts py-5">
        <div className="container py-5">
          <div className="row g-4">
            {[
              { icon: "fas fa-users", title: "Sangat Members Reached", value: "5", suffix: "K+" },
              { icon: "fas fa-university", title: "Temples & Centers Listed", value: "120", suffix: "+" },
              { icon: "fas fa-calendar-check", title: "Festivals & Events Featured", value: "300", suffix: "+" },
              { icon: "fas fa-book", title: "Resources & Guides", value: "200", suffix: "+" },
            ].map((c, i) => (
              <div
                key={c.title}
                className="col-12 col-sm-6 col-md-6 col-xl-3 wow fadeInUp"
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

      <div className="container-fluid country overflow-hidden py-5">
        <div className="container py-5">
          <div className="section-title text-center wow fadeInUp about-section-head" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">Global Sangat</h5>
            </div>
            <h1 className="display-5 mb-4">Connect by Country or Region</h1>
            <p className="mb-0">
              Join local groups, find nearby temples and centers, and stay updated on festivals,
              kirtan programs, and seva opportunities around the world.
            </p>
          </div>

          <div className="row g-4 text-center">
            {countryCards.map((c) => (
              <div
                key={c.name}
                className="col-lg-6 col-xl-3 mb-5 mb-xl-0 wow fadeInUp"
                data-wow-delay={c.delay}
              >
                <div className="country-item">
                  <div className="rounded overflow-hidden">
                    <img
                      src={`/template/img/${c.hero}`}
                      onError={(e) => {
                        e.currentTarget.src = "/template/img/country-1.jpg";
                      }}
                      className="img-fluid w-100 rounded"
                      alt={c.name}
                    />
                  </div>
                  <div className="country-flag">
                    <img
                      src={`/template/img/${c.flag}`}
                      onError={(e) => {
                        e.currentTarget.src = "/template/img/india.jpg";
                      }}
                      className="img-fluid rounded-circle"
                      alt={`${c.name} Flag`}
                    />
                  </div>
                  <div className="country-name">
                    <Link to="/countries" className="text-white fs-4">
                      {c.name}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-12">
              <Link
                className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp"
                data-wow-delay="0.1s"
                to="/countries"
              >
                Explore All Countries
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid training overflow-hidden bg-light py-5">
        <div className="container py-5">
          <div className="section-title text-center mb-5 wow fadeInUp about-section-head" data-wow-delay="0.1s">
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">What We Do</h5>
            </div>
            <h1 className="display-5 mb-4">Projects & Programs for the Community</h1>
            <p className="mb-0">
              From heritage education to youth support and event listings, we're building simple,
              practical tools for the global Ravidassia community.
            </p>
          </div>

          <div className="row g-4">
            {programs.map((t) => (
              <div key={t.title} className="col-lg-6 col-xl-3 wow fadeInUp" data-wow-delay={t.delay}>
                <div className="training-item">
                  <div className="training-inner">
                    <img
                      src={`/template/img/${t.img}`}
                      onError={(e) => {
                        e.currentTarget.src = "/template/img/training-1.jpg";
                      }}
                      className="img-fluid w-100 rounded"
                      alt={t.title}
                    />
                    <div className="training-title-name">
                      <span className="h4 text-white mb-0">{t.a}</span>
                      <span className="h4 text-white mb-0">{t.b}</span>
                    </div>
                  </div>
                  <div className="training-content bg-secondary rounded-bottom p-4">
                    <span>
                      <h4 className="text-white">{t.title}</h4>
                    </span>
                    <p className="text-white-50">{t.desc}</p>
                    <Link className="btn btn-secondary rounded-pill text-white p-0" to="/about">
                      Read More <i className="fa fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12 text-center">
              <Link
                className="btn btn-primary border-secondary rounded-pill py-3 px-5 wow fadeInUp"
                data-wow-delay="0.1s"
                to="/about"
              >
                View Roadmap
              </Link>
            </div>
          </div>
        </div>
      </div>

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
