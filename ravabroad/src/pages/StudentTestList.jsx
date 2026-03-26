import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "../css/students.css";
import { getExamAttempts, getExamTests } from "../utils/api";
import { getExamFamily } from "../students/catalog";

export default function StudentTestList() {
  const { examSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState("");
  const family = getExamFamily(examSlug);
  const variantSlug = searchParams.get("variant") || "";

  useEffect(() => {
    document.title = `${family?.name || "Exam"} Tests`;
    Promise.all([getExamTests(examSlug, variantSlug), getExamAttempts(examSlug)])
      .then(([testsData, attemptsData]) => {
        setPayload(testsData);
        setAttempts(attemptsData.attempts || []);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [examSlug, variantSlug, family]);

  if (!family) {
    return null;
  }

  const attemptLookup = {};
  attempts.forEach((attempt) => {
    if (!attemptLookup[attempt.exam_test_id]) {
      attemptLookup[attempt.exam_test_id] = attempt;
    }
  });

  const groupedTests = {
    full_mock: [],
    listening: [],
    reading: [],
    writing: [],
    speaking: [],
    other: [],
  };

  (payload?.tests || []).forEach((test) => {
    if (test.mode === "full_mock") {
      groupedTests.full_mock.push(test);
      return;
    }
    const key = test.section_slug || "other";
    groupedTests[key] = groupedTests[key] || [];
    groupedTests[key].push(test);
  });

  const sections = [
    { key: "full_mock", label: "Full Mock Tests" },
    { key: "listening", label: "Listening" },
    { key: "reading", label: "Reading" },
    { key: "writing", label: "Writing" },
    { key: "speaking", label: "Speaking" },
  ].filter((section) => groupedTests[section.key]?.length);

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-section-head">
            <div>
              <span className="students-section-kicker">{family.name}</span>
              <h1 className="students-page-title">Mock exams and practice sections</h1>
            </div>
            <Link to={`/students/tests/${examSlug}`} className="btn btn-outline-dark rounded-pill px-4">
              Back to dashboard
            </Link>
          </div>

          {variantSlug ? (
            <div className="students-filter-note">
              Filtered by variant: <strong>{payload?.variantName || variantSlug}</strong>
            </div>
          ) : null}

          {error ? <div className="alert alert-warning">{error}</div> : null}

          <div className="students-platform-banner">
            <span className="students-chip">Timed sections</span>
            <span className="students-chip">Actual practice format</span>
            <span className="students-chip">Results and review</span>
            <span className="students-chip">All 4 skills</span>
          </div>

          <div className="students-exam-groups">
            {sections.map((section) => (
              <section key={section.key} className="students-exam-group">
                <div className="students-exam-group-head">
                  <h2>{section.label}</h2>
                  <span>{groupedTests[section.key].length} tests</span>
                </div>

                <div className="students-exam-row-list">
                  {groupedTests[section.key].map((test) => {
                    const recentAttempt = attemptLookup[test.id];
                    const continueHref = recentAttempt?.status === "in_progress"
                      ? `/students/tests/${examSlug}/tests/${test.id}/start?attemptId=${recentAttempt.id}`
                      : `/students/tests/${examSlug}/tests/${test.id}`;
                    const scoreHref = recentAttempt && recentAttempt.status !== "in_progress"
                      ? `/students/tests/${examSlug}/attempts/${recentAttempt.id}/result`
                      : "";

                    return (
                      <article key={test.id} className="students-exam-row">
                        <div className="students-exam-row-main">
                          <div className="students-exam-row-title">
                            <h3>{test.title}</h3>
                            <span className="students-status-pill">
                              {recentAttempt ? recentAttempt.status_label : "Not Started"}
                            </span>
                          </div>
                          <p>{test.description}</p>
                          <div className="students-meta-row">
                            <span>{test.mode_label}</span>
                            <span>{test.section_name || "Mixed sections"}</span>
                            <span>{test.duration_label}</span>
                            <span>{test.variant_name || "All variants"}</span>
                          </div>
                        </div>

                        <div className="students-exam-row-actions">
                          <Link to={continueHref} className="btn btn-primary rounded-pill px-4">
                            {recentAttempt?.status === "in_progress" ? "Continue" : "Start"}
                          </Link>
                          {scoreHref ? (
                            <Link to={scoreHref} className="btn btn-outline-dark rounded-pill px-4">
                              Score
                            </Link>
                          ) : (
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" disabled>
                              Score
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
