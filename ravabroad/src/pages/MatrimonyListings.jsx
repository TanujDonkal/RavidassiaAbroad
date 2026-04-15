import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import {
  getAgeLabel,
  getMatrimonyActionState,
  getProfilePhotoUrl,
} from "../utils/matrimony";
import Seo from "../components/Seo";
import "../css/Matrimony.css";
import { isAuthenticated } from "../utils/auth";

function promptAuth(popup, navigate, redirectTo) {
  popup.open({
    title: "Login Required",
    message: "Please login or register first to continue with matrimony actions.",
    type: "confirm",
    confirmText: "Register",
    cancelText: "Login",
    onConfirm: () => navigate("/auth?mode=signup", { state: { redirectTo } }),
    onCancel: () => navigate("/auth", { state: { redirectTo } }),
  });
}

export default function MatrimonyListings() {
  const navigate = useNavigate();
  const popup = usePopup();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    gender: "",
    city: "",
    ageMin: "",
    ageMax: "",
  });

  const isLoggedIn = isAuthenticated();

  const loadProfiles = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (String(value || "").trim()) {
          params.set(key, String(value).trim());
        }
      });
      const query = params.toString();
      const res = await apiFetch(
        `/matrimonial/profiles${query ? `?${query}` : ""}`
      );
      const nextProfiles = [...(res.profiles || [])];
      nextProfiles.sort((a, b) => {
        const ageA = Number.parseInt(a.age, 10) || 0;
        const ageB = Number.parseInt(b.age, 10) || 0;
        const locationA = `${String(a.country || "").toLowerCase()} ${String(
          a.city || ""
        ).toLowerCase()}`;
        const locationB = `${String(b.country || "").toLowerCase()} ${String(
          b.city || ""
        ).toLowerCase()}`;

        if (sortBy === "age_low") return ageA - ageB;
        if (sortBy === "age_high") return ageB - ageA;
        if (sortBy === "location") return locationA.localeCompare(locationB);
        return Number(b.id) - Number(a.id);
      });
      setProfiles(nextProfiles);
    } catch (err) {
      popup.open({
        title: "Could Not Load Listings",
        message: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Ravidassia Abroad Matrimony";
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handlePrimaryAction = async (profile) => {
    if (!isLoggedIn) {
      promptAuth(popup, navigate, "/matrimony");
      return;
    }

    const action = getMatrimonyActionState(profile.relation);

    try {
      if (action.key === "send_interest") {
        await apiFetch("/matrimonial/interests", {
          method: "POST",
          body: JSON.stringify({ receiver_profile_id: profile.id }),
        });
      } else if (action.key === "request_contact") {
        await apiFetch("/matrimonial/contact-requests", {
          method: "POST",
          body: JSON.stringify({ interest_id: profile.relation.interest_id }),
        });
      } else if (action.key === "view_contact") {
        const res = await apiFetch(`/matrimonial/profiles/${profile.id}/contact`);
        popup.open({
          title: `${profile.display_name}'s Contact`,
          message: [res.contact.phone, res.contact.email, res.contact.instagram]
            .filter(Boolean)
            .join(" | ") || "No contact details available.",
          type: "success",
        });
        return;
      } else {
        return;
      }

      await loadProfiles();
    } catch (err) {
      popup.open({
        title: "Action Failed",
        message: err.message,
        type: "error",
      });
    }
  };

  return (
    <main className="matrimony-page py-5">
      <Seo
        title="Ravidassia Matrimony | Ravidassia Abroad"
        description="Browse Ravidassia matrimony listings and community connections on Ravidassia Abroad."
        canonicalPath="/matrimony"
        robots="noindex,nofollow"
      />
      <div className="container">
        <section className="matrimony-hero mb-4">
          <div className="matrimony-hero-copy">
            <span className="matrimony-kicker">Ravidassia Abroad Matrimony</span>
            <h1>Browse more profiles at a glance.</h1>
            <p className="mb-0">
              A denser browsing experience so users can scan many listings quickly.
              Guests can explore public profiles, and members can post and connect.
            </p>
          </div>

          <div className="matrimony-hero-actions">
            <button
              className="btn btn-primary rounded-pill px-4"
              onClick={() =>
                isLoggedIn
                  ? navigate("/matrimony/post")
                  : promptAuth(popup, navigate, "/matrimony/post")
              }
            >
              Post Your Profile
            </button>
            {isLoggedIn && (
              <button
                className="btn btn-outline-dark rounded-pill px-4"
                onClick={() => navigate("/matrimony/my-profile")}
              >
                My Matrimony Dashboard
              </button>
            )}
          </div>
        </section>

        <section className="matrimony-toolbar card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="matrimony-toolbar-top">
              <div>
                <div className="matrimony-toolbar-title">Approved Listings</div>
                <div className="matrimony-toolbar-subtitle">
                  {loading ? "Loading..." : `${profiles.length} public profiles`}
                </div>
              </div>
              <div className="matrimony-summary-chips">
                <span className="matrimony-chip">Compact</span>
                <span className="matrimony-chip">Fast scan</span>
                <span className="matrimony-chip">Public-safe</span>
              </div>
            </div>

            <div className="matrimony-sortbar">
              <div className="matrimony-sort-label">Sort by</div>
              <div className="matrimony-sort-chips">
                <button
                  className={`matrimony-sort-chip${sortBy === "newest" ? " is-active" : ""}`}
                  onClick={() => setSortBy("newest")}
                >
                  Newest
                </button>
                <button
                  className={`matrimony-sort-chip${sortBy === "age_low" ? " is-active" : ""}`}
                  onClick={() => setSortBy("age_low")}
                >
                  Age: Low
                </button>
                <button
                  className={`matrimony-sort-chip${sortBy === "age_high" ? " is-active" : ""}`}
                  onClick={() => setSortBy("age_high")}
                >
                  Age: High
                </button>
                <button
                  className={`matrimony-sort-chip${sortBy === "location" ? " is-active" : ""}`}
                  onClick={() => setSortBy("location")}
                >
                  Location
                </button>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6 col-md-3">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={filters.gender}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, gender: event.target.value }))
                  }
                >
                  <option value="">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={filters.city}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, city: event.target.value }))
                  }
                  placeholder="Filter by city"
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Age Min</label>
                <input
                  type="number"
                  className="form-control"
                  value={filters.ageMin}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, ageMin: event.target.value }))
                  }
                  placeholder="18"
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Age Max</label>
                <input
                  type="number"
                  className="form-control"
                  value={filters.ageMax}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, ageMax: event.target.value }))
                  }
                  placeholder="35"
                />
              </div>
              <div className="col-12 col-md-2 d-flex align-items-end gap-2">
                <button
                  className="btn btn-dark w-100 rounded-pill"
                  onClick={() => loadProfiles()}
                >
                  Apply
                </button>
                <button
                  className="btn btn-outline-secondary w-100 rounded-pill matrimony-reset-btn"
                  onClick={() => {
                    const reset = { gender: "", city: "", ageMin: "", ageMax: "" };
                    setFilters(reset);
                    loadProfiles(reset);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-5 text-muted">Loading approved profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h4 className="mb-2">No approved public profiles yet</h4>
              <p className="text-muted mb-3">
                Once profiles are approved and public listing is enabled, they will appear here.
              </p>
              <button
                className="btn btn-primary rounded-pill px-4"
                onClick={() =>
                  isLoggedIn
                    ? navigate("/matrimony/post")
                    : promptAuth(popup, navigate, "/matrimony/post")
                }
              >
                Post Your Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="matrimony-grid">
            {profiles.map((profile) => {
              const action = getMatrimonyActionState(profile.relation);
              return (
                <article
                  key={profile.id}
                  className="matrimony-card matrimony-tile card border-0 shadow-sm"
                >
                  <div className="matrimony-tile-head">
                    <img
                      src={getProfilePhotoUrl(profile)}
                      alt={profile.display_name}
                      className={
                        profile.photo_visibility === "blurred"
                          ? "matrimony-tile-photo is-blurred"
                          : "matrimony-tile-photo"
                      }
                    />
                    <div className="matrimony-tile-meta">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <h3 className="matrimony-tile-name">{profile.display_name}</h3>
                        <span className="matrimony-mini-badge text-capitalize">
                          {profile.gender || "Profile"}
                        </span>
                      </div>
                      <div className="matrimony-tile-line">
                        {[
                          getAgeLabel(profile) !== "—" ? `${getAgeLabel(profile)}y` : "",
                          profile.city,
                          profile.country,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Public listing"}
                      </div>
                    </div>
                  </div>

                  <div className="matrimony-tile-body">
                    <div className="matrimony-tile-occupation">
                      {profile.occupation || "Occupation not shared"}
                    </div>
                    <p className="matrimony-tile-bio">
                      {profile.short_bio || "Public matrimonial listing available for review."}
                    </p>
                  </div>

                  <div className="matrimony-tile-actions">
                    <Link
                      to={`/matrimony/${profile.id}`}
                      className="btn btn-sm btn-outline-dark rounded-pill"
                    >
                      View
                    </Link>
                    <button
                      className="btn btn-sm btn-primary rounded-pill"
                      disabled={action.disabled}
                      onClick={() => handlePrimaryAction(profile)}
                    >
                      {action.label}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
