import React, { useEffect, useRef, useState } from "react";
import { Carousel } from "bootstrap";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

const communityFacts = [
  {
    icon: "fas fa-passport",
    title: "Community Topics",
    value: "31+",
    description: "Guides, articles, and heritage resources.",
  },
  {
    icon: "fas fa-users",
    title: "Contributors",
    value: "377+",
    description: "Volunteers, writers, and community members.",
  },
  {
    icon: "fas fa-place-of-worship",
    title: "Temples & Centers",
    value: "120+",
    description: "Growing directories across regions.",
  },
  {
    icon: "fas fa-handshake",
    title: "Sangat Reach",
    value: "98%",
    description: "Focused on practical community support.",
  },
];

const highlights = [
  {
    img: "service-1.jpg",
    title: "History of Guru Ravidass Ji",
    description:
      "Foundational stories, timelines, and articles that help younger generations understand our roots clearly.",
    href: "/history",
    cta: "Explore History",
  },
  {
    img: "service-2.png",
    title: "Teachings & Gurbani",
    description:
      "Accessible reading paths into Guru Ravidass Ji's teachings with context that is easier to follow abroad.",
    href: "/articles/guru-ravidass",
    cta: "Read Teachings",
  },
  {
    img: "service-3.jpg",
    title: "Festivals & Events",
    description:
      "Updates that help Sangat families find major celebrations, local programs, and community gatherings.",
    href: "/blogs",
    cta: "View Updates",
  },
  {
    img: "service-4.jpg",
    title: "Community Leaders",
    description:
      "Profiles, stories, and important voices who shaped and continue to support the community worldwide.",
    href: "/personalities",
    cta: "Meet Leaders",
  },
  {
    img: "service-5.jpg",
    title: "Temples & Centers",
    description:
      "Discover local Sabhas, temples, and centers that keep families connected to Sangat and seva.",
    href: "/temples-globally",
    cta: "Find Temples",
  },
  {
    img: "service-3.jpg",
    title: "Youth Abroad",
    description:
      "Helpful pathways for students and families looking for learning, belonging, and confidence in a new country.",
    href: "/students",
    cta: "Support Youth",
  },
];

const features = [
  {
    icon: "fas fa-book-open",
    title: "Authentic Teachings",
    description:
      "Faith-centered learning that is easier to read, share, and revisit as a family.",
    href: "/articles/guru-ravidass",
  },
  {
    icon: "fas fa-globe-americas",
    title: "Global Community Network",
    description:
      "Practical ways to stay connected with Sangat across countries and generations.",
    href: "/connect-scst",
  },
  {
    icon: "fas fa-calendar-check",
    title: "Events & Festival Updates",
    description:
      "Community happenings gathered in one place so people do not miss important dates.",
    href: "/blogs",
  },
  {
    icon: "fas fa-hands-helping",
    title: "Support for Youth & Families",
    description:
      "Programs and resources that help people stay rooted while building life abroad.",
    href: "/students",
  },
];

const countries = [
  {
    hero: "country-1.jpg",
    flag: "brazil.jpg",
    name: "Canada",
    detail: "Events, Sangat, and directories",
    href: "/temples-globally",
  },
  {
    hero: "country-2.jpg",
    flag: "india.jpg",
    name: "United Kingdom",
    detail: "Sabhas, updates, and outreach",
    href: "/temples-globally",
  },
  {
    hero: "country-3.jpg",
    flag: "usa.jpg",
    name: "United States",
    detail: "Local connections and temple info",
    href: "/temples-globally",
  },
  {
    hero: "country-4.jpg",
    flag: "italy.jpg",
    name: "India",
    detail: "Heritage, history, and community links",
    href: "/temples-globally",
  },
];

const testimonials = [
  {
    image: "testimonial-1.jpg",
    quote:
      "This platform keeps me connected with my roots while studying in Canada.",
    name: "Gurpreet K.",
    meta: "Student · Canada",
  },
  {
    image: "testimonial-2.jpg",
    quote:
      "The teachings section helped my kids understand Guru Ravidass Ji's message clearly.",
    name: "Simran D.",
    meta: "Parent · United Kingdom",
  },
  {
    image: "testimonial-3.jpg",
    quote:
      "I found nearby temples and events right after moving, which made settling in much easier.",
    name: "Harjit S.",
    meta: "Community Volunteer · USA",
  },
];

const programs = [
  {
    img: "training-1.jpg",
    eyebrow: "Gurbani Learning",
    title: "Gurbani Learning",
    description:
      "Lessons and starting points that help families build a regular connection with bani and meaning.",
    href: "/articles/guru-ravidass",
  },
  {
    img: "training-2.jpg",
    eyebrow: "Cultural Workshops",
    title: "Cultural Workshops",
    description:
      "Programs designed to strengthen identity, values, and confidence for children and youth.",
    href: "/blogs",
  },
  {
    img: "training-3.jpg",
    eyebrow: "Youth Mentorship",
    title: "Youth Mentorship",
    description:
      "Encouragement, guidance, and shared learning from people navigating similar journeys abroad.",
    href: "/students",
  },
  {
    img: "training-4.jpg",
    eyebrow: "Newcomer Support",
    title: "Newcomer Support",
    description:
      "Helpful information and community touchpoints for those adjusting to a new country.",
    href: "/connect-scst",
  },
];

const offices = [
  {
    img: "office-2.jpg",
    name: "Canada",
    detail:
      "Submit your local Sabha, temple, city, contact, and event details to help others connect with Sangat.",
  },
  {
    img: "office-1.jpg",
    name: "United Kingdom",
    detail:
      "Submit your local Sabha, temple, city, contact, and event details to help others connect with Sangat.",
  },
  {
    img: "office-3.jpg",
    name: "United States",
    detail:
      "Submit your local Sabha, temple, city, contact, and event details to help others connect with Sangat.",
  },
  {
    img: "office-4.jpg",
    name: "India",
    detail:
      "Submit your local Sabha, temple, city, contact, and event details to help others connect with Sangat.",
  },
];

export default function Home() {
  const carouselRef = useRef(null);
  const [carousel, setCarousel] = useState(null);
  const [menus, setMenus] = useState([]);

  const quickLinks = (() => {
    const baseMenus =
      menus.length === 0
        ? [
            {
              id: "connect-scst",
              label: "Connect SC/ST by Country",
              path: "/connect-scst",
              position: 1,
            },
            {
              id: "matrimony",
              label: "RavidassiaAbroad Matrimonial",
              path: "/matrimony",
              position: 2,
            },
            { id: "history", label: "History", path: "/history", position: 3 },
          ]
        : menus;

    const hasStudentsLink = baseMenus.some((menu) => menu.path === "/students");
    const mergedMenus = hasStudentsLink
      ? baseMenus
      : [
          ...baseMenus,
          {
            id: "students-quick-link",
            label: "Students",
            path: "/students",
            position: 999,
          },
        ];

    return [...mergedMenus].sort(
      (a, b) => (a.position ?? 999) - (b.position ?? 999)
    );
  })();

  useEffect(() => {
    document.title = "Ravidassia Abroad";

    const loadMenus = async () => {
      try {
        const data = await apiFetch("/menus");
        setMenus(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load menus:", err);
      }
    };

    loadMenus();

    if (carouselRef.current) {
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

      <div className="home-hero-carousel carousel-header">
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
                    teachings, and unity.
                  </p>
                  <Link
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5"
                    to="/articles/guru-ravidass"
                  >
                    Guru Ravidass Maharaj
                  </Link>
                </div>
              </div>
            </div>

            <div className="carousel-item">
              <img
                src="/template/img/carousel-2.png"
                className="d-block w-100"
                alt="Ravidassia news and events abroad"
              />
              <div className="carousel-caption">
                <div className="text-center p-4" style={{ maxWidth: "900px" }}>
                  <h5 className="text-white text-uppercase fw-bold mb-3 mb-md-4">
                    Ravidassia Abroad
                  </h5>
                  <h1 className="display-1 text-capitalize text-white mb-3 mb-md-4">
                    News, Events and Sangat Abroad
                  </h1>
                  <p className="text-white mb-4 mb-md-5 fs-5">
                    From Canada to the UK, USA, and beyond, stay updated with
                    our global presence.
                  </p>
                  <Link
                    className="btn btn-primary border-secondary rounded-pill text-white py-3 px-5"
                    to="/articles/dr-ambedkar"
                  >
                    Dr Ambedkar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <button
            className="carousel-control-prev"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              carousel?.prev();
            }}
          >
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              carousel?.next();
            }}
          >
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>

      <Navbar
        bg="dark"
        variant="dark"
        className="home-quick-links border-bottom border-body"
      >
        <Container>
          <Nav className="mx-auto d-flex flex-wrap justify-content-center home-quick-links-nav">
            {quickLinks.map((menu) => (
              <Nav.Link key={menu.id} href={menu.path}>
                {menu.label}
              </Nav.Link>
            ))}
          </Nav>
        </Container>
      </Navbar>

      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-xl-5 wow fadeInLeft" data-wow-delay="0.1s">
              <div className="bg-light rounded home-about-media">
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
              <p className="mb-4 home-copy-muted">
                Ravidassia Abroad is a volunteer-run platform for our global
                Sangat. We preserve and share the teachings of Guru Ravidass Ji,
                highlight our history and personalities, list temples and
                centers, and support youth and families staying connected to our
                roots wherever they live.
              </p>

              <div className="home-about-panel">
                <div className="home-about-pills">
                  <div className="home-about-pill">
                    <span className="home-about-pill-icon">
                      <i className="fas fa-map-marked-alt"></i>
                    </span>
                    <div>
                      <small>Community base</small>
                      <strong>Canada Based</strong>
                    </div>
                  </div>
                  <div className="home-about-pill">
                    <span className="home-about-pill-icon">
                      <i className="fas fa-passport"></i>
                    </span>
                    <div>
                      <small>Mission</small>
                      <strong>Uniting Globally</strong>
                    </div>
                  </div>
                </div>

                <div className="home-about-panel-grid">
                  <div className="home-about-stat">
                    <div className="home-about-stat-icon">
                      <i className="fas fa-ticket-alt"></i>
                    </div>
                    <h2>50+</h2>
                    <p>Countries connected</p>
                  </div>

                  <div className="home-about-summary">
                    <ul className="list-unstyled mb-0 home-about-list">
                      <li>
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Authentic resources and references
                      </li>
                      <li>
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Temples and centers directory
                      </li>
                      <li>
                        <i className="fa fa-check-circle text-secondary me-2"></i>
                        Youth guidance and community support
                      </li>
                    </ul>

                    <div className="home-about-contact">
                      <div className="home-about-contact-icon">
                        <i className="fa fa-envelope"></i>
                      </div>
                      <div>
                        <span>Have any questions?</span>
                        <div className="home-about-contact-email">
                          Mail: RavidassiaAbroad@gmail.com
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
          <div className="home-facts-grid">
            {communityFacts.map((fact, index) => (
              <div
                key={fact.title}
                className="home-fact-card wow fadeInUp"
                data-wow-delay={`${0.1 + index * 0.1}s`}
              >
                <div className="home-fact-icon">
                  <i className={fact.icon}></i>
                </div>
                <h3>{fact.value}</h3>
                <h4>{fact.title}</h4>
                <p>{fact.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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

          <div className="home-swipe-hint d-md-none">Swipe to explore</div>
          <div className="home-scroll-row home-scroll-row--services">
            {highlights.map((item, index) => (
              <div
                key={item.title}
                className="home-scroll-card wow fadeInUp"
                data-wow-delay={`${0.1 + (index % 3) * 0.1}s`}
              >
                <article className="home-service-card">
                  <div className="home-service-media">
                    <img
                      src={`/template/img/${item.img}`}
                      className="img-fluid w-100"
                      alt={item.title}
                    />
                  </div>
                  <div className="home-service-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <Link className="home-inline-cta" to={item.href}>
                      {item.cta}
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <h1 className="display-5 mb-4">What You'll Find Here</h1>
            <p className="mb-0">
              Authentic resources, a global network, and community programs that
              help the Ravidassia diaspora stay rooted in values while thriving
              abroad.
            </p>
          </div>

          <div className="home-card-grid home-card-grid--four">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="home-feature-card wow fadeInUp"
                data-wow-delay={`${0.1 + index * 0.1}s`}
              >
                <div className="home-feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link className="home-inline-cta" to={feature.href}>
                  Learn More
                </Link>
              </article>
            ))}
          </div>

          <div className="text-center mt-4">
            <Link className="home-section-cta" to="/feature">
              More Features
            </Link>
          </div>
        </div>
      </div>

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
              From Canada and the UK to the USA and India, discover temples,
              events, and Sangat groups near you and stay connected to our
              heritage.
            </p>
          </div>

          <div className="home-swipe-hint d-md-none">Swipe to explore</div>
          <div className="home-scroll-row home-scroll-row--countries">
            {countries.map((country, index) => (
              <div
                key={country.name}
                className="home-scroll-card wow fadeInUp"
                data-wow-delay={`${0.1 + index * 0.1}s`}
              >
                <article className="home-country-card">
                  <div className="home-country-media">
                    <img
                      src={`/template/img/${country.hero}`}
                      className="img-fluid w-100"
                      alt={country.name}
                    />
                    <div className="home-country-flag">
                      <img
                        src={`/template/img/${country.flag}`}
                        className="img-fluid rounded-circle"
                        alt={`${country.name} flag`}
                      />
                    </div>
                  </div>
                  <div className="home-country-body">
                    <h3>{country.name}</h3>
                    <p>{country.detail}</p>
                    <Link className="home-inline-cta" to={country.href}>
                      Explore Country
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <Link className="home-section-cta" to="/countries">
              More Countries
            </Link>
          </div>
        </div>
      </div>

      <div className="container-fluid testimonial overflow-hidden pb-5">
        <div className="container py-5">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                Voices From the Community
              </h5>
            </div>
            <h1 className="display-5 mb-4">What Our Sangat Says</h1>
            <p className="mb-0">
              Reflections from community members using Ravidassia Abroad to
              learn, connect, and celebrate our heritage.
            </p>
          </div>

          <div className="home-swipe-hint d-md-none">Swipe to explore</div>
          <div className="home-testimonial-grid">
            {testimonials.map((item, index) => (
              <article
                key={item.name}
                className="home-testimonial-card wow zoomInDown"
                data-wow-delay={`${0.1 + index * 0.1}s`}
              >
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </div>
                <p className="home-testimonial-quote">{item.quote}</p>
                <div className="home-testimonial-person">
                  <img
                    className="home-testimonial-avatar"
                    src={`/template/img/${item.image}`}
                    alt={item.name}
                  />
                  <div>
                    <h4>{item.name}</h4>
                    <span>{item.meta}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="container-fluid training overflow-hidden bg-light py-5">
        <div className="container py-5">
          <div
            className="section-title text-center mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
          >
            <div className="sub-style">
              <h5 className="sub-title text-primary px-3">
                Community Programs
              </h5>
            </div>
            <h1 className="display-5 mb-4">
              Guidance and Learning for Youth and Families
            </h1>
            <p className="mb-0">
              Opportunities to learn Gurbani, celebrate culture, build
              leadership, and find local support designed to keep our next
              generation rooted and confident.
            </p>
          </div>

          <div className="home-card-grid home-card-grid--four">
            {programs.map((program, index) => (
              <article
                key={program.title}
                className="home-program-card wow fadeInUp"
                data-wow-delay={`${0.1 + index * 0.1}s`}
              >
                <div className="home-program-media">
                  <img
                    src={`/template/img/${program.img}`}
                    className="img-fluid w-100"
                    alt={program.title}
                  />
                </div>
                <div className="home-program-body">
                  <span className="home-program-eyebrow">
                    {program.eyebrow}
                  </span>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <Link className="home-inline-cta" to={program.href}>
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-4">
            <Link className="home-section-cta" to="/training">
              View More
            </Link>
          </div>
        </div>
      </div>

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
                This directory grows with community contributions, so share
                updates from your city.
              </p>
            </div>

            <div className="home-swipe-hint d-md-none">Swipe to explore</div>
            <div className="home-scroll-row home-scroll-row--offices">
              {offices.map((office, index) => (
                <div
                  key={office.name}
                  className="home-scroll-card wow fadeInUp"
                  data-wow-delay={`${0.1 + index * 0.1}s`}
                >
                  <article className="home-office-card">
                    <div className="home-office-media">
                      <img
                        src={`/template/img/${office.img}`}
                        className="img-fluid w-100"
                        alt={office.name}
                      />
                    </div>
                    <div className="home-office-body">
                      <h3>{office.name}</h3>
                      <Link className="home-inline-cta" to="/temples-globally">
                        View Temples
                      </Link>
                      <a
                        className="home-office-email"
                        href="mailto:ravidassiaabroad@gmail.com"
                      >
                        ravidassiaabroad@gmail.com
                      </a>
                      <p>{office.detail}</p>
                    </div>
                  </article>
                </div>
              ))}
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
