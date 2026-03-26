import React, { useMemo, useState } from "react";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import ComplianceNotice from "../components/ComplianceNotice";
import {
  GENERAL_COLLECTION_NOTICE,
  PRIVACY_CONTACT_EMAIL,
} from "../utils/compliance";

const REQUEST_TYPES = [
  { value: "access", label: "Access to my data" },
  { value: "correction", label: "Correction of my data" },
  { value: "deletion", label: "Deletion of my data" },
  { value: "account_deletion", label: "Account deletion" },
];

export default function PrivacyDataRequest() {
  const popup = usePopup();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [form, setForm] = useState({
    request_type: "access",
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/privacy-requests", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm((prev) => ({ ...prev, request_type: "access", message: "" }));
      popup.open({
        title: "Request submitted",
        message: `Your privacy request was received. If needed, we may contact you at the email you provided. You can also write to ${PRIVACY_CONTACT_EMAIL}.`,
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
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 860 }}>
        <h1 className="mb-3">Privacy / Data Request</h1>
        <p>
          Use this page to request access, correction, deletion, or account
          deletion for data handled in the current Ravidassia Abroad app.
        </p>
        <p>
          Privacy contact:{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
        </p>

        <form onSubmit={handleSubmit} className="bg-light rounded p-4 shadow-sm">
          <ComplianceNotice text={GENERAL_COLLECTION_NOTICE} />

          <div className="mb-3">
            <label className="form-label">Request Type</label>
            <select
              className="form-select"
              name="request_type"
              value={form.request_type}
              onChange={handleChange}
              required
            >
              {REQUEST_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

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
          </div>

          <div className="mt-3">
            <label className="form-label">Message</label>
            <textarea
              className="form-control"
              name="message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what record or issue you want reviewed."
              required
            />
          </div>

          <div className="mt-4">
            <button className="btn btn-primary rounded-pill px-4" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Privacy Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
