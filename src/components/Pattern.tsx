// Subtle per-ritual background pattern — ported from the design project.

export function Pattern({ kind, color }: { kind: string; color: string }) {
  let svg = '';
  if (kind === 'dots') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='2' cy='2' r='1' fill='${color}' opacity='0.10'/></svg>`;
  } else if (kind === 'lines') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><path d='M0 28L28 0' stroke='${color}' stroke-width='1' opacity='0.07'/></svg>`;
  } else if (kind === 'crosshatch') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M0 24L24 0M0 0L24 24' stroke='${color}' stroke-width='0.6' opacity='0.10'/></svg>`;
  } else if (kind === 'grid') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M0 0H24M0 0V24' stroke='${color}' stroke-width='0.6' opacity='0.10'/></svg>`;
  } else if (kind === 'flow') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 20Q10 10 20 20T40 20' stroke='${color}' stroke-width='0.8' fill='none' opacity='0.10'/></svg>`;
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
      }}
    />
  );
}
