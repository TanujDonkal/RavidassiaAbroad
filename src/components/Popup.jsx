// src/components/Popup.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Modal } from "bootstrap";

/**
 * Imperative API:
 *  ref.current.open({ title, message, primaryLabel, secondaryLabel, onPrimary, onSecondary, variant })
 *  ref.current.close()
 */
const Popup = forwardRef(function Popup(_props, ref) {
  const elRef = useRef(null);
  const bsRef = useRef(null);

  const [cfg, setCfg] = useState({
    title: "",
    message: "",
    primaryLabel: "Ok, got it",
    secondaryLabel: "",
    onPrimary: null,
    onSecondary: null,
    variant: "info", // "success" | "warning" | "danger" | "info"
  });

  useEffect(() => {
    if (elRef.current) {
      bsRef.current = new Modal(elRef.current, { backdrop: "static" });
    }
    return () => {
      try { bsRef.current?.dispose(); } catch {}
    };
  }, []);

  useImperativeHandle(ref, () => ({
    open(options = {}) {
      setCfg((prev) => ({ ...prev, ...options }));
      bsRef.current?.show();
    },
    close() {
      bsRef.current?.hide();
    },
  }));

  const variantIcon =
    cfg.variant === "success" ? "✅" :
    cfg.variant === "danger"  ? "⛔" :
    cfg.variant === "warning" ? "⚠️" : "ℹ️";

  return (
    <div className="modal fade" tabIndex="-1" ref={elRef} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {cfg.title}{" "}
              <span style={{ fontSize: 18, marginLeft: 6 }}>{variantIcon}</span>
            </h5>
            <button type="button" className="btn-close" onClick={() => bsRef.current?.hide()} />
          </div>
          <div className="modal-body">
            {typeof cfg.message === "string" ? <p className="mb-0">{cfg.message}</p> : cfg.message}
          </div>
          <div className="modal-footer">
            {cfg.secondaryLabel ? (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  cfg.onSecondary?.();
                  bsRef.current?.hide();
                }}
              >
                {cfg.secondaryLabel}
              </button>
            ) : null}
            <button
              type="button"
              className={`btn ${
                cfg.variant === "success"
                  ? "btn-warning"
                  : cfg.variant === "danger"
                  ? "btn-danger"
                  : cfg.variant === "warning"
                  ? "btn-warning"
                  : "btn-primary"
              }`}
              onClick={() => {
                cfg.onPrimary?.();
                bsRef.current?.hide();
              }}
            >
              {cfg.primaryLabel || "Ok, got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Popup;
