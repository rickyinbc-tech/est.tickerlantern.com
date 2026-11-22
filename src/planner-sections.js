// Interactive figures for the planner toolkit. Each figure has defaults, input
// limits and a render() that returns chart SVG, a one-sentence summary and a
// data table. The build calls render() with the defaults; the browser calls it
// again after every input change, so both always show the same markup.
import { CPI, cpiEquivalent, cpiAnnualRate, realValue, growthSchedule, recoveryGain, recoveryYears, outcomeBands, equalWeightVolatility, twoAssetMix, regularPurchases, bcMarginalRates, creditZones, gicVsFund, breakEvenFundReturn, portfolioStats, annualizedRange, normCdf } from './planner-math.js';
import { lineChart, barChart, rowChart, legend, dataTable } from './planner-charts.js';
import { STRINGS } from './planner-strings.js';
import { FUND_SAMPLE } from './planner-fund-sample.js';

export const CPI_LAST = 2025;

export const LANGS = ['en', 'zh'];
const LOCALE = { en: 'en-CA', zh: 'zh-CN' };

export function formatters(lang = 'en') {
  const locale = LOCALE[lang] || LOCALE.en;
  // Canadian dollars shown as "$" in both languages; Chinese uses 万 for compact axis labels.
  const cur = { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' };
  const money = new Intl.NumberFormat(locale, { ...cur, maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat(locale, cur);
  const compact = new Intl.NumberFormat(locale, { ...cur, notation: 'compact', maximumFractionDigits: 1 });
  const ordinal = n => lang === 'zh' ? String(n) : n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || 'th');
  return {
    cents: v => cents.format(v),
    money: v => money.format(Math.round(v) === 0 ? 0 : v),
    axisMoney: v => Math.abs(v) >= 10000 ? compact.format(v) : money.format(v),
    pct: (v, d = 1) => (v * 100).toFixed(d).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1').replace(/^-/, '−') + '%',
    fixed: (v, d = 1) => v.toFixed(d).replace(/^-/, '−') + '%',
    num: (v, d = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(v),
    year: v => String(v),
    ordinal
  };
}

const fill = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
export const translate = (key, vars, lang = 'en') => {
  const s = STRINGS[lang]?.[key];
  if (s == null) throw new Error(`Missing planner string (${lang}): ${key}`);
  return fill(s, vars);
};
// "1 year" / "5 years"; Chinese has no plural.
const span = (t, n) => t(n === 1 ? 'span.one' : 'span.other', { n });
// Headline figures shown above a summary; the summary sentence still states each of them.
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stats = (cap, items) => `<p class="pc-stats-cap">${esc(cap)}</p><dl class="pc-stats">${items.map(([k, v, key]) => `<div${key ? ` class="pc-stat--${key}"` : ''}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
const pick = (rows, every) => rows.filter((r, i) => i % every === 0 || i === rows.length - 1);
const PRESETS = { cautious: { median: 4, sigma: 6 }, balanced: { median: 5, sigma: 10 }, growth: { median: 6.5, sigma: 15 } };

// Hypothetical asset-class assumptions (annual, in Canadian dollars, before tax
// and costs). They are rounded teaching inputs, not forecasts, not historical
// returns and not data for any index or fund. Order matches `keys`.
export const ASSETS = {
  keys: ['cash', 'gov', 'hy', 'cdn', 'us', 'intl', 'em'],
  means: [0.025, 0.035, 0.055, 0.065, 0.07, 0.065, 0.075],
  vols: [0.01, 0.06, 0.10, 0.15, 0.16, 0.16, 0.22],
  corr: [
    [1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0.3, 0.1, 0.1, 0.1, 0.1],
    [0, 0.3, 1, 0.6, 0.6, 0.6, 0.6],
    [0, 0.1, 0.6, 1, 0.7, 0.65, 0.65],
    [0, 0.1, 0.6, 0.7, 1, 0.75, 0.65],
    [0, 0.1, 0.6, 0.65, 0.75, 1, 0.75],
    [0, 0.1, 0.6, 0.65, 0.65, 0.75, 1]
  ],
  // Hypothetical balanced portfolio: 40% bonds, 60% equities.
  weights: [0, 0.40, 0, 0.20, 0.25, 0.10, 0.05]
};
export const assetStats = () => portfolioStats(ASSETS.weights, ASSETS.means, ASSETS.vols, ASSETS.corr);

// Hypothetical one-year returns (%) for stylized situations, in ASSETS order.
// Invented to show how a blend behaves; not any actual year.
export const SCENARIOS = {
  ratesUp: [2, -11, -9, -6, -12, -8, -14],
  equityBear: [3, 8, -6, -12, -18, -15, -20],
  usLed: [4, 2, 7, 10, 25, 12, 8],
  cadUp: [3, 4, 5, 9, -2, -3, 0],
  commodity: [4, -12, 1, 12, -10, -8, -5]
};
/** Asset returns for a scenario plus the balanced portfolio's weighted return. */
export function scenarioReturns(name) {
  const v = SCENARIOS[name], rows = ASSETS.keys.map((k, i) => ({ k, value: v[i] }));
  return [...rows, { k: 'bal', value: +ASSETS.weights.reduce((sum, w, i) => sum + w * v[i], 0).toFixed(2) }];
}

export const FIGURES = {
  inflation: {
    inputs: { amount: [1000, 1, 10000000], from: [2005, 1990, CPI_LAST - 1], region: ['canada', ['canada', 'bc']] },
    render(s, t, f) {
      const pts = [];
      for (let y = s.from; y <= CPI_LAST; y++) pts.push([y, cpiEquivalent(s.amount, s.from, y, s.region)]);
      const end = pts.at(-1)[1], rate = cpiAnnualRate(s.from, CPI_LAST, s.region), region = t('region.' + s.region);
      const vars = { amount: f.money(s.amount), from: s.from, to: CPI_LAST, end: f.money(end), more: f.pct(end / s.amount - 1, 0), rate: f.pct(rate, 2), region };
      return {
        chart: lineChart({ id: 'fig-inflation', title: t('inflation.title', vars), desc: t('inflation.summary', vars), series: [{ key: 'a', name: t('inflation.series'), points: pts, kind: 'area' }], xFormat: f.year, yFormat: f.axisMoney, yLabel: t('axis.dollars'), refLines: [{ y: s.amount, label: t('inflation.ref', vars) }] }),
        legend: legend([{ key: 'a', name: t('inflation.series') }]),
        summary: t('inflation.summary', vars),
        table: dataTable({ caption: t('inflation.table', vars), head: [t('col.year'), t('col.cpi'), t('col.needed')], rows: pick(pts, 5).map(([y, v]) => [String(y), f.num(CPI[s.region][y]), f.money(v)]) })
      };
    }
  },
  cash: {
    inputs: { cash: [10000, 1, 10000000], rate: [1.5, -5, 15], infl: [2, -2, 15], years: [10, 1, 50] },
    render(s, t, f) {
      const pts = [], real = [];
      for (let y = 0; y <= s.years; y++) { const nom = s.cash * (1 + s.rate / 100) ** y; pts.push([y, nom]); real.push([y, realValue(nom, s.infl / 100, y)]); }
      const vars = { cash: f.money(s.cash), span: span(t, s.years), nominal: f.money(pts.at(-1)[1]), real: f.money(real.at(-1)[1]), rate: f.pct(s.rate / 100), infl: f.pct(s.infl / 100) };
      return {
        chart: lineChart({ id: 'fig-cash', title: t('cash.title'), desc: t('cash.summary', vars), series: [{ key: 'a', name: t('cash.nominal'), points: pts }, { key: 'b', name: t('cash.real'), points: real, kind: 'dash' }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years'), refLines: [{ y: s.cash, label: t('cash.ref') }] }),
        legend: legend([{ key: 'a', name: t('cash.nominal') }, { key: 'b', name: t('cash.real'), dash: true }]),
        summary: t('cash.summary', vars),
        table: dataTable({ caption: t('cash.title'), head: [t('col.year'), t('cash.nominal'), t('cash.real')], rows: pick(pts, Math.max(1, Math.round(s.years / 5))).map(([y, v]) => [String(y), f.money(v), f.money(real[y][1])]) })
      };
    }
  },
  contributions: {
    inputs: { monthly: [250, 1, 100000], rate: [5, -5, 15], years: [20, 1, 50] },
    render(s, t, f) {
      const rows = growthSchedule({ monthly: s.monthly, annualRate: s.rate / 100, years: s.years }), last = rows.at(-1);
      const vars = { monthly: f.money(s.monthly), span: span(t, s.years), value: f.money(last.value), contributed: f.money(last.contributed), growth: f.money(last.growth), share: f.pct(last.value > 0 ? Math.max(0, last.growth) / last.value : 0, 0), rate: f.pct(s.rate / 100) };
      return {
        chart: lineChart({ id: 'fig-contributions', title: t('pac.title'), desc: t('pac.summary', vars), series: [{ key: 'b', name: t('pac.contributed'), points: rows.map(x => [x.year, x.contributed]), kind: 'area' }, { key: 'a', name: t('pac.value'), points: rows.map(x => [x.year, x.value]) }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years') }),
        legend: legend([{ key: 'a', name: t('pac.value') }, { key: 'b', name: t('pac.contributed') }]),
        summary: t('pac.summary', vars),
        table: dataTable({ caption: t('pac.title'), head: [t('col.year'), t('pac.contributed'), t('pac.growth'), t('pac.value')], rows: pick(rows, Math.max(1, Math.round(s.years / 5))).map(x => [String(x.year), f.money(x.contributed), f.money(x.growth), f.money(x.value)]) })
      };
    }
  },
  dca: {
    // A deliberately invented price path: it falls and recovers to where it began.
    inputs: { amount: [200, 1, 100000] },
    prices: [10, 9, 7, 6, 7, 9, 10],
    render(s, t, f) {
      const p = this.prices, r = regularPurchases(p, s.amount), cents = { format: f.cents };
      const vars = { amount: f.money(s.amount), invested: f.money(r.invested), end: f.money(r.endValue), avgCost: cents.format(r.averageCost), avgPrice: cents.format(r.averagePrice), first: cents.format(p[0]), last: cents.format(p.at(-1)) };
      return {
        chart: barChart({ id: 'fig-dca', title: t('dca.title'), desc: t('dca.summary', vars), categories: p.map((_, i) => t('dca.month', { n: i + 1 })), series: [{ key: 'a', name: t('dca.units'), values: r.units.map(u => +u.toFixed(1)) }], yFormat: v => f.num(v), yLabel: t('dca.units'), height: 300 }),
        legend: legend([{ key: 'a', name: t('dca.units') }]),
        summary: t('dca.summary', vars),
        table: dataTable({ caption: t('dca.title'), head: [t('dca.monthCol'), t('dca.price'), t('dca.units')], rows: p.map((price, i) => [t('dca.month', { n: i + 1 }), cents.format(price), f.num(r.units[i], 2)]) })
      };
    }
  },
  volatility: {
    inputs: { preset: ['balanced', ['cautious', 'balanced', 'growth']], amount: [10000, 1, 10000000], years: [15, 1, 40] },
    render(s, t, f) {
      const { median, sigma } = PRESETS[s.preset], b = outcomeBands({ median: median / 100, sigma: sigma / 100, years: s.years });
      const at = k => b.map(x => [x.year, x[k] * s.amount]), end = b.at(-1);
      const vars = { span: span(t, s.years), amount: f.money(s.amount), mid: f.money(end.p50 * s.amount), lo: f.money(end.p10 * s.amount), hi: f.money(end.p90 * s.amount), loss: f.pct(end.lossChance, 0), median: f.pct(median / 100), sigma: f.pct(sigma / 100, 0), mix: t('preset.' + s.preset) };
      return {
        chart: lineChart({ id: 'fig-volatility', title: t('vol.title', vars), desc: t('vol.summary', vars), bands: [{ key: 'outer', lower: at('p10'), upper: at('p90') }, { key: 'inner', lower: at('p25'), upper: at('p75') }], series: [{ key: 'a', name: t('vol.median'), points: at('p50') }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years'), refLines: [{ y: s.amount, label: t('vol.start') }] }),
        legend: legend([{ key: 'a', name: t('vol.median') }, { key: 'inner', name: t('vol.inner') }, { key: 'outer', name: t('vol.outer') }]),
        summary: t('vol.summary', vars),
        assumptions: t('vol.assumptions', vars),
        table: dataTable({ caption: t('vol.title', vars), head: [t('col.year'), t('vol.p10'), t('vol.median'), t('vol.p90'), t('vol.lossCol')], rows: pick(b, Math.max(1, Math.round(s.years / 6))).map(x => [String(x.year), f.money(x.p10 * s.amount), f.money(x.p50 * s.amount), f.money(x.p90 * s.amount), f.pct(x.lossChance, 0)]) })
      };
    }
  },
  recovery: {
    inputs: { drop: [30, 1, 80], ret: [6, 0.5, 15] },
    render(s, t, f) {
      const drops = [10, 20, 30, 40, 50, 60], g = recoveryGain(s.drop / 100), yrs = recoveryYears(s.drop / 100, s.ret / 100);
      const vars = { drop: f.pct(s.drop / 100, 0), gain: f.pct(g), ret: f.pct(s.ret / 100), years: f.num(yrs, 1) };
      return {
        chart: barChart({ id: 'fig-recovery', title: t('rec.title'), desc: t('rec.summary', vars), categories: drops.map(d => t('rec.cat', { d })), series: [{ key: 'b', name: t('rec.gain'), values: drops.map(d => +(recoveryGain(d / 100) * 100).toFixed(1)) }], yFormat: v => f.num(v, 0) + '%', yLabel: t('rec.gain'), height: 300 }),
        legend: legend([{ key: 'b', name: t('rec.gain') }]),
        summary: t('rec.summary', vars),
        table: dataTable({ caption: t('rec.title'), head: [t('rec.dropCol'), t('rec.gain'), t('rec.yearsCol', vars)], rows: drops.map(d => [t('rec.cat', { d }), f.pct(recoveryGain(d / 100)), f.num(recoveryYears(d / 100, s.ret / 100), 1)]) })
      };
    }
  },
  diversification: {
    inputs: { sigma: [30, 5, 80], rho: [0.3, 0, 1], n: [20, 1, 50] },
    render(s, t, f) {
      const sig = s.sigma / 100, pts = Array.from({ length: 50 }, (_, i) => [i + 1, equalWeightVolatility(i + 1, sig, s.rho) * 100]);
      const now = equalWeightVolatility(s.n, sig, s.rho), floor = sig * Math.sqrt(s.rho);
      const vars = { n: s.n, vol: f.pct(now), one: f.pct(sig, 0), floor: f.pct(floor), rho: f.num(s.rho, 2) };
      return {
        chart: lineChart({ id: 'fig-diversification', title: t('div.title'), desc: t('div.summary', vars), series: [{ key: 'a', name: t('div.series'), points: pts }], markers: [{ x: s.n, y: now * 100, label: t('div.marker', vars) }], refLines: [{ y: floor * 100, label: t('div.floor', vars) }], xFormat: v => String(v), yFormat: v => f.num(v, 0) + '%', xLabel: t('div.x'), yLabel: t('div.y'), xTickEvery: 7, unit: 'pct', xKind: 'count' }),
        legend: legend([{ key: 'a', name: t('div.series') }]),
        summary: t('div.summary', vars),
        table: dataTable({ caption: t('div.title'), head: [t('div.x'), t('div.y')], rows: [1, 2, 5, 10, 20, 30, 50].map(n => [String(n), f.pct(equalWeightVolatility(n, sig, s.rho))]) })
      };
    }
  },
  mix: {
    inputs: { equity: [60, 0, 100] },
    assets: { equity: { ret: .065, vol: .16 }, bonds: { ret: .035, vol: .06 }, rho: .2 },
    render(s, t, f) {
      const a = this.assets, pts = Array.from({ length: 21 }, (_, i) => { const m = twoAssetMix(i / 20, a.equity, a.bonds, a.rho); return [m.vol * 100, m.ret * 100]; });
      const cur = twoAssetMix(s.equity / 100, a.equity, a.bonds, a.rho);
      const vars = { equity: s.equity, bonds: 100 - s.equity, ret: f.pct(cur.ret), vol: f.pct(cur.vol) };
      return {
        chart: lineChart({ id: 'fig-mix', title: t('mix.title'), desc: t('mix.summary', vars), series: [{ key: 'b', name: t('mix.series'), points: pts }], markers: [{ x: cur.vol * 100, y: cur.ret * 100, label: t('mix.marker', vars) }], xFormat: v => f.num(v, 0) + '%', yFormat: v => f.num(v, 1) + '%', xLabel: t('mix.x'), yLabel: t('mix.y'), xTickEvery: 2, unit: 'none', xKind: 'none' }),
        legend: legend([{ key: 'b', name: t('mix.series') }]),
        summary: t('mix.summary', vars),
        table: dataTable({ caption: t('mix.title'), head: [t('mix.equityCol'), t('mix.y'), t('mix.x')], rows: [0, 20, 40, 60, 80, 100].map(w => { const m = twoAssetMix(w / 100, a.equity, a.bonds, a.rho); return [w + '%', f.pct(m.ret), f.pct(m.vol)]; }) })
      };
    }
  },
  hypoReturns: {
    // Invented year-by-year returns for a hypothetical balanced fund. They are
    // teaching numbers, not data for any real fund or index.
    inputs: {},
    returns: [10, -7, 15, 8, -3, 16, 6, 11, -10, 13],
    render(s, t, f) {
      const vals = this.returns, cats = vals.map((_, i) => t('hypo.year', { n: i + 1 })), down = vals.filter(v => v < 0).length;
      const vars = { down, n: vals.length, best: f.fixed(Math.max(...vals), 0), worst: f.fixed(Math.min(...vals), 0) };
      return {
        chart: barChart({ id: 'fig-hypoReturns', title: t('hypo.returnsTitle'), desc: t('hypo.returnsSummary', vars), categories: cats, shortCategories: vals.map((_, i) => t('hypo.short', { n: i + 1 })), series: [{ key: 'a', name: t('hypo.returnCol'), values: vals }], yFormat: v => f.fixed(v, 0), yLabel: t('hypo.returnCol'), height: 300 }),
        legend: '',
        summary: t('hypo.returnsSummary', vars),
        table: dataTable({ caption: t('hypo.returnsTitle'), head: [t('hypo.yearCol'), t('hypo.returnCol')], rows: vals.map((v, i) => [cats[i], f.fixed(v, 0)]) })
      };
    }
  },
  hypoPath: {
    inputs: { amount: [10000, 1, 10000000] },
    render(s, t, f) {
      // The invented returns are already net of expenses.
      const r = FIGURES.hypoReturns.returns;
      let v = s.amount; const bumpy = [[0, v]];
      r.forEach((x, i) => { v *= 1 + x / 100; bumpy.push([i + 1, v]); });
      const avg = (v / s.amount) ** (1 / r.length) - 1, smooth = bumpy.map(([y]) => [y, s.amount * (1 + avg) ** y]);
      const low = bumpy.reduce((m, p) => Math.min(m, p[1]), Infinity);
      const vars = { amount: f.money(s.amount), end: f.money(v), avg: f.pct(avg, 1), low: f.money(low) };
      return {
        chart: lineChart({ id: 'fig-hypoPath', title: t('hypo.pathTitle'), desc: t('hypo.pathSummary', vars), series: [{ key: 'a', name: t('hypo.bumpy'), points: bumpy }, { key: 'b', name: t('hypo.smooth', vars), points: smooth, kind: 'dash' }], xFormat: y => y === 0 ? t('hypo.start') : t('hypo.short', { n: y }), yFormat: f.axisMoney, xLabel: t('hypo.yearsLabel'), refLines: [{ y: s.amount, label: t('hypo.invested') }] }),
        legend: legend([{ key: 'a', name: t('hypo.bumpy') }, { key: 'b', name: t('hypo.smooth', vars), dash: true }]),
        summary: t('hypo.pathSummary', vars),
        table: dataTable({ caption: t('hypo.pathTitle'), head: [t('hypo.yearCol'), t('hypo.bumpy'), t('hypo.smooth', vars)], rows: bumpy.map(([y, val], i) => [y === 0 ? t('hypo.start') : t('hypo.year', { n: y }), f.money(val), f.money(smooth[i][1])]) })
      };
    }
  }
,
  assetRange: {
    inputs: { years: [1, 1, 20] },
    render(s, t, f) {
      const A = ASSETS, stats = assetStats(), rows = [...A.keys.map((k, i) => ({ k, mean: A.means[i], vol: A.vols[i] })), { k: 'bal', mean: stats.mean, vol: stats.vol }];
      const ranged = rows.map(r => ({ ...r, ...annualizedRange(r.mean, r.vol, s.years) }));
      const bal = ranged.at(-1), loss = normCdf(-bal.mean * Math.sqrt(s.years) / bal.vol);
      const lossNote = s.years === 1 ? t('asset.rangeLoss1', { loss: f.pct(loss, 0) }) : loss >= 0.005 ? t('asset.rangeLossN', { loss: f.pct(loss, 0), span: span(t, s.years) }) : t('asset.rangeLoss0', { span: span(t, s.years) });
      const vars = { span: span(t, s.years), lo: f.pct(bal.low), hi: f.pct(bal.high), lossNote };
      return {
        chart: rowChart({ id: 'fig-assetRange', title: t('asset.rangeTitle', vars), desc: t('asset.rangeSummary', vars), rows: ranged.map(r => ({ label: t('asset.' + r.k), lo: r.low * 100, hi: r.high * 100, mid: r.mean * 100, highlight: r.k === 'bal' })), format: v => f.fixed(v, 0) }),
        legend: legend([{ key: 'rangeBar', name: t('asset.legendRange') }, { key: 'rangeDot', name: t('asset.legendMean') }]),
        summary: t('asset.rangeSummary', vars),
        table: dataTable({ caption: t('asset.rangeTable', vars), head: [t('asset.colAsset'), t('asset.colWeight'), t('asset.colMean'), t('asset.colVol'), t('asset.colLow'), t('asset.colHigh')], rows: ranged.map((r, i) => [t('asset.' + r.k), r.k === 'bal' ? '100%' : f.pct(A.weights[i], 0), f.pct(r.mean), f.pct(r.vol, 1), f.pct(r.low), f.pct(r.high)]) })
      };
    }
  },
  assetScenario: {
    inputs: { scenario: ['ratesUp', Object.keys(SCENARIOS)] },
    render(s, t, f) {
      const r = scenarioReturns(s.scenario), name = t('scen.' + s.scenario);
      const sorted = [...r].sort((a, b) => b.value - a.value), rank = sorted.findIndex(x => x.k === 'bal') + 1, bal = r.find(x => x.k === 'bal').value, cash = r.find(x => x.k === 'cash').value;
      const vars = { scenario: name, bal: f.fixed(bal, 1), rank: f.ordinal(rank), n: r.length, cash: f.fixed(cash, 1), lossNote: bal < 0 ? t('asset.scenLoss') : t('asset.scenGain'), cashNote: cash > bal ? t('asset.scenBelowCash', { cash: f.fixed(cash, 1) }) : t('asset.scenAboveCash') };
      return {
        chart: rowChart({ id: 'fig-assetScenario', title: t('asset.scenTitle', vars), desc: t('asset.scenSummary', vars), rows: sorted.map(x => ({ label: t('asset.' + x.k), value: x.value, highlight: x.k === 'bal' })), format: v => f.fixed(v, 1), tickFormat: v => f.fixed(v, 0) }),
        legend: '',
        summary: t('asset.scenSummary', vars),
        table: dataTable({ caption: t('asset.scenTable', vars), head: [t('asset.colRank'), t('asset.colAsset'), t('asset.colReturn')], rows: sorted.map((x, i) => [String(i + 1), t('asset.' + x.k), f.fixed(x.value, 1)]) })
      };
    }
  },
  gic: {
    inputs: { account: ['nonreg', ['nonreg', 'tfsa', 'rrsp']], amount: [50000, 1, 10000000], income: [100000, 0, 2000000], withdraw: [30, 0, 54], years: [10, 1, 30], term: [5, 1, 5], gicRate: [3.25, 0, 10], renewRate: [3.25, 0, 10], fundReturn: [FUND_SAMPLE.tenYearPct, -10, 12], sale: ['sell', ['sell', 'hold']], fi: [1, 0, 6], fd: [0.8, 0, 5], ff: [0.6, 0, 5], fg: [1, 0, 8] },
    render(s, t, f) {
      const rates = bcMarginalRates(s.income), pc = v => v / 100, acct = s.account, nonreg = acct === 'nonreg', rrsp = acct === 'rrsp';
      const income = pc(s.fi + s.fd + s.ff + s.fg), fundAt = total => ({ interest: pc(s.fi), dividends: pc(s.fd), foreign: pc(s.ff), realized: pc(s.fg), growth: total - income });
      const args = { amount: s.amount, years: s.years, gicRate: pc(s.gicRate), renewalRate: pc(s.renewRate), term: s.term, account: acct, rates, withdrawalRate: pc(s.withdraw), sellAtEnd: s.sale === 'sell' };
      // Lower and higher fund returns: the 8-in-10 range of the average yearly return over the period,
      // using the hypothetical balanced portfolio's assumed volatility from the asset-class section.
      const range = annualizedRange(pc(s.fundReturn), assetStats().vol, s.years), lo = Math.max(-0.5, range.low), hi = range.high;
      const r = gicVsFund({ ...args, fund: fundAt(pc(s.fundReturn)) }), rLo = gicVsFund({ ...args, fund: fundAt(lo) }), rHi = gicVsFund({ ...args, fund: fundAt(hi) });
      // RRSP/RRIF: compare balances before withdrawal tax (the contribution was deducted); other accounts: value after any tax.
      const val = (x, k) => rrsp ? x[k + 'Balance'] : x[k === 'gic' ? 'gicAfterTax' : 'fundAfterTax'];
      const rowVal = (x, k) => rrsp ? x[k + 'Balance'] : x[k];
      const diff = val(r, 'fund') - val(r, 'gic');
      const be = breakEvenFundReturn({ ...args, fund: fundAt(pc(s.fundReturn)) }), account = t('acct.' + acct), accountIn = t('acctIn.' + acct);
      const rv = { ordinary: f.pct(rates.ordinary), eligible: f.pct(rates.eligible), cg: f.pct(rates.capitalGains), withdraw: f.pct(pc(s.withdraw), 0), unrealized: f.money(r.unrealized) };
      const why = t(nonreg ? (s.sale === 'sell' ? 'gic.why.nonreg' : 'gic.why.nonregHold') : 'gic.why.' + acct, rv);
      const winner = Math.abs(diff) < Math.max(1, s.amount * 0.001) ? t('gic.ahead.tie') : t(diff > 0 ? 'gic.ahead.fund' : 'gic.ahead.gic', { diff: f.money(Math.abs(diff)) });
      const cautions = [...(nonreg ? creditZones([[s.income, s.income]]).map(z => t('caution.' + z)) : []), ...(r.gicBalance > 100000 ? [t('caution.cdic', { bal: f.money(r.gicBalance) })] : [])];
      const nextMat = Math.ceil(s.years / s.term) * s.term, termSpan = t('span.adj', { n: s.term });
      const timing = s.years % s.term ? t('gic.timing', { years: s.years, next: nextMat }) : '';
      const vars = { caution: cautions.length ? cautions.join(' ') + ' ' : '', span: span(t, s.years), account, accountIn, amount: f.money(s.amount), gic: f.money(val(r, 'gic')), fund: f.money(val(r, 'fund')), basis: t('gic.basisShort.' + acct), winner, why, timing,
        lo: f.pct(lo), hi: f.pct(hi), fundLo: f.money(val(rLo, 'fund')), fundHi: f.money(val(rHi, 'fund')), breakeven: be == null ? '' : t('gic.breakeven', { rate: f.pct(be, 2) }),
        sample: s.fundReturn === FUND_SAMPLE.tenYearPct ? t('gic.sampleUsed', { ret: f.pct(pc(s.fundReturn)) }) : t('gic.sampleChanged', { ret: f.pct(pc(s.fundReturn)) }) };
      const tx = r.tax, notes = [];
      notes.push(t(s.years > s.term ? 'gic.termNote.renew' : 'gic.termNote', { termSpan, renew: f.pct(pc(s.renewRate), 2) }));
      if (nonreg) notes.push(t('gic.payNote'));
      if (rrsp) notes.push(t('gic.rrspNote', { amount: vars.amount, withdraw: rv.withdraw, gicNet: f.money(r.gicAfterTax), fundNet: f.money(r.fundAfterTax) }));
      if (!nonreg && !rrsp) notes.push(t('gic.taxNone', { accountIn }));
      if (r.capitalLoss > 0.5) notes.push(t('gic.lossNote', { loss: f.money(r.capitalLoss) }));
      else if (rLo.capitalLoss > 0.5) notes.push(t('gic.lossNoteLow', { loss: f.money(rLo.capitalLoss), lo: vars.lo }));
      if (nonreg && rates.eligible < 0 && s.fd > 0) notes.push(t('gic.negDivNote', { eligible: rv.eligible }));
      const notesHtml = notes.map(n => `<p class="pc-extra-note">${esc(n)}</p>`).join('');
      const extra = (nonreg
        ? `<p class="pc-extra-title">${esc(t('gic.taxTitle', vars))}</p>` + rowChart({ id: 'fig-gicTax', title: t('gic.taxTitle', vars), desc: t('gic.taxTitle', vars), rows: [{ label: t('gic.rowGic', { kind: t('gic.taxGic') }), value: Math.round(tx.gicInterest) }, ...[['taxIncome', tx.fundIncome], ['taxDividends', tx.fundDividends], ['taxRealized', tx.fundRealized], ['taxDeferred', tx.fundDeferred]].map(([k, v]) => ({ label: t('gic.rowFund', { kind: t('gic.' + k) }), value: Math.round(v), highlight: true }))], format: f.axisMoney })
        : '') + notesHtml;
      const yearLabel = x => x.maturity ? t('gic.yearMat', { n: x.year }) : String(x.year);
      let shown = r.rows.filter(x => x.year === 0 || x.maturity || x.year === s.years);
      if (shown.length > 12) shown = pick(r.rows, Math.max(1, Math.round(s.years / 6)));
      const head = rrsp ? [t('col.year'), t('gic.colGicPre'), t('gic.colGicNet'), t('gic.colFundPre'), t('gic.colFundNet')] : [t('col.year'), t('gic.colGic.' + acct), t('gic.colFund.' + acct), ...(nonreg ? [t('gic.colAcb')] : [])];
      const rowsOut = shown.map(x => rrsp ? [yearLabel(x), f.money(x.gicBalance), f.money(x.gic), f.money(x.fundBalance), f.money(x.fund)] : [yearLabel(x), f.money(x.gic), f.money(x.fund), ...(nonreg ? [f.money(x.acb ?? s.amount)] : [])]);
      const pts = (res, k) => res.rows.map(x => [x.year, rowVal(x, k)]);
      return {
        chart: lineChart({ id: 'fig-gic', title: t('gic.title', { ...vars, basis: t('gic.basis.' + acct) }), desc: t('gic.summary', vars), bands: [{ key: 'fundRange', lower: pts(rLo, 'fund'), upper: pts(rHi, 'fund') }], series: [{ key: 'a', name: t('gic.gic'), points: pts(r, 'gic'), kind: 'dash' }, { key: 'b', name: t('gic.fundMid', { rate: f.pct(pc(s.fundReturn)) }), points: pts(r, 'fund') }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years'), refLines: [{ y: s.amount, label: t(rrsp ? 'gic.contribution' : 'gic.invested') }] }),
        legend: legend([{ key: 'a', name: t('gic.gic'), dash: true }, { key: 'b', name: t('gic.fundMid', { rate: f.pct(pc(s.fundReturn)) }) }, { key: 'fundRange', name: t('gic.fundRange', { lo: vars.lo, hi: vars.hi }) }]),
        extra,
        stats: stats(t('gic.statCap.' + acct, { span: vars.span }), [[t('gic.gic'), vars.gic, 'a'], [t('gic.statFund', { rate: f.pct(pc(s.fundReturn)) }), vars.fund, 'b'], [t('gic.statRange', { lo: vars.lo, hi: vars.hi }), vars.fundLo + ' – ' + vars.fundHi, 'b'], ...(be == null ? [] : [[t('gic.statBreakeven'), f.pct(be, 2)]])]),
        summary: t('gic.summary', vars),
        assumptions: t('gic.assumptions', { gicRate: f.pct(pc(s.gicRate), 2), renew: f.pct(pc(s.renewRate), 2), termSpan, fi: f.pct(pc(s.fi), 2), fd: f.pct(pc(s.fd), 2), ff: f.pct(pc(s.ff), 2), fg: f.pct(pc(s.fg), 2), fu: f.pct(pc(s.fundReturn) - income, 2), ft: f.pct(pc(s.fundReturn), 2), vol: f.pct(assetStats().vol, 1), income: f.money(s.income), ...rv }),
        table: dataTable({ caption: t('gic.title', { ...vars, basis: t('gic.basis.' + acct) }), head, rows: rowsOut })
      };
    }
  }
};

/** Clamp and type-check one figure's state from raw input values. */
export function normalizeState(name, raw = {}) {
  const spec = FIGURES[name].inputs, out = {};
  for (const [key, def] of Object.entries(spec)) {
    if (Array.isArray(def[1])) { out[key] = def[1].includes(raw[key]) ? raw[key] : def[0]; continue; }
    const [fallback, min, max] = def, v = Number(raw[key]);
    out[key] = Number.isFinite(v) && raw[key] !== '' && raw[key] != null ? Math.min(max, Math.max(min, v)) : fallback;
  }
  for (const key of ['years', 'delay', 'n', 'from', 'term']) if (key in out) out[key] = Math.round(out[key]);
  return out;
}

export function defaults(name) { return normalizeState(name, {}); }

export function renderFigure(name, raw, lang = 'en') {
  return FIGURES[name].render(normalizeState(name, raw), (key, vars) => translate(key, vars, lang), formatters(lang));
}
