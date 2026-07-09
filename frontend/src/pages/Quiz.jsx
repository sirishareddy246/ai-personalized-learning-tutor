import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizCard from '../components/QuizCard';
import FeedbackPanel from '../components/FeedbackPanel';
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

  useEffect(() => {
    getDocuments().then(({ data }) => {
      setDocuments(data.documents || []);
      if (!selectedDoc && data.documents?.length) setSelectedDoc(data.documents[0].id);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setLoading(true); setError(''); setQuiz(null); setResult(null); setAnswers({});
    try {
      const { data } = await generateQuiz(selectedDoc, difficulty, numQ);
      setQuiz(data.questions);
      setQuizId(data.quiz_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz.');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      const { data } = await submitQuiz(quizId, answers);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz.');
    } finally { setSubmitting(false); }
  };

  const answered = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Quiz 🧠</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Generate an adaptive quiz from your study material.</p>

      {/* Controls */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Document</label>
          <select id="quiz-doc-select" className="input" value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
            <option value="">— Choose a document —</option>
            {documents.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Difficulty</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={difficulty === d ? 'badge badge-' + d : 'btn-secondary'}
                  style={{ flex: 1, textTransform: 'capitalize', fontSize: '0.85rem', padding: difficulty === d ? '0.45rem' : '0.45rem' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Questions: {numQ}</label>
            <input type="range" min={3} max={10} value={numQ} onChange={(e) => setNumQ(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '0.5rem' }} />
          </div>
        </div>

        <button id="generate-quiz-btn" className="btn-primary" onClick={handleGenerate} disabled={loading || !selectedDoc}>
          {loading ? <><span className="spinner" /> Generating…</> : '✨ Generate Quiz'}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠ {error}</p>}

      {/* Questions */}
      {quiz && !result && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{answered}/{quiz.length} answered</span>
            <span className={`badge badge-${difficulty}`} style={{ textTransform: 'capitalize' }}>{difficulty}</span>
          </div>
          {quiz.map((q, i) => (
            <QuizCard key={q.id} question={q} index={i} selected={answers[q.id]} onSelect={(ans) => setAnswers(prev => ({ ...prev, [q.id]: ans }))} revealed={false} />
          ))}
          <button id="submit-quiz-btn" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.9rem' }}
            onClick={handleSubmit} disabled={submitting || answered < quiz.length}>
            {submitting ? <><span className="spinner" /> Submitting…</> : 'Submit Quiz →'}
          </button>
          {answered < quiz.length && <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.82rem', marginTop: '0.5rem' }}>Answer all {quiz.length} questions to submit.</p>}
        </div>
      )}

      {/* Results */}
      {quiz && result && (
        <div className="fade-in">
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Review Answers</h2>
          {quiz.map((q, i) => (
            <QuizCard key={q.id} question={q} index={i} selected={result.breakdown?.[i]?.user_answer} onSelect={() => {}} revealed={true} />
          ))}
          <FeedbackPanel result={result} />
          <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => { setQuiz(null); setResult(null); setAnswers({}); }}>
            Take Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
