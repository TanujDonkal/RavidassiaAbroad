// src/pages/AdminDashboard.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { bulkDeleteAdminItems, deleteSubmission, updateUserRole } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { getRecipients, apiFetch } from "../utils/api";
import "../css/webpixels.css";
import html2canvas from "html2canvas";

const ADMIN_TABS = new Set([
  "dashboard",
  "users",
  "submissions",
  "recipients",
  "matrimonial",
  "contentRequests",
  "privacyRequests",
  "blogs",
  "categories",
  "menus",
  "personalities",
  "temples",
  "articles",
]);

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

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("adminActiveTab");
    return ADMIN_TABS.has(savedTab) ? savedTab : "dashboard";
  });
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

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

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

  const handleDownloadInstagramAsset = async (data, format = "post") => {
    const width = 1080;
    const height = format === "reel" ? 1920 : 1350;
    const photoSize = format === "reel" ? 320 : 250;
    const photoUrl = data.photo_url || "/template/img/no-photo.svg";
    const subtitleParts = [data.gender, data.marital_status, data.country_living]
      .filter(Boolean)
      .map((item) => escapeHtml(item));
    const highlightChips = [
      data.education,
      data.occupation,
      data.status_type,
      data.city_living,
    ]
      .filter(Boolean)
      .slice(0, format === "reel" ? 4 : 3)
      .map(
        (item) => `
          <div style="padding:12px 18px; border-radius:999px; background:rgba(255, 255, 255, 0.12); border:1px solid rgba(255,255,255,0.16); color:#fff7ed; font-size:${format === "reel" ? 22 : 20}px; font-weight:700; letter-spacing:0.02em;">
            ${escapeHtml(item)}
          </div>
        `
      )
      .join("");

    const sections = [
      buildInstagramSection(
        "Personal",
        ["dob", "height", "caste", "complexion", "religion_beliefs"],
        data
      ),
      buildInstagramSection(
        "Location",
        ["country_living", "city_living", "home_state_india", "status_type"],
        data
      ),
      buildInstagramSection(
        "Career",
        [
          "education",
          "occupation",
          "company_or_institution",
          "annual_income",
          "income_range",
        ],
        data
      ),
      buildInstagramSection(
        "Family",
        [
          "father_name",
          "father_occupation",
          "mother_name",
          "mother_occupation",
          "siblings",
          "family_type",
        ],
        data
      ),
      buildInstagramSection(
        "Partner Preference",
        [
          "partner_age_range",
          "partner_country",
          "partner_marital_status",
          "religion",
          "partner_expectations",
        ],
        data
      ),
    ]
      .filter(Boolean)
      .join("");

    const container = document.getElementById("downloadCard");
    if (!container) return;

    container.innerHTML = `
      <div style="width:${width}px; height:${height}px; position:relative; overflow:hidden; font-family:Arial, Helvetica, sans-serif; background:
        radial-gradient(circle at top left, rgba(251, 191, 36, 0.34), transparent 34%),
        radial-gradient(circle at top right, rgba(236, 72, 153, 0.22), transparent 28%),
        linear-gradient(160deg, #0f172a 0%, #172554 48%, #1d4ed8 100%);
        color:#ffffff; box-sizing:border-box;">
        <div style="position:absolute; inset:28px; border:1px solid rgba(255,255,255,0.12); border-radius:42px; background:linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));"></div>
        <div style="position:relative; z-index:1; height:100%; padding:${format === "reel" ? "64px 60px 58px" : "54px 54px 48px"}; box-sizing:border-box; display:flex; flex-direction:column;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:28px; margin-bottom:${format === "reel" ? "34px" : "26px"};">
            <div style="flex:1; min-width:0;">
              <div style="display:inline-flex; align-items:center; gap:10px; padding:10px 18px; border-radius:999px; background:rgba(251, 191, 36, 0.14); border:1px solid rgba(251, 191, 36, 0.34); color:#fde68a; font-size:20px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
                Ravidassia Abroad Matrimonial
              </div>
              <div style="margin-top:22px; font-size:${format === "reel" ? 74 : 58}px; font-weight:900; line-height:1.02; color:#ffffff; overflow-wrap:anywhere;">
                ${escapeHtml(data.name || "Community Profile")}
              </div>
              <div style="margin-top:14px; font-size:${format === "reel" ? 28 : 24}px; line-height:1.4; color:rgba(226, 232, 240, 0.95);">
                ${subtitleParts.join(" | ") || "Ravidassia Abroad matrimonial profile"}
              </div>
            </div>
            <div style="position:relative; flex:0 0 auto;">
              <div style="position:absolute; inset:-18px; border-radius:50%; background:radial-gradient(circle, rgba(251,191,36,0.45), transparent 68%);"></div>
              <img
                src="${escapeHtml(photoUrl)}"
                alt="${escapeHtml(data.name || "Matrimonial profile")}"
                style="position:relative; width:${photoSize}px; height:${photoSize}px; border-radius:36px; object-fit:cover; display:block; border:8px solid rgba(255,255,255,0.88); box-shadow:0 22px 58px rgba(15,23,42,0.42);"
              />
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:14px; margin-bottom:${format === "reel" ? "30px" : "24px"};">
            ${highlightChips}
          </div>

          <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:20px; align-content:start;">
            ${sections}
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:${format === "reel" ? "28px" : "22px"}; padding-top:18px; border-top:1px solid rgba(255,255,255,0.12);">
            <div style="font-size:22px; color:rgba(226, 232, 240, 0.95); font-weight:600;">
              Professionally formatted for Instagram ${format === "reel" ? "Reels" : "Posts"}
            </div>
            <div style="font-size:24px; letter-spacing:0.14em; text-transform:uppercase; color:#fbbf24; font-weight:900;">
              Ravidassia Abroad
            </div>
          </div>
        </div>
      </div>
    `;

    const exportNode = container.firstElementChild;
    if (!exportNode) return;

    const canvas = await html2canvas(exportNode, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const image = canvas.toDataURL("image/jpeg", 0.96);

    const link = document.createElement("a");
    link.href = image;
    link.download = `${(data.name || "matrimonial-profile")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${format}.jpg`;
    link.click();
    container.innerHTML = "";
  };

  const INSTAGRAM_LABELS = {
    ...MATRIMONIAL_LABELS,
    name: "Full Name",
    gender: "Gender",
    email: "Email",
    phone: "Phone / WhatsApp",
    father_name: "Father's Name",
    father_occupation: "Father's Occupation",
    mother_name: "Mother's Name",
    mother_occupation: "Mother's Occupation",
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatSubmissionValue = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    if (field === "dob") {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  };

  const buildInstagramSection = (title, fields, data) => {
    const rows = fields
      .map((field) => {
        const value = formatSubmissionValue(field, data[field]);
        if (!value) {
          return "";
        }

        return `
          <div style="display:grid; grid-template-columns:200px 1fr; gap:16px; padding:12px 0; border-bottom:1px solid rgba(148, 163, 184, 0.18);">
            <div style="font-size:20px; letter-spacing:0.08em; text-transform:uppercase; color:#cbd5f5; font-weight:700;">
              ${escapeHtml(INSTAGRAM_LABELS[field] || field.replaceAll("_", " "))}
            </div>
            <div style="font-size:26px; line-height:1.35; color:#f8fafc; font-weight:500; overflow-wrap:anywhere;">
              ${escapeHtml(value)}
            </div>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!rows) {
      return "";
    }

    return `
      <section style="background:rgba(15, 23, 42, 0.62); border:1px solid rgba(255, 255, 255, 0.1); border-radius:28px; padding:24px 28px; backdrop-filter:blur(14px); box-shadow:0 28px 60px rgba(15, 23, 42, 0.22);">
        <div style="font-size:22px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#fbbf24; margin-bottom:8px;">
          ${escapeHtml(title)}
        </div>
        ${rows}
      </section>
    `;
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

  const handleMatrimonialStatusChange = async (submissionId, moderationStatus) => {
    try {
      const data = await apiFetch(`/admin/matrimonial/${submissionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ moderation_status: moderationStatus }),
      });
      setMatrimonialSubs((prev) =>
        prev.map((submission) =>
          submission.id === submissionId ? data.submission : submission
        )
      );
      popup.open({
        title: "Updated",
        message: `Matrimonial submission marked as ${moderationStatus}.`,
        type: "success",
      });
    } catch (err) {
      popup.open({
        title: "Error",
        message: err.message,
        type: "error",
      });
    }
  };

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
      tab: "users",
    },
    {
      label: "SC/ST Submissions",
      value: submissions.length || 0,
      icon: "bi-file-earmark-text",
      color: "bg-info",
      tab: "submissions",
    },
    {
      label: "Recipients",
      value: recipients.length || 0,
      icon: "bi-envelope",
      color: "bg-success",
      tab: "recipients",
    },
    {
      label: "Matrimonial Entries",
      value: matrimonialSubs.length || 0,
      icon: "bi-heart",
      color: "bg-danger",
      tab: "matrimonial",
    },
    {
      label: "Global Temples",
      value: temples.length || 0,
      icon: "bi-building",
      color: "bg-dark",
      tab: "temples",
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
      <img src="${data.photo_url || "/template/img/no-photo.svg"}"
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
  void handleDownloadInstagramCard;

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
                        <div
                          className="card shadow border-0 h-100"
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveTab(s.tab)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveTab(s.tab);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.18s ease, box-shadow 0.18s ease",
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.transform = "translateY(-2px)";
                            event.currentTarget.style.boxShadow =
                              "0 1rem 2rem rgba(15, 23, 42, 0.12)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.transform = "translateY(0)";
                            event.currentTarget.style.boxShadow = "";
                          }}
                        >
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
                      onStatusChange={handleMatrimonialStatusChange}
                      onDownloadInstagramCard={handleDownloadInstagramAsset}
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
