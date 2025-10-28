import React, { useEffect, useState, useRef, useLayoutEffect } from "react";

import { useParams, Link, useLocation } from "react-router-dom";
import { API_BASE } from "../utils/api";
import Comments from "../components/Comments";
import "../css/ArticleDetail.css";

export default function PostDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileTOCOpen, setMobileTOCOpen] = useState(false);
  const progressRef = useRef();

  const isBlog = location.pathname.includes("/blogs");

  // 🧠 Fetch post or article
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      try {
        const url = isBlog
          ? `${API_BASE}/blogs/${slug}`
          : `${API_BASE}/articles/${slug}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setPost(data);

        // Extract headings for Table of Contents
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.content || "", "text/html");
        const list = Array.from(doc.querySelectorAll("h2, h3")).map((el) => ({
          id: el.textContent.replace(/\s+/g, "-").toLowerCase(),
          text: el.textContent,
          level: el.tagName,
        }));
        setHeadings(list);
      } catch (err) {
        console.error("❌ Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, isBlog]);

  // 📊 Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      if (progressRef.current) progressRef.current.style.width = `${progress}%`;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🧭 Scroll spy to highlight active section
  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHeading(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // 🧩 Automatically inject heading IDs after article is rendered
  useLayoutEffect(() => {
    if (!post?.content) return;
    const articleContainer = document.querySelector(".article-body");
    if (!articleContainer) return;

    const allHeadings = articleContainer.querySelectorAll("h2, h3");
    allHeadings.forEach((el) => {
      const id = el.textContent.trim().replace(/\s+/g, "-").toLowerCase();
      el.id = id;
    });
  }, [post]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileTOCOpen(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );

  if (!post)
    return (
      <div className="text-center py-5">
        <h3 className="fw-bold text-danger">Not Found</h3>
        <Link to="/" className="btn btn-outline-primary mt-3">
          ← Back Home
        </Link>
      </div>
    );

  return (
    <>
      {/* Reading Progress Bar */}
      <div ref={progressRef} className="progress-bar-top"></div>

      <main className="container py-5 article-container">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="fw-bold text-primary">{post.title}</h1>
          {isBlog && post.category_name && (
            <p className="text-muted small mb-1">
              {post.category_name} •{" "}
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          )}
          {post.image_url && (
            <div className="text-center my-4">
              <img
                src={post.image_url}
                alt={post.title}
                className="img-fluid rounded-4 shadow-sm article-hero"
                style={{
                  maxHeight: "600px",
                  width: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>

        <div className="row">
          {/* Desktop TOC */}
          {headings.length > 0 && (
            <aside className="col-lg-3 mb-4 d-none d-lg-block">
              <div className="toc-box shadow-sm p-3 rounded bg-white sticky-top">
                <h6 className="fw-bold text-primary mb-2">Table of Contents</h6>
                <ul className="list-unstyled small mb-0">
                  {headings.map((h) => (
                    <li
                      key={h.id}
                      className={`mb-1 ${h.level === "H3" ? "ms-3" : ""} ${
                        activeHeading === h.id ? "fw-bold text-primary" : ""
                      }`}
                    >
                      <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => scrollTo(h.id)}
                      >
                        • {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Content */}
          <article className="col-lg-9">
            <div
              className="article-body bg-white p-4 rounded shadow-sm border border-light-subtle"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Comments */}
            
              <section className="mt-5">
                <h4 className="fw-semibold text-primary mb-3">💬 Comments</h4>
                <Comments />
              </section>
            
          </article>
        </div>
      </main>

      {/* Floating TOC Button (mobile) */}
      {headings.length > 0 && (
        <button
          className="btn btn-primary rounded-circle toc-fab shadow-lg d-lg-none"
          onClick={() => setMobileTOCOpen(true)}
        >
          📑
        </button>
      )}

      {/* Mobile TOC Drawer */}
      {mobileTOCOpen && (
        <div
          className="mobile-toc-overlay"
          onClick={() => setMobileTOCOpen(false)}
        >
          <div
            className="mobile-toc bg-white shadow-lg p-4 rounded-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-primary mb-0">Table of Contents</h5>
              <button
                className="btn-close"
                onClick={() => setMobileTOCOpen(false)}
              ></button>
            </div>
            <ul className="list-unstyled small">
              {headings.map((h) => (
                <li
                  key={h.id}
                  className={`mb-2 ${h.level === "H3" ? "ms-3" : ""} ${
                    activeHeading === h.id ? "fw-bold text-primary" : ""
                  }`}
                >
                  <button
                    className="btn btn-link p-0 text-decoration-none text-secondary"
                    onClick={() => scrollTo(h.id)}
                  >
                    • {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
