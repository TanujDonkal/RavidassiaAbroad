import React from "react";
import Seo from "../components/Seo";
import { buildBreadcrumbSchema } from "../utils/seo";
import "../css/business-directory.css";

export default function AffiliateDisclosure() {
  return (
    <main className="business-shell py-5">
      <Seo
        title="Affiliate Disclosure | Ravidassia Abroad"
        description="Read the affiliate disclosure for Ravidassia Abroad and understand how sponsored or referral links may be handled on the website."
        canonicalPath="/affiliate-disclosure"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Affiliate Disclosure", path: "/affiliate-disclosure" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Transparency</span>
          <h1 className="display-5 fw-bold mt-3 mb-3">Affiliate Disclosure</h1>
          <p className="lead text-white-50 mb-0">
            Ravidassia Abroad may, from time to time, include partner, sponsor,
            or referral links that support the sustainability of the platform.
          </p>
        </section>

        <section className="business-panel p-4 p-lg-5 business-richtext">
          <h2 className="h4 fw-bold">How this works</h2>
          <p className="text-muted">
            If affiliate or referral links are used on this website, Ravidassia
            Abroad may receive a small commission or benefit at no extra cost to
            the user. These links help support content creation, documentation
            work, hosting, moderation, and public resource development.
          </p>
          <h2 className="h4 fw-bold mt-4">Editorial independence</h2>
          <p className="text-muted">
            Any affiliate relationship does not control the accuracy of
            community, religious, temple, or historical information on this
            website. We aim to keep public information respectful, useful, and
            independent of sponsor influence.
          </p>
          <h2 className="h4 fw-bold mt-4">User responsibility</h2>
          <p className="text-muted">
            Users should review third-party services, websites, businesses, and
            products carefully before making payments or commitments. If you
            notice an issue with a listing or recommendation, please contact us
            so we can review it.
          </p>
          <h2 className="h4 fw-bold mt-4">Questions</h2>
          <p className="text-muted mb-0">
            For clarification about affiliate, sponsor, or featured placement
            practices, please use the website contact details listed on our
            contact page.
          </p>
        </section>
      </div>
    </main>
  );
}
