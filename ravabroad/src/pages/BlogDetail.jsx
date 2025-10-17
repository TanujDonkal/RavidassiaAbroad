import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5000";

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blogs/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Blog not found");
        setPost(data);
      } catch (err) {
        console.error("❌ Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!post)
    return (
      <div className="text-center my-5">
        <h3 className="fw-bold text-danger">Blog not found</h3>
        <p className="text-muted mb-4">The article you’re looking for doesn’t exist or was removed.</p>
        <Link to="/blogs" className="btn btn-primary">
          ← Back to Blogs
        </Link>
      </div>
    );

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <article className="p-4 p-md-5 bg-white rounded-4 shadow-sm border border-light-subtle">
            {/* Blog Header */}
            <h1 className="fw-bold mb-3 text-center">{post.title}</h1>

            <div className="d-flex justify-content-center align-items-center mb-4 text-muted small flex-wrap">
              <span className="me-2">
                <i className="bi bi-person-circle me-1"></i>
                {post.author_name || "Admin"}
              </span>
              <span className="mx-2">•</span>
              <span>
                <i className="bi bi-calendar-event me-1"></i>
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Featured Image */}
            {post.image_url && (
              <div className="text-center mb-4">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="img-fluid rounded-4 shadow-sm border border-light"
                  style={{
                    maxHeight: "450px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div
              className="blog-content fs-5 lh-lg text-secondary"
              style={{ whiteSpace: "pre-line" }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Divider */}
            <hr className="my-5 border border-2 border-primary opacity-25" />

            {/* Back Button */}
            <div className="text-center">
              <Link
                to="/blogs"
                className="btn btn-outline-primary px-4 py-2 rounded-pill"
              >
                ← Back to All Blogs
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
