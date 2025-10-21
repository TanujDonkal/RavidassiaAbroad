import React, { useState, useEffect } from "react";
import { apiFetch, API_BASE } from "../utils/api";
import GlobalLoader from "../components/GlobalLoader";
import { usePopup } from "../components/PopupProvider";

export default function PersonalityFormModal({ personality = null, onClose, onSubmit }) {
  const popup = usePopup();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    caste: "Chamar",
    category: "Artist",
    region: "India",
    sc_st_type: "SC",
    short_bio: "",
    full_bio: "",
    photo_file: null,
    photo_url: "",
  });
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (personality) {
      setForm({
        ...form,
        ...personality,
        id: personality.id || "",
        photo_file: null,
      });
      setPreview(personality.photo_url || "");
    }
    // eslint-disable-next-line
  }, [personality]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, photo_file: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!form.name.trim() || !form.short_bio.trim()) {
        popup.open({
          title: "⚠️ Missing Fields",
          message: "Name and short bio are required.",
          type: "warning",
        });
        setUploading(false);
        return;
      }

      let photoUrl = form.photo_url;

      // 🖼 Upload photo if new file selected
      if (form.photo_file) {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("image", form.photo_file);
        const res = await fetch(`${API_BASE}/admin/blogs/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        photoUrl = data.image_url;
      }

      // 🟢 Create or Update
      const response = await apiFetch(
        form.id ? `/admin/personalities/${form.id}` : "/admin/personalities",
        {
          method: form.id ? "PUT" : "POST",
          body: JSON.stringify({ ...form, photo_url: photoUrl }),
        }
      );

      popup.open({
        title: "✅ Success",
        message: response.message || "Saved successfully!",
        type: "success",
      });

      if (onSubmit) onSubmit();
      onClose();
    } catch (err) {
      console.error("❌ Error saving personality:", err);
      popup.open({
        title: "❌ Error",
        message: err.message || "Failed to save personality",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <GlobalLoader visible={uploading} />
      <div
        className="modal fade show"
        style={{
          display: "block",
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 1050,
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-3">
            <div className="modal-header bg-light border-0">
              <h5 className="modal-title fw-semibold text-primary">
                {form.id ? "✏️ Edit Personality" : "👤 Add New Personality"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body bg-light py-3">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Caste</label>
                    <select
                      name="caste"
                      className="form-select"
                      value={form.caste}
                      onChange={handleChange}
                    >
                      <option>Chamar</option>
                      <option>Valmiki</option>
                      <option>Ravidassia</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Region</label>
                    <select
                      name="region"
                      className="form-select"
                      value={form.region}
                      onChange={handleChange}
                    >
                      <option>India</option>
                      <option>Abroad</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">SC/ST Type</label>
                    <select
                      name="sc_st_type"
                      className="form-select"
                      value={form.sc_st_type}
                      onChange={handleChange}
                    >
                      <option>SC</option>
                      <option>ST</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category</label>
                    <select
                      name="category"
                      className="form-select"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option>Artist</option>
                      <option>Politician</option>
                      <option>Scholar</option>
                      <option>Activist</option>
                      <option>Religious Leader</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Short Bio *</label>
                    <textarea
                      name="short_bio"
                      rows="2"
                      className="form-control"
                      value={form.short_bio}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Full Bio</label>
                    <textarea
                      name="full_bio"
                      rows="4"
                      className="form-control"
                      value={form.full_bio}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Photo</label>
                    {preview && (
                      <div className="text-center mb-3">
                        <img
                          src={preview}
                          alt="Preview"
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: "220px" }}
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                <div className="text-center mt-4">
                  <button type="submit" className="btn btn-success px-5 me-2">
                    {uploading ? "Saving..." : "Save"}
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
