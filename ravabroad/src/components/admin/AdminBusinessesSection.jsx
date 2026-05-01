import React, { Suspense, lazy, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";
import { usePopup } from "../PopupProvider";

const BusinessFormModal = lazy(() => import("../BusinessFormModal"));

export default function AdminBusinessesSection({ businesses, onRefresh, onDelete }) {
  const popup = usePopup();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesStatus = status === "all" ? true : business.status === status;
      const haystack = [
        business.name,
        business.category,
        business.city,
        business.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [businesses, search, status]);

  const handleQuickUpdate = async (businessId, payload, successMessage) => {
    setBusyId(businessId);
    try {
      await apiFetch(`/admin/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      popup.open({
        title: "Updated",
        message: successMessage,
        type: "success",
      });
      await onRefresh?.();
    } catch (err) {
      popup.open({
        title: "Error",
        message: err.message || "Unable to update business listing.",
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (business, nextStatus) => {
    setBusyId(business.id);
    try {
      await apiFetch(`/admin/businesses/${business.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      popup.open({
        title: "Updated",
        message: `${business.name} marked as ${nextStatus}.`,
        type: "success",
      });
      await onRefresh?.();
    } catch (err) {
      popup.open({
        title: "Error",
        message: err.message || "Unable to update status.",
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="card shadow border-0 mb-7">
        <div className="card-header d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
          <div>
            <h5 className="mb-1">Business Listings</h5>
            <p className="mb-0 text-muted small">
              Review submissions, control visibility, and manage featured directory listings.
            </p>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control"
              style={{ minWidth: "220px" }}
              placeholder="Search by name, city, category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="form-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-nowrap mb-0">
            <thead className="thead-light">
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Listing</th>
                <th>Badges</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    No business listings match the current filters.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 border bg-light d-flex align-items-center justify-content-center overflow-hidden"
                          style={{ width: "56px", height: "56px" }}
                        >
                          {business.logo_url || business.image_url ? (
                            <img
                              src={business.logo_url || business.image_url}
                              alt={business.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <i className="bi bi-shop fs-4 text-warning"></i>
                          )}
                        </div>
                        <div>
                          <div className="fw-semibold">{business.name}</div>
                          <div className="text-muted small">{business.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{business.city}, {business.country}</td>
                    <td>
                      <span className={`badge text-bg-${
                        business.status === "approved"
                          ? "success"
                          : business.status === "pending"
                          ? "warning"
                          : business.status === "hidden"
                          ? "secondary"
                          : "danger"
                      }`}>
                        {business.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={business.listing_type || "free"}
                        disabled={busyId === business.id}
                        onChange={(event) =>
                          handleQuickUpdate(
                            business.id,
                            {
                              ...business,
                              listing_type: event.target.value,
                            },
                            "Listing type updated."
                          )
                        }
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="featured">Featured</option>
                      </select>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm ${business.is_featured ? "btn-warning" : "btn-outline-warning"}`}
                          disabled={busyId === business.id}
                          onClick={() =>
                            handleQuickUpdate(
                              business.id,
                              {
                                ...business,
                                is_featured: !business.is_featured,
                              },
                              business.is_featured ? "Featured badge removed." : "Business featured."
                            )
                          }
                        >
                          Featured
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${business.is_verified ? "btn-dark" : "btn-outline-dark"}`}
                          disabled={busyId === business.id}
                          onClick={() =>
                            handleQuickUpdate(
                              business.id,
                              {
                                ...business,
                                is_verified: !business.is_verified,
                              },
                              business.is_verified ? "Verified badge removed." : "Business verified."
                            )
                          }
                        >
                          Verified
                        </button>
                      </div>
                    </td>
                    <td>{new Date(business.created_at).toLocaleDateString()}</td>
                    <td className="text-end">
                      <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                        {business.status !== "approved" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            disabled={busyId === business.id}
                            onClick={() => handleStatusChange(business, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {business.status !== "rejected" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={busyId === business.id}
                            onClick={() => handleStatusChange(business, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditingBusiness(business)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => onDelete?.("businesses", business.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingBusiness && (
        <Suspense fallback={<div className="text-center py-4">Loading editor...</div>}>
          <BusinessFormModal
            business={editingBusiness}
            onClose={() => setEditingBusiness(null)}
            onSubmit={onRefresh}
          />
        </Suspense>
      )}
    </>
  );
}
