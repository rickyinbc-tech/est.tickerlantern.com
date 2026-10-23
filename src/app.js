import { DEFAULTS, BOUNDS, project, sensitivity, validate, annualCSV } from './model.js';

const $ = id => document.getElementById(id);
const pct = v => `${(v * 100).toFixed(2)}%`;
const n = v => v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const short = v => v.toLocaleString('en-US', { maximumFractionDigits: 1 });
const signed = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svgText = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
const inputKeys = Object.keys(BOUNDS);
let activeModel = null, announceTimer;

function axisStep(span) {
  const raw = Math.max(span, .01) / 4;
  const base = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].find(x => x * base >= raw) * base;
}

function wealthChart(model) {
  const width = 700, height = 310, left = 44, right = 68, top = 26, bottom = 38;
  const plotW = width - left - right, plotH = height - top - bottom;
  const all = model.points.flatMap(p => [p.price, p.cashWealth, p.reinvestedWealth]);
  const step = axisStep(Math.max(...all) - Math.min(...all));
  const low = Math.max(0, Math.floor((Math.min(...all) - step * .35) / step) * step);
  const high = Math.ceil((Math.max(...all) + step * .4) / step) * step;
  const x = year => left + plotW * year / model.input.years;
  const y = value => top + plotH * (high - value) / (high - low);
  const parts = [`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="wealth-title wealth-desc"><title id="wealth-title">Illustrative wealth paths over ${model.input.years} years</title><desc id="wealth-desc">Starting at 100, terminal price is ${n(model.last.price)}, terminal price plus cash is ${n(model.last.cashWealth)}, and reinvested wealth is ${n(model.last.reinvestedWealth)}. Accessible annual data follows below.</desc>`];
  for (let value = low; value <= high + step * .01; value += step) {
    parts.push(`<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" stroke="#dce5ed" stroke-width="1"/>`);
    parts.push(svgText(left - 10, y(value) + 4, short(value), 'fill="#556779" font-size="10" text-anchor="end"'));
  }
  const tickYears = model.input.years <= 10 ? model.points.map(p => p.year) : [0, ...Array.from({ length: 5 }, (_, i) => Math.round(model.input.years * (i + 1) / 5))];
  for (const year of tickYears) parts.push(svgText(x(year), height - 16, year === 0 ? 'Entry' : `Yr ${year}`, 'fill="#556779" font-size="10" text-anchor="middle"'));
  const series = [{ key: 'price', color: '#6c87a1', dash: '', width: 2 }, { key: 'cashWealth', color: '#396f9e', dash: '6 4', width: 2 }, { key: 'reinvestedWealth', color: '#087f76', dash: '', width: 3 }];
  const endpoints = [];
  for (const line of series) {
    const path = model.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.year).toFixed(2)},${y(p[line.key]).toFixed(2)}`).join(' ');
    parts.push(`<path d="${path}" fill="none" stroke="${line.color}" stroke-width="${line.width}" stroke-dasharray="${line.dash}" stroke-linecap="round" stroke-linejoin="round"/>`);
    parts.push(`<circle cx="${x(model.input.years)}" cy="${y(model.last[line.key])}" r="3.5" fill="${line.color}"/>`);
    endpoints.push({ ...line, rawY: y(model.last[line.key]), labelY: y(model.last[line.key]), value: model.last[line.key] });
  }
  endpoints.sort((a, b) => a.rawY - b.rawY);
  endpoints[0].labelY = Math.max(top + 4, endpoints[0].rawY);
  for (let i = 1; i < endpoints.length; i++) endpoints[i].labelY = Math.max(endpoints[i].rawY, endpoints[i - 1].labelY + 18);
  if (endpoints.at(-1).labelY > height - bottom) {
    endpoints.at(-1).labelY = height - bottom;
    for (let i = endpoints.length - 2; i >= 0; i--) endpoints[i].labelY = Math.min(endpoints[i].labelY, endpoints[i + 1].labelY - 18);
  }
  for (const line of endpoints) {
    parts.push(`<path d="M${width - right + 4},${line.rawY} L${width - right + 13},${line.labelY}" fill="none" stroke="${line.color}" stroke-width=".8"/>`);
    parts.push(svgText(width - right + 17, line.labelY + 4, short(line.value), `fill="${line.color}" font-size="11" font-weight="600"`));
  }
  parts.push('</svg>');
  $('wealth-chart').innerHTML = parts.join('');
}

function waterfall(model) {
  const { epsOnlyPrice, last } = model;
  const bars = [
    { label: ['Starting', 'price'], from: 0, to: 100, value: 100, color: '#102f50', total: true },
    { label: ['Earnings', 'growth'], from: 100, to: epsOnlyPrice, value: model.epsGain, color: model.epsGain >= 0 ? '#087f76' : '#a34549' },
    { label: ['P/E', 'change'], from: epsOnlyPrice, to: last.price, value: model.multipleImpact, color: model.multipleImpact >= 0 ? '#087f76' : '#a34549' },
    { label: ['Cash', 'dividends'], from: last.price, to: last.cashWealth, value: last.cumulativeDividend, color: '#396f9e' },
    { label: ['Terminal', 'price + cash'], from: 0, to: last.cashWealth, value: last.cashWealth, color: '#102f50', total: true }
  ];
  const width = 700, height = 350, top = 40, bottom = 62, left = 45, plotW = 635;
  const max = Math.max(...bars.flatMap(b => [b.from, b.to]));
  const step = axisStep(max), high = Math.ceil(max * 1.15 / step) * step;
  const y = v => top + (height - top - bottom) * (high - v) / high;
  const column = plotW / bars.length, barW = column * .58;
  const parts = [`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="waterfall-title waterfall-desc"><title id="waterfall-title">Terminal wealth attribution</title><desc id="waterfall-desc">Initial 100, earnings contribution ${signed(model.epsGain)}, valuation contribution ${signed(model.multipleImpact)}, cash dividends ${n(last.cumulativeDividend)}, terminal price plus cash ${n(last.cashWealth)}.</desc>`];
  for (let v = 0; v <= high; v += step) {
    parts.push(`<line x1="${left}" x2="${width - 20}" y1="${y(v)}" y2="${y(v)}" stroke="#dce5ed"/>`);
    parts.push(svgText(left - 10, y(v) + 4, short(v), 'fill="#556779" font-size="10" text-anchor="end"'));
  }
  bars.forEach((bar, i) => {
    const x = left + column * i + (column - barW) / 2;
    const rectY = y(Math.max(bar.from, bar.to)), rectH = Math.max(1, Math.abs(y(bar.from) - y(bar.to)));
    parts.push(`<rect x="${x}" y="${rectY}" width="${barW}" height="${rectH}" fill="${bar.color}" rx="2"/>`);
    parts.push(svgText(x + barW / 2, rectY - 11, bar.total ? n(bar.value) : signed(bar.value), `fill="${bar.color}" font-size="12" font-weight="600" text-anchor="middle"`));
    if (i < bars.length - 1) parts.push(`<line x1="${x + barW}" x2="${x + column}" y1="${y(bar.to)}" y2="${y(bar.to)}" stroke="#a4b6c6" stroke-dasharray="3 3"/>`);
    bar.label.forEach((label, j) => parts.push(svgText(x + barW / 2, height - 38 + j * 15, label, 'fill="#556779" font-size="11" text-anchor="middle"')));
  });
  parts.push('</svg>');
  $('waterfall-chart').innerHTML = parts.join('');
}

function sensitivityTable(model) {
  const grid = sensitivity(model.input);
  const heat = value => value < -.02 ? 0 : value < 0 ? 1 : value < .03 ? 2 : value < .06 ? 3 : value < .09 ? 4 : 5;
  $('sensitivity-body').innerHTML = grid.rows.map((row, i) => `<tr><th scope="row">${grid.growths[i]}%</th>${row.map((value, j) => `<td class="heat-${heat(value)}"><button type="button" data-growth="${grid.growths[i]}" data-pe="${grid.multiples[j]}" aria-pressed="${model.input.growth === grid.growths[i] && model.input.exitPE === grid.multiples[j]}" aria-label="EPS growth ${grid.growths[i]} percent, exit P/E ${grid.multiples[j]} times: cash-flow IRR ${pct(value)}">${pct(value)}</button></td>`).join('')}</tr>`).join('');
  $('sensitivity-badge').textContent = `${model.input.years}-year holding period`;
  $('sensitivity-note').textContent = `Entry P/E ${short(model.input.entryPE)}×, payout ${short(model.input.payout)}%, holding period ${model.input.years} years. Cells change only growth and exit P/E. Select a cell to load that scenario. No outline means the current inputs fall between these grid points.`;
}

function annualTable(model) {
  $('annual-data-body').innerHTML = model.points.map(p => `<tr><th scope="row">${p.year === 0 ? 'Entry' : p.year}</th><td>${n(p.eps)}</td><td>${n(p.pe)}×</td><td>${n(p.price)}</td><td>${n(p.dividend)}</td><td>${n(p.cashWealth)}</td><td>${n(p.reinvestedWealth)}</td></tr>`).join('');
}

function update({ announce = true } = {}) {
  const input = Object.fromEntries(inputKeys.map(key => [key, $(key).value]));
  const errors = validate(input), invalid = Object.keys(errors).length > 0;
  for (const key of inputKeys) {
    $(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    $(key + '-error').textContent = errors[key] || '';
  }
  $('model-error').hidden = !invalid;
  $('valid-output').hidden = invalid;
  $('download-csv').disabled = invalid;
  if (invalid) {
    activeModel = null;
    $('model-error').textContent = 'Update the highlighted assumptions to calculate a return. Results and charts are hidden until the inputs are valid.';
    $('waterfall-chart').innerHTML = '<p class="chart-fallback">Correct the scenario inputs to see the return bridge.</p>';
    $('sensitivity-body').innerHTML = '<tr><td colspan="6">Correct the scenario inputs to calculate sensitivity.</td></tr>';
    $('annual-data-body').innerHTML = '<tr><td colspan="7">Correct the scenario inputs to view annual data.</td></tr>';
    $('sensitivity-badge').textContent = 'Inputs required';
    $('sensitivity-note').textContent = 'No sensitivity results are shown while the scenario inputs are invalid.';
    return;
  }
  activeModel = project(input);
  const m = activeModel;
  $('price-cagr').textContent = pct(m.priceCAGR);
  $('cash-irr').textContent = pct(m.cashIRR);
  $('reinvest-cagr').textContent = pct(m.reinvestedCAGR);
  $('wealth-subtitle').textContent = `${m.input.years}-year wealth paths · before tax and costs`;
  wealthChart(m); waterfall(m); sensitivityTable(m); annualTable(m);
  const multipleText = m.input.exitPE < m.input.entryPE ? 'a lower exit P/E reduces price appreciation' : m.input.exitPE > m.input.entryPE ? 'a higher exit P/E amplifies price appreciation' : 'an unchanged P/E lets the price track EPS growth';
  const payoutText = m.input.payout === 0 ? 'With no dividends, all three annualized return measures coincide.' : `Cash dividends total ${n(m.last.cumulativeDividend)} per original unit; investor cash-flow IRR is ${pct(m.cashIRR)}.`;
  $('model-takeaway').textContent = `At ${short(m.input.growth)}% annual EPS growth, ${multipleText}. ${payoutText}`;
  if (announce) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { $('model-status').textContent = `Scenario updated. Price CAGR ${pct(m.priceCAGR)}. Cash-flow IRR ${pct(m.cashIRR)}. Reinvested CAGR ${pct(m.reinvestedCAGR)}.`; }, 350);
  }
}

$('model-fields').disabled = false;
for (const button of document.querySelectorAll('[data-preset], #reset-model, #print-report')) button.disabled = false;
$('assumptions').addEventListener('submit', event => event.preventDefault());
$('assumptions').addEventListener('input', () => update());
$('reset-model').addEventListener('click', () => { for (const key of inputKeys) $(key).value = DEFAULTS[key]; update(); });
for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => {
  if (button.dataset.preset === 'compression') for (const key of inputKeys) $(key).value = DEFAULTS[key];
  if (button.dataset.preset === 'constant') $('exitPE').value = $('entryPE').value;
  if (button.dataset.preset === 'zero') $('payout').value = 0;
  update();
});
$('sensitivity-body').addEventListener('click', event => {
  const button = event.target.closest('button[data-growth]');
  if (!button) return;
  const { growth, pe } = button.dataset;
  $('growth').value = growth; $('exitPE').value = pe; update();
  // Preserve keyboard focus after replacing the table's content.
  $('sensitivity-body').querySelector(`button[data-growth="${growth}"][data-pe="${pe}"]`)?.focus({ preventScroll: true });
});
$('download-csv').addEventListener('click', () => {
  if (!activeModel) return;
  const blob = new Blob([annualCSV(activeModel)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'tickerlantern-illustrative-annual-cash-flows.csv'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  $('model-status').textContent = 'Illustrative annual cash-flow CSV prepared for download.';
});
let detailsState = [];
window.addEventListener('beforeprint', () => { detailsState = Array.from(document.querySelectorAll('details'), detail => [detail, detail.open]); for (const [detail] of detailsState) detail.open = true; });
window.addEventListener('afterprint', () => { for (const [detail, open] of detailsState) detail.open = open; });
$('print-report').addEventListener('click', () => window.print());
function revealAnchor() { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target?.tagName === 'DETAILS') target.open = true; }
window.addEventListener('hashchange', revealAnchor);
revealAnchor();
update({ announce: false });
