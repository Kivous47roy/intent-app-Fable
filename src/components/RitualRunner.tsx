'use client';

// The shared ritual runner (PRD decision 8): one component, parameterized by
// ritual config — timer + prompt + writing surface. The 5 rituals are configs,
// not five near-duplicate implementations.
//
// Local-first: every keystroke-batch is written to IndexedDB via a debounced
// draft save BEFORE any network call; the save path goes through the outbox
// (see lib/data.ts). An expired auth session or dead network mid-session
// cannot lose writing.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RitualConfig } from '@/lib/rituals';
import { saveRitualEntry } from '@/lib/data';
import { saveDraft, loadDraft } from '@/lib/localStore';
import { localDateString } from '@/lib/dates';
import { useTimer, fmtTime } from '@/hooks/useTimer';
import { Icon, type GlyphName } from '@/components/icons';
import { Pattern } from '@/components/Pattern';
import { useSync } from '@/components/AppProviders';
import { track } from '@/lib/analytics';

type Phase = 'write' | 'sort';

interface DraftShape {
  text: string;
  items: string[];
  plans: { if: string; then: string }[];
  sorts: Record<string, 'do' | 'defer' | 'delete'>;
  phase: Phase;
}

const emptyDraft = (): DraftShape => ({
  text: '',
  items: ['', '', ''],
  plans: [
    { if: '', then: '' },
    { if: '', then: '' },
    { if: '', then: '' },
  ],
  sorts: {},
  phase: 'write',
});

export function RitualRunner({ ritual }: { ritual: RitualConfig }) {
  const router = useRouter();
  const { refreshPending } = useSync();
  const Glyph = Icon[ritual.glyph as GlyphName];
  const { remaining, pct, running, toggle } = useTimer(ritual.minutes * 60);

  const [draft, setDraft] = useState<DraftShape>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);
  const entryDate = useMemo(() => localDateString(), []);

  // Restore an interrupted draft
  useEffect(() => {
    loadDraft(entryDate, ritual.id)
      .then((d) => {
        if (d?.content) setDraft({ ...emptyDraft(), ...(d.content as Partial<DraftShape>) });
      })
      .finally(() => setHydrated(true));
  }, [entryDate, ritual.id]);

  // Debounced draft persistence — local write before anything else
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const update = useCallback(
    (patch: Partial<DraftShape>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        if (draftTimer.current) clearTimeout(draftTimer.current);
        draftTimer.current = setTimeout(() => {
          saveDraft(entryDate, ritual.id, next).catch(() => {});
        }, 400);
        return next;
      });
    },
    [entryDate, ritual.id]
  );

  const buildContent = (): unknown => {
    switch (ritual.surface) {
      case 'freeform-sort':
        return { kind: 'brain_dump', text: draft.text, sorts: draft.sorts };
      case 'slots':
        return { kind: 'gratitude', items: draft.items };
      case 'ruled':
        return { kind: 'expressive', text: draft.text };
      case 'ifthen':
        return { kind: 'intention', plans: draft.plans };
      case 'canvas':
        return { kind: 'retrieval', text: draft.text };
    }
  };

  const dumpLines = draft.text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const handleComplete = async () => {
    if (ritual.surface === 'freeform-sort' && draft.phase === 'write') {
      update({ phase: 'sort' });
      return;
    }
    if (saving) return;
    setSaving(true);
    setInvalidMsg(null);
    try {
      const result = await saveRitualEntry(ritual.id, buildContent(), entryDate);
      if (result.status === 'invalid') {
        setInvalidMsg(result.error);
        setSaving(false);
        return;
      }
      // 'synced' or 'queued' both count as completed for the user — queued
      // writes flush automatically and surface a retry banner if they fail.
      track('ritual_marked_complete', { ritual_type: ritual.id, status: result.status });
      bumpCompletionCount();
      await refreshPending();
      router.push('/today');
    } catch {
      setSaving(false);
      setInvalidMsg('Something went wrong — your draft is safe on this device.');
    }
  };

  const footerMeta =
    draft.phase === 'sort'
      ? `${Object.keys(draft.sorts).length} / ${dumpLines.length} sorted`
      : ritual.surface === 'slots'
        ? `${draft.items.filter((s) => s.trim()).length} / 3 written`
        : ritual.surface === 'ifthen'
          ? `${draft.plans.filter((p) => p.if.trim() || p.then.trim()).length} / 3 written`
          : `${draft.text.trim().split(/\s+/).filter(Boolean).length} words`;

  if (!hydrated) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, minHeight: '100dvh' }}>
      <Pattern kind={ritual.pattern} color={ritual.accent} />
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', position: 'relative', zIndex: 3 }}>
        <button
          onClick={() => router.push('/today')}
          aria-label="Back"
          style={{
            width: 38,
            height: 38,
            borderRadius: 4,
            border: '1px solid var(--line-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.4)',
          }}
        >
          <Icon.Back size={18} />
        </button>

        {/* Live timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 999,
            padding: '8px 14px',
          }}
        >
          <span
            className={running ? 'pulse' : ''}
            style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }}
          />
          <span className="mono" style={{ fontSize: 14, letterSpacing: '0.05em' }}>
            {fmtTime(remaining)}
          </span>
          <button onClick={toggle} aria-label={running ? 'Pause timer' : 'Resume timer'} style={{ marginLeft: 4, opacity: 0.85, display: 'flex', color: 'inherit' }}>
            {running ? <Icon.Pause size={11} /> : <Icon.Play size={11} />}
          </button>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ height: 2, background: 'var(--line)', position: 'relative', zIndex: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ink)', transition: 'width 1s linear' }} />
      </div>

      {/* Prompt */}
      <div style={{ padding: '20px 24px 14px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ color: ritual.accent, display: 'flex' }}>
            <Glyph size={18} />
          </span>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>
            {ritual.title.toUpperCase()} · {String(ritual.minutes).padStart(2, '0')} MIN
          </div>
        </div>
        <div className="serif" style={{ fontSize: 19, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 400 }}>
          {draft.phase === 'sort' ? (
            <>
              Now sort each line.
              <br />
              <em style={{ color: 'var(--ink-2)' }}>Do · Defer · Delete.</em>
            </>
          ) : (
            ritual.prompt
          )}
        </div>
      </div>

      {/* Writing surface */}
      <div style={{ flex: 1, position: 'relative', zIndex: 3, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
        {draft.phase === 'write' && ritual.surface === 'slots' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {draft.items.map((v, i) => (
              <div key={i}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: '0.12em' }}>
                  {String(i + 1).padStart(2, '0')} ·
                </div>
                <textarea
                  value={v}
                  onChange={(e) => {
                    const items = draft.items.slice();
                    items[i] = e.target.value;
                    update({ items });
                  }}
                  rows={3}
                  className="serif"
                  placeholder={['Be specific. The light, the smell, the words.', 'Memory + action.', 'A small thing counts.'][i]}
                  style={{ fontSize: 17, lineHeight: 1.5, width: '100%', paddingBottom: 12, borderBottom: '1px solid var(--line)' }}
                />
              </div>
            ))}
          </div>
        )}

        {draft.phase === 'write' && ritual.surface === 'ifthen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {draft.plans.map((v, i) => (
              <div key={i} style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8, letterSpacing: '0.12em' }}>
                  PLAN {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: 'var(--ink-2)' }}>If</span>
                  <input
                    value={v.if}
                    onChange={(e) => {
                      const plans = draft.plans.slice();
                      plans[i] = { ...plans[i], if: e.target.value };
                      update({ plans });
                    }}
                    placeholder="it’s 9am and the laptop is open"
                    className="serif"
                    style={{ flex: 1, fontSize: 17, lineHeight: 1.5 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: 'var(--ink-2)' }}>then I will</span>
                  <input
                    value={v.then}
                    onChange={(e) => {
                      const plans = draft.plans.slice();
                      plans[i] = { ...plans[i], then: e.target.value };
                      update({ plans });
                    }}
                    placeholder="open the doc and write one sentence"
                    className="serif"
                    style={{ flex: 1, fontSize: 17, lineHeight: 1.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {draft.phase === 'write' && (ritual.surface === 'freeform-sort' || ritual.surface === 'ruled' || ritual.surface === 'canvas') && (
          <textarea
            value={draft.text}
            onChange={(e) => update({ text: e.target.value })}
            autoFocus
            placeholder={ritual.surface === 'freeform-sort' ? 'one thought per line\nor however it spills out…' : 'just begin…'}
            className="serif"
            style={{
              flex: 1,
              minHeight: 220,
              fontSize: 18,
              lineHeight: ritual.surface === 'ruled' ? '28px' : 1.55,
              paddingBottom: 24,
              backgroundImage:
                ritual.surface === 'ruled'
                  ? 'repeating-linear-gradient(transparent 0, transparent 27px, rgba(31,27,22,0.08) 27px, rgba(31,27,22,0.08) 28px)'
                  : 'none',
            }}
          />
        )}

        {draft.phase === 'sort' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
            {dumpLines.length === 0 && (
              <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-3)', padding: '20px 0' }}>
                Nothing to sort yet.
              </div>
            )}
            {dumpLines.map((line, i) => {
              const v = draft.sorts[String(i)];
              return (
                <div key={i} style={{ border: '1px solid var(--line-strong)', borderRadius: 4, padding: '12px 14px', background: 'rgba(255,255,255,0.5)' }}>
                  <div className="serif" style={{ fontSize: 15, lineHeight: 1.4, marginBottom: 10 }}>
                    {line}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(
                      [
                        { k: 'do', label: 'Do', sub: 'now' },
                        { k: 'defer', label: 'Defer', sub: 'later' },
                        { k: 'delete', label: 'Delete', sub: 'release' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.k}
                        onClick={() => update({ sorts: { ...draft.sorts, [String(i)]: opt.k } })}
                        className="mono"
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: 4,
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          border: '1px solid ' + (v === opt.k ? 'var(--ink)' : 'var(--line-strong)'),
                          background: v === opt.k ? 'var(--ink)' : 'transparent',
                          color: v === opt.k ? 'var(--paper)' : 'var(--ink-2)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {opt.label}
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2, textTransform: 'lowercase', letterSpacing: 0 }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 24px max(28px, env(safe-area-inset-bottom))',
          position: 'sticky',
          bottom: 0,
          zIndex: 3,
          background: 'linear-gradient(180deg, transparent 0%, var(--paper) 30%)',
        }}
      >
        {invalidMsg && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8 }}>
            {invalidMsg}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
            {footerMeta}
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 10, color: remaining === 0 ? 'var(--accent)' : 'var(--ink-3)', letterSpacing: '0.12em' }}>
            {remaining === 0 ? 'TIMER · DONE' : 'TIMER · ' + fmtTime(remaining)}
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={saving}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 4,
            background: 'var(--ink)',
            color: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            fontSize: 15,
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span>
            {saving
              ? 'Saving…'
              : ritual.surface === 'freeform-sort' && draft.phase === 'write'
                ? 'Sort it out'
                : 'Mark complete'}
          </span>
          <Icon.Check size={16} stroke={2.2} />
        </button>
      </div>
    </div>
  );
}

// Completed-ritual counter feeding the platform-detected install prompt
// (PRD decision 7: prompt after the 2nd completed ritual, not on first load).
export function bumpCompletionCount() {
  try {
    const n = Number(localStorage.getItem('intent.completions') || '0') + 1;
    localStorage.setItem('intent.completions', String(n));
  } catch {
    // private mode — install prompt simply never fires
  }
}
