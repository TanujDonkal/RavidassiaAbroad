import React from "react";

export default function AdminPrivacyRequestsSection({
  loading,
  requests,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onResolve,
  onDelete,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Privacy / Data Requests</h5>
        {selectedIds.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>
            Delete Selected ({selectedIds.length})
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
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Message</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">
                  No privacy requests yet.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(request.id)}
                      onChange={(e) => onToggleSelect(request.id, e.target.checked)}
                    />
                  </td>
                  <td>{request.id}</td>
                  <td>{request.name}</td>
                  <td>{request.email}</td>
                  <td>{request.request_type}</td>
                  <td>
                    <span className="badge bg-secondary text-uppercase">
                      {request.status || "open"}
                    </span>
                  </td>
                  <td className="text-wrap" style={{ maxWidth: 320 }}>
                    {request.message}
                  </td>
                  <td>{new Date(request.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => onResolve(request)}
                    >
                      Resolve
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(request.id)}
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
