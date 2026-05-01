import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import { getBusinessBySlug } from "../utils/api";
import {
  buildBreadcrumbSchema,
  DEFAULT_OG_IMAGE,
  truncateText,
} from "../utils/seo";
import "../css/business-directory.css";

export default function BusinessDetail() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getBusinessBySlug(slug)
      .then((data) => {
        if (!cancelled) {
          setBusiness(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Business not found");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const socialEntries = useMemo(
    () => Object.entries(business?.social_links || {}),
    [business]
  );

  if (loading) {
    return <main className="business-shell py-5"><div className="container"><div className="business-panel p-5 text-center">Loading business details...</div></div></main>;
  }

  if (error || !business) {
    return (
      <main className="business-shell py-5">
        <div className="container">
          <div className="business-panel p-5 text-center">
            <h1 className="h3 fw-bold mb-3">Business not found</h1>
            <p className="text-muted mb-4">{error || "This listing is unavailable."}</p>
            <Link to="/business-directory" className="btn btn-primary rounded-pill px-4">
              Back to Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="business-shell py-5">
      <Seo
        title={`${business.name} | Business Directory | Ravidassia Abroad`}
        description={truncateText(
          business.short_description || business.description || "",
          160
        )}
        canonicalPath={`/business-directory/${business.slug}`}
        image={business.image_url || business.logo_url || DEFAULT_OG_IMAGE}
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Business Directory", path: "/business-directory" },
            {
              name: business.name,
              path: `/business-directory/${business.slug}`,
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: business.name,
            description: business.short_description || business.description,
            image: business.image_url || business.logo_url || DEFAULT_OG_IMAGE,
            address: {
              "@type": "PostalAddress",
              addressLocality: business.city,
              addressCountry: business.country,
              streetAddress: business.address || undefined,
            },
            telephone: business.phone || undefined,
            email: business.email || undefined,
            url: business.website || undefined,
          },
        ]}
      />

      <div className="container">
        <section className="business-panel p-4 p-lg-5 mb-4">
          <div className="row g-4 align-items-start">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="business-chip gold">{business.category}</span>
                {business.is_featured && (
                  <span className="business-chip dark">Featured listing</span>
                )}
                {business.is_verified && (
                  <span className="business-chip soft">Verified</span>
                )}
              </div>
              <h1 className="display-6 fw-bold mb-3">{business.name}</h1>
              <p className="text-muted mb-4">
                {business.city}, {business.country}
                {business.address ? ` • ${business.address}` : ""}
              </p>
              <p className="business-richtext mb-0">{business.description}</p>
            </div>
            <div className="col-lg-5">
              <div className="business-detail-media" style={{ minHeight: "280px" }}>
                {business.image_url || business.logo_url ? (
                  <img
                    src={business.image_url || business.logo_url}
                    alt={business.name}
                  />
                ) : (
                  <i className="fas fa-store text-warning" style={{ fontSize: "4rem" }}></i>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="row g-4">
          <div className="col-lg-8">
            <div className="business-panel p-4 p-lg-5 h-100">
              <h2 className="h4 fw-bold mb-4">Contact and business details</h2>
              <div className="business-info-list">
                {business.phone && (
                  <div className="business-info-item">
                    <i className="fas fa-phone"></i>
                    <a href={`tel:${business.phone}`}>{business.phone}</a>
                  </div>
                )}
                {business.email && (
                  <div className="business-info-item">
                    <i className="fas fa-envelope"></i>
                    <a href={`mailto:${business.email}`}>{business.email}</a>
                  </div>
                )}
                {business.website && (
                  <div className="business-info-item">
                    <i className="fas fa-globe"></i>
                    <a href={business.website} target="_blank" rel="noreferrer">
                      {business.website}
                    </a>
                  </div>
                )}
                {business.whatsapp && (
                  <div className="business-info-item">
                    <i className="fab fa-whatsapp"></i>
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {business.whatsapp}
                    </a>
                  </div>
                )}
                {socialEntries.length > 0 && (
                  <div className="business-info-item">
                    <i className="fas fa-share-alt"></i>
                    <div className="d-flex flex-wrap gap-2">
                      {socialEntries.map(([key, value]) => (
                        <a
                          key={key}
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-dark btn-sm rounded-pill text-capitalize"
                        >
                          {key}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {business.business_hours &&
                  Object.keys(business.business_hours).length > 0 && (
                    <div className="business-info-item">
                      <i className="far fa-clock"></i>
                      <div>
                        {Object.entries(business.business_hours).map(([day, hours]) => (
                          <div key={day}>
                            <strong className="text-capitalize">{day}:</strong> {hours}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="business-sidebar-card">
              <div className="business-panel p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">Directory note</h2>
                <p className="small text-muted mb-0">
                  Ravidassia Abroad provides listings for community convenience.
                  Users should verify services independently before making
                  payments or commitments.
                </p>
              </div>
              <div className="business-cta-card p-4">
                <h2 className="h5 fw-bold mb-3">Know a business that should be listed?</h2>
                <div className="business-link-grid">
                  <Link to="/submit-business" className="btn btn-warning rounded-pill px-4">
                    Submit Business
                  </Link>
                  <Link to="/support-us" className="btn btn-outline-light rounded-pill px-4">
                    Support the Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
