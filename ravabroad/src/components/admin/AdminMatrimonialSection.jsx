import React, { useEffect, useRef, useState } from "react";

export default function AdminMatrimonialSection({
  matrimonialSubs,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onView,
  onStatusChange,
  onDownloadInstagramCard,
  onDelete,
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sectionRef.current && !sectionRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusBadgeClass =
    {
      approved: "text-bg-success",
      pending: "text-bg-warning",
      rejected: "text-bg-danger",
      paused: "text-bg-secondary",
      hidden: "text-bg-dark",
      draft: "text-bg-light",
    };

  return (
    <div className="card shadow border-0 mb-7" ref={sectionRef}>
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
              <th>Review</th>
              <th>Data</th>
              <th>Download Data</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {matrimonialSubs.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center text-muted py-4">
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
                    <div className="d-flex flex-column gap-2">
                      <span
                        className={`badge ${
                          statusBadgeClass[submission.moderation_status || "pending"] ||
                          "text-bg-light"
                        } text-capitalize`}
                      >
                        {submission.moderation_status || "pending"}
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {(submission.moderation_status || "pending") !== "approved" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onStatusChange(submission.id, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {(submission.moderation_status || "pending") !== "paused" && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => onStatusChange(submission.id, "paused")}
                          >
                            Pause
                          </button>
                        )}
                        {(submission.moderation_status || "pending") !== "rejected" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onStatusChange(submission.id, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => onView(submission)}
                    >
                      View All
                    </button>
                  </td>
                  <td className="d-flex gap-2">
                    <div className="btn-group position-relative">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary dropdown-toggle"
                        aria-expanded={openDropdownId === submission.id}
                        onClick={() =>
                          setOpenDropdownId((current) =>
                            current === submission.id ? null : submission.id
                          )
                        }
                      >
                        Download for Instagram
                      </button>
                      <ul
                        className={`dropdown-menu${
                          openDropdownId === submission.id ? " show" : ""
                        }`}
                      >
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setOpenDropdownId(null);
                              onDownloadInstagramCard(submission, "post");
                            }}
                          >
                            Instagram Post (1:1)
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setOpenDropdownId(null);
                              onDownloadInstagramCard(submission, "reel");
                            }}
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
