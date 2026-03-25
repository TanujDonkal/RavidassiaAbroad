import React from "react";

export default function AdminRecipientsSection({
  recipients,
  selectedIds,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onAddRecipient,
  onDeleteRecipient,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Notification Recipients</h5>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-danger btn-sm"
            disabled={selectedIds.length === 0}
            onClick={onBulkDelete}
          >
            Delete Selected ({selectedIds.length})
          </button>
          <form className="d-flex align-items-center gap-2" onSubmit={onAddRecipient}>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              className="form-control form-control-sm"
              style={{ width: 250 }}
              required
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Add
            </button>
          </form>
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
                    recipients.length > 0 &&
                    recipients.every((r) => selectedIds.includes(r.id))
                  }
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Email</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  No recipient emails added yet.
                </td>
              </tr>
            ) : (
              recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(recipient.id)}
                      onChange={(e) =>
                        onToggleSelect(recipient.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{recipient.id}</td>
                  <td>{recipient.email}</td>
                  <td>{new Date(recipient.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        onDeleteRecipient(recipient.id, recipient.email)
                      }
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
