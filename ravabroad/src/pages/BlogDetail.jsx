// C:\My Data\Ravidassia Abroad\ravabroad\src\pages\BlogDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Comments from "../components/Comments";
import { API_BASE } from "../utils/api";

const BegampuraHeading = () => (
  <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
    <div
      style={{
        flex: 1,
        height: "2px",
        background:
          "linear-gradient(to right, transparent, #e63946, transparent)",
      }}
    ></div>
    <img
      src="/template/img/6Qt0bpw3_400x400-removebg-preview.png"
      alt="Begampura Logo"
      style={{
        width: "55px",
        height: "55px",
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
    <h3 className="fw-bold text-uppercase mb-0">The Begampura News</h3>
    <div
      style={{
        flex: 1,
        height: "2px",
        background:
          "linear-gradient(to right, transparent, #e63946, transparent)",
      }}
    ></div>
  </div>
);

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);



  // 🧠 Fetch single post
  useEffect(() => {
    const fetchPost = async () => {

      try {
        const res = await fetch(`${API_BASE}/blogs/${slug}`);
        const data = await res.json();
              console.log("Fetched post:", data);

        if (!res.ok) throw new Error(data.message || "Blog not found");
        setPost(data);

        // 🟢 Fetch related posts from same category
        if (data.category_id) {
          fetchRelated(data.category_id, data.id);
        }
      } catch (err) {
        console.error("❌ Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  // 📰 Fetch related posts
  const fetchRelated = async (categoryId, excludeId) => {
    try {
      const res = await fetch(`${API_BASE}/blogs?category=${categoryId}`);
      const data = await res.json();
      
      const filtered = (data || []).filter((p) => p.id !== excludeId);
      
      setRelated(filtered.slice(0, 4)); // show up to 4
    } catch (err) {
      console.error("❌ Failed to load related posts:", err);
    }
  };

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
        <p className="text-muted mb-4">
          The article you’re looking for doesn’t exist or was removed.
        </p>
        <Link to="/blogs" className="btn btn-primary">
          ← Back to Blogs
        </Link>
      </div>
    );

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <BegampuraHeading />
      </div>

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
  <span className="mx-2">•</span>
  <span>
    <i className="bi bi-eye me-1"></i>
    {post.views || 0} views
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

            {/* 🗨️ Comments Section */}
            <Comments />

            {/* Divider */}
            <hr className="my-5 border border-2 border-primary opacity-25" />

            {/* 📰 Related Posts Section */}
            {related.length > 0 && (
              <section className="related-posts mt-5 py-4 border-top">
                <h4 className="fw-semibold mb-4 text-center">
                  📚 Related Posts
                </h4>
                <div className="row justify-content-center">
                  {related.map((p) => (
                    <div className="col-md-6 col-lg-4 mb-4" key={p.id}>
                      <Link
                        to={`/blogs/${p.slug}`}
                        className="text-decoration-none text-dark"
                      >
                        <div className="card h-100 shadow-sm border-0">
                          <img
                            src={
                              p.image_url ||
                              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
                            }
                            className="card-img-top rounded-top"
                            alt={p.title}
                            style={{
                              height: "200px",
                              objectFit: "cover",
                            }}
                          />
                          <div className="card-body">
                            <p className="small text-muted mb-1">
                              {p.category_name || "General"} •{" "}
                              {new Date(p.created_at).toLocaleDateString()}
                            </p>
                            <h6 className="fw-semibold mb-2">{p.title}</h6>
                            <p
                              className="text-muted small mb-0"
                              dangerouslySetInnerHTML={{
                                __html:
                                  p.excerpt?.length > 100
                                    ? p.excerpt.slice(0, 100) + "..."
                                    : p.excerpt || "",
                              }}
                            ></p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Back Button */}
            <div className="text-center mt-5">
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
