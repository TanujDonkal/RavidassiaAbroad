import React, { useEffect, useState } from "react";
import "materialize-css/dist/css/materialize.min.css";
import "materialize-css/dist/js/materialize.min.js";
import M from "materialize-css";
import {
  approveSubmission,
  rejectSubmission,
  getRecipients,
  addRecipient,
  deleteRecipient,
} from "../utils/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize Materialize UI components
  useEffect(() => {
    M.AutoInit();
  }, []);

  // Load data based on tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (activeTab === "users") {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/users`,
            { headers }
          );
          setUsers(await res.json());
        } else if (activeTab === "submissions") {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/scst-submissions`,
            { headers }
          );
          setSubmissions(await res.json());
        } else if (activeTab === "recipients") {
          const data = await getRecipients();
          setRecipients(data);
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

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      await addRecipient(newEmail);
      setNewEmail("");
      const updated = await getRecipients();
      setRecipients(updated);
    } catch (err) {
      alert("Failed to add recipient: " + err.message);
    }
  };

  const handleDeleteRecipient = async (id) => {
    if (!window.confirm("Delete this recipient?")) return;
    try {
      await deleteRecipient(id);
      const updated = await getRecipients();
      setRecipients(updated);
    } catch (err) {
      alert("Failed to delete recipient: " + err.message);
    }
  };

  return (
    <div style={{ paddingLeft: "240px", padding: "20px" }}>
      <h3>Admin Dashboard</h3>

      <div className="row">
        <button
          className={`btn ${activeTab === "users" ? "indigo" : "grey"}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`btn ${activeTab === "submissions" ? "indigo" : "grey"} ms-2`}
          onClick={() => setActiveTab("submissions")}
        >
          Submissions
        </button>
        <button
          className={`btn ${activeTab === "recipients" ? "indigo" : "grey"} ms-2`}
          onClick={() => setActiveTab("recipients")}
        >
          Recipients
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="red-text">{error}</p>}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="card">
          <div className="card-content">
            <span className="card-title">Users</span>
            <table className="striped responsive-table">
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
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === "submissions" && (
        <div className="card">
          <div className="card-content">
            <span className="card-title">SC/ST Submissions</span>
            <table className="striped responsive-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Country</th>
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
                    <td>
                      <span
                        className={`new badge ${
                          s.status === "approved"
                            ? "green"
                            : s.status === "rejected"
                            ? "red"
                            : "grey"
                        }`}
                        data-badge-caption={s.status}
                      />
                    </td>
                    <td>
                      <button
                        className="btn-small green"
                        onClick={() => handleApprove(s.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-small red ms-1"
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
        </div>
      )}

      {/* RECIPIENTS TAB */}
      {activeTab === "recipients" && (
        <div className="card">
          <div className="card-content">
            <span className="card-title">Notification Recipients</span>

            <form onSubmit={handleAddRecipient} style={{ marginBottom: "20px" }}>
              <input
                type="email"
                placeholder="Enter email to add"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <button className="btn indigo" type="submit">Add</button>
            </form>

            <table className="striped responsive-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.email}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-small red"
                        onClick={() => handleDeleteRecipient(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
