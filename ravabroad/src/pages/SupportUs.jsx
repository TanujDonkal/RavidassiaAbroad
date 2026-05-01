import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "../css/business-directory.css";

const supportAreas = [
  "Travel to temples and community centers for respectful documentation",
  "Video, interview, and documentary-style storytelling",
  "Website hosting, maintenance, moderation, and updates",
  "Student, family, and community resource development",
  "Preserving Ravidassia heritage through articles, temple records, and archives",
];

const supportOptions = [
  {
    title: "One-time Support",
    text: "Help fund documentation trips, research, and public resource building.",
  },
  {
    title: "Monthly Supporter",
    text: "Contribute regularly so the platform can keep improving steadily over time.",
  },
  {
    title: "Sponsor a Temple Visit",
    text: "Support travel, filming, and verified temple/community coverage in a specific city or region.",
  },
  {
    title: "Contribute Information",
    text: "Share photos, corrections, history notes, contact details, and local community guidance.",
  },
];

export default function SupportUs() {
  return (
    <main className="business-shell py-5">
      <Seo
        title="Support Ravidassia Abroad | World Guru Ravidass Journey"
        description="Support Ravidassia Abroad as we document temples, sangat, history, teachings, and community stories across the global diaspora."
        canonicalPath="/support-us"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Support Us", path: "/support-us" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Community Mission</span>
          <div className="row align-items-center g-4 mt-1">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Support Ravidassia Abroad</h1>
              <p className="lead mb-0 text-white-50">
                Help us document Guru Ravidass temples, history, sangat, teachings,
                and diaspora stories worldwide through the World Guru Ravidass Journey.
              </p>
            </div>
            <div className="col-lg-4">
              <div className="business-panel p-4 text-dark">
                <h2 className="h5 fw-bold mb-3">Why support matters</h2>
                <p className="mb-0 text-muted">
                  Every contribution helps preserve community memory and make
                  reliable public resources easier to access for families, students,
                  and future generations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="row g-4 mb-5">
          <div className="col-lg-7">
            <div className="business-panel p-4 p-lg-5 h-100">
              <h2 className="h3 fw-bold mb-3">Our mission</h2>
              <p className="text-muted">
                Ravidassia Abroad exists to respectfully document temples,
                teachings, sangat spaces, lived community stories, and diaspora
                experiences without losing sight of accuracy, dignity, and service.
              </p>
              <div className="business-info-list mt-4">
                {supportAreas.map((item) => (
                  <div key={item} className="business-info-item">
                    <i className="fas fa-check-circle"></i>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="business-cta-card p-4 p-lg-5 h-100">
              <h2 className="h4 fw-bold mb-3">Ways to get involved</h2>
              <div className="business-link-grid">
                <Link to="/contact" className="btn btn-primary rounded-pill px-4">
                  Contact Us to Support
                </Link>
                <Link
                  to="/sponsor-advertise"
                  className="btn btn-outline-light rounded-pill px-4"
                >
                  Sponsor a Temple Visit
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-outline-warning rounded-pill px-4"
                >
                  Suggest a Temple
                </Link>
              </div>
              <p className="small text-white-50 mt-4 mb-0">
                Payment collection is not enabled on this page yet. For now, we
                coordinate support directly through contact and sponsorship inquiries.
              </p>
            </div>
          </div>
        </section>

        <section className="business-panel p-4 p-lg-5">
          <div className="row g-4">
            {supportOptions.map((option) => (
              <div key={option.title} className="col-md-6 col-xl-3">
                <div className="business-card p-4">
                  <span className="business-chip gold mb-3">Support Option</span>
                  <h3 className="h5 fw-bold">{option.title}</h3>
                  <p className="text-muted mb-0">{option.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
