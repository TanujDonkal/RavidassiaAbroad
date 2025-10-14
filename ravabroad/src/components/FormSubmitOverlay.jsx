import React, { useEffect, useState } from "react";
import "../css/FormSubmitOverlay.css";

export default function FormSubmitOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let activeSubmits = 0;

    // Wrap native fetch to detect form submissions
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;

      // Detect form POSTs
      const isFormPost =
        options?.method?.toUpperCase() === "POST" &&
        (options?.body instanceof FormData ||
          options?.headers?.["Content-Type"]?.includes("application/json"));

      if (isFormPost) {
        activeSubmits++;
        setVisible(true);
      }

      try {
        const res = await originalFetch(...args);
        return res;
      } finally {
        if (isFormPost) {
          activeSubmits--;
          if (activeSubmits === 0) setVisible(false);
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
    