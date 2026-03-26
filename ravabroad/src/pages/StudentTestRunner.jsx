import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import "../css/students.css";
import {
  createExamAttempt,
  getAttemptDetail,
  saveAttemptAnswer,
  saveAttemptSectionState,
  submitAttempt,
} from "../utils/api";

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudentTestRunner() {
  const { examSlug, testId } = useParams();
  const [searchParams] = useSearchParams();
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [savingStatus, setSavingStatus] = useState("Ready");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAttempt() {
      try {
        const requestedAttemptId = searchParams.get("attemptId");
        const activeAttemptId = requestedAttemptId
          ? requestedAttemptId
          : (await createExamAttempt(testId)).attempt.id;
        const data = await getAttemptDetail(activeAttemptId);
        if (cancelled) {
          return;
        }
        setAttempt(data);
        const mappedAnswers = {};
        (data.answers || []).forEach((item) => {
          mappedAnswers[item.exam_question_id] =
            item.answer_option_key || item.answer_text || item.answer_json || "";
        });
        setAnswers(mappedAnswers);
        setCurrentQuestionId(data.questions?.[0]?.id || null);
        setRemainingSeconds(data.remainingSeconds);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message);
        }
      }
    }

    loadAttempt();
    return () => {
      cancelled = true;
    };
  }, [searchParams, testId]);

  useEffect(() => {
    if (!attempt?.attempt?.id) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  useEffect(() => {
    if (!attempt?.attempt?.id || !currentQuestionId) {
      return undefined;
    }

    const currentQuestion = attempt.questions.find((question) => question.id === currentQuestionId);
    const currentValue = answers[currentQuestionId];
    const timeout = window.setTimeout(async () => {
      if (currentValue === undefined) {
        return;
      }
      setSavingStatus("Saving...");
      try {
        await saveAttemptAnswer(attempt.attempt.id, {
          examQuestionId: currentQuestionId,
          questionType: currentQuestion?.question_type,
          answer:
            typeof currentValue === "string" || Array.isArray(currentValue)
              ? { value: currentValue }
              : currentValue,
        });
        await saveAttemptSectionState(attempt.attempt.id, {
          examSectionId: currentQuestion?.exam_section_id,
          timeSpentSeconds: (attempt.test.duration_seconds || 0) - remainingSeconds,
          stateJson: {
            currentQuestionId,
            remainingSeconds,
          },
        });
        setSavingStatus("Saved");
      } catch {
        setSavingStatus("Save failed");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [answers, attempt, currentQuestionId, remainingSeconds]);

  if (loadError) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="alert alert-warning">{loadError}</div>
        </div>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="students-page students-page-compact">
        <div className="container students-shell py-5">
          <div className="students-panel">Loading test runner...</div>
        </div>
      </main>
    );
  }

  const currentQuestion =
    attempt.questions.find((question) => question.id === currentQuestionId) ||
    attempt.questions[0];
  const questionIndex = attempt.questions.findIndex((question) => question.id === currentQuestion?.id);

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitAttempt(attempt.attempt.id);
      window.location.href = `/students/tests/${examSlug}/attempts/${attempt.attempt.id}/result`;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="students-page students-page-compact">
      <section className="students-section">
        <div className="container students-shell">
          <div className="students-runner-header">
            <div>
              <span className="students-section-kicker">{currentQuestion?.section_name}</span>
              <h1>{attempt.test.title}</h1>
            </div>
            <div className="students-runner-header-actions">
              <Link to={`/students/tests/${examSlug}/tests`} className="btn btn-outline-dark rounded-pill px-4">
                Exam Parts
              </Link>
              <Link to={`/students/tests/${examSlug}/attempts`} className="btn btn-outline-dark rounded-pill px-4">
                Answer Key & Results
              </Link>
            </div>
          </div>

          <div className="students-question-nav students-question-nav-bar">
            {attempt.questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                className={`students-question-pill ${question.id === currentQuestion?.id ? "is-active" : ""} ${answers[question.id] ? "is-answered" : ""}`}
                onClick={() => setCurrentQuestionId(question.id)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="students-runner-stage">
            <div className="students-runner-context">
              <div className="students-panel">
                <div className="students-runner-stage-head">
                  <div>
                    <span className="students-runner-progress">Question {questionIndex + 1} of {attempt.questions.length}</span>
                    <h2>{currentQuestion?.question_type === "single_select" || currentQuestion?.question_type === "multi_select" ? "Listen / Read and answer" : "Complete the response"}</h2>
                  </div>
                  <div className="students-runner-timer-chip">
                    <span>{formatSeconds(remainingSeconds)}</span>
                    <small>{savingStatus}</small>
                  </div>
                </div>

                <div className="students-practice-note">
                  Practice mode: audio replay may be available here. Official test conditions may differ.
                </div>

                {currentQuestion?.part_instructions ? (
                  <div className="students-part-instructions">
                    <strong>Instructions</strong>
                    <p>{currentQuestion.part_instructions}</p>
                  </div>
                ) : null}

                <div className="students-media-card">
                  {currentQuestion?.section_name === "Listening" ? (
                    <>
                      <h3>Listen to the conversation</h3>
                      <div className="students-audio-placeholder">
                        <div className="students-audio-bar"></div>
                        <span>Practice transcript available below</span>
                      </div>
                      <details className="students-transcript-panel" open>
                        <summary>Show Transcript</summary>
                        <p>{currentQuestion?.passage_text || "Transcript will appear here when provided."}</p>
                      </details>
                    </>
                  ) : currentQuestion?.passage_text ? (
                    <>
                      <h3>Passage</h3>
                      <div className="students-passage-card">
                        <p>{currentQuestion.passage_text}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>Task Brief</h3>
                      <div className="students-passage-card">
                        <p>{currentQuestion?.prompt}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="students-runner-question-pane">
              <div className="students-question-card students-question-card-blue">
                <div className="students-runner-question-head">
                  <div>
                    <span className="students-runner-progress">Question {questionIndex + 1} of {attempt.questions.length}</span>
                    <h2>{currentQuestion?.prompt}</h2>
                  </div>
                  <div className="students-runner-controls">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-4"
                      disabled={questionIndex <= 0}
                      onClick={() => setCurrentQuestionId(attempt.questions[questionIndex - 1].id)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4"
                      disabled={questionIndex === attempt.questions.length - 1}
                      onClick={() => setCurrentQuestionId(attempt.questions[questionIndex + 1].id)}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {currentQuestion?.question_type === "single_select" ? (
                  <div className="students-option-list">
                    {currentQuestion.options.map((option) => (
                      <label key={option.id} className="students-option-item students-option-item-plain">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={answers[currentQuestion.id] === option.option_key}
                          onChange={() => handleAnswerChange(option.option_key)}
                        />
                        <span>{option.option_text}</span>
                      </label>
                    ))}
                  </div>
                ) : null}

                {currentQuestion?.question_type === "multi_select" ? (
                  <div className="students-option-list">
                    {currentQuestion.options.map((option) => {
                      const selectedValues = Array.isArray(answers[currentQuestion.id])
                        ? answers[currentQuestion.id]
                        : [];
                      return (
                        <label key={option.id} className="students-option-item students-option-item-plain">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option.option_key)}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? [...selectedValues, option.option_key]
                                : selectedValues.filter((value) => value !== option.option_key);
                              handleAnswerChange(next);
                            }}
                          />
                          <span>{option.option_text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}

                {currentQuestion?.question_type === "written_response" ? (
                  <div>
                    <textarea
                      className="form-control students-long-answer"
                      rows="10"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(event) => handleAnswerChange(event.target.value)}
                      placeholder="Write your response here..."
                    />
                    <div className="students-answer-meta">
                      Words: {String(answers[currentQuestion.id] || "").trim().split(/\s+/).filter(Boolean).length}
                    </div>
                  </div>
                ) : null}

                {currentQuestion?.question_type === "spoken_response" ? (
                  <div className="students-speaking-card">
                    <p>
                      Browser recording hooks are prepared in the architecture. For now,
                      enter speaking notes or a transcript to save the response state.
                    </p>
                    <textarea
                      className="form-control students-long-answer"
                      rows="8"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(event) => handleAnswerChange(event.target.value)}
                      placeholder="Enter speaking notes or transcript..."
                    />
                  </div>
                ) : null}

                <div className="students-runner-footer">
                  <button className="btn btn-dark rounded-pill px-4" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Test"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
