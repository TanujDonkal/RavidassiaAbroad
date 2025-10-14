// src/pages/MatrimonialForm.jsx
import React, { useRef, useState, useEffect } from "react";
import { Modal } from "bootstrap";
import imageCompression from "browser-image-compression";
import { apiFetch } from "../utils/api";
import "../css/MatrimonialForm.css";

export default function MatrimonialForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const thanksRef = useRef(null);
  const [thanksModal, setThanksModal] = useState(null);

  useEffect(() => {
    if (thanksRef.current) setThanksModal(new Modal(thanksRef.current));
    document.title = "Ravidassia Matrimonial Form 💍";
    fetchMySubmission();
  }, []);

  // 🔹 Check if logged-in user has already submitted
  const fetchMySubmission = async () => {
    try {
      const res = await apiFetch("/matrimonial-submissions/mine");
      if (res.exists) {
        setSubmitted(true);
        setSubmissionData(res.data);
      } else {
        setSubmitted(false);
      }
    } catch (err) {
      console.warn("No previous submission:", err.message);
    }
  };

  const totalSteps = 5;
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔹 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await apiFetch("/matrimonial-submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit form");

      e.target.reset();
      setPreview(null);
      setStep(1);
      thanksModal && thanksModal.show();
      await fetchMySubmission();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4 fw-bold text-primary">
        Ravidassia Matrimonial Form 💍
      </h2>

      {/* ✅ Already submitted view */}
      {submitted && submissionData ? (
        <div
          className="card shadow-sm p-4 mx-auto mb-5"
          style={{ maxWidth: 850 }}
        >
          <h4 className="text-success mb-3 text-center">
            ✅ Your Submitted Biodata
          </h4>
          <div className="text-center mb-3">
            <img
              src={submissionData.photo_url || "/template/img/no-photo.png"}
              alt="profile"
              className="rounded-circle"
              width="120"
              height="120"
            />
          </div>
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
              onClick={() => setSubmitted(false)}
            >
              ✏️ Edit / Resubmit Form
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-center text-muted mb-4">
            We collect this information only for matchmaking within our
            Ravidassia community. We never sell or misuse your data.
          </p>

          {/* Progress bar */}
          <div className="progress mb-4" style={{ height: "10px" }}>
            <div
              className="progress-bar bg-warning"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <p className="text-center small text-muted mb-4">
            Step {step} of {totalSteps}
          </p>

          {error && (
            <div className="alert alert-danger text-center">{error}</div>
          )}

          <form
            className="mx-auto bg-white p-4 p-md-5 rounded-4 shadow-lg"
            style={{ maxWidth: 800 }}
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            {/* === STEP 1 === */}
            <div style={{ display: step === 1 ? "block" : "none" }}>
              <h5 className="section-title">👤 Personal Details</h5>
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <label className="form-label">Full Name *</label>
                  <input name="name" className="form-control" required />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Gender *</label>
                  <select name="gender" className="form-select" required>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Email *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Phone / WhatsApp *</label>
                  <input
                    name="phone"
                    className="form-control"
                    type="tel"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Date of Birth</label>
                  <input name="dob" type="date" className="form-control" />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Height (cm or ft)</label>
                  <input name="height" className="form-control" />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">
                    Caste (Within Ravidassia)
                  </label>
                  <input name="caste" className="form-control" />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">
                    Religious Beliefs / Practices
                  </label>
                  <textarea
                    name="religion_beliefs"
                    className="form-control"
                    rows="1"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* === STEP 2 === */}
            <div style={{ display: step === 2 ? "block" : "none" }}>
              <h5 className="section-title">📍 Location</h5>
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <label className="form-label">
                    Currently Living In (Country) *
                  </label>
                  <input
                    name="country_living"
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">City / Province *</label>
                  <input name="city_living" className="form-control" required />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">
                    From (Home State in India) *
                  </label>
                  <input
                    name="home_state_india" 
                    className="form-control"
                    required={step === 2}
                  />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Current Visa / Status *</label>
                  <select name="status_type" className="form-select" required={step === 2}>
                    <option value="">Select</option>
                    <option>Student</option>
                    <option>Work Permit</option>
                    <option>Permanent Resident</option>
                    <option>Citizen</option>
                    <option>Visitor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* === STEP 3 === */}
            <div style={{ display: step === 3 ? "block" : "none" }}>
              <h5 className="section-title">🎓 Education & Profession</h5>
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <label className="form-label">Education *</label>
                  <input name="education" className="form-control" required />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Occupation *</label>
                  <input name="occupation" className="form-control" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Work / Study Details</label>
                  <textarea
                    name="work_details"
                    className="form-control"
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* === STEP 4 === */}
            <div style={{ display: step === 4 ? "block" : "none" }}>
              <h5 className="section-title">👪 Family Background</h5>
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <label className="form-label">Father’s Occupation</label>
                  <input name="father_occupation" className="form-control" />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Mother’s Occupation</label>
                  <input name="mother_occupation" className="form-control" />
                </div>
                <div className="col-12">
                  <label className="form-label">Family Details</label>
                  <textarea
                    name="family_details"
                    className="form-control"
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* === STEP 5 === */}
            <div style={{ display: step === 5 ? "block" : "none" }}>
              <h5 className="section-title">
                💞 Partner Preferences & Profile Picture
              </h5>
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <label className="form-label">Preferred Age Range</label>
                  <input
                    name="partner_age"
                    className="form-control"
                    placeholder="e.g. 25-30"
                  />
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label">Preferred Country</label>
                  <input name="partner_country" className="form-control" />
                </div>
                <div className="col-12">
                  <label className="form-label">Other Expectations</label>
                  <textarea
                    name="partner_expectations"
                    className="form-control"
                    rows="2"
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Upload Your Photo (optional)
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="form-control"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const compressed = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1080,
                            useWebWorker: true,
                          });
                          const dataTransfer = new DataTransfer();
                          dataTransfer.items.add(compressed);
                          e.target.files = dataTransfer.files;
                          setPreview(URL.createObjectURL(compressed));
                        } catch (err) {
                          setPreview(URL.createObjectURL(file));
                        }
                      }
                    }}
                  />
                  {preview && (
                    <div className="mt-3 text-center">
                      <img
                        src={preview}
                        alt="preview"
                        className="rounded-circle shadow-sm object-cover"
                        width="120"
                        height="120"
                      />
                    </div>
                  )}
                </div>

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
              </div>
            </div>

            {/* === Buttons === */}
            <div className="d-flex justify-content-between mt-4">
              {step > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={handleBack}
                >
                  ← Back
                </button>
              )}
              {step < totalSteps && (
                <button
                  type="button"
                  className="btn btn-warning rounded-pill px-4 ms-auto"
                  onClick={handleNext}
                >
                  Next →
                </button>
              )}
              {step === totalSteps && (
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4 ms-auto"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Biodata"}
                </button>
              )}
            </div>
          </form>
        </>
      )}

      {/* ✅ Success Modal */}
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
              <p>
                Thank you for submitting your biodata! You can view or edit it
                below anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
