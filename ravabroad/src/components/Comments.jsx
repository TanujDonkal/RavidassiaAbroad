import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";
import "../css/Comments.css";
import { apiFetch } from "../utils/api";
import ComplianceNotice from "./ComplianceNotice";
import {
  GENERAL_COLLECTION_NOTICE,
  GUEST_COMMENT_CONSENT,
} from "../utils/compliance";
import { getStoredUser } from "../utils/auth";

const GUEST_COMMENT_KEY_STORAGE = "ra_guest_comment_key";

function countAllComments(items) {
  return items.reduce(
    (sum, item) => sum + 1 + (Array.isArray(item.replies) ? item.replies.length : 0),
    0
  );
}

function getOrCreateGuestCommentKey() {
  if (typeof window === "undefined") {
    return "guest-browser";
  }

  try {
    const existing = localStorage.getItem(GUEST_COMMENT_KEY_STORAGE);
    if (existing) {
      return existing;
    }

    const generated =
      window.crypto?.randomUUID?.() ||
      `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(GUEST_COMMENT_KEY_STORAGE, generated);
    return generated;
  } catch {
    return `guest-${Date.now()}`;
  }
}

function buildAvatarUrl(name) {
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
    name || "User"
  )}`;
}

function normalizeCommentThread(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((comment) => ({
    ...comment,
    like_count: Number(comment.like_count || 0),
    liked_by_current_user: Boolean(comment.liked_by_current_user),
    replies: normalizeCommentThread(comment.replies),
  }));
}

function updateCommentTree(items, targetId, updater) {
  return items.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }

    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentTree(comment.replies, targetId, updater),
      };
    }

    return comment;
  });
}

export default function Comments({ postId: initialPostId = null, postType }) {
  const location = useLocation();
  const { slug } = useParams();
  const popup = usePopup();
  const user = getStoredUser() || {};
  const [guestKey] = useState(() => getOrCreateGuestCommentKey());

  const resolvedType =
    postType || (location.pathname.includes("/articles") ? "articles" : "blogs");

  const [comments, setComments] = useState([]);
  const [postId, setPostId] = useState(initialPostId);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [identity, setIdentity] = useState({
    name: "",
    email: "",
    consent_given: false,
  });
  const [newCommentText, setNewCommentText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [submittingRoot, setSubmittingRoot] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [likingCommentId, setLikingCommentId] = useState(null);

  useEffect(() => {
    setPostId(initialPostId || null);
  }, [initialPostId]);

  useEffect(() => {
    let cancelled = false;

    const loadComments = async (resolvedPostId) => {
      const data = await apiFetch(`/${resolvedType}/${resolvedPostId}/comments`, {
        headers: guestKey ? { "X-Guest-Key": guestKey } : undefined,
      });
      if (cancelled) return;

      const normalized = normalizeCommentThread(data);
      setComments(normalized);
      setExpandedReplies(
        normalized.reduce((acc, comment) => {
          acc[comment.id] = false;
          return acc;
        }, {})
      );
    };

    const fetchAll = async () => {
      setLoading(true);
      setFetchError("");
      try {
        let resolvedPostId = initialPostId;

        if (!resolvedPostId) {
          const post = await apiFetch(`/${resolvedType}/${slug}`);
          if (!post?.id) {
            throw new Error("Post not found");
          }
          resolvedPostId = post.id;
          if (!cancelled) {
            setPostId(post.id);
          }
        }

        await loadComments(resolvedPostId);
      } catch (err) {
        if (!cancelled) {
          console.error("Comments fetch error:", err);
          setFetchError(err.message || "Could not load comments right now.");
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [guestKey, initialPostId, resolvedType, slug]);

  const totalComments = countAllComments(comments);

  const resetGuestFieldsIfNeeded = () => {
    if (!user?.id) {
      setIdentity((current) => ({
        ...current,
        consent_given: false,
      }));
    }
  };

  const upsertComment = (createdComment, parentId = null) => {
    const normalizedComment = {
      ...createdComment,
      replies: Array.isArray(createdComment.replies) ? createdComment.replies : [],
    };

    if (!parentId) {
      setComments((prev) => [normalizedComment, ...prev]);
      setExpandedReplies((prev) => ({ ...prev, [normalizedComment.id]: false }));
      return;
    }

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), normalizedComment],
            }
          : comment
      )
    );
    setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
  };

  const removeCommentFromTree = (commentId) => {
    setComments((prev) =>
      prev
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: (comment.replies || []).filter((reply) => reply.id !== commentId),
        }))
    );
  };

  const applyLikeState = (commentId, liked, likeCount) => {
    setComments((prev) =>
      updateCommentTree(prev, commentId, (comment) => ({
        ...comment,
        liked_by_current_user: liked,
        like_count: likeCount,
      }))
    );
  };

  const handleDelete = (comment) => {
    popup.open({
      title: "Delete Comment?",
      message:
        user?.role === "admin" ||
        user?.role === "main_admin" ||
        user?.role === "moderate_admin"
          ? "This will permanently remove the comment."
          : "This will remove your comment and any replies attached to it.",
      type: "confirm",
      onConfirm: async () => {
        try {
          const isAdmin =
            user?.role === "admin" ||
            user?.role === "main_admin" ||
            user?.role === "moderate_admin";

          await apiFetch(
            isAdmin
              ? `/${resolvedType}/comments/${comment.id}`
              : `/${resolvedType}/comments/${comment.id}/delete`,
            {
              method: isAdmin ? "DELETE" : "PATCH",
            }
          );

          removeCommentFromTree(comment.id);
          popup.open({
            title: "Deleted",
            message: isAdmin
              ? "Comment deleted successfully."
              : "Your comment was removed successfully.",
            type: "success",
          });
        } catch (err) {
          console.error("Comment delete error:", err);
          popup.open({
            title: "Error",
            message: err.message || "Failed to delete comment.",
            type: "error",
          });
        }
      },
    });
  };

  const validateGuestComment = () => {
    if (user?.id) return true;
    if (!identity.name.trim() || !identity.email.trim()) {
      popup.open({
        title: "Missing details",
        message: "Please add your name and email before posting a comment.",
        type: "warning",
      });
      return false;
    }
    if (!identity.consent_given) {
      popup.open({
        title: "Consent required",
        message: "Please confirm the guest comment consent before posting.",
        type: "warning",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event, parentId = null) => {
    event.preventDefault();

    const activeText = parentId
      ? String(replyDrafts[parentId] || "").trim()
      : newCommentText.trim();

    if (!activeText || !postId) {
      return;
    }

    if (!validateGuestComment()) {
      return;
    }

    const payload = {
      name: user?.name || identity.name.trim(),
      email: user?.email || identity.email.trim(),
      comment_text: activeText,
      parent_id: parentId,
      consent_given: user?.id ? true : identity.consent_given,
    };

    try {
      if (parentId) {
        setSubmittingReplyId(parentId);
      } else {
        setSubmittingRoot(true);
      }

      const data = await apiFetch(`/${resolvedType}/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdComment = {
        ...(data.comment || {}),
        name: data.comment?.name || payload.name,
        comment_text: data.comment?.comment_text || payload.comment_text,
        created_at: data.comment?.created_at || new Date().toISOString(),
        photo_url: data.comment?.photo_url || null,
        like_count: Number(data.comment?.like_count || 0),
        liked_by_current_user: Boolean(data.comment?.liked_by_current_user),
        replies: Array.isArray(data.comment?.replies) ? data.comment.replies : [],
      };

      upsertComment(createdComment, parentId);

      if (parentId) {
        setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
        setReplyingTo(null);
      } else {
        setNewCommentText("");
      }

      resetGuestFieldsIfNeeded();
    } catch (err) {
      console.error("Comment submit error:", err);
      popup.open({
        title: "Could not post comment",
        message: err.message || "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setSubmittingRoot(false);
      setSubmittingReplyId(null);
    }
  };

  const handleToggleLike = async (comment) => {
    if (!comment?.id || likingCommentId === comment.id) {
      return;
    }

    try {
      setLikingCommentId(comment.id);
      const response = await apiFetch(`/${resolvedType}/comments/${comment.id}/like`, {
        method: "POST",
        headers: guestKey ? { "X-Guest-Key": guestKey } : undefined,
        body: JSON.stringify(user?.id ? {} : { guest_key: guestKey }),
      });

      applyLikeState(
        comment.id,
        Boolean(response.liked),
        Number(response.like_count || 0)
      );
    } catch (err) {
      console.error("Comment like error:", err);
      popup.open({
        title: "Could not update like",
        message: err.message || "Please try again in a moment.",
        type: "error",
      });
    } finally {
      setLikingCommentId(null);
    }
  };

  const renderComment = (comment, isReply = false) => {
    const isAdmin =
      user?.role === "admin" ||
      user?.role === "main_admin" ||
      user?.role === "moderate_admin";
    const canDelete = isAdmin || (user?.id && user.id === comment.user_id);
    const isExpanded = Boolean(expandedReplies[comment.id]);
    const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;

    return (
      <article
        className={`comment-card ${isReply ? "comment-card-reply" : ""}`}
        key={comment.id}
      >
        <div className="comment-avatar">
          <img
            src={comment.photo_url || buildAvatarUrl(comment.name)}
            alt={comment.name || "Community member"}
          />
        </div>

        <div className="comment-main">
          <header className="comment-head">
            <div>
              <h5>{comment.name || "Anonymous"}</h5>
              <p>
                {new Date(comment.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </header>

          <div className="comment-body">
            <p>{comment.comment_text}</p>
          </div>

          <div className="comment-actions">
            <button
              type="button"
              className={`comment-action-btn ${comment.liked_by_current_user ? "active" : ""}`}
              onClick={() => handleToggleLike(comment)}
              disabled={likingCommentId === comment.id}
            >
              {likingCommentId === comment.id
                ? "Updating..."
                : comment.liked_by_current_user
                  ? "Liked"
                  : "Like"}
              <span className="comment-action-count">{Number(comment.like_count || 0)}</span>
            </button>

            <button
              type="button"
              className="comment-action-btn"
              onClick={() =>
                setReplyingTo((current) => (current === comment.id ? null : comment.id))
              }
            >
              Reply
            </button>

            {canDelete && (
              <button
                type="button"
                className="comment-action-btn danger"
                onClick={() => handleDelete(comment)}
              >
                Delete
              </button>
            )}

            {replyCount > 0 && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() =>
                  setExpandedReplies((prev) => ({
                    ...prev,
                    [comment.id]: !prev[comment.id],
                  }))
                }
              >
                {isExpanded ? `Hide replies (${replyCount})` : `Show replies (${replyCount})`}
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="comment-reply-form">
              <div className="comment-reply-note">
                Replying to <strong>{comment.name || "Anonymous"}</strong>
              </div>

              {!user?.id && (
                <div className="guest-comment-fields">
                  <ComplianceNotice text={GENERAL_COLLECTION_NOTICE} className="mb-2" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your name"
                    value={identity.name}
                    onChange={(event) =>
                      setIdentity((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Your email"
                    value={identity.email}
                    onChange={(event) =>
                      setIdentity((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                  <label className="comment-consent">
                    <input
                      type="checkbox"
                      checked={identity.consent_given}
                      onChange={(event) =>
                        setIdentity((prev) => ({
                          ...prev,
                          consent_given: event.target.checked,
                        }))
                      }
                    />
                    <span>{GUEST_COMMENT_CONSENT}</span>
                  </label>
                </div>
              )}

              <form onSubmit={(event) => handleSubmit(event, comment.id)}>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Write your reply..."
                  value={replyDrafts[comment.id] || ""}
                  onChange={(event) =>
                    setReplyDrafts((prev) => ({
                      ...prev,
                      [comment.id]: event.target.value,
                    }))
                  }
                  required
                />
                <div className="comment-form-actions">
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={submittingReplyId === comment.id}
                  >
                    {submittingReplyId === comment.id ? "Posting..." : "Post Reply"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {replyCount > 0 && isExpanded && (
            <div className="comment-replies">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="comments-shell" id="comments">
      <div className="comments-header">
        <div>
          <span className="comments-kicker">Community Discussion</span>
          <h3>Comments</h3>
          <p>
            {totalComments > 0
              ? `${totalComments} comment${totalComments === 1 ? "" : "s"} from readers and community members.`
              : "Start the conversation with a thoughtful community comment."}
          </p>
        </div>
      </div>

      <div className="comments-form-card">
        <h4>Join the discussion</h4>
        {!user?.id && (
          <>
            <ComplianceNotice text={GENERAL_COLLECTION_NOTICE} />
            <div className="guest-comment-fields">
              <input
                type="text"
                className="form-control"
                placeholder="Your name"
                value={identity.name}
                onChange={(event) =>
                  setIdentity((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
              <input
                type="email"
                className="form-control"
                placeholder="Your email"
                value={identity.email}
                onChange={(event) =>
                  setIdentity((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </div>
            <label className="comment-consent">
              <input
                type="checkbox"
                checked={identity.consent_given}
                onChange={(event) =>
                  setIdentity((prev) => ({
                    ...prev,
                    consent_given: event.target.checked,
                  }))
                }
              />
              <span>{GUEST_COMMENT_CONSENT}</span>
            </label>
          </>
        )}

        <form onSubmit={(event) => handleSubmit(event, null)}>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Share a respectful thought, question, or reflection..."
            value={newCommentText}
            onChange={(event) => setNewCommentText(event.target.value)}
            required
          />
          <div className="comment-form-actions">
            <button type="submit" className="btn btn-warning" disabled={submittingRoot}>
              {submittingRoot ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="comments-status-card">Loading comments...</div>
      ) : fetchError ? (
        <div className="comments-status-card error">{fetchError}</div>
      ) : comments.length === 0 ? (
        <div className="comments-status-card">
          No comments yet. Be the first to share something helpful.
        </div>
      ) : (
        <div className="comments-list">{comments.map((comment) => renderComment(comment))}</div>
      )}
    </section>
  );
}
