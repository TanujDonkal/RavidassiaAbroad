import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";

const Popup = forwardRef((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [options, setOptions] = useState({
    title: "",
    message: "",
    type: "info", // info, success, error, warning, confirm
    onConfirm: null,
    onCancel: null,
  });

  useImperativeHandle(ref, () => ({
    open(opts) {
      setFadeOut(false);
      setOptions({
        ...opts,
        type: opts.type || "info",
        onConfirm: opts.onConfirm || null,
        onCancel: opts.onCancel || null,
      });
      setVisible(true);
    },
    close() {
      triggerClose();
    },
  }));

// Auto-close timer
useEffect(() => {
  if (!visible) return;

  // Don't auto-close for confirm, error, or success popups
  if (["confirm", "error", "success"].includes(options.type)) return;

  const timer = setTimeout(() => triggerClose(), 4000); // 4 s default
  return () => clearTimeout(timer);
}, [visible, options.type]);


  const triggerClose = () => {
    setFadeOut(true);
    // wait for animation before hiding
    setTimeout(() => setVisible(false), 250);
  };

  if (!visible) return null;

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    triggerClose();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    triggerClose();
  };

  const colors = {
    success: "bg-success text-white",
    error: "bg-danger text-white",
    warning: "bg-warning text-dark",
    info: "bg-primary text-white",
    confirm: "bg-secondary text-white",
  };
  const headerColor = colors[options.type] || colors.info;

  return (
    <div
      className={`modal fade show ${fadeOut ? "fade-out" : "fade-in"}`}
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 2000,
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-3">
          <div className={`modal-header ${headerColor}`}>
            <h5 className="modal-title fw-semibold">{options.title}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleCancel}
            ></button>
          </div>

          <div className="modal-body">
            <p className="mb-0">{options.message}</p>
          </div>

          <div className="modal-footer">
            {options.type === "confirm" ? (
              <>
                <button
                  className="btn btn-secondary rounded-pill"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary rounded-pill"
                  onClick={handleConfirm}
                >
                  Yes, Confirm
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary rounded-pill"
                onClick={handleCancel}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Popup;
