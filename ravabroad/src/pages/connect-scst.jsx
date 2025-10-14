// src/pages/connect-scst.jsx
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "bootstrap";
import { apiFetch } from "../utils/api";

export default function ConnectSCST() {
  const thanksRef = useRef(null);
  const rulesRef = useRef(null);
  const [thanksModal, setThanksModal] = useState(null);
  const [rulesModal, setRulesModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ✅ New states for saved form logic
  const [formValues, setFormValues] = useState({});
  const [submissionData, setSubmissionData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (thanksRef.current) setThanksModal(new Modal(thanksRef.current));
    if (rulesRef.current) setRulesModal(new Modal(rulesRef.current));
    document.title = "Connect by Country — Ravidassia Abroad";
    fetchMySubmission();
  }, []);

  // ✅ Fetch logged-in user's submission
  const fetchMySubmission = async () => {
    try {
      const res = await apiFetch("/scst-submissions/mine");
      if (res.exists) {
        setSubmitted(true);
        setSubmissionData(res.data);
        setFormValues(res.data);
      }
    } catch {
      setSubmitted(false);
    }
  };

  // ✅ Controlled inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  // ✅ Submit or Resubmit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/scst-submissions", {
        method: "POST",
        body: JSON.stringify(formValues),
      });
      thanksModal && thanksModal.show();
      await fetchMySubmission();
    } catch (err) {
      setError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ If already submitted
  if (submitted && submissionData) {
    return (
      <div className="container py-5">
        <h2 className="text-center mb-4 fw-bold text-primary">
          Connect SC/ST Form
        </h2>
        <div className="card shadow-sm p-4 mx-auto mb-5" style={{ maxWidth: 850 }}>
          <h4 className="text-success mb-3 text-center">
            ✅ Your Submitted Details
          </h4>

          <table className="table table-striped table-bordered small">
            <tbody>
              {Object.entries(submissionData).map(([key, value]) => (
                <tr key={key}>
                  <th className="text-capitalize" style={{ width: "40%" }}>
                    {key.replaceAll("_", " ")}
                  </th>
                  <td>{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-center mt-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                setSubmitted(false);
                setIsEditing(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ✏️ Edit / Resubmit Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show the original form
  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="display-6">Connect with Sangat in Your Country</h1>
        <p className="text-muted">
          Request to join the WhatsApp group for your country. Admin approval is
          required.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="row g-3 bg-light p-4 rounded">
            {/* Full Name (required) */}
            <div className="col-md-6">
              <label htmlFor="name" className="form-label">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                required
                value={formValues.name || ""}
                onChange={handleChange}
              />
            </div>

            {/* Email (required) */}
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                required
                value={formValues.email || ""}
                onChange={handleChange}
              />
            </div>

            {/* Country (required) */}
            <div className="col-md-6">
              <label htmlFor="country" className="form-label">
                Country *
              </label>
              <select
                id="country"
                name="country"
                className="form-select"
                required
                value={formValues.country || ""}
                onChange={handleChange}
              >
                <option value="">Select your country</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>United States</option>
                <option>India</option>
                <option>Australia</option>
                <option>Germany</option>
                <option>Italy</option>
                <option>New Zealand</option>
                <option>UAE</option>
                <option>Other</option>
              </select>
            </div>

            {/* City */}
            <div className="col-md-6">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                className="form-control"
                value={formValues.city || ""}
                onChange={handleChange}
              />
            </div>

            {/* WhatsApp phone (required) */}
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">
                Phone (WhatsApp) *
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-control"
                placeholder="+1 902…"
                required
                value={formValues.phone || ""}
                onChange={handleChange}
              />
            </div>

            {/* Preferred platform (optional) */}
            <div className="col-md-6">
              <label htmlFor="platform" className="form-label">
                Preferred Platform
              </label>
              <select
                id="platform"
                name="platform"
                className="form-select"
                value={formValues.platform || "WhatsApp"}
                onChange={handleChange}
              >
                <option>WhatsApp</option>
                <option>Telegram</option>
                <option>Discord</option>
              </select>
            </div>

            {/* Instagram username (optional) */}
            <div className="col-md-6">
              <label htmlFor="instagram" className="form-label">
                Instagram Username
              </label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                className="form-control"
                placeholder="@yourhandle"
                value={formValues.instagram || ""}
                onChange={handleChange}
              />
            </div>

            {/* Simple proof */}
            <div className="col-12">
              <label htmlFor="proof" className="form-label">
                Proof you live there (postal code / school or work name)
              </label>
              <input
                id="proof"
                name="proof"
                type="text"
                className="form-control"
                placeholder="e.g., B3J…, NSCC Halifax, Tim Hortons Lady Hammond"
                value={formValues.proof || ""}
                onChange={handleChange}
              />
            </div>

            {/* Consent + RULES LINK */}
            <div className="col-12 form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="consent"
                required
              />
              <label className="form-check-label" htmlFor="consent">
                I agree to community rules &amp; allow admins to contact me.
              </label>
              <button
                type="button"
                className="btn btn-link p-0 ms-2 align-baseline"
                onClick={() => rulesModal && rulesModal.show()}
              >
                View rules
              </button>
            </div>

            <div className="col-12 text-end">
              <button
                type="submit"
                className="btn btn-primary border-secondary rounded-pill px-4"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Request to Join"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* === Rules Modal === */}
      <div
        className="modal fade"
        id="rulesModal"
        tabIndex="-1"
        ref={rulesRef}
        aria-labelledby="rulesTitle"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="rulesTitle" className="modal-title">
                Community Rules
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <ol className="ps-3">
                <li>Be kind. No hate speech, harassment, or spam.</li>
                <li>Share verified info only.</li>
                <li>
                  Respect Guru Ravidass Ji and all members of the community.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* === Success Modal === */}
      <div
        className="modal fade"
        id="thanksModal"
        tabIndex="-1"
        ref={thanksRef}
        aria-labelledby="thanksTitle"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="thanksTitle" className="modal-title">
                Request Submitted ✅
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>
                Thank you! Admins will review your request and contact you via
                WhatsApp soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
