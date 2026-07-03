'use client';

import { openDB, type IDBPDatabase } from 'idb';
import type { RitualType } from './rituals';
import type { RitualContent } from './schemas';

// Local-first write layer (PRD decision 3).
//
// Every draft keystroke-batch and every save lands in IndexedDB BEFORE any
// network call. Pending saves sit in an outbox that is flushed on the
// `online` event and on tab foreground (`visibilitychange`). We deliberately
// do NOT use the Background Sync API — iOS Safari doesn't support it, so it
// would silently no-op on half the target platforms.
//
// Known, accepted limitation: iOS Safari's ITP can evict IndexedDB after ~7
// days of no interaction with the site. A user who drafts an entry, gets
// interrupted, and doesn't reopen the app for a full week could lose that one
// unsynced draft. Accepted as-is: that failure window mostly overlaps with a
// user whose streak has already broken under the grace-day rule.

const DB_NAME = 'intent-local';
const DB_VERSION = 1;

export interface Draft {
  key: string; // `${entryDate}:${ritualType}`
  entryDate: string;
  ritualType: RitualType;
  content: unknown; // in-progress, not yet schema-valid
  updatedAt: number;
}

export interface OutboxItem {
  key: string; // `${entryDate}:${ritualType}`
  entryDate: string;
  ritualType: RitualType;
  content: RitualContent; // schema-validated at enqueue time
  attempts: number;
  enqueuedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('drafts', { keyPath: 'key' });
        db.createObjectStore('outbox', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export const draftKey = (entryDate: string, ritualType: RitualType) =>
  `${entryDate}:${ritualType}`;

export async function saveDraft(
  entryDate: string,
  ritualType: RitualType,
  content: unknown
): Promise<void> {
  const db = await getDB();
  await db.put('drafts', {
    key: draftKey(entryDate, ritualType),
    entryDate,
    ritualType,
    content,
    updatedAt: Date.now(),
  } satisfies Draft);
}

export async function loadDraft(
  entryDate: string,
  ritualType: RitualType
): Promise<Draft | undefined> {
  const db = await getDB();
  return db.get('drafts', draftKey(entryDate, ritualType));
}

export async function clearDraft(entryDate: string, ritualType: RitualType): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', draftKey(entryDate, ritualType));
}

export async function enqueueSave(item: Omit<OutboxItem, 'attempts' | 'enqueuedAt'>) {
  const db = await getDB();
  await db.put('outbox', { ...item, attempts: 0, enqueuedAt: Date.now() } satisfies OutboxItem);
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAll('outbox');
}

export async function removeFromOutbox(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('outbox', key);
}

export async function bumpAttempts(key: string): Promise<void> {
  const db = await getDB();
  const item = (await db.get('outbox', key)) as OutboxItem | undefined;
  if (item) await db.put('outbox', { ...item, attempts: item.attempts + 1 });
}
