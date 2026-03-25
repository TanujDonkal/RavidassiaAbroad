import React from "react";

export default function AdminMatrimonialSection({
  matrimonialSubs,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onView,
  onDownloadInstagramCard,
  onDelete,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Matrimonial Submissions</h5>
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
              <th>Created</th>
              <th>Data</th>
              <th>Download Data</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {matrimonialSubs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              matrimonialSubs.map((submission) => (
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
                  <td>{submission.country_living}</td>
                  <td>{submission.city_living}</td>
                  <td>{new Date(submission.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => onView(submission)}
                    >
                      View All
                    </button>
                  </td>
                  <td className="d-flex gap-2">
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Download for Instagram
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              onDownloadInstagramCard(submission, "post")
                            }
                          >
                            Instagram Post (1:1)
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              onDownloadInstagramCard(submission, "reel")
                            }
                          >
                            Instagram Reel (9:16)
                          </button>
                        </li>
                      </ul>
                    </div>
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
