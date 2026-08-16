import { Link } from 'react-router-dom';

const features = [
  {
    label: 'Upload Materials',
    desc: 'PDF, DOCX, PPTX — your study notes extracted, chunked, and indexed instantly.',
  },
  {
    label: 'AI-Powered Q&A',
    desc: 'Ask any question from your documents and receive accurate, context-aware answers.',
  },
  {
    label: 'Adaptive Quizzes',
    desc: 'Easy, Medium, Hard questions generated from your material — difficulty adjusts to you.',
  },
  {
    label: 'Personalized Feedback',
    desc: 'Scores, weak-topic identification, and tailored study suggestions after every session.',
  },
];

export default function Home() {
  return (
    <div
      className="fade-in"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.5rem 5rem',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '680px', marginBottom: '5rem' }}>
        {/* Eyebrow chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--accent-subtle)',
            border: '1px solid rgba(217,119,87,0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '0.3rem 0.9rem',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
          }}
        >
          Groq AI + RAG
        </div>

        {/* Serif headline */}
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 2.75rem)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}
        >
          Your personal AI learning tutor
        </h1>

        {/* Sub-copy */}
        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: '2.5rem',
            maxWidth: '540px',
            margin: '0 auto 2.5rem',
          }}
        >
          Upload your study materials, ask questions, and take adaptive quizzes — all grounded in your own notes.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard">
            <button
              id="get-started-btn"
              className="btn-primary"
              style={{ fontSize: 'var(--text-base)', padding: '0.8rem 2rem' }}
            >
              Get started
            </button>
          </Link>
          <Link to="/ask">
            <button
              className="btn-secondary"
              style={{ fontSize: 'var(--text-base)', padding: '0.8rem 2rem' }}
            >
              Ask a question
            </button>
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          maxWidth: '960px',
          width: '100%',
        }}
      >
        {features.map((f, i) => (
          <div
            key={f.label}
            className="glass fade-in"
            style={{
              padding: '1.75rem',
              animationDelay: `${i * 60}ms`,
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              {f.label}
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-normal)',
              }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
