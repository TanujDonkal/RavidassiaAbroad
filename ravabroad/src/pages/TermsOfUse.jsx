import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL_PATHS } from "../utils/compliance";

export default function TermsOfUse() {
  useEffect(() => {
    document.title = "Terms of Use | Ravidassia Abroad";
  }, []);

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 920 }}>
        <h1 className="mb-3">Terms of Use</h1>
        <p>
          These terms describe how the current Ravidassia Abroad website may be
          used. They are written for the current app only and should still be
          reviewed legally before production deployment.
        </p>

        <h3 className="mt-4">Acceptable Use</h3>
        <ul>
          <li>use the site lawfully and respectfully</li>
          <li>do not submit false, abusive, harassing, or infringing content</li>
          <li>do not attempt unauthorized access to accounts, admin tools, or stored data</li>
          <li>do not upload harmful files or misuse community features</li>
        </ul>

        <h3 className="mt-4">Accounts</h3>
        <p>
          Users are responsible for the accuracy of the information they submit
          and for maintaining the security of their own login credentials.
        </p>

        <h3 className="mt-4">Community Submissions</h3>
        <p>
          SC/ST forms, matrimonial biodata, comments, and content requests may
          be reviewed, moderated, edited, rejected, or removed by the platform
          admins under the current community rules and operational needs.
        </p>

        <h3 className="mt-4">No Guarantee</h3>
        <p>
          The current platform provides community information and admin-managed
          workflows. It does not guarantee availability, identity verification,
          matchmaking outcomes, or uninterrupted service.
        </p>

        <h3 className="mt-4">Related Pages</h3>
        <p>
          Please also review the <Link to={LEGAL_PATHS.privacy}>Privacy Policy</Link>{" "}
          and <Link to={LEGAL_PATHS.guidelines}>Community Guidelines</Link>.
        </p>
      </div>
    </div>
  );
}
