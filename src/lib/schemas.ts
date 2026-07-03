import { z } from 'zod';
import type { RitualType } from './rituals';

// Ritual content is schema-validated per ritual_type before any write —
// jsonb has no DB-level shape enforcement (PRD decision 2).

export const brainDumpSchema = z.object({
  kind: z.literal('brain_dump'),
  text: z.string().min(1).max(50_000),
  sorts: z.record(z.string(), z.enum(['do', 'defer', 'delete'])),
});

export const gratitudeSchema = z.object({
  kind: z.literal('gratitude'),
  items: z
    .array(z.string().max(2_000))
    .length(3)
    .refine((items) => items.some((s) => s.trim().length > 0), {
      message: 'At least one gratitude item is required',
    }),
});

export const expressiveSchema = z.object({
  kind: z.literal('expressive'),
  text: z.string().min(1).max(100_000),
});

export const intentionSchema = z.object({
  kind: z.literal('intention'),
  plans: z
    .array(z.object({ if: z.string().max(1_000), then: z.string().max(1_000) }))
    .length(3)
    .refine((plans) => plans.some((p) => p.if.trim() || p.then.trim()), {
      message: 'At least one plan is required',
    }),
});

export const retrievalSchema = z.object({
  kind: z.literal('retrieval'),
  text: z.string().min(1).max(100_000),
});

export const contentSchemas: Record<RitualType, z.ZodType> = {
  brain_dump: brainDumpSchema,
  gratitude: gratitudeSchema,
  expressive: expressiveSchema,
  intention: intentionSchema,
  retrieval: retrievalSchema,
};

export type BrainDumpContent = z.infer<typeof brainDumpSchema>;
export type GratitudeContent = z.infer<typeof gratitudeSchema>;
export type ExpressiveContent = z.infer<typeof expressiveSchema>;
export type IntentionContent = z.infer<typeof intentionSchema>;
export type RetrievalContent = z.infer<typeof retrievalSchema>;

export type RitualContent =
  | BrainDumpContent
  | GratitudeContent
  | ExpressiveContent
  | IntentionContent
  | RetrievalContent;

export function validateContent(
  ritualType: RitualType,
  content: unknown
): { ok: true; content: RitualContent } | { ok: false; error: string } {
  const schema = contentSchemas[ritualType];
  const result = schema.safeParse(content);
  if (result.success) return { ok: true, content: result.data as RitualContent };
  return { ok: false, error: result.error.issues.map((i) => i.message).join('; ') };
}

// Word count for previews / profile stats
export function wordCount(content: RitualContent): number {
  const texts: string[] = [];
  if ('text' in content) texts.push(content.text);
  if ('items' in content) texts.push(...content.items);
  if ('plans' in content) texts.push(...content.plans.flatMap((p) => [p.if, p.then]));
  return texts
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function contentPreview(content: RitualContent): string {
  switch (content.kind) {
    case 'gratitude': {
      const n = content.items.filter((s) => s.trim()).length;
      return `${n} ITEM${n === 1 ? '' : 'S'}`;
    }
    case 'intention': {
      const n = content.plans.filter((p) => p.if.trim() || p.then.trim()).length;
      return `${n} PLAN${n === 1 ? '' : 'S'}`;
    }
    default:
      return `${wordCount(content)} W`;
  }
}

export function contentExcerpt(content: RitualContent, max = 140): string {
  let text = '';
  if ('text' in content) text = content.text;
  else if ('items' in content) text = content.items.filter((s) => s.trim()).join(' · ');
  else if ('plans' in content)
    text = content.plans
      .filter((p) => p.if.trim() || p.then.trim())
      .map((p) => `If ${p.if}, then I will ${p.then}.`)
      .join(' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
