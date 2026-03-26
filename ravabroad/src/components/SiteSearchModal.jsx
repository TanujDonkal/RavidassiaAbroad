import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "bootstrap/js/dist/modal";
import { useLocation, useNavigate } from "react-router-dom";
import { searchSite } from "../utils/api";

const SOURCE_LABELS = {
  blog: "Blogs",
  article: "Articles",
  personality: "Personalities",
  menu: "Menus",
  temple: "Temples",
  page: "Pages",
};

const SOURCE_ORDER = ["blog", "article", "personality", "temple", "menu", "page"];

function toInternalPath(path) {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export default function SiteSearchModal() {
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const previousLocationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchResults = useCallback(async (value) => {
    setLoading(true);
    try {
      const data = await searchSite(value, 12);
      setResults(Array.isArray(data.results) ? data.results : []);
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Site search failed:", err);
      setResults([]);
      setKeywords([]);
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    if (!modalRef.current) return;
    const instance =
      Modal.getInstance(modalRef.current) ||
      Modal.getOrCreateInstance(modalRef.current);
    instance.hide();
  }, []);

  const handleNavigate = useCallback(
    (path) => {
      const resolvedPath = toInternalPath(path);
      closeModal();

      if (/^https?:\/\//i.test(resolvedPath)) {
        window.location.href = resolvedPath;
        return;
      }

      navigate(resolvedPath);
    },
    [closeModal, navigate]
  );

  const handleKeywordClick = useCallback(
    (keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      const directMatch = results.find((item) => {
        const haystack = [
          item.title,
          item.meta,
          ...(Array.isArray(item.keywords) ? item.keywords : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedKeyword);
      });

      if (directMatch) {
        handleNavigate(directMatch.path);
        return;
      }

      setQuery(keyword);
    },
    [handleNavigate, results]
  );

  useEffect(() => {
    if (!modalRef.current) return undefined;

    const element = modalRef.current;

    const handleShown = () => {
      setIsOpen(true);
      setHasLoadedOnce(false);
      inputRef.current?.focus();
      fetchResults("");
    };

    const handleHidden = () => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      setKeywords([]);
      setLoading(false);
      setHasLoadedOnce(false);
    };

    element.addEventListener("shown.bs.modal", handleShown);
    element.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      element.removeEventListener("shown.bs.modal", handleShown);
      element.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [fetchResults]);

  useEffect(() => {
    if (!isOpen) return undefined;

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchResults(query);
    }, query.trim() ? 220 : 0);

    return () => window.clearTimeout(debounceRef.current);
  }, [fetchResults, isOpen, query]);

  useEffect(() => {
    const currentLocationKey = `${location.pathname}${location.search}`;

    if (previousLocationRef.current === null) {
      previousLocationRef.current = currentLocationKey;
      return;
    }

    if (isOpen && previousLocationRef.current !== currentLocationKey) {
      closeModal();
    }

    previousLocationRef.current = currentLocationKey;
  }, [closeModal, isOpen, location.pathname, location.search]);

  const groupedResults = useMemo(() => {
    const groups = new Map();

    for (const type of SOURCE_ORDER) {
      groups.set(type, []);
    }

    for (const result of results) {
      const key = SOURCE_LABELS[result.type] ? result.type : "page";
      groups.get(key).push(result);
    }

    return SOURCE_ORDER.filter((type) => groups.get(type).length > 0).map(
      (type) => ({
        type,
        label: SOURCE_LABELS[type],
        items: groups.get(type),
      })
    );
  }, [results]);

  const showEmptyState = hasLoadedOnce && !loading && results.length === 0;

  return (
    <div
      ref={modalRef}
      className="site-search-modal modal fade"
      id="searchModal"
      tabIndex="-1"
      aria-labelledby="siteSearchModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-fullscreen-sm-down">
        <div className="modal-content border-0 shadow-lg">
          <div className="site-search-shell">
            <div className="modal-header border-0 px-0 pt-0 pb-3">
              <div>
                <h4 className="modal-title mb-1" id="siteSearchModalLabel">
                  Search the website
                </h4>
                <p className="text-muted mb-0">
                  Find blogs, personalities, articles, forms, and site pages.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <form
              className="site-search-form"
              onSubmit={(event) => {
                event.preventDefault();
                fetchResults(query);
              }}
            >
              <div className="site-search-input-wrap">
                <i className="fas fa-search site-search-input-icon" aria-hidden="true"></i>
                <input
                  ref={inputRef}
                  type="search"
                  className="form-control"
                  placeholder="Search blogs, personalities, articles, pages..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn btn-dark rounded-pill px-4">
                Search
              </button>
            </form>

            {keywords.length > 0 && (
              <div className="site-search-keywords">
                <span className="site-search-keywords-label">Related keywords</span>
                <div className="site-search-keyword-list">
                  {keywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      className="btn btn-outline-dark btn-sm rounded-pill"
                      onClick={() => handleKeywordClick(keyword)}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="site-search-results">
              {loading && (
                <div className="site-search-status text-center py-4">
                  Searching your website...
                </div>
              )}

              {!loading &&
                groupedResults.map((group) => (
                  <section key={group.type} className="site-search-group">
                    <div className="site-search-group-title">{group.label}</div>
                    <div className="site-search-result-list">
                      {group.items.map((item) => (
                        <button
                          key={`${item.type}-${item.entity_id || item.path}`}
                          type="button"
                          className="site-search-result-card"
                          onClick={() => handleNavigate(item.path)}
                        >
                          <div className="site-search-result-meta">
                            <span className="site-search-type-pill">
                              {SOURCE_LABELS[item.type] || "Result"}
                            </span>
                            {item.meta ? (
                              <span className="site-search-result-category">
                                {item.meta}
                              </span>
                            ) : null}
                          </div>
                          <div className="site-search-result-title">
                            {item.title}
                          </div>
                          {item.summary ? (
                            <div className="site-search-result-summary">
                              {item.summary}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}

              {showEmptyState && (
                <div className="site-search-empty">
                  No matching results found. Try a broader keyword like
                  {" "}
                  <strong>news</strong>,
                  {" "}
                  <strong>matrimonial</strong>,
                  {" "}
                  or
                  {" "}
                  <strong>community</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
