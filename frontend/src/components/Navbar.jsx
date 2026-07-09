import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ask', label: 'Ask AI' },
  { to: '/quiz', label: 'Quiz' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span className="gradient-text">AI Tutor</span>
        </Link>
        <div className="flex items-center gap-2">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                color: pathname.startsWith(to) ? 'white' : 'var(--muted)',
                background: pathname.startsWith(to) ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: pathname.startsWith(to) ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
