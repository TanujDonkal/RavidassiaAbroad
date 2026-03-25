import React from "react";
import BlogFormModal from "../BlogFormModal";

export default function AdminBlogsSection({
  blogs,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onNew,
  onEdit,
  onDelete,
  showBlogModal,
  selectedBlog,
  onCloseModal,
  onSubmitModal,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Blog Posts</h5>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-danger btn-sm"
            disabled={selectedIds.length === 0}
            onClick={onBulkDelete}
          >
            Delete Selected ({selectedIds.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={onNew}>
            + New Post
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-nowrap">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll && blogs.length > 0 && blogs.every((b) => selectedIds.includes(b.id))}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Views</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No blog posts yet.
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(blog.id)}
                      onChange={(e) => onToggleSelect(blog.id, e.target.checked)}
                    />
                  </td>
                  <td>{blog.id}</td>
                  <td>{blog.title}</td>
                  <td>{blog.category_name || "—"}</td>
                  <td>{blog.views}</td>
                  <td>{blog.status}</td>
                  <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => onEdit(blog)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(blog.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBlogModal && (
        <BlogFormModal
          blog={selectedBlog}
          onClose={onCloseModal}
          onSubmit={onSubmitModal}
        />
      )}
    </div>
  );
}
