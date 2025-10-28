import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export default function StaticArticle({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect65(() => {
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
    <main className="container py-5">
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
        className="article-content fs-5 lh-lg text-secondary"
        dangerouslySetInnerHTML={{ __html: article.content }}
      ></div>
    </main>
  );
}
