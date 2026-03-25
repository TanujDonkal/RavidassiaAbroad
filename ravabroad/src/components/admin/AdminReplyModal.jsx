import React from "react";

export default function AdminReplyModal({
  replyTarget,
  replyForm,
  onChange,
  onClose,
  onSend,
}) {
  if (!replyTarget) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reply to {replyTarget.name}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Email:</strong> {replyTarget.email}
            </p>
            <p>
              <strong>Country:</strong> {replyTarget.country}
            </p>

            <label className="form-label">WhatsApp Group Link</label>
            <input
              type="text"
              className="form-control mb-3"
              value={replyForm.groupLink}
              onChange={(e) => onChange("groupLink", e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
            />

            <label className="form-label">Group Rules</label>
            <textarea
              className="form-control"
              rows={4}
              value={replyForm.rules}
              onChange={(e) => onChange("rules", e.target.value)}
            ></textarea>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onSend}>
              Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
