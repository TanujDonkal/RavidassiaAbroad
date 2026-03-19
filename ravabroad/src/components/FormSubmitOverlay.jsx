// src/components/FormSubmitOverlay.jsx
import React, { useEffect, useState } from "react";
import "../css/FormSubmitOverlay.css";

export default function FormSubmitOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let activeSubmits = 0;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options] = args;

      // ✅ Detect only real form submissions — NOT auth endpoints
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/google") ||
        url.includes("/auth/me") ||
        url.includes("/auth/request-reset") ||
        url.includes("/auth/reset-password");
      const isFormSubmission =
        (options?.method === "POST" || options?.method === "PUT") &&
        !isAuthEndpoint;

      if (isFormSubmission) {
        activeSubmits++;
        setVisible(true);
      }

      try {
        const res = await originalFetch(...args);
        return res;
      } finally {
        if (isFormSubmission) {
          activeSubmits--;
          if (activeSubmits <= 0) setVisible(false);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="form-submit-overlay">
      <div className="form-submit-box">
        <div className="spinner-border text-warning me-2" role="status"></div>
        <span>Submitting...</span>
      </div>
    </div>
  );
}
