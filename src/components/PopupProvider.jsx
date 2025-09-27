// src/components/PopupProvider.jsx
import React, { createContext, useContext, useRef } from "react";
import Popup from "./Popup";

const PopupCtx = createContext(null);

export function PopupProvider({ children }) {
  const popupRef = useRef(null);

  const api = {
    open: (options) => popupRef.current?.open(options),
    close: () => popupRef.current?.close(),
  };

  return (
    <PopupCtx.Provider value={api}>
      {children}
      {/* one global modal at the root */}
      <Popup ref={popupRef} />
    </PopupCtx.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupCtx);
  if (!ctx) throw new Error("usePopup must be used inside <PopupProvider>");
  return ctx;
}
