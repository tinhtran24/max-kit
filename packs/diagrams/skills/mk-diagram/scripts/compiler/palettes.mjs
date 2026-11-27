/**
 * Preset x theme palettes and per-family role tokens.
 * The preset palettes mirror the variable blocks in `assets/reader.css` so a
 * standalone SVG (no reader) resolves the same colours as the embedded reader.
 * Role tokens are generated here for both scopes (reader root and bare svg).
 */

export const PRESET_THEME_PALETTES = {
  'classic:light': {
    '--mk-bg': '#ffffff', '--mk-surface': '#f8fafc', '--mk-surface-border': '#e2e8f0',
    '--mk-text-primary': '#0f172a', '--mk-text-secondary': '#475569', '--mk-text-muted': '#94a3b8',
    '--mk-accent': '#2563eb', '--mk-accent-light': '#dbeafe',
    '--mk-node-bg': '#ffffff', '--mk-node-border': '#cbd5e1',
    '--mk-edge-stroke': '#64748b', '--mk-edge-active': '#2563eb',
    '--mk-badge-bg': '#f1f5f9', '--mk-font-sans': 'system-ui, -apple-system, sans-serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'classic:dark': {
    '--mk-bg': '#090d16', '--mk-surface': '#0f172a', '--mk-surface-border': '#1e293b',
    '--mk-text-primary': '#f8fafc', '--mk-text-secondary': '#94a3b8', '--mk-text-muted': '#64748b',
    '--mk-accent': '#38bdf8', '--mk-accent-light': '#0369a1',
    '--mk-node-bg': '#0f172a', '--mk-node-border': '#334155',
    '--mk-edge-stroke': '#475569', '--mk-edge-active': '#38bdf8',
    '--mk-badge-bg': '#1e293b', '--mk-font-sans': 'system-ui, -apple-system, sans-serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'signal-flow:light': {
    '--mk-bg': '#f0fdf4', '--mk-surface': '#dcfce7', '--mk-surface-border': '#86efac',
    '--mk-text-primary': '#14532d', '--mk-text-secondary': '#166534', '--mk-text-muted': '#4ade80',
    '--mk-accent': '#059669', '--mk-accent-light': '#d1fae5',
    '--mk-node-bg': '#ffffff', '--mk-node-border': '#10b981',
    '--mk-edge-stroke': '#059669', '--mk-edge-active': '#047857',
    '--mk-badge-bg': '#dcfce7', '--mk-font-sans': 'system-ui, -apple-system, sans-serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'signal-flow:dark': {
    '--mk-bg': '#031c18', '--mk-surface': '#064e3b', '--mk-surface-border': '#047857',
    '--mk-text-primary': '#ecfdf5', '--mk-text-secondary': '#a7f3d0', '--mk-text-muted': '#34d399',
    '--mk-accent': '#34d399', '--mk-accent-light': '#065f46',
    '--mk-node-bg': '#064e3b', '--mk-node-border': '#10b981',
    '--mk-edge-stroke': '#34d399', '--mk-edge-active': '#6ee7b7',
    '--mk-badge-bg': '#064e3b', '--mk-font-sans': 'system-ui, -apple-system, sans-serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'blueprint:light': {
    '--mk-bg': '#f0f9ff', '--mk-surface': '#e0f2fe', '--mk-surface-border': '#7dd3fc',
    '--mk-text-primary': '#0369a1', '--mk-text-secondary': '#0284c7', '--mk-text-muted': '#38bdf8',
    '--mk-accent': '#0284c7', '--mk-accent-light': '#bae6fd',
    '--mk-node-bg': '#ffffff', '--mk-node-border': '#0ea5e9',
    '--mk-edge-stroke': '#0284c7', '--mk-edge-active': '#0369a1',
    '--mk-badge-bg': '#e0f2fe', '--mk-font-sans': 'ui-monospace, monospace',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'blueprint:dark': {
    '--mk-bg': '#081d33', '--mk-surface': '#0c2a4a', '--mk-surface-border': '#1e4976',
    '--mk-text-primary': '#e0f2fe', '--mk-text-secondary': '#bae6fd', '--mk-text-muted': '#38bdf8',
    '--mk-accent': '#38bdf8', '--mk-accent-light': '#0369a1',
    '--mk-node-bg': '#0c213a', '--mk-node-border': '#38bdf8',
    '--mk-edge-stroke': '#7dd3fc', '--mk-edge-active': '#38bdf8',
    '--mk-badge-bg': '#0c213a', '--mk-font-sans': 'ui-monospace, monospace',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'editorial:light': {
    '--mk-bg': '#faf8f5', '--mk-surface': '#f3efe6', '--mk-surface-border': '#e2dacb',
    '--mk-text-primary': '#1c1917', '--mk-text-secondary': '#57534e', '--mk-text-muted': '#a8a29e',
    '--mk-accent': '#991b1b', '--mk-accent-light': '#fecaca',
    '--mk-node-bg': '#ffffff', '--mk-node-border': '#d6cfc4',
    '--mk-edge-stroke': '#78716c', '--mk-edge-active': '#991b1b',
    '--mk-badge-bg': '#f3efe6', '--mk-font-sans': 'system-ui, serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
  'editorial:dark': {
    '--mk-bg': '#1c1917', '--mk-surface': '#292524', '--mk-surface-border': '#44403c',
    '--mk-text-primary': '#fafaf9', '--mk-text-secondary': '#d6d3d1', '--mk-text-muted': '#78716c',
    '--mk-accent': '#ef4444', '--mk-accent-light': '#7f1d1d',
    '--mk-node-bg': '#292524', '--mk-node-border': '#78716c',
    '--mk-edge-stroke': '#a8a29e', '--mk-edge-active': '#f87171',
    '--mk-badge-bg': '#292524', '--mk-font-sans': 'system-ui, serif',
    '--mk-font-mono': 'ui-monospace, monospace',
  },
};

/** Family stroke colours per theme; fills are derived with low alpha. */
export const ROLE_COLORS = {
  client: ['#0e7490', '#22d3ee'],
  service: ['#4f46e5', '#818cf8'],
  data: ['#b45309', '#fbbf24'],
  queue: ['#7c3aed', '#a78bfa'],
  cache: ['#c2410c', '#fb923c'],
  gateway: ['#0369a1', '#38bdf8'],
  security: ['#be123c', '#fb7185'],
  external: ['#475569', '#94a3b8'],
  worker: ['#0f766e', '#2dd4bf'],
  start: ['#047857', '#34d399'],
  success: ['#059669', '#34d399'],
  failure: ['#b91c1c', '#f87171'],
  waiting: ['#a16207', '#facc15'],
  decision: ['#a21caf', '#e879f9'],
  process: ['#1d4ed8', '#60a5fa'],
  governance: ['#6d28d9', '#c4b5fd'],
  transform: ['#4338ca', '#a5b4fc'],
  filter: ['#4d7c0f', '#a3e635'],
};

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** CSS declaring `--mk-role-<family>-stroke/fill` for light and dark scopes. */
export function roleTokenCss() {
  const light = [];
  const dark = [];
  for (const [family, [l, d]] of Object.entries(ROLE_COLORS)) {
    light.push(`--mk-role-${family}-stroke:${l};--mk-role-${family}-fill:${rgba(l, 0.1)};`);
    dark.push(`--mk-role-${family}-stroke:${d};--mk-role-${family}-fill:${rgba(d, 0.16)};`);
  }
  const perFamily = Object.keys(ROLE_COLORS).map((family) =>
    `.mk-node[data-family="${family}"]{--mk-node-stroke:var(--mk-role-${family}-stroke);--mk-node-fill:var(--mk-role-${family}-fill);}` +
    `.mk-legend-item[data-family="${family}"] .mk-legend-swatch{fill:var(--mk-role-${family}-fill);stroke:var(--mk-role-${family}-stroke);}`).join('\n');
  return [
    `.mk-diagram-root,svg.mk-diagram-svg{${light.join('')}}`,
    `.mk-diagram-root[data-theme="dark"],svg.mk-diagram-svg[data-theme="dark"]{${dark.join('')}}`,
    perFamily,
  ].join('\n');
}

/** Resolve a palette for a standalone svg `<style>` block. */
export function paletteCss(preset, theme, selector = 'svg') {
  const palette = PRESET_THEME_PALETTES[`${preset}:${theme}`] || PRESET_THEME_PALETTES['classic:light'];
  const body = Object.entries(palette).map(([k, v]) => `${k}:${v};`).join('');
  return `${selector}{${body}font-family:var(--mk-font-sans);}`;
}
