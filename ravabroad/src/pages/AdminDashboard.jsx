// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { updateUserRole } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { getRecipients, createUser, apiFetch } from "../utils/api";
import "../css/webpixels.css";
import BlogFormModal from "../components/BlogFormModal";
import PersonalityFormModal from "../components/PersonalityFormModal";
import CategoryFormModal from "../components/CategoryFormModal";
import { API_BASE } from "../utils/api";
import ArticleManager from "../components/ArticleManager";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]); // SC/ST
  const [recipients, setRecipients] = useState([]);
  const [matrimonialSubs, setMatrimonialSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const popup = usePopup();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const token = localStorage.getItem("token");
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [personalities, setPersonalities] = useState([]);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState(null);

  // 💬 Reply modal state (for SC/ST connect)
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyForm, setReplyForm] = useState({
    groupLink: "",
    rules:
      "1. Respect all members.\n2. Avoid spam or hate speech.\n3. Keep discussions about community growth and unity.",
  });

  // --------------------------
  // FETCH DATA
  // --------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (activeTab === "blogs") {
          const res = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/blogs`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          setBlogs(Array.isArray(data) ? data : []);
        }

        // USERS
        if (activeTab === "users" || activeTab === "dashboard") {
          const usersRes = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/users`,
            { headers }
          );
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        // SC/ST SUBMISSIONS
        if (activeTab === "submissions" || activeTab === "dashboard") {
          const subsRes = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/scst-submissions`,
            { headers }
          );
          const subsData = await subsRes.json();
          setSubmissions(Array.isArray(subsData) ? subsData : []);
        }

        // MATRIMONIAL SUBMISSIONS
        if (activeTab === "matrimonial" || activeTab === "dashboard") {
          const matrRes = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/matrimonial`,
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
            `${API_BASE.replace("/api", "")}/api/admin/content-requests`,
            { headers }
          );
          const data = await res.json();
          setSubmissions(Array.isArray(data) ? data : []);
        }

        if (activeTab === "categories") {
          const res = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/categories`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        }

        if (activeTab === "menus") {
          const res = await fetch(
            `${API_BASE.replace("/api", "")}/api/admin/menus`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          setMenus(Array.isArray(data) ? data : []);
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

  const fetchPersonalities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/personalities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPersonalities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Failed to fetch personalities:", err);
    }
  };

  // Call it once when component mounts
  useEffect(() => {
    fetchPersonalities();
  }, []);

  // --------------------------
  // DELETE HANDLERS
  // --------------------------
  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      popup.open({
        title: "Deleted",
        message: data.message || "Item deleted successfully.",
        type: "success",
      });

      // ✅ Instantly update UI
      if (type === "users") {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else if (type === "matrimonial") {
        setMatrimonialSubs((prev) => prev.filter((m) => m.id !== id));
      } else if (type === "scst-submissions" || type === "scst") {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      popup.open({
        title: "Error",
        message: "Delete failed. Please try again.",
        type: "error",
      });
    }
  };

  // DELETE MULTIPLE RECORDS
  const handleBulkDelete = async (type) => {
    if (!window.confirm("Delete selected items?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/${type}/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      popup.open({
        title: "Deleted",
        message: data.message || "Bulk delete successful.",
        type: "success",
      });

      // ✅ Update lists instantly
      if (type === "users") {
        setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      } else if (type === "matrimonial") {
        setMatrimonialSubs((prev) =>
          prev.filter((m) => !selectedIds.includes(m.id))
        );
      } else if (type === "scst-submissions" || type === "scst") {
        setSubmissions((prev) =>
          prev.filter((s) => !selectedIds.includes(s.id))
        );
      }

      setSelectedIds([]);
    } catch (err) {
      console.error("❌ Bulk delete error:", err);
      popup.open({
        title: "Error",
        message: "Bulk delete failed. Please try again.",
        type: "error",
      });
    }
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
  // ✅ PRINT MATRIMONIAL POST / REEL IN BRAND STYLE WITH GOLD GLOW ANIMATION
  const handlePrintPost = (data, format = "post") => {
    const isReel = format === "reel";
    const width = 1080;
    const height = isReel ? 1920 : 1080;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>${data.name} | Ravidassia Abroad Matrimonial</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

          body {
            margin: 0;
            width: ${width}px;
            height: ${height}px;
            font-family: 'Poppins', sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: ${isReel ? "flex-start" : "center"};
            padding: ${isReel ? "120px 60px" : "80px 60px"};
            box-sizing: border-box;
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .photo {
            border-radius: 50%;
            width: ${isReel ? "300px" : "220px"};
            height: ${isReel ? "300px" : "220px"};
            object-fit: cover;
            border: 5px solid #ffcc33;
            box-shadow: 0 0 25px rgba(255, 204, 51, 0.4);
            margin-bottom: ${isReel ? "50px" : "30px"};
          }

          h1 {
            font-size: ${isReel ? "58px" : "36px"};
            color: #ffcc33;
            margin: 0 0 10px;
          }

          h3 {
            font-size: ${isReel ? "32px" : "22px"};
            font-weight: 400;
            margin-bottom: 20px;
            color: #eee;
          }

          p {
            font-size: ${isReel ? "30px" : "18px"};
            margin: 5px 0;
          }

          .section {
            margin-top: ${isReel ? "30px" : "20px"};
            max-width: 850px;
          }

          .divider {
            width: 60%;
            height: 2px;
            background: #444;
            margin: 20px 0;
          }

          /* ✨ Animated Gold Glow */
          @keyframes shimmer {
            0% { color: #ffcc33; text-shadow: 0 0 5px #ffcc33, 0 0 10px #ffea00, 0 0 20px #ffcc33; }
            50% { color: #fff5cc; text-shadow: 0 0 15px #ffe066, 0 0 25px #ffcc33, 0 0 35px #ffcc33; }
            100% { color: #ffcc33; text-shadow: 0 0 5px #ffcc33, 0 0 10px #ffea00, 0 0 20px #ffcc33; }
          }

          footer {
            position: absolute;
            bottom: ${isReel ? "60px" : "40px"};
            width: 100%;
            text-align: center;
            font-size: ${isReel ? "28px" : "18px"};
            animation: shimmer 3s infinite ease-in-out;
            letter-spacing: 1px;
          }

          .logo {
            width: ${isReel ? "240px" : "160px"};
            opacity: ${isReel ? "0.15" : "0.2"};
            position: absolute;
            bottom: ${isReel ? "40px" : "30px"};
            left: 50%;
            transform: translateX(-50%);
          }
        </style>
      </head>
      <body>
        ${
          isReel
            ? ""
            : `<img class="logo" src="/template/img/6Qt0bpw3_400x400-removebg-preview.png" alt="Logo" />`
        }

        <img
          class="photo"
          src="${data.photo_url || "/template/img/no-photo.png"}"
          alt="Profile"
        />
        <h1>${data.name}</h1>
        <h3>${data.gender || ""} | ${data.status_type || ""}</h3>

        <div class="section">
          <div class="divider"></div>
          <p>📍 ${data.city_living || ""}, ${data.country_living || ""}</p>
          <p>🎓 ${data.education || "—"} | 💼 ${data.occupation || "—"}</p>
          <div class="divider"></div>
          <p><strong>Partner Preference:</strong></p>
          <p>${data.partner_expectations || "Not specified"}</p>
        </div>

        <footer>💍 Ravidassia Abroad Matrimonial 💍</footer>

        ${
          isReel
            ? `<img class="logo" src="/template/img/6Qt0bpw3_400x400-removebg-preview.png" alt="Logo" />`
            : ""
        }

        <script>window.print();</script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

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
                { tab: "blogs", icon: "bi-newspaper", label: "Blogs" },
                { tab: "categories", icon: "bi-tags", label: "Categories" },
                { tab: "menus", icon: "bi-list", label: "Menus" },
                {
                  tab: "personalities",
                  icon: "bi-stars",
                  label: "Famous Personalities",
                },
                { tab: "articles", icon: "bi-journal-text", label: "Articles" },
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

                {/* BLOGS TAB */}
                {activeTab === "blogs" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Blog Posts</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedBlog(null);
                          setShowBlogModal(true);
                        }}
                      >
                        + New Post
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Views</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {blogs.length === 0 ? (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center text-muted py-4"
                              >
                                No blog posts yet.
                              </td>
                            </tr>
                          ) : (
                            blogs.map((b) => (
                              <tr key={b.id}>
                                <td>{b.id}</td>
                                <td>{b.title}</td>
                                <td>{b.category_name || "—"}</td>
                                <td>{b.views}</td>
                                <td>{b.status}</td>
                                <td>
                                  {new Date(b.created_at).toLocaleDateString()}
                                </td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => {
                                      setSelectedBlog(b);
                                      setShowBlogModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete("blogs", b.id)}
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

                    {/* ✅ Blog Form Modal */}
                    {showBlogModal && (
                      <BlogFormModal
                        blog={selectedBlog}
                        onClose={() => {
                          setShowBlogModal(false);
                          setSelectedBlog(null);
                        }}
                        onSubmit={(updatedBlog) => {
                          // Add a re-fetch so views/other data refresh
                          const token = localStorage.getItem("token");
                          // ✅ Instantly update local list (no manual refresh)
                          if (updatedBlog?.id) {
                            // existing blog edited
                            setBlogs((prev) =>
                              prev.map((b) =>
                                b.id === updatedBlog.id ? updatedBlog : b
                              )
                            );
                          } else if (updatedBlog) {
                            // new blog added
                            setBlogs((prev) => [updatedBlog, ...prev]);
                          }

                          // Optional: background re-fetch for accuracy
                          (async () => {
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(
                                `${API_BASE.replace(
                                  "/api",
                                  ""
                                )}/api/admin/blogs`,
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              const refreshed = await res.json();
                              setBlogs(
                                Array.isArray(refreshed) ? refreshed : []
                              );
                            } catch (err) {
                              console.warn(
                                "⚠️ Blog list refresh failed:",
                                err.message
                              );
                            }
                          })();

                          setShowBlogModal(false);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === "categories" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Blog Categories</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowCategoryModal(true);
                        }}
                      >
                        + New Category
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Parent</th>
                            <th>Description</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="text-center text-muted py-4"
                              >
                                No categories yet.
                              </td>
                            </tr>
                          ) : (
                            categories.map((c) => (
                              <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.name}</td>
                                <td>{c.slug}</td>
                                <td>{c.parent_id || "—"}</td>
                                <td>{c.description || "—"}</td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => {
                                      setSelectedCategory(c);
                                      setShowCategoryModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      handleDelete("categories", c.id)
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

                    {showCategoryModal && (
                      <CategoryFormModal
                        category={selectedCategory}
                        onClose={() => {
                          setShowCategoryModal(false);
                          setSelectedCategory(null);
                        }}
                        onSubmit={async () => {
                          const token = localStorage.getItem("token");
                          const res = await fetch(
                            `${API_BASE.replace(
                              "/api",
                              ""
                            )}/api/admin/categories`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          const refreshed = await res.json();
                          setCategories(
                            Array.isArray(refreshed) ? refreshed : []
                          );
                        }}
                      />
                    )}
                  </div>
                )}

                {/* USERS */}
                {activeTab === "users" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Users</h5>
                      {currentUser.role === "main_admin" &&
                        selectedIds.length > 0 && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleBulkDelete("users")}
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
                                    checked ? users.map((u) => u.id) : []
                                  );
                                }}
                              />
                            </th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center text-muted py-4"
                              >
                                No users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(u.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedIds((prev) =>
                                        checked
                                          ? [...prev, u.id]
                                          : prev.filter((id) => id !== u.id)
                                      );
                                    }}
                                  />
                                </td>
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
                                <td className="text-end">
                                  {currentUser.role === "main_admin" && (
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() =>
                                        handleDelete("users", u.id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  )}
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
                            <th>Data</th>
                            <th>Reply</th>
                            <th>Status</th>
                            <th>Delete</th>
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
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleOpenModal(s)}
                                  >
                                    View All
                                  </button>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => setReplyTarget(s)}
                                  >
                                    Reply
                                  </button>
                                </td>
                                <td>
                                  {s.replied ? (
                                    <span
                                      className="badge bg-success"
                                      title={`Replied on ${new Date(
                                        s.replied_at
                                      ).toLocaleString()}`}
                                    >
                                      ✅ Replied –{" "}
                                      {new Date(
                                        s.replied_at
                                      ).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}{" "}
                                      at{" "}
                                      {new Date(
                                        s.replied_at
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning text-dark">
                                      ⏳ Pending
                                    </span>
                                  )}
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
                            <th>Data</th>
                            <th>Download Data</th>
                            <th>Delete</th>
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
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleOpenModal(s)}
                                  >
                                    View All
                                  </button>
                                </td>
                                <td className="d-flex gap-2">
                                  {/* 🎨 Instagram Export Dropdown */}
                                  <div className="btn-group">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary dropdown-toggle"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      📸 Download for Instagram
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          onClick={() =>
                                            handlePrintPost(s, "post")
                                          }
                                        >
                                          🖼️ Instagram Post (1:1)
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          onClick={() =>
                                            handlePrintPost(s, "reel")
                                          }
                                        >
                                          🎬 Instagram Reel (9:16)
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
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

                {activeTab === "personalities" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Famous Personalities</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedPersonality(null);
                          setShowPersonalityModal(true);
                        }}
                      >
                        + Add Personality
                      </button>
                    </div>

                    {/* Table list */}
                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Photo</th>
                            <th>Name</th>
                            <th>Caste</th>
                            <th>Region</th>
                            <th>Category</th>
                            <th>SC/ST</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {personalities.length === 0 ? (
                            <tr>
                              <td
                                colSpan="8"
                                className="text-center py-4 text-muted"
                              >
                                No personalities yet.
                              </td>
                            </tr>
                          ) : (
                            personalities.map((p) => (
                              <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>
                                  <img
                                    src={p.photo_url}
                                    alt={p.name}
                                    width="50"
                                    className="rounded-circle"
                                  />
                                </td>
                                <td>{p.name}</td>
                                <td>{p.caste}</td>
                                <td>{p.region}</td>
                                <td>{p.category}</td>
                                <td>{p.sc_st_type}</td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => {
                                      setSelectedPersonality(p);
                                      setShowPersonalityModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      handleDelete("personalities", p.id)
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
                    {showPersonalityModal && (
                      <PersonalityFormModal
                        personality={selectedPersonality}
                        onClose={() => {
                          setShowPersonalityModal(false);
                          setSelectedPersonality(null);
                        }}
                        onSubmit={fetchPersonalities}
                      />
                    )}
                  </div>
                )}

                {activeTab === "articles" && <ArticleManager />}
                {/* MENUS TAB */}
                {activeTab === "menus" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Dynamic Site Menus</h5>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedMenu({
                            label: "",
                            path: "",
                            parent_id: null,
                            position: 0,
                          });
                        }}
                      >
                        + New Menu
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Label</th>
                            <th>Path</th>
                            <th>Parent</th>
                            <th>Position</th>
                            <th>Created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {menus.length === 0 ? (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center text-muted py-4"
                              >
                                No menus yet.
                              </td>
                            </tr>
                          ) : (
                            menus.map((m) => (
                              <tr key={m.id}>
                                <td>{m.id}</td>
                                <td>{m.label}</td>
                                <td>{m.path}</td>
                                <td>{m.parent_id || "—"}</td>
                                <td>{m.position}</td>
                                <td>
                                  {new Date(m.created_at).toLocaleDateString()}
                                </td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => setSelectedMenu(m)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={async () => {
                                      if (window.confirm("Delete this menu?")) {
                                        await apiFetch(`/admin/menus/${m.id}`, {
                                          method: "DELETE",
                                        });
                                        setMenus((prev) =>
                                          prev.filter((x) => x.id !== m.id)
                                        );
                                        popup.open({
                                          title: "🗑️ Deleted",
                                          message: "Menu deleted successfully",
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

                    {/* Add/Edit Modal */}
                    {selectedMenu && (
                      <div
                        className="modal fade show"
                        style={{
                          display: "block",
                          backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                      >
                        <div className="modal-dialog">
                          <div className="modal-content">
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                  const method = selectedMenu.id
                                    ? "PUT"
                                    : "POST";
                                  const url = selectedMenu.id
                                    ? `/admin/menus/${selectedMenu.id}`
                                    : "/admin/menus";
                                  await apiFetch(url, {
                                    method,
                                    body: JSON.stringify(selectedMenu),
                                  });
                                  const refreshed = await fetch(
                                    `${API_BASE.replace(
                                      "/api",
                                      ""
                                    )}/api/admin/menus`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  );
                                  const data = await refreshed.json();
                                  setMenus(Array.isArray(data) ? data : []);
                                  popup.open({
                                    title: "✅ Saved",
                                    message: "Menu saved successfully",
                                    type: "success",
                                  });
                                  setSelectedMenu(null);
                                } catch (err) {
                                  popup.open({
                                    title: "❌ Error",
                                    message: err.message,
                                    type: "error",
                                  });
                                }
                              }}
                            >
                              <div className="modal-header">
                                <h5 className="modal-title">
                                  {selectedMenu.id ? "Edit Menu" : "New Menu"}
                                </h5>
                                <button
                                  type="button"
                                  className="btn-close"
                                  onClick={() => setSelectedMenu(null)}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="mb-3">
                                  <label className="form-label">Label</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={selectedMenu.label}
                                    onChange={(e) =>
                                      setSelectedMenu((p) => ({
                                        ...p,
                                        label: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">Path</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="/connect-canada"
                                    value={selectedMenu.path}
                                    onChange={(e) =>
                                      setSelectedMenu((p) => ({
                                        ...p,
                                        path: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">
                                    Parent ID (optional)
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={selectedMenu.parent_id || ""}
                                    onChange={(e) =>
                                      setSelectedMenu((p) => ({
                                        ...p,
                                        parent_id: e.target.value || null,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">
                                    Position (order)
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={selectedMenu.position}
                                    onChange={(e) =>
                                      setSelectedMenu((p) => ({
                                        ...p,
                                        position: parseInt(e.target.value) || 0,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="modal-footer">
                                <button
                                  type="button"
                                  className="btn btn-light"
                                  onClick={() => setSelectedMenu(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
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
                {activeTab === "submissions" && selectedSubmission && (
                  <table className="table table-striped small">
                    <tbody>
                      {Object.entries(selectedSubmission).map(
                        ([key, value]) => (
                          <tr key={key}>
                            <th
                              className="text-capitalize"
                              style={{ width: "40%" }}
                            >
                              {key.replaceAll("_", " ")}
                            </th>
                            <td>
                              {key.includes("photo") && value ? (
                                <img
                                  src={value}
                                  alt="profile"
                                  className="rounded-circle"
                                  width="60"
                                  height="60"
                                />
                              ) : (
                                value || "—"
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "matrimonial" && selectedSubmission && (
                  <div>
                    <div className="text-center mb-3">
                      <img
                        src={
                          selectedSubmission.photo_url ||
                          "/template/img/no-photo.png"
                        }
                        alt="profile"
                        className="rounded-circle shadow-sm"
                        width="100"
                        height="100"
                      />
                    </div>
                    <table className="table table-striped small">
                      <tbody>
                        {Object.entries(selectedSubmission).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <th
                                className="text-capitalize"
                                style={{ width: "40%" }}
                              >
                                {key.replaceAll("_", " ")}
                              </th>
                              <td>{value || "—"}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
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

      {replyTarget && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reply to {replyTarget.name}</h5>
                <button
                  className="btn-close"
                  onClick={() => setReplyTarget(null)}
                ></button>
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
                  onChange={(e) =>
                    setReplyForm((prev) => ({
                      ...prev,
                      groupLink: e.target.value,
                    }))
                  }
                  placeholder="https://chat.whatsapp.com/..."
                />

                <label className="form-label">Group Rules</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={replyForm.rules}
                  onChange={(e) =>
                    setReplyForm((prev) => ({ ...prev, rules: e.target.value }))
                  }
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      // 1️⃣ Send the reply email + WhatsApp
                      const res = await apiFetch("/admin/scst-reply", {
                        method: "POST",
                        body: JSON.stringify({
                          name: replyTarget.name,
                          email: replyTarget.email,
                          country: replyTarget.country,
                          phone: replyTarget.phone,
                          groupLink: replyForm.groupLink,
                          rules: replyForm.rules
                            .split("\n")
                            .filter((r) => r.trim() !== ""),
                        }),
                      });

                      // 2️⃣ Open WhatsApp
                      if (res.whatsapp_link) {
                        window.open(res.whatsapp_link, "_blank");
                      }

                      // 3️⃣ Success popup
                      popup.open({
                        title: "✅ Sent",
                        message: `Reply email sent to ${replyTarget.email} and WhatsApp message ready.`,
                        type: "success",
                      });

                      // 4️⃣ Close modal
                      setReplyTarget(null);

                      // 5️⃣ Refresh submissions list (corrected URL)
                      const token = localStorage.getItem("token");
                      const res2 = await fetch(
                        `${API_BASE}/admin/scst-submissions`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      const updatedSubs = await res2.json();
                      setSubmissions(
                        Array.isArray(updatedSubs) ? updatedSubs : []
                      );
                    } catch (err) {
                      console.error("Reply error:", err);
                      popup.open({
                        title: "❌ Error",
                        message: err.message,
                        type: "error",
                      });
                    }
                  }}
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
