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
  const [formValues, setFormValues] = useState({});
  const thanksRef = useRef(null);
  const [thanksModal, setThanksModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Init
  useEffect(() => {
    if (thanksRef.current) setThanksModal(new Modal(thanksRef.current));
    document.title = "Ravidassia Matrimonial Form 💍";
    fetchMySubmission();
  }, []);

  // Fetch logged-in user's submission
  const fetchMySubmission = async () => {
    try {
      const res = await apiFetch("/matrimonial-submissions/mine");
      if (res.exists) {
        setSubmitted(true);
        setSubmissionData(res.data);
        setFormValues(res.data); // ✅ prefill state
        if (res.data.photo_url) setPreview(res.data.photo_url);
      } else {
        setSubmitted(false);
      }
    } catch (err) {
      console.warn("No previous submission:", err.message);
    }
  };

  // Handle change for all inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Validate step
  const totalSteps = 5;
  const handleNext = () => {
    const currentStepFields = document.querySelectorAll(
      `form [data-step="${step}"] [required]`
    );
    let allValid = true;

    currentStepFields.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("is-invalid");
        allValid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    });

    if (!allValid) {
      setError("⚠️ Please fill all required fields before continuing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    if (step < totalSteps) setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.entries(formValues).forEach(([k, v]) => formData.append(k, v ?? ""));
    const fileInput = document.querySelector('input[name="photo"]');
    if (fileInput && fileInput.files.length > 0) {
      formData.append("photo", fileInput.files[0]);
    }

    try {
      const res = await apiFetch("/matrimonial-submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.message?.includes("✅")) {
        throw new Error(res.message || "Failed to submit form");
      }

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
                  <td>
                    {key === "photo_url" && value ? (
                      <img
                        src={value}
                        alt="profile"
                        className="rounded-circle"
                        width="60"
                        height="60"
                      />
                    ) : (
                      value || "—"
                    )}
                  </td>
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
      ) : (
        <>
          <p className="text-center text-muted mb-4">
            We collect this information only for matchmaking within our
            Ravidassia community.
          </p>

          {/* Progress */}
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
            <div
              data-step="1"
              style={{ display: step === 1 ? "block" : "none" }}
            >
              <h5 className="section-title">👤 Personal Details</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input
                    name="name"
                    className="form-control"
                    required
                    value={formValues.name || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className="form-select"
                    required
                    value={formValues.gender || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    required
                    value={formValues.email || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone / WhatsApp *</label>
                  <input
                    name="phone"
                    className="form-control"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={formValues.phone || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date of Birth</label>
                  <input
                    name="dob"
                    type="date"
                    className="form-control"
                    value={formValues.dob || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Height (cm or ft)</label>
                  <input
                    name="height"
                    className="form-control"
                    value={formValues.height || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Caste</label>
                  <input
                    name="caste"
                    className="form-control"
                    value={formValues.caste || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Religious Beliefs</label>
                  <textarea
                    name="religion_beliefs"
                    className="form-control"
                    rows="1"
                    value={formValues.religion_beliefs || ""}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Instagram</label>
                  <input
                    name="instagram"
                    className="form-control"
                    value={formValues.instagram || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Marital Status *</label>
                  <select
                    name="marital_status"
                    className="form-select"
                    required
                    value={formValues.marital_status || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Never Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Complexion</label>
                  <select
                    name="complexion"
                    className="form-select"
                    value={formValues.complexion || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Fair</option>
                    <option>Wheatish</option>
                    <option>Dark</option>
                  </select>
                </div>
              </div>
            </div>

            {/* === STEP 2 === */}
            <div
              data-step="2"
              style={{ display: step === 2 ? "block" : "none" }}
            >
              <h5 className="section-title">📍 Location</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Country *</label>
                  <input
                    name="country_living"
                    className="form-control"
                    required
                    value={formValues.country_living || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">City *</label>
                  <input
                    name="city_living"
                    className="form-control"
                    required
                    value={formValues.city_living || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Home State (India) *</label>
                  <input
                    name="home_state_india"
                    className="form-control"
                    required
                    value={
                      formValues.home_state_india ||
                      formValues.origin_state ||
                      ""
                    }
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status *</label>
                  <select
                    name="status_type"
                    className="form-select"
                    required
                    value={
                      formValues.status_type || formValues.current_status || ""
                    }
                    onChange={handleChange}
                  >
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
            <div
              data-step="3"
              style={{ display: step === 3 ? "block" : "none" }}
            >
              <h5 className="section-title">🎓 Education & Profession</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Education *</label>
                  <input
                    name="education"
                    className="form-control"
                    required
                    value={formValues.education || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Occupation *</label>
                  <input
                    name="occupation"
                    className="form-control"
                    required
                    value={formValues.occupation || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Annual Income</label>
                  <input
                    name="annual_income"
                    className="form-control"
                    placeholder="e.g. ₹8 LPA or $80K"
                    value={formValues.annual_income || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Company / Institution</label>
                  <input
                    name="company_or_institution"
                    className="form-control"
                    value={formValues.company_or_institution || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Income Range</label>
                  <input
                    name="income_range"
                    className="form-control"
                    placeholder="e.g. $50k–$70k"
                    value={formValues.income_range || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* === STEP 4 === */}
            <div
              data-step="4"
              style={{ display: step === 4 ? "block" : "none" }}
            >
              <h5 className="section-title">👪 Family Background</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Father’s Name</label>
                  <input
                    name="father_name"
                    className="form-control"
                    value={formValues.father_name || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Father’s Occupation</label>
                  <input
                    name="father_occupation"
                    className="form-control"
                    value={formValues.father_occupation || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mother’s Name</label>
                  <input
                    name="mother_name"
                    className="form-control"
                    value={formValues.mother_name || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mother’s Occupation</label>
                  <input
                    name="mother_occupation"
                    className="form-control"
                    value={formValues.mother_occupation || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Number of Siblings</label>
                  <input
                    name="siblings"
                    type="number"
                    className="form-control"
                    value={formValues.siblings || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Family Type</label>
                  <select
                    name="family_type"
                    className="form-select"
                    value={formValues.family_type || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Joint Family</option>
                    <option>Nuclear Family</option>
                  </select>
                </div>
              </div>
            </div>

            {/* === STEP 5 === */}
            <div
              data-step="5"
              style={{ display: step === 5 ? "block" : "none" }}
            >
              <h5 className="section-title">💞 Partner Preferences & Photo</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Preferred Age Range</label>
                  <input
                    name="partner_age_range"
                    className="form-control"
                    placeholder="e.g. 25-30"
                    value={formValues.partner_age_range || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Preferred Country</label>
                  <input
                    name="partner_country"
                    className="form-control"
                    value={formValues.partner_country || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Preferred Marital Status</label>
                  <select
                    name="partner_marital_status"
                    className="form-select"
                    value={formValues.partner_marital_status || ""}
                    onChange={handleChange}
                  >
                    <option value="">Any</option>
                    <option>Never Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Religion Preference</label>
                  <input
                    name="religion"
                    className="form-control"
                    value={formValues.religion || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Privacy Accepted</label>
                  <select
                    name="privacy_accepted"
                    className="form-select"
                    value={formValues.privacy_accepted || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Other Expectations</label>
                  <textarea
                    name="partner_expectations"
                    className="form-control"
                    rows="2"
                    value={formValues.partner_expectations || ""}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="form-label">Upload Your Photo</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="form-control"
                    disabled={isEditing && preview}
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

                  {isEditing && preview && (
                    <div className="text-center mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setPreview(null);
                        }}
                      >
                        Change Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
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
