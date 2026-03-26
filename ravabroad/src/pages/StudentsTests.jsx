import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/students.css";
import { getStudentCatalog } from "../utils/api";
import { EXAM_FAMILIES } from "../students/catalog";

export default function StudentsTests() {
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    document.title = "Test Selection | Ravidassia Abroad";
    getStudentCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  const families = catalog?.examTypes?.length
    ? catalog.examTypes.map((item) => ({
        ...EXAM_FAMILIES[item.slug],
        variants: item.variants || EXAM_FAMILIES[item.slug]?.variants || [],
      }))
    : Object.values(EXAM_FAMILIES);

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-section-head">
            <div>
              <span className="students-section-kicker">Exam Selector</span>
              <h1 className="students-page-title">Choose exam family and test type.</h1>
            </div>
            <Link to="/students" className="btn btn-outline-dark rounded-pill px-4">
              Back to Students
            </Link>
          </div>

          <div className="students-family-grid">
            {families.map((family) => (
              <article
                key={family.slug}
                className="students-family-card"
                style={{ "--students-family-accent": family.accent }}
              >
                <div className="students-family-card-top">
                  <span className="students-family-badge">{family.badge}</span>
                  <h2>{family.name}</h2>
                  <p>{family.description}</p>
                </div>
                <div className="students-variant-grid">
                  {family.variants.map((variant) => (
                    <div key={variant.slug} className="students-variant-card">
                      <strong>{variant.name}</strong>
                      <p>{variant.audience || variant.description}</p>
                      <span>{variant.availability || "Available"}</span>
                    </div>
                  ))}
                </div>
                <div className="students-family-actions">
                  <Link to={`/students/tests/${family.slug}`} className="btn btn-dark rounded-pill px-4">
                    {family.isImplemented ? "Open Dashboard" : "View Placeholder"}
                  </Link>
                  <Link to="/auth" className="btn btn-link">
                    Sign in for practice
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
