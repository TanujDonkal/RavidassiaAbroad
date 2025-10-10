import React, { useEffect, useState } from "react";
import { updateUserRole } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import {
  approveSubmission,
  rejectSubmission,
  getRecipients,
  addRecipient,
  deleteRecipient,
} from "../utils/api";
import "../css/webpixels.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Dynamic users
        const usersRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/admin/users`,
          { headers }
        );
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Dynamic submissions
        const subsRes = await fetch(
  `${process.env.REACT_APP_API_URL}/api/admin/scst-submissions`,
  { headers }
);
const subsData = await subsRes.json();
setSubmissions(Array.isArray(subsData) ? subsData : []);


        // Dynamic recipients
        const recData = await getRecipients();
        setRecipients(Array.isArray(recData) ? recData : []);
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const popup = usePopup();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);

      popup.open({
        title: "✅ Success",
        message: `User role changed to ${newRole}`,
        type: "success",
      });

      // update users array locally
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

  // Dummy stats (replace later)
  const stats = [
    {
      label: "Total Users",
      value: users.length || 145,
      icon: "bi-people",
      color: "bg-primary",
    },
    {
      label: "Submissions",
      value: submissions.length || 67,
      icon: "bi-file-earmark-text",
      color: "bg-info",
    },
    {
      label: "Recipients",
      value: recipients.length || 32,
      icon: "bi-envelope",
      color: "bg-success",
    },
    {
      label: "Pending Approvals",
      value: Array.isArray(submissions)
        ? submissions.filter((s) => s.status === "pending").length
        : 0,
      icon: "bi-hourglass-split",
      color: "bg-warning",
    },
  ];

  return (
    <div className="d-flex flex-column flex-lg-row h-lg-full bg-surface-secondary">
      {/* Sidebar */}
      <nav className="navbar show navbar-vertical h-lg-screen navbar-expand-lg px-0 py-3 navbar-light bg-white border-end-lg">
        <div className="container-fluid">
          <div className="collapse navbar-collapse show" id="sidebarCollapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a
                  href="#!"
                  className={`nav-link ${
                    activeTab === "dashboard" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  <i className="bi bi-house"></i> Dashboard
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#!"
                  className={`nav-link ${
                    activeTab === "users" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("users")}
                >
                  <i className="bi bi-people"></i> Users
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#!"
                  className={`nav-link ${
                    activeTab === "submissions" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("submissions")}
                >
                  <i className="bi bi-file-earmark-text"></i> Submissions
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#!"
                  className={`nav-link ${
                    activeTab === "recipients" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("recipients")}
                >
                  <i className="bi bi-envelope"></i> Recipients
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="h-screen flex-grow-1 overflow-y-lg-auto">
        <header className="bg-surface-primary border-bottom pt-6 pb-4 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h3 mb-0">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <a href="#" className="btn btn-sm btn-primary">
              <i className="bi bi-plus pe-1"></i> Add New
            </a>
          </div>
        </header>

        <main className="py-6 bg-surface-secondary">
          <div className="container-fluid px-4">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                {/* Dashboard Overview */}
                {activeTab === "dashboard" && (
                  <>
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

                    <div className="card shadow border-0 mb-7">
                      <div className="card-header">
                        <h5 className="mb-0">Recent Submissions</h5>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover table-nowrap">
                          <thead className="thead-light">
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Country</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(submissions.length
                              ? submissions
                              : [
                                  {
                                    id: 1,
                                    name: "Tanuj Kumar",
                                    email: "tanuj@gmail.com",
                                    country: "Canada",
                                    status: "approved",
                                  },
                                  {
                                    id: 2,
                                    name: "Sanjeev Sharma",
                                    email: "sanjeev@gmail.com",
                                    country: "India",
                                    status: "pending",
                                  },
                                ]
                            ).map((s) => (
                              <tr key={s.id}>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>{s.country}</td>
                                <td>
                                  <span
                                    className={`badge bg-${
                                      s.status === "approved"
                                        ? "success"
                                        : s.status === "rejected"
                                        ? "danger"
                                        : "secondary"
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header">
                      <h5 className="mb-0">Users</h5>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead className="thead-light">
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
                                  {/* Role dropdown with colored badge */}
                                  <div className="d-flex align-items-center gap-2">
                                    <span
                                      className={`badge ${
                                        u.role === "main_admin"
                                          ? "bg-warning text-dark"
                                          : u.role === "moderate_admin"
                                          ? "bg-primary"
                                          : "bg-secondary"
                                      }`}
                                    >
                                      {u.role.replace("_", " ")}
                                    </span>

                                    <select
                                      value={u.role}
                                      className="form-select form-select-sm"
                                      onChange={(e) =>
                                        handleRoleChange(u.id, e.target.value)
                                      }
                                      disabled={
                                        currentUser.role !== "main_admin"
                                      } // only main admin can change
                                    >
                                      <option value="user">User</option>
                                      <option value="moderate_admin">
                                        Moderate Admin
                                      </option>
                                      <option value="main_admin">
                                        Main Admin
                                      </option>
                                    </select>
                                  </div>
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

                {/* Recipients Tab */}
                {activeTab === "recipients" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header">
                      <h5 className="mb-0">Notification Recipients</h5>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(recipients.length
                            ? recipients
                            : [
                                {
                                  id: 1,
                                  email: "info@ravidassiaabroad.com",
                                  created_at: "2025-10-08",
                                },
                                {
                                  id: 2,
                                  email: "contact@codezypher.com",
                                  created_at: "2025-10-07",
                                },
                              ]
                          ).map((r) => (
                            <tr key={r.id}>
                              <td>{r.id}</td>
                              <td>{r.email}</td>
                              <td>{new Date(r.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
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
    </div>
  );
}
