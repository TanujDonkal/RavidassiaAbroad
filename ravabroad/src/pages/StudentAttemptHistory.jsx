import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/students.css";
import { getExamAttempts } from "../utils/api";
import { getExamFamily } from "../students/catalog";

export default function StudentAttemptHistory() {
  const { examSlug } = useParams();
  const family = getExamFamily(examSlug);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    document.title = `${family?.name || "Exam"} Attempts`;
    getExamAttempts(examSlug)
      .then(setPayload)
      .catch(() => setPayload({ attempts: [] }));
  }, [examSlug, family]);

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-section-head">
            <div>
              <span className="students-section-kicker">{family?.name || "Exam"}</span>
              <h1 className="students-page-title">Attempt history</h1>
            </div>
            <Link to={`/students/tests/${examSlug}`} className="btn btn-outline-dark rounded-pill px-4">
              Back to dashboard
            </Link>
          </div>

          <div className="students-list">
            {(payload?.attempts || []).map((attempt) => (
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
                  <small>{attempt.variant_name || "All variants"} · {attempt.status_label}</small>
                </div>
                <span>{attempt.updated_at_label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
