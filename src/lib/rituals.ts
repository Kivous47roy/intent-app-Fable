// Ritual configs — the visual/UX spec of record is the Claude Design project
// ("Gratitude Journal App"); these mirror its JOURNALS data.

export type RitualType =
  | 'brain_dump'
  | 'gratitude'
  | 'expressive'
  | 'intention'
  | 'retrieval';

export type RitualSurface = 'freeform-sort' | 'slots' | 'ruled' | 'ifthen' | 'canvas';

export interface RitualConfig {
  id: RitualType;
  title: string;
  glyph: 'Brain' | 'Leaf' | 'Wave' | 'Compass' | 'Spark';
  minutes: number;
  blurb: string;
  prompt: string;
  surface: RitualSurface;
  accent: string;
  pattern: 'crosshatch' | 'dots' | 'flow' | 'lines' | 'grid';
}

export const RITUALS: RitualConfig[] = [
  {
    id: 'brain_dump',
    title: 'Brain Dump',
    glyph: 'Brain',
    minutes: 10,
    blurb: 'Empty the noise. Then sort it.',
    prompt:
      'Write every task, worry, or idea on your mind right now. Don’t organize. Just unload.',
    surface: 'freeform-sort',
    accent: 'oklch(58% 0.14 38)',
    pattern: 'crosshatch',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    glyph: 'Leaf',
    minutes: 5,
    blurb: 'Three specific moments. Memory plus action.',
    prompt:
      'Three things you’re grateful for today. Be specific — the moment, what you saw, what you did.',
    surface: 'slots',
    accent: 'oklch(58% 0.10 130)',
    pattern: 'dots',
  },
  {
    id: 'expressive',
    title: 'Expressive',
    glyph: 'Wave',
    minutes: 15,
    blurb: 'Raw feeling. No editing, no rules.',
    prompt:
      'What am I feeling right now? Write it raw. Don’t edit. The page can hold all of it.',
    surface: 'ruled',
    accent: 'oklch(58% 0.13 280)',
    pattern: 'flow',
  },
  {
    id: 'intention',
    title: 'Implementation Intention',
    glyph: 'Compass',
    minutes: 5,
    blurb: 'Three "if X, then I will Y" for today.',
    prompt:
      'Write three plans in the form: “If X happens, then I will do Y.” Concrete cues, concrete actions.',
    surface: 'ifthen',
    accent: 'oklch(58% 0.11 220)',
    pattern: 'lines',
  },
  {
    id: 'retrieval',
    title: 'Retrieval',
    glyph: 'Spark',
    minutes: 30,
    blurb: 'Blurt everything you remember.',
    prompt:
      'You just learned something. Without looking back, write everything you remember. Loose, messy, complete.',
    surface: 'canvas',
    accent: 'oklch(58% 0.12 80)',
    pattern: 'grid',
  },
];

export const ritualById = (id: string): RitualConfig | undefined =>
  RITUALS.find((r) => r.id === id);

export const HABIT_ACCENTS = [
  'oklch(58% 0.11 220)',
  'oklch(58% 0.10 130)',
  'oklch(58% 0.12 80)',
  'oklch(58% 0.13 280)',
  'oklch(58% 0.14 38)',
];

export const DEFAULT_HABITS = [
  { title: 'Drink 2L water', emoji: '💧', accent: HABIT_ACCENTS[0] },
  { title: 'Walk 30 min', emoji: '🚶', accent: HABIT_ACCENTS[1] },
  { title: 'Read 10 pages', emoji: '📖', accent: HABIT_ACCENTS[2] },
  { title: 'In bed by 11pm', emoji: '🌙', accent: HABIT_ACCENTS[3] },
  { title: 'No phone after 9pm', emoji: '📵', accent: HABIT_ACCENTS[4] },
];
