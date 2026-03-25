import React from "react";
import CategoryFormModal from "../CategoryFormModal";

export default function AdminCategoriesSection({
  categories,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onNew,
  onEdit,
  onDelete,
  showCategoryModal,
  selectedCategory,
  onCloseModal,
  onSubmitModal,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Blog Categories</h5>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-danger btn-sm"
            disabled={selectedIds.length === 0}
            onClick={onBulkDelete}
          >
            Delete Selected ({selectedIds.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={onNew}>
            + New Category
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
                  checked={
                    selectAll &&
                    categories.length > 0 &&
                    categories.every((c) => selectedIds.includes(c.id))
                  }
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={(e) =>
                        onToggleSelect(category.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.parent_id || "—"}</td>
                  <td>{category.description || "—"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => onEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(category.id)}
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

      {showCategoryModal && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={onCloseModal}
          onSubmit={onSubmitModal}
        />
      )}
    </div>
  );
}
