import { useState, useEffect } from 'react';
import { useAdaptiveQuiz } from '../hooks/useAdaptiveQuiz';
import QuizCard from './QuizCard';

export default function AdaptiveQuizPanel({ documents, defaultSelectedDoc }) {
  const [selectedDoc, setSelectedDoc] = useState(defaultSelectedDoc || '');
  const {
    status,
    level,
    questions,
    remediationSummary,
    feedback,
    start,
    submitAnswer,
    exitQuiz,
    resetQuiz,
  } = useAdaptiveQuiz(selectedDoc);

  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [submittingQ, setSubmittingQ] = useState({});
  const [answersFeedback, setAnswersFeedback] = useState({});
  const [transitionData, setTransitionData] = useState(null);

  useEffect(() => {
    if (defaultSelectedDoc) setSelectedDoc(defaultSelectedDoc);
  }, [defaultSelectedDoc]);

  useEffect(() => {
    if (status === 'active' && questions.length > 0 && displayedQuestions.length === 0) {
      setDisplayedQuestions(questions);
    }
  }, [status, questions, displayedQuestions]);

  const handleStart = async () => {
    if (!selectedDoc) return;
    setDisplayedQuestions([]);
    setAnswers({});
    setSubmittedAnswers({});
    setSubmittingQ({});
    setAnswersFeedback({});
    setTransitionData(null);
    await start();
  };

  const handleOptionSelect = (questionId, option) => {
    if (submittedAnswers[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuestion = async (questionId) => {
    const selectedAnswer = answers[questionId];
    if (!selectedAnswer || submittedAnswers[questionId]) return;
    setSubmittingQ((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await submitAnswer(questionId, selectedAnswer);
      setAnswersFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: res.isCorrect ?? false,
          explanation: res.explanation || '',
        },
      }));
      setSubmittedAnswers((prev) => ({ ...prev, [questionId]: true }));
      if (res.status && res.status !== 'in_progress') {
        setTransitionData(res);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingQ((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleContinue = () => {
    setDisplayedQuestions(questions);
    setAnswers({});
    setSubmittedAnswers({});
    setAnswersFeedback({});
    setTransitionData(null);
  };

  const isBatchDone =
    displayedQuestions.length > 0 &&
    displayedQuestions.every((q) => submittedAnswers[q.id]);

  /* ── IDLE STATE ── */
  if (status === 'idle') {
    return (
      <div className="fade-in">
        <div
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Adaptive Quiz
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: '480px',
              margin: '0 auto 1.75rem',
            }}
          >
            The tutor adjusts difficulty based on your answers — starting Easy, advancing
            to Medium then Hard when you score 2 out of 3 or better. Struggle at Easy?
            You'll receive a personalised micro-summary before retrying.
          </p>

          <div style={{ textAlign: 'left', maxWidth: '360px', margin: '0 auto 1.75rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 500,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Document
            </label>
            <select
              className="input"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
            >
              <option value="">— Choose a document —</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            style={{ minWidth: '200px' }}
            onClick={handleStart}
            disabled={!selectedDoc}
          >
            Begin quiz
          </button>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          {[
            {
              title: 'Level progression',
              body: 'Score 2/3 on Easy to advance to Medium, then Hard. Each level tests deeper understanding.',
            },
            {
              title: 'AI remediation',
              body: 'Stuck on Easy? The tutor generates a focused micro-summary on the concepts you missed.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass"
              style={{ padding: '1.25rem' }}
            >
              <h4
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem',
                }}
              >
                {card.title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── ENDED STATE ── */
  if (status === 'ended') {
    const finalReport = feedback || {};
    const { highestLevelReached = 'easy', scoreByLevel = {}, weakTopics = [] } = finalReport;

    const levelColor =
      highestLevelReached === 'hard'
        ? 'var(--error)'
        : highestLevelReached === 'medium'
        ? 'var(--warning)'
        : 'var(--success)';

    return (
      <div className="fade-in">
        {/* Summary hero */}
        <div
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem',
          }}
        >
          <p
            className="font-display"
            style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Quiz complete
          </p>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: '1.5rem',
            }}
          >
            Here's your personalised learning report.
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem 2rem',
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-tertiary)',
                marginBottom: '0.35rem',
              }}
            >
              Highest mastery level
            </span>
            <span
              className="badge"
              style={{
                fontSize: '1rem',
                padding: '0.35rem 1rem',
                background: `${levelColor}15`,
                border: `1px solid ${levelColor}40`,
                color: levelColor,
              }}
            >
              {highestLevelReached}
            </span>
          </div>
        </div>

        {/* Score by level */}
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
          }}
        >
          <h3
            style={{
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}
          >
            Score breakdown
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {['easy', 'medium', 'hard'].map((lvl) => {
              const score = scoreByLevel[lvl];
              const attempted = !!score;
              return (
                <div
                  key={lvl}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: attempted ? 'var(--bg-sunken)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    opacity: attempted ? 1 : 0.45,
                  }}
                >
                  <span className={`badge badge-${lvl}`}>{lvl}</span>
                  {attempted ? (
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {score.correct} / {score.total} ({Math.round((score.correct / score.total) * 100)}%)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Not attempted</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak topics */}
        {weakTopics && weakTopics.length > 0 && (
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
              }}
            >
              Sections to revisit
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {weakTopics.map((topic, index) => (
                <div
                  key={topic.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--error-subtle)',
                    borderLeft: '3px solid var(--error)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 'var(--leading-normal)',
                  }}
                >
                  <div
                    style={{ fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-primary)' }}
                  >
                    Reference passage {index + 1}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    "{topic.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={resetQuiz}
        >
          Start another session
        </button>
      </div>
    );
  }

  /* ── ACTIVE QUIZ STATE ── */
  return (
    <div className="fade-in">
      {/* Batch header */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Difficulty
          </span>
          <span className={`badge badge-${level}`}>{level}</span>
        </div>

        <button
          className="btn-secondary"
          style={{ fontSize: 'var(--text-xs)', padding: '0.35rem 0.875rem' }}
          onClick={exitQuiz}
        >
          Exit
        </button>
      </div>

      {/* Questions */}
      {displayedQuestions.map((q, idx) => {
        const isSubmitted = !!submittedAnswers[q.id];
        const isSubmitting = !!submittingQ[q.id];
        const selected = answers[q.id] || '';
        const feedbackInfo = answersFeedback[q.id];

        return (
          <div key={q.id} className="fade-in" style={{ marginBottom: '1.25rem', animationDelay: `${idx * 60}ms` }}>
            <QuizCard
              question={{ ...q, correct_answer: q.correct_answer || '' }}
              index={idx}
              selected={selected}
              onSelect={(opt) => handleOptionSelect(q.id, opt)}
              revealed={isSubmitted}
            />

            {/* Submit button */}
            {!isSubmitted && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.625rem' }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 'var(--text-sm)', padding: '0.5rem 1.25rem' }}
                  onClick={() => handleSubmitQuestion(q.id)}
                  disabled={!selected || isSubmitting}
                >
                  {isSubmitting ? <span className="spinner" /> : 'Submit answer'}
                </button>
              </div>
            )}

            {/* Per-question feedback */}
            {isSubmitted && feedbackInfo && (
              <div
                className="fade-in-fast"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: feedbackInfo.isCorrect ? 'var(--success-subtle)' : 'var(--error-subtle)',
                  border: `1px solid ${feedbackInfo.isCorrect ? 'rgba(106,138,95,0.35)' : 'rgba(194,84,63,0.35)'}`,
                  fontSize: 'var(--text-sm)',
                  color: feedbackInfo.isCorrect ? 'var(--success)' : 'var(--error)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {/* Serif voice for the AI lede */}
                <span className="font-display" style={{ fontStyle: 'italic' }}>
                  {feedbackInfo.isCorrect ? 'Correct. ' : 'Not quite — '}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{feedbackInfo.explanation}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Batch transition panel */}
      {isBatchDone && transitionData && (
        <div
          className="glass fade-in"
          style={{
            padding: '1.5rem',
            marginTop: '1.5rem',
            borderColor: 'var(--accent)',
          }}
        >
          {transitionData.status === 'remediation' && (
            <div>
              <p
                className="font-display"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  marginBottom: '0.875rem',
                }}
              >
                Let's revisit a few concepts before continuing.
              </p>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-normal)',
                  padding: '1rem',
                  background: 'var(--bg-sunken)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--accent)',
                  marginBottom: '1.25rem',
                }}
              >
                {transitionData.summary}
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                Try next batch
              </button>
            </div>
          )}

          {transitionData.status === 'advanced' && (
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-display"
                style={{
                  fontSize: 'var(--text-lg)',
                  color: 'var(--success)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                }}
              >
                Well done — moving to {transitionData.level} level.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.25rem' }}>
                You cleared this batch. Next questions will be a step harder.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                Continue →
              </button>
            </div>
          )}

          {transitionData.status === 'demoted' && (
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-display"
                style={{
                  fontSize: 'var(--text-lg)',
                  color: 'var(--warning)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                }}
              >
                Those were tricky — stepping back a level.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.25rem' }}>
                Rebuilding foundations before moving forward again.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                Continue →
              </button>
            </div>
          )}

          {transitionData.status === 'ended' && (
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-display"
                style={{
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  marginBottom: '0.5rem',
                }}
              >
                That's the quiz complete.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.25rem' }}>
                View your full personalised feedback report below.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                View feedback report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
