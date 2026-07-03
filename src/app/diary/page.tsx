'use client';

// Diary — month calendar with per-ritual dots and a detail card (PRD §3.5).
// One grouped range query per month view (decision 6).
import { useEffect, useMemo, useState } from 'react';
import { getEntriesForRange } from '@/lib/data';
import { groupEntriesByDate, type EntryRow } from '@/lib/aggregates';
import { ritualById } from '@/lib/rituals';
import { contentPreview, contentExcerpt, type RitualContent } from '@/lib/schemas';
import { localDateString, WEEKDAYS, MONTHS } from '@/lib/dates';
import { Icon, type GlyphName } from '@/components/icons';
import { BottomNav } from '@/components/BottomNav';
import { ScreenLoading } from '@/components/ScreenLoading';

export default function DiaryPage() {
  const today = localDateString();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [entries, setEntries] = useState<Map<string, EntryRow[]>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const y = month.getFullYear();
  const m = month.getMonth();

  useEffect(() => {
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setLoaded(false);
    getEntriesForRange(from, to)
      .then((rows) => {
        const grouped = groupEntriesByDate(rows);
        setEntries(grouped);
        // Preselect the most recent marked day in view
        const keys = [...grouped.keys()].sort();
        setSelected(keys.length ? keys[keys.length - 1] : null);
      })
      .finally(() => setLoaded(true));
  }, [y, m]);

  const cells = useMemo(() => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: ({ d: number; key: string } | null)[] = [];
    for (let i = 0; i < firstDay; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ d, key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
    return out;
  }, [y, m]);

  const sel = selected ? (entries.get(selected) ?? []) : [];
  const selDate = selected
    ? (() => {
        const [yy, mm, dd] = selected.split('-').map(Number);
        const dt = new Date(yy, mm - 1, dd);
        return { weekday: WEEKDAYS[dt.getDay()], dd, month: MONTHS[mm - 1] };
      })()
    : null;

  if (!loaded && entries.size === 0) return <ScreenLoading label="DIARY" />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      <div style={{ padding: '16px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>DIARY</div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>CALENDAR</div>
        </div>
        <h1 className="display" style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 300, margin: 0 }}>
          What you’ve <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>kept</em>.
        </h1>
      </div>

      {/* Month nav */}
      <div style={{ padding: '14px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setMonth(new Date(y, m - 1, 1))}
          aria-label="Previous month"
          style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)' }}
        >
          <Icon.ChevL />
        </button>
        <div className="display" style={{ fontSize: 22, fontWeight: 300, lineHeight: 1 }}>
          {MONTHS[m]} <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{y}</em>
        </div>
        <button
          onClick={() => setMonth(new Date(y, m + 1, 1))}
          aria-label="Next month"
          style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)' }}
        >
          <Icon.ChevR />
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ padding: '8px 20px 6px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textAlign: 'center', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const dayEntries = entries.get(c.key) ?? [];
          const has = dayEntries.length > 0;
          const isSel = c.key === selected;
          const isToday = c.key === today;
          return (
            <button
              key={i}
              onClick={() => has && setSelected(c.key)}
              disabled={!has}
              style={{
                aspectRatio: '1',
                border: '1px solid ' + (isSel ? 'var(--ink)' : has ? 'var(--line-strong)' : 'transparent'),
                borderRadius: 4,
                background: isSel ? 'var(--ink)' : has ? 'rgba(255,253,247,0.85)' : 'transparent',
                color: isSel ? 'var(--paper)' : has ? 'var(--ink)' : 'var(--ink-3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: has ? 1 : 0.55,
                cursor: has ? 'pointer' : 'default',
              }}
            >
              <span className="display" style={{ fontSize: 16, fontWeight: 300, lineHeight: 1, fontStyle: isToday ? 'italic' : 'normal' }}>
                {c.d}
              </span>
              {has && (
                <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                  {dayEntries.slice(0, 4).map((e, idx) => {
                    const j = ritualById(e.ritual_type);
                    return (
                      <span key={idx} style={{ width: 4, height: 4, borderRadius: 999, background: isSel ? 'var(--paper)' : j?.accent }} />
                    );
                  })}
                </div>
              )}
              {!has && isToday && <div style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--accent)', marginTop: 4 }} />}
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, padding: '14px 24px 16px' }}>
        {selDate && (
          <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, background: 'rgba(255,253,247,0.7)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
                  {selDate.weekday.toUpperCase()}
                </div>
                <div className="display" style={{ fontSize: 24, fontWeight: 300, lineHeight: 1.05 }}>
                  {selDate.month} <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{selDate.dd}</em>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                {sel.length} {sel.length === 1 ? 'ENTRY' : 'ENTRIES'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sel.map((e, idx) => {
                const j = ritualById(e.ritual_type);
                if (!j) return null;
                const G = Icon[j.glyph as GlyphName];
                const content = e.content as RitualContent;
                return (
                  <div key={e.id} style={{ paddingTop: idx ? 12 : 0, borderTop: idx ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: j.accent, display: 'flex' }}>
                        <G size={14} />
                      </span>
                      <span className="serif" style={{ fontSize: 14, fontWeight: 500 }}>{j.title}</span>
                      <span style={{ flex: 1 }} />
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                        {contentPreview(content)}
                      </span>
                    </div>
                    <div className="serif" style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                      {contentExcerpt(content)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!selDate && (
          <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 14, padding: '16px 0' }}>
            No entries this month yet.
          </div>
        )}
      </div>

      <BottomNav active="diary" />
    </div>
  );
}
