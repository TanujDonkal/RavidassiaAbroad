import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CURRENT_POLICY_VERSION,
  LEGAL_PATHS,
  PRIVACY_CONTACT_EMAIL,
  SUPPORT_CONTACT_EMAIL,
} from "../utils/compliance";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Ravidassia Abroad";
  }, []);

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 920 }}>
        <h1 className="mb-3">Privacy Policy</h1>
        <p className="text-muted">
          Current policy version: <strong>{CURRENT_POLICY_VERSION}</strong>
        </p>
        <p>
          This page describes the current implementation of personal data
          handling on Ravidassia Abroad. It is a practical product policy for
          the live features in this codebase. Legal review is still recommended
          before production use.
        </p>

        <h3 className="mt-4">What We Collect</h3>
        <p>Depending on the feature, we may collect:</p>
        <ul>
          <li>account information such as name, email, password hash, and profile details</li>
          <li>SC/ST connect request details, including contact details and supporting proof text</li>
          <li>matrimonial biodata details and uploaded photos</li>
          <li>guest comment details such as name, email, and comment text</li>
          <li>content request details</li>
          <li>privacy/data request details</li>
          <li>admin audit information about sensitive admin actions</li>
        </ul>

        <h3 className="mt-4">How We Use Information</h3>
        <ul>
          <li>to provide account access and security features</li>
          <li>to review community submissions and respond to users</li>
          <li>to moderate comments and content-related requests</li>
          <li>to run the admin dashboard and manage current website features</li>
          <li>to send operational emails such as password reset messages and admin notifications</li>
          <li>to investigate privacy requests, abuse, and security issues</li>
        </ul>

        <h3 className="mt-4">Service Providers</h3>
        <p>
          The current app uses third-party providers for infrastructure and
          operations, including hosting, PostgreSQL, Cloudinary image storage,
          Gmail/Nodemailer, Google Sign-In, and Resend email delivery. Data
          submitted through the current app may be processed by those providers
          as part of normal operation.
        </p>

        <h3 className="mt-4">Admin Access</h3>
        <p>
          Sensitive form submissions are visible to authorized admins through
          the admin dashboard. The current implementation also records a basic
          audit trail for selected sensitive admin actions.
        </p>

        <h3 className="mt-4">Comments</h3>
        <p>
          Guest comments require name, email, and comment text. Email addresses
          are collected for moderation and comment management and are not meant
          to be displayed publicly.
        </p>

        <h3 className="mt-4">Retention</h3>
        <p>
          The codebase now includes a retention foundation, but some exact
          retention periods are still a business and legal decision. See the
          repo compliance docs for the current implementation notes.
        </p>

        <h3 className="mt-4">Your Options</h3>
        <p>
          You can request access, correction, deletion, or account deletion
          through the{" "}
          <Link to={LEGAL_PATHS.dataRequest}>Privacy / Data Request page</Link>.
        </p>

        <h3 className="mt-4">Contact</h3>
        <p>
          Privacy contact:{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
        </p>
        <p>
          General support:{" "}
          <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`}>{SUPPORT_CONTACT_EMAIL}</a>
        </p>
      </div>
    </div>
  );
}
