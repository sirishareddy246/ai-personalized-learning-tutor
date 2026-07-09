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

  // Coordinating local state so we don't flash/refresh questions instantly
  // when the user completes a batch. This allows them to read explanations
  // and remediation summaries before proceeding.
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({}); // questionId -> boolean
  const [submittingQ, setSubmittingQ] = useState({}); // questionId -> boolean
  const [answersFeedback, setAnswersFeedback] = useState({}); // questionId -> { isCorrect, explanation }
  const [transitionData, setTransitionData] = useState(null); // null | { status, level, summary, feedback }

  useEffect(() => {
    if (defaultSelectedDoc) {
      setSelectedDoc(defaultSelectedDoc);
    }
  }, [defaultSelectedDoc]);

  // When hook loads the first batch
  useEffect(() => {
    if (status === 'active' && questions.length > 0 && displayedQuestions.length === 0) {
      setDisplayedQuestions(questions);
    }
  }, [status, questions, displayedQuestions]);

  const handleStart = async () => {
    if (!selectedDoc) return;
    // Clear all states
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

      // Save feedback for this question
      setAnswersFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: res.isCorrect ?? (res.status !== 'in_progress' ? false : false),
          explanation: res.explanation || '',
        },
      }));
      setSubmittedAnswers((prev) => ({ ...prev, [questionId]: true }));

      // If this submission triggers a batch transition (advanced, demoted, remediation, ended)
      if (res.status && res.status !== 'in_progress') {
        // Find if any correct/incorrect was returned on the final evaluate call
        // Note: the submitAnswer endpoint will evaluate on the 3rd question.
        // We need to make sure the final question gets its isCorrect evaluation.
        // The API returns the evaluation result (isCorrect, explanation) or we can look it up.
        // For the last question, we should evaluate correct/incorrect locally if we know it.
        // Wait, the API returns the result, and if it's evaluated, it might have ended/advanced.
        // Let's set transition details.
        setTransitionData(res);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingQ((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleContinue = () => {
    // Load new questions from the hook into display state
    setDisplayedQuestions(questions);
    // Clear batch responses
    setAnswers({});
    setSubmittedAnswers({});
    setAnswersFeedback({});
    setTransitionData(null);
  };

  const isBatchDone =
    displayedQuestions.length > 0 &&
    displayedQuestions.every((q) => submittedAnswers[q.id]);

  if (status === 'idle') {
    return (
      <div className="fade-in">
        <div
          className="glass"
          style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
          <h2
            style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}
          >
            Adaptive AI Quiz Mode
          </h2>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: '0 auto 1.5rem',
            }}
          >
            Test your knowledge dynamically! The AI adjusts the difficulty based on
            your answers. Meet passing marks to level up, or receive custom micro-summaries
            on weak concepts if you struggle.
          </p>

          <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 2rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                fontSize: '0.9rem',
              }}
            >
              Select Document
            </label>
            <select
              className="input"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
            >
              <option value="">— Choose a document —</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', maxWidth: '300px' }}
            onClick={handleStart}
            disabled={!selectedDoc}
          >
            🚀 Start Adaptive Quiz
          </button>
        </div>

        {/* Feature info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="glass" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span>📈</span> Level Up Progression
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Start at **Easy** difficulty. Scoring 2/3 (or better) in a batch of 3 questions
              advances you to **Medium**, and subsequently to **Hard**.
            </p>
          </div>
          <div className="glass" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span>📖</span> AI Micro-Remediation
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              If you struggle with the Easy level, the tutor generates an AI micro-summary
              focused strictly on the concepts you missed so you can review and retry.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    const finalReport = feedback || {};
    const { highestLevelReached = 'easy', scoreByLevel = {}, weakTopics = [] } = finalReport;

    return (
      <div className="fade-in">
        <div
          className="glass pulse-glow"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏆</div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Adaptive Quiz Completed
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Here is your personalized learning tutor report.
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem 2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '1px' }}>
              Highest Mastery Level
            </span>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color:
                  highestLevelReached === 'hard'
                    ? '#8b5cf6'
                    : highestLevelReached === 'medium'
                    ? '#f59e0b'
                    : '#10b981',
                textTransform: 'uppercase',
                marginTop: '0.25rem',
              }}
            >
              {highestLevelReached}
            </span>
          </div>
        </div>

        {/* Scores per Level */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
            📊 Score Breakdown By Level
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
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
                    borderRadius: '10px',
                    background: attempted ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: '1px solid',
                    borderColor: attempted ? 'var(--border)' : 'rgba(255,255,255,0.03)',
                    opacity: attempted ? 1 : 0.4,
                  }}
                >
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge badge-${lvl}`}>{lvl}</span>
                  </span>
                  <span>
                    {attempted ? (
                      <strong style={{ color: 'var(--text)' }}>
                        {score.correct} / {score.total} correct (
                        {Math.round((score.correct / score.total) * 100)}%)
                      </strong>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Not Attempted</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Topics / Areas to Review */}
        {weakTopics && weakTopics.length > 0 && (
          <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#f87171' }}>
              📖 Suggested Sections to Revisit
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {weakTopics.map((topic, index) => (
                <div
                  key={topic.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.03)',
                    borderLeft: '4px solid #ef4444',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
                    Reference Material Chunk #{index + 1}
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                    "{topic.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" style={{ width: '100%' }} onClick={resetQuiz}>
          🔄 Start Another Quiz Session
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Batch Header */}
      <div
        className="glass"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Current Level
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
            <span className={`badge badge-${level}`} style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
              {level}
            </span>
          </div>
        </div>

        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }} onClick={exitQuiz}>
          ⏹ Exit Quiz
        </button>
      </div>

      {/* Display Questions */}
      {displayedQuestions.map((q, idx) => {
        const isSubmitted = !!submittedAnswers[q.id];
        const isSubmitting = !!submittingQ[q.id];
        const selected = answers[q.id] || '';
        const feedbackInfo = answersFeedback[q.id];

        // Format question in the way QuizCard expects, ensuring compatible fields
        const formattedQuestion = {
          ...q,
          correct_answer: q.correct_answer || '',
        };

        return (
          <div key={q.id} className="fade-in" style={{ marginBottom: '1.5rem' }}>
            <QuizCard
              question={formattedQuestion}
              index={idx}
              selected={selected}
              onSelect={(opt) => handleOptionSelect(q.id, opt)}
              revealed={isSubmitted}
            />

            {!isSubmitted && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                  onClick={() => handleSubmitQuestion(q.id)}
                  disabled={!selected || isSubmitting}
                >
                  {isSubmitting ? 'Checking...' : 'Submit Answer'}
                </button>
              </div>
            )}

            {isSubmitted && feedbackInfo && (
              <div
                style={{
                  marginTop: '-0.75rem',
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: feedbackInfo.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: '1px solid',
                  borderColor: feedbackInfo.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  fontSize: '0.88rem',
                  color: feedbackInfo.isCorrect ? '#10b981' : '#ef4444',
                }}
              >
                <strong>{feedbackInfo.isCorrect ? 'Correct! ' : 'Incorrect. '}</strong>
                {feedbackInfo.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Batch Transition Alerts & Navigation */}
      {isBatchDone && transitionData && (
        <div className="glass fade-in" style={{ padding: '1.5rem', marginTop: '2rem', border: '1px solid var(--primary)' }}>
          {transitionData.status === 'remediation' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📖</span>
                <h4 style={{ fontWeight: 800, margin: 0, color: 'var(--accent)' }}>
                  AI Tutor Remediation Summary
                </h4>
              </div>
              <p
                style={{
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--accent)',
                  marginBottom: '1.5rem',
                }}
              >
                {transitionData.summary}
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                📚 Try Next Easy Batch
              </button>
            </div>
          )}

          {transitionData.status === 'advanced' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌟</div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981', marginBottom: '0.5rem' }}>
                Advancing to {transitionData.level.toUpperCase()} Level!
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Great work! You scored {PASS_THRESHOLD * 100}% or higher in this level.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                Next Level Questions →
              </button>
            </div>
          )}

          {transitionData.status === 'demoted' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                Moving to {transitionData.level.toUpperCase()} Level
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                The questions were a bit tricky. Let's move down a level to rebuild your foundations.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                Continue to Easy Level Batch →
              </button>
            </div>
          )}

          {transitionData.status === 'ended' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏁</div>
              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                Quiz Finished!
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                You have finished all sections or hit the retry limits. Click below to view your personalized feedback report.
              </p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleContinue}>
                📊 View Final Feedback Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
