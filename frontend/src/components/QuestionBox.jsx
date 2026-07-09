import { useState } from 'react';
import { askQuestion } from '../lib/apiClient';

export default function QuestionBox({ documentId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim() || !documentId) return;
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const { data } = await askQuestion(question, documentId);
      setAnswer(data.answer);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass fade-in" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>💬 Ask a Question</h3>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          className="input"
          placeholder="e.g. What is the main topic of this document?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          disabled={loading || !documentId}
        />
        <button className="btn-primary" onClick={handleAsk} disabled={loading || !question.trim() || !documentId} style={{ whiteSpace: 'nowrap' }}>
          {loading ? <span className="spinner" /> : 'Ask'}
        </button>
      </div>
      {!documentId && (
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Select a document first.</p>
      )}
      {answer && (
        <div className="fade-in" style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>AI ANSWER</span>
          {answer}
        </div>
      )}
      {error && <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>⚠ {error}</p>}
    </div>
  );
}
