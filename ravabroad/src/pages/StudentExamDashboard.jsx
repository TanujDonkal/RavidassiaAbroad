import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/students.css";
import { getExamDashboard } from "../utils/api";
import { getExamFamily } from "../students/catalog";

export default function StudentExamDashboard() {
  const { examSlug } = useParams();
  const family = getExamFamily(examSlug);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!family) {
      setError("Exam not found.");
      return;
    }
    document.title = `${family.name} | Students`;
    getExamDashboard(examSlug)
      .then((data) => {
        setDashboard(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [examSlug, family]);

  if (!family) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="students-panel">
            <h1>Exam not found</h1>
            <Link to="/students/tests" className="btn btn-dark rounded-pill px-4">
              Back to tests
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const recentAttempts = dashboard?.recentAttempts || [];
  const tests = dashboard?.tests || [];
  const isLive = family.isImplemented;

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-exam-hero" style={{ "--students-family-accent": family.accent }}>
            <div>
              <span className="students-section-kicker">{family.name} Dashboard</span>
              <h1>{family.name} practice hub</h1>
              <p>{family.description}</p>
              <div className="students-hero-actions">
                {isLive ? (
                  <>
                    <Link to={`/students/tests/${examSlug}/tests`} className="btn btn-dark rounded-pill px-4">
                      Start Full Mock Test
                    </Link>
                    <Link to={`/students/tests/${examSlug}/attempts`} className="btn btn-outline-dark rounded-pill px-4">
                      View Results
                    </Link>
                  </>
                ) : (
                  <Link to="/students/tests" className="btn btn-dark rounded-pill px-4">
                    Explore other exams
                  </Link>
                )}
              </div>
            </div>

            <aside className="students-disclaimer">
              <strong>Important note</strong>
              <p>{family.disclaimer}</p>
              {error ? <small>{error}</small> : null}
            </aside>
          </div>

          <div className="students-dual-grid">
            <div className="students-panel">
              <span className="students-section-kicker">Sections</span>
              <h3>{isLive ? "Practice by module" : "Planned module structure"}</h3>
              <div className="students-section-card-grid">
                {family.sections.map((section) => (
                  <div key={section.slug} className="students-mini-card">
                    <strong>{section.name}</strong>
                    <p>{section.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="students-panel">
              <span className="students-section-kicker">Variants</span>
              <h3>Choose the right pathway</h3>
              <div className="students-variant-grid">
                {(dashboard?.variants || family.variants).map((variant) => (
                  <Link
                    key={variant.slug}
                    to={isLive ? `/students/tests/${examSlug}/${variant.slug}` : `/students/tests/${examSlug}`}
                    className="students-variant-card students-variant-card-link"
                  >
                    <strong>{variant.name}</strong>
                    <p>{variant.description || variant.audience}</p>
                    <span>{variant.testCount ? `${variant.testCount} tests` : variant.availability}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="students-dual-grid">
            <div className="students-panel">
              <span className="students-section-kicker">Tests</span>
              <h3>{isLive ? "Available mock tests" : "Setup pending"}</h3>
              {tests.length ? (
                <div className="students-list">
                  {tests.map((test) => (
                    <Link key={test.id} to={`/students/tests/${examSlug}/tests/${test.id}`} className="students-list-item">
                      <div>
                        <strong>{test.title}</strong>
                        <small>{test.variant_name || "All variants"} · {test.mode_label}</small>
                      </div>
                      <span>{test.duration_label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="students-empty">
                  {isLive
                    ? "Tests will appear here as more CELPIP content is added."
                    : "The route structure is ready. Content and scoring can be plugged in later using the same engine."}
                </p>
              )}
            </div>

            <div className="students-panel">
              <span className="students-section-kicker">Recent attempts</span>
              <h3>Resume and review</h3>
              {recentAttempts.length ? (
                <div className="students-list">
                  {recentAttempts.map((attempt) => (
                    <Link
                      key={attempt.id}
                      to={
                        attempt.status === "in_progress"
                          ? `/students/tests/${examSlug}/tests/${attempt.exam_test_id}/start?attemptId=${attempt.id}`
                          : `/students/tests/${examSlug}/attempts/${attempt.id}/result`
                      }
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
                  No saved attempts yet. Your next run will show up here automatically.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
