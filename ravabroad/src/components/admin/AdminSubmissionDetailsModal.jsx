import React from "react";

export default function AdminSubmissionDetailsModal({
  show,
  submission,
  activeTab,
  onClose,
}) {
  if (!show || !submission) return null;

  const renderCellValue = (key, value) => {
    if (key.includes("photo") && value) {
      return (
        <img
          src={value}
          alt="profile"
          className="rounded-circle"
          width="60"
          height="60"
        />
      );
    }

    return value || "—";
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title">
              Submission Details – {submission.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {activeTab === "submissions" && (
              <table className="table table-striped small">
                <tbody>
                  {Object.entries(submission).map(([key, value]) => (
                    <tr key={key}>
                      <th className="text-capitalize" style={{ width: "40%" }}>
                        {key.replaceAll("_", " ")}
                      </th>
                      <td>{renderCellValue(key, value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "matrimonial" && (
              <div>
                <div className="text-center mb-3">
                  <img
                    src={submission.photo_url || "/template/img/no-photo.svg"}
                    alt="profile"
                    className="rounded-circle shadow-sm"
                    width="100"
                    height="100"
                  />
                </div>
                <table className="table table-striped small">
                  <tbody>
                    {Object.entries(submission).map(([key, value]) => (
                      <tr key={key}>
                        <th className="text-capitalize" style={{ width: "40%" }}>
                          {key.replaceAll("_", " ")}
                        </th>
                        <td>{value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
