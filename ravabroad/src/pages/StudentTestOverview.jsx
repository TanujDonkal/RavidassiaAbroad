import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/students.css";
import { createExamAttempt, getTestOverview } from "../utils/api";

export default function StudentTestOverview() {
  const { examSlug, testId } = useParams();
  const [payload, setPayload] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    document.title = "Test Overview | Students";
    getTestOverview(testId)
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [testId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await createExamAttempt(testId);
      window.location.href = `/students/tests/${examSlug}/tests/${testId}/start?attemptId=${result.attempt.id}`;
    } finally {
      setStarting(false);
    }
  };

  if (!payload) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="students-panel">Loading test overview...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-panel">
            <span className="students-section-kicker">{payload.examName}</span>
            <h1>{payload.test.title}</h1>
            <p>{payload.test.description}</p>

            <div className="students-overview-meta">
              <div><strong>Variant</strong><span>{payload.test.variant_name || "All variants"}</span></div>
              <div><strong>Mode</strong><span>{payload.test.mode_label}</span></div>
              <div><strong>Duration</strong><span>{payload.test.duration_label}</span></div>
              <div><strong>Status</strong><span>{payload.test.is_published ? "Published" : "Draft"}</span></div>
            </div>

            <div className="students-dual-grid mt-4">
              <div className="students-panel students-panel-inset">
                <h3>Test parts</h3>
                <div className="students-list">
                  {payload.parts.map((part) => (
                    <div key={part.id} className="students-list-item students-list-item-static">
                      <div>
                        <strong>{part.title}</strong>
                        <small>{part.section_name}</small>
                      </div>
                      <span>{part.duration_label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="students-panel students-panel-inset">
                <h3>Instructions</h3>
                <p>{payload.test.description}</p>
                <ul className="students-feature-list">
                  <li>Autosave is enabled while you work through the test.</li>
                  <li>Listening and reading questions can be auto-scored on submission.</li>
                  <li>Writing and speaking stay pending for future evaluation workflows.</li>
                </ul>
              </div>
            </div>

            <div className="students-hero-actions mt-4">
              <button className="btn btn-dark rounded-pill px-4" onClick={handleStart} disabled={starting}>
                {starting ? "Preparing attempt..." : "Start Practice"}
              </button>
              <Link to={`/students/tests/${examSlug}/tests`} className="btn btn-outline-dark rounded-pill px-4">
                Back to list
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
