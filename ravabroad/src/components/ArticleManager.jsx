import React, { useState, useEffect } from "react";
import { apiFetch, API_BASE } from "../utils/api";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { usePopup } from "../components/PopupProvider";
import GlobalLoader from "../components/GlobalLoader";

export default function ArticleManager() {
  const popup = usePopup();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    title: "", 
    slug: "",
    image_url: "",
    content: "",
  });
  const [uploading, setUploading] = useState(false);

  // 🧠 Fetch all articles
  const fetchArticles = async () => {
    try {
      const res = await apiFetch("/admin/articles");
      setArticles(res);
    } catch (err) {
      console.error("Failed to fetch articles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // 🖼 Handle image upload
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/blogs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((f) => ({ ...f, image_url: data.image_url }));
      popup.open({
        title: "✅ Uploaded",
        message: "Image uploaded successfully!",
        type: "success",
      });
    } catch (err) {
      popup.open({
        title: "❌ Upload Failed",
        message: err.message,
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  // 🧾 Handle save
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (selected) {
        await apiFetch(`/admin/articles/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        popup.open({ title: "✅ Updated", message: "Article updated successfully!", type: "success" });
      } else {
        await apiFetch("/admin/articles", {
          method: "POST",
          body: JSON.stringify(body),
        });
        popup.open({ title: "✅ Created", message: "Article added successfully!", type: "success" });
      }
      setShowModal(false);
      setSelected(null);
      fetchArticles();
    } catch (err) {
      popup.open({ title: "❌ Error", message: err.message, type: "error" });
    }
  };

  // 🗑 Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await apiFetch(`/admin/articles/${id}`, { method: "DELETE" });
      popup.open({ title: "🗑️ Deleted", message: "Article removed successfully!", type: "success" });
      fetchArticles();
    } catch (err) {
      popup.open({ title: "❌ Delete Failed", message: err.message, type: "error" });
    }
  };

  const openEdit = (article) => {
    setSelected(article);
    setForm({
      title: article.title,
      slug: article.slug,
      image_url: article.image_url || "",
      content: article.content || "",
    });
    setShowModal(true);
  };

  const openNew = () => {
    setSelected(null);
    setForm({ title: "", slug: "", image_url: "", content: "" });
    setShowModal(true);
  };

  if (loading) return <GlobalLoader visible={true} />;

  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">📖 Articles</h5>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          + New Article
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-nowrap align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No articles yet.
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.title}</td>
                  <td>{a.slug}</td>
                  <td>{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button className="btn btn-warning btn-sm me-2" onClick={() => openEdit(a)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-light border-0">
                <h5 className="modal-title fw-semibold text-primary">
                  {selected ? "✏️ Edit Article" : "➕ New Article"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body bg-light py-3">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Slug (URL)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      required
                      placeholder="e.g. guru-ravidass"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Featured Image</label>
                    {form.image_url && (
                      <div className="text-center mb-2">
                        <img
                          src={form.image_url}
                          alt="Preview"
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: "180px" }}
                        />
                      </div>
                    )}
                    <input type="file" className="form-control" onChange={handleFile} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Content</label>
                    <CKEditor
                      editor={ClassicEditor}
                      data={form.content}
                      onChange={(_, editor) =>
                        setForm({ ...form, content: editor.getData() })
                      }
                    />
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="submit"
                      className="btn btn-success px-5 me-2"
                      disabled={uploading}
                    >
                      {uploading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-5"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
