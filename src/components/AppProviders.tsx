'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { flushOutbox, pendingCount } from '@/lib/data';
import { initAnalytics, trackVisit } from '@/lib/analytics';

// App-wide sync state: exposes the outbox pending count and a retry action.
// Flushes queued writes on `online` and tab foreground (`visibilitychange`) —
// the local-first strategy of PRD decision 3. Write failures surface as a
// visible, non-blocking banner (decision 4), never a silent failure.

interface SyncContextValue {
  pending: number;
  retry: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  pending: 0,
  retry: async () => {},
  refreshPending: async () => {},
});

export const useSync = () => useContext(SyncContext);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await pendingCount());
    } catch {
      // IndexedDB unavailable — nothing to surface
    }
  }, []);

  const retry = useCallback(async () => {
    try {
      await flushOutbox();
    } finally {
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    initAnalytics();
    trackVisit();
    refreshPending();

    const onOnline = () => retry();
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [retry, refreshPending]);

  return (
    <SyncContext.Provider value={{ pending, retry, refreshPending }}>
      {children}
      {pending > 0 && <RetryBanner pending={pending} onRetry={retry} />}
    </SyncContext.Provider>
  );
}

function RetryBanner({ pending, onRetry }: { pending: number; onRetry: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 96,
        zIndex: 50,
        maxWidth: 400,
        width: 'calc(100% - 48px)',
        border: '1px solid var(--accent)',
        borderRadius: 4,
        background: 'var(--card)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 16px rgba(31,27,22,0.12)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="serif" style={{ fontSize: 14, fontWeight: 500 }}>
          Couldn’t save {pending === 1 ? 'an entry' : `${pending} entries`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
          Your writing is safe on this device.
        </div>
      </div>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            await onRetry();
          } finally {
            setBusy(false);
          }
        }}
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          padding: '8px 14px',
          border: '1px solid var(--ink)',
          borderRadius: 4,
          background: 'var(--ink)',
          color: 'var(--paper)',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'RETRYING…' : 'RETRY'}
      </button>
    </div>
  );
}
