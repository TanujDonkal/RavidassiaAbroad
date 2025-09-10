// src/pages/Contact.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact Us | Travisa - Visa & Immigration Website Template";
    if (window.__initLegacy) window.__initLegacy();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire this to your backend or email service
    alert("Form submit is a demo in this template.");
  };

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

      {/* Modal Search (optional; trigger button can be in Navbar) */}
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
            Contact Us
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
            <li className="breadcrumb-item active text-secondary">Contact</li>
          </ol>
        </div>
      </div>

      {/* Contact */}
      <div className="container-fluid contact overflow-hidden py-5">
        <div className="container py-5">
          <div className="row g-5 mb-5">
            <div className="col-lg-6 wow fadeInLeft" data-wow-delay="0.1s">
              <div className="sub-style">
                <h5 className="sub-title text-primary pe-3">Quick Contact</h5>
              </div>
              <h1 className="display-5 mb-4">Have Questions? Don't Hesitate to Contact Us</h1>
              <p className="mb-5">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quaerat totam deserunt tempora. Tempore
                neque necessitatibus corporis error earum sint quae?
              </p>

              <div className="d-flex border-bottom mb-4 pb-4">
                <i className="fas fa-map-marked-alt fa-4x text-primary bg-light p-3 rounded"></i>
                <div className="ps-3">
                  <h5>Location</h5>
                  <p>123, First Floor, 123 St Roots Terrace, Los Angeles 90010 Unitd States of America.</p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-xl-6">
                  <div className="d-flex">
                    <i className="fas fa-tty fa-3x text-primary"></i>
                    <div className="ps-3">
                      <h5 className="mb-3">Quick Contact</h5>
                      <div className="mb-3">
                        <h6 className="mb-0">Phone:</h6>
                        <a href="#" className="fs-5 text-primary">
                          +012 3456 7890
                        </a>
                      </div>
                      <div className="mb-3">
                        <h6 className="mb-0">Email:</h6>
                        <a href="#" className="fs-5 text-primary">
                          travisa@example.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-6">
                  <div className="d-flex">
                    <i className="fas fa-clone fa-3x text-primary"></i>
                    <div className="ps-3">
                      <h5 className="mb-3">Opening Hrs</h5>
                      <div className="mb-3">
                        <h6 className="mb-0">Mon - Friday:</h6>
                        <a href="#" className="fs-5 text-primary">
                          09.00 am to 07.00 pm
                        </a>
                      </div>
                      <div className="mb-3">
                        <h6 className="mb-0">Satday:</h6>
                        <a href="#" className="fs-5 text-primary">
                          10.00 am to 05.00 pm
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center pt-3">
                <div className="me-4">
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ width: 90, height: 90, borderRadius: 10 }}
                  >
                    <i className="fas fa-share fa-3x text-primary"></i>
                  </div>
                </div>
                <div className="d-flex">
                  <a className="btn btn-secondary border-secondary me-2 p-0" href="">
                    facebook <i className="fas fa-chevron-circle-right"></i>
                  </a>
                  <a className="btn btn-secondary border-secondary mx-2 p-0" href="">
                    twitter <i className="fas fa-chevron-circle-right"></i>
                  </a>
                  <a className="btn btn-secondary border-secondary mx-2 p-0" href="">
                    instagram <i className="fas fa-chevron-circle-right"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-6 wow fadeInRight" data-wow-delay="0.3s">
              <div className="sub-style">
                <h5 className="sub-title text-primary pe-3">Let’s Connect</h5>
              </div>
              <h1 className="display-5 mb-4">Send Your Message</h1>
              <p className="mb-3">
                The contact form is currently inactive. Get a functional and working contact form with Ajax &amp; PHP
                in a few minutes. Just copy and paste the files, add a little code and you're done.{" "}
                <a className="text-primary fw-bold" href="https://htmlcodex.com/contact-form">
                  Download Now
                </a>
                .
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input type="text" className="form-control" id="name" placeholder="Your Name" />
                      <label htmlFor="name">Your Name</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input type="email" className="form-control" id="email" placeholder="Your Email" />
                      <label htmlFor="email">Your Email</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input type="tel" className="form-control" id="phone" placeholder="Phone" />
                      <label htmlFor="phone">Your Phone</label>
                    </div>
                  </div>
                  <div className="col-lg-12 col-xl-6">
                    <div className="form-floating">
                      <input type="text" className="form-control" id="project" placeholder="Project" />
                      <label htmlFor="project">Your Project</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <input type="text" className="form-control" id="subject" placeholder="Subject" />
                      <label htmlFor="subject">Subject</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating">
                      <textarea className="form-control" placeholder="Leave a message here" id="message" style={{ height: 160 }}></textarea>
                      <label htmlFor="message">Message</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary w-100 py-3">Send Message</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Offices + Map */}
          <div className="office pt-5">
            <div className="section-title text-center mb-5 wow fadeInUp" data-wow-delay="0.1s">
              <div className="sub-style">
                <h5 className="sub-title text-primary px-3">Worlwide Offices</h5>
              </div>
              <h1 className="display-5 mb-4">Explore Our Office Worldwide</h1>
              <p className="mb-0">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat deleniti amet at atque sequi quibusdam
                cumque itaque repudiandae temporibus, eius nam mollitia voluptas maxime veniam necessitatibus saepe in
                ab? Repellat!
              </p>
            </div>

            <div className="row g-4 justify-content-center">
              {[
                { img: "office-2.jpg", name: "Australia", phone: "+123.456.7890" },
                { img: "office-1.jpg", name: "Canada", phone: "(012) 0345 6789" },
                { img: "office-3.jpg", name: "United Kingdom", phone: "01234.567.890" },
                { img: "office-4.jpg", name: "India", phone: "+123.45.67890" },
              ].map((o, i) => (
                <div key={o.name} className="col-md-6 col-lg-6 col-xl-3 wow fadeInUp" data-wow-delay={`${0.1 + i * 0.2}s`}>
                  <div className="office-item p-4">
                    <div className="office-img mb-4">
                      <img src={`/template/img/${o.img}`} className="img-fluid w-100 rounded" alt={o.name} />
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
                        123, First Floor, 123 St Roots Terrace, Los Angeles 90010 Unitd States of America.
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-12 pt-5 wow zoomIn" data-wow-delay="0.1s">
                <div className="rounded h-100">
                  <iframe
                    className="rounded w-100"
                    style={{ height: 500 }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    title="Google Map"
                  ></iframe>
                </div>
              </div>
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
