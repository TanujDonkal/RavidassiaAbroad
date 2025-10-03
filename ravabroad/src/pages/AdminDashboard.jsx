// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { getMe, approveSubmission, rejectSubmission } from "../utils/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load current admin user info
  useEffect(() => {
    getMe().catch(() => {
      setError("Unauthorized – please login as admin.");
    });
  }, []);

  // Fetch users and submissions when tab changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (activeTab === "users") {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, { headers });
          setUsers(await res.json());
        } else if (activeTab === "submissions") {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/scst-submissions`, { headers });
          setSubmissions(await res.json());
        }
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      await approveSubmission(id);
      setSubmissions((subs) =>
        subs.map((s) => (s.id === id ? { ...s, status: "approved" } : s))
      );
    } catch (err) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSubmission(id);
      setSubmissions((subs) =>
        subs.map((s) => (s.id === id ? { ...s, status: "rejected" } : s))
      );
    } catch (err) {
      alert("Reject failed: " + err.message);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Sidebar + Topbar */}
      <nav className="navbar navbar-dark bg-dark">
        <span className="navbar-brand">Admin Dashboard</span>
        <button
          className="btn btn-outline-light"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/auth";
          }}
        >
          Logout
        </button>
      </nav>

      <div className="row m-0">
        {/* Sidebar */}
        <div className="col-12 col-md-2 bg-light border-end p-0">
          <ul className="list-group list-group-flush">
            <li
              className={`list-group-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </li>
            <li
              className={`list-group-item ${activeTab === "submissions" ? "active" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              SC/ST Submissions
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="col-12 col-md-10 p-3">
          {loading && <p>Loading…</p>}
          {error && <div className="alert alert-danger">{error}</div>}

          {activeTab === "users" && (
            <>
              <h3>Users</h3>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{new Date(u.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "submissions" && (
            <>
              <h3>SC/ST Submissions</h3>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Country</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.country}</td>
                        <td>{s.city}</td>
                        <td>
                          <span
                            className={`badge ${
                              s.status === "approved"
                                ? "bg-success"
                                : s.status === "rejected"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleApprove(s.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(s.id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
