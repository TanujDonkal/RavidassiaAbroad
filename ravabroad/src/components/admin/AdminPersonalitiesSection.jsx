import React from "react";

export default function AdminPersonalitiesSection({
  personalities,
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
        <h5 className="mb-0">Famous Personalities</h5>
        {selectedIds.length > 0 ? (
          <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>
            Delete Selected ({selectedIds.length})
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onNew}>
            + Add Personality
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
              <th>Photo</th>
              <th>Name</th>
              <th>Caste</th>
              <th>Region</th>
              <th>Category</th>
              <th>SC/ST</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {personalities.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  No personalities yet.
                </td>
              </tr>
            ) : (
              personalities.map((personality) => (
                <tr key={personality.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(personality.id)}
                      onChange={(e) =>
                        onToggleSelect(personality.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{personality.id}</td>
                  <td>
                    {personality.photo_url ? (
                      <img
                        src={personality.photo_url}
                        alt={personality.name}
                        className="rounded-circle"
                        width="50"
                        height="50"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{personality.name}</td>
                  <td>{personality.caste}</td>
                  <td>{personality.region}</td>
                  <td>{personality.category}</td>
                  <td>{personality.sc_st_type}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => onEdit(personality)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(personality.id)}
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
