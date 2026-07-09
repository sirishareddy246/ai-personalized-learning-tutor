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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Feedback 📊</h1>
      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></div>}
      {error && <p style={{ color: '#ef4444' }}>⚠ {error}</p>}
      {!id && !loading && (
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
          Complete a quiz to see your feedback here.
        </div>
      )}
      {data && (
        <FeedbackPanel result={{
          score: data.score,
          total: data.quizzes?.questions?.length || 0,
          correct: Math.round((data.score / 100) * (data.quizzes?.questions?.length || 0)),
          weak_topics: data.weak_topics || [],
          suggestions: (data.weak_topics || []).map(t => `Review the topic: "${t}"`),
          breakdown: [],
        }} />
      )}
    </div>
  );
}
