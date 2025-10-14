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

      // ✅ Detect only real form submissions — NOT API login etc.
      const isFormSubmission =
        options?.body instanceof FormData &&
        !(url.includes("/auth/login") || url.includes("/auth/register"));

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
