import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizCard from '../components/QuizCard';
import FeedbackPanel from '../components/FeedbackPanel';
import AdaptiveQuizPanel from '../components/AdaptiveQuizPanel';
import { getDocuments, generateQuiz, submitQuiz } from '../lib/apiClient';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(searchParams.get('doc') || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQ, setNumQ] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quizMode, setQuizMode] = useState('level');

  useEffect(() => {
    getDocuments()
      .then(({ data }) => {
        setDocuments(data.documents || []);
        if (!selectedDoc && data.documents?.length) setSelectedDoc(data.documents[0].id);
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setError('');
    setQuiz(null);
    setResult(null);
    setAnswers({});
    try {
      const { data } = await generateQuiz(selectedDoc, difficulty, numQ);
      setQuiz(data.questions);
      setQuizId(data.quiz_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await submitQuiz(quizId, answers);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const answered = Object.keys(answers).length;

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: '0.4rem' }}
        >
          Quiz
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Test your knowledge from your uploaded study materials.
        </p>
      </div>

      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '2rem',
          background: 'var(--bg-sunken)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {[
          { key: 'level', label: 'Level-wise' },
          { key: 'adaptive', label: 'Adaptive' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setQuizMode(key)}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              transition: 'background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)',
              background: quizMode === key ? 'var(--bg-surface-raised)' : 'transparent',
              color: quizMode === key ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: quizMode === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── ADAPTIVE MODE ── */}
      {quizMode === 'adaptive' ? (
        <AdaptiveQuizPanel documents={documents} defaultSelectedDoc={selectedDoc} />
      ) : (
        <div className="fade-in">
          {/* Level-wise controls */}
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'grid',
              gap: '1rem',
            }}
          >
            {/* Document */}
            <div>
              <label
                htmlFor="quiz-doc-select"
                style={{ display: 'block', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}
              >
                Document
              </label>
              <select
                id="quiz-doc-select"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Difficulty */}
              <div>
                <label
                  style={{ display: 'block', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}
                >
                  Difficulty
                </label>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: difficulty === d ? 'none' : '1px solid var(--border-default)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        fontSize: 'var(--text-xs)',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast) var(--ease-standard)',
                        ...(difficulty === d
                          ? {
                              background: d === 'easy' ? 'var(--success-subtle)' : d === 'hard' ? 'var(--error-subtle)' : 'rgba(199,154,60,0.12)',
                              color: d === 'easy' ? 'var(--success)' : d === 'hard' ? 'var(--error)' : 'var(--warning)',
                            }
                          : {
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                            }),
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div>
                <label
                  style={{ display: 'block', fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}
                >
                  Questions: {numQ}
                </label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={numQ}
                  onChange={(e) => setNumQ(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            <button
              id="generate-quiz-btn"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={loading || !selectedDoc}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spinner" /> Generating…
                </span>
              ) : (
                'Generate quiz'
              )}
            </button>
          </div>

          {/* AI generating state */}
          {loading && (
            <div
              className="fade-in-fast"
              style={{
                padding: '2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div className="thinking-dots"><span /><span /><span /></div>
              <span
                className="font-display"
                style={{ fontStyle: 'italic', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
              >
                Building your quiz…
              </span>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: 'var(--text-sm)' }}>
              ⚠ {error}
            </p>
          )}

          {/* Active quiz */}
          {quiz && !result && (
            <div className="fade-in">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  {answered} of {quiz.length} answered
                </span>
                <span className={`badge badge-${difficulty}`}>{difficulty}</span>
              </div>

              {quiz.map((q, i) => (
                <QuizCard
                  key={q.id}
                  question={q}
                  index={i}
                  selected={answers[q.id]}
                  onSelect={(ans) => setAnswers((prev) => ({ ...prev, [q.id]: ans }))}
                  revealed={false}
                />
              ))}

              <button
                id="submit-quiz-btn"
                className="btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={handleSubmit}
                disabled={submitting || answered < quiz.length}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner" /> Submitting…
                  </span>
                ) : (
                  'Submit quiz'
                )}
              </button>

              {answered < quiz.length && (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>
                  Answer all {quiz.length} questions to submit.
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {quiz && result && (
            <div className="fade-in">
              <h2
                className="font-display"
                style={{
                  fontSize: 'var(--text-xl)',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  fontStyle: 'italic',
                }}
              >
                Here's how you did.
              </h2>
              {quiz.map((q, i) => (
                <QuizCard
                  key={q.id}
                  question={q}
                  index={i}
                  selected={result.breakdown?.[i]?.user_answer}
                  onSelect={() => {}}
                  revealed={true}
                />
              ))}
              <FeedbackPanel result={result} />
              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={() => { setQuiz(null); setResult(null); setAnswers({}); }}
              >
                Take another quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
