import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FeedbackPanel from '../components/FeedbackPanel';
import { getFeedback } from '../lib/apiClient';

export default function Feedback() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getFeedback(id)
      .then(({ data: res }) => setData(res.feedback))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load feedback'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '780px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: '0.4rem' }}
        >
          Your feedback
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Personalised results from your quiz session.
        </p>
      </div>

      {loading && (
        <div
          style={{
            padding: '4rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <div className="thinking-dots"><span /><span /><span /></div>
          <span style={{ fontSize: 'var(--text-sm)' }}>Loading feedback…</span>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '1rem' }}>⚠ {error}</p>
      )}

      {!id && !loading && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Complete a quiz session to see your feedback here.
        </div>
      )}

      {data && (
        <FeedbackPanel
          result={{
            score: data.score,
            total: data.quizzes?.questions?.length || 0,
            correct: Math.round((data.score / 100) * (data.quizzes?.questions?.length || 0)),
            weak_topics: data.weak_topics || [],
            suggestions: (data.weak_topics || []).map((t) => `Review the topic: "${t}"`),
            breakdown: [],
          }}
        />
      )}
    </div>
  );
}
