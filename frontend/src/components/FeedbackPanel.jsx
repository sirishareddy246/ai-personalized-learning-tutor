export default function FeedbackPanel({ result }) {
  if (!result) return null;
  const { score, total, correct, weak_topics, suggestions, breakdown } = result;

  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent! 🎉' : score >= 50 ? 'Good effort! 📚' : 'Keep practicing! 💪';

  return (
    <div className="fade-in" style={{ marginTop: '2rem' }}>
      {/* Score */}
      <div className="glass" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color }}>{score}%</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
        <div style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{correct} / {total} correct</div>
      </div>

      {/* Weak topics */}
      {weak_topics && weak_topics.length > 0 && (
        <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📌 Topics to Review</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {weak_topics.map((t, i) => (
              <span key={i} className="badge badge-hard">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>💡 Suggestions</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.4rem' }}>
            {suggestions.map((s, i) => (
              <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>→ {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Breakdown */}
      {breakdown && (
        <div className="glass" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📊 Answer Breakdown</h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {breakdown.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '8px', background: item.is_correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.is_correct ? '✅' : '❌'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Q{item.question_id}: Your answer <strong style={{ color: 'var(--text)' }}>{item.user_answer || '—'}</strong>, Correct: <strong style={{ color: '#10b981' }}>{item.correct_answer}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
