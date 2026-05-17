import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { clearStoredAuth, getStoredUser, setStoredUser } from "../utils/auth";
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
  const navigate = useNavigate();
  const popup = usePopup();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReasonCategory, setDeleteReasonCategory] = useState("");
  const [deleteReasonText, setDeleteReasonText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const deleteReasonOptions = [
    "Privacy concerns",
    "No longer using the platform",
    "Created a duplicate account",
    "Too many emails or notifications",
    "Found what I needed",
    "Other",
  ];

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser() || {});
    syncUser();
    window.addEventListener("auth-updated", syncUser);
    return () => window.removeEventListener("auth-updated", syncUser);
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
      setStoredUser(updatedUser);
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

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await apiFetch("/user/delete-account", {
        method: "POST",
        body: JSON.stringify({
          reason_category: deleteReasonCategory,
          reason_text: deleteReasonText,
        }),
      });

      clearStoredAuth();
      setShowDeleteModal(false);
      popup.open({
        type: "success",
        title: "Account Deactivated",
        message:
          response.message ||
          "Your account has been deactivated and you have been logged out.",
      });
      navigate("/auth", { replace: true });
    } catch (err) {
      popup.open({
        type: "error",
        title: "Could Not Delete Account",
        message: err.message || "Something went wrong while deleting your account.",
      });
    } finally {
      setDeletingAccount(false);
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

              <div className="profile-danger-zone">
                <div>
                  <span className="profile-section-kicker profile-danger-kicker">Danger Zone</span>
                  <h4>Delete account</h4>
                  <p>
                    Deleting your account will deactivate your login and hide active personal
                    listings, but your records will stay stored securely in our database for
                    compliance, support, and admin history.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger rounded-pill px-4"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 2000 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Delete your account?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => !deletingAccount && setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Are you sure you want to delete your account? This will deactivate your
                  access immediately. Your records will remain stored securely and are not
                  permanently erased from the database.
                </p>

                <div className="mb-3">
                  <label className="form-label">Reason for leaving (optional)</label>
                  <select
                    className="form-select"
                    value={deleteReasonCategory}
                    onChange={(event) => setDeleteReasonCategory(event.target.value)}
                    disabled={deletingAccount}
                  >
                    <option value="">Select a reason</option>
                    {deleteReasonOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Additional details (optional)</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={deleteReasonText}
                    onChange={(event) => setDeleteReasonText(event.target.value)}
                    placeholder="Share anything you want us to know before your account is deactivated."
                    disabled={deletingAccount}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
