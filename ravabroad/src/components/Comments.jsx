import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";
import "../css/Comments.css";
import { API_BASE } from "../utils/api";

export default function Comments() {
  const { slug } = useParams();
  const popup = usePopup();

  const [comments, setComments] = useState([]);
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", comment_text: "" });
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🧭 scroll helper
  const scrollToElement = (id) => {
    const el = document.getElementById(`reply-form-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 🧠 Fetch blog + comments
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const postRes = await fetch(`${API_BASE}/blogs/${slug}`);
        const post = await postRes.json();
        if (!post.id) return;
        setPostId(post.id);

        const res = await fetch(`${API_BASE}/blogs/${post.id}/comments`);
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
  }, [slug]);

  // 🧩 Delete comment — soft for user, hard for admin
  const handleUserDelete = (commentId) => {
    popup.open({
      title: "🗑 Delete Comment?",
      message:
        user?.role === "admin" ||
        user?.role === "main_admin" ||
        user?.role === "moderate_admin"
          ? "You are deleting this comment permanently. This action cannot be undone."
          : "Are you sure you want to delete this comment? It will be hidden from everyone but still visible to admins.",
      type: "confirm",
      onConfirm: async () => {
        try {
          const endpoint =
            user?.role === "admin" ||
            user?.role === "main_admin" ||
            user?.role === "moderate_admin"
              ? `${API_BASE}/blogs/comments/${commentId}` // DELETE for admins
              : `${API_BASE}/blogs/comments/${commentId}/delete`; // PATCH for users    

          // Get token from localStorage (set during login)
const token = localStorage.getItem("token") || (user?.token ? user.token : null);

          const res = await fetch(endpoint, {
            method:
              user?.role === "admin" ||
              user?.role === "main_admin" ||
              user?.role === "moderate_admin"
                ? "DELETE"
                : "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          });

          if (!res.ok) throw new Error("Failed to delete comment");
          // Remove comment (top-level or nested) instantly without refresh
          setComments((prev) =>
            prev
              .map((c) => {
                // if this is the deleted comment → remove it
                if (c.id === commentId) return null;
                // otherwise, check and filter its replies
                const updatedReplies =
                  c.replies?.filter((r) => r.id !== commentId) || [];
                return { ...c, replies: updatedReplies };
              })
              .filter(Boolean)
          );

          popup.open({
            title: "✅ Deleted",
            message:
              user?.role === "admin" ||
              user?.role === "main_admin" ||
              user?.role === "moderate_admin"
                ? "Comment permanently deleted from database."
                : "Your comment was deleted successfully (soft delete).",
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

    const commentData = {
      user_id: user?.id || null,
      name: user?.name || form.name,
      email: user?.email || form.email,
      comment_text: form.comment_text,
      parent_id, post_id: postId,
    };

    try {
      const res = await fetch(`${API_BASE}/blogs/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const newComment = {
        id: Date.now(),
        ...commentData,
        created_at: new Date().toISOString(),
        replies: [],
        showReplies: true,
      };

      if (parent_id) {
        // ✅ Replying to a comment
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
        setComments((prev) => [{ ...newComment }, ...prev]);
      }

      setForm({ name: "", email: "", comment_text: "" });
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

  // 🧩 Render a comment (and nested replies)
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

          <p>{c.comment_text}</p>

          <div className="content-footer d-flex gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => toggleReplyForm(c.id)}
            >
              💬 Reply
            </button>
            {user?.id && user?.id === c.user_id && (
              <button
                className="btn btn-outline btn-sm text-danger"
                onClick={() => handleUserDelete(c.id)}
              >
                🗑 Delete
              </button>
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

          {/* Replies (collapsible) */}
          {c.replies && c.replies.length > 0 && c.showReplies && (
            <div className="reply-thread">
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
