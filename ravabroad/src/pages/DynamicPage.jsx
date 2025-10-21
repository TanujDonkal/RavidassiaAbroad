import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function DynamicPage() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Loading...";
    fetch(`${process.env.REACT_APP_API_URL}/api/menus`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((m) => m.path === pathname);
        setMenu(found || null);
        document.title = found ? found.label : "404 - Page Not Found";
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
