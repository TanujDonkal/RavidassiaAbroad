import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import GlobalLoader from "../components/GlobalLoader";
import { API_BASE } from "../utils/api";

export default function CategoryFormModal({ category = null, onClose, onSubmit }) {
  const popup = usePopup();
  const [form, setForm] = useState({
    id: category?.id || null,
    name: category?.name || "",
    slug: category?.slug || "",
    parent_id: category?.parent_id || "",
    description: category?.description || "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const path = form.id ? `/admin/categories/${form.id}` : "/admin/categories";
      await apiFetch(path, {
        method,
        body: JSON.stringify({
          name: form.name,
          slug:
            form.slug ||
            form.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, ""),
          parent_id: form.parent_id || null,
          description: form.description,
        }),
      });

      popup.open({
        title: "✅ Success",
        message: "Category saved successfully!",
        type: "success",
      });

      if (typeof onSubmit === "function") onSubmit();
      if (typeof onClose === "function") onClose();
    } catch (err) {
      popup.open({
        title: "❌ Error",
        message: err.message || "Failed to save category",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalLoader visible={loading} />
      <div
        className="modal fade show"
        style={{
          display: "block",
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 1050,
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-3">
            <div className="modal-header bg-light border-0">
              <h5 className="modal-title text-primary fw-semibold">
                {form.id ? "✏️ Edit Category" : "➕ New Category"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body bg-light">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Category name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    className="form-control"
                    placeholder="Auto-generated if empty"
                    value={form.slug}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Parent Category</label>
                  <select
                    name="parent_id"
                    className="form-select"
                    value={form.parent_id || ""}
                    onChange={handleChange}
                  >
                    <option value="">None</option>
                    {categories
                      .filter((c) => !form.id || c.id !== form.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Optional description"
                    value={form.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-success px-4 me-2">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    onClick={onClose}
                  >
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
