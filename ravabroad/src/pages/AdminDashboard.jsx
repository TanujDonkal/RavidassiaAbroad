// src/pages/AdminDashboard.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { bulkDeleteAdminItems, deleteSubmission, updateUserRole } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { getRecipients, apiFetch } from "../utils/api";
import "../css/webpixels.css";
import html2canvas from "html2canvas";

const PersonalityFormModal = lazy(() => import("../components/PersonalityFormModal"));
const ArticleManager = lazy(() => import("../components/ArticleManager"));
const AdminBlogsSection = lazy(() => import("../components/admin/AdminBlogsSection"));
const AdminCategoriesSection = lazy(() => import("../components/admin/AdminCategoriesSection"));
const AdminContentRequestsSection = lazy(() =>
  import("../components/admin/AdminContentRequestsSection")
);
const AdminMatrimonialSection = lazy(() =>
  import("../components/admin/AdminMatrimonialSection")
);
const AdminMenuModal = lazy(() => import("../components/admin/AdminMenuModal"));
const AdminPersonalitiesSection = lazy(() =>
  import("../components/admin/AdminPersonalitiesSection")
);
const AdminPrivacyRequestsSection = lazy(() =>
  import("../components/admin/AdminPrivacyRequestsSection")
);
const AdminRecipientsSection = lazy(() =>
  import("../components/admin/AdminRecipientsSection")
);
const AdminReplyModal = lazy(() => import("../components/admin/AdminReplyModal"));
const AdminScstSubmissionsSection = lazy(() =>
  import("../components/admin/AdminScstSubmissionsSection")
);
const AdminSubmissionDetailsModal = lazy(() => import("../components/admin/AdminSubmissionDetailsModal"));
const AdminTemplesSection = lazy(() => import("../components/admin/AdminTemplesSection"));
const AdminUsersSection = lazy(() => import("../components/admin/AdminUsersSection"));
const TempleFormModal = lazy(() => import("../components/TempleFormModal"));

export default function AdminDashboard() {
  const createDefaultReplyForm = () => ({
    groupLink: "",
    rules:
      "1. Respect all members.\n2. Avoid spam or hate speech.\n3. Keep discussions about community growth and unity.",
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]); // SC/ST
  const [privacyRequests, setPrivacyRequests] = useState([]);
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
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [personalities, setPersonalities] = useState([]);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState(null);
  const [temples, setTemples] = useState([]);
  const [showTempleModal, setShowTempleModal] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState(null);

  // 💬 Reply modal state (for SC/ST connect)
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyForm, setReplyForm] = useState(createDefaultReplyForm);

  const MATRIMONIAL_LABELS = {
  dob: "Date of Birth",
  height: "Height",
  caste: "Caste",
  religion_beliefs: "Religious Beliefs",
  instagram: "Instagram",
  marital_status: "Marital Status",
  complexion: "Complexion",

  country_living: "Country Living",
  city_living: "City Living",
  home_state_india: "Home State (India)",
  status_type: "Current Status",

  education: "Education",
  occupation: "Occupation",
  annual_income: "Annual Income",
  company_or_institution: "Company / Institution",
  income_range: "Income Range",

  father_name: "Father’s Name",
  father_occupation: "Father’s Occupation",
  mother_name: "Mother’s Name",
  mother_occupation: "Mother’s Occupation",
  siblings: "Siblings",
  family_type: "Family Type",

  partner_age_range: "Preferred Age Range",
  partner_country: "Preferred Country",
  partner_marital_status: "Partner Marital Status",
  religion: "Religion Preference",
  partner_expectations: "Partner Expectations",
};

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
          const data = await apiFetch("/admin/blogs");
          setBlogs(Array.isArray(data) ? data : []);
        }

        // USERS
        if (activeTab === "users" || activeTab === "dashboard") {
          const usersData = await apiFetch("/admin/users", { headers });
          setUsers(Array.isArray(usersData) ? usersData : []);
        }

        // SC/ST SUBMISSIONS
        if (activeTab === "submissions" || activeTab === "dashboard") {
          const subsData = await apiFetch("/admin/scst-submissions", { headers });
          setSubmissions(Array.isArray(subsData) ? subsData : []);
        }

        // MATRIMONIAL SUBMISSIONS
        if (activeTab === "matrimonial" || activeTab === "dashboard") {
          const matrData = await apiFetch("/admin/matrimonial", { headers });
          setMatrimonialSubs(Array.isArray(matrData) ? matrData : []);
        }

        // RECIPIENTS
        if (activeTab === "recipients") {
          const recData = await getRecipients();
          setRecipients(Array.isArray(recData) ? recData : []);
        }

        if (activeTab === "contentRequests") {
          const data = await apiFetch("/admin/content-requests", { headers });
          setSubmissions(Array.isArray(data) ? data : []);
        }

        if (activeTab === "privacyRequests") {
          const data = await apiFetch("/admin/privacy-requests", { headers });
          setPrivacyRequests(Array.isArray(data) ? data : []);
        }

        if (activeTab === "categories") {
          const data = await apiFetch("/admin/categories", { headers });
          setCategories(Array.isArray(data) ? data : []);
        }

        if (activeTab === "menus") {
          const data = await apiFetch("/admin/menus", { headers });
          setMenus(Array.isArray(data) ? data : []);
        }

        if (activeTab === "temples" || activeTab === "dashboard") {
          const data = await apiFetch("/admin/temples", { headers });
          setTemples(Array.isArray(data) ? data : []);
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
    const entityType =
      activeTab === "matrimonial" ? "matrimonial_submission" : "scst_submission";
    apiFetch("/admin/audit-events", {
      method: "POST",
      body: JSON.stringify({
        action: "view",
        entity_type: entityType,
        entity_id: submission.id,
      }),
    }).catch(() => {});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
  };

  const fetchPersonalities = async () => {
    try {
      const data = await apiFetch("/admin/personalities");
      setPersonalities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Failed to fetch personalities:", err);
    }
  };

  const fetchMenus = async () => {
    try {
      const data = await apiFetch("/admin/menus");
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch menus:", err);
    }
  };

  const fetchBlogs = async () => {
    try {
      const data = await apiFetch("/admin/blogs");
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Blog list refresh failed:", err.message);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const data = await apiFetch("/admin/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Category list refresh failed:", err.message);
    }
  };

  const fetchScstSubmissions = async () => {
    try {
      const data = await apiFetch("/admin/scst-submissions");
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refresh SC/ST submissions:", err);
    }
  };

  const handleSelectedMenuChange = (field, value) => {
    setSelectedMenu((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      const method = selectedMenu.id ? "PUT" : "POST";
      const url = selectedMenu.id
        ? `/admin/menus/${selectedMenu.id}`
        : "/admin/menus";

      await apiFetch(url, {
        method,
        body: JSON.stringify(selectedMenu),
      });

      await fetchMenus();
      popup.open({
        title: "âœ… Saved",
        message: "Menu saved successfully",
        type: "success",
      });
      setSelectedMenu(null);
    } catch (err) {
      popup.open({
        title: "âŒ Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleReplyFormChange = (field, value) => {
    setReplyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchTemples = async () => {
    try {
      const data = await apiFetch("/admin/temples");
      setTemples(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refresh temples:", err);
    }
  };

  const fetchPrivacyRequests = async () => {
    try {
      const data = await apiFetch("/admin/privacy-requests");
      setPrivacyRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refresh privacy requests:", err);
    }
  };

  const handleOpenReplyModal = (submission) => {
    setReplyTarget(submission);
    setReplyForm(createDefaultReplyForm());
  };

  const handleCloseReplyModal = () => {
    setReplyTarget(null);
    setReplyForm(createDefaultReplyForm());
  };

  const handleToggleSelection = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  const handleBlogModalSubmit = async (updatedBlog) => {
    if (updatedBlog?.id) {
      setBlogs((prev) =>
        prev.map((blog) => (blog.id === updatedBlog.id ? updatedBlog : blog))
      );
    } else if (updatedBlog) {
      setBlogs((prev) => [updatedBlog, ...prev]);
    }

    await fetchBlogs();
    setShowBlogModal(false);
    setSelectedBlog(null);
  };

  const handleCategoryModalSubmit = async () => {
    await fetchCategoriesList();
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  const handlePersonalitiesBulkDelete = async () => {
    popup.open({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete ${selectedIds.length} selected record(s)?`,
      type: "confirm",
      onConfirm: async () => {
        try {
          popup.open({
            title: "Deleting...",
            message: "Please wait while we delete selected records.",
            type: "loading",
          });
          const data = await apiFetch("/admin/personalities/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ ids: selectedIds }),
          });
          popup.open({
            title: "âœ… Deleted",
            message: data.message || "Bulk delete successful.",
            type: "success",
          });
          setPersonalities((prev) =>
            prev.filter((personality) => !selectedIds.includes(personality.id))
          );
          setSelectedIds([]);
          setSelectAll(false);
        } catch (err) {
          console.error("âŒ Bulk delete error:", err);
          popup.open({
            title: "âŒ Error",
            message: "Bulk delete failed. Please try again.",
            type: "error",
          });
        }
      },
    });
  };

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!email) return;

    try {
      await apiFetch("/admin/recipients", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      popup.open({
        title: "âœ… Added",
        message: `${email} will now receive notifications`,
        type: "success",
      });
      e.target.reset();
      const data = await getRecipients();
      setRecipients(Array.isArray(data) ? data : []);
    } catch (err) {
      popup.open({
        title: "âŒ Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleRemoveRecipient = async (recipientId, email) => {
    let confirmed = false;
    await new Promise((resolve) => {
      popup.open({
        title: "Confirm Remove",
        message: `Remove ${email}?`,
        type: "confirm",
        onConfirm: () => {
          confirmed = true;
          resolve();
        },
        onCancel: () => {
          resolve();
        },
      });
    });

    if (!confirmed) return;

    await apiFetch(`/admin/recipients/${recipientId}`, {
      method: "DELETE",
    });
    setRecipients((prev) => prev.filter((recipient) => recipient.id !== recipientId));
    popup.open({
      title: "ðŸ—‘ï¸ Removed",
      message: `${email} will no longer receive alerts`,
      type: "success",
    });
  };

  const handleSendReply = async () => {
    try {
      const res = await apiFetch("/admin/scst-reply", {
        method: "POST",
        body: JSON.stringify({
          submissionId: replyTarget.id,
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

      if (res.whatsapp_link) {
        window.open(res.whatsapp_link, "_blank");
      }

      popup.open({
        title: "âœ… Sent",
        message: `Reply email sent to ${replyTarget.email} and WhatsApp message ready.`,
        type: "success",
      });

      handleCloseReplyModal();
      await fetchScstSubmissions();
    } catch (err) {
      console.error("Reply error:", err);
      popup.open({
        title: "âŒ Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleResolvePrivacyRequest = async (request) => {
    try {
      await apiFetch(`/admin/privacy-requests/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "resolved",
          admin_notes: "Resolved from admin dashboard",
        }),
      });
      popup.open({
        title: "Resolved",
        message: `Privacy request #${request.id} marked as resolved.`,
        type: "success",
      });
      await fetchPrivacyRequests();
    } catch (err) {
      popup.open({
        title: "Error",
        message: err.message,
        type: "error",
      });
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

    let confirmed = false;
    await new Promise((resolve) => {
      popup.open({
        title: "Confirm Delete",
        message: "Are you sure you want to delete this item?",
        type: "confirm",
        onConfirm: () => {
          confirmed = true;
          resolve();
        },
        onCancel: () => {
          resolve();
        },
      });
    });
    if (!confirmed) return;

    try {
      const data = await deleteSubmission(type, id);
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
      } else if (type === "blogs") {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      } else if (type === "categories") {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else if (type === "recipients") {
        setRecipients((prev) => prev.filter((r) => r.id !== id));
      } else if (type === "menus") {
        setMenus((prev) => prev.filter((m) => m.id !== id));
      } else if (type === "temples") {
        setTemples((prev) => prev.filter((temple) => temple.id !== id));
      } else if (type === "privacy-requests") {
        setPrivacyRequests((prev) =>
          prev.filter((request) => request.id !== id)
        );
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

  // DELETE MULTIPLE RECORDS — uses global popup instead of browser confirm
  const handleBulkDelete = async (type) => {
    if (selectedIds.length === 0) {
      popup.open({
        title: "⚠️ No Selection",
        message: "Please select at least one record to delete.",
        type: "warning",
      });
      return;
    }

    // 🔹 Ask for confirmation using your popup
    popup.open({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete ${selectedIds.length} selected record(s)?`,
      type: "confirm",
      onConfirm: async () => {
        try {
          // optional: show loading popup while waiting
          popup.open({
            title: "Deleting...",
            message: "Please wait while we delete selected records.",
            type: "loading",
          });

          const data = await bulkDeleteAdminItems(type, selectedIds);

          popup.open({
            title: "✅ Deleted",
            message: data.message || "Bulk delete successful.",
            type: "success",
          });

          // ✅ Update state immediately
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
          } else if (type === "blogs") {
            setBlogs((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
          } else if (type === "categories") {
            setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
          } else if (type === "recipients") {
            setRecipients((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
          } else if (type === "menus") {
            setMenus((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
          } else if (type === "temples") {
            setTemples((prev) =>
              prev.filter((temple) => !selectedIds.includes(temple.id))
            );
          } else if (type === "privacy-requests") {
            setPrivacyRequests((prev) =>
              prev.filter((request) => !selectedIds.includes(request.id))
            );
          }

          setSelectedIds([]);
          setSelectAll(false);
        } catch (err) {
          console.error("❌ Bulk delete error:", err);
          popup.open({
            title: "❌ Error",
            message: "Bulk delete failed. Please try again.",
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
    {
      label: "Global Temples",
      value: temples.length || 0,
      icon: "bi-building",
      color: "bg-dark",
    },
  ];
  const suspenseFallback = <div className="text-center py-4">Loading...</div>;
  // ✅ PRINT MATRIMONIAL POST / REEL IN BRAND STYLE WITH GOLD GLOW ANIMATION
const handleDownloadInstagramCard = async (data, format = "post") => {

  const width = 1080;
  const height = format === "reel" ? 1920 : 1350;

  // Build visible biodata rows (hide empty)
  const biodataRows = Object.entries(MATRIMONIAL_LABELS)
    .filter(([field]) => data[field] && data[field] !== "")
    .map(
      ([field, label]) => `
        <div style="margin-bottom: 10px;">
          <span style="font-weight:600">${label}:</span> ${data[field]}
        </div>
      `
    )
    .join("");

  // AUTO FONT SCALING BASED ON FIELD COUNT
  const fieldCount = biodataRows.split("<div").length;
  let fontSize = format === "reel" ? 40 : 32;

  if (fieldCount > 20) fontSize -= 10;
  if (fieldCount > 30) fontSize -= 15;

  // Insert into hidden DIV
  const container = document.getElementById("downloadCard");

  container.innerHTML = `
    <div style="
      width:${width}px;
      height:${height}px;
      background:white;
      padding:50px;
      font-family: 'Poppins', sans-serif;
      box-sizing:border-box;
      text-align:center;
      overflow:hidden;
    ">

      <!-- PROFILE IMAGE -->
      <img src="${data.photo_url || "/template/img/no-photo.png"}"
        style="
          width:${format === "reel" ? 320 : 260}px;
          height:${format === "reel" ? 320 : 260}px;
          border-radius:50%;
          object-fit:cover;
          border:6px solid #ffb400;
          margin-bottom:20px;
        "
      />

      <!-- NAME -->
      <div style="font-size:${format === "reel" ? 60 : 48}px; font-weight:700;">
        ${data.name}
      </div>

      <!-- SUBTITLE -->
      <div style="font-size:${format === "reel" ? 36 : 26}px; color:#777; margin-bottom:35px;">
        ${data.gender || ""} • ${data.marital_status || ""}
      </div>

      <!-- BIODATA LIST -->
      <div style="
        font-size:${fontSize}px;
        line-height:1.35;
        text-align:left;
        margin:0 auto;
        width:85%;
        max-height:${height - 650}px;
      ">
        ${biodataRows}
      </div>

      <!-- FOOTER -->
      <div style="
        position:absolute;
        bottom:40px;
        width:100%;
        text-align:center;
        font-size:${format === "reel" ? 36 : 28}px;
        font-weight:600;
        color:#ffb400;
      ">
        Ravidassia Abroad Matrimonial
      </div>

    </div>
  `;

  // Generate PNG
  const canvas = await html2canvas(container, { scale: 2, useCORS: true });
  const image = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = image;
  link.download = `${data.name}-${format}.png`;
  link.click();
};

  return (
    <div className="admin-dashboard d-flex flex-column flex-lg-row h-lg-full bg-surface-secondary">
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
                {
                  tab: "privacyRequests",
                  icon: "bi-shield-lock",
                  label: "Privacy Requests",
                },
                { tab: "blogs", icon: "bi-newspaper", label: "Blogs" },
                { tab: "categories", icon: "bi-tags", label: "Categories" },
                { tab: "menus", icon: "bi-list", label: "Menus" },
                {
                  tab: "personalities",
                  icon: "bi-stars",
                  label: "Famous Personalities",
                },
                { tab: "temples", icon: "bi-building", label: "Global Temples" },
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

                {activeTab === "blogs" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminBlogsSection
                      blogs={blogs}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(checked ? blogs.map((b) => b.id) : []);
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("blogs")}
                      onNew={() => {
                        setSelectedBlog(null);
                        setShowBlogModal(true);
                      }}
                      onEdit={(blog) => {
                        setSelectedBlog(blog);
                        setShowBlogModal(true);
                      }}
                      onDelete={(blogId) => handleDelete("blogs", blogId)}
                      showBlogModal={showBlogModal}
                      selectedBlog={selectedBlog}
                      onCloseModal={() => {
                        setShowBlogModal(false);
                        setSelectedBlog(null);
                      }}
                      onSubmitModal={handleBlogModalSubmit}
                    />
                  </Suspense>
                )}

                {activeTab === "categories" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminCategoriesSection
                      categories={categories}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(checked ? categories.map((c) => c.id) : []);
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("categories")}
                      onNew={() => {
                        setSelectedCategory(null);
                        setShowCategoryModal(true);
                      }}
                      onEdit={(category) => {
                        setSelectedCategory(category);
                        setShowCategoryModal(true);
                      }}
                      onDelete={(categoryId) =>
                        handleDelete("categories", categoryId)
                      }
                      showCategoryModal={showCategoryModal}
                      selectedCategory={selectedCategory}
                      onCloseModal={() => {
                        setShowCategoryModal(false);
                        setSelectedCategory(null);
                      }}
                      onSubmitModal={handleCategoryModalSubmit}
                    />
                  </Suspense>
                )}

                {activeTab === "users" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminUsersSection
                      users={users}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      currentUser={currentUser}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(checked ? users.map((u) => u.id) : []);
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("users")}
                      onRoleChange={handleRoleChange}
                      onDelete={(userId) => handleDelete("users", userId)}
                    />
                  </Suspense>
                )}

                {activeTab === "submissions" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminScstSubmissionsSection
                      submissions={submissions}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? submissions.map((s) => s.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("scst-submissions")}
                      onView={handleOpenModal}
                      onReply={handleOpenReplyModal}
                      onDelete={(submissionId) =>
                        handleDelete("scst-submissions", submissionId)
                      }
                    />
                  </Suspense>
                )}

                {activeTab === "matrimonial" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminMatrimonialSection
                      matrimonialSubs={matrimonialSubs}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? matrimonialSubs.map((s) => s.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("matrimonial")}
                      onView={handleOpenModal}
                      onDownloadInstagramCard={handleDownloadInstagramCard}
                      onDelete={(submissionId) =>
                        handleDelete("matrimonial", submissionId)
                      }
                    />
                  </Suspense>
                )}

                {activeTab === "recipients" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminRecipientsSection
                      recipients={recipients}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? recipients.map((r) => r.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("recipients")}
                      onAddRecipient={handleAddRecipient}
                      onDeleteRecipient={handleRemoveRecipient}
                    />
                  </Suspense>
                )}

                {activeTab === "contentRequests" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminContentRequestsSection
                      loading={loading}
                      requests={submissions}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? submissions.map((r) => r.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("content-requests")}
                      onDelete={(requestId) =>
                        handleDelete("content-requests", requestId)
                      }
                    />
                  </Suspense>
                )}

                {activeTab === "personalities" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminPersonalitiesSection
                      personalities={personalities}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? personalities.map((p) => p.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={handlePersonalitiesBulkDelete}
                      onNew={() => {
                        setSelectedPersonality(null);
                        setShowPersonalityModal(true);
                      }}
                      onEdit={(personality) => {
                        setSelectedPersonality(personality);
                        setShowPersonalityModal(true);
                      }}
                      onDelete={(personalityId) =>
                        handleDelete("personalities", personalityId)
                      }
                    />
                  </Suspense>
                )}

                {activeTab === "privacyRequests" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminPrivacyRequestsSection
                      loading={loading}
                      requests={privacyRequests}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(
                          checked ? privacyRequests.map((request) => request.id) : []
                        );
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("privacy-requests")}
                      onResolve={handleResolvePrivacyRequest}
                      onDelete={(requestId) =>
                        handleDelete("privacy-requests", requestId)
                      }
                    />
                  </Suspense>
                )}
                {activeTab === "temples" && (
                  <Suspense fallback={suspenseFallback}>
                    <AdminTemplesSection
                      temples={temples}
                      selectedIds={selectedIds}
                      selectAll={selectAll}
                      onToggleSelectAll={(checked) => {
                        setSelectAll(checked);
                        setSelectedIds(checked ? temples.map((temple) => temple.id) : []);
                      }}
                      onToggleSelect={handleToggleSelection}
                      onBulkDelete={() => handleBulkDelete("temples")}
                      onNew={() => {
                        setSelectedTemple(null);
                        setShowTempleModal(true);
                      }}
                      onEdit={(temple) => {
                        setSelectedTemple(temple);
                        setShowTempleModal(true);
                      }}
                      onDelete={(templeId) => handleDelete("temples", templeId)}
                    />
                  </Suspense>
                )}
                {showPersonalityModal && (
                  <Suspense fallback={suspenseFallback}>
                    <PersonalityFormModal
                      personality={selectedPersonality}
                      onClose={() => {
                        setShowPersonalityModal(false);
                        setSelectedPersonality(null);
                      }}
                      onSubmit={fetchPersonalities}
                    />
                  </Suspense>
                )}
                {showTempleModal && (
                  <Suspense fallback={suspenseFallback}>
                    <TempleFormModal
                      temple={selectedTemple}
                      onClose={() => {
                        setShowTempleModal(false);
                        setSelectedTemple(null);
                      }}
                      onSubmit={fetchTemples}
                    />
                  </Suspense>
                )}

                {activeTab === "articles" && (
                  <Suspense fallback={suspenseFallback}>
                    <ArticleManager />
                  </Suspense>
                )}
                {/* MENUS TAB */}
                {activeTab === "menus" && (
                  <div className="card shadow border-0 mb-7">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Dynamic Site Menus</h5>
                      <div className="d-flex gap-2 align-items-center">
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={selectedIds.length === 0}
                          onClick={() => handleBulkDelete("menus")}
                        >
                          Delete Selected ({selectedIds.length})
                        </button>
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
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                checked={selectAll && menus.length > 0 && menus.every((m) => selectedIds.includes(m.id))}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectAll(checked);
                                  setSelectedIds(checked ? menus.map((m) => m.id) : []);
                                }}
                              />
                            </th>
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
                                colSpan="8"
                                className="text-center text-muted py-4"
                              >
                                No menus yet.
                              </td>
                            </tr>
                          ) : (
                            menus.map((m) => (
                              <tr key={m.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(m.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSelectedIds((prev) =>
                                        checked
                                          ? [...prev, m.id]
                                          : prev.filter((id) => id !== m.id)
                                      );
                                    }}
                                  />
                                </td>
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
                                      let confirmed = false;
                                      await new Promise((resolve) => {
                                        popup.open({
                                          title: "Confirm Delete",
                                          message: "Delete this menu?",
                                          type: "confirm",
                                          onConfirm: () => {
                                            confirmed = true;
                                            resolve();
                                          },
                                          onCancel: () => {
                                            resolve();
                                          },
                                        });
                                      });
                                      if (confirmed) {
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

                    <Suspense fallback={suspenseFallback}>
                      <AdminMenuModal
                        menu={selectedMenu}
                        onClose={() => setSelectedMenu(null)}
                        onChange={handleSelectedMenuChange}
                        onSubmit={handleSaveMenu}
                      />
                    </Suspense>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <AdminSubmissionDetailsModal
          show={showModal}
          submission={selectedSubmission}
          activeTab={activeTab}
          onClose={handleCloseModal}
        />
      </Suspense>
      {/* DETAILS MODAL */}

      <Suspense fallback={null}>
        <AdminReplyModal
          replyTarget={replyTarget}
          replyForm={replyForm}
          onChange={handleReplyFormChange}
          onClose={handleCloseReplyModal}
          onSend={handleSendReply}
        />
      </Suspense>
      <div id="downloadCard" style={{ position: "fixed", top: "-20000px" }}></div>

    </div>
  
);
}
