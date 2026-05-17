import React, { useEffect, useMemo, useState } from "react";
import "../index.css";
import "../css/Blogs.css";
import { Link } from "react-router-dom";
import { API_BASE } from "../utils/api";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema, stripHtml, truncateText } from "../utils/seo";

const FALLBACK_ARTICLE_SUMMARY =
  "Explore heritage, teachings, and community stories curated by Ravidassia Abroad.";

const FEATURED_VIDEO_URL =
  "https://www.youtube.com/embed/6GrG6IOJRLs?autoplay=1&mute=1";

function normalizeFeedItem(post, fallbackToArticles = false) {
  const isFallbackArticle =
    fallbackToArticles || !Object.prototype.hasOwnProperty.call(post, "status");
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
    category_name:
      post.category_name || (isFallbackArticle ? "Featured Article" : "General"),
    href: isFallbackArticle ? `/articles/${post.slug}` : `/blogs/${post.slug}`,
    isFallbackArticle,
  };
}

function formatDate(dateValue) {
  try {
    return new Date(dateValue).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently updated";
  }
}

function buildSummary(post, maxLength = 160) {
  return truncateText(stripHtml(post.excerpt || FALLBACK_ARTICLE_SUMMARY), maxLength);
}

function LoadingCard({ featured = false }) {
  return (
    <div className={`blogs-skeleton ${featured ? "blogs-skeleton-featured" : ""}`}>
      <div className="blogs-skeleton-media"></div>
      <div className="blogs-skeleton-line blogs-skeleton-line-sm"></div>
      <div className="blogs-skeleton-line"></div>
      <div className="blogs-skeleton-line"></div>
      <div className="blogs-skeleton-line blogs-skeleton-line-xs"></div>
    </div>
  );
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
  const featuredPost = contentItems[0] || null;
  const secondaryPosts = featuredPost ? contentItems.slice(1, 4) : [];
  const remainingPosts = featuredPost ? contentItems.slice(4) : [];
  const visibleGridPosts = remainingPosts.length > 0 ? remainingPosts : contentItems.slice(1);
  const selectedCategoryName =
    categories.find((cat) => String(cat.id) === String(selectedCategory))?.name || "";

  return (
    <main className="blogs-page gray-bg">
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

      <section className="blogs-hero-section">
        <div className="container">
          <div className="blogs-hero-shell">
            <div className="blogs-hero-copy">
              <span className="blogs-kicker">Community Stories and Updates</span>
              <h1>Browse blogs that are easier to read, scan, and revisit.</h1>
              <p>
                Follow Ravidassia Abroad updates, teachings, cultural reflections, and
                global community highlights in one cleaner reading space.
              </p>

              <div className="blogs-hero-pills">
                <span className="blogs-pill">
                  {selectedCategoryName || "All categories"}
                </span>
                <span className="blogs-pill">
                  {loading ? "Loading feed" : `${contentItems.length} stories available`}
                </span>
                <span className="blogs-pill">
                  {isUsingFallbackArticles ? "Article fallback active" : "Live blog feed"}
                </span>
              </div>

              <div className="blogs-hero-actions">
                <Link
                  to={featuredPost?.href || "/history"}
                  className="btn btn-warning rounded-pill px-4"
                >
                  {featuredPost ? "Read Featured Story" : "Explore History"}
                </Link>
                <Link to="/contact" className="btn btn-outline-dark rounded-pill px-4">
                  Share a Community Update
                </Link>
              </div>
            </div>

            <div className="blogs-hero-panel">
              <div className="blogs-hero-panel-card">
                <div className="blogs-hero-panel-label">Reading Focus</div>
                <h3>Highlights, teachings, and stories from the global sangat.</h3>
                <ul className="blogs-hero-list">
                  <li>Community blogs and public updates</li>
                  <li>Temple, heritage, and teachings coverage</li>
                  <li>Mobile-friendly reading with clearer navigation</li>
                </ul>
                <div className="blogs-hero-panel-foot">
                  <span>Ravidassia Abroad</span>
                  <span>Global community feed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blogs-controls-section">
        <div className="container">
          <div className="blogs-controls-shell">
            <div>
              <span className="blogs-section-kicker">Filter by category</span>
              <h2>Find the stories you want faster.</h2>
            </div>

            <div className="blogs-category-chips" role="tablist" aria-label="Blog categories">
              <button
                type="button"
                className={`blogs-category-chip ${selectedCategory === "" ? "active" : ""}`}
                onClick={() => {
                  setSelectedCategory("");
                  fetchBlogs("");
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`blogs-category-chip ${
                    String(selectedCategory) === String(cat.id) ? "active" : ""
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
            <div className="blogs-inline-note">
              Community blog posts are being refreshed. Featured articles from our
              teachings and history library are shown for now.
            </div>
          )}
        </div>
      </section>

      <section className="blogs-content-section pb-5">
        <div className="container">
          {loading ? (
            <div className="blogs-loading-layout">
              <LoadingCard featured={true} />
              <div className="blogs-loading-stack">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            </div>
          ) : contentItems.length === 0 ? (
            <div className="blogs-empty-state">
              <span className="blogs-section-kicker">No published posts yet</span>
              <h3>No stories are available in this section right now.</h3>
              <p>
                Please check back soon, or explore the history and teachings sections
                while the blog feed is being updated.
              </p>
              <div className="blogs-empty-actions">
                <Link to="/history" className="btn btn-outline-dark rounded-pill px-4">
                  Explore History
                </Link>
                <Link
                  to="/articles/guru-ravidass"
                  className="btn btn-warning rounded-pill px-4"
                >
                  Read Featured Article
                </Link>
              </div>
            </div>
          ) : (
            <>
              {featuredPost && (
                <div className="blogs-featured-layout">
                  <Link to={featuredPost.href} className="blogs-featured-card">
                    <div className="blogs-featured-media">
                      <img src={featuredPost.image_url} alt={featuredPost.title} />
                    </div>
                    <div className="blogs-featured-copy">
                      <div className="blogs-post-meta">
                        <span className="blogs-post-tag">
                          {featuredPost.category_name || "General"}
                        </span>
                        <span>{formatDate(featuredPost.created_at)}</span>
                        {typeof featuredPost.views === "number" && (
                          <span>{featuredPost.views} views</span>
                        )}
                      </div>
                      <h2>{featuredPost.title}</h2>
                      <p>{buildSummary(featuredPost, 220)}</p>
                      <div className="blogs-featured-foot">
                        <div>
                          <strong>{featuredPost.author_name}</strong>
                          <span>
                            {featuredPost.isFallbackArticle
                              ? "Featured article"
                              : "Latest blog update"}
                          </span>
                        </div>
                        <span className="blogs-read-link">Read story</span>
                      </div>
                    </div>
                  </Link>

                  <div className="blogs-spotlight-stack">
                    {secondaryPosts.length > 0 ? (
                      secondaryPosts.map((post) => (
                        <Link
                          key={`spotlight-${post.id}`}
                          to={post.href}
                          className="blogs-spotlight-card"
                        >
                          <div className="blogs-spotlight-image">
                            <img src={post.image_url} alt={post.title} />
                          </div>
                          <div className="blogs-spotlight-copy">
                            <div className="blogs-post-meta">
                              <span className="blogs-post-tag subtle">
                                {post.category_name || "General"}
                              </span>
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                            <h3>{post.title}</h3>
                            <p>{buildSummary(post, 110)}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="blogs-spotlight-empty">
                        More highlights will appear here as the feed grows.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {visibleGridPosts.length > 0 && (
                <section className="blogs-grid-section">
                  <div className="blogs-section-head">
                    <div>
                      <span className="blogs-section-kicker">More to explore</span>
                      <h3>Keep browsing the latest community reading.</h3>
                    </div>
                    <p>
                      Shorter cards help readers compare titles, dates, and categories at a
                      glance without losing context.
                    </p>
                  </div>

                  <div className="blogs-grid">
                    {visibleGridPosts.map((post) => (
                      <Link
                        to={post.href}
                        key={`${post.isFallbackArticle ? "article" : "blog"}-${post.id}`}
                        className="blogs-feed-card"
                      >
                        <div className="blogs-feed-image">
                          <img src={post.image_url} alt={post.title} />
                          <span className="blogs-post-tag floating">
                            {post.category_name || "General"}
                          </span>
                        </div>
                        <div className="blogs-feed-body">
                          <div className="blogs-post-meta compact">
                            <span>{formatDate(post.created_at)}</span>
                            {typeof post.views === "number" && (
                              <span>{post.views} views</span>
                            )}
                          </div>
                          <h4>{post.title}</h4>
                          <p>{buildSummary(post, 120)}</p>
                          <div className="blogs-feed-foot">
                            <span>{post.author_name}</span>
                            <span className="blogs-read-link">Read more</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>

      <section className="blogs-video-section">
        <div className="container">
          <div className="blogs-video-shell">
            <div className="blogs-video-copy">
              <span className="blogs-section-kicker">Featured Video</span>
              <h3>Watch a quick community overview alongside the written stories.</h3>
              <p>
                This section gives readers another way to connect with the mission,
                outreach, and community direction behind Ravidassia Abroad.
              </p>
            </div>
            <div className="blogs-video-frame">
              <iframe
                width="100%"
                height="420"
                src={FEATURED_VIDEO_URL}
                title="Ravidassia Abroad Overview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
