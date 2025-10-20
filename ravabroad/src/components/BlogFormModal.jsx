import React, { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { apiFetch } from "../utils/api";
import "../css/BlogFormModal.css";
import { usePopup } from "../components/PopupProvider";
import GlobalLoader from "../components/GlobalLoader";

export default function BlogFormModal({ blog = null, onClose, onSubmit }) {
  const popup = usePopup();

  const [form, setForm] = useState({
    id: "",
    title: "",
    excerpt: "",
    content: "",
    image_file: null,
    image_url: "",
    category_id: "",
    status: "published",
  });

  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  // 🟢 Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/categories`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((c) => ({ ...c, id: String(c.id) }))
          : [];
        setCategories(normalized);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 🧠 Fill form when blog prop changes (for Edit)
  useEffect(() => {
    if (blog) {
      setForm({
        id: blog.id || "",
        title: blog.title || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        image_file: null,
        image_url: blog.image_url || "",
        category_id: blog.category_id ? String(blog.category_id) : "",
        status: blog.status || "published",
      });
      setPreview(blog.image_url || "");
    }
  }, [blog]);

  // ✅ If categories arrive late, reapply category_id
  useEffect(() => {
    if (blog?.category_id && categories.length > 0) {
      setForm((prev) => ({
        ...prev,
        category_id: String(blog.category_id),
      }));
    }
  }, [categories, blog]);

  // ✅ Input Handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (event, editor) => {
    setForm({ ...form, content: editor.getData() });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image_file: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (
        !form.title.trim() ||
        !form.excerpt.trim() ||
        !form.content.trim() ||
        !form.category_id
      ) {
        popup.open({
          title: "⚠️ Missing Fields",
          message: "Please fill in all required fields before saving.",
          type: "warning",
        });
        setUploading(false);
        return;
      }

      let imageUrl = form.image_url;

      // 🟢 Upload image if new one selected
      if (form.image_file) {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("image", form.image_file);
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/blogs/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Image upload failed");
        imageUrl = data.image_url;
      }

      // 🟢 Save / Update blog
      const response = await apiFetch(
        form.id ? `/admin/blogs/${form.id}` : "/admin/blogs",
        {
          method: form.id ? "PUT" : "POST",
          body: JSON.stringify({
            title: form.title,
            excerpt: form.excerpt,
            content: form.content,
            image_url: imageUrl,
            category_id: form.category_id,
            status: form.status,
          }),
        }
      );

      popup.open({
        title: "✅ Success",
        message: response.message || "Blog saved successfully!",
        type: "success",
      });

      if (typeof onSubmit === "function" && response.blog)
        onSubmit(response.blog);
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("❌ Error saving blog:", err);
      popup.open({
        title: "❌ Error",
        message: err.message || "Failed to save blog",
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
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 1050,
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-fullscreen">
          <div className="modal-content border-0 shadow-lg rounded-3">
            <div className="modal-header bg-light border-0">
              <h5 className="modal-title fw-semibold text-primary">
                {form.id ? "✏️ Edit Blog Post" : "📝 Create New Blog Post"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body bg-light py-4">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-lg-8 col-md-10">
                    <div className="card p-4 border-0 shadow-sm bg-white">
                      <div className="card-body">
                        <form onSubmit={handleSubmit}>
                          {/* Title + Excerpt */}
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">
                                Title *
                              </label>
                              <input
                                type="text"
                                name="title"
                                className="form-control"
                                placeholder="Enter blog title"
                                value={form.title}
                                onChange={handleChange}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">
                                Short Description *
                              </label>
                              <input
                                type="text"
                                name="excerpt"
                                className="form-control"
                                placeholder="Enter short description"
                                value={form.excerpt}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Category */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Category *
                            </label>
                            <select
                              name="category_id"
                              className="form-select"
                              value={form.category_id || ""}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Content */}
                          <div className="mb-4">
                            <label className="form-label fw-semibold">
                              Content *
                            </label>
                            <div
                              className="border rounded p-2"
                              style={{
                                maxHeight: "400px",
                                overflowY: "auto",
                                backgroundColor: "#fff",
                              }}
                            >
                              <CKEditor
                                editor={ClassicEditor}
                                data={form.content}
                                onChange={handleEditorChange}
                              />
                            </div>
                          </div>

                          {/* Image + Status */}
                          <div className="row align-items-start">
                            <div className="col-md-8 mb-3">
                              <label className="form-label fw-semibold">
                                Image *
                              </label>
                              {preview && (
                                <div className="text-center mb-3">
                                  <img
                                    src={preview}
                                    alt="Preview"
                                    className="img-fluid rounded shadow-sm border"
                                    style={{
                                      maxHeight: "220px",
                                      objectFit: "cover",
                                      width: "100%",
                                    }}
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={handleFileSelect}
                                disabled={uploading}
                                required={!form.id}
                              />
                              <small className="text-muted">
                                Supported: JPG, PNG, WEBP (max 5 MB)
                              </small>
                            </div>

                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">
                                Post Status
                              </label>
                              <select
                                name="status"
                                className="form-select"
                                value={form.status}
                                onChange={handleChange}
                              >
                                <option value="published">
                                  Save & Publish
                                </option>
                                <option value="draft">Save as Draft</option>
                              </select>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="text-center mt-4">
                            <button
                              type="submit"
                              className="btn btn-success py-2 px-5 me-2"
                              disabled={uploading}
                            >
                              {uploading ? "Saving..." : "Save Post"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary py-2 px-5"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
