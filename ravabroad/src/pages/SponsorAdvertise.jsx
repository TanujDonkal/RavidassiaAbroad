import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "../css/business-directory.css";

const packages = [
  "Website Banner Sponsor",
  "Sponsored Blog / Article",
  "Temple Vlog Sponsor",
  "Business Directory Featured Listing",
  "City / Country Community Sponsor",
];

export default function SponsorAdvertise() {
  return (
    <main className="business-shell py-5">
      <Seo
        title="Advertise with Ravidassia Abroad | Sponsor and Community Promotion"
        description="Reach the Ravidassia diaspora, students, families, and temple visitors through sponsorship and advertising opportunities on Ravidassia Abroad."
        canonicalPath="/sponsor-advertise"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Sponsor / Advertise", path: "/sponsor-advertise" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Community Reach</span>
          <h1 className="display-5 fw-bold mt-3 mb-3">
            Advertise with Ravidassia Abroad
          </h1>
          <p className="lead text-white-50 mb-0">
            Connect with the Ravidassia diaspora, Punjabi and Indian communities
            abroad, students, families, and temple visitors through values-aligned
            sponsorship opportunities.
          </p>
        </section>

        <section className="row g-4 mb-5">
          <div className="col-lg-5">
            <div className="business-panel p-4 p-lg-5 h-100">
              <h2 className="h4 fw-bold mb-3">Who you can reach</h2>
              <div className="business-info-list">
                {[
                  "Ravidassia diaspora across multiple countries",
                  "Punjabi and Indian families living abroad",
                  "Students and newcomers looking for trusted community resources",
                  "Temple and sangat visitors following events, stories, and directories",
                ].map((item) => (
                  <div key={item} className="business-info-item">
                    <i className="fas fa-bullseye"></i>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="business-panel p-4 p-lg-5 h-100">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                  <h2 className="h4 fw-bold mb-2">Sponsorship packages</h2>
                  <p className="text-muted mb-0">
                    Flexible packages are available for businesses, creators,
                    organizations, and community sponsors.
                  </p>
                </div>
                <Link to="/submit-business" className="btn btn-primary rounded-pill px-4 align-self-start">
                  Submit Inquiry
                </Link>
              </div>
              <div className="row g-3">
                {packages.map((item) => (
                  <div key={item} className="col-md-6">
                    <div className="business-card p-4">
                      <span className="business-chip dark mb-3">Contact for pricing</span>
                      <h3 className="h5 fw-bold mb-2">{item}</h3>
                      <p className="text-muted mb-0">
                        Ideal for brands and community initiatives that want
                        thoughtful visibility without overwhelming the user experience.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="business-cta-card p-4 p-lg-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h2 className="h3 fw-bold mb-2">Important sponsorship note</h2>
              <p className="mb-0 text-white-50">
                Sponsorship and advertising never determine the accuracy of
                religious, historical, temple, or community information published
                by Ravidassia Abroad. Editorial and community integrity come first.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/contact" className="btn btn-warning rounded-pill px-4">
                Contact for Sponsorship
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
