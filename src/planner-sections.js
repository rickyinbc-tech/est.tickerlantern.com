// Interactive figures for the planner toolkit. Each figure has defaults, input
// limits and a render() that returns chart SVG, a one-sentence summary and a
// data table. The build calls render() with the defaults; the browser calls it
// again after every input change, so both always show the same markup.
import { CPI, cpiEquivalent, cpiAnnualRate, realValue, growthSchedule, recoveryGain, recoveryYears, outcomeBands, equalWeightVolatility, twoAssetMix, regularPurchases, bcMarginalRates, tfsaVsRrspIncremental, creditZones } from './planner-math.js';
import { lineChart, barChart, legend, dataTable } from './planner-charts.js';
import { STRINGS } from './planner-strings.js';

export const CPI_LAST = 2025;

export function formatters() {
  const locale = 'en-CA';
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' });
  const compact = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD', notation: 'compact', maximumFractionDigits: 1 });
  return {
    cents: v => cents.format(v),
    money: v => money.format(Math.round(v) === 0 ? 0 : v),
    axisMoney: v => Math.abs(v) >= 10000 ? compact.format(v) : money.format(v),
    pct: (v, d = 1) => (v * 100).toFixed(d).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1') + '%',
    fixed: (v, d = 1) => v.toFixed(d) + '%',
    date: iso => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z')),
    num: (v, d = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(v),
    year: v => String(v)
  };
}

const fill = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
export const translate = (key, vars) => {
  const s = STRINGS[key];
  if (s == null) throw new Error('Missing planner string: ' + key);
  return fill(s, vars);
};
const pick = (rows, every) => rows.filter((r, i) => i % every === 0 || i === rows.length - 1);
const PRESETS = { cautious: { median: 4, sigma: 6 }, balanced: { median: 5, sigma: 10 }, growth: { median: 6.5, sigma: 15 } };

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
      const vars = { cash: f.money(s.cash), years: s.years, nominal: f.money(pts.at(-1)[1]), real: f.money(real.at(-1)[1]), rate: f.pct(s.rate / 100), infl: f.pct(s.infl / 100) };
      return {
        chart: lineChart({ id: 'fig-cash', title: t('cash.title'), desc: t('cash.summary', vars), series: [{ key: 'a', name: t('cash.nominal'), points: pts }, { key: 'b', name: t('cash.real'), points: real, kind: 'dash' }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years'), refLines: [{ y: s.cash, label: t('cash.ref') }] }),
        legend: legend([{ key: 'a', name: t('cash.nominal') }, { key: 'b', name: t('cash.real'), dash: true }]),
        summary: t('cash.summary', vars),
        table: dataTable({ caption: t('cash.title'), head: [t('col.year'), t('cash.nominal'), t('cash.real')], rows: pick(pts, Math.max(1, Math.round(s.years / 5))).map(([y, v]) => [String(y), f.money(v), f.money(real[y][1])]) })
      };
    }
  },
  compounding: {
    inputs: { initial: [5000, 0, 10000000], monthly: [300, 0, 100000], rate: [5, -5, 15], years: [30, 2, 50], delay: [10, 1, 49] },
    render(s, t, f) {
      const delay = Math.min(s.delay, s.years - 1), r = s.rate / 100;
      const now = growthSchedule({ initial: s.initial, monthly: s.monthly, annualRate: r, years: s.years });
      const late = growthSchedule({ initial: s.initial, monthly: s.monthly, annualRate: r, years: s.years - delay });
      const latePts = now.filter(row => row.year >= delay).map(row => [row.year, late[row.year - delay].value]);
      const lateAt = year => year < delay ? 0 : late[year - delay].value;
      const vars = { years: s.years, delay, now: f.money(now.at(-1).value), nowIn: f.money(now.at(-1).contributed), late: f.money(late.at(-1).value), lateIn: f.money(late.at(-1).contributed), gap: f.money(now.at(-1).value - late.at(-1).value), rate: f.pct(r), share: f.pct(now.at(-1).value > 0 ? Math.max(0, now.at(-1).growth) / now.at(-1).value : 0, 0) };
      return {
        chart: lineChart({ id: 'fig-compounding', title: t('comp.title'), desc: t('comp.summary', vars), series: [{ key: 'a', name: t('comp.now'), points: now.map(x => [x.year, x.value]) }, { key: 'b', name: t('comp.late', vars), points: latePts, kind: 'dash' }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years') }),
        legend: legend([{ key: 'a', name: t('comp.now') }, { key: 'b', name: t('comp.late', vars), dash: true }]),
        summary: t('comp.summary', vars),
        table: dataTable({ caption: t('comp.title'), head: [t('col.year'), t('comp.now'), t('comp.late', vars)], rows: pick(now, 5).map(x => [String(x.year), f.money(x.value), f.money(lateAt(x.year))]) })
      };
    }
  },
  contributions: {
    inputs: { monthly: [250, 1, 100000], rate: [5, -5, 15], years: [20, 1, 50] },
    render(s, t, f) {
      const rows = growthSchedule({ monthly: s.monthly, annualRate: s.rate / 100, years: s.years }), last = rows.at(-1);
      const vars = { monthly: f.money(s.monthly), years: s.years, value: f.money(last.value), contributed: f.money(last.contributed), growth: f.money(last.growth), share: f.pct(last.value > 0 ? Math.max(0, last.growth) / last.value : 0, 0), rate: f.pct(s.rate / 100) };
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
      const vars = { years: s.years, amount: f.money(s.amount), mid: f.money(end.p50 * s.amount), lo: f.money(end.p10 * s.amount), hi: f.money(end.p90 * s.amount), loss: f.pct(end.lossChance, 0), median: f.pct(median / 100), sigma: f.pct(sigma / 100, 0), mix: t('preset.' + s.preset) };
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
        chart: barChart({ id: 'fig-hypoReturns', title: t('hypo.returnsTitle'), desc: t('hypo.returnsSummary', vars), categories: cats, shortCategories: vals.map((_, i) => 'Y' + (i + 1)), series: [{ key: 'a', name: t('hypo.returnCol'), values: vals }], yFormat: v => f.fixed(v, 0), yLabel: t('hypo.returnCol'), height: 300 }),
        legend: '',
        summary: t('hypo.returnsSummary', vars),
        table: dataTable({ caption: t('hypo.returnsTitle'), head: [t('hypo.yearCol'), t('hypo.returnCol')], rows: vals.map((v, i) => [cats[i], f.fixed(v, 0)]) })
      };
    }
  },
  hypoPath: {
    inputs: { amount: [10000, 1, 10000000], fee: [2, 0, 4] },
    render(s, t, f) {
      const r = FIGURES.hypoReturns.returns, fee = s.fee / 100;
      let v = s.amount; const bumpy = [[0, v]];
      r.forEach((x, i) => { v *= (1 + x / 100) * (1 - fee); bumpy.push([i + 1, v]); });
      const avg = (v / s.amount) ** (1 / r.length) - 1, smooth = bumpy.map(([y]) => [y, s.amount * (1 + avg) ** y]);
      const low = bumpy.reduce((m, p) => Math.min(m, p[1]), Infinity);
      const vars = { amount: f.money(s.amount), fee: f.pct(fee, 2), end: f.money(v), avg: f.pct(avg, 1), low: f.money(low) };
      return {
        chart: lineChart({ id: 'fig-hypoPath', title: t('hypo.pathTitle'), desc: t('hypo.pathSummary', vars), series: [{ key: 'a', name: t('hypo.bumpy'), points: bumpy }, { key: 'b', name: t('hypo.smooth', vars), points: smooth, kind: 'dash' }], xFormat: y => y === 0 ? t('hypo.start') : 'Y' + y, yFormat: f.axisMoney, xLabel: t('hypo.yearsLabel'), refLines: [{ y: s.amount, label: t('hypo.invested') }] }),
        legend: legend([{ key: 'a', name: t('hypo.bumpy') }, { key: 'b', name: t('hypo.smooth', vars), dash: true }]),
        summary: t('hypo.pathSummary', vars),
        table: dataTable({ caption: t('hypo.pathTitle'), head: [t('hypo.yearCol'), t('hypo.bumpy'), t('hypo.smooth', vars)], rows: bumpy.map(([y, val], i) => [y === 0 ? t('hypo.start') : t('hypo.year', { n: y }), f.money(val), f.money(smooth[i][1])]) })
      };
    }
  },
  fees: {
    inputs: { initial: [50000, 0, 10000000], monthly: [300, 0, 100000], rate: [6, -5, 15], feeA: [2, 0, 4], feeB: [1, 0, 4], years: [25, 1, 50] },
    render(s, t, f) {
      const g = fee => growthSchedule({ initial: s.initial, monthly: s.monthly, annualRate: s.rate / 100, annualFee: fee / 100, years: s.years });
      const a = g(s.feeA), b = g(s.feeB), gap = b.at(-1).value - a.at(-1).value;
      const vars = { feeA: f.pct(s.feeA / 100, 2), feeB: f.pct(s.feeB / 100, 2), years: s.years, a: f.money(a.at(-1).value), b: f.money(b.at(-1).value), gap: f.money(Math.abs(gap)), more: gap >= 0 ? t('fees.lowerMore') : t('fees.higherMore'), invested: f.money(a.at(-1).contributed) };
      return {
        chart: lineChart({ id: 'fig-fees', title: t('fees.title'), desc: t('fees.summary', vars), series: [{ key: 'b', name: t('fees.seriesB', vars), points: b.map(x => [x.year, x.value]) }, { key: 'a', name: t('fees.seriesA', vars), points: a.map(x => [x.year, x.value]), kind: 'dash' }], xFormat: v => t('axis.yearN', { n: v }), yFormat: f.axisMoney, xLabel: t('axis.years') }),
        legend: legend([{ key: 'b', name: t('fees.seriesB', vars) }, { key: 'a', name: t('fees.seriesA', vars), dash: true }]),
        summary: t('fees.summary', vars),
        table: dataTable({ caption: t('fees.title'), head: [t('col.year'), t('fees.seriesB', vars), t('fees.seriesA', vars), t('fees.gapCol')], rows: pick(a, Math.max(1, Math.round(s.years / 5))).map(x => [String(x.year), f.money(b[x.year].value), f.money(x.value), f.money(b[x.year].value - x.value)]) })
      };
    }
  },
  units: {
    inputs: { invest: [5000, 1, 10000000], nav: [12.5, 0.01, 10000] },
    render(s, t, f) {
      const units = s.invest / s.nav, vars = { invest: f.money(s.invest), nav: f.cents(s.nav), units: f.num(units, 3), up: f.money(units * s.nav * 1.1), down: f.money(units * s.nav * 0.9) };
      return { summary: t('units.summary', vars) };
    }
  },
  rrsp: {
    inputs: { pretax: [10000, 1, 10000000], rate: [5, -5, 15], years: [25, 1, 50], incomeNow: [95000, 0, 2000000], incomeLater: [50000, 0, 2000000], spread: [10, 1, 30] },
    render(s, t, f) {
      const r = tfsaVsRrspIncremental({ pretax: s.pretax, rate: s.rate / 100, years: s.years, incomeNow: s.incomeNow, incomeLater: s.incomeLater, spreadYears: s.spread });
      // Check every income each side taxes, not just the endpoints.
      const sides = [
        { key: 'contribution', range: [Math.max(0, s.incomeNow - s.pretax), s.incomeNow] },
        { key: 'withdrawal', range: [s.incomeLater, s.incomeLater + r.balance / s.spread] }
      ];
      const caution = creditZones(sides.map(x => x.range)).map(zone => {
        const hit = sides.filter(x => creditZones([x.range]).includes(zone));
        return t('caution.rrsp.' + zone + (hit.length > 1 ? '.plural' : ''), { sides: hit.map(x => t('caution.side.' + x.key, { lo: f.money(x.range[0]), hi: f.money(x.range[1]) })).join(t('caution.and')) });
      }).join(' ');
      const diff = r.rrsp - r.tfsa;
      const vars = { pretax: f.money(s.pretax), years: s.years, now: f.pct(r.rateNow, 1), later: f.pct(r.rateLater, 1), tfsa: f.money(r.tfsa), rrsp: f.money(r.rrsp), spread: s.spread === 1 ? 'in a single year' : `over ${s.spread} years`, balance: f.money(r.balance), caution: caution ? caution + ' ' : '', winner: Math.abs(diff) < 0.5 ? t('rrsp.tie') : (diff > 0 ? t('rrsp.rrspAhead') : t('rrsp.tfsaAhead')) + t('rrsp.by', { diff: f.money(Math.abs(diff)) }) };
      return {
        chart: barChart({ id: 'fig-rrsp', title: t('rrsp.title'), desc: t('rrsp.summary', vars), categories: [t('rrsp.tfsa'), t('rrsp.rrsp')], series: [{ key: 'a', name: t('rrsp.afterTax'), values: [Math.round(r.tfsa), Math.round(r.rrsp)] }], yFormat: f.axisMoney, height: 280 }),
        legend: '',
        summary: t('rrsp.summary', vars),
        table: dataTable({ caption: t('rrsp.title'), head: [t('rrsp.measure'), t('rrsp.tfsa'), t('rrsp.rrsp')], rows: [[t('rrsp.rowRateNow'), f.pct(r.rateNow, 2), f.pct(r.rateNow, 2)], [t('rrsp.rowRateLater'), '—', f.pct(r.rateLater, 2)], [t('rrsp.afterTax'), f.money(r.tfsa), f.money(r.rrsp)]] })
      };
    }
  },
  taxtypes: {
    inputs: { income: [100000, 0, 2000000] },
    render(s, t, f) {
      const types = ['ordinary', 'eligible', 'other', 'capitalGains'], cur = bcMarginalRates(s.income);
      const zones = creditZones([[s.income, s.income]]);
      const vars = { caution: zones.length ? zones.map(z => t('caution.' + z)).join(' ') + ' ' : '', income: f.money(s.income), ordinary: f.pct(cur.ordinary, 2), eligible: f.pct(cur.eligible, 2), other: f.pct(cur.other, 2), capitalGains: f.pct(cur.capitalGains, 2) };
      return {
        chart: barChart({ id: 'fig-taxtypes', title: t('tax.title', vars), desc: t('tax.summary', vars), categories: types.map(k => t('tax.short.' + k)), series: [{ key: 'a', name: t('tax.rate'), values: types.map(k => +(cur[k] * 100).toFixed(2)) }], yFormat: v => f.num(v, 2) + '%', yLabel: t('tax.rate'), height: 300 }),
        legend: '',
        summary: t('tax.summary', vars),
        table: dataTable({ caption: t('tax.tableCaption'), head: [t('tax.incomeCol'), ...types.map(k => t('tax.' + k))], rows: [60000, 80000, 100000, 120000, 150000, 300000].map(inc => { const m = bcMarginalRates(inc); return [f.money(inc), ...types.map(k => f.pct(m[k], 2))]; }) })
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
  for (const key of ['years', 'delay', 'n', 'from']) if (key in out) out[key] = Math.round(out[key]);
  return out;
}

export function defaults(name) { return normalizeState(name, {}); }

export function renderFigure(name, raw) {
  return FIGURES[name].render(normalizeState(name, raw), translate, formatters());
}
