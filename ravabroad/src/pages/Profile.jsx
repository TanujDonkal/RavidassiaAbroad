import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import "../css/profile.css";
import { MARKETING_OPT_IN_LABEL } from "../utils/compliance";

function buildInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Profile() {
  const popup = usePopup();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser || {});
  }, []);

  const displayPhoto =
    preview ||
    user?.photo_url ||
    "https://bootdey.com/img/Content/avatar/avatar7.png";

  const profileStats = useMemo(
    () => [
      { label: "Account Type", value: user?.role ? String(user.role).replaceAll("_", " ").toUpperCase() : "USER" },
      { label: "City", value: user?.city || "Add your city" },
      { label: "Status", value: loading ? "Updating..." : "Active" },
    ],
    [loading, user?.city, user?.role]
  );

  const handleChange = (event) => {
    setUser((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(user).forEach(([key, value]) => {
        formData.append(
          key,
          typeof value === "boolean" ? String(value) : value || ""
        );
      });
      if (photo) formData.append("photo", photo);

      const res = await apiFetch("/user/update-profile", {
        method: "POST",
        body: formData,
      });

      const updatedUser = {
        ...user,
        photo_url: res.photo_url || user.photo_url,
        marketing_opt_in:
          typeof res.marketing_opt_in === "boolean"
            ? res.marketing_opt_in
            : Boolean(user.marketing_opt_in),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("auth-updated"));
      setUser(updatedUser);

      popup.open({
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
      });
    } catch (err) {
      console.error("Profile update error:", err);
      popup.open({
        type: "error",
        title: "Update Failed",
        message: "Something went wrong while updating your profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="profile-page">
      <div className="container profile-shell">
        <nav aria-label="breadcrumb" className="profile-breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              My Profile
            </li>
          </ol>
        </nav>

        <section className="profile-hero-card">
          <div className="profile-hero-copy">
            <span className="profile-hero-kicker">Personal Profile</span>
            <h1>{user?.name || "Your profile"}</h1>
            <p>
              Keep your account details current so community updates, submissions,
              and admin communication stay connected to the right profile.
            </p>
          </div>

          <div className="profile-avatar-panel">
            <div className="profile-avatar-wrap">
              {displayPhoto ? (
                <img src={displayPhoto} alt={user?.name || "Profile"} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {buildInitials(user?.name) || "U"}
                </div>
              )}

              <button
                type="button"
                className="profile-avatar-edit"
                aria-label="Change profile picture"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-pen"></i>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </div>

            <div className="profile-meta">
              <h2>{user?.name || "Community Member"}</h2>
              <p>{user?.email || "No email available"}</p>
            </div>
          </div>
        </section>

        <section className="row g-4 align-items-start">
          <div className="col-lg-4">
            <div className="profile-side-card">
              <div className="profile-side-header">
                <h3>Account Snapshot</h3>
                <span>{buildInitials(user?.name) || "RA"}</span>
              </div>

              <div className="profile-stats-grid">
                {profileStats.map((item) => (
                  <div key={item.label} className="profile-stat-card">
                    <div className="profile-stat-label">{item.label}</div>
                    <div className="profile-stat-value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="profile-side-note">
                <h4>Profile photo</h4>
                <p>
                  Tap the pencil icon on your picture to upload a cleaner display
                  image for your account.
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="profile-form-card">
              <div className="profile-section-head">
                <div>
                  <span className="profile-section-kicker">Edit Details</span>
                  <h3>Personal Information</h3>
                </div>
                <div className="profile-actions">
                  <Link to="/forgot-password" className="btn btn-outline-dark rounded-pill">
                    Change Password
                  </Link>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="profile-form-grid">
                <div className="profile-field">
                  <label htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={user?.name || ""}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={user?.email || ""}
                    className="form-control"
                    disabled
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-phone">Phone</label>
                  <input
                    id="profile-phone"
                    type="text"
                    name="phone"
                    value={user?.phone || ""}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Add your phone number"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-city">City</label>
                  <input
                    id="profile-city"
                    type="text"
                    name="city"
                    value={user?.city || ""}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Add your city"
                  />
                </div>

                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="profile-marketing-opt-in">Email Preferences</label>
                  <div className="form-check mt-2">
                    <input
                      id="profile-marketing-opt-in"
                      type="checkbox"
                      name="marketing_opt_in"
                      className="form-check-input"
                      checked={Boolean(user?.marketing_opt_in)}
                      onChange={(event) =>
                        setUser((prev) => ({
                          ...prev,
                          marketing_opt_in: event.target.checked,
                        }))
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="profile-marketing-opt-in"
                    >
                      {MARKETING_OPT_IN_LABEL}
                    </label>
                  </div>
                </div>

                <div className="profile-form-footer">
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                  <span className="profile-save-hint">
                    Your email stays locked for account security.
                  </span>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
