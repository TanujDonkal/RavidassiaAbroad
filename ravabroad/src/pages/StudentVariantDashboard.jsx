import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/students.css";
import { getExamFamily } from "../students/catalog";

export default function StudentVariantDashboard() {
  const { examSlug, variantSlug } = useParams();
  const family = getExamFamily(examSlug);
  const variant = family?.variants.find((item) => item.slug === variantSlug);

  useEffect(() => {
    document.title = `${variant?.name || "Variant"} | Students`;
  }, [variant]);

  if (!family || !variant) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="students-panel">
            <h1>Variant not found</h1>
            <Link to="/students/tests" className="btn btn-dark rounded-pill px-4">
              Back to tests
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-panel">
            <span className="students-section-kicker">{family.name} Variant</span>
            <h1>{variant.name}</h1>
            <p className="mb-4">
              {variant.audience || variant.description}. This route is in place so
              variant-specific test banks, dashboards, and analytics can scale cleanly.
            </p>
            <div className="students-hero-actions">
              {family.isImplemented ? (
                <Link to={`/students/tests/${examSlug}/tests?variant=${variantSlug}`} className="btn btn-dark rounded-pill px-4">
                  View Tests
                </Link>
              ) : null}
              <Link to={`/students/tests/${examSlug}`} className="btn btn-outline-dark rounded-pill px-4">
                Back to {family.name}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
