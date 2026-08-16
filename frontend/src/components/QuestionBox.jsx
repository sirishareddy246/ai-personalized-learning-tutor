import { useState, useEffect, useRef } from 'react';
import { askQuestion } from '../lib/apiClient';

const THINKING_PHRASES = [
  'Reading your document…',
  'Finding relevant passages…',
  'Composing an answer…',
];

export default function QuestionBox({ documentId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef(null);

  // Cycle through status phrases while loading
  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setPhraseIdx((p) => (p + 1) % THINKING_PHRASES.length);
      }, 2000);
    } else {
      clearInterval(intervalRef.current);
      setPhraseIdx(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  // Fake-stream the answer in word chunks
  useEffect(() => {
    if (!answer) { setDisplayedAnswer(''); return; }
    setDisplayedAnswer('');
    setStreaming(true);
    const words = answer.split(' ');
    let idx = 0;
    const timer = setInterval(() => {
      idx += 3; // reveal 3 words at a time
      setDisplayedAnswer(words.slice(0, idx).join(' '));
      if (idx >= words.length) {
        setDisplayedAnswer(answer);
        setStreaming(false);
        clearInterval(timer);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [answer]);

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
    <div
      className="glass fade-in"
      style={{ padding: '1.75rem' }}
    >
      <h3
        style={{
          fontWeight: 600,
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          marginBottom: '1rem',
        }}
      >
        Ask a question
      </h3>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <input
          className="input"
          placeholder="e.g. What is the main topic of this document?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          disabled={loading || !documentId}
        />
        <button
          className="btn-primary"
          onClick={handleAsk}
          disabled={loading || !question.trim() || !documentId}
          style={{ whiteSpace: 'nowrap', minWidth: '72px' }}
        >
          {loading ? <span className="spinner" /> : 'Ask'}
        </button>
      </div>

      {!documentId && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>
          Select a document first.
        </p>
      )}

      {/* AI thinking state */}
      {loading && (
        <div
          className="fade-in-fast"
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <div className="thinking-dots"><span /><span /><span /></div>
          <span
            key={phraseIdx}
            style={{ animation: 'fadeSlideUp 320ms ease both' }}
          >
            {THINKING_PHRASES[phraseIdx]}
          </span>
        </div>
      )}

      {/* Streaming answer */}
      {(displayedAnswer || answer) && !loading && (
        <div
          className="fade-in-fast"
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}
          >
            Answer
          </p>
          <p
            className={streaming ? 'stream-cursor' : ''}
            style={{
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-normal)',
              whiteSpace: 'pre-wrap',
              fontSize: 'var(--text-base)',
            }}
          >
            {displayedAnswer || answer}
          </p>
        </div>
      )}

      {error && (
        <p
          className="fade-in-fast"
          style={{ color: 'var(--error)', marginTop: '0.75rem', fontSize: 'var(--text-sm)' }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
