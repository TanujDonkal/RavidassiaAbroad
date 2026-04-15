import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

export default function MatrimonyProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const popup = usePopup();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState(null);

  const isLoggedIn = isAuthenticated();

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/matrimonial/profiles/${id}`);
      setProfile(res.profile);
    } catch (err) {
      popup.open({
        title: "Could Not Load Profile",
        message: err.message,
        type: "error",
      });
      navigate("/matrimony", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (profile?.display_name) {
      document.title = `${profile.display_name} | Matrimony`;
    }
  }, [profile]);

  const handlePrimaryAction = async () => {
    if (!profile) return;
    if (!isLoggedIn) {
      promptAuth(popup, navigate, `/matrimony/${id}`);
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
        setContact(res.contact);
        return;
      } else {
        return;
      }

      await loadProfile();
    } catch (err) {
      popup.open({
        title: "Action Failed",
        message: err.message,
        type: "error",
      });
    }
  };

  if (loading) {
    return <div className="container py-5 text-center text-muted">Loading profile...</div>;
  }

  if (!profile) {
    return null;
  }

  const action = getMatrimonyActionState(profile.relation);

  return (
    <main className="matrimony-page py-5">
      <Seo
        title={`${profile.display_name} | Matrimony | Ravidassia Abroad`}
        description="Ravidassia matrimony profile."
        canonicalPath={`/matrimony/${id}`}
        robots="noindex,nofollow"
      />
      <div className="container">
        <div className="mb-3">
          <Link to="/matrimony" className="btn btn-link text-decoration-none px-0">
            ← Back to Listings
          </Link>
        </div>

        <section className="card border-0 shadow-sm overflow-hidden">
          <div className="row g-0">
            <div className="col-lg-4 matrimony-detail-photo-wrap">
              <img
                src={getProfilePhotoUrl(profile)}
                alt={profile.display_name}
                className={
                  profile.photo_visibility === "blurred"
                    ? "matrimony-detail-photo is-blurred"
                    : "matrimony-detail-photo"
                }
              />
            </div>
            <div className="col-lg-8">
              <div className="card-body p-4 p-lg-5">
                <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                  <div>
                    <span className="matrimony-kicker">Approved Public Profile</span>
                    <h1 className="mb-1">{profile.display_name}</h1>
                    <div className="text-muted">
                      {[profile.gender, getAgeLabel(profile) !== "—" ? `${getAgeLabel(profile)} years` : "", profile.city_living, profile.country_living]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    <button
                      className="btn btn-primary rounded-pill"
                      disabled={action.disabled}
                      onClick={handlePrimaryAction}
                    >
                      {action.label}
                    </button>
                    <button
                      className="btn btn-outline-dark rounded-pill"
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

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="matrimony-stat">
                      <span>Occupation</span>
                      <strong>{profile.occupation || "Not shared"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="matrimony-stat">
                      <span>Education</span>
                      <strong>{profile.education || "Not shared"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="matrimony-stat">
                      <span>Marital Status</span>
                      <strong>{profile.marital_status || "Not shared"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="matrimony-stat">
                      <span>Family Type</span>
                      <strong>{profile.family_type || "Not shared"}</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4>About</h4>
                  <p className="text-muted mb-0">
                    {profile.about_me || profile.short_bio || "No additional public bio shared yet."}
                  </p>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <h5>Location</h5>
                    <p className="text-muted mb-0">
                      {[profile.city_living, profile.country_living].filter(Boolean).join(", ") || "Not shared"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h5>Religious Beliefs</h5>
                    <p className="text-muted mb-0">
                      {profile.religion_beliefs || "Not shared publicly"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h5>Preferred Age Range</h5>
                    <p className="text-muted mb-0">{profile.partner_age_range || "Open"}</p>
                  </div>
                  <div className="col-md-6">
                    <h5>Preferred Country</h5>
                    <p className="text-muted mb-0">{profile.partner_country || "Open"}</p>
                  </div>
                </div>

                {contact && (
                  <div className="alert alert-success mt-4 mb-0">
                    <strong>Approved Contact:</strong>{" "}
                    {[contact.phone, contact.email, contact.instagram]
                      .filter(Boolean)
                      .join(" | ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
