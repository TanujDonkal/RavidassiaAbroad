import React, { useEffect } from "react";

export default function CommunityGuidelines() {
  useEffect(() => {
    document.title = "Community Guidelines | Ravidassia Abroad";
  }, []);

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 920 }}>
        <h1 className="mb-3">Community Guidelines</h1>
        <p>
          These guidelines apply to the current public and admin-managed
          features of Ravidassia Abroad, including comments, content requests,
          SC/ST connect submissions, and matrimonial biodata processing.
        </p>

        <ul>
          <li>Be respectful. No hate speech, harassment, threats, or caste-based abuse.</li>
          <li>Do not submit private information about other people without permission.</li>
          <li>Use comments and forms for genuine community purposes only.</li>
          <li>Do not post spam, scams, impersonation, or misleading information.</li>
          <li>Do not upload or submit content that is unlawful, abusive, or unsafe.</li>
          <li>Admins may remove content or restrict access when needed to protect users and the platform.</li>
        </ul>

        <p className="mt-4 mb-0">
          These guidelines support moderation decisions in the current app, but
          they are not a substitute for legal review or formal moderation SOPs.
        </p>
      </div>
    </div>
  );
}
