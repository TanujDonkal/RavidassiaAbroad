import React from "react";

export default function AdminTemplesSection({
  temples,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onNew,
  onEdit,
  onDelete,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Global Temples</h5>
        {selectedIds.length > 0 ? (
          <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>
            Delete Selected ({selectedIds.length})
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onNew}>
            + Add Temple
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-nowrap">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Temple</th>
              <th>Country</th>
              <th>City</th>
              <th>Featured</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {temples.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  No temples yet.
                </td>
              </tr>
            ) : (
              temples.map((temple) => (
                <tr key={temple.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(temple.id)}
                      onChange={(e) => onToggleSelect(temple.id, e.target.checked)}
                    />
                  </td>
                  <td>{temple.id}</td>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      {temple.image_url ? (
                        <img
                          src={temple.image_url}
                          alt={temple.name}
                          width="56"
                          height="56"
                          className="rounded"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded bg-light d-flex align-items-center justify-content-center text-muted"
                          style={{ width: 56, height: 56 }}
                        >
                          <i className="bi bi-building"></i>
                        </div>
                      )}
                      <div>
                        <div className="fw-semibold">{temple.name}</div>
                        <div className="text-muted small">
                          {temple.location_label || temple.address || "Location details pending"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{temple.country}</td>
                  <td>{temple.city}</td>
                  <td>
                    {temple.featured ? (
                      <span className="badge bg-success-subtle text-success">Featured</span>
                    ) : (
                      <span className="badge bg-light text-muted">Standard</span>
                    )}
                  </td>
                  <td>{temple.display_order ?? 0}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => onEdit(temple)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(temple.id)}
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
    </div>
  );
}
