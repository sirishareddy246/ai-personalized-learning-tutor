import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        const data = await signUp(email, password);
        if (data.session) {
          setMessage('Account created successfully! Redirecting…');
          setTimeout(() => navigate(from, { replace: true }), 1000);
        } else {
          setMessage('Account created! Please check your email to confirm your sign-up.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        minHeight: 'calc(100vh - 60px)',
        paddingTop: '6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingBottom: '4rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {mode === 'login'
              ? 'Sign in to access your study materials & quizzes'
              : 'Start learning with AI-powered tutoring'}
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'var(--bg-sunken)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-standard)',
              background: mode === 'login' ? 'var(--bg-surface-raised)' : 'transparent',
              color: mode === 'login' ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast) var(--ease-standard)',
              background: mode === 'signup' ? 'var(--bg-surface-raised)' : 'transparent',
              color: mode === 'signup' ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label
              htmlFor="auth-email"
              style={{
                display: 'block',
                fontWeight: 500,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              style={{
                display: 'block',
                fontWeight: 500,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="fade-in-fast">
              <label
                htmlFor="auth-confirm-password"
                style={{
                  display: 'block',
                  fontWeight: 500,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Confirm password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div
              className="fade-in-fast"
              style={{
                padding: '0.75rem',
                background: 'var(--error-subtle)',
                border: '1px solid rgba(196, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {message && (
            <div
              className="fade-in-fast"
              style={{
                padding: '0.75rem',
                background: 'var(--success-subtle)',
                border: '1px solid rgba(46, 125, 96, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--success)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
              }}
            >
              ✓ {message}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : mode === 'login' ? (
              'Sign in →'
            ) : (
              'Create account →'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          By continuing, you agree to AI Tutor's terms of service and privacy policy.
        </div>
      </div>
    </div>
  );
}
