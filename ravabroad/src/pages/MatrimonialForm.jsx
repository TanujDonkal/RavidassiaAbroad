import React, { useRef, useState, useEffect } from "react";
import { Modal } from "bootstrap";
import { apiFetch } from "../utils/api";

export default function MatrimonialForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const thanksRef = useRef(null);
  const [thanksModal, setThanksModal] = useState(null);

  useEffect(() => {
    if (thanksRef.current) setThanksModal(new Modal(thanksRef.current));
    document.title = "Ravidassia Matrimonial Form 💍";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    try {
      const res = await apiFetch("/matrimonial-submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // ✅ Show success popup
      e.target.reset();
      thanksModal && thanksModal.show();
    } catch (err) {
      console.error("Matrimonial submit error:", err);
      setError(err.message || "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Ravidassia Matrimonial Form 💍</h2>
      <p className="text-center text-muted mb-4">
        We collect this information only for matchmaking within our Ravidassia
        community. We never sell or misuse your data.
      </p>

      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      <form
        className="mx-auto bg-light p-4 rounded shadow-sm"
        style={{ maxWidth: 800 }}
        onSubmit={handleSubmit}
      >
        {/* Personal Info */}
        <h5 className="border-bottom pb-2 mb-3 text-primary">
          Personal Details
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Full Name *</label>
            <input name="name" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Gender *</label>
            <select name="gender" className="form-select" required>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Email *</label>
            <input name="email" type="email" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Phone / WhatsApp *</label>
            <input name="phone" className="form-control" required />
          </div>
        </div>

        {/* Location Info */}
        <h5 className="border-bottom pb-2 mb-3 mt-4 text-primary">Location</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">
              Currently Living In (Country) *
            </label>
            <input name="country_living" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">City / Province *</label>
            <input name="city_living" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">From (Home State in India) *</label>
            <input name="home_state_india" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Current Visa / Status *</label>
            <select name="status_type" className="form-select" required>
              <option value="">Select</option>
              <option>Student</option>
              <option>Work Permit</option>
              <option>Permanent Resident</option>
              <option>Citizen</option>
              <option>Visitor</option>
            </select>
          </div>
        </div>

        {/* Professional Info */}
        <h5 className="border-bottom pb-2 mb-3 mt-4 text-primary">
          Education & Profession
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Education *</label>
            <input name="education" className="form-control" required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Occupation *</label>
            <input name="occupation" className="form-control" required />
          </div>
          <div className="col-md-12">
            <label className="form-label">Work / Study Details</label>
            <textarea name="work_details" className="form-control" rows="2"></textarea>
          </div>
        </div>

        {/* Family Info */}
        <h5 className="border-bottom pb-2 mb-3 mt-4 text-primary">
          Family Background
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Father’s Occupation</label>
            <input name="father_occupation" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Mother’s Occupation</label>
            <input name="mother_occupation" className="form-control" />
          </div>
          <div className="col-md-12">
            <label className="form-label">Family Details</label>
            <textarea
              name="family_details"
              className="form-control"
              rows="2"
            ></textarea>
          </div>
        </div>

        {/* Partner Preferences */}
        <h5 className="border-bottom pb-2 mb-3 mt-4 text-primary">
          Partner Preferences
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Preferred Age Range</label>
            <input
              name="partner_age"
              className="form-control"
              placeholder="e.g. 25-30"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Preferred Country</label>
            <input name="partner_country" className="form-control" />
          </div>
          <div className="col-md-12">
            <label className="form-label">Other Expectations</label>
            <textarea
              name="partner_expectations"
              className="form-control"
              rows="2"
            ></textarea>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="form-check mt-4">
          <input
            className="form-check-input"
            type="checkbox"
            required
            id="privacyCheck"
          />
          <label className="form-check-label" htmlFor="privacyCheck">
            I agree to the{" "}
            <a
              href="#!"
              data-bs-toggle="modal"
              data-bs-target="#privacyModal"
              className="text-primary"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        <div className="text-center mt-4">
          <button
            type="submit"
            className="btn btn-primary rounded-pill px-4 py-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Biodata"}
          </button>
        </div>
      </form>

      {/* Privacy Modal */}
      <div
        className="modal fade"
        id="privacyModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Privacy Policy</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Your submitted details will be used solely for matrimonial
                matchmaking purposes within the Ravidassia community. We never
                sell, share, or misuse your data. You can request removal of
                your data at any time.
              </p>
              <p className="text-muted mb-0">
                © 2025 Ravidassia Abroad Matrimonials
              </p>
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
                ✅ Submission Successful!
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Thank you for submitting your biodata! Our team will review your
                details and reach out if a suitable match is found.
              </p>
              <p className="mt-2 small text-muted">
                Follow us on Instagram:
                <a
                  href="https://instagram.com/RavidassiaAbroadMatrimonials"
                  target="_blank"
                  rel="noreferrer"
                  className="ms-1 fw-bold text-primary"
                >
                  @RavidassiaAbroadMatrimonials
                </a>
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                Ok, got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
