import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { submitBusinessListing, uploadBusinessImage } from "../utils/api";
import { getStoredUser } from "../utils/auth";
import { buildBreadcrumbSchema } from "../utils/seo";
import "../css/business-directory.css";

function parseLineMap(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (!key || rest.length === 0) return acc;
      acc[key.trim().toLowerCase()] = rest.join(":").trim();
      return acc;
    }, {});
}

export default function SubmitBusiness() {
  const currentUser = useMemo(() => getStoredUser() || {}, []);
  const [form, setForm] = useState({
    name: "",
    category: "",
    country: "",
    city: "",
    contact_person_name: currentUser.name || "",
    contact_person_email: currentUser.email || "",
    short_description: "",
    description: "",
    phone: "",
    whatsapp: "",
    website: "",
    address: "",
    logo_url: "",
    image_url: "",
    social_links_text: "",
    business_hours_text: "",
    notes_for_admin: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const upload = await uploadBusinessImage(file);
      setForm((prev) => ({
        ...prev,
        logo_url: prev.logo_url || upload.image_url,
        image_url: upload.image_url,
      }));
    } catch (err) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await submitBusinessListing({
        ...form,
        social_links: parseLineMap(form.social_links_text),
        business_hours: parseLineMap(form.business_hours_text),
      });

      setSuccess(
        "Your business listing has been submitted for review. Our team will approve it before it appears publicly."
      );
      setForm((prev) => ({
        ...prev,
        name: "",
        category: "",
        country: "",
        city: "",
        short_description: "",
        description: "",
        phone: "",
        whatsapp: "",
        website: "",
        address: "",
        logo_url: "",
        image_url: "",
        social_links_text: "",
        business_hours_text: "",
        notes_for_admin: "",
      }));
    } catch (err) {
      setError(err.message || "Failed to submit business listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="business-shell py-5">
      <Seo
        title="Submit a Business | Ravidassia Abroad"
        description="Submit a community business listing to Ravidassia Abroad for review and possible inclusion in the public directory."
        canonicalPath="/submit-business"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Submit Business", path: "/submit-business" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Directory Submission</span>
          <h1 className="display-5 fw-bold mt-3 mb-3">Submit a Business</h1>
          <p className="lead text-white-50 mb-0">
            Share a community business or service for review. Approved listings
            may appear in the public business directory after moderation.
          </p>
        </section>

        <section className="row g-4">
          <div className="col-lg-8">
            <div className="business-panel p-4 p-lg-5">
              {success && <div className="alert alert-success">{success}</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Business name *</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category *</label>
                    <input
                      className="form-control"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Country *</label>
                    <input
                      className="form-control"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City *</label>
                    <input
                      className="form-control"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact person name *</label>
                    <input
                      className="form-control"
                      name="contact_person_name"
                      value={form.contact_person_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="contact_person_email"
                      value={form.contact_person_email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Short description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      name="short_description"
                      value={form.short_description}
                      onChange={handleChange}
                      placeholder="A concise summary for cards and previews"
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Business description *</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">WhatsApp</label>
                    <input className="form-control" name="whatsapp" value={form.whatsapp} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Website</label>
                    <input className="form-control" name="website" value={form.website} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Address</label>
                    <input className="form-control" name="address" value={form.address} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Logo or image URL</label>
                    <input className="form-control" name="logo_url" value={form.logo_url} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Upload logo / image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileUpload}
                    />
                    <div className="small text-muted mt-2">
                      {uploading ? "Uploading image..." : "Optional image upload through the existing media flow."}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Social links</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="social_links_text"
                      value={form.social_links_text}
                      onChange={handleChange}
                      placeholder={"facebook: https://...\ninstagram: https://..."}
                    ></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Business hours</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="business_hours_text"
                      value={form.business_hours_text}
                      onChange={handleChange}
                      placeholder={"monday: 9am - 5pm\nsunday: closed"}
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes for admin</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="notes_for_admin"
                      value={form.notes_for_admin}
                      onChange={handleChange}
                      placeholder="Anything helpful for review or verification"
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4"
                    disabled={submitting || uploading}
                  >
                    {submitting ? "Submitting..." : "Submit Listing"}
                  </button>
                  <Link to="/business-directory" className="btn btn-outline-dark rounded-pill px-4">
                    View Directory
                  </Link>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="business-sidebar-card">
              <div className="business-panel p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">What happens next?</h2>
                <div className="business-info-list">
                  {[
                    "Every listing starts as pending review.",
                    "Admin checks the details before approval.",
                    "Pending, rejected, or hidden listings are not shown publicly.",
                    "You may be contacted if clarification is needed.",
                  ].map((item) => (
                    <div key={item} className="business-info-item">
                      <i className="fas fa-angle-right"></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="business-cta-card p-4">
                <h2 className="h5 fw-bold mb-3">Want broader visibility?</h2>
                <p className="small text-white-50">
                  You can also discuss featured placement or sponsorship packages
                  with the Ravidassia Abroad team.
                </p>
                <Link to="/sponsor-advertise" className="btn btn-warning rounded-pill px-4">
                  Sponsor / Advertise
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
