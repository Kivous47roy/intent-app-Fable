'use client';

import Link from 'next/link';
import { Icon } from './icons';

const items = [
  { k: 'today', href: '/today', label: 'TODAY', I: Icon.Home },
  { k: 'habit-log', href: '/habit-log', label: 'HABIT LOG', I: Icon.Habit },
  { k: 'diary', href: '/diary', label: 'DIARY', I: Icon.History },
  { k: 'profile', href: '/profile', label: 'PROFILE', I: Icon.Profile },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 3,
        borderTop: '1px solid var(--line-strong)',
        background: 'rgba(244, 240, 232, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        paddingTop: 8,
        display: 'flex',
      }}
    >
      {items.map((it) => {
        const isActive = active === it.k;
        return (
          <Link
            key={it.k}
            href={it.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              textDecoration: 'none',
            }}
          >
            <it.I size={20} stroke={isActive ? 1.8 : 1.5} filled={isActive && it.k === 'today'} />
            <span
              className="mono"
              style={{ fontSize: 9, letterSpacing: '0.14em', fontWeight: isActive ? 500 : 400 }}
            >
              {it.label}
            </span>
            {isActive && (
              <div style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--ink)', marginTop: -2 }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}
