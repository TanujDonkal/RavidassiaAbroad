import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/students.css";
import { getAttemptResult } from "../utils/api";

export default function StudentAttemptResult() {
  const { examSlug, attemptId } = useParams();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    document.title = "Attempt Result | Students";
    getAttemptResult(attemptId)
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [attemptId]);

  if (!payload) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="students-panel">Loading result...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-panel">
            <div className="students-section-head">
              <div>
                <span className="students-section-kicker">Attempt Result</span>
                <h1>{payload.test.title}</h1>
              </div>
              <Link to={`/students/tests/${examSlug}/attempts`} className="btn btn-outline-dark rounded-pill px-4">
                Back to attempts
              </Link>
            </div>

            <div className="students-score-card-grid">
              <div className="students-score-card">
                <strong>{payload.attempt.total_score_label}</strong>
                <span>Overall Score</span>
              </div>
              {payload.sections.map((section) => (
                <div key={section.slug} className="students-score-card">
                  <strong>{section.score_label}</strong>
                  <span>{section.name}</span>
                </div>
              ))}
            </div>

            <div className="students-dual-grid mt-4">
              <div className="students-panel students-panel-inset">
                <h3>Section summary</h3>
                <div className="students-list">
                  {payload.sections.map((section) => (
                    <div key={section.slug} className="students-list-item students-list-item-static">
                      <div>
                        <strong>{section.name}</strong>
                        <small>{section.status_label}</small>
                      </div>
                      <span>{section.score_label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="students-panel students-panel-inset">
                <h3>Review notes</h3>
                <div className="students-overview-meta">
                  <div><strong>Status</strong><span>{payload.attempt.status_label}</span></div>
                  <div><strong>Started</strong><span>{payload.attempt.started_at_label}</span></div>
                  <div><strong>Completed</strong><span>{payload.attempt.completed_at_label}</span></div>
                  <div><strong>Evaluation</strong><span>{payload.sections.some((section) => section.score_label === "Pending") ? "Partially graded" : "Auto-scored"}</span></div>
                </div>
                <ul className="students-feature-list">
                  <li>Listening and reading objective items can show correctness and answer review.</li>
                  <li>Writing and speaking remain pending until future evaluation logic is added.</li>
                  <li>Explanations are scaffolded for future insertion through seed data or AI enrichment.</li>
                </ul>
              </div>
            </div>

            <div className="students-review-list">
              {payload.questions.map((question, index) => (
                <article key={question.id} className="students-review-card">
                  <span className="students-family-badge">
                    {question.section_name} · Q{index + 1}
                  </span>
                  <h3>{question.prompt}</h3>
                  <p><strong>Your answer:</strong> {question.user_answer_label}</p>
                  <p><strong>Correct answer:</strong> {question.correct_answer_label}</p>
                  <p><strong>Status:</strong> {question.review_status_label}</p>
                  <p><strong>Explanation:</strong> {question.explanation_label}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
