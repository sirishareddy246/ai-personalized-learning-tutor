export default function FeedbackPanel({ result }) {
  if (!result) return null;
  const { score, total, correct, weak_topics, suggestions, breakdown } = result;

  const scoreNum = Math.round(score ?? 0);
  const isExcellent = scoreNum >= 80;
  const isGood = scoreNum >= 50;

  const scoreColor = isExcellent ? 'var(--success)' : isGood ? 'var(--warning)' : 'var(--error)';
  const scoreBg = isExcellent ? 'var(--success-subtle)' : isGood ? 'rgba(199,154,60,0.1)' : 'var(--error-subtle)';
  const lede = isExcellent
    ? 'Well done — that was a strong performance.'
    : isGood
    ? 'Good effort. A bit more practice on a few areas will sharpen things up.'
    : 'Keep going — understanding comes with repetition.';

  return (
    <div className="fade-in" style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
      {/* Score hero */}
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: scoreBg,
          border: `1px solid ${scoreColor}40`,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: scoreColor,
            lineHeight: 1,
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {scoreNum}%
        </div>
        <p
          style={{
            color: scoreColor,
            fontWeight: 500,
            marginTop: '0.5rem',
            fontSize: 'var(--text-sm)',
          }}
        >
          {correct} / {total} correct
        </p>
        {/* Serif lede in AI voice */}
        <p
          className="font-display"
          style={{
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            fontSize: 'var(--text-lg)',
            fontStyle: 'italic',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {lede}
        </p>
      </div>

      {/* Weak topics */}
      {weak_topics && weak_topics.length > 0 && (
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4
            style={{
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Topics to revisit
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {weak_topics.map((t, i) => (
              <span key={i} className="badge badge-hard">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4
            style={{
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Study suggestions
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
            {suggestions.map((s, i) => (
              <li
                key={i}
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4
            style={{
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Answer breakdown
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {breakdown.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  background: item.is_correct ? 'var(--success-subtle)' : 'var(--error-subtle)',
                  border: `1px solid ${item.is_correct ? 'rgba(106,138,95,0.3)' : 'rgba(194,84,63,0.3)'}`,
                }}
              >
                <span style={{ color: item.is_correct ? 'var(--success)' : 'var(--error)', flexShrink: 0 }}>
                  {item.is_correct ? '✓' : '✗'}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Q{item.question_id}: You answered{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{item.user_answer || '—'}</strong>
                  {' '}— correct answer:{' '}
                  <strong style={{ color: 'var(--success)' }}>{item.correct_answer}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
