'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';
import { track } from '@/lib/analytics';

// Recovery-link landing: the user arrives here already signed in (session from
// the emailed link) and chooses a new password, then continues into the app.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) router.replace('/login?error=link');
        else setChecked(true);
      })
      .catch(() => router.replace('/login?error=link'));
  }, [router]);

  const save = async () => {
    if (busy) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      track('password_reset_completed');
      router.replace('/');
    }
  };

  if (!checked) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, paddingTop: 'max(60px, env(safe-area-inset-top))' }}>
      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          INTENT
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>NEW PASSWORD</div>
      </div>

      <div className="fade-up" style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
          ── CHOOSE A NEW PASSWORD
        </div>
        <h1 className="display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 300 }}>
          Welcome back.
          <br />
          <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>Pick a password.</em>
        </h1>
        <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 300 }}>
          Use it with your email to log in on any device. Your entries are all here.
        </p>

        <div style={{ marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--ink)' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            autoComplete="new-password"
            autoFocus
            className="serif"
            style={{ fontSize: 22, fontWeight: 400, padding: 0 }}
          />
        </div>
        <div style={{ marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--ink)' }}>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Repeat password"
            autoComplete="new-password"
            className="serif"
            style={{ fontSize: 22, fontWeight: 400, padding: 0 }}
          />
        </div>

        {error && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px max(32px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={save}
          disabled={!password || !confirm || busy}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 4,
            background: !password || !confirm || busy ? 'var(--paper-3)' : 'var(--ink)',
            color: !password || !confirm || busy ? 'var(--ink-3)' : 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            fontSize: 16,
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          <span>{busy ? 'Saving…' : 'Save & continue'}</span>
          <Icon.Arrow size={18} />
        </button>
      </div>
    </div>
  );
}
