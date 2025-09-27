// src/pages/ConnectSCST.jsx
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "bootstrap";

const API_BASE = "http://localhost:5000"; // <-- your Node backend

export default function ConnectSCST() {
  const thanksRef = useRef(null);
  const rulesRef = useRef(null);
  const [thanksModal, setThanksModal] = useState(null);
  const [rulesModal, setRulesModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (thanksRef.current) setThanksModal(new Modal(thanksRef.current));
    if (rulesRef.current) setRulesModal(new Modal(rulesRef.current));
    document.title = "Connect by Country — Ravidassia Abroad";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const country = (fd.get("country") || "").toString().trim();
    const city = (fd.get("city") || "").toString().trim();
    const phone = (fd.get("phone") || "").toString().trim();
    const platform = (fd.get("platform") || "").toString().trim(); // optional
    const instagram = (fd.get("instagram") || "").toString().trim(); // optional
    const proof = (fd.get("proof") || "").toString().trim(); // optional

    // Put all extra fields inside message so backend can store them in one column
    const message =
      [
        `Platform: ${platform || "—"}`,
        `Instagram: ${instagram || "—"}`,
        `Proof: ${proof || "—"}`,
      ].join("\n");

    // Prepare request
    const token = localStorage.getItem("token"); // may be null if user not logged in
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}/api/scst-submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          email,
          country,
          city: city || null,
          phone: phone || null,
          state: null, // add a state input later if you want; DB column already exists
          message, // includes platform/instagram/proof
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Submission failed. Please try again.");
      }

      // success
      form.reset();
      thanksModal && thanksModal.show();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="display-6">Connect with Sangat in Your Country</h1>
        <p className="text-muted">
          Request to join the WhatsApp group for your country. Admin approval is required.
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
              <label htmlFor="name" className="form-label">Full Name *</label>
              <input id="name" name="name" type="text" className="form-control" required />
            </div>

            {/* Email (required) */}
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">Email *</label>
              <input id="email" name="email" type="email" className="form-control" required />
            </div>

            {/* Country (required) */}
            <div className="col-md-6">
              <label htmlFor="country" className="form-label">Country *</label>
              <select id="country" name="country" className="form-select" required>
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
              <label htmlFor="city" className="form-label">City</label>
              <input id="city" name="city" type="text" className="form-control" />
            </div>

            {/* WhatsApp phone (required) */}
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">Phone (WhatsApp) *</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-control"
                placeholder="+1 902…"
                required
              />
            </div>

            {/* Preferred platform (optional) */}
            <div className="col-md-6">
              <label htmlFor="platform" className="form-label">Preferred Platform</label>
              <select id="platform" name="platform" className="form-select" defaultValue="WhatsApp">
                <option>WhatsApp</option>
                <option>Telegram</option>
                <option>Discord</option>
              </select>
            </div>

            {/* Instagram username (optional) */}
            <div className="col-md-6">
              <label htmlFor="instagram" className="form-label">Instagram Username</label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                className="form-control"
                placeholder="@yourhandle"
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
              />
            </div>

            {/* Consent + RULES LINK */}
            <div className="col-12 form-check">
              <input className="form-check-input" type="checkbox" id="consent" required />
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
      <div className="modal fade" id="rulesModal" tabIndex="-1" ref={rulesRef} aria-labelledby="rulesTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="rulesTitle" className="modal-title">Community Rules</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <ol className="ps-3">
                <li className="mb-2"><strong>Respect &amp; Safety:</strong> Be kind. No hate speech, harassment, or personal attacks.</li>
                <li className="mb-2"><strong>Country-Specific:</strong> Discuss local Sangat topics relevant to your country/channel.</li>
                <li className="mb-2"><strong>No Spam/Ads:</strong> No promotions, chain forwards, or mass DMs. Share community resources only.</li>
                <li className="mb-2"><strong>Privacy:</strong> Don’t post private info without consent. No doxxing.</li>
                <li className="mb-2"><strong>Events &amp; News:</strong> Verify before sharing. Use sources where possible.</li>
                <li className="mb-2"><strong>Faith &amp; Culture:</strong> Speak with reverence about Guru Ravidass Ji and all communities.</li>
                <li className="mb-2"><strong>Moderation:</strong> Admins may warn, mute, or remove members who break rules.</li>
                <li className="mb-2">
                  <strong>Report Issues:</strong> Email{" "}
                  <a href="mailto:RavidassiaAbroad@gmail.com">RavidassiaAbroad@gmail.com</a> to report problems.
                </li>
              </ol>
              <p className="mb-0 small text-muted">
                By checking the box on the form, you confirm you’ve read and agree to follow these rules.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                I understand
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === Success Modal === */}
      <div className="modal fade" id="thanksModal" tabIndex="-1" ref={thanksRef} aria-labelledby="thanksTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="thanksTitle" className="modal-title">Request Submitted ✅</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Thank you! Our admins will review your request shortly. If approved, you’ll receive a
                private WhatsApp invite link for your country.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal">
                Ok, got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
