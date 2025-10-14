// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { updateUserRole } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { getRecipients, createUser, apiFetch } from "../utils/api";
import "../css/webpixels.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]); // SC/ST
  const [recipients, setRecipients] = useState([]);
  const [matrimonialSubs, setMatrimonialSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const popup = usePopup();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // --------------------------
  // FETCH DATA
  // --------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // USERS
        if (activeTab === "users" || activeTab === "dashboard") {
          const usersRes = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/users`,
            { headers }
          );
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        // SC/ST SUBMISSIONS
        if (activeTab === "submissions" || activeTab === "dashboard") {
          const subsRes = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/scst-submissions`,
            { headers }
          );
          const subsData = await subsRes.json();
          setSubmissions(Array.isArray(subsData) ? subsData : []);
        }

        // MATRIMONIAL SUBMISSIONS
        if (activeTab === "matrimonial" || activeTab === "dashboard") {
          const matrRes = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/matrimonial`,
            { headers }
          );
          const matrData = await matrRes.json();
          setMatrimonialSubs(Array.isArray(matrData) ? matrData : []);
        }

        // RECIPIENTS
        if (activeTab === "recipients") {
          const recData = await getRecipients();
          setRecipients(Array.isArray(recData) ? recData : []);
        }

        if (activeTab === "contentRequests") {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/content-requests`,
            { headers }
          );
          const data = await res.json();
          setSubmissions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // --------------------------
  // HANDLERS
  // --------------------------
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      popup.open({
        title: "✅ Success",
        message: `User role changed to ${newRole}`,
        type: "success",
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      popup.open({
        title: "❌ Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleOpenModal = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
  };

  // --------------------------
  // DELETE HANDLERS
  // --------------------------
  const handleDelete = async (type, id) => {
    popup.open({
      title: "⚠️ Confirm",
      message: "Are you sure you want to delete this entry?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });

          if (type === "scst-submissions") {
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
          } else if (type === "matrimonial") {
            setMatrimonialSubs((prev) => prev.filter((s) => s.id !== id));
          } else if (type === "content-requests") {
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
          }

          setSelectedIds((prev) => prev.filter((i) => i !== id));
          popup.open({
            title: "🗑️ Deleted",
            message: "The entry has been deleted successfully.",
            type: "success",
          });
        } catch (err) {
          popup.open({
            title: "❌ Error",
            message: "Failed to delete this entry.",
            type: "error",
          });
        }
      },
    });
  };

  // DELETE MULTIPLE RECORDS
  const handleBulkDelete = async (type) => {
    if (selectedIds.length === 0) {
      popup.open({
        title: "⚠️ No Selection",
        message: "Please select at least one entry to delete.",
        type: "warning",
      });
      return;
    }

    popup.open({
      title: "⚠️ Confirm Deletion",
      message: `Are you sure you want to delete ${selectedIds.length} selected entries?`,
      type: "confirm",
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedIds.map((id) =>
              apiFetch(`/admin/${type}/${id}`, { method: "DELETE" }).catch(
                () => null
              )
            )
          );

          if (type === "scst-submissions") {
            setSubmissions((prev) =>
              prev.filter((s) => !selectedIds.includes(s.id))
            );
          } else if (type === "matrimonial") {
            setMatrimonialSubs((prev) =>
              prev.filter((s) => !selectedIds.includes(s.id))
            );
          } else if (type === "content-requests") {
            setSubmissions((prev) =>
              prev.filter((s) => !selectedIds.includes(s.id))
            );
          }

          setSelectedIds([]);
          setSelectAll(false);
          popup.open({
            title: "✅ Success",
            message: "Selected entries deleted successfully.",
            type: "success",
          });
        } catch (err) {
          popup.open({
            title: "❌ Error",
            message: "Some deletions failed. Check console for details.",
            type: "error",
          });
        }
      },
    });
  };

  // --------------------------
  // STATS
  // --------------------------
  const stats = [
    {
      label: "Total Users",
      value: users.length || 0,
      icon: "bi-people",
      color: "bg-primary",
    },
    {
      label: "SC/ST Submissions",
      value: submissions.length || 0,
      icon: "bi-file-earmark-text",
      color: "bg-info",
    },
    {
      label: "Recipients",
      value: recipients.length || 0,
      icon: "bi-envelope",
      color: "bg-success",
    },
    {
      label: "Matrimonial Entries",
      value: matrimonialSubs.length || 0,
      icon: "bi-heart",
      color: "bg-danger",
    },
  ];
  return (
    <div className="d-flex flex-column flex-lg-row h-lg-full bg-surface-secondary">
      {/* Sidebar */}
      <nav className="navbar show navbar-vertical h-lg-screen navbar-expand-lg px-0 py-3 navbar-light bg-white border-end-lg">
        <div className="container-fluid">
          <div className="collapse navbar-collapse show" id="sidebarCollapse">
            <ul className="navbar-nav">
              {[
                { tab: "dashboard", icon: "bi-house", label: "Dashboard" },
                { tab: "users", icon: "bi-people", label: "Users" },
                {
                  tab: "submissions",
                  icon: "bi-file-earmark-text",
                  label: "SC/ST Submissions",
                },
                { tab: "recipients", icon: "bi-envelope", label: "Recipients" },
                { tab: "matrimonial", icon: "bi-heart", label: "Matrimonial" },
                {
                  tab: "contentRequests",
                  icon: "bi-flag",
                  label: "Content Requests",
                },
              ].map((item) => (
                <li className="nav-item" key={item.tab}>
                  <a
                    href="#!"
                    className={`nav-link ${
                      activeTab === item.tab ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(item.tab)}
                  >
                    <i className={`bi ${item.icon}`}></i> {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="h-screen flex-grow-1 overflow-y-lg-auto">
        <header className="bg-surface-primary border-bottom pt-6 pb-4 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h3 mb-0 text-capitalize">{activeTab}</h1>
          </div>
        </header>

        <main className="py-6 bg-surface-secondary">
          <div className="container-fluid px-4">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                {/* Dashboard */}
                {activeTab === "dashboard" && (
                  <div className="row g-4 mb-5">
                    {stats.map((s, i) => (
                      <div key={i} className="col-xl-3 col-sm-6">
                        <div className="card shadow border-0">
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="text-muted text-uppercase mb-2">
                                  {s.label}
                                </h6>
                                <h3 className="mb-0 fw-bold">{s.value}</h3>
                              </div>
                              <div
                                className={`icon icon-shape text-white text-lg rounded-circle ${s.color}`}
                              >
                                <i className={s.icon}></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* USERS */}
                {activeTab === "users" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header">
                      <h5 className="mb-0">Users</h5>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center text-muted py-4"
                              >
                                No users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                  <select
                                    value={u.role}
                                    className="form-select form-select-sm"
                                    onChange={(e) =>
                                      handleRoleChange(u.id, e.target.value)
                                    }
                                    disabled={currentUser.role !== "main_admin"}
                                  >
                                    <option value="user">User</option>
                                    <option value="moderate_admin">
                                      Moderate Admin
                                    </option>
                                    <option value="main_admin">
                                      Main Admin
                                    </option>
                                  </select>
                                </td>
                                <td>
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SC/ST SUBMISSIONS */}
                {activeTab === "submissions" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">SC/ST Connect Submissions</h5>
                      {selectedIds.length > 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleBulkDelete("scst-submissions")}
                        >
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
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectAll(checked);
                                  setSelectedIds(
                                    checked ? submissions.map((s) => s.id) : []
                                  );
                                }}
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
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.length === 0 ? (
                            <tr>
                              <td
                                colSpan="10"
                                className="text-center text-muted py-4"
                              >
                                No submissions yet.
                              </td>
                            </tr>
                          ) : (
                            submissions.map((s) => (
                              <tr key={s.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(s.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedIds((prev) =>
                                        checked
                                          ? [...prev, s.id]
                                          : prev.filter((id) => id !== s.id)
                                      );
                                    }}
                                  />
                                </td>
                                <td>{s.id}</td>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>{s.country}</td>
                                <td>{s.city || "-"}</td>
                                <td>{s.platform || "-"}</td>
                                <td>{s.phone || "-"}</td>
                                <td>
                                  {new Date(s.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete("scst-submissions", s.id);
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
                )}

                {/* MATRIMONIAL */}
                {activeTab === "matrimonial" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Matrimonial Submissions</h5>
                      {selectedIds.length > 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleBulkDelete("matrimonial")}
                        >
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
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectAll(checked);
                                  setSelectedIds(
                                    checked
                                      ? matrimonialSubs.map((s) => s.id)
                                      : []
                                  );
                                }}
                              />
                            </th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Country</th>
                            <th>City</th>
                            <th>Created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrimonialSubs.length === 0 ? (
                            <tr>
                              <td
                                colSpan="8"
                                className="text-center text-muted py-4"
                              >
                                No submissions yet.
                              </td>
                            </tr>
                          ) : (
                            matrimonialSubs.map((s) => (
                              <tr key={s.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(s.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedIds((prev) =>
                                        checked
                                          ? [...prev, s.id]
                                          : prev.filter((id) => id !== s.id)
                                      );
                                    }}
                                  />
                                </td>
                                <td>{s.id}</td>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>{s.country_living}</td>
                                <td>{s.city_living}</td>
                                <td>
                                  {new Date(s.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (
                                        window.confirm("Delete this entry?")
                                      ) {
                                        await handleDelete("matrimonial", s.id);
                                      }
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
                )}

                {/* RECIPIENTS */}
                {activeTab === "recipients" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Notification Recipients</h5>
                      <form
                        className="d-flex align-items-center gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const email = e.target.email.value.trim();
                          if (!email) return;
                          try {
                            await apiFetch("/admin/recipients", {
                              method: "POST",
                              body: JSON.stringify({ email }),
                            });
                            popup.open({
                              title: "✅ Added",
                              message: `${email} will now receive notifications`,
                              type: "success",
                            });
                            e.target.reset();
                            const data = await getRecipients();
                            setRecipients(Array.isArray(data) ? data : []);
                          } catch (err) {
                            popup.open({
                              title: "❌ Error",
                              message: err.message,
                              type: "error",
                            });
                          }
                        }}
                      >
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter email"
                          className="form-control form-control-sm"
                          style={{ width: 250 }}
                          required
                        />
                        <button
                          type="submit"
                          className="btn btn-sm btn-primary"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Added</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipients.length === 0 ? (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted py-4"
                              >
                                No recipient emails added yet.
                              </td>
                            </tr>
                          ) : (
                            recipients.map((r) => (
                              <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.email}</td>
                                <td>
                                  {new Date(r.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={async () => {
                                      if (
                                        window.confirm(`Remove ${r.email}?`)
                                      ) {
                                        await apiFetch(
                                          `/admin/recipients/${r.id}`,
                                          {
                                            method: "DELETE",
                                          }
                                        );
                                        setRecipients((prev) =>
                                          prev.filter((x) => x.id !== r.id)
                                        );
                                        popup.open({
                                          title: "🗑️ Removed",
                                          message: `${r.email} will no longer receive alerts`,
                                          type: "success",
                                        });
                                      }
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
                )}

                {activeTab === "contentRequests" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        Add / Remove / Report Content Requests
                      </h5>
                      {selectedIds.length > 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleBulkDelete("content-requests")}
                        >
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
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectAll(checked);
                                  setSelectedIds(
                                    checked ? submissions.map((r) => r.id) : []
                                  );
                                }}
                              />
                            </th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Content URL</th>
                            <th>Details</th>
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
                          ) : submissions.length === 0 ? (
                            <tr>
                              <td
                                colSpan="9"
                                className="text-center text-muted py-4"
                              >
                                No content requests yet.
                              </td>
                            </tr>
                          ) : (
                            submissions.map((r) => (
                              <tr key={r.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(r.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedIds((prev) =>
                                        checked
                                          ? [...prev, r.id]
                                          : prev.filter((id) => id !== r.id)
                                      );
                                    }}
                                  />
                                </td>
                                <td>{r.id}</td>
                                <td>{r.name}</td>
                                <td>{r.email}</td>
                                <td>{r.request_type}</td>
                                <td>
                                  <a
                                    href={r.content_url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {r.content_url}
                                  </a>
                                </td>
                                <td
                                  className="text-wrap"
                                  style={{ maxWidth: 300 }}
                                >
                                  {r.details}
                                </td>
                                <td>
                                  {new Date(r.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete("content-requests", r.id);
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
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* DETAILS MODAL */}
      {showModal && selectedSubmission && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">
                  Submission Details – {selectedSubmission.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {activeTab === "submissions" ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Email:</strong> {selectedSubmission.email}
                    </div>
                    <div className="col-md-6">
                      <strong>Country:</strong> {selectedSubmission.country}
                    </div>
                    <div className="col-md-6">
                      <strong>City:</strong> {selectedSubmission.city || "-"}
                    </div>
                    <div className="col-md-6">
                      <strong>Phone:</strong> {selectedSubmission.phone || "-"}
                    </div>
                    <div className="col-md-6">
                      <strong>Platform:</strong>{" "}
                      {selectedSubmission.platform || "-"}
                    </div>
                    <div className="col-md-6">
                      <strong>Instagram:</strong>{" "}
                      {selectedSubmission.instagram || "-"}
                    </div>
                    <div className="col-md-12">
                      <strong>Proof:</strong> {selectedSubmission.proof || "-"}
                    </div>
                    <div className="col-md-12">
                      <strong>Message:</strong>{" "}
                      <pre className="mb-0">
                        {selectedSubmission.message || "-"}
                      </pre>
                    </div>
                    <hr />
                    <div className="col-md-12 text-muted small">
                      Submitted on{" "}
                      {new Date(selectedSubmission.created_at).toLocaleString()}
                      {selectedSubmission.user_name && (
                        <>
                          <br />
                          Linked User:{" "}
                          <strong>{selectedSubmission.user_name}</strong> (
                          {selectedSubmission.user_email})
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>No details available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
