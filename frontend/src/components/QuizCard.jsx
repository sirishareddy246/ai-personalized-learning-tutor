export default function QuizCard({ question, index, selected, onSelect, revealed }) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.75rem',
      }}
    >
      {/* Question stem */}
      <p
        style={{
          fontWeight: 500,
          fontSize: 'var(--text-lg)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-normal)',
          marginBottom: '1.25rem',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--accent)',
            marginRight: '0.5rem',
          }}
        >
          {index + 1}.
        </span>
        {question.question}
      </p>

      {/* Options */}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {question.options.map((opt, i) => {
          const letter = letters[i];
          const isSelected = selected === letter;
          const correctAnswer = question.correct || question.correct_answer;
          const isCorrect = revealed && letter === correctAnswer;
          const isWrong = revealed && isSelected && letter !== correctAnswer;

          let extraClass = '';
          if (isCorrect) extraClass = 'correct';
          else if (isWrong) extraClass = 'incorrect';
          else if (isSelected) extraClass = 'selected';

          return (
            <button
              key={i}
              className={`quiz-option ${extraClass}`}
              onClick={() => !revealed && onSelect(letter)}
              disabled={revealed}
              style={{ cursor: revealed ? 'default' : 'pointer' }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `1.5px solid ${
                    isCorrect
                      ? 'var(--success)'
                      : isWrong
                      ? 'var(--error)'
                      : isSelected
                      ? 'var(--accent)'
                      : 'var(--border-default)'
                  }`,
                  background: isCorrect
                    ? 'var(--success)'
                    : isWrong
                    ? 'var(--error)'
                    : isSelected
                    ? 'var(--accent)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isCorrect || isWrong || isSelected ? '#fff' : 'var(--text-tertiary)',
                  transition: 'all var(--duration-fast) var(--ease-standard)',
                }}
              >
                {letter}
              </span>
              <span style={{ color: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--text-primary)' }}>
                {opt.replace(/^[A-D]\)\s*/, '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
