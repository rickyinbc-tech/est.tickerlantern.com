import { DEFAULTS, BOUNDS, project, sensitivity, validate, annualCSV } from './model.js';
import { validateFeed, sourceInputs, isStale, premium, isDatedMean, historyCoverage } from './index-data.js';

const $ = id => document.getElementById(id);
const pct = v => `${(v * 100).toFixed(2)}%`;
const n = v => v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const short = v => v.toLocaleString('en-US', { maximumFractionDigits: 1 });
const signed = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svgText = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
const inputKeys = Object.keys(BOUNDS);
let activeModel = null, announceTimer;
const editableKeys = [...inputKeys, 'dividendMode', 'dividendYield'];
let indexFeed = null, selectedIndexId = 'sp500', sourceFollowing = true, updateInProgress = false;
const indexOverrides = new Map(), savedScenarios = new Map();
const selectedIndex = () => indexFeed?.indices.find(row => row.id === selectedIndexId);
const readInputs = () => Object.fromEntries(editableKeys.map(key => [key, $(key).value]));
function writeInputs(values) { for (const key of editableKeys) if (values[key] != null) $(key).value = values[key]; }
function lockField(key) { if (!['growth', 'years'].includes(key)) indexOverrides.set(selectedIndexId, { ...(indexOverrides.get(selectedIndexId) || {}), [key]: true }); }

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
  const dividendBasis = model.input.dividendMode === 'yield' ? `initial yield ${short(model.input.dividendYield)}%` : `payout ${short(model.input.payout)}%`;
  $('sensitivity-note').textContent = `Entry P/E ${short(model.input.entryPE)}×, ${dividendBasis}, holding period ${model.input.years} years. Cells change only growth and exit P/E. Select a cell to load that scenario. No outline means the current inputs fall between these grid points.`;
}

function annualTable(model) {
  $('annual-data-body').innerHTML = model.points.map(p => `<tr><th scope="row">${p.year === 0 ? 'Entry' : p.year}</th><td>${n(p.eps)}</td><td>${n(p.pe)}×</td><td>${n(p.price)}</td><td>${n(p.dividend)}</td><td>${n(p.cashWealth)}</td><td>${n(p.reinvestedWealth)}</td></tr>`).join('');
}

const dateLabel = value => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: value.includes('T') ? 'America/Vancouver' : 'UTC' }) : 'Not connected';
const peLabel = value => value == null ? '—' : n(value) + '×';

function renderIndexList() {
  if (!indexFeed) return;
  const query = $('index-search').value.trim().toLowerCase(), region = $('index-region').value;
  const rows = indexFeed.indices.filter(row => (region === 'all' || row.region === region) && `${row.name} ${row.region} ${row.description}`.toLowerCase().includes(query));
  $('index-list').innerHTML = rows.map(row => `<button type="button" class="index-choice" data-index="${row.id}" aria-pressed="${row.id === selectedIndexId}"><span>${escape(row.name)}<small>${escape(row.region)}${isStale(row) ? ' · retained' : ''}</small></span><strong>${peLabel(row.forwardPE)}</strong></button>`).join('');
  $('index-empty').hidden = rows.length > 0;
  $('index-comparison-body').innerHTML = indexFeed.indices.map(row => `<tr${row.id === selectedIndexId ? ' class="selected-index-row"' : ''}><th scope="row"><button type="button" data-index="${row.id}" aria-pressed="${row.id === selectedIndexId}">${escape(row.name)}</button></th><td>${peLabel(row.forwardPE)}</td><td>${peLabel(row.mean10YearForwardPE)}${row.meanAsOf ? `<small>${dateLabel(row.meanAsOf)}${isDatedMean(row) ? ' · dated reference' : ''}</small>` : ''}</td><td>${row.dividendYield == null ? '—' : n(row.dividendYield) + '%'}</td><td>${dateLabel(row.asOf)}${isStale(row) ? ' · retained' : ''}</td></tr>`).join('');
}

function indexValuationChart(row) {
  if (row.forwardPE == null) {
    $('index-valuation-chart').innerHTML = '<p class="chart-fallback">Forward valuation data is not connected for this exact benchmark. Open the provider page below; the scenario controls remain illustrative.</p>';
    return;
  }
  const width = 430, height = 156, left = 104, plotW = 255;
  const max = Math.ceil(Math.max(row.forwardPE, row.mean10YearForwardPE || 0) * 1.2 / 5) * 5;
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="index-chart-title index-chart-desc"><title id="index-chart-title">${escape(row.name)} forward valuation comparison</title><desc id="index-chart-desc">Current ${peLabel(row.forwardPE)}. ${row.mean10YearForwardPE == null ? 'A ten-year average is not available.' : 'Publisher-reported ten-year mean ' + peLabel(row.mean10YearForwardPE) + '.'}</desc>`;
  for (let v = 0; v <= max; v += max / 4) {
    const x = left + plotW * v / max;
    svg += `<line x1="${x}" x2="${x}" y1="20" y2="118" stroke="#dce5ed"/>` + svgText(x, 140, short(v) + '×', 'fill="#556779" font-size="10" text-anchor="middle"');
  }
  for (const [i, label, value, color] of [[0, 'Current', row.forwardPE, '#396f9e'], [1, '10-year mean', row.mean10YearForwardPE, '#087f76']]) {
    const y = 31 + i * 52;
    svg += svgText(left - 12, y + 17, label, 'fill="#556779" font-size="11" text-anchor="end"');
    if (value == null) svg += svgText(left + 8, y + 17, 'Not available', 'fill="#556779" font-size="11"');
    else {
      const barW = plotW * value / max;
      svg += `<rect x="${left}" y="${y}" width="${barW}" height="27" fill="${color}" rx="2"/>` + svgText(left + barW + 9, y + 18, peLabel(value), `fill="${color}" font-size="12" font-weight="600"`);
    }
  }
  $('index-valuation-chart').innerHTML = svg + '</svg>';
}

function renderScenarioContext() {
  const row = selectedIndex();
  if (!row) return;
  const locks = indexOverrides.get(row.id) || {}, custom = Object.keys(locks).length;
  $('scenario-index-label').textContent = row.name;
  $('scenario-mode-label').textContent = row.forwardPE == null ? 'Illustrative inputs · source valuation unavailable' : !sourceFollowing ? 'Source following paused · custom scenario' : `Source-linked${custom ? ` · ${custom} protected field${custom > 1 ? 's' : ''}` : ''} · growth and horizon are your assumptions`;
  if (!activeModel) {
    $('index-model-note').textContent = 'Correct the highlighted scenario assumptions to calculate a return. Source observations above remain unchanged.';
    return;
  }
  const { input } = activeModel;
  if (row.forwardPE == null) {
    $('index-model-note').textContent = `No sourced forward valuation is connected for ${row.name}. The model below is a custom illustration, not an estimate of this index’s expected return.`;
    return;
  }
  const entryBasis = sourceFollowing && !locks.entryPE ? 'source' : 'custom';
  const exitBasis = !sourceFollowing || locks.exitPE ? 'custom' : row.mean10YearForwardPE != null ? `${isDatedMean(row) ? 'dated 10-year reference' : 'reported 10-year mean'} as of ${dateLabel(row.meanAsOf)}` : 'flat-multiple assumption; 10-year mean unavailable';
  const dividendBasis = input.dividendMode === 'yield' ? `${n(input.dividendYield)}% initial yield${sourceFollowing && !locks.dividendMode && !locks.dividendYield ? ' anchored to the historical source yield' : ' (custom)'}` : `${short(input.payout)}% assumed payout; not a reported payout`;
  $('index-model-note').textContent = `Scenario: ${short(input.growth)}% EPS growth, ${input.years} years; entry ${n(input.entryPE)}× (${entryBasis}), exit ${n(input.exitPE)}× (${exitBasis}); ${dividendBasis}. Source values are observations, not forecasts.`;
}

function renderIndexDetail() {
  const row = selectedIndex();
  if (!row) return;
  $('selected-index-region').textContent = row.region;
  $('selected-index-name').textContent = row.name;
  $('selected-index-description').textContent = row.description;
  $('index-current-pe').textContent = peLabel(row.forwardPE);
  $('index-current-date').textContent = row.asOf ? 'As of ' + dateLabel(row.asOf) : 'No connected forward valuation';
  $('index-mean-pe').textContent = peLabel(row.mean10YearForwardPE);
  $('index-mean-date').textContent = row.meanAsOf ? (isDatedMean(row) ? 'Dated reference · ' : 'Reported ') + dateLabel(row.meanAsOf) : 'Verified 10-year mean unavailable';
  $('index-yield').textContent = row.dividendYield == null ? '—' : n(row.dividendYield) + '%';
  $('index-yield-note').textContent = row.dividendYield == null ? 'Not connected for this benchmark' : 'Historical yield · ' + dateLabel(row.yieldAsOf || row.asOf);
  const gap = premium(row);
  $('index-premium').textContent = gap == null ? '—' : `${gap >= 0 ? '+' : '−'}${Math.abs(gap * 100).toFixed(2)}%`;
  $('index-premium-label').textContent = gap == null ? 'Historical comparison' : isDatedMean(row) ? 'Relative to the dated 10-year reference' : 'Relative to the published 10-year mean';
  $('index-premium-note').textContent = gap == null ? 'A verified 10-year forward-P/E mean is not available. A trailing multiple, CAPE or shorter history is not a substitute.' : `The current multiple is ${gap >= 0 ? 'above' : 'below'} its published reference. ${isDatedMean(row) ? `Its 10-year window ends ${dateLabel(row.meanAsOf)}, not today. ` : ''}Different providers’ earnings estimates and aggregation methods can differ. This comparison does not determine fair value or establish an expected return.`;
  const stale = isStale(row);
  $('selected-data-badge').textContent = row.forwardPE == null ? 'Valuation not connected' : stale ? 'Retained observation' : 'Sourced observation';
  $('selected-data-badge').classList.toggle('retained-badge', stale || row.forwardPE == null);
  const source = row.source, url = source?.url || row.profileUrl;
  const evidenceLink = (label, evidence, date) => `<span>${escape(label)} — ${escape(evidence?.publisher || 'Benchmark provider')}${date ? ' · ' + dateLabel(date) : ''}${evidence?.page ? ' · PDF page ' + evidence.page : ''} · <a href="${escape(evidence?.url || row.profileUrl)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></span>`;
  $('index-source-line').innerHTML = evidenceLink('Forward P/E', source, row.asOf) + (row.mean10YearForwardPE != null ? evidenceLink('10-year reference', row.meanSource || source, row.meanAsOf) : '') + (row.dividendYield != null && row.yieldSource?.url !== source?.url ? evidenceLink('Dividend yield', row.yieldSource || source, row.yieldAsOf || row.asOf) : '');
  const historicalNote = row.mean10YearForwardPE == null ? 'No verified 10-year mean is connected. The default exit equals the current multiple as an explicit flat-multiple scenario.' : `${isDatedMean(row) ? `Dated historical reference: its 10-year window ends ${dateLabel(row.meanAsOf)}. This is not the latest rolling 10-year average. ` : ''}${row.meanMethod.replace(/\.\s*$/, '')}. ${row.meanSync?.status === 'retained' ? 'The latest historical-source check failed; the last verified mean and date are retained. ' : ''}`;
  $('index-evidence-note').textContent = row.forwardPE == null ? 'No validated forward valuation is connected for this exact benchmark; no different index or ETF is substituted.' : `${row.earningsBasis || 'Forward earnings'}${row.forwardMethod ? ' · ' + row.forwardMethod : ''}. ${historicalNote}${stale ? ' The current multiple is a retained observation; its publisher date has not been advanced.' : ''}`;
  $('restore-source').disabled = row.forwardPE == null;
  indexValuationChart(row);
  renderScenarioContext();
}

function applySourceValues({ restore = false } = {}) {
  const row = selectedIndex();
  if (!row || row.forwardPE == null) return;
  if (restore) { indexOverrides.delete(row.id); sourceFollowing = true; $('follow-source').checked = true; }
  if (sourceFollowing) writeInputs(sourceInputs(row, readInputs(), indexOverrides.get(row.id) || {}));
  update({ announce: false });
}

function selectIndex(id) {
  if (!indexFeed?.indices.some(row => row.id === id)) return;
  savedScenarios.set(selectedIndexId, readInputs());
  const globalAssumptions = { growth: $('growth').value, years: $('years').value };
  selectedIndexId = id;
  writeInputs({ ...DEFAULTS, ...(savedScenarios.get(id) || {}), ...globalAssumptions });
  if (sourceFollowing) applySourceValues();
  update(); renderIndexList(); renderIndexDetail();
  const url = new URL(location.href); url.searchParams.set('index', id); history.replaceState(null, '', url);
  $('index-update-status').textContent = `${selectedIndex().name} selected. ${selectedIndex().forwardPE == null ? 'No sourced valuation is connected; model inputs are illustrative.' : 'Valuation details and the return scenario have updated.'}`;
}

async function loadIndexData({ manual = false } = {}) {
  if (updateInProgress) return;
  updateInProgress = true; $('check-data').disabled = true;
  if (manual) $('index-update-status').textContent = 'Checking for a newer published source snapshot…';
  try {
    let feed;
    try {
      const response = await fetch('/api/indices', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Latest snapshot unavailable');
      feed = validateFeed(await response.json());
    } catch {
      const fallback = await fetch('/data/indices.json', { cache: 'no-store' });
      if (!fallback.ok) throw new Error('Snapshot unavailable');
      feed = { ...validateFeed(await fallback.json()), transport: 'bundled-fallback' };
    }
    if (indexFeed && feed.publishedAt < indexFeed.publishedAt) throw new Error('An older snapshot was returned');
    const firstLoad = !indexFeed;
    indexFeed = feed;
    if (firstLoad) { const requested = new URL(location.href).searchParams.get('index'); if (feed.indices.some(row => row.id === requested)) selectedIndexId = requested; }
    const observed = feed.indices.filter(row => row.forwardPE != null).length;
    $('coverage-count').textContent = `${observed} of ${feed.indices.length} benchmarks have sourced forward P/E`;
    $('data-check-date').textContent = 'Source checks (PT): ' + dateLabel(feed.sourceCheckAt);
    $('history-coverage').textContent = historyCoverage(feed);
    applySourceValues(); renderIndexList(); renderIndexDetail();
    $('index-update-status').textContent = feed.transport === 'bundled-fallback' ? 'Showing the bundled verified snapshot. The latest published feed could not be reached; source dates have not been advanced.' : feed.transport === 'bundled-newer' ? 'Showing the newer verified snapshot included with this report while the published feed cache catches up. Source dates and custom assumptions remain protected.' : `Latest published snapshot loaded. Sources checked ${dateLabel(feed.sourceCheckAt)}. Publisher observations update on their own schedules; edited assumptions remain protected.`;
  } catch {
    $('index-update-status').textContent = indexFeed ? 'The update check failed. Previously loaded observations and your scenario are retained.' : 'Index data is temporarily unavailable. The original illustrative model remains usable.';
  } finally { updateInProgress = false; $('check-data').disabled = false; }
}

$('index-search').addEventListener('input', renderIndexList);
$('index-region').addEventListener('change', renderIndexList);
for (const container of [$('index-list'), $('index-comparison-body')]) container.addEventListener('click', event => {
  const button = event.target.closest('button[data-index]'); if (!button) return;
  selectIndex(button.dataset.index);
  container.querySelector(`button[data-index="${selectedIndexId}"]`)?.focus({ preventScroll: true });
});
$('follow-source').addEventListener('change', () => { sourceFollowing = $('follow-source').checked; if (sourceFollowing) applySourceValues(); renderScenarioContext(); });
$('restore-source').addEventListener('click', () => { applySourceValues({ restore: true }); renderIndexDetail(); $('index-update-status').textContent = 'Source values restored. EPS growth and the holding period remain your scenario assumptions.'; });
$('check-data').addEventListener('click', () => loadIndexData({ manual: true }));
setInterval(() => { if (document.visibilityState === 'visible') loadIndexData(); }, 300000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadIndexData(); });

function update({ announce = true } = {}) {
  const input = readInputs();
  $('payout-field').hidden = input.dividendMode === 'yield';
  $('dividend-yield-field').hidden = input.dividendMode !== 'yield';
  const errors = validate(input), invalid = Object.keys(errors).length > 0;
  for (const key of editableKeys) {
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
    renderScenarioContext();
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
  const payoutText = m.last.cumulativeDividend === 0 ? 'With no dividends, all three annualized return measures coincide.' : `Cash dividends total ${n(m.last.cumulativeDividend)} per original unit; investor cash-flow IRR is ${pct(m.cashIRR)}.`;
  $('model-takeaway').textContent = `At ${short(m.input.growth)}% annual EPS growth, ${multipleText}. ${payoutText}`;
  savedScenarios.set(selectedIndexId, readInputs());
  renderScenarioContext();
  if (announce) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { $('model-status').textContent = `Scenario updated. Price CAGR ${pct(m.priceCAGR)}. Cash-flow IRR ${pct(m.cashIRR)}. Reinvested CAGR ${pct(m.reinvestedCAGR)}.`; }, 350);
  }
}

$('model-fields').disabled = false;
for (const button of document.querySelectorAll('[data-preset], #reset-model, #print-report')) button.disabled = false;
$('assumptions').addEventListener('submit', event => event.preventDefault());
$('assumptions').addEventListener('input', event => { lockField(event.target.name); update(); });
$('reset-model').addEventListener('click', () => { indexOverrides.delete(selectedIndexId); writeInputs(sourceFollowing && selectedIndex()?.forwardPE != null ? sourceInputs(selectedIndex(), DEFAULTS) : DEFAULTS); update(); });
for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => {
  if (button.dataset.preset === 'compression') { writeInputs(DEFAULTS); for (const key of ['entryPE','exitPE','dividendMode','payout','dividendYield']) lockField(key); }
  if (button.dataset.preset === 'constant') { $('exitPE').value = $('entryPE').value; lockField('exitPE'); }
  if (button.dataset.preset === 'zero') { $('dividendMode').value = 'payout'; $('payout').value = 0; lockField('dividendMode'); lockField('payout'); }
  update();
});
$('sensitivity-body').addEventListener('click', event => {
  const button = event.target.closest('button[data-growth]');
  if (!button) return;
  const { growth, pe } = button.dataset;
  $('growth').value = growth; $('exitPE').value = pe; update();
  lockField('exitPE'); renderScenarioContext();
  // Preserve keyboard focus after replacing the table's content.
  $('sensitivity-body').querySelector(`button[data-growth="${growth}"][data-pe="${pe}"]`)?.focus({ preventScroll: true });
});
$('download-csv').addEventListener('click', () => {
  if (!activeModel) return;
  const blob = new Blob([annualCSV(activeModel)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = `tickerlantern-${selectedIndexId}-scenario-cash-flows.csv`; anchor.click();
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
for (const key of ['entryPE','exitPE']) { $(key).min = BOUNDS[key][0]; $(key).max = BOUNDS[key][1]; }
loadIndexData();
