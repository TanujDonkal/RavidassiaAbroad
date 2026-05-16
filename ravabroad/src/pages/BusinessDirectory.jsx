import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { getBusinessDirectory } from "../utils/api";
import { buildBreadcrumbSchema, truncateText } from "../utils/seo";
import "../css/business-directory.css";

export default function BusinessDirectory() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    country: "",
    city: "",
  });
  const [data, setData] = useState({ businesses: [], filters: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getBusinessDirectory(filters)
      .then((response) => {
        if (!cancelled) {
          setData({
            businesses: Array.isArray(response.businesses) ? response.businesses : [],
            filters: response.filters || {},
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load directory");
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
  }, [filters]);

  const filterOptions = useMemo(
    () => ({
      categories: data.filters.categories || [],
      countries: data.filters.countries || [],
      cities: data.filters.cities || [],
    }),
    [data.filters]
  );

  const hasActiveFilters = Boolean(
    filters.search.trim() || filters.category || filters.country || filters.city
  );

  return (
    <main className="business-shell py-5">
      <Seo
        title="Community Business Directory | Ravidassia Abroad"
        description="Discover approved community businesses, services, and trusted directory listings shared through Ravidassia Abroad."
        canonicalPath="/business-directory"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Business Directory", path: "/business-directory" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Community Directory</span>
          <div className="row align-items-center g-4 mt-1">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Community Business Directory</h1>
              <p className="lead text-white-50 mb-0">
                Explore approved listings from businesses and services connected
                to the wider community. Featured businesses appear first.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/submit-business" className="btn btn-warning rounded-pill px-4">
                Submit a Business
              </Link>
            </div>
          </div>
        </section>

        <section className="business-panel p-4 mb-5">
          <div className="business-filter-grid">
            <input
              className="form-control"
              placeholder="Search by business, category, country, or city"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
            />
            <select
              className="form-select"
              value={filters.category}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, category: event.target.value }))
              }
            >
              <option value="">All categories</option>
              {filterOptions.categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={filters.country}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, country: event.target.value }))
              }
            >
              <option value="">All countries</option>
              {filterOptions.countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={filters.city}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, city: event.target.value }))
              }
            >
              <option value="">All cities</option>
              {filterOptions.cities.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="business-panel p-5 text-center">Loading directory...</div>
        ) : error ? (
          <div className="business-panel p-5 text-center text-danger">{error}</div>
        ) : data.businesses.length === 0 ? (
          <div className="business-empty p-5 text-center">
            <h2 className="h4 fw-bold mb-2">
              {hasActiveFilters
                ? "No businesses match your filters"
                : "Business listings are being reviewed"}
            </h2>
            <p className="text-muted mb-4">
              {hasActiveFilters
                ? "Try clearing a filter or submit a new listing for review."
                : "The directory is live, but approved community listings have not been published yet. You can submit a business for review now."}
            </p>
            <Link to="/submit-business" className="btn btn-primary rounded-pill px-4">
              Submit a Business
            </Link>
          </div>
        ) : (
          <section className="row g-4">
            {data.businesses.map((business) => (
              <div className="col-md-6 col-xl-4" key={business.id}>
                <div className="business-card p-4">
                  <div className="d-flex gap-3 align-items-start mb-3">
                    <div className="business-card-logo flex-shrink-0">
                      {business.logo_url || business.image_url ? (
                        <img
                          src={business.logo_url || business.image_url}
                          alt={business.name}
                        />
                      ) : (
                        <i className="fas fa-store fs-3 text-warning"></i>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {business.is_featured && (
                          <span className="business-chip gold">Featured</span>
                        )}
                        {business.is_verified && (
                          <span className="business-chip dark">Verified</span>
                        )}
                      </div>
                      <h2 className="h5 fw-bold mb-1">{business.name}</h2>
                      <p className="mb-0 text-muted">
                        {business.category} • {business.city}, {business.country}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted">
                    {truncateText(
                      business.short_description || business.description || "",
                      145
                    )}
                  </p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {business.website && (
                      <a
                        href={business.website}
                        className="btn btn-outline-dark btn-sm rounded-pill"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    )}
                    {business.phone && (
                      <a
                        href={`tel:${business.phone}`}
                        className="btn btn-outline-dark btn-sm rounded-pill"
                      >
                        Phone
                      </a>
                    )}
                    {business.email && (
                      <a
                        href={`mailto:${business.email}`}
                        className="btn btn-outline-dark btn-sm rounded-pill"
                      >
                        Email
                      </a>
                    )}
                    {business.whatsapp && (
                      <a
                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                        className="btn btn-outline-dark btn-sm rounded-pill"
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <Link
                    to={`/business-directory/${business.slug}`}
                    className="btn btn-primary rounded-pill px-4"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
