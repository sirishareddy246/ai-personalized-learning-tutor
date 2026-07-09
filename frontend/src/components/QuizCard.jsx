export default function QuizCard({ question, index, selected, onSelect, revealed }) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="glass fade-in" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>Q{index + 1}.</span>
        {question.question}
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {question.options.map((opt, i) => {
          const letter = letters[i];
          const isSelected = selected === letter;
          const isCorrect = revealed && letter === question.correct;
          const isWrong = revealed && isSelected && letter !== question.correct;

          return (
            <button
              key={i}
              onClick={() => !revealed && onSelect(letter)}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                borderColor: isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
                background: isCorrect ? 'rgba(16,185,129,0.12)' : isWrong ? 'rgba(239,68,68,0.12)' : isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                color: isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--text)',
              }}
            >
              <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>{letter})</span>
              {opt.replace(/^[A-D]\)\s*/, '')}
            </button>
          );
        })}
      </div>
      {revealed && question.explanation && (
        <div className="fade-in" style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.07)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}
