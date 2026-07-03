// Custom 1.6-stroke line icons — ported from the Claude Design project.

interface IconProps {
  size?: number;
  stroke?: number;
  filled?: boolean;
}

export const Icon = {
  Home: ({ size = 22, stroke = 1.6, filled = false }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" />
    </svg>
  ),
  History: ({ size = 22, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Profile: ({ size = 22, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  ),
  Back: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  Flame: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c.6 2.4-.5 3.9-1.8 5.4-1.6 1.8-3.4 3.7-3.4 6.6 0 3.6 2.8 6.5 6.4 6.5s6.4-2.9 6.4-6.5c0-2.5-1-4.1-2.2-5.6.1 2-1 3-2.1 3-1 0-1.7-.7-1.7-1.8 0-2.7.7-5.5-1.6-7.6z" />
    </svg>
  ),
  Check: ({ size = 18, stroke = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  ),
  Plus: ({ size = 16, stroke = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Pause: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ),
  Play: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5v15l13-7.5L7 4.5z" />
    </svg>
  ),
  Sun: ({ size = 18, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4" />
    </svg>
  ),
  Bell: ({ size = 18, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15L6 16z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  ),
  Arrow: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  X: ({ size = 18, stroke = 1.7 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  ),
  Share: ({ size = 18, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13M8 7l4-4 4 4" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
    </svg>
  ),
  Brain: ({ size = 28 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 18c-1.5-.6-2-2-1.4-3.4.4-1 1.3-1.5 2-1.6-.6-1.4 0-3 1.5-3.6 1-.4 2-.2 2.6.3.2-1.6 1.5-2.7 3-2.7 1.7 0 3 1.3 3 3v15" />
      <path d="M16 6.5c0-1.7 1.3-3 3-3 1.5 0 2.8 1.1 3 2.7.6-.5 1.6-.7 2.6-.3 1.5.6 2.1 2.2 1.5 3.6.7.1 1.6.6 2 1.6.6 1.4.1 2.8-1.4 3.4" />
      <path d="M9 12c1 0 2 .6 2.5 1.5M23 12c-1 0-2 .6-2.5 1.5M9 19c1.5 0 3 .8 3.5 2M23 19c-1.5 0-3 .8-3.5 2" />
    </svg>
  ),
  Leaf: ({ size = 28 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 5c-9 0-17 5-17 14 0 4 2.5 7 6.5 7 8 0 13-7 13-15 0-2-1-4-2.5-6z" />
      <path d="M9 26c2-6 6-11 13-15" />
    </svg>
  ),
  Wave: ({ size = 28 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0 4 2.5 6 0" />
      <path d="M3 19c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0 4 2.5 6 0" />
      <path d="M3 26c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0 4 2.5 6 0" />
    </svg>
  ),
  Compass: ({ size = 28 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="12" />
      <path d="M11 21l3-9 9-3-3 9-9 3z" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    </svg>
  ),
  Spark: ({ size = 28 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4v8M16 20v8M4 16h8M20 16h8" />
      <path d="M7.5 7.5l5 5M19.5 19.5l5 5M7.5 24.5l5-5M19.5 12.5l5-5" />
    </svg>
  ),
  Habit: ({ size = 22, stroke = 1.6 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="4" height="4" rx="0.5" />
      <rect x="10" y="6" width="4" height="4" rx="0.5" />
      <rect x="16" y="6" width="4" height="4" rx="0.5" />
      <rect x="4" y="14" width="4" height="4" rx="0.5" />
      <path d="M11 16l1.5 1.5L16 14" />
    </svg>
  ),
  ChevL: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  ChevR: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
};

export type GlyphName = 'Brain' | 'Leaf' | 'Wave' | 'Compass' | 'Spark';
