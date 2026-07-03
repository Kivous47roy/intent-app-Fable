export function ScreenLoading({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>
          INTENT
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <div className="mono pulse" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
