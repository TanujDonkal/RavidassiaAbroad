import React, { useMemo, useRef, useState } from "react";
import Modal from "bootstrap/js/dist/modal";
import { apiFetch } from "../utils/api";
import { usePopup } from "./PopupProvider";
import ComplianceNotice from "./ComplianceNotice";
import {
  CONTENT_REQUEST_CONSENT,
  GENERAL_COLLECTION_NOTICE,
  LEGAL_PATHS,
  MARKETING_OPT_IN_LABEL,
  PRIVACY_CONTACT_EMAIL,
} from "../utils/compliance";
import { Link } from "react-router-dom";

const EMPTY_FORM = {
  name: "",
  email: "",
  content_url: "",
  type: "add",
  details: "",
  consent_given: false,
  marketing_opt_in: false,
};

export default function ContentRequestModal() {
  const popup = usePopup();
  const modalRef = useRef(null);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name: storedUser?.name || "",
    email: storedUser?.email || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const closeModal = () => {
    if (!modalRef.current) return;
    Modal.getOrCreateInstance(modalRef.current).hide();
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      name: storedUser?.name || "",
      email: storedUser?.email || "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/content-requests", {
        method: "POST",
        body: JSON.stringify(form),
      });
      closeModal();
      resetForm();
      popup.open({
        title: "Request submitted",
        message: `Your content request was submitted. For privacy questions about this request, contact ${PRIVACY_CONTACT_EMAIL}.`,
        type: "success",
      });
    } catch (err) {
      popup.open({
        title: "Request failed",
        message: err.message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="contentRequestModal"
      tabIndex="-1"
      aria-labelledby="contentRequestModalLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title" id="contentRequestModalLabel">
                Add / Remove / Report Content
              </h5>
              <p className="small text-muted mb-0">
                Use this form for current website content and related public
                social references.
              </p>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <ComplianceNotice text={GENERAL_COLLECTION_NOTICE} />

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Request Type</label>
                  <select
                    className="form-select"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="add">Add content</option>
                    <option value="remove">Remove content</option>
                    <option value="report">Report content</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Content URL</label>
                  <input
                    className="form-control"
                    name="content_url"
                    value={form.content_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Details</label>
                  <textarea
                    className="form-control"
                    name="details"
                    rows="4"
                    value={form.details}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="contentRequestConsent"
                  name="consent_given"
                  checked={form.consent_given}
                  onChange={handleChange}
                  required
                />
                <label className="form-check-label" htmlFor="contentRequestConsent">
                  {CONTENT_REQUEST_CONSENT}
                </label>
              </div>

              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="contentRequestMarketing"
                  name="marketing_opt_in"
                  checked={form.marketing_opt_in}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="contentRequestMarketing">
                  {MARKETING_OPT_IN_LABEL}
                </label>
              </div>

              <p className="small text-muted mt-3 mb-0">
                See the <Link to={LEGAL_PATHS.privacy}>Privacy Policy</Link> and{" "}
                <Link to={LEGAL_PATHS.terms}>Terms of Use</Link>.
              </p>

              <div className="mt-4 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
