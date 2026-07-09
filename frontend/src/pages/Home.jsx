import { Link } from 'react-router-dom';

const features = [
  { icon: '📤', title: 'Upload Documents', desc: 'PDF, DOCX, PPTX — your study materials extracted and indexed instantly.' },
  { icon: '🤖', title: 'AI-Powered Q&A', desc: 'Ask any question from your documents and get accurate, context-aware answers via Grok.' },
  { icon: '🧠', title: 'Adaptive Quizzes', desc: 'Easy, Medium, Hard quizzes generated from your material. Challenge yourself at every level.' },
  { icon: '📊', title: 'Personalized Feedback', desc: 'Get scores, weak topic identification, and study suggestions tailored to you.' },
];

export default function Home() {
  return (
    <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '700px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '999px', padding: '0.35rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '1.5rem' }}>
          <span>✨</span> Powered by Grok AI + RAG
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Your Personal{' '}
          <span className="gradient-text">AI Learning Tutor</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Upload your study materials, ask questions, take adaptive quizzes, and get personalized feedback — all powered by Retrieval-Augmented Generation.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard">
            <button id="get-started-btn" className="btn-primary pulse-glow" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              Get Started →
            </button>
          </Link>
          <Link to="/ask">
            <button className="btn-secondary" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              Ask AI
            </button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: '1000px', width: '100%', marginTop: '5rem' }}>
        {features.map((f) => (
          <div key={f.title} className="glass fade-in" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
