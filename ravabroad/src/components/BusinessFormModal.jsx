import React, { useEffect, useState } from "react";
import { apiFetch, uploadBusinessImage } from "../utils/api";
import { usePopup } from "./PopupProvider";
import GlobalLoader from "./GlobalLoader";

function objectToLines(value) {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${item}`)
    .join("\n");
}

function linesToObject(value) {
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

export default function BusinessFormModal({ business = null, onClose, onSubmit }) {
  const popup = usePopup();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "",
    country: "",
    city: "",
    address: "",
    short_description: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    logo_url: "",
    image_url: "",
    contact_person_name: "",
    contact_person_email: "",
    social_links_text: "",
    business_hours_text: "",
    notes_for_admin: "",
    admin_notes: "",
    listing_type: "free",
    status: "pending",
    is_featured: false,
    is_verified: false,
  });

  useEffect(() => {
    if (!business) return;

    setForm({
      id: business.id || "",
      name: business.name || "",
      category: business.category || "",
      country: business.country || "",
      city: business.city || "",
      address: business.address || "",
      short_description: business.short_description || "",
      description: business.description || "",
      phone: business.phone || "",
      whatsapp: business.whatsapp || "",
      email: business.email || "",
      website: business.website || "",
      logo_url: business.logo_url || "",
      image_url: business.image_url || "",
      contact_person_name: business.contact_person_name || "",
      contact_person_email: business.contact_person_email || "",
      social_links_text: objectToLines(business.social_links),
      business_hours_text: objectToLines(business.business_hours),
      notes_for_admin: business.notes_for_admin || "",
      admin_notes: business.admin_notes || "",
      listing_type: business.listing_type || "free",
      status: business.status || "pending",
      is_featured: Boolean(business.is_featured),
      is_verified: Boolean(business.is_verified),
    });
  }, [business]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const upload = await uploadBusinessImage(file);
      setForm((prev) => ({
        ...prev,
        [fieldName]: upload.image_url,
      }));
    } catch (err) {
      popup.open({
        title: "Upload failed",
        message: err.message || "Unable to upload image.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await apiFetch(`/admin/businesses/${form.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          social_links: linesToObject(form.social_links_text),
          business_hours: linesToObject(form.business_hours_text),
        }),
      });

      popup.open({
        title: "Saved",
        message: "Business listing updated successfully.",
        type: "success",
      });
      await onSubmit?.();
      onClose();
    } catch (err) {
      popup.open({
        title: "Error",
        message: err.message || "Unable to save business.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <GlobalLoader visible={saving} />
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.62)", zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-light border-0">
              <div>
                <h5 className="modal-title fw-semibold text-primary mb-1">
                  Edit Business Listing
                </h5>
                <p className="text-muted mb-0 small">
                  Review, approve, feature, verify, and refine public listing details.
                </p>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body bg-light py-3">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Business name *</label>
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Category *</label>
                    <input className="form-control" name="category" value={form.category} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Listing type</label>
                    <select className="form-select" name="listing_type" value={form.listing_type} onChange={handleChange}>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="featured">Featured</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Country *</label>
                    <input className="form-control" name="country" value={form.country} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">City *</label>
                    <input className="form-control" name="city" value={form.city} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Address</label>
                    <input className="form-control" name="address" value={form.address} onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Short description</label>
                    <textarea className="form-control" rows="3" name="short_description" value={form.short_description} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Description *</label>
                    <textarea className="form-control" rows="3" name="description" value={form.description} onChange={handleChange} required></textarea>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Phone</label>
                    <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">WhatsApp</label>
                    <input className="form-control" name="whatsapp" value={form.whatsapp} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Public email</label>
                    <input className="form-control" name="email" value={form.email} onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Website</label>
                    <input className="form-control" name="website" value={form.website} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Contact person</label>
                    <input className="form-control" name="contact_person_name" value={form.contact_person_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Contact person email</label>
                    <input className="form-control" name="contact_person_email" value={form.contact_person_email} onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Logo URL</label>
                    <input className="form-control" name="logo_url" value={form.logo_url} onChange={handleChange} />
                    <input type="file" accept="image/*" className="form-control mt-2" onChange={(event) => handleImageUpload(event, "logo_url")} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Image URL</label>
                    <input className="form-control" name="image_url" value={form.image_url} onChange={handleChange} />
                    <input type="file" accept="image/*" className="form-control mt-2" onChange={(event) => handleImageUpload(event, "image_url")} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Social links</label>
                    <textarea className="form-control" rows="4" name="social_links_text" value={form.social_links_text} onChange={handleChange} placeholder={"facebook: https://...\ninstagram: https://..."}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Business hours</label>
                    <textarea className="form-control" rows="4" name="business_hours_text" value={form.business_hours_text} onChange={handleChange} placeholder={"monday: 9am - 5pm\nsunday: closed"}></textarea>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Submitter notes</label>
                    <textarea className="form-control" rows="3" name="notes_for_admin" value={form.notes_for_admin} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Admin notes</label>
                    <textarea className="form-control" rows="3" name="admin_notes" value={form.admin_notes} onChange={handleChange}></textarea>
                  </div>

                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="is_featured" name="is_featured" checked={form.is_featured} onChange={handleChange} />
                        <label className="form-check-label fw-semibold" htmlFor="is_featured">Featured</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="is_verified" name="is_verified" checked={form.is_verified} onChange={handleChange} />
                        <label className="form-check-label fw-semibold" htmlFor="is_verified">Verified</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 px-0 pt-4">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
