'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';
import { track } from '@/lib/analytics';

// Email + password auth (same account model as the Wishlist app): sign up
// once, then log in with the same credentials from any device to reach your
// entries. "Forgot password" emails a recovery link that lands on
// /reset-password — which also lets magic-link-era accounts (no password yet)
// set their first password.
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'link') {
      setError('That link did not work — it may have expired or already been used. Request a new one below.');
    }
  }, []);

  const switchMode = (m: 'login' | 'signup' | 'forgot') => {
    setMode(m);
    setError(null);
    setInfo(null);
    setSent(false);
  };

  const submit = async () => {
    if (!email.trim() || busy) return;
    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        setInfo('Check your email to confirm your account, then log in here.');
        track('signup_confirmation_sent');
      } else {
        track('signup_completed');
        router.replace('/');
        return;
      }
    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        track('password_signin');
        router.replace('/');
        return;
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
        track('password_reset_sent');
      }
    }
    setBusy(false);
  };

  const inputStyle = { fontSize: 22, fontWeight: 400, padding: 0 } as const;
  const underline = { marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--ink)' } as const;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, paddingTop: 'max(60px, env(safe-area-inset-top))' }}>
      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          INTENT
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>WELCOME</div>
      </div>

      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {mode !== 'forgot' && (
          <div className="fade-up">
            <div style={{ display: 'flex', gap: 22, marginBottom: 18 }}>
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                    paddingBottom: 4,
                    borderBottom: mode === m ? '1px solid var(--ink)' : '1px solid transparent',
                  }}
                >
                  {m === 'login' ? 'LOG IN' : 'SIGN UP'}
                </button>
              ))}
            </div>

            <h1 className="display" style={{ fontSize: 40, lineHeight: 1.08, margin: 0, fontWeight: 300 }}>
              {mode === 'login' ? (
                <>
                  Welcome
                  <br />
                  <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>back.</em>
                </>
              ) : (
                <>
                  Five short
                  <br />
                  writing rituals.
                  <br />
                  <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>One quiet</em>
                  <br />
                  <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>practice.</em>
                </>
              )}
            </h1>
            <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 300 }}>
              {mode === 'login'
                ? 'Log in with your email and password — your journal follows you to any device.'
                : 'Create an account with an email and password. Your words stay private, and you can log in from anywhere.'}
            </p>

            <div style={underline}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="serif"
                style={inputStyle}
              />
            </div>
            <div style={underline}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="serif"
                style={inputStyle}
              />
            </div>

            {error && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 12 }}>
                {error}
              </div>
            )}
            {info && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.6 }}>
                {info}
              </div>
            )}

            {mode === 'login' && (
              <button
                onClick={() => switchMode('forgot')}
                className="mono"
                style={{ marginTop: 22, fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3, alignSelf: 'flex-start' }}
              >
                FORGOT PASSWORD?
              </button>
            )}
          </div>
        )}

        {mode === 'forgot' && !sent && (
          <div className="fade-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
              ── FORGOT PASSWORD
            </div>
            <h1 className="display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 300 }}>
              Set a new
              <br />
              <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>password.</em>
            </h1>
            <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 300 }}>
              We&rsquo;ll email you a link. Open it and choose a new password — your entries stay right where they are.
            </p>
            <div style={{ marginTop: 28, paddingBottom: 8, borderBottom: '1px solid var(--ink)' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className="serif"
                style={inputStyle}
              />
            </div>
            {error && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 10 }}>
                {error}
              </div>
            )}
            <button
              onClick={() => switchMode('login')}
              className="mono"
              style={{ marginTop: 24, fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              ← BACK TO LOG IN
            </button>
          </div>
        )}

        {mode === 'forgot' && sent && (
          <div className="fade-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
              ── CHECK YOUR EMAIL
            </div>
            <h1 className="display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 300 }}>
              A link is on
              <br />
              its way to
              <br />
              <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>{email.trim()}</em>
            </h1>
            <p style={{ marginTop: 24, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 300 }}>
              Open it on this device to choose a new password.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mono"
              style={{ marginTop: 24, fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              USE A DIFFERENT EMAIL
            </button>
          </div>
        )}
      </div>

      {(mode !== 'forgot' || !sent) && (
        <div style={{ padding: '16px 24px max(32px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={submit}
            disabled={!email.trim() || busy || (mode !== 'forgot' && !password)}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 4,
              background: !email.trim() || busy || (mode !== 'forgot' && !password) ? 'var(--paper-3)' : 'var(--ink)',
              color: !email.trim() || busy || (mode !== 'forgot' && !password) ? 'var(--ink-3)' : 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 22px',
              fontSize: 16,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <span>
              {busy
                ? 'One moment…'
                : mode === 'login'
                  ? 'Log in'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Email me a reset link'}
            </span>
            <Icon.Arrow size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
