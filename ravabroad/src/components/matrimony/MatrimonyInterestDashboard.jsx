import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { usePopup } from "../PopupProvider";

async function loadDashboardData() {
  const [sent, received, sentRequests, receivedRequests] = await Promise.all([
    apiFetch("/matrimonial/interests/sent"),
    apiFetch("/matrimonial/interests/received"),
    apiFetch("/matrimonial/contact-requests/sent"),
    apiFetch("/matrimonial/contact-requests/received"),
  ]);

  return {
    sent: sent.interests || [],
    received: received.interests || [],
    sentRequests: sentRequests.requests || [],
    receivedRequests: receivedRequests.requests || [],
  };
}

export default function MatrimonyInterestDashboard() {
  const popup = usePopup();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sent: [],
    received: [],
    sentRequests: [],
    receivedRequests: [],
  });

  const refresh = async () => {
    setLoading(true);
    try {
      setData(await loadDashboardData());
    } catch (err) {
      popup.open({
        title: "Could Not Load Matrimony Activity",
        message: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateInterestStatus = async (interestId, status) => {
    try {
      await apiFetch(`/matrimonial/interests/${interestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (err) {
      popup.open({
        title: "Action Failed",
        message: err.message,
        type: "error",
      });
    }
  };

  const updateContactRequestStatus = async (requestId, status) => {
    try {
      await apiFetch(`/matrimonial/contact-requests/${requestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (err) {
      popup.open({
        title: "Action Failed",
        message: err.message,
        type: "error",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-muted py-4">Loading matrimony activity...</div>;
  }

  return (
    <div className="mt-4">
      <div className="row g-4">
        <div className="col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="mb-3">Received Interests</h5>
              {data.received.length === 0 ? (
                <p className="text-muted mb-0">No interests received yet.</p>
              ) : (
                data.received.map((item) => (
                  <div key={item.id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{item.sender_name}</div>
                        <div className="small text-muted">{item.sender_email || "Registered user"}</div>
                      </div>
                      <span className="badge text-bg-light text-capitalize">{item.status}</span>
                    </div>
                    {item.status === "pending" && (
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                          className="btn btn-sm btn-success rounded-pill"
                          onClick={() => updateInterestStatus(item.id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill"
                          onClick={() => updateInterestStatus(item.id, "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-sm btn-outline-dark rounded-pill"
                          onClick={() => updateInterestStatus(item.id, "blocked")}
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="mb-3">Sent Interests</h5>
              {data.sent.length === 0 ? (
                <p className="text-muted mb-0">You have not sent any interests yet.</p>
              ) : (
                data.sent.map((item) => (
                  <div key={item.id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{item.receiver_profile.display_name}</div>
                        <div className="small text-muted">
                          {[item.receiver_profile.city, item.receiver_profile.country]
                            .filter(Boolean)
                            .join(", ") || "Public listing"}
                        </div>
                      </div>
                      <span className="badge text-bg-light text-capitalize">{item.status}</span>
                    </div>
                    {item.contact_request_status && (
                      <div className="small text-muted mt-2">
                        Contact request: {item.contact_request_status}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="mb-3">Received Contact Requests</h5>
              {data.receivedRequests.length === 0 ? (
                <p className="text-muted mb-0">No contact requests received yet.</p>
              ) : (
                data.receivedRequests.map((item) => (
                  <div key={item.id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{item.requester_name}</div>
                        <div className="small text-muted">{item.requester_email}</div>
                      </div>
                      <span className="badge text-bg-light text-capitalize">{item.status}</span>
                    </div>
                    {item.status === "pending" && (
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                          className="btn btn-sm btn-success rounded-pill"
                          onClick={() => updateContactRequestStatus(item.id, "approved")}
                        >
                          Approve Contact
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill"
                          onClick={() => updateContactRequestStatus(item.id, "declined")}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="mb-3">Sent Contact Requests</h5>
              {data.sentRequests.length === 0 ? (
                <p className="text-muted mb-0">You have not requested contact details yet.</p>
              ) : (
                data.sentRequests.map((item) => (
                  <div key={item.id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{item.owner_profile.display_name}</div>
                        <div className="small text-muted">
                          {[item.owner_profile.city, item.owner_profile.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                      <span className="badge text-bg-light text-capitalize">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
