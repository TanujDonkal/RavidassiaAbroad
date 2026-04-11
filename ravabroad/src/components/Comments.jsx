import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";
import "../css/Comments.css";
import { apiFetch, API_BASE } from "../utils/api";
import ComplianceNotice from "./ComplianceNotice";
import {
  GENERAL_COLLECTION_NOTICE,
  GUEST_COMMENT_CONSENT,
} from "../utils/compliance";
import { getStoredUser } from "../utils/auth";

export default function Comments() {
  const location = useLocation();
  const type = location.pathname.includes("/articles") ? "articles" : "blogs"; // auto-detect type
  const { slug } = useParams();
  const popup = usePopup();

  const [comments, setComments] = useState([]);
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    comment_text: "",
    consent_given: false,
  });
  const user = getStoredUser() || {};

  // 🧭 Scroll helper
  const scrollToElement = (id) => {
    const el = document.getElementById(`reply-form-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 🧠 Fetch post + comments
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // fetch post (blog or article) to get its internal ID
        const postRes = await fetch(`${API_BASE}/${type}/${slug}`);
        const post = await postRes.json();
        if (!post.id) return;
        setPostId(post.id);

        // fetch comments
        const res = await fetch(`${API_BASE}/${type}/${post.id}/comments`);
        const data = await res.json();

        // Add local "showReplies" property
        const withToggles = data.map((c) => ({ ...c, showReplies: false }));
        setComments(withToggles);
      } catch (err) {
        console.error("❌ Fetch comments error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug, type]);

  // 🧩 Delete comment — soft for user, hard for admin
  const handleUserDelete = (commentId) => {
    popup.open({
      title: "🗑 Delete Comment?",
      message:
        user?.role === "admin" ||
        user?.role === "main_admin" ||
        user?.role === "moderate_admin"
          ? "You are deleting this comment permanently."
          : "Are you sure you want to delete this comment? This will also remove its replies.",
      type: "confirm",
      onConfirm: async () => {
        try {
          const location = window.location.pathname;
          const type = location.includes("/articles") ? "articles" : "blogs";

          await apiFetch(
            user?.role === "admin" ||
              user?.role === "main_admin" ||
              user?.role === "moderate_admin"
              ? `/${type}/comments/${commentId}`
              : `/${type}/comments/${commentId}/delete`,
            {
              method:
                user?.role === "admin" ||
                user?.role === "main_admin" ||
                user?.role === "moderate_admin"
                  ? "DELETE"
                  : "PATCH",
            }
          );

          // ✅ Update UI instantly (remove from state)
          setComments((prev) =>
            prev
              .map((c) => {
                if (c.id === commentId) return null; // remove top-level
                const filteredReplies =
                  c.replies?.filter((r) => r.id !== commentId) || [];
                return { ...c, replies: filteredReplies };
              })
              .filter(Boolean)
          );

          popup.open({
            title: "✅ Deleted",
            message:
              user?.role === "admin" ||
              user?.role === "main_admin" ||
              user?.role === "moderate_admin"
                ? "Comment permanently deleted (cascade applied)."
                : "Your comment and its replies were deleted successfully.",
            type: "success",
          });
        } catch (err) {
          console.error("❌ Delete error:", err);
          popup.open({
            title: "Error",
            message: "Failed to delete comment. Please try again later.",
            type: "error",
          });
        }
      },
      onCancel: () => popup.close(),
    });
  };

  // 🧩 Submit comment or reply
  const handleSubmit = async (e, parent_id = null) => {
    e.preventDefault();
    if (!form.comment_text.trim()) return;
    if (!user?.id && !form.consent_given) {
      popup.open({
        title: "Consent required",
        message: "Please confirm the guest comment consent before posting.",
        type: "warning",
      });
      return;
    }

    const commentData = {
      name: user?.name || form.name,
      email: user?.email || form.email,
      comment_text: form.comment_text,
      parent_id,
      consent_given: user?.id ? true : form.consent_given,
    };

    try {
      const data = await apiFetch(`/${type}/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(commentData),
      });

      const newComment = {
        ...(data.comment || {}),
        ...commentData,
        created_at: new Date().toISOString(),
        replies: [],
        showReplies: true,
      };

      if (parent_id) {
        // ✅ Reply to a comment
        setComments((prev) =>
          prev.map((c) =>
            c.id === parent_id
              ? {
                  ...c,
                  replies: [newComment, ...(c.replies || [])],
                  showReplies: true,
                }
              : c
          )
        );
      } else {
        // ✅ New top-level comment
        setComments((prev) => [newComment, ...prev]);
      }

      setForm({ name: "", email: "", comment_text: "", consent_given: false });
      setReplyingTo(null);
    } catch (err) {
      console.error("❌ Comment submit error:", err);
      popup.open({
        title: "❌ Error",
        message: "Could not post comment. Try again later.",
        type: "error",
      });
    }
  };

  // 🧩 Toggle reply form
  const toggleReplyForm = (id) => {
    const newTarget = replyingTo === id ? null : id;
    setReplyingTo(newTarget);
    if (newTarget) {
      setTimeout(() => scrollToElement(newTarget), 150);
    }
  };

  // 🧩 Toggle replies visibility
  const toggleReplies = (id) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, showReplies: !c.showReplies } : c))
    );
  };

  // 🧩 Render single comment + replies
  const renderComment = (c, isReply = false) => (
    <div className={`comment mb-3 ${isReply ? "ms-5" : ""}`} key={c.id}>
      <div className="content">
        <div className="avatar">
          <img
            src={
              c.photo_url ||
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
                c.name || "User"
              )}`
            }
            alt={c.name}
          />
        </div>

        <div className="content-comment">
          <div className="user">
            <h5>{c.name || "Anonymous"}</h5>
            <span className="is-mute">
              {new Date(c.created_at).toLocaleDateString()}
            </span>
          </div>

          <p className="mb-2">{c.comment_text}</p>

          <div className="content-footer d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => toggleReplyForm(c.id)}
            >
              💬 Reply
            </button>
            {user?.id && (
              <>
                {/* 🔒 Admins can delete any comment */}
                {(user?.role === "admin" ||
                  user?.role === "main_admin" ||
                  user?.role === "moderate_admin") && (
                  <button
                    className="btn btn-outline btn-sm text-danger"
                    onClick={() => handleUserDelete(c.id)}
                  >
                    🗑 Delete
                  </button>
                )}

                {/* 👤 Regular users can only delete their own comments */}
                {user?.id === c.user_id &&
                  !(
                    user?.role === "admin" ||
                    user?.role === "main_admin" ||
                    user?.role === "moderate_admin"
                  ) && (
                    <button
                      className="btn btn-outline btn-sm text-danger"
                      onClick={() => handleUserDelete(c.id)}
                    >
                      🗑 Delete
                    </button>
                  )}
              </>
            )}

            {c.replies?.length > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => toggleReplies(c.id)}
              >
                {c.showReplies
                  ? `👁 Hide Replies (${c.replies.length})`
                  : `👁 See Replies (${c.replies.length})`}
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {replyingTo === c.id && (
            <div
              id={`reply-form-${c.id}`}
              className="mt-3 p-3 bg-light rounded-3 border reply-form-highlight"
            >
              <div className="small text-muted mb-2">
                Replying to <strong>@{c.name || "Anonymous"}</strong>
              </div>
              <form onSubmit={(e) => handleSubmit(e, c.id)}>
                {!user?.id && (
                  <>
                    <ComplianceNotice
                      text={GENERAL_COLLECTION_NOTICE}
                      className="mb-2"
                    />
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                    <input
                      type="email"
                      className="form-control mb-2"
                      placeholder="Your email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                    <div className="form-check mb-2">
                      <input
                        id={`guestReplyConsent-${c.id}`}
                        type="checkbox"
                        className="form-check-input"
                        checked={form.consent_given}
                        onChange={(e) =>
                          setForm({ ...form, consent_given: e.target.checked })
                        }
                        required
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`guestReplyConsent-${c.id}`}
                      >
                        {GUEST_COMMENT_CONSENT}
                      </label>
                    </div>
                  </>
                )}

                <textarea
                  className="form-control mb-2"
                  rows="2"
                  placeholder="Write your reply..."
                  value={form.comment_text}
                  onChange={(e) =>
                    setForm({ ...form, comment_text: e.target.value })
                  }
                  required
                />

                <div className="d-flex align-items-center gap-2">
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    Reply
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Replies section */}
          {c.replies && c.replies.length > 0 && c.showReplies && (
            <div className="reply-thread mt-3">
              <div className="reply-line"></div>
              <div className="reply-content">
                {c.replies.map((r) => renderComment(r, true))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="wrapper mt-5">
      <h4 className="mb-4 fw-semibold">💬 Comments</h4>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted">No comments yet. Be the first!</p>
      ) : (
        comments.map((c) => renderComment(c))
      )}

      {/* Top-level comment form */}
      <form onSubmit={(e) => handleSubmit(e, null)} className="mt-4">
        {!user?.id && (
          <>
            <ComplianceNotice text={GENERAL_COLLECTION_NOTICE} />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              className="form-control mb-2"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div className="form-check mb-3">
              <input
                id="guestCommentConsent"
                type="checkbox"
                className="form-check-input"
                checked={form.consent_given}
                onChange={(e) =>
                  setForm({ ...form, consent_given: e.target.checked })
                }
                required
              />
              <label className="form-check-label" htmlFor="guestCommentConsent">
                {GUEST_COMMENT_CONSENT}
              </label>
            </div>
          </>
        )}
        <textarea
          className="form-control mb-2"
          placeholder="Write a comment..."
          rows="3"
          value={form.comment_text}
          onChange={(e) => setForm({ ...form, comment_text: e.target.value })}
          required
        />
        <button type="submit" className="btn btn-primary px-4">
          Post Comment
        </button>
      </form>
    </div>
  );
}
