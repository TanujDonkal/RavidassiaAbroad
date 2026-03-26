import React, { useEffect, useMemo, useState } from "react";
import GlobalLoader from "./GlobalLoader";
import { apiFetch, uploadAdminImage } from "../utils/api";
import { usePopup } from "./PopupProvider";

function normalizeGalleryUrls(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TempleFormModal({ temple = null, onClose, onSubmit }) {
  const popup = usePopup();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    country: "",
    city: "",
    location_label: "",
    address: "",
    description: "",
    image_url: "",
    gallery_urls_text: "",
    maps_url: "",
    website_url: "",
    established_year: "",
    contact_info: "",
    seva_info: "",
    featured: true,
    display_order: 0,
  });

  useEffect(() => {
    if (!temple) return;

    setForm({
      id: temple.id || "",
      name: temple.name || "",
      country: temple.country || "",
      city: temple.city || "",
      location_label: temple.location_label || "",
      address: temple.address || "",
      description: temple.description || "",
      image_url: temple.image_url || "",
      gallery_urls_text: Array.isArray(temple.gallery_urls)
        ? temple.gallery_urls.join("\n")
        : "",
      maps_url: temple.maps_url || "",
      website_url: temple.website_url || "",
      established_year: temple.established_year || "",
      contact_info: temple.contact_info || "",
      seva_info: temple.seva_info || "",
      featured: Boolean(temple.featured),
      display_order: temple.display_order ?? 0,
    });
  }, [temple]);

  const previewGallery = useMemo(() => normalizeGalleryUrls(form.gallery_urls_text), [form.gallery_urls_text]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (!form.name.trim() || !form.country.trim() || !form.city.trim()) {
        popup.open({
          title: "Missing Fields",
          message: "Temple name, country, and city are required.",
          type: "warning",
        });
        return;
      }

      let heroImageUrl = form.image_url.trim();
      if (imageFile) {
        const upload = await uploadAdminImage(imageFile);
        heroImageUrl = upload.image_url;
      }

      let galleryUrls = normalizeGalleryUrls(form.gallery_urls_text);
      if (galleryFiles.length > 0) {
        const uploads = await Promise.all(
          galleryFiles.map((file) => uploadAdminImage(file))
        );
        galleryUrls = [
          ...galleryUrls,
          ...uploads.map((entry) => entry.image_url).filter(Boolean),
        ];
      }

      const payload = {
        name: form.name.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        location_label: form.location_label.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        image_url: heroImageUrl,
        gallery_urls: galleryUrls,
        maps_url: form.maps_url.trim(),
        website_url: form.website_url.trim(),
        established_year: form.established_year,
        contact_info: form.contact_info.trim(),
        seva_info: form.seva_info.trim(),
        featured: form.featured,
        display_order: Number(form.display_order) || 0,
      };

      await apiFetch(form.id ? `/admin/temples/${form.id}` : "/admin/temples", {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      popup.open({
        title: "Saved",
        message: `Temple ${form.id ? "updated" : "created"} successfully.`,
        type: "success",
      });

      await onSubmit?.();
      onClose();
    } catch (err) {
      console.error("Temple save error:", err);
      popup.open({
        title: "Error",
        message: err.message || "Failed to save temple.",
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
                  {form.id ? "Edit Global Temple" : "Add Global Temple"}
                </h5>
                <p className="text-muted mb-0 small">
                  Manage country-based temple listings, photos, maps, and sangat details.
                </p>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body bg-light py-3">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Temple Name *</label>
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Country *</label>
                    <input className="form-control" name="country" value={form.country} onChange={handleChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">City *</label>
                    <input className="form-control" name="city" value={form.city} onChange={handleChange} required />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Location Label</label>
                    <input className="form-control" name="location_label" value={form.location_label} onChange={handleChange} placeholder="e.g. Southall, London" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Address</label>
                    <input className="form-control" name="address" value={form.address} onChange={handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows="4" name="description" value={form.description} onChange={handleChange}></textarea>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Hero Image</label>
                    {form.image_url && (
                      <div className="mb-2">
                        <img src={form.image_url} alt={form.name || "Temple"} className="img-fluid rounded-3 shadow-sm" style={{ maxHeight: "180px", objectFit: "cover" }} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Gallery Image URLs</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="gallery_urls_text"
                      value={form.gallery_urls_text}
                      onChange={handleChange}
                      placeholder="One image URL per line"
                    ></textarea>
                    <div className="small text-muted mt-2">
                      Add extra URLs or upload more images below.
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="form-control mt-2"
                      onChange={(event) => setGalleryFiles(Array.from(event.target.files || []))}
                    />
                  </div>

                  {previewGallery.length > 0 && (
                    <div className="col-12">
                      <div className="d-flex flex-wrap gap-2">
                        {previewGallery.slice(0, 6).map((url) => (
                          <img
                            key={url}
                            src={url}
                            alt="Temple gallery"
                            className="rounded-3 border"
                            style={{ width: "92px", height: "72px", objectFit: "cover" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Google Maps URL</label>
                    <input className="form-control" name="maps_url" value={form.maps_url} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Website URL</label>
                    <input className="form-control" name="website_url" value={form.website_url} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Established Year</label>
                    <input className="form-control" type="number" name="established_year" value={form.established_year} onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Contact Info</label>
                    <textarea className="form-control" rows="3" name="contact_info" value={form.contact_info} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Seva / Community Info</label>
                    <textarea className="form-control" rows="3" name="seva_info" value={form.seva_info} onChange={handleChange}></textarea>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Display Order</label>
                    <input className="form-control" type="number" name="display_order" value={form.display_order} onChange={handleChange} />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="temple-featured-switch"
                        name="featured"
                        checked={form.featured}
                        onChange={handleChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="temple-featured-switch">
                        Featured temple
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <button type="submit" className="btn btn-success px-5 me-2">
                    {saving ? "Saving..." : "Save Temple"}
                  </button>
                  <button type="button" className="btn btn-secondary px-5" onClick={onClose}>
                    Cancel
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
