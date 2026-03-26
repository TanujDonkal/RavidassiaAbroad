import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../utils/api";

function TempleDetailModal({ temple, onClose }) {
  if (!temple) return null;

  const gallery = Array.isArray(temple.gallery_urls) && temple.gallery_urls.length > 0
    ? temple.gallery_urls
    : temple.image_url
      ? [temple.image_url]
      : [];

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 overflow-hidden temple-detail-modal">
          <div className="modal-header border-0 temple-detail-header">
            <div>
              <div className="temple-detail-kicker">{temple.country}</div>
              <h4 className="modal-title mb-1">{temple.name}</h4>
              <p className="mb-0 text-muted">
                {temple.city}
                {temple.location_label ? ` • ${temple.location_label}` : ""}
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body temple-detail-body">
            <div className="row g-4 align-items-start">
              <div className="col-lg-7">
                {temple.image_url && (
                  <img
                    src={temple.image_url}
                    alt={temple.name}
                    className="img-fluid rounded-4 shadow-sm temple-detail-hero"
                  />
                )}
                {gallery.length > 1 && (
                  <div className="temple-gallery-grid mt-3">
                    {gallery.slice(0, 6).map((image, index) => (
                      <img key={`${image}-${index}`} src={image} alt={`${temple.name} ${index + 1}`} />
                    ))}
                  </div>
                )}
              </div>
              <div className="col-lg-5">
                <div className="temple-info-card">
                  <div className="temple-info-row">
                    <span>Address</span>
                    <strong>{temple.address || `${temple.city}, ${temple.country}`}</strong>
                  </div>
                  {temple.established_year && (
                    <div className="temple-info-row">
                      <span>Established</span>
                      <strong>{temple.established_year}</strong>
                    </div>
                  )}
                  {temple.contact_info && (
                    <div className="temple-info-row">
                      <span>Contact</span>
                      <strong>{temple.contact_info}</strong>
                    </div>
                  )}
                  {temple.seva_info && (
                    <div className="temple-info-row">
                      <span>Community</span>
                      <strong>{temple.seva_info}</strong>
                    </div>
                  )}
                </div>

                {temple.description && (
                  <div className="temple-story-copy mt-3">
                    <h6>About this temple</h6>
                    <p>{temple.description}</p>
                  </div>
                )}

                <div className="d-flex flex-wrap gap-2 mt-3">
                  {temple.maps_url && (
                    <a
                      className="btn btn-dark rounded-pill px-4"
                      href={temple.maps_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Map
                    </a>
                  )}
                  {temple.website_url && (
                    <a
                      className="btn btn-outline-dark rounded-pill px-4"
                      href={temple.website_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplesGlobally() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemple, setSelectedTemple] = useState(null);

  const selectedCountry = searchParams.get("country") || "All";
  const selectedTempleId = searchParams.get("temple");

  useEffect(() => {
    document.title = "Temples Globally | Ravidassia Abroad";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadTemples = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/temples");
        setTemples(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load temples:", err);
        setTemples([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemples();
  }, []);

  const countries = useMemo(() => {
    const unique = Array.from(new Set(temples.map((temple) => temple.country).filter(Boolean)));
    return ["All", ...unique];
  }, [temples]);

  const filteredTemples = useMemo(() => {
    if (selectedCountry === "All") return temples;
    return temples.filter((temple) => temple.country === selectedCountry);
  }, [selectedCountry, temples]);

  const featuredTemples = useMemo(
    () => filteredTemples.filter((temple) => temple.featured).slice(0, 3),
    [filteredTemples]
  );

  useEffect(() => {
    if (!selectedTempleId || temples.length === 0) return;
    const match = temples.find((temple) => String(temple.id) === String(selectedTempleId));
    if (match) setSelectedTemple(match);
  }, [selectedTempleId, temples]);

  const groupedByCountry = useMemo(() => {
    return filteredTemples.reduce((acc, temple) => {
      const key = temple.country || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(temple);
      return acc;
    }, {});
  }, [filteredTemples]);

  const handleCountrySelect = (country) => {
    const next = new URLSearchParams(searchParams);
    if (country === "All") {
      next.delete("country");
    } else {
      next.set("country", country);
    }
    next.delete("temple");
    setSelectedTemple(null);
    setSearchParams(next);
  };

  const handleOpenTemple = (temple) => {
    setSelectedTemple(temple);
    const next = new URLSearchParams(searchParams);
    next.set("country", temple.country);
    next.set("temple", temple.id);
    setSearchParams(next);
  };

  const handleCloseTemple = () => {
    setSelectedTemple(null);
    const next = new URLSearchParams(searchParams);
    next.delete("temple");
    setSearchParams(next);
  };

  return (
    <>
      <main className="temples-page">
        <section className="temples-hero">
          <div className="container py-5">
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <div className="temples-kicker">Global Directory</div>
                <h1 className="temples-title">
                  Guru Ravidass Maharaj temples across countries
                </h1>
                <p className="temples-subtitle">
                  Explore temples, sangat spaces, and community centers country by country
                  with maps, images, and quick temple details made for mobile-first browsing.
                </p>
                <div className="d-flex flex-wrap gap-2 mt-4">
                  <span className="temples-stat-pill">{countries.length - 1} Countries</span>
                  <span className="temples-stat-pill">{temples.length} Temple Listings</span>
                  <span className="temples-stat-pill">Photos & Location Details</span>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="temples-hero-card">
                  {(featuredTemples[0] || filteredTemples[0])?.image_url ? (
                    <img
                      src={(featuredTemples[0] || filteredTemples[0]).image_url}
                      alt={(featuredTemples[0] || filteredTemples[0]).name}
                      className="img-fluid"
                    />
                  ) : (
                    <div className="temples-hero-placeholder">Temple directory</div>
                  )}
                  <div className="temples-hero-card-overlay">
                    <div className="temples-hero-card-tag">Featured Country View</div>
                    <h3>{selectedCountry === "All" ? "Browse all countries" : selectedCountry}</h3>
                    <p>
                      See temples, mandirs, and gurughars with cleaner country-based
                      navigation and rich visual cards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="temples-country-strip">
          <div className="container">
            <div className="temples-country-scroll">
              {countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  className={`temples-country-chip ${selectedCountry === country ? "is-active" : ""}`}
                  onClick={() => handleCountrySelect(country)}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="temples-content py-5">
          <div className="container">
            {loading ? (
              <div className="temples-empty-state">Loading temple directory...</div>
            ) : filteredTemples.length === 0 ? (
              <div className="temples-empty-state">
                No temples found for this country yet.
              </div>
            ) : (
              <>
                {featuredTemples.length > 0 && (
                  <div className="mb-5">
                    <div className="temples-section-heading">
                      <div>
                        <div className="temples-section-kicker">Highlighted</div>
                        <h2>Featured temples</h2>
                      </div>
                      <p>Start with the main community spaces people are most likely to search for.</p>
                    </div>

                    <div className="row g-4">
                      {featuredTemples.map((temple) => (
                        <div className="col-md-6 col-xl-4" key={temple.id}>
                          <article className="temple-feature-card" onClick={() => handleOpenTemple(temple)}>
                            <img src={temple.image_url} alt={temple.name} />
                            <div className="temple-feature-card-body">
                              <div className="temple-card-chip">{temple.country}</div>
                              <h3>{temple.name}</h3>
                              <p>{temple.description}</p>
                              <div className="temple-card-meta">
                                <span>{temple.city}</span>
                                <span>{temple.established_year || "Community listing"}</span>
                              </div>
                            </div>
                          </article>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.entries(groupedByCountry).map(([country, entries]) => (
                  <div key={country} className="mb-5">
                    <div className="temples-section-heading">
                      <div>
                        <div className="temples-section-kicker">{country}</div>
                        <h2>{entries.length} temple{entries.length > 1 ? "s" : ""}</h2>
                      </div>
                    </div>

                    <div className="row g-4">
                      {entries.map((temple) => (
                        <div className="col-md-6 col-xl-4" key={temple.id}>
                          <article className="temple-card">
                            <div className="temple-card-image-wrap">
                              {temple.image_url ? (
                                <img src={temple.image_url} alt={temple.name} className="temple-card-image" />
                              ) : (
                                <div className="temple-card-image temple-card-fallback">Temple</div>
                              )}
                              <button
                                type="button"
                                className="temple-card-view-btn"
                                onClick={() => handleOpenTemple(temple)}
                              >
                                View temple
                              </button>
                            </div>
                            <div className="temple-card-body">
                              <div className="temple-card-topline">
                                <span>{temple.city}</span>
                                {temple.featured && <strong>Featured</strong>}
                              </div>
                              <h3>{temple.name}</h3>
                              <p>{temple.description}</p>
                              <div className="temple-card-footer">
                                <div>
                                  <div className="temple-card-footer-label">Location</div>
                                  <strong>{temple.location_label || temple.address || `${temple.city}, ${temple.country}`}</strong>
                                </div>
                                {temple.maps_url ? (
                                  <a href={temple.maps_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                    Maps
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="temples-cta pb-5">
          <div className="container">
            <div className="temples-cta-panel">
              <div>
                <div className="temples-section-kicker">Know another location?</div>
                <h3>Help expand the global temple directory</h3>
                <p className="mb-0">
                  As your admin team adds more countries and sangat spaces, this section becomes
                  a living directory for the global Ravidassia community.
                </p>
              </div>
              <Link to="/contact" className="btn btn-dark rounded-pill px-4">
                Contact Team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <TempleDetailModal temple={selectedTemple} onClose={handleCloseTemple} />
    </>
  );
}
