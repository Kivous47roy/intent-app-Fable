'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProfile } from '@/lib/data';
import { Icon } from '@/components/icons';
import { track } from '@/lib/analytics';

// Onboarding (3 steps): Welcome → Name → Reminder (UI only — the delivery
// mechanism is deferred until launch-ready, PRD §6).
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [time, setTime] = useState('07:30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createProfile(name.trim() || 'Friend', time, true);
      track('onboarding_completed');
      router.replace('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — try again');
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, paddingTop: 'max(60px, env(safe-area-inset-top))' }}>
      {/* progress */}
      <div style={{ display: 'flex', gap: 6, padding: '14px 24px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2,
              borderRadius: 2,
              background: i <= step ? 'var(--ink)' : 'var(--line-strong)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          INTENT
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {String(step + 1).padStart(2, '0')} / 03
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 0 && (
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
            <p style={{ marginTop: 28, fontSize: 16, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 280 }}>
              Brain dumps. Gratitude. Raw feeling. Implementation intentions. Retrieval. Pick one a day.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="fade-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
              ── YOUR NAME
            </div>
            <h2 className="display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 300 }}>
              What should we
              <br />
              call you?
            </h2>
            <div style={{ marginTop: 36, paddingBottom: 8, borderBottom: '1px solid var(--ink)' }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                autoFocus
                className="serif"
                style={{ fontSize: 28, fontWeight: 400, padding: 0 }}
              />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 10 }}>
              Shown only to you.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 18 }}>
              ── MORNING NUDGE
            </div>
            <h2 className="display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0, fontWeight: 300 }}>
              When should we
              <br />
              remind you?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 14, marginBottom: 28, lineHeight: 1.5 }}>
              One small notification, once a day. You can change this any time.
            </p>

            <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', gap: 14 }}>
                <Icon.Sun size={20} />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="display"
                  style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em', padding: 0, background: 'transparent', flex: 1 }}
                />
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
                  EVERY
                  <br />
                  MORNING
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', display: 'flex' }}>
                {['07:00', '07:30', '08:00', '09:00'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className="mono"
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      fontSize: 12,
                      borderRight: '1px solid var(--line)',
                      background: t === time ? 'var(--ink)' : 'transparent',
                      color: t === time ? 'var(--paper)' : 'var(--ink-2)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 14 }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px max(32px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={next}
          disabled={(step === 1 && !name.trim()) || busy}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 4,
            background: (step === 1 && !name.trim()) || busy ? 'var(--paper-3)' : 'var(--ink)',
            color: (step === 1 && !name.trim()) || busy ? 'var(--ink-3)' : 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            fontSize: 16,
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          <span>{busy ? 'Saving…' : step === 0 ? 'Begin' : step === 1 ? 'Continue' : 'Start journaling'}</span>
          <Icon.Arrow size={18} />
        </button>
      </div>
    </div>
  );
}
