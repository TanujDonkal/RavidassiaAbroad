import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_PATHS } from "../utils/compliance";

export default function ComplianceNotice({ text, className = "" }) {
  return (
    <p className={`small text-muted mb-3 ${className}`.trim()}>
      {text}{" "}
      <Link to={LEGAL_PATHS.privacy}>Privacy Policy</Link>.
    </p>
  );
}
