import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";
import "../css/ArticleDetail.css";
import { sanitizeRichContent } from "../utils/richContent";

export default function StaticArticle({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/articles/${slug}`);
        const data = await res.json();
        setArticle(data);
      } catch {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );

  if (!article)
    return (
      <div className="text-center my-5">
        <h3 className="fw-bold text-danger">Article not found</h3>
      </div>
    );

  return (
    <main className="container py-5 article-container article-standalone-page">
      <h1 className="text-center fw-bold text-primary mb-3">{article.title}</h1>
      {article.image_url && (
        <div className="text-center mb-4">
          <img
            src={article.image_url}
            alt={article.title}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: "450px", objectFit: "cover" }}
          />
        </div>
      )}
      <div
        className="article-body article-content"
        dangerouslySetInnerHTML={{ __html: sanitizeRichContent(article.content) }}
      ></div>
    </main>
  );
}
