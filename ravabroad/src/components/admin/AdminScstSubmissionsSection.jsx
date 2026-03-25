import React from "react";

export default function AdminScstSubmissionsSection({
  submissions,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onView,
  onReply,
  onDelete,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">SC/ST Connect Submissions</h5>
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
              <th>Country</th>
              <th>City</th>
              <th>Platform</th>
              <th>Phone</th>
              <th>Created</th>
              <th>Data</th>
              <th>Reply</th>
              <th>Status</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center text-muted py-4">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(submission.id)}
                      onChange={(e) =>
                        onToggleSelect(submission.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{submission.id}</td>
                  <td>{submission.name}</td>
                  <td>{submission.email}</td>
                  <td>{submission.country}</td>
                  <td>{submission.city || "-"}</td>
                  <td>{submission.platform || "-"}</td>
                  <td>{submission.phone || "-"}</td>
                  <td>{new Date(submission.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => onView(submission)}
                    >
                      View All
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => onReply(submission)}
                    >
                      Reply
                    </button>
                  </td>
                  <td>
                    {submission.replied ? (
                      <span
                        className="badge bg-success"
                        title={`Replied on ${new Date(
                          submission.replied_at
                        ).toLocaleString()}`}
                      >
                        Replied -{" "}
                        {new Date(submission.replied_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}{" "}
                        at{" "}
                        {new Date(submission.replied_at).toLocaleTimeString(
                          undefined,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    ) : (
                      <span className="badge bg-warning text-dark">Pending</span>
                    )}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(submission.id);
                      }}
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
