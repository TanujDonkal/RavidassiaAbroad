import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../index.css";
import "../css/Blogs.css";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { API_BASE } from "../utils/api";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema, stripHtml, truncateText } from "../utils/seo";

const FALLBACK_ARTICLE_SUMMARY =
  "Explore heritage, teachings, and community stories curated by Ravidassia Abroad.";

const FEATURED_VIDEO_URL = "https://www.youtube.com/embed/6GrG6IOJRLs?autoplay=1&mute=1";

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

function normalizeFeedItem(post, fallbackToArticles = false) {
  const isFallbackArticle = fallbackToArticles || !Object.prototype.hasOwnProperty.call(post, "status");
  const createdAt = post.updated_at || post.created_at || new Date().toISOString();

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || FALLBACK_ARTICLE_SUMMARY,
    image_url:
      post.image_url ||
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    created_at: createdAt,
    views: typeof post.views === "number" ? post.views : null,
    author_name: post.author_name || "Ravidassia Abroad",
    category_name: post.category_name || (isFallbackArticle ? "Featured Article" : "General"),
    href: isFallbackArticle ? `/articles/${post.slug}` : `/blogs/${post.slug}`,
    isFallbackArticle,
  };
}

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [fallbackArticles, setFallbackArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategories();
    fetchBlogs();
    // The page intentionally loads its initial feed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchFallbackArticles = async () => {
    try {
      const res = await fetch(`${API_BASE}/articles`);
      const data = await res.json();
      setFallbackArticles(
        Array.isArray(data) ? data.map((item) => normalizeFeedItem(item, true)) : []
      );
    } catch (err) {
      console.error("Failed to load article fallback:", err);
      setFallbackArticles([]);
    }
  };

  const fetchBlogs = async (category = "") => {
    setLoading(true);
    setShowFallbackMessage(false);

    try {
      const url = category
        ? `${API_BASE}/blogs?category=${category}`
        : `${API_BASE}/blogs`;

      const res = await fetch(url);
      const data = await res.json();
      const normalizedBlogs = Array.isArray(data)
        ? data.map((item) => normalizeFeedItem(item))
        : [];

      setBlogs(normalizedBlogs);

      if (!category && normalizedBlogs.length === 0) {
        await fetchFallbackArticles();
        setShowFallbackMessage(true);
      } else {
        setFallbackArticles([]);
      }
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      setBlogs([]);
      if (!category) {
        await fetchFallbackArticles();
        setShowFallbackMessage(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const contentItems = useMemo(() => {
    if (blogs.length > 0) return blogs;
    if (!selectedCategory && fallbackArticles.length > 0) return fallbackArticles;
    return [];
  }, [blogs, fallbackArticles, selectedCategory]);

  const isUsingFallbackArticles =
    !loading && blogs.length === 0 && !selectedCategory && fallbackArticles.length > 0;

  const seoItems = contentItems.slice(0, 10);

  return (
    <main className="gray-bg">
      <Seo
        title="Blogs and Community News | Ravidassia Abroad"
        description="Read community blogs, news, cultural stories, and featured articles from Ravidassia Abroad."
        canonicalPath="/blogs"
        type="blog"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Ravidassia Abroad Blogs",
            description:
              "Community blogs, news, and featured articles from Ravidassia Abroad.",
            url: "https://www.ravidassiaabroad.com/blogs",
            blogPost: seoItems.map((post) => ({
              "@type": "BlogPosting",
              headline: post.title,
              url: `https://www.ravidassiaabroad.com${post.href}`,
              datePublished: post.created_at,
              image: post.image_url || "https://www.ravidassiaabroad.com/logo512.png",
              description: truncateText(stripHtml(post.excerpt || ""), 160),
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: seoItems.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://www.ravidassiaabroad.com${post.href}`,
              name: post.title,
            })),
          },
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blogs", path: "/blogs" },
          ]),
        ]}
      />

      <section className="trending-area pt-25 gray-bg">
        <div className="container">
          <div className="section-tittle mb-4 text-center">
            <BegampuraHeading />
          </div>

          <div className="text-center my-4">
            <div className="d-inline-flex flex-wrap justify-content-center gap-2">
              <button
                className={`btn btn-sm ${
                  selectedCategory === "" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setSelectedCategory("");
                  fetchBlogs("");
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn btn-sm ${
                    selectedCategory === cat.id ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    fetchBlogs(cat.id);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {showFallbackMessage && isUsingFallbackArticles && (
            <div className="alert alert-warning border-0 rounded-4 shadow-sm mb-4">
              Community blog posts are being refreshed. In the meantime, here are featured
              articles from our history and teachings library.
            </div>
          )}

          {loading ? (
            <p className="text-center text-muted">Loading latest posts...</p>
          ) : contentItems.length === 0 ? (
            <div className="text-center text-muted bg-white rounded-4 shadow-sm p-4">
              <p className="mb-2 fw-semibold">No published posts are available right now.</p>
              <p className="mb-3">
                Please check back soon, or explore the history and article sections instead.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to="/history" className="btn btn-outline-dark rounded-pill px-4">
                  Explore History
                </Link>
                <Link
                  to="/articles/guru-ravidass"
                  className="btn btn-primary rounded-pill px-4"
                >
                  Read Featured Article
                </Link>
              </div>
            </div>
          ) : (
            <Swiper
              spaceBetween={30}
              slidesPerView={2}
              loop={contentItems.length > 2}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              navigation={true}
              modules={[Autoplay, Pagination, Navigation]}
              className="mySwiper"
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }}
            >
              {contentItems.map((post) => (
                <SwiperSlide key={`${post.isFallbackArticle ? "article" : "blog"}-${post.id}`}>
                  <Link to={post.href} className="text-decoration-none text-dark">
                    <div className="blog-card">
                      <div className="card-banner">
                        <p
                          className={`category-tag ${
                            post.category_name ? "popular" : ""
                          }`}
                        >
                          {post.category_name || "General"}
                        </p>
                        <img className="banner-img" src={post.image_url} alt={post.title} />
                      </div>
                      <div className="card-body">
                        <h5 className="blog-title">{post.title}</h5>
                        <p
                          className="blog-description"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(post.excerpt || ""),
                          }}
                        ></p>
                        <div className="card-profile">
                          <img
                            className="profile-img"
                            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                            alt={post.author_name || "Admin"}
                          />
                          <div className="card-profile-info">
                            <h6 className="profile-name mb-0">{post.author_name}</h6>
                            <p className="profile-followers mb-0 small text-muted">
                              {new Date(post.created_at).toLocaleDateString()}
                              {typeof post.views === "number" ? ` • Views ${post.views}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      <section className="whats-news-area pt-50 pb-20 gray-bg">
        <div className="container">
          <div className="whats-news-wrapper">
            <div className="section-tittle mb-30">
              <h3>Latest Highlights</h3>
            </div>
            <div className="row">
              {loading ? (
                <p className="text-center text-muted">Loading...</p>
              ) : contentItems.length === 0 ? (
                <p className="text-center text-muted">
                  No published updates are available right now.
                </p>
              ) : (
                contentItems.slice(0, 2).map((post) => (
                  <div className="col-lg-6 col-md-6" key={`latest-${post.id}`}>
                    <Link to={post.href} className="text-decoration-none text-dark">
                      <div className="whats-news-single mb-40">
                        <div className="whates-img">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="img-fluid rounded shadow-sm"
                          />
                        </div>
                        <div className="whates-caption">
                          <h4>{post.title}</h4>
                          <span>
                            {post.author_name} - {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(post.excerpt || ""),
                            }}
                          ></p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="youtube-area video-padding bg-light py-5">
        <div className="container text-center">
          <h3 className="mb-4">Featured Video</h3>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <iframe
                width="100%"
                height="420"
                src={FEATURED_VIDEO_URL}
                title="Ravidassia Abroad Overview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded shadow"
              ></iframe>
              <p className="mt-2 text-muted">
                Insight into Ravidassia Abroad community development and outreach.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
