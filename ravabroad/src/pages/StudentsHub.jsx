import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/students.css";
import { getStudentOverview } from "../utils/api";
import { EXAM_FAMILIES } from "../students/catalog";

export default function StudentsHub() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    document.title = "Students | Ravidassia Abroad";
    getStudentOverview()
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const recentAttempts = overview?.recentAttempts || [];
  const families = Object.values(EXAM_FAMILIES);

  return (
    <main className="students-page">
      <section className="students-hero">
        <div className="container students-shell">
          <div className="students-hero-grid">
            <div>
              <span className="students-kicker">Students Hub</span>
              <h1>Premium English test practice for study-abroad planning.</h1>
              <p>
                Explore exam families, pick the right variant, and move into a
                clean mock-test workflow built for future expansion.
              </p>
              <div className="students-hero-actions">
                <Link to="/students/tests" className="btn btn-dark rounded-pill px-4">
                  Explore Tests
                </Link>
                <Link to="/students/tests/celpip" className="btn btn-outline-dark rounded-pill px-4">
                  Start CELPIP
                </Link>
              </div>
            </div>

            <div className="students-hero-panel">
              <div className="students-stat-card">
                <span className="students-stat-label">Exam families</span>
                <strong>{families.length}</strong>
                <small>CELPIP live first, IELTS and PTE scaffolded for rollout.</small>
              </div>
              <div className="students-stat-card">
                <span className="students-stat-label">Variants ready</span>
                <strong>{overview?.catalogSummary?.variantCount || 6}</strong>
                <small>Academic, General, Core, and future-safe pathways.</small>
              </div>
              <div className="students-stat-card">
                <span className="students-stat-label">Your access</span>
                <strong>{user ? "Logged in" : "Guest mode"}</strong>
                <small>
                  Landing pages stay visible, while real practice areas require
                  sign-in.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="students-section">
        <div className="container students-shell">
          <div className="students-section-head">
            <div>
              <span className="students-section-kicker">Exam Families</span>
              <h2>Choose the test journey that matches your abroad goals.</h2>
            </div>
            <Link to="/students/tests" className="btn btn-outline-dark rounded-pill px-4">
              Choose Test Type
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
                  <h3>{family.name}</h3>
                  <p>{family.description}</p>
                </div>
                <div className="students-chip-row">
                  {family.variants.map((variant) => (
                    <span key={variant.slug} className="students-chip">
                      {variant.name}
                    </span>
                  ))}
                </div>
                <div className="students-family-actions">
                  <Link to={`/students/tests/${family.slug}`} className="btn btn-dark rounded-pill px-4">
                    {family.isImplemented ? "Start Practice" : "View Structure"}
                  </Link>
                  <Link to="/students/tests" className="btn btn-link">
                    Explore Tests
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="students-section students-section-muted">
        <div className="container students-shell">
          <div className="students-dual-grid">
            <div className="students-panel">
              <span className="students-section-kicker">Progress</span>
              <h3>Recent attempts and return points</h3>
              {user ? (
                recentAttempts.length ? (
                  <div className="students-list">
                    {recentAttempts.map((attempt) => (
                      <Link
                        key={attempt.id}
                        to={`/students/tests/${attempt.exam_slug}/attempts/${attempt.id}/result`}
                        className="students-list-item"
                      >
                        <div>
                          <strong>{attempt.test_title}</strong>
                          <small>{attempt.variant_name || "All variants"}</small>
                        </div>
                        <span>{attempt.status_label}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="students-empty">
                    No attempts yet. Start with the CELPIP full mock or practice by section.
                  </p>
                )
              ) : (
                <p className="students-empty">
                  Sign in to save attempts, resume in-progress tests, and view results history.
                </p>
              )}
            </div>

            <div className="students-panel">
              <span className="students-section-kicker">Future-ready</span>
              <h3>Built to expand beyond mock tests</h3>
              <ul className="students-feature-list">
                <li>Reusable exam family, variant, section, test, and attempt architecture</li>
                <li>Protected practice workflows with redirect-back login behavior</li>
                <li>Content-ready question-bank structure for future imports and AI scoring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
