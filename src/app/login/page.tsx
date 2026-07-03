'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';
import { track } from '@/lib/analytics';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
      track('magic_link_sent');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, paddingTop: 'max(60px, env(safe-area-inset-top))' }}>
      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          INTENT
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>SIGN IN</div>
      </div>

      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {!sent ? (
          <div className="fade-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
              ── WELCOME
            </div>
            <h1 className="display" style={{ fontSize: 44, lineHeight: 1.05, margin: 0, fontWeight: 300 }}>
              Five short
              <br />
              writing rituals.
              <br />
              <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>One quiet</em>
              <br />
              <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>practice.</em>
            </h1>
            <p style={{ marginTop: 28, fontSize: 16, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 300 }}>
              Sign in with your email. We’ll send a magic link — no password to remember.
            </p>

            <div style={{ marginTop: 32, paddingBottom: 8, borderBottom: '1px solid var(--ink)' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendLink()}
                placeholder="you@example.com"
                autoComplete="email"
                className="serif"
                style={{ fontSize: 22, fontWeight: 400, padding: 0 }}
              />
            </div>
            {error && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 10 }}>
                {error}
              </div>
            )}
          </div>
        ) : (
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
              Open it on this device to start writing. You can close this tab.
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

      {!sent && (
        <div style={{ padding: '16px 24px max(32px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={sendLink}
            disabled={!email.trim() || busy}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 4,
              background: !email.trim() || busy ? 'var(--paper-3)' : 'var(--ink)',
              color: !email.trim() || busy ? 'var(--ink-3)' : 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 22px',
              fontSize: 16,
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <span>{busy ? 'Sending…' : 'Send magic link'}</span>
            <Icon.Arrow size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
