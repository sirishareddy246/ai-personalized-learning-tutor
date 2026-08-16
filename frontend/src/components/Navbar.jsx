import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ask', label: 'Ask AI' },
  { to: '/quiz', label: 'Quiz' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(244, 241, 234, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <span
            className="font-display"
            style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            AI Tutor
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navLinks.map(({ to, label }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard)',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
