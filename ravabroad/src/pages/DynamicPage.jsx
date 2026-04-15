import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../utils/api";
import Seo from "../components/Seo";
import { truncateText } from "../utils/seo";

export default function DynamicPage() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/menus`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((m) => m.path === pathname);
        setMenu(found || null);
      })
      .catch((err) => console.error("Menu fetch error:", err))
      .finally(() => setLoading(false));
  }, [pathname]);

  if (loading)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!menu) {
    // If no matching menu found → show 404 layout
    return (
      <div className="container text-center py-5">
        <h1 className="display-4 text-danger mb-3">404</h1>
        <h3>Page Not Found</h3>
        <p>The page <code>{pathname}</code> does not exist.</p>
        <a href="/" className="btn btn-primary rounded-pill px-4">
          Go Home
        </a>
      </div>
    );
  }

  // ✅ Dynamic content page (simple placeholder for now)
  return (
    <div className="container py-5">
      <Seo
        title={`${menu.label} | Ravidassia Abroad`}
        description={truncateText(
          `Explore ${menu.label} on Ravidassia Abroad and discover more community information, resources, and updates.`,
          160
        )}
        canonicalPath={pathname}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: menu.label,
          url: `https://www.ravidassiaabroad.com${pathname}`,
          description: `Explore ${menu.label} on Ravidassia Abroad.`,
        }}
      />
      <h1 className="display-5 mb-3">{menu.label}</h1>
      <hr />
      <p className="lead">
        This is a dynamically generated page for <strong>{menu.path}</strong>.
      </p>
      <p>
        You can edit this content later to display database data, images, or
        custom components per menu.
      </p>
    </div>
  );
}
