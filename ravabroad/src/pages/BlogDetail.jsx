import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Comments from "../components/Comments";
import { API_BASE } from "../utils/api";
import Seo from "../components/Seo";
import "../css/BlogDetail.css";
import { sanitizeRichContent } from "../utils/richContent";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  stripHtml,
  truncateText,
} from "../utils/seo";

const TRANSLATION_LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "pa", label: "Punjabi" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ur", label: "Urdu" },
];

function slugifyHeading(text, index) {
  const base = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base ? `${base}-${index + 1}` : `section-${index + 1}`;
}

function buildReadableContent(html) {
  const sanitized = sanitizeRichContent(html || "");

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return { html: sanitized, toc: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitized}</div>`, "text/html");
  const wrapper = doc.body.firstElementChild || doc.body;
  const headings = Array.from(wrapper.querySelectorAll("h2, h3, h4"));

  const toc = headings.map((heading, index) => {
    const text = heading.textContent?.trim() || `Section ${index + 1}`;
    const id = slugifyHeading(text, index);
    heading.setAttribute("id", id);
    return {
      id,
      text,
      level: Number(heading.tagName.replace("H", "")),
    };
  });

  wrapper.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    if (/^(https?:)?\/\//i.test(href)) {
      anchor.setAttribute("rel", "noopener noreferrer");
      anchor.setAttribute("target", "_blank");
    }
  });

  return {
    html: wrapper.innerHTML,
    toc,
  };
}

const BegampuraHeading = () => (
  <div className="blog-detail-brand">
    <div className="blog-detail-brand-line"></div>
    <img
      src="/template/img/6Qt0bpw3_400x400-removebg-preview.png"
      alt="Begampura"
      className="blog-detail-brand-logo"
    />
    <span>The Begampura News</span>
    <div className="blog-detail-brand-line"></div>
  </div>
);

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [renderedContent, setRenderedContent] = useState("");
  const [tableOfContents, setTableOfContents] = useState([]);
  const [copyState, setCopyState] = useState("Copy link");
  const [translateReady, setTranslateReady] = useState(false);
  const [translateStatus, setTranslateStatus] = useState("");
  const [activeReaderTool, setActiveReaderTool] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const widgetId = "blog-translate-element";

    const initTranslator = () => {
      const host = document.getElementById(widgetId);
      if (!host || !window.google?.translate?.TranslateElement) {
        return;
      }

      if (!host.dataset.initialized) {
        host.innerHTML = "";
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: TRANSLATION_LANGUAGES.map((item) => item.code).join(","),
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          widgetId
        );
        host.dataset.initialized = "true";
      }

      setTranslateReady(true);
    };

    window.googleTranslateElementInit = initTranslator;

    if (window.google?.translate?.TranslateElement) {
      initTranslator();
      return undefined;
    }

    const existingScript = document.querySelector(
      'script[data-ra-google-translate="true"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      script.dataset.raGoogleTranslate = "true";
      document.body.appendChild(script);
    }

  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/blogs/${slug}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Blog not found");
        }

        setPost(data);

        if (data.category_id) {
          const relatedRes = await fetch(`${API_BASE}/blogs?category=${data.category_id}`);
          const relatedData = await relatedRes.json();
          const filtered = (Array.isArray(relatedData) ? relatedData : []).filter(
            (item) => item.id !== data.id
          );
          setRelated(filtered.slice(0, 4));
        } else {
          setRelated([]);
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setPost(null);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post?.content) {
      setRenderedContent("");
      setTableOfContents([]);
      return;
    }

    const processed = buildReadableContent(post.content);
    setRenderedContent(processed.html);
    setTableOfContents(processed.toc);
  }, [post]);

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-detail-missing container py-5 text-center">
        <h1>Blog not found</h1>
        <p>The article you are looking for does not exist or is no longer available.</p>
        <Link to="/blogs" className="btn btn-warning rounded-pill px-4">
          Back to Blogs
        </Link>
      </div>
    );
  }

  const wordCount = stripHtml(post.content || "").split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const articleSummary = truncateText(
    stripHtml(post.excerpt || post.content || DEFAULT_DESCRIPTION),
    180
  );
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.ravidassiaabroad.com/blogs/${slug}`;
  const shareTitle = post.title || "Ravidassia Abroad Blog";
  const shareSummary = articleSummary;
  const shareLinks = [
    {
      label: "WhatsApp",
      icon: "bi-whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
    },
    {
      label: "Facebook",
      icon: "bi-facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "X",
      icon: "bi-twitter-x",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(
        shareUrl
      )}`,
    },
    {
      label: "LinkedIn",
      icon: "bi-linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`,
    },
    {
      label: "Email",
      icon: "bi-envelope-fill",
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
        `${shareSummary}\n\n${shareUrl}`
      )}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy link"), 1800);
    } catch (err) {
      console.error("Copy blog link failed:", err);
      setCopyState("Copy failed");
      window.setTimeout(() => setCopyState("Copy link"), 1800);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareSummary,
        url: shareUrl,
      });
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Native share failed:", err);
      }
    }
  };

  const resetTranslation = () => {
    if (typeof document === "undefined") {
      return;
    }

    const expireCookie = (name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
    };

    expireCookie("googtrans");
    window.location.reload();
  };

  const handleTranslateLanguage = (languageCode) => {
    if (languageCode === "en") {
      resetTranslation();
      return;
    }

    const combo = document.querySelector(".goog-te-combo");
    if (!combo) {
      setTranslateStatus("Translator is still loading. Please try again in a moment.");
      return;
    }

    combo.value = languageCode;
    combo.dispatchEvent(new Event("change"));
    setTranslateStatus(
      `Translating to ${
        TRANSLATION_LANGUAGES.find((item) => item.code === languageCode)?.label ||
        "selected language"
      }.`
    );
  };

  const toggleReaderTool = (tool) => {
    setActiveReaderTool((current) => (current === tool ? "" : tool));
  };

  return (
    <main className="blog-detail-page">
      <Seo
        title={`${post.title} | Ravidassia Abroad`}
        description={truncateText(
          stripHtml(post.excerpt || post.content || DEFAULT_DESCRIPTION),
          160
        )}
        canonicalPath={`/blogs/${slug}`}
        image={post.image_url || DEFAULT_OG_IMAGE}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: truncateText(
            stripHtml(post.excerpt || post.content || DEFAULT_DESCRIPTION),
            160
          ),
          image: post.image_url || DEFAULT_OG_IMAGE,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: {
            "@type": "Person",
            name: post.author_name || "Ravidassia Abroad",
          },
          publisher: {
            "@type": "Organization",
            name: "Ravidassia Abroad",
            logo: {
              "@type": "ImageObject",
              url: DEFAULT_OG_IMAGE,
            },
          },
          mainEntityOfPage: `https://www.ravidassiaabroad.com/blogs/${slug}`,
        }}
      />

      <section className="blog-detail-hero">
        <div className="container">
          <div className="blog-detail-hero-shell">
            <BegampuraHeading />

            <div className="blog-detail-meta-row">
              <span className="blog-detail-tag">{post.category_name || "Community Blog"}</span>
              <span>{readingMinutes} min read</span>
              <span>{post.views || 0} views</span>
            </div>

            <h1>{post.title}</h1>
            <p className="blog-detail-summary">{articleSummary}</p>

            <div className="blog-detail-author-row">
              <div>
                <strong>{post.author_name || "Ravidassia Abroad"}</strong>
                <span>
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="blog-detail-anchor-actions">
                {tableOfContents.length > 0 && (
                  <a href="#blog-toc" className="btn btn-outline-light rounded-pill px-4">
                    Jump to topics
                  </a>
                )}
                <a href="#blog-translate" className="btn btn-outline-light rounded-pill px-4">
                  <i className="bi bi-globe2 me-2" aria-hidden="true"></i>
                  Translate
                </a>
                <a href="#comments" className="btn btn-warning rounded-pill px-4">
                  Join comments
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-detail-main">
        <div className="container">
          <div className="blog-detail-shell">
            <article className="blog-detail-article">
              {post.image_url && (
                <div className="blog-detail-cover">
                  <img src={post.image_url} alt={post.title} />
                </div>
              )}

              <div className="blog-detail-body-layout">
                <aside className="blog-detail-sidebar">
                  <div className="blog-detail-sidecard" id="blog-toc">
                    <span className="blog-detail-sidekicker">Quick Guide</span>
                    <h3>On this page</h3>
                    {tableOfContents.length > 0 ? (
                      <nav className="blog-detail-toc" aria-label="Table of contents">
                        {tableOfContents.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`level-${item.level}`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    ) : (
                      <p className="blog-detail-sidecopy">
                        This article reads straight through without section headings.
                      </p>
                    )}
                  </div>

                  <div className="blog-detail-sidecard">
                    <span className="blog-detail-sidekicker">Reading Notes</span>
                    <h3>Article details</h3>
                    <ul className="blog-detail-facts">
                      <li>
                        <strong>Category</strong>
                        <span>{post.category_name || "Community Blog"}</span>
                      </li>
                      <li>
                        <strong>Reading time</strong>
                        <span>{readingMinutes} minutes</span>
                      </li>
                      <li>
                        <strong>Published</strong>
                        <span>
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="blog-detail-sidecard" id="blog-translate">
                    <span className="blog-detail-sidekicker">Reader Language</span>
                    <h3>
                      <i className="bi bi-globe2 me-2" aria-hidden="true"></i>
                      Read in another language
                    </h3>
                    <p className="blog-detail-sidecopy">
                      Switch this article into Hindi or another supported language for easier
                      reading.
                    </p>

                    <div className="blog-detail-language-grid">
                      <button
                        type="button"
                        className="blog-detail-language-btn original"
                        onClick={() => handleTranslateLanguage("en")}
                      >
                        English
                      </button>
                      {TRANSLATION_LANGUAGES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="blog-detail-language-btn"
                          onClick={() => handleTranslateLanguage(item.code)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="blog-detail-translate-widget-wrap">
                      <div id="blog-translate-element" className="blog-detail-translate-widget" />
                    </div>

                    <p className="blog-detail-translate-note">
                      {translateReady
                        ? "Machine translation may not be perfect, but it can help readers understand long articles more easily."
                        : "Loading translator..."}
                    </p>
                    {translateStatus ? (
                      <p className="blog-detail-translate-status">{translateStatus}</p>
                    ) : null}
                  </div>

                  <div className="blog-detail-sidecard">
                    <span className="blog-detail-sidekicker">Share This Post</span>
                    <h3>Pass it on</h3>
                    <p className="blog-detail-sidecopy">
                      Share this article with sangat, family, and friends across platforms.
                    </p>

                    <div className="blog-detail-share-inline">
                      <button
                        type="button"
                        className="blog-detail-share-primary"
                        onClick={handleNativeShare}
                      >
                        <i className="bi bi-share-fill" aria-hidden="true"></i>
                        Share
                      </button>
                      <button
                        type="button"
                        className="blog-detail-share-secondary"
                        onClick={handleCopyLink}
                      >
                        <i className="bi bi-link-45deg" aria-hidden="true"></i>
                        {copyState}
                      </button>
                    </div>

                    <div className="blog-detail-share-grid">
                      {shareLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="blog-detail-share-btn"
                        >
                          <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                          <span>{item.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="blog-detail-content-column">
                  <div className="blog-detail-mobile-tools">
                    <button
                      type="button"
                      className={`blog-detail-tool-toggle ${
                        activeReaderTool === "toc" ? "active" : ""
                      }`}
                      onClick={() => toggleReaderTool("toc")}
                    >
                      <i className="bi bi-list-ul" aria-hidden="true"></i>
                      <span>Topics</span>
                    </button>
                    <button
                      type="button"
                      className={`blog-detail-tool-toggle ${
                        activeReaderTool === "language" ? "active" : ""
                      }`}
                      onClick={() => toggleReaderTool("language")}
                    >
                      <i className="bi bi-globe2" aria-hidden="true"></i>
                      <span>Language</span>
                    </button>
                    <button
                      type="button"
                      className={`blog-detail-tool-toggle ${
                        activeReaderTool === "share" ? "active" : ""
                      }`}
                      onClick={() => toggleReaderTool("share")}
                    >
                      <i className="bi bi-share-fill" aria-hidden="true"></i>
                      <span>Share</span>
                    </button>
                  </div>

                  {activeReaderTool === "toc" && (
                    <div className="blog-detail-inline-tool-card">
                      <span className="blog-detail-sidekicker">Quick Guide</span>
                      <h3>On this page</h3>
                      {tableOfContents.length > 0 ? (
                        <nav className="blog-detail-toc" aria-label="Table of contents">
                          {tableOfContents.map((item) => (
                            <a
                              key={item.id}
                              href={`#${item.id}`}
                              className={`level-${item.level}`}
                              onClick={() => setActiveReaderTool("")}
                            >
                              {item.text}
                            </a>
                          ))}
                        </nav>
                      ) : (
                        <p className="blog-detail-sidecopy">
                          This article reads straight through without section headings.
                        </p>
                      )}
                    </div>
                  )}

                  {activeReaderTool === "language" && (
                    <div className="blog-detail-inline-tool-card">
                      <span className="blog-detail-sidekicker">Reader Language</span>
                      <h3>
                        <i className="bi bi-globe2 me-2" aria-hidden="true"></i>
                        Read in another language
                      </h3>
                      <p className="blog-detail-sidecopy">
                        Switch this article into Hindi or another supported language for easier
                        reading.
                      </p>

                      <div className="blog-detail-language-grid">
                        <button
                          type="button"
                          className="blog-detail-language-btn original"
                          onClick={() => handleTranslateLanguage("en")}
                        >
                          English
                        </button>
                        {TRANSLATION_LANGUAGES.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            className="blog-detail-language-btn"
                            onClick={() => handleTranslateLanguage(item.code)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <p className="blog-detail-translate-note">
                        {translateReady
                          ? "Machine translation may not be perfect, but it can help readers understand long articles more easily."
                          : "Loading translator..."}
                      </p>
                      {translateStatus ? (
                        <p className="blog-detail-translate-status">{translateStatus}</p>
                      ) : null}
                    </div>
                  )}

                  {activeReaderTool === "share" && (
                    <div className="blog-detail-inline-tool-card">
                      <span className="blog-detail-sidekicker">Share This Post</span>
                      <h3>Pass it on</h3>
                      <p className="blog-detail-sidecopy">
                        Share this article with sangat, family, and friends across platforms.
                      </p>

                      <div className="blog-detail-share-inline">
                        <button
                          type="button"
                          className="blog-detail-share-primary"
                          onClick={handleNativeShare}
                        >
                          <i className="bi bi-share-fill" aria-hidden="true"></i>
                          Share
                        </button>
                        <button
                          type="button"
                          className="blog-detail-share-secondary"
                          onClick={handleCopyLink}
                        >
                          <i className="bi bi-link-45deg" aria-hidden="true"></i>
                          {copyState}
                        </button>
                      </div>

                      <div className="blog-detail-share-grid">
                        {shareLinks.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="blog-detail-share-btn"
                          >
                            <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                            <span>{item.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="blog-detail-content-intro">
                    <p>{post.excerpt || articleSummary}</p>
                  </div>

                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                </div>
              </div>

              <Comments postId={post.id} postType="blogs" />

              {related.length > 0 && (
                <section className="blog-detail-related">
                  <div className="blog-detail-related-head">
                    <div>
                      <span className="blog-detail-sidekicker">More to Explore</span>
                      <h3>Related posts</h3>
                    </div>
                    <Link to="/blogs" className="btn btn-outline-dark rounded-pill px-4">
                      All blogs
                    </Link>
                  </div>

                  <div className="blog-detail-related-grid">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        to={`/blogs/${item.slug}`}
                        className="blog-detail-related-card"
                      >
                        <div className="blog-detail-related-image">
                          <img
                            src={
                              item.image_url ||
                              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
                            }
                            alt={item.title}
                          />
                        </div>
                        <div className="blog-detail-related-copy">
                          <span>{item.category_name || "Community Blog"}</span>
                          <h4>{item.title}</h4>
                          <p>{truncateText(stripHtml(item.excerpt || ""), 105)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div className="blog-detail-back">
                <Link to="/blogs" className="btn btn-outline-dark rounded-pill px-4">
                  Back to All Blogs
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
