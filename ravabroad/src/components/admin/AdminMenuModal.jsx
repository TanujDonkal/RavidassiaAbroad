import React from "react";

export default function AdminMenuModal({
  menu,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!menu) return null;

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={onSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{menu.id ? "Edit Menu" : "New Menu"}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Label</label>
                <input
                  type="text"
                  className="form-control"
                  value={menu.label}
                  onChange={(e) => onChange("label", e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Path</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="/connect-canada"
                  value={menu.path}
                  onChange={(e) => onChange("path", e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Parent ID (optional)</label>
                <input
                  type="number"
                  className="form-control"
                  value={menu.parent_id || ""}
                  onChange={(e) => onChange("parent_id", e.target.value || null)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Position (order)</label>
                <input
                  type="number"
                  className="form-control"
                  value={menu.position}
                  onChange={(e) => onChange("position", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
