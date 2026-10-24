import { DEFAULTS, BOUNDS, project, sensitivity, sensitivityAxes, validate, annualCSV } from './model.js';
import { validateFeed, isStale, premium, isDatedMean, historyCoverage, browserCheckOverdue } from './index-data.js';

import { scenarioInputs, switchScenario, restoreSourceLocks, presetScenario, fieldBasis, loadScenarios, saveScenarios } from './scenario-state.js';
import { sourceGrowthPath, growthCoverage, growthIsStale, nextForecastYear } from './growth-data.js';
import { fiveYearGrowthPath, HOLDING_YEARS } from './five-year-growth.js';
import { baselineForecast, baselineAssessment, fiveYearCSV } from './five-year-report.js';
import { calibratedPayout, payoutProvenance } from './dividend-policy.js';
import { historicalAssessment, canCompareHistory, eligibleExitMean, valuationReference, valuationReferenceLabel, sourceExitPE, exitMetricProvenance, metricDisplay, metricDateBasis } from './valuation-policy.js';
import { assertSnapshotAdvance } from './snapshot-client.js';
import { updateHealth, checkTime, metricStatusText, metricDisclosure, metricProvenance } from './update-status.js';

document.documentElement.classList.add('js-enabled');
const $ = id => document.getElementById(id);
const pct = v => `${(v * 100).toFixed(2)}%`;
const n = v => v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const short = v => v.toLocaleString('en-US', { maximumFractionDigits: 1 });
const rateLabel = v => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
const chartNumber = v => Math.abs(v) >= 10000 ? v.toLocaleString('en-US', { notation:'compact', maximumFractionDigits:1 }) : short(v);
const signed = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svgText = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
const inputKeys = Object.keys(BOUNDS);
let activeModel = null, announceTimer, gridAxes = sensitivityAxes(DEFAULTS);
const savedAxes = new Map();
const editableKeys = [...inputKeys, 'growthMode', 'dividendMode', 'dividendYield'];
let browserStorage;
try { browserStorage = window.localStorage; } catch { /* Session-only editing remains available. */ }
const stored = loadScenarios(browserStorage);
let indexFeed = null, selectedIndexId = new URL(location.href).searchParams.get('index') || stored.selectedIndexId, sourceFollowing = stored.following, updateInProgress = false;
const indexOverrides = stored.overrides, savedScenarios = stored.scenarios;
let annualGrowth = [], growthStartYear = null, growthOverrides = {}, growthPlan = [], dividendPolicyVersion = "", growthPolicyVersion = "";
const selectedIndex = () => indexFeed?.indices.find(row => row.id === selectedIndexId);
const readInputs = () => ({ ...Object.fromEntries(editableKeys.map(key => [key, $(key).value])), growthStartYear, growthOverrides:{...growthOverrides}, growthPlan, annualGrowth: [...annualGrowth], years:HOLDING_YEARS, dividendPolicyVersion, growthPolicyVersion });
function writeInputs(values) {
  for (const key of editableKeys) if (values[key] != null) $(key).value = values[key];
  $('years').value = HOLDING_YEARS;
  growthPlan = values.growthPlan || [];
  dividendPolicyVersion=values.dividendPolicyVersion || '';
  growthPolicyVersion=values.growthPolicyVersion || '';
  annualGrowth = [...(values.annualGrowth || [])];
  growthStartYear = values.growthStartYear ?? null;
  growthOverrides = {...(values.growthOverrides || {})};
  renderGrowthEditor();
}
function lockField(key) { if ([...editableKeys, 'annualGrowth'].includes(key)) indexOverrides.set(selectedIndexId, { ...(indexOverrides.get(selectedIndexId) || {}), [key]: true }); }
function rememberScenario() {
  savedScenarios.set(selectedIndexId, readInputs());
  const saved = saveScenarios(browserStorage, { scenarios: savedScenarios, overrides: indexOverrides, selectedIndexId, following: sourceFollowing });
  $('scenario-save-status').textContent = saved ? 'Saved in this browser · each benchmark keeps its own assumptions. Other devices and browsers have separate settings.' : 'Settings are kept for this visit only; browser storage is unavailable.';
}
function renderGrowthEditor() {
  $('years').value = HOLDING_YEARS;
  const sourced = $('growthMode').value === 'source', annual = $('growthMode').value !== 'constant', years = HOLDING_YEARS;
  const path = fiveYearGrowthPath(selectedIndex(), new Date(), growthOverrides);
  $('annual-growth-panel').hidden = !annual;
  const forecast = selectedIndex()?.growthForecast;
  $('scenario-growth-source').innerHTML = forecast ? `<strong>${sourced?(path.sourceLinked?'Published forecast + long-term projection':path.bridge?'Calendar-to-forward model · source-informed':'Normalized EPS scenario · editorial assumption'):(forecast.forecastType==='house'?'Available house forecast':'Available consensus estimates')}</strong><span>${escape(forecast.source.publisher)} · ${metricDateBasis(selectedIndex(),'growthForecast').toLowerCase()} ${dateLabel(forecast.asOf)} · <a href="${escape(forecast.source.url)}" target="_blank" rel="noopener noreferrer">Source ↗</a></span><small class="metric-check-disclosure">${escape(metricDisclosure(selectedIndex(),'growthForecast'))}</small><small>${sourced?(path.sourceLinked?'Each published forecast applies to its named year and retains its original period label. Missing years use the long-term EPS projection below.':'Published figures remain reference observations. Every holding-year rate below is a model assumption or calculation.'):'Manual growth mode is active. The published estimates are reference only.'}</small>` : path.sourceLinked ? '<strong>Long-term EPS projection</strong><small>No annual forecast connected; each year uses the long-term projection below.</small>' : 'No verified yearly EPS forecast connected. Enter your own assumptions.';
  if (path.longTerm) $('scenario-growth-source').innerHTML += `<small><strong>Long-term EPS projection · ${path.longTerm.growth}%</strong> ${escape(path.longTerm.publisher)} · assumptions as of ${dateLabel(path.longTerm.asOf)} · ${escape(path.longTerm.benchmark)} basis. ${escape(path.longTerm.formula)}. <a href="${escape(path.longTerm.url)}" target="_blank" rel="noopener noreferrer">Long-term source ↗</a></small>`;
  $('growth').closest('.field').hidden = sourced;
  $('fill-annual-growth').hidden = sourced;
  $('annual-growth-heading-text').textContent = sourced ? 'Five-year EPS growth path' : 'Your yearly EPS path';
  $('annual-growth-explanation').textContent = sourced ? `${path.mappingReason} Scenario valuation recorded ${dateLabel(path.scenarioDate)}. ${path.sourceLinked ? 'Growth follows new published estimates when available.' : path.bridge ? 'Uniform annual earnings accrual is assumed; the recorded date is a timing proxy where the exact observation date is undisclosed.' : `Normalized EPS growth is ${path.anchor?.growth ?? 'unavailable'}% each year, an editorial assumption.`} Edit any year to protect your assumption.` : 'Set a separate EPS growth rate for each of the five holding years.';
  if (sourced && !sourceFollowing) $('annual-growth-explanation').textContent = 'Source following is paused. The five saved annual assumptions are kept. Restore the five-year model to resume updates.';
  $('restore-growth-years').hidden = !sourced;
  $('growth-label').textContent = annual ? 'Rate to apply to all five years' : 'Annual EPS growth';
  $('growth-help').textContent = annual ? 'Edit each year below, or apply this rate to all five years.' : 'One rate for every year of this benchmark’s scenario.';
  if (!annual || !Number.isInteger(years) || years < 1 || years > 20) return;
  if (sourced && sourceFollowing) {
    annualGrowth = path.rates; growthStartYear = path.startYear; growthPlan = path.points;
  }
  if (!sourced || !sourceFollowing) growthPlan = [];
  while (annualGrowth.length < years) annualGrowth.push(sourced ? path.rates[annualGrowth.length] : $('growth').value);
  const editor = $('annual-growth-inputs');
  if (editor.children.length !== years) editor.innerHTML = Array.from({ length: years }, (_, i) => `<div class="annual-growth-field"><label for="growth-year-${i + 1}"></label><div class="input-wrap"><input id="growth-year-${i + 1}" name="annualGrowth" data-growth-year="${i}" type="number" min="${BOUNDS.growth[0]}" max="${BOUNDS.growth[1]}" step="any" required aria-describedby="annualGrowth-error"><span>%</span></div></div>`).join('');
  for (const input of editor.querySelectorAll('[data-growth-year]')) {
    const i = +input.dataset.growthYear;
    input.readOnly = false;
    input.placeholder = sourced ? 'Enter assumption' : '';
    const point = path.points[i];
    const custom = sourced && Object.hasOwn(growthOverrides,growthStartYear+i);
    input.closest('.annual-growth-field').querySelector('label').textContent = sourced ? `Year ${i+1}${!sourceFollowing ? ' · saved assumption' : custom ? ' · your assumption' : path.sourceLinked ? (point.sourceEvidence.publishedForYear ? point.sourceEvidence.forecastType==='house' ? ' · house forecast' : ' · published forecast' : ' · long-term projection') : path.bridge ? ' · timing model' : ' · normalized assumption'}` : `Year ${i + 1} EPS growth`;
    if (input !== document.activeElement || sourced && !custom) input.value = annualGrowth[i];
  }
}

function renderGrowthForecast(row) {
  const forecast = row.growthForecast, path = sourceGrowthPath(row, 1);
  $('use-source-growth').disabled = !fiveYearGrowthPath(row).anchor && !path.coveredYears;
  $('growth-forecast-body').innerHTML = forecast?.estimates?.length ? forecast.estimates.map(point => `<tr><th scope="row">${escape(point.periodLabel || point.year + ' estimate')}</th><td>${rateLabel(point.growth)}%</td></tr>`).join('') : '<tr><td colspan="2">No verified annual earnings-growth forecast is connected for this exact benchmark.</td></tr>';
  $('growth-forecast-status').textContent = forecast?.estimates?.length ? `${forecast.forecastType === 'house' ? 'Publisher house forecast' : 'Published consensus estimates'} · ${metricDateBasis(row,'growthForecast').toLowerCase()} ${dateLabel(forecast.asOf)}${metricStatusText(row,'growthForecast') ? ' · '+metricStatusText(row,'growthForecast') : ''}` : 'Annual growth evidence unavailable';
  $('growth-forecast-method').textContent = forecast ? `${forecast.method} ${forecast.sync?.status === 'retained' ? 'The latest source check failed; the last verified estimates and dates are retained. ' : ''}${path.coveredYears ? `Published future coverage: ${path.startYear}–${path.startYear + path.coveredYears - 1}.` : `No published ${nextForecastYear()} estimate is connected.`}` : 'No exact-benchmark annual earnings forecast is connected. The five-year model identifies its sourced long-term market or regional proxy separately.';
  const link = $('growth-forecast-source');
  link.hidden = !forecast?.source?.url;
  if (forecast?.source?.url) { link.href = forecast.source.url; link.textContent = `${forecast.source.publisher}${forecast.source.page ? ` · PDF page ${forecast.source.page}` : ''} ↗`; }
  $('growth-check-date').textContent = metricDisclosure(row,'growthForecast') || (forecast?.source?.checkedAt ? `Last successful validation ${checkTime(forecast.source.checkedAt)}` : 'Source coverage is checked daily.');
}


function chartWidth(id) { return window.matchMedia('print').matches ? 700 : Math.max(240, Math.min(700, $(id).clientWidth || 700)); }

function axisStep(span) {
  const raw = Math.max(span, .01) / 4;
  const base = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].find(x => x * base >= raw) * base;
}

function wealthChart(model) {
  const width = chartWidth('wealth-chart'), height = width < 480 ? 285 : 310, left = 44, right = 68, top = 26, bottom = 38;
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
    parts.push(svgText(left - 10, y(value) + 4, chartNumber(value), 'fill="#556779" font-size="12" text-anchor="end"'));
  }
  const ticks = Math.min(model.input.years, Math.max(2,Math.floor(plotW/55)));
  const tickYears = [...new Set(Array.from({length:ticks+1},(_,i)=>Math.round(model.input.years*i/ticks)))];
  for (const year of tickYears) parts.push(svgText(x(year), height - 16, year === 0 ? 'Entry' : `Yr ${year}`, 'fill="#556779" font-size="12" text-anchor="middle"'));
  const series = [{ key: 'price', color: '#526c83', dash: '', width: 2 }, { key: 'cashWealth', color: '#396f9e', dash: '6 4', width: 2 }, { key: 'reinvestedWealth', color: '#087f76', dash: '', width: 3 }];
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
    parts.push(svgText(width - right + 17, line.labelY + 4, chartNumber(line.value), `fill="${line.color}" font-size="13" font-weight="600"`));
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
  const available = chartWidth('waterfall-chart');
  if (available < 480) {
    const width = available, height = 340, left = 115, right = 68, top = 25, rowH = 56;
    const max = Math.max(...bars.flatMap(bar=>[bar.from,bar.to])) * 1.1;
    const x = value => left + (width-left-right) * value/max;
    const labels = ['Starting wealth','Earnings growth','P/E change','Cash dividends','Terminal + cash'];
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="waterfall-title waterfall-desc"><title id="waterfall-title">Terminal wealth attribution in indexed units</title><desc id="waterfall-desc">Initial 100. Earnings contribution ${signed(model.epsGain)}. Valuation contribution ${signed(model.multipleImpact)}. Dividends ${n(last.cumulativeDividend)}. Terminal price plus cash ${n(last.cashWealth)}.</desc>`;
    bars.forEach((bar,i)=>{const y=top+i*rowH;
      svg += svgText(0,y+18,labels[i],'fill="#475d70" font-size="12"');
      svg += `<rect x="${x(Math.min(bar.from,bar.to))}" y="${y}" width="${Math.max(1,Math.abs(x(bar.to)-x(bar.from)))}" height="26" fill="${bar.color}" rx="2"/>`;
      const label = Math.abs(bar.value) >= 10000 ? `${!bar.total && bar.value >= 0 ? '+' : ''}${chartNumber(bar.value)}` : bar.total ? n(bar.value) : signed(bar.value);
      svg += svgText(width-1,y+18,label,`fill="${bar.color}" font-size="12" font-weight="600" text-anchor="end"`);
      if(i<bars.length-1)svg+=`<line x1="${x(bar.to)}" x2="${x(bar.to)}" y1="${y+27}" y2="${y+rowH}" stroke="#9badbd" stroke-dasharray="3 3"/>`;
    });
    svg += svgText(left,height-7,'Indexed units · initial 100','fill="#475d70" font-size="12"');
    $('waterfall-chart').innerHTML=svg+'</svg>';return;
  }
  const width = 700, height = 350, top = 40, bottom = 62, left = 45, plotW = 635;
  const max = Math.max(...bars.flatMap(b => [b.from, b.to]));
  const step = axisStep(max), high = Math.ceil(max * 1.15 / step) * step;
  const y = v => top + (height - top - bottom) * (high - v) / high;
  const column = plotW / bars.length, barW = column * .58;
  const parts = [`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="waterfall-title waterfall-desc"><title id="waterfall-title">Terminal wealth attribution</title><desc id="waterfall-desc">Initial 100, earnings contribution ${signed(model.epsGain)}, valuation contribution ${signed(model.multipleImpact)}, cash dividends ${n(last.cumulativeDividend)}, terminal price plus cash ${n(last.cashWealth)}.</desc>`];
  for (let v = 0; v <= high; v += step) {
    parts.push(`<line x1="${left}" x2="${width - 20}" y1="${y(v)}" y2="${y(v)}" stroke="#dce5ed"/>`);
    parts.push(svgText(left - 10, y(v) + 4, short(v), 'fill="#556779" font-size="12" text-anchor="end"'));
  }
  bars.forEach((bar, i) => {
    const x = left + column * i + (column - barW) / 2;
    const rectY = y(Math.max(bar.from, bar.to)), rectH = Math.max(1, Math.abs(y(bar.from) - y(bar.to)));
    parts.push(`<rect x="${x}" y="${rectY}" width="${barW}" height="${rectH}" fill="${bar.color}" rx="2"/>`);
    parts.push(svgText(x + barW / 2, rectY - 11, bar.total ? n(bar.value) : signed(bar.value), `fill="${bar.color}" font-size="12" font-weight="600" text-anchor="middle"`));
    if (i < bars.length - 1) parts.push(`<line x1="${x + barW}" x2="${x + column}" y1="${y(bar.to)}" y2="${y(bar.to)}" stroke="#a4b6c6" stroke-dasharray="3 3"/>`);
    bar.label.forEach((label, j) => parts.push(svgText(x + barW / 2, height - 38 + j * 15, label, 'fill="#556779" font-size="13" text-anchor="middle"')));
  });
  parts.push('</svg>');
  $('waterfall-chart').innerHTML = parts.join('');
}

function sensitivityTable(model) {
  const grid = sensitivity(model.input, gridAxes);
  $('sensitivity-table').querySelector('thead').innerHTML = `<tr><th scope="col">EPS growth</th>${grid.multiples.map(pe => `<th scope="col">${peLabel(pe)}<small>${pe === model.input.entryPE ? 'Unchanged' : `${signed((pe / model.input.entryPE - 1) * 100)}%`}</small></th>`).join('')}</tr>`;
  const heat = value => value < -.02 ? 0 : value < 0 ? 1 : value < .03 ? 2 : value < .06 ? 3 : value < .09 ? 4 : 5;
  $('sensitivity-body').innerHTML = grid.rows.map((row, i) => `<tr><th scope="row">${n(grid.growths[i])}%</th>${row.map((value, j) => `<td class="heat-${heat(value)}"><button type="button" data-growth="${grid.growths[i]}" data-pe="${grid.multiples[j]}" aria-pressed="${model.input.growthMode === 'constant' && model.input.growth === grid.growths[i] && model.input.exitPE === grid.multiples[j]}" aria-label="Constant EPS growth ${n(grid.growths[i])} percent, exit P/E ${n(grid.multiples[j])} times: cash-flow IRR ${pct(value)}">${pct(value)}</button></td>`).join('')}</tr>`).join('');
  const onGrid = model.input.growthMode === 'constant' && grid.growths.includes(model.input.growth) && grid.multiples.includes(model.input.exitPE);
  $('sensitivity-active').textContent = model.input.growthMode !== 'constant' ? `${model.input.growthMode === 'source' ? 'Five-year model path' : 'Yearly EPS path'} active: equivalent EPS CAGR ${pct(model.epsCAGR)}. This path is off the constant-rate grid; no cell is selected.` : onGrid ? `✓ Active case: ${n(model.input.growth)}% growth, ${peLabel(model.input.exitPE)} exit. The outlined cell matches the model.` : `Active case is off this grid: ${n(model.input.growth)}% growth, ${peLabel(model.input.exitPE)} exit. No cell is selected.`;
  $('sensitivity-badge').textContent = `${model.input.years}-year holding period`;
  const dividendBasis = model.input.dividendMode === 'yield' ? `initial yield ${n(model.input.dividendYield)}%` : `payout ${n(model.input.payout)}%`;
  $('sensitivity-note').textContent = `Entry P/E ${n(model.input.entryPE)}×, ${dividendBasis}, holding period ${model.input.years} years. Cells use one EPS growth rate in every year and vary exit P/E. Selecting a cell loads that constant-rate case; your yearly path is kept for switching back. The grid stays fixed during cell selection; editing entry P/E or growth creates a new range. These are scenarios, not probabilities.`;
}

function annualTable(model) {
  $('annual-data-body').innerHTML = model.points.map(p => `<tr><th scope="row">${p.year === 0 ? 'Entry' : model.input.growthMode === 'source' ? `${p.year} · ${model.input.growthStartYear + p.year - 1}<small>${escape(model.input.growthPlan?.[p.year-1]?.basis || 'custom assumption')}</small>` : p.year}</th><td>${p.year === 0 ? '—' : rateLabel(p.growth) + '%'}</td><td>${n(p.eps)}</td><td>${n(p.pe)}×</td><td>${n(p.price)}</td><td>${n(p.dividend)}</td><td>${n(p.cashWealth)}</td><td>${n(p.reinvestedWealth)}</td></tr>`).join('');
}

const dateLabel = value => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: value.includes('T') ? 'America/Vancouver' : 'UTC' }) : 'Not connected';
const peLabel = value => value == null ? '—' : n(value) + '×';

function renderIndexList() {
  if (!indexFeed) return;
  const focused = document.activeElement;
  const focusedId = focused?.dataset.index;
  const focusedContainer = focused?.closest('#index-list, #index-comparison-body')?.id;
  const query = $('index-search').value.trim().toLowerCase(), region = $('index-region').value;
  const rows = indexFeed.indices.filter(row => (region === 'all' || row.region === region) && `${row.name} ${row.region} ${row.description}`.toLowerCase().includes(query));
  $('index-list').innerHTML = rows.map(row => `<button type="button" class="index-choice" data-index="${row.id}" aria-pressed="${row.id === selectedIndexId}"><span>${escape(row.name)}<small>${escape(row.region)}${isStale(row) ? ' · retained' : ''}</small></span><strong>${metricDisplay(row,'forwardPE')}</strong></button>`).join('');
  $('index-empty').hidden = rows.length > 0;
  $('index-comparison-body').innerHTML = indexFeed.indices.map(row => `<tr${row.id === selectedIndexId ? ' class="selected-index-row"' : ''}><th scope="row"><button type="button" data-index="${row.id}" aria-pressed="${row.id === selectedIndexId}">${escape(row.name)}</button></th><td>${metricDisplay(row,'forwardPE')}</td><td>${metricDisplay(row,'mean10YearForwardPE')}${row.meanAsOf ? `<small>${dateLabel(row.meanAsOf)}${isDatedMean(row) ? ' · dated reference' : ''}</small>` : ''}</td><td>${metricDisplay(row,'dividendYield')}</td><td>${row.growthForecast?.estimates.map(p => `${escape(p.periodLabel || p.year)}: ${rateLabel(p.growth)}%`).join('<br>') || '—'}${row.growthForecast ? `<small>${row.growthForecast.forecastType === 'house' ? 'House forecast' : 'Consensus'} · ${dateLabel(row.growthForecast.asOf)}${metricStatusText(row,'growthForecast') ? ' · '+escape(metricStatusText(row,'growthForecast')) : ''}</small>` : ''}</td><td>${dateLabel(row.asOf)}${isStale(row) ? ' · retained' : ''}</td></tr>`).join('');
  $('five-year-comparison-body').innerHTML = indexFeed.indices.map(row => {
    const assessment=baselineAssessment(row), model=assessment.model, path=fiveYearGrowthPath(row);
    return `<tr><th scope="row"><button type="button" data-index="${row.id}">${escape(row.name)}</button><small>Valuation · ${dateLabel(row.asOf)}</small><small>${escape(path.sourceLinked?'Published forecast + long-term projection':path.bridge?'Modeled timing bridge':'Editorial EPS scenario')}${growthIsStale(row) ? ' · reference warning' : ''}${!model?' · cash return unavailable':''}</small><small>Exit basis · ${escape(valuationReferenceLabel(valuationReference(row,model?.input || {})))}</small></th>${path.points.map(p=>`<td>${p.growth===''||p.growth==null?'—':rateLabel(p.growth)+'%'}<small>${p.year} · ${escape(p.basis)}</small></td>`).join('')}<td>${metricDisplay(row,'dividendYield')}<small>${dateLabel(row.yieldAsOf)}${row.id==='stoxx600'?' · net spread, reference only':''}</small></td><td>${model ? rateLabel(model.input.payout)+'%' : '—'}</td><td>${model ? pct(model.epsCAGR) : '—'}</td><td>${model ? pct(model.cashIRR) : '—'}</td><td>${model ? n(model.last.cashWealth) : '—'}</td></tr>`;
  }).join('');
  const unavailable=indexFeed.indices.filter(row=>!baselineForecast(row));
  $('five-year-comparison-status').textContent=`${indexFeed.indices.length-unavailable.length} of ${indexFeed.indices.length} cash-return scenarios calculated. ${unavailable.length ? unavailable.map(row=>row.name+': '+baselineAssessment(row).reason).join(' ') : ''} CSV retains every benchmark and labels unavailable rows.`;
  if (focusedContainer && focusedId) $(focusedContainer).querySelector(`button[data-index="${focusedId}"]`)?.focus({preventScroll:true});
}

function indexValuationChart(row) {
  if (!canCompareHistory(row)) {
    $('index-valuation-chart').innerHTML = '<p class="chart-fallback">Direct comparison is withheld. Review the definition assessment under Sources, dates and limitations. The published reference remains visible above.</p>';
    return;
  }
  if (row.forwardPE == null) {
    $('index-valuation-chart').innerHTML = '<p class="chart-fallback">Forward valuation data is not connected for this exact benchmark. Open the provider page below; the scenario controls remain illustrative.</p>';
    return;
  }
  const width = Math.min(430,chartWidth('index-valuation-chart')), height = 156, left = 104, plotW = width - left - 65;
  const max = Math.ceil(Math.max(row.forwardPE, row.mean10YearForwardPE || 0) * 1.2 / 5) * 5;
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="index-chart-title index-chart-desc"><title id="index-chart-title">${escape(row.name)} forward valuation comparison</title><desc id="index-chart-desc">Current ${metricDisplay(row,'forwardPE')}. ${row.mean10YearForwardPE == null ? 'A ten-year average is not available.' : 'Publisher-reported ten-year mean ' + peLabel(row.mean10YearForwardPE) + '.'}</desc>`;
  for (let v = 0; v <= max; v += max / 4) {
    const x = left + plotW * v / max;
    svg += `<line x1="${x}" x2="${x}" y1="20" y2="118" stroke="#dce5ed"/>` + svgText(x, 140, short(v) + '×', 'fill="#556779" font-size="12" text-anchor="middle"');
  }
  for (const [i, label, value, color] of [[0, 'Current', row.forwardPE, '#396f9e'], [1, '10-year mean', row.mean10YearForwardPE, '#087f76']]) {
    const y = 31 + i * 52;
    svg += svgText(left - 12, y + 17, label, 'fill="#556779" font-size="13" text-anchor="end"');
    if (value == null) svg += svgText(left + 8, y + 17, 'Not available', 'fill="#556779" font-size="13"');
    else {
      const barW = plotW * value / max;
      svg += `<rect x="${left}" y="${y}" width="${barW}" height="27" fill="${color}" rx="2"/>` + svgText(left + barW + 9, y + 18, metricDisplay(row,i===0?'forwardPE':'mean10YearForwardPE'), `fill="${color}" font-size="12" font-weight="600"`);
    }
  }
  $('index-valuation-chart').innerHTML = svg + '</svg>';
}

function renderScenarioContext() {
  const row = selectedIndex(), locks = indexOverrides.get(selectedIndexId) || {};
  if (!row) return;
  const name = row?.name || 'Manual scenario';
  $('scenario-index-label').textContent = name;
  $('compact-benchmark').textContent = name;
  $('compact-irr').textContent = activeModel ? pct(activeModel.cashIRR) : 'Fix inputs';
  const protectedCount = Object.keys(locks).length + Object.keys(growthOverrides).length;
  $('scenario-mode-label').textContent = `${row?.forwardPE == null ? 'Manual assumptions · source valuation unavailable' : sourceFollowing ? 'Available source fields follow updates' : 'Source following paused'} · ${protectedCount ? `${protectedCount} edited inputs protected` : $('growthMode').value === 'source' ? 'five-year scenario follows model policy' : 'custom growth assumption'}`;
  const provenance = (key, evidence, date) => `${escape(evidence?.publisher || 'Publisher')} · ${dateLabel(date)}${evidence?.url ? ` · <a href="${escape(evidence.url)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}`;
  for (const key of ['growth','entryPE','exitPE','payout','dividendYield','years']) {
    let basis = fieldBasis(key, row, locks, sourceFollowing);
    if (key==='growth' && $('growthMode').value!=='source' && !locks.growth) basis='default';
    if(key==='growth' && $('growthMode').value==='source' && sourceFollowing)basis='modeled';
    const forecastHorizon = key==='years';
    const label = forecastHorizon ? 'Fixed five-year holding period' : {custom:'Your assumption',manual:'Manual scenario',default:'Model default',calibrated:'Model-implied payout',modeled:'Model growth assumption',forecast:'Published growth estimate',source:'Sourced observation',reference:isDatedMean(row) ? 'Dated historical exit assumption' : 'Historical exit assumption',trailing:'TTM fallback · converted exit',fallback:'Flat-multiple fallback'}[basis];
    let detail = '';
    if (basis === 'source') detail = key === 'dividendYield' ? provenance(key,row.yieldSource || row.source,row.yieldAsOf || row.asOf) : provenance(key,row.source,row.asOf);
    if (basis === 'modeled') detail=fiveYearGrowthPath(row).mappingReason;
    if (basis === 'forecast') detail = provenance(key,row.growthForecast.source,row.growthForecast.asOf);
    if (basis === 'reference') detail = provenance(key,row.meanSource || row.source,row.meanAsOf)+'<br>'+escape(valuationReference(row,readInputs()).qualification);
    if (basis === 'trailing') {const v=valuationReference(row,readInputs());detail=provenance(key,v.source,v.asOf)+`<br>${rateLabel(v.historicalPE)}× TTM mean ÷ (1 + ${rateLabel(v.terminalGrowth)}% final-year growth).`;}
    if (basis === 'fallback') detail = 'No eligible historical default. Exit follows your active entry P/E until you edit the exit; this is an illustrative constant-multiple assumption.';
    if (basis === 'calibrated') detail = `${rateLabel(row.dividendYield)}% dividend anchor × active entry P/E. Ratio of the modeled first dividend to synthetic forward EPS; not a reported payout ratio. ${provenance(key,row.yieldSource || row.source,row.yieldAsOf || row.asOf)}<span class="metric-check-disclosure">${escape(row.metricDefinitions?.dividendYield?.economic?.yieldConstruction || 'Yield construction not disclosed')}. ${escape(row.yieldSource?.frequency || '')}</span>`;
    if (basis === 'default') detail = key === 'growth' ? '6% EPS growth assumption; no forecast connected.' : key === 'years' ? 'Five-year holding period assumption.' : key === 'payout' ? row.id ? 'No eligible cash-dividend anchor is available. A net-return spread cannot substitute for cash yield. Enter an explicit payout or initial-yield assumption.' : '30% teaching-example assumption; no benchmark selected.' : key === 'dividendYield' ? 'No reported yield. Enter your own assumption.' : 'No source valuation. Edit this illustrative assumption.';
    if (basis === 'custom') detail = 'Saved for this benchmark; protected from source updates.';
    if (basis === 'manual') detail = 'Source following is paused. Your current scenario is kept.';
    if (forecastHorizon) detail = 'All benchmarks, charts, sensitivity cases and exports use five years.';
    const metricKey={entryPE:'forwardPE',exitPE:'mean10YearForwardPE',dividendYield:'dividendYield',payout:'dividendYield',growth:'growthForecast'}[key];
    if (metricKey && ['source','reference','forecast','calibrated'].includes(basis)) {
      const disclosure=metricDisclosure(row,metricKey);
      if(disclosure) detail+=`<span class="metric-check-disclosure">${escape(disclosure)}</span>`;
    }
    $(key + '-basis').innerHTML = `<strong class="basis-${basis}">${label}</strong><br>${detail}`;
  }
  if (!activeModel) {
    $('index-model-note').textContent = 'Correct the highlighted assumptions to calculate a return. Source observations remain unchanged.';
    return;
  }
  const { input } = activeModel;
  if (row.forwardPE == null) {
    $('index-model-note').textContent = `No sourced forward valuation is connected for ${row.name}. The model below is a custom illustration, not an estimate of this index’s expected return.`;
    return;
  }
  const entryBasis = sourceFollowing && !locks.entryPE ? 'source' : 'custom';
  const exitBasis = !sourceFollowing || locks.exitPE ? 'custom' : eligibleExitMean(row) ? `historical forward-P/E exit assumption, reported ${dateLabel(row.meanAsOf)}` : valuationReference(row,input).type==='trailing-fallback' ? 'TTM mean converted to the terminal earnings basis' : +input.exitPE === +input.entryPE ? 'illustrative constant P/E; follows active entry' : 'illustrative exit assumption';
  const dividendBasis = input.dividendMode === 'yield' ? `${n(input.dividendYield)}% initial yield${sourceFollowing && !locks.dividendYield && row.dividendYield != null ? ' anchored to the historical source yield' : ' (custom)'}` : `${rateLabel(input.payout)}% ${sourceFollowing && !locks.payout ? 'model-implied payout calibrated to the benchmark dividend anchor' : 'custom payout'}; not a reported payout`;
  const growthBasis = input.growthMode === 'source' ? `yearly growth path [${input.annualGrowth.map((value, i) => `Year ${i+1}: ${rateLabel(value)}%${Object.hasOwn(growthOverrides,input.growthStartYear+i)?' custom':!sourceFollowing?' saved assumption':' '+(growthPlan[i]?.basis || 'model assumption')}`).join(', ')}]; equivalent CAGR ${pct(activeModel.epsCAGR)}` : input.growthMode === 'annual' ? `custom yearly EPS growth [${input.annualGrowth.map(value => rateLabel(value) + '%').join(', ')}]; equivalent CAGR ${pct(activeModel.epsCAGR)}` : `${short(input.growth)}% assumed EPS growth each year`;
  $('index-model-note').textContent = `${row.name} scenario: ${growthBasis}, ${input.years} years; entry ${n(input.entryPE)}× (${entryBasis}), exit ${n(input.exitPE)}× (${exitBasis}); ${dividendBasis}. ${input.growthMode === 'source' ? 'Holding-year rates are model calculations or assumptions; original publisher-period estimates remain separately visible. No claim of matched rolling consensus.' : 'Custom growth rates are your assumptions.'}`;
}

function renderValuationReference(row) {
  const v=valuationReference(row,readInputs()),card=$('valuation-reference-card');
  card.hidden=v.type==='constant-multiple';
  if(card.hidden)return;
  const trailing=v.type==='trailing-fallback',basis=trailing?'TTM':'forward';
  $('valuation-reference-title').textContent=trailing?'TTM fallback valuation':'Historical multiple × current earnings';
  $('valuation-reference-basis').textContent=v.type==='matched-forward'?'Paired forward reference':trailing?'Verified TTM fallback':'Dated / qualified forward reference';
  $('valuation-reference-value').textContent=n(v.normalizedReferenceValue);
  $('valuation-reference-formula').textContent=`${rateLabel(v.historicalPE)}× historical ${basis} P/E × ${v.normalizedCurrentEPS.toFixed(6)} current normalized ${basis} EPS = ${n(v.normalizedReferenceValue)}. Current market value is normalized to 100.`;
  $('valuation-reference-detail').textContent=`Earnings valuation dated ${dateLabel(v.currentAsOf)}; ten-year mean dated ${dateLabel(v.asOf)}. ${v.qualification} ${trailing?'The five-year exit uses projected terminal trailing earnings, rather than holding current EPS fixed.':'The five-year exit applies the historical multiple to projected forward earnings.'}`;
  const source=$('valuation-reference-source');source.href=v.source.url;source.textContent=`${v.source.publisher} · historical source ↗`;
  const current=$('valuation-reference-current-source');current.href=(v.currentSource || row.source).url;current.textContent=`Current ${basis} earnings valuation source ↗`;
}

function renderIndexDetail() {
  const row = selectedIndex();
  if (!row) return;
  renderGrowthForecast(row);
  $('selected-index-region').textContent = row.region;
  $('selected-index-name').textContent = row.name;
  $('selected-index-description').textContent = row.description;
  $('index-current-pe').textContent = metricDisplay(row,'forwardPE');
  $('index-current-date').textContent = row.asOf ? metricDateBasis(row,'forwardPE')+' '+dateLabel(row.asOf)+'. '+metricDisclosure(row,'forwardPE') : 'No connected forward valuation';
  $('index-mean-pe').textContent = metricDisplay(row,'mean10YearForwardPE');
  $('index-mean-date').textContent = row.meanAsOf ? (isDatedMean(row) ? 'Dated reference · ' : 'Reported ') + dateLabel(row.meanAsOf)+'. '+metricDisclosure(row,'mean10YearForwardPE') : 'Verified 10-year mean unavailable';
  $('index-yield').textContent = metricDisplay(row,'dividendYield');
  $('index-yield-label').textContent=row.id==='stoxx600'?'Net return-spread reference':'Dividend yield';
  $('index-yield-note').textContent = row.dividendYield == null ? 'Not connected for this benchmark' : (row.id==='stoxx600'?'Reference only; not a cash dividend anchor · ':'Historical yield · ') + dateLabel(row.yieldAsOf || row.asOf)+'. '+metricDisclosure(row,'dividendYield');
  const gap = premium(row);
  $('index-premium').textContent = gap == null ? '—' : `${gap >= 0 ? '+' : '−'}${Math.abs(gap * 100).toFixed(2)}%`;
  $('index-premium-label').textContent = gap == null ? 'Historical comparison' : isDatedMean(row) ? 'Relative to the dated 10-year reference' : 'Relative to the published 10-year mean';
  const assessment = historicalAssessment(row);
  $('index-premium').closest('.valuation-view').hidden = !canCompareHistory(row);
  $('index-premium-note').textContent = gap == null ? `${assessment.outcome === 'insufficient' ? 'Insufficient comparison evidence' : 'Qualified historical reference'}. ${assessment.reasons[0] || ''} A direct premium/discount statistic is not shown. The dated mean may still be used as an explicit historical exit assumption.` : `The current multiple is ${gap >= 0 ? 'above' : 'below'} its assessed comparable reference. Its reference date is ${dateLabel(row.meanAsOf)}; undisclosed window endpoints and sampling remain unknown. This is not fair value or an expected return.`;
  renderValuationReference(row);
  const stale = isStale(row);
  $('selected-data-badge').textContent = row.forwardPE == null ? 'Valuation not connected' : stale ? 'Retained observation' : 'Sourced observation';
  $('selected-data-badge').classList.toggle('retained-badge', stale || row.forwardPE == null);
  const source = row.source, url = source?.url || row.profileUrl;
  const evidenceLink = (label, evidence, date) => `<span>${escape(label)} — ${escape(evidence?.publisher || 'Benchmark provider')}${date ? ' · ' + dateLabel(date) : ''}${evidence?.page ? ' · PDF page ' + evidence.page : ''} · <a href="${escape(evidence?.url || row.profileUrl)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></span>`;
  $('index-source-line').innerHTML = evidenceLink('Forward P/E', source, row.asOf) + (row.mean10YearForwardPE != null ? evidenceLink('10-year reference', row.meanSource || source, row.meanAsOf) : '') + (row.dividendYield != null && row.yieldSource?.url !== source?.url ? evidenceLink('Dividend yield', row.yieldSource || source, row.yieldAsOf || row.asOf) : '');
  const historicalNote = row.mean10YearForwardPE == null ? 'No verified 10-year mean is connected. The illustrative exit follows the active entry P/E until edited.' : `${isDatedMean(row) ? `Dated historical reference, reported ${dateLabel(row.meanAsOf)}. This is not presented as the latest rolling 10-year average. ` : ''}${row.meanMethod.replace(/\.\s*$/, '')}. ${assessment.reasons.join(' ')} ${metricStatusText(row,'mean10YearForwardPE')}`;
  const browserEvidence = [source, row.meanSource].find(evidence => evidence?.transport === 'scheduled-browser');
  const browserNote = browserEvidence ? ` Daily browser source check: last verified ${dateLabel(browserEvidence.checkedAt)}. This check requires the owner’s Mac and Codex to be available; missed checks are flagged after 48 hours.` : '';
  const horizon=row.metricDefinitions?.forwardPE?.economic?.horizon;
  $('index-evidence-note').textContent = row.forwardPE == null ? 'No validated forward valuation is connected for this exact benchmark; no different index or ETF is substituted.' : `${horizon==='rolling-12m'?'Rolling next-twelve-month earnings denominator':horizon==='forward-unspecified'?'Forward earnings horizon not disclosed':'Synthetic scenario use; exact earnings-period mapping is qualified'}. ${metricStatusText(row,'forwardPE')}. ${historicalNote}${browserNote}`;
  $('restore-source').disabled = row.forwardPE == null;
  indexValuationChart(row);
  renderScenarioContext();
}

function applySourceValues({ restore = false } = {}) {
  const row = selectedIndex();
  if (!row) return;
  if (restore) {
    indexOverrides.set(row.id, restoreSourceLocks(indexOverrides.get(row.id)));
    sourceFollowing = true; $('follow-source').checked = true;
  }
  const previous = readInputs(), next = scenarioInputs(row, previous, indexOverrides.get(row.id) || {}, sourceFollowing);
  writeInputs(next);
  update({ announce: false, reanchor: next.growthMode === 'source' && JSON.stringify(previous.annualGrowth) !== JSON.stringify(next.annualGrowth) });
}

function selectIndex(id) {
  if (!indexFeed?.indices.some(row => row.id === id)) return;
  savedScenarios.set(selectedIndexId, readInputs()); savedAxes.set(selectedIndexId, gridAxes);
  const hasSaved = savedScenarios.has(id);
  selectedIndexId = id;
  writeInputs(switchScenario(selectedIndex(), savedScenarios.get(id), indexOverrides.get(id), sourceFollowing));
  gridAxes = savedAxes.get(id) || gridAxes;
  update({ reanchor: !savedAxes.has(id) }); renderIndexList(); renderIndexDetail();
  const url = new URL(location.href); url.searchParams.set('index', id); history.replaceState(null, '', url);
  $('selection-context').textContent = `${selectedIndex().name} selected. Each benchmark keeps its own growth path, horizon and other assumptions. ${hasSaved ? 'This benchmark’s saved edits are restored.' : 'Valuation and dividend inputs start from this benchmark’s available sources or labelled defaults.'}`;
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
      const fallback = await fetch('/data/indices.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!fallback.ok) throw new Error('Snapshot unavailable');
      feed = { ...validateFeed(await fallback.json()), transport: 'bundled-fallback' };
    }
    assertSnapshotAdvance(indexFeed, feed);
    const firstLoad = !indexFeed;
    indexFeed = feed;
    if (firstLoad) {
      if (!feed.indices.some(row => row.id === selectedIndexId)) selectedIndexId = 'sp500';
      writeInputs(switchScenario(selectedIndex(), savedScenarios.get(selectedIndexId), indexOverrides.get(selectedIndexId), sourceFollowing));
    }
    const observed = feed.indices.filter(row => row.forwardPE != null).length;
    $('coverage-count').textContent = `${observed} of ${feed.indices.length} benchmarks have sourced forward P/E`;
    $('data-check-date').textContent = 'Valuation checks: ' + checkTime(feed.sourceCheckAt);
    $('history-coverage').textContent = historyCoverage(feed);
    $('growth-coverage').textContent = growthCoverage(feed);
    const health = updateHealth(feed);
    $('source-snapshot-status').textContent = `${feed.snapshotId ? `Snapshot ${feed.snapshotVersion} · ${feed.snapshotId.slice(0,12)}` : 'Legacy snapshot'} · published ${checkTime(feed.publishedAt)}. EPS checks: ${checkTime(feed.growthCheckAt)}. ${health.message} Loading a snapshot does not contact publishers. Scheduled execution: ${checkTime(feed.lastScheduledCheckAt)}.`;
    applySourceValues(); renderIndexList(); renderIndexDetail();
    $('index-update-status').textContent = feed.transport === 'bundled-fallback' ? 'Showing the validated bundled snapshot. The latest published feed could not be reached; source dates have not been advanced.' : feed.transport === 'bundled-newer' ? 'Showing the newer validated snapshot included with this report while the published feed cache catches up. Source dates and custom assumptions remain protected.' : 'Latest published snapshot loaded. Publisher checks occur separately; your edited assumptions remain protected.';
  } catch {
    $('index-update-status').textContent = indexFeed ? 'The update check failed. Previously loaded observations and your scenario are retained.' : 'Source data could not load. The manual scenario uses labelled model defaults; enter your own assumptions or check again.';
  } finally { updateInProgress = false; $('check-data').disabled = false; }
}

$('index-search').addEventListener('input', renderIndexList);
$('index-region').addEventListener('change', renderIndexList);
for (const container of [$('index-list'), $('index-comparison-body'), $('five-year-comparison-body')]) container.addEventListener('click', event => {
  const button = event.target.closest('button[data-index]'); if (!button) return;
  selectIndex(button.dataset.index);
  container.querySelector(`button[data-index="${selectedIndexId}"]`)?.focus({ preventScroll: true });
});
$('follow-source').addEventListener('change', () => { sourceFollowing = $('follow-source').checked; if (sourceFollowing) applySourceValues(); rememberScenario(); renderScenarioContext(); });
$('restore-source').addEventListener('click', () => { applySourceValues({ restore: true }); renderIndexDetail(); $('selection-context').textContent = 'Source valuations restored. Your growth mode and any custom yearly rates remain selected.'; });
$('check-data').addEventListener('click', () => loadIndexData({ manual: true }));
$('restore-dividends').addEventListener('click',()=>{
  const locks={...(indexOverrides.get(selectedIndexId)||{})};
  for(const key of ['payout','dividendMode','dividendYield']) delete locks[key];
  indexOverrides.set(selectedIndexId,locks); sourceFollowing=true; $('follow-source').checked=true;
  applySourceValues();renderIndexDetail();
  $('model-status').textContent='Benchmark dividend defaults restored; source following resumed. Protected growth and valuation edits kept.';
});
$('use-source-growth').addEventListener('click', () => {
  const locks = { ...(indexOverrides.get(selectedIndexId) || {}) };
  for (const key of ['growth', 'growthMode', 'annualGrowth', 'years']) delete locks[key];
  indexOverrides.set(selectedIndexId, locks);
  growthOverrides = {};
  sourceFollowing = true; $('follow-source').checked = true;
  applySourceValues(); renderIndexDetail();
  $('index-update-status').textContent = 'Published forecasts loaded for their named years; missing years use this benchmark’s sourced long-term EPS projection.';
});
$('restore-growth-years').addEventListener('click', () => {
  growthOverrides = {};
  sourceFollowing = true; $('follow-source').checked = true;
  update({reanchor:true});
});
setInterval(() => { if (document.visibilityState === 'visible') loadIndexData(); }, 300000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadIndexData(); });

function update({ announce = true, reanchor = false } = {}) {
  clearTimeout(announceTimer);
  if (selectedIndex() && sourceFollowing && !indexOverrides.get(selectedIndexId)?.payout) $('payout').value = calibratedPayout(selectedIndex(),$('entryPE').value);
  renderGrowthEditor();
  if (selectedIndex() && sourceFollowing && !indexOverrides.get(selectedIndexId)?.exitPE) $('exitPE').value = sourceExitPE(selectedIndex(),+$('entryPE').value,readInputs());
  if(selectedIndex()) renderValuationReference(selectedIndex());
  const input = readInputs();
  $('payout-field').hidden = input.dividendMode === 'yield';
  $('dividend-yield-field').hidden = input.dividendMode !== 'yield';
  const errors = validate(input), invalid = Object.keys(errors).length > 0;
  for (const key of editableKeys) {
    $(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    $(key + '-error').textContent = errors[key] || '';
  }
  $('annualGrowth-error').textContent = errors.annualGrowth || '';
  for (const input of $('annual-growth-inputs').querySelectorAll('[data-growth-year]')) {
    const value = annualGrowth[+input.dataset.growthYear];
    input.setAttribute('aria-invalid', value === '' || value == null || !Number.isFinite(+value) || +value < BOUNDS.growth[0] || +value > BOUNDS.growth[1] ? 'true' : 'false');
  }
  rememberScenario();
  $('model-error').hidden = !invalid;
  $('valid-output').hidden = invalid;
  $('download-csv').disabled = invalid;
  if (invalid) {
    activeModel = null;
    $('model-status').textContent = 'Scenario incomplete. Correct the highlighted assumptions; results are hidden.';
    $('model-error').textContent = 'Update the highlighted assumptions to calculate a return. Results and charts are hidden until the inputs are valid.';
    $('waterfall-chart').innerHTML = '<p class="chart-fallback">Correct the scenario inputs to see the return bridge.</p>';
    $('sensitivity-body').innerHTML = '<tr><td colspan="6">Correct the scenario inputs to calculate sensitivity.</td></tr>';
    $('annual-data-body').innerHTML = '<tr><td colspan="8">Correct the scenario inputs to view annual data.</td></tr>';
    $('annual-growth-summary').textContent = 'Complete the highlighted yearly rates to calculate this path.';
    $('sensitivity-badge').textContent = 'Inputs required';
    $('sensitivity-active').textContent = 'No active sensitivity case while inputs are invalid.';
    $('sensitivity-note').textContent = 'No sensitivity results are shown while the scenario inputs are invalid.';
    renderScenarioContext();
    return;
  }
  if (reanchor || gridAxes.entryAnchor !== +input.entryPE) gridAxes = sensitivityAxes(input);
  activeModel = project(input);
  const m = activeModel;
  $('price-cagr').textContent = pct(m.priceCAGR);
  $('cash-irr').textContent = pct(m.cashIRR);
  $('reinvest-cagr').textContent = pct(m.reinvestedCAGR);
  $('wealth-subtitle').textContent = `${m.input.years}-year wealth paths · before tax and costs`;
  wealthChart(m); waterfall(m); sensitivityTable(m); annualTable(m);
  const multipleText = m.input.exitPE < m.input.entryPE ? 'a lower exit P/E reduces price appreciation' : m.input.exitPE > m.input.entryPE ? 'a higher exit P/E amplifies price appreciation' : 'an unchanged P/E lets the price track EPS growth';
  const payoutText = m.last.cumulativeDividend === 0 ? 'With no dividends, all three annualized return measures coincide.' : `Cash dividends total ${n(m.last.cumulativeDividend)} per original unit; investor cash-flow IRR is ${pct(m.cashIRR)}.`;
  const growthDescription = m.input.growthMode !== 'constant' ? `Your yearly EPS path compounds at ${pct(m.epsCAGR)} a year overall` : `At ${short(m.input.growth)}% annual EPS growth`;
  $('model-takeaway').textContent = `${growthDescription}, ${multipleText}. ${payoutText}`;
  $('annual-growth-summary').textContent = `Equivalent EPS CAGR: ${pct(m.epsCAGR)} · ${m.input.growthMode === 'source' ? 'published inputs + labelled model estimates; compounded over five years' : 'years compound in the order shown'}.`;
  renderScenarioContext();
  if (!announce) $('model-status').textContent = `Five-year scenario ready. Price CAGR ${pct(m.priceCAGR)}. Cash-flow IRR ${pct(m.cashIRR)}.`;
  if (announce) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { $('model-status').textContent = `Scenario updated. Price CAGR ${pct(m.priceCAGR)}. Cash-flow IRR ${pct(m.cashIRR)}. Reinvested CAGR ${pct(m.reinvestedCAGR)}.`; }, 350);
  }
}

$('model-fields').disabled = false;
for (const button of document.querySelectorAll('[data-preset], #reset-model, #print-report')) button.disabled = false;
$('assumptions').addEventListener('submit', event => event.preventDefault());
$('assumptions').addEventListener('input', event => {
  if (event.target.matches('select')) return;
  if (event.target.matches('[data-growth-year]')) {
    const i=+event.target.dataset.growthYear;
    annualGrowth[i] = event.target.value;
    if ($('growthMode').value === 'source') growthOverrides[growthStartYear+i] = event.target.value;
  }
  if (!(event.target.name === 'annualGrowth' && $('growthMode').value === 'source')) lockField(event.target.name);
  update({reanchor:['growth','growthMode','annualGrowth'].includes(event.target.name)});
});
$('assumptions').addEventListener('change', event => {
  if (!event.target.matches('select')) return;
  $('years').value = HOLDING_YEARS;
  lockField(event.target.name); update({reanchor:['growth','growthMode','annualGrowth'].includes(event.target.name)});
});
$('fill-annual-growth').addEventListener('click', () => {
  if (!Number.isInteger(+$('years').value) || +$('years').value < 1 || +$('years').value > 20) return;
  annualGrowth = Array.from({ length: +$('years').value }, () => $('growth').value);
  lockField('annualGrowth'); update({reanchor:true});
});

$('reset-model').addEventListener('click', () => {
  indexOverrides.delete(selectedIndexId);
  sourceFollowing = true; $('follow-source').checked = true;
  writeInputs(scenarioInputs(selectedIndex(), DEFAULTS)); update({reanchor:true});
  $('selection-context').textContent = 'Current scenario reset to source valuations, available yield and a complete five-year scenario. Other saved benchmarks are kept.';
});
for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => {
  if (!activeModel) { $('model-status').textContent = 'Correct the invalid assumptions before applying a preset.'; return; }
  const preset = presetScenario(readInputs(), button.dataset.preset);
  writeInputs(preset.values); preset.locks.forEach(lockField); update();
});
$('sensitivity-body').addEventListener('click', event => {
  const button = event.target.closest('button[data-growth]');
  if (!button) return;
  const { growth, pe } = button.dataset;
  $('growthMode').value = 'constant'; $('growth').value = growth; $('exitPE').value = pe;
  for (const key of ['growthMode','growth','exitPE']) lockField(key); update();
  // Preserve keyboard focus after replacing the table's content.
  $('sensitivity-body').querySelector(`button[data-growth="${growth}"][data-pe="${pe}"]`)?.focus({ preventScroll: true });
});
$('download-five-year').addEventListener('click', () => {
  if (!indexFeed) return;
  const url=URL.createObjectURL(new Blob([fiveYearCSV(indexFeed)],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a'); anchor.href=url; anchor.download='tickerlantern-all-indices-five-year-forecasts.csv'; anchor.hidden=true;
  document.body.append(anchor); anchor.click();
  setTimeout(()=>{URL.revokeObjectURL(url);anchor.remove();},1500);
  $('model-status').textContent='Five-year cash flows for all 21 benchmarks prepared for download.';
});
$('download-csv').addEventListener('click', () => {
  if (!activeModel) return;
  const row = selectedIndex();
  const locks=indexOverrides.get(selectedIndexId) || {};
  const evaluatedAt=new Date();
  const context={benchmarkId:selectedIndexId,snapshotId:indexFeed?.snapshotId,snapshotVersion:indexFeed?.snapshotVersion,publishedAt:indexFeed?.publishedAt,sourceFollowing,healthEvaluatedAt:evaluatedAt.toISOString(),
    entryMetric:sourceFollowing && !locks.entryPE ? metricProvenance(row,'forwardPE',evaluatedAt) : {classification:'user-assumption',value:activeModel.input.entryPE,units:'times'},
    exitMetric:exitMetricProvenance(row,activeModel.input,sourceFollowing,locks),
    yieldMetric:activeModel.input.dividendMode!=='yield'?null:sourceFollowing && !locks.dividendYield && row?.dividendYield != null ? metricProvenance(row,'dividendYield',evaluatedAt) : {classification:'user-assumption',value:activeModel.input.dividendYield,units:'percent'},
    growthMetric:sourceFollowing?metricProvenance(row,'growthForecast',evaluatedAt):null,payoutMetric:payoutProvenance(row,activeModel.input,locks,sourceFollowing,evaluatedAt),fieldOverrides:locks};
  const blob = new Blob([annualCSV(activeModel, sourceFollowing ? row?.growthForecast : undefined, context)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = `tickerlantern-${selectedIndexId}-scenario-cash-flows.csv`; anchor.hidden = true;
  document.body.append(anchor); anchor.click();
  setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1500);
  $('model-status').textContent = 'Illustrative annual cash-flow CSV prepared for download.';
});
let detailsState = [];
window.addEventListener('beforeprint', () => { detailsState = Array.from(document.querySelectorAll('details'), detail => [detail, detail.open]); for (const [detail] of detailsState) detail.open = true; });
window.addEventListener('afterprint', () => { for (const [detail, open] of detailsState) detail.open = open; });
for (const button of document.querySelectorAll('#print-report, [data-print]')) button.addEventListener('click', () => window.print());
function revealAnchor() { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target?.tagName === 'DETAILS') target.open = true; }
window.addEventListener('hashchange', revealAnchor);
revealAnchor();
writeInputs({ ...DEFAULTS, ...(savedScenarios.get(selectedIndexId) || {}) });
$('follow-source').checked = sourceFollowing;
update({ announce: false, reanchor: true });
for (const key of ['growth','entryPE','exitPE']) { $(key).min = BOUNDS[key][0]; $(key).max = BOUNDS[key][1]; }
loadIndexData();

let lastChartSizes = '', chartFrame;
const chartObserver = new ResizeObserver(() => {
  const sizes = ['wealth-chart','waterfall-chart','index-valuation-chart'].map(id=>$(id).clientWidth).join(',');
  if(sizes === lastChartSizes) return; lastChartSizes = sizes;
  cancelAnimationFrame(chartFrame); chartFrame = requestAnimationFrame(()=>{ if(activeModel){wealthChart(activeModel);waterfall(activeModel);} if(selectedIndex())indexValuationChart(selectedIndex()); });
});
for(const id of ['wealth-chart','waterfall-chart','index-valuation-chart']) chartObserver.observe($(id));
