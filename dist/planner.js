// Planner toolkit interactions: one conversation at a time (hash routing),
// re-render a figure when its inputs change, draw each chart at its own width
// so text stays legible, a readout under line charts (pointer and arrow keys),
// and a client view that hides the talking points.
import { renderFigure, formatters } from './planner-sections.js';
import { setChartWidth } from './planner-charts.js';

// Old homepage bookmarks pointed at the valuation app's anchors; send them on.
const MOVED = ['#indices', '#model', '#return-bridge', '#sensitivity', '#thesis', '#dividends', '#valuation', '#methodology', '#model-conventions', '#wealth-chart', '#research-library'];
if (MOVED.includes(location.hash)) location.replace((location.pathname.startsWith('/zh') ? '/zh/valuations' : '/valuations') + location.hash);

const f = formatters();
const figures = [...document.querySelectorAll('.pc-figure[data-figure]')];
const panels = [...document.querySelectorAll('.pc-panel')];
const railLinks = [...document.querySelectorAll('.pc-topics a')];

function stateOf(form) {
  const state = {};
  if (!form) return state;
  for (const el of form.elements) if (el.name) state[el.name] = el.type === 'number' || el.type === 'range' ? (el.value === '' ? '' : Number(el.value)) : el.value;
  return state;
}

// Chart width in SVG units = the container's CSS width, so 13px text renders at 13px.
function widthFor(fig) {
  const box = fig.querySelector('.pc-chart');
  const w = box ? box.clientWidth : 0;
  return w ? Math.max(320, Math.min(900, Math.round(w))) : 0;
}

function render(fig) {
  const name = fig.dataset.figure, form = fig.querySelector('form.pc-controls');
  const width = widthFor(fig);
  if (width) { setChartWidth(width); fig.dataset.width = width; }
  const result = renderFigure(name, stateOf(form));
  for (const key of ['chart', 'legend', 'summary', 'table', 'assumptions']) {
    const out = fig.querySelector(`[data-out="${key}"]`);
    if (!out || result[key] == null) continue;
    if (key === 'summary' || key === 'assumptions') { if (out.textContent !== result[key]) out.textContent = result[key]; }
    else out.innerHTML = result[key];
  }
  if (form) for (const echo of form.querySelectorAll('output[data-echo]')) echo.textContent = form.elements[echo.dataset.echo].value + echo.dataset.unit;
  const readout = fig.querySelector('[data-out="readout"]');
  if (readout) readout.textContent = fig.querySelector('svg[data-series]') ? HINT : '';
}

const HINT = matchMedia('(pointer: coarse)').matches ? 'Tap or drag across the chart to read values.' : 'Point at the chart, or focus it and use the arrow keys, to read values.';

let pending = new Set(), frame = 0;
function schedule(fig) {
  pending.add(fig);
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; for (const x of pending) render(x); pending = new Set(); });
}

for (const fig of figures) {
  const form = fig.querySelector('form.pc-controls');
  if (!form) continue;
  form.addEventListener('input', () => schedule(fig));
  form.addEventListener('change', () => schedule(fig));
  form.addEventListener('reset', () => setTimeout(() => schedule(fig)));
  form.addEventListener('submit', e => e.preventDefault());
}

// Re-draw visible charts whose container width changed.
function fitVisible() {
  for (const fig of figures) {
    if (!fig.offsetParent || !fig.querySelector('.pc-chart')) continue;
    const w = widthFor(fig);
    if (w && Math.abs(w - (+fig.dataset.width || 720)) >= 16) render(fig);
  }
}
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitVisible, 120); });

// One conversation at a time. The hash names a conversation, a figure or a source.
const panelIds = new Set(panels.map(p => p.id));
function show(id, { move = false } = {}) {
  const panel = panels.find(p => p.id === id);
  if (!panel) return;
  for (const p of panels) p.classList.toggle('is-active', p === panel);
  for (const a of railLinks) {
    const on = a.getAttribute('href') === '#' + id;
    if (on) { a.setAttribute('aria-current', 'true'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    else a.removeAttribute('aria-current');
  }
  fitVisible();
  if (move) {
    panel.scrollIntoView({ block: 'start' });
    panel.querySelector('h2').focus({ preventScroll: true });
  }
}
function route(move) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return show(panels[0]?.id);
  if (panelIds.has(id)) return show(id, { move });
  const target = document.getElementById(id);
  if (!target) return;
  if (id.startsWith('src-') || id === 'sources') {
    document.getElementById('source-list').open = true;
    if (move) target.scrollIntoView({ block: 'center' });
    return;
  }
  const owner = target.closest('.pc-panel');
  if (owner) { show(owner.id); if (move) target.scrollIntoView({ block: 'start' }); }
}
route(Boolean(location.hash));
addEventListener('hashchange', () => route(true));
// Re-clicking the current conversation should still bring it into view.
for (const a of railLinks) a.addEventListener('click', () => { if (a.getAttribute('href') === location.hash) route(true); });

// Readout for line charts.
const fmt = { money: f.money, pct: v => f.num(v, 1) + '%' };
function readoutAt(svg, index) {
  const series = JSON.parse(svg.dataset.series), unit = svg.dataset.unit, kind = svg.dataset.xKind;
  if (!fmt[unit] || kind === 'none') return;
  const xs = series[0].p.map(p => p[0]);
  index = Math.max(0, Math.min(xs.length - 1, index));
  const x = xs[index], fig = svg.closest('.pc-figure');
  const label = kind === 'count' ? `${x} holdings` : x >= 1900 ? String(x) : x === 0 ? 'Today' : `Year ${x}`;
  fig.querySelector('[data-out="readout"]').textContent = label + ': ' + series.map(s => { const pt = s.p.find(p => p[0] === x); return pt ? `${s.n} ${fmt[unit](pt[1])}` : null; }).filter(Boolean).join(' · ');
  const left = +svg.dataset.plotLeft, width = +svg.dataset.plotWidth, min = +svg.dataset.xMin, max = +svg.dataset.xMax;
  const gx = left + (max === min ? 0 : (x - min) / (max - min) * width), guide = svg.querySelector('.pc-guide');
  if (guide) { guide.removeAttribute('hidden'); guide.querySelector('line').setAttribute('x1', gx); guide.querySelector('line').setAttribute('x2', gx); }
  svg.dataset.index = index;
}
function indexFromPointer(svg, event) {
  const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, ux = (event.clientX - box.left) / box.width * vb.width;
  const series = JSON.parse(svg.dataset.series), xs = series[0].p.map(p => p[0]);
  const min = +svg.dataset.xMin, max = +svg.dataset.xMax, left = +svg.dataset.plotLeft, width = +svg.dataset.plotWidth;
  const x = min + (ux - left) / width * (max - min);
  let best = 0; xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; });
  return best;
}
document.addEventListener('pointermove', e => {
  const svg = e.target.closest?.('svg[data-series]');
  if (svg) readoutAt(svg, indexFromPointer(svg, e));
});
document.addEventListener('pointerdown', e => {
  const svg = e.target.closest?.('svg[data-series]');
  if (svg) readoutAt(svg, indexFromPointer(svg, e));
});
document.addEventListener('keydown', e => {
  const svg = e.target.closest?.('svg[data-series]');
  if (!svg || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const n = JSON.parse(svg.dataset.series)[0].p.length, i = svg.dataset.index == null ? 0 : +svg.dataset.index;
  readoutAt(svg, e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : i + (e.key === 'ArrowRight' ? 1 : -1));
});
document.addEventListener('focusin', e => { const svg = e.target.closest?.('svg[data-series]'); if (svg && svg.dataset.index == null) readoutAt(svg, 0); });

// Client view hides the talking points while the screen is shared.
const toggle = document.getElementById('notes-toggle');
const store = { get() { try { return localStorage.getItem('tl-planner-notes'); } catch { return null; } }, set(v) { try { localStorage.setItem('tl-planner-notes', v); } catch { /* private mode */ } } };
function setClientView(on) {
  document.body.classList.toggle('pc-hide-notes', on);
  if (toggle) toggle.setAttribute('aria-pressed', String(on));
}
if (toggle) {
  setClientView(store.get() === 'hidden');
  toggle.addEventListener('click', () => { const on = toggle.getAttribute('aria-pressed') !== 'true'; setClientView(on); store.set(on ? 'hidden' : 'shown'); });
}
for (const button of document.querySelectorAll('[data-print]')) button.addEventListener('click', () => print());
