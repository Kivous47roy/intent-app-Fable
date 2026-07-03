'use client';

// Platform-detected PWA install prompt (PRD decision 7).
// Android Chrome: native beforeinstallprompt, deferred until after the 2nd
// completed ritual (a first-load prompt gets reflexively dismissed).
// iOS Safari: no beforeinstallprompt API exists — show a custom
// "Add to Home Screen" instructional overlay on the same trigger.

import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { track } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [show, setShow] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    try {
      const completions = Number(localStorage.getItem('intent.completions') || '0');
      const dismissed = localStorage.getItem('intent.installDismissed');
      if (completions < 2 || dismissed || isStandalone()) return;
      if (isIOS()) setShow('ios');
      else if (deferredPrompt) setShow('android');
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem('intent.installDismissed', '1');
    } catch {}
    setShow(null);
  };

  const install = async () => {
    if (show === 'android' && deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      track('install_prompt_result', { outcome: choice.outcome });
      deferredPrompt = null;
    }
    dismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 96,
        zIndex: 40,
        maxWidth: 400,
        width: 'calc(100% - 48px)',
        border: '1px solid var(--line-strong)',
        borderRadius: 4,
        background: 'var(--card)',
        padding: '16px 18px',
        boxShadow: '0 4px 16px rgba(31,27,22,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 500 }}>
            Keep Intent on your home screen
          </div>
          {show === 'ios' ? (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              Tap the share icon{' '}
              <span style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px' }}>
                <Icon.Share size={14} />
              </span>{' '}
              below, then choose <strong>Add to Home Screen</strong>.
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              One tap, opens like an app — no store needed.
            </div>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" style={{ color: 'var(--ink-3)', padding: 4 }}>
          <Icon.X size={16} />
        </button>
      </div>
      {show === 'android' && (
        <button
          onClick={install}
          className="mono"
          style={{
            marginTop: 12,
            fontSize: 11,
            letterSpacing: '0.1em',
            padding: '10px 16px',
            border: '1px solid var(--ink)',
            borderRadius: 4,
            background: 'var(--ink)',
            color: 'var(--paper)',
            width: '100%',
          }}
        >
          INSTALL
        </button>
      )}
    </div>
  );
}
