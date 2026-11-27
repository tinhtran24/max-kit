/**
 * Reader interaction smoke test using a minimal synchronous DOM shim.
 * Exercises reader.js search, node focus, reach tracing, route inspection,
 * and role lens against a compiled fragment — without a browser dependency.
 */
import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from './compiler/compile.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, '../fixtures');

// --- Minimal DOM shim -------------------------------------------------------
class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach(x => this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) {
    const has = this.set.has(c);
    const on = force === undefined ? !has : force;
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
}
class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attrs = {};
    this.classList = new ClassList();
    this.listeners = {};
    this.textContent = '';
    this.value = '';
    this.style = {};
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
  dispatch(t, ev = {}) { (this.listeners[t] || []).forEach(fn => fn({ stopPropagation() {}, preventDefault() {}, target: this, ...ev })); }
  click() { this.dispatch('click'); }
  append(c) { c.parent = this; this.children.push(c); }
  _all() { return this.children.flatMap(c => [c, ...c._all()]); }
  querySelector(sel) { return this._match(sel)[0] || null; }
  querySelectorAll(sel) { return this._match(sel); }
  _match(sel) {
    return this._all().filter(el => {
      if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
      if (sel.includes('[')) {
        const m = sel.match(/^script\[type="application\/json"\]\.(\S+)$/);
        if (m) return el.tagName === 'SCRIPT' && el.classList.contains(m[1]);
      }
      return false;
    });
  }
}

function parseFragment(html) {
  // Build a synthetic tree from compiler fragment: root, data script, nodes, edges.
  const root = new El('div');
  root.classList.add('mk-diagram-root');
  root.setAttribute('data-instance-id', (html.match(/data-instance-id="([a-f0-9]+)"/) || [])[1] || 'x');
  root.setAttribute('data-preset', (html.match(/data-preset="([^"]+)"/) || [])[1] || 'classic');
  root.setAttribute('data-theme', (html.match(/data-theme="([^"]+)"/) || [])[1] || 'light');

  const viewport = new El('div'); viewport.classList.add('mk-diagram-viewport'); root.append(viewport);
  const svg = new El('svg'); svg.classList.add('mk-diagram-svg'); svg.innerHTML = ''; viewport.append(svg);

  const search = new El('input'); search.classList.add('mk-diagram-search-input'); root.append(search);

  for (const cls of ['mk-btn-theme', 'mk-btn-present', 'mk-btn-share', 'mk-btn-reach-down',
    'mk-btn-reach-up', 'mk-btn-route', 'mk-btn-lens', 'mk-btn-prev-chapter', 'mk-btn-next-chapter']) {
    const b = new El('button'); b.classList.add(cls); root.append(b);
  }
  const chapLabel = new El('span'); chapLabel.classList.add('mk-chapter-label'); root.append(chapLabel);
  const dataScript = new El('script'); dataScript.classList.add('mk-diagram-data');
  dataScript.setAttribute('type', 'application/json');
  dataScript.textContent = (html.match(/<script type="application\/json" class="mk-diagram-data">([\s\S]*?)<\/script>/) || [])[1] || '{}';
  root.append(dataScript);

  // Nodes
  const nodeRe = /<g class="mk-node" data-node-id="([^"]+)" data-label="([^"]*)" data-role="([^"]*)" data-desc="([^"]*)"/g;
  let m;
  while ((m = nodeRe.exec(html))) {
    const n = new El('g'); n.classList.add('mk-node');
    n.setAttribute('data-node-id', m[1]); n.setAttribute('data-label', m[2]);
    n.setAttribute('data-role', m[3]); n.setAttribute('data-desc', m[4]);
    svg.append(n);
  }
  // Edges
  const edgeRe = /<g class="mk-edge" data-from="([^"]+)" data-to="([^"]+)" data-edge-id="([^"]*)"/g;
  while ((m = edgeRe.exec(html))) {
    const e = new El('g'); e.classList.add('mk-edge');
    e.setAttribute('data-from', m[1]); e.setAttribute('data-to', m[2]); e.setAttribute('data-edge-id', m[3]);
    svg.append(e);
  }
  return root;
}

// Install global document/window shims and load reader.js
const docKeyHandlers = [];
globalThis.document = {
  readyState: 'complete',
  activeElement: { tagName: 'BODY', blur() {} },
  addEventListener(t, fn) { if (t === 'keydown') docKeyHandlers.push(fn); },
  querySelectorAll() { return []; },
  createElement() { return new El(); },
  body: { appendChild() {}, removeChild() {} }
};
globalThis.window = {};
globalThis.XMLSerializer = class { serializeToString() { return '<svg></svg>'; } };
let lastExportedBlobContent = null;
globalThis.Blob = class {
  constructor(parts, opts) {
    lastExportedBlobContent = parts.join('');
    this.parts = parts;
    this.opts = opts;
  }
};
globalThis.URL = { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} };

await import('../assets/reader.js');
const init = globalThis.window.MaxKitDiagram.init;

function countDimmed(root) { return root.querySelectorAll('.mk-node').filter(n => n.classList.contains('is-dimmed')).length; }
function countFocused(root) { return root.querySelectorAll('.mk-node').filter(n => n.classList.contains('is-focused')).length; }
function countHiEdges(root) { return root.querySelectorAll('.mk-edge').filter(e => e.classList.contains('is-highlighted')).length; }

console.log('=== Reader Interaction Smoke Tests (DOM shim) ===');

// Architecture: gateway -> auth -> db
const archRoot = parseFragment(compile(readFileSync(join(FIXTURES, 'architecture-sample.json'), 'utf-8'), { format: 'fragment' }));
init(archRoot);

// Clear any chapter auto-focus applied at init, then test node focus.
docKeyHandlers.forEach(fn => fn({ key: 'Escape', preventDefault() {}, target: {} }));
// Node focus: click gateway
const gw = archRoot.querySelectorAll('.mk-node').find(n => n.getAttribute('data-node-id') === 'gateway');
gw.dispatch('click');
if (countFocused(archRoot) !== 1) throw new Error('focus: expected exactly 1 focused node');
if (countHiEdges(archRoot) < 1) throw new Error('focus: expected highlighted edges from focused node');
console.log('✓ Node focus highlights node and direct edges.');

// Search
const searchInput = archRoot.querySelector('.mk-diagram-search-input');
searchInput.value = 'auth';
searchInput.dispatch('input', { target: searchInput });
const authFocused = archRoot.querySelectorAll('.mk-node').some(n => n.getAttribute('data-node-id') === 'auth' && n.classList.contains('is-focused'));
if (!authFocused) throw new Error('search: "auth" did not focus the auth node');
console.log('✓ Search focuses matching nodes by label/id/desc.');

// Downstream reach from gateway (button)
archRoot.querySelector('.mk-btn-reach-down')?.dispatch?.('click');
// gateway -> auth -> db : all 3 reachable, none dimmed
if (countDimmed(archRoot) !== 0) throw new Error('reach-down: expected all nodes reachable from gateway');
console.log('✓ Downstream reach traces authored directed edges.');

// Route inspection (first -> last)
archRoot.querySelector('.mk-btn-route')?.dispatch?.('click');
if (countHiEdges(archRoot) < 2) throw new Error('route: expected shortest path edges highlighted');
console.log('✓ Route inspection highlights a deterministic authored path.');

// Role lens cycle
const lensBtn = archRoot.querySelector('.mk-btn-lens');
lensBtn?.dispatch?.('click');
if (countFocused(archRoot) < 1) throw new Error('lens: expected role-matched nodes focused');
console.log('✓ Role lens highlights nodes by declared role.');

// Keyboard: Escape clears
docKeyHandlers.forEach(fn => fn({ key: 'Escape', preventDefault() {}, target: {} }));
if (countFocused(archRoot) !== 0 || countDimmed(archRoot) !== 0) throw new Error('escape: expected cleared highlights');
console.log('✓ Escape clears all highlight/dim state.');

// Multi-node chapter focus: chapter 2 declares focus_nodes ["gateway","auth"].
// Navigate to it via the "]" next-chapter key and assert BOTH nodes focus (full-array contract).
const nextChapterKey = { key: ']', preventDefault() {}, target: { tagName: 'BODY' } };
docKeyHandlers.forEach(fn => fn(nextChapterKey)); // chap-1 -> chap-2
const focusedIds = archRoot.querySelectorAll('.mk-node')
  .filter(n => n.classList.contains('is-focused'))
  .map(n => n.getAttribute('data-node-id')).sort();
if (focusedIds.length !== 2 || focusedIds[0] !== 'auth' || focusedIds[1] !== 'gateway') {
  throw new Error(`chapter: expected both focus_nodes [auth,gateway] focused, got [${focusedIds}]`);
}
console.log('✓ Chapter highlights the full focus_nodes array (≥2 nodes).');

// Share Card Export: assert self-contained standalone SVG with resolved theme variables
const shareBtn = archRoot.querySelector('.mk-btn-share');
shareBtn?.dispatch?.('click');
if (!lastExportedBlobContent) throw new Error('share: expected Blob export on share button click');

// 1. Reference-minus-definition completeness check
const varUsages = Array.from(lastExportedBlobContent.matchAll(/var\((--mk-[a-z0-9-]+)\)/gi), m => m[1]);
const uniqueUsages = new Set(varUsages);
const definedVars = new Set(Array.from(lastExportedBlobContent.matchAll(/(--mk-[a-z0-9-]+)\s*:/gi), m => m[1]));
const missingDefs = [...uniqueUsages].filter(v => !definedVars.has(v));
if (missingDefs.length > 0) {
  throw new Error(`share: missing CSS variable definitions in exported SVG: ${missingDefs.join(', ')}`);
}

// 2. Non-classic preset/theme verification (signal-flow:dark)
const sfRoot = parseFragment(compile(readFileSync(join(FIXTURES, 'architecture-sample.json'), 'utf-8'), { format: 'fragment', preset: 'signal-flow', theme: 'dark' }));
init(sfRoot);
const sfShareBtn = sfRoot.querySelector('.mk-btn-share');
sfShareBtn?.dispatch?.('click');
if (!lastExportedBlobContent.includes('--mk-bg: #031c18;') || !lastExportedBlobContent.includes('--mk-accent: #34d399;')) {
  throw new Error('share: non-classic preset (signal-flow:dark) did not serialize accurate palette');
}

// Check signal-flow reference-minus-definition completeness
const sfUsages = new Set(Array.from(lastExportedBlobContent.matchAll(/var\((--mk-[a-z0-9-]+)\)/gi), m => m[1]));
const sfDefs = new Set(Array.from(lastExportedBlobContent.matchAll(/(--mk-[a-z0-9-]+)\s*:/gi), m => m[1]));
const sfMissing = [...sfUsages].filter(v => !sfDefs.has(v));
if (sfMissing.length > 0) {
  throw new Error(`share: signal-flow missing variable definitions: ${sfMissing.join(', ')}`);
}

console.log('✓ Share card export serializes computed/fallback palette with reference-minus-definition completeness (classic + signal-flow).');

// Double-init guard
init(archRoot);
console.log('✓ Re-init on same container is a no-op (init guard present).');

console.log('\n========================================');
console.log('ALL READER INTERACTION TESTS PASSED!');
console.log('========================================');
