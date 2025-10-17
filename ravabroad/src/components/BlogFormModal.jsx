import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { apiFetch } from "../utils/api";
import "../css/BlogFormModal.css";
import { usePopup } from "../components/PopupProvider";
import GlobalLoader from "../components/GlobalLoader";

export default function BlogFormModal({ blog = null, onClose, onSubmit }) {
  const popup = usePopup();
  const [form, setForm] = useState({
    id: blog?.id || null,
    title: blog?.title || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    image_file: null,
    image_url: blog?.image_url || "",
    category_id: blog?.category_id || 1,
    status: blog?.status || "published",
  });

  const [preview, setPreview] = useState(blog?.image_url || "");
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (event, editor) => {
    setForm({ ...form, content: editor.getData() });
  };

  // ✅ Show preview when file is selected
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image_file: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Handle submit → upload → save
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = form.image_url;

      // 🟢 Upload to Cloudinary if file selected
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

      // 🟢 Save blog post to DB
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

      // ✅ Safely call parent only if blog object exists
      if (typeof onSubmit === "function" && response.blog) onSubmit(response.blog);
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
      {/* Global Loader */}
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
            {/* Header */}
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

            {/* Body */}
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
                                Short Description
                              </label>
                              <input
                                type="text"
                                name="excerpt"
                                className="form-control"
                                placeholder="Brief summary (optional)"
                                value={form.excerpt}
                                onChange={handleChange}
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="mb-4">
                            <label className="form-label fw-semibold">
                              Content *
                            </label>
                            <div className="border rounded p-2">
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
                                Image
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
                              />
                              <small className="text-muted">
                                Supported: JPG, PNG, WEBP (max 5 MB)
                              </small>
                            </div>

                            {/* Post Status */}
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
                                <option value="published">Save & Publish</option>
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
