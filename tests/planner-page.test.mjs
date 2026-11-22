import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { FIGURES, renderFigure, normalizeState, scenarioReturns, SCENARIOS, ASSETS, LANGS } from '../src/planner-sections.js';
import { STRINGS } from '../src/planner-strings.js';
import { applySiteNavigation, navLinks } from '../src/site-navigation.js';

const home = await readFile('dist/index.html', 'utf8');
const zh = await readFile('dist/zh/index.html', 'utf8');
const PANELS = ['why', 'contributions', 'volatility', 'balanced-example', 'diversification', 'asset-classes', 'gic-vs-fund'];
const block = (html, name) => { const start = html.indexOf(`data-figure="${name}" id="fig-${name}-wrap"`); return start < 0 ? '' : html.slice(start, html.indexOf('</figure>', start)); };

test('both homepages have the seven conversations, in order, and a pre-rendered figure for every interactive figure', () => {
  for (const html of [home, zh]) {
    const ids = [...html.matchAll(/<section class="pc-section pc-panel(?: is-active)?" id="([a-z-]+)"/g)].map(m => m[1]);
    assert.deepEqual(ids, PANELS);
    assert.ok(html.includes('id="sources"'));
    for (const name of Object.keys(FIGURES)) {
      const b = block(html, name);
      assert.ok(b, name);
      assert.ok(/data-out="summary"[^>]*>[^<]{20,}/.test(b), name + ' summary');
      assert.ok(b.includes('class="pc-svg"') && b.includes('role="img"'), name + ' chart');
    }
  }
});

test('the removed conversations are gone: compounding, fees, mutual-fund basics and account selection', () => {
  for (const html of [home, zh]) for (const id of ['compounding', 'fees', 'mutual-funds', 'accounts']) assert.ok(!html.includes(`id="${id}"`), id);
  for (const name of ['compounding', 'fees', 'units', 'rrsp', 'taxtypes']) assert.ok(!(name in FIGURES), name);
  assert.ok(!('fee' in FIGURES.hypoPath.inputs), 'no fee-focused input remains');
});

test('every citation resolves to a listed https source, and every source is cited, in both languages', () => {
  for (const html of [home, zh]) {
    const cited = new Set([...html.matchAll(/href="#src-([a-z0-9-]+)"/g)].map(m => m[1]));
    const listed = [...html.matchAll(/<li id="src-([a-z0-9-]+)">[\s\S]*?href="([^"]+)"/g)];
    assert.ok(listed.length >= 20);
    for (const [, key, url] of listed) { assert.ok(url.startsWith('https://'), key); assert.ok(cited.has(key), 'uncited source ' + key); }
    for (const key of cited) assert.ok(listed.some(l => l[1] === key), 'missing source ' + key);
  }
});

test('historical data and illustrations are labelled distinctly; every asset and fund number is marked hypothetical', () => {
  const badge = (html, name) => block(html, name).match(/<div class="pc-figure__head"><span class="pc-badge [^"]+">([^<]+)</)[1];
  assert.equal(badge(home, 'inflation'), 'Historical data'); assert.equal(badge(zh, 'inflation'), '历史数据');
  for (const name of Object.keys(FIGURES).filter(n => n !== 'inflation')) { assert.equal(badge(home, name), 'Illustration', name); assert.equal(badge(zh, name), '示意', name); }
  assert.match(block(home, 'assetRange'), /Not historical returns, not forecasts and not data for any index or fund/);
  assert.match(block(zh, 'assetRange'), /并非历史回报，并非预测，也不是任何指数或基金的数据/);
  assert.match(block(home, 'assetScenario'), /not any actual year/);
  assert.match(block(home, 'gic'), /not any fund’s actual distributions/);
  assert.match(home, /returns and recoveries are not guaranteed/i);
  assert.doesNotMatch(home, /guaranteed (?:return|growth|recovery)/i);
});

test('caveats that separate history from hypothesis stay visible, not inside a disclosure', () => {
  for (const [html, pairs] of [[home, [['hypoReturns', 'Hypothetical and invented for teaching'], ['volatility', 'not market history and not a forecast'], ['assetRange', 'Not historical returns'], ['assetScenario', 'not any actual year'], ['gic', 'not any fund’s actual distributions'], ['gic', 'Past performance does not guarantee future results']]], [zh, [['hypoReturns', '为教学而虚构'], ['assetRange', '并非历史回报'], ['assetScenario', '并非任何实际年份'], ['gic', '并非任何基金的实际分派'], ['gic', '过去的表现不保证未来的结果']]]]) {
    for (const [name, text] of pairs) {
      const b = block(html, name), at = b.indexOf(text), details = b.indexOf('<details class="pc-about"');
      assert.ok(at > 0, name); assert.ok(details < 0 || at < details, name + ' caveat must sit before the disclosure');
    }
  }
});

test('the GIC tool states the enacted BC 5.60% status, cites the legislative record and lists its limitations', () => {
  for (const [html, status] of [[home, /BC rate status:<\/strong> the 5\.60% lowest BC rate is law for 2026\. Bill 2[^<]*Royal Assent on 16 April 2026[^<]*<a class="pc-cite" href="#src-bc-budget"/], [zh, /卑诗省税率状态：<\/strong>卑诗省5\.60%的最低税率已于2026年成为法律[^<]*<a class="pc-cite" href="#src-bc-budget"/]]) {
    const b = block(html, 'gic');
    assert.match(b, status); assert.match(b, /href="#src-bc-bill2"/); assert.match(b, /href="#src-bc-hansard-ra"/); assert.match(b, /href="#src-cdic"/);
  }
  assert.match(block(home, 'gic'), /Limitations:<\/strong> one flat marginal rate/);
  assert.match(home, /lims\.leg\.bc\.ca\/pdms\/ldp\/43rd2nd\/3rd_read\/gov02-3\.htm/);
});

test('GIC tool distinguishes interest, fund income and gains, registered and non-registered timing', () => {
  const nr = renderFigure('gic', {});
  assert.match(nr.summary, /interest is taxed every year at 28\.2%/);
  assert.match(nr.summary, /Canadian dividends at 1\.6%/); assert.match(nr.summary, /distributed gains at 14\.1%/);
  assert.match(nr.summary, /growth in unit value is taxed only when sold/);
  assert.match(nr.extra, /distributed capital gains/); assert.match(nr.extra, /gain on sale at the end/);
  assert.match(renderFigure('gic', { sale: 'hold' }).summary, /untaxed gain, taxed when sold/);
  assert.match(renderFigure('gic', { account: 'tfsa' }).summary, /neither is taxed/);
  assert.match(renderFigure('gic', { account: 'rrsp' }).summary, /taxed as income \(30% assumed\)/);
  assert.match(renderFigure('gic', { fundReturn: -5 }).summary, /the GIC is ahead by/);
  assert.match(renderFigure('gic', { income: 40000 }).summary, /^Caution: at or below \$44,952/);
  assert.doesNotMatch(renderFigure('gic', { account: 'tfsa', income: 40000 }).summary, /Caution/);
  assert.match(nr.summary, /can be negative in any year/);
});

test('asset-class comparison: all eight series, balanced weights sum to 100%, and the balanced portfolio can lose and trail cash', () => {
  const keys = renderFigure('assetRange', {}).table.match(/<th scope="row">[^<]+/g).map(s => s.slice(16));
  assert.deepEqual(keys, ['Cash (treasury bills)', 'Canadian government bonds', 'High-yield corporate bonds', 'Canadian equities', 'US equities', 'Developed international equities', 'Emerging-market equities', 'Hypothetical balanced portfolio']);
  assert.ok(Math.abs(ASSETS.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.match(renderFigure('assetRange', { years: 1 }).summary, /−\d/);
  const balance = Object.keys(SCENARIOS).map(k => { const r = scenarioReturns(k), sorted = [...r].sort((a, b) => b.value - a.value); return { k, bal: r.at(-1).value, cash: r[0].value, rank: sorted.findIndex(x => x.k === 'bal') + 1 }; });
  assert.ok(balance.some(b => b.bal < 0), 'some situation loses money');
  assert.ok(balance.some(b => b.cash > b.bal), 'some situation trails cash');
  assert.ok(new Set(balance.map(b => b.rank)).size >= 3, 'the balanced portfolio does not always land in the same place');
  assert.match(renderFigure('assetScenario', { scenario: 'ratesUp' }).summary, /loses money\. Cash does better/);
});

test('Chinese strings match English: same keys, same placeholders', () => {
  const holes = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
  assert.deepEqual(Object.keys(STRINGS.zh).sort(), Object.keys(STRINGS.en).sort());
  for (const key of Object.keys(STRINGS.en)) assert.equal(holes(STRINGS.zh[key]), holes(STRINGS.en[key]), key);
});

test('random and extreme inputs never produce NaN, Infinity or unfilled placeholders, in either language', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const lang of LANGS) for (const [name, fig] of Object.entries(FIGURES)) {
    for (let i = 0; i < 60; i++) {
      const raw = {};
      for (const [key, spec] of Object.entries(fig.inputs)) raw[key] = Array.isArray(spec[1]) ? spec[1][Math.floor(rnd() * spec[1].length)] : i % 10 === 0 ? (rnd() < .5 ? -1e9 : 1e9) : spec[1] + rnd() * (spec[2] - spec[1]);
      const text = JSON.stringify(renderFigure(name, raw, lang));
      assert.doesNotMatch(text, /NaN|Infinity|undefined|\{[a-z]+\}/i, `${lang} ${name} ${JSON.stringify(raw)}`);
    }
  }
  assert.equal(normalizeState('gic', { gicRate: 'abc' }).gicRate, 3.25);
  assert.equal(normalizeState('gic', { years: 1e6 }).years, 30);
});

test('the Chinese homepage is a full Chinese page, not the English fallback', () => {
  assert.doesNotMatch(zh, /data-zh-fallback|tl-translation-banner|<title>英文页面/);
  assert.match(zh, /<html lang="zh-Hans"/); assert.match(zh, /<main id="main" lang="zh-Hans" data-planner-lang="zh" data-tl-ignore>/);
  assert.match(zh, /由同一份双语内容生成/); assert.doesNotMatch(zh, /简体中文为机器翻译/);
  assert.match(zh, /<link rel="canonical" href="https:\/\/tickerlantern\.com\/zh\/">/);
  // Visible text in the main content has no stray English sentences (product names, acronyms and the source links are allowed).
  // The fund's official English name is a proper noun and stays in English.
  const main = zh.slice(zh.indexOf('<main'), zh.indexOf('</main>')).replaceAll('RBC Select Balanced Portfolio', ' ').replace(/<ol class="pc-source-list">[\s\S]*?<\/ol>/, '').replace(/<(svg|title|desc)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');
  const english = main.match(/[A-Za-z][a-z]+(?:[ ,'’-]+[A-Za-z][a-z]+){2,}/g) || [];
  assert.deepEqual(english, [], 'English phrases left on the Chinese page');
  // Every control label, option and button is Chinese.
  for (const m of zh.matchAll(/<label for="[^"]+">(?:<span>)?([^<]+)/g)) assert.match(m[1], /[一-鿿]/, m[1]);
  for (const m of zh.matchAll(/<option value="([a-z]+)"[^>]*>([^<]+)/g)) if (!/^(?:tfsa)$/.test(m[1])) assert.match(m[2], /[一-鿿]/, m[2]);
  for (const name of Object.keys(FIGURES)) assert.match(renderFigure(name, {}, 'zh').summary, /[一-鿿]/, name);
});

test('the one real fund figure is the published RBF460 10-year return, dated, sourced and used only as an editable assumption', async () => {
  const { FUND_SAMPLE } = await import('../src/planner-fund-sample.js');
  assert.deepEqual({ code: FUND_SAMPLE.code, series: FUND_SAMPLE.series, tenYearPct: FUND_SAMPLE.tenYearPct, asOf: FUND_SAMPLE.asOf }, { code: 'RBF460', series: 'A', tenYearPct: 6.6, asOf: '2026-10-31' });
  assert.equal(FUND_SAMPLE.url, 'https://www.rbcgam.com/en/ca/products/mutual-funds/RBF460/detail');
  // The figure seeds the slider, which stays editable across its full range.
  assert.deepEqual(FIGURES.gic.inputs.fundReturn, [6.6, -10, 12]);
  for (const [html, asOf, past] of [[home, 'as of October 31, 2026', 'Past performance does not guarantee future results'], [zh, '截至2026年10月31日', '过去的表现不保证未来的结果']]) {
    const card = html.slice(html.indexOf('<aside class="pc-sample"'), html.indexOf('</aside>', html.indexOf('<aside class="pc-sample"')));
    assert.match(card, /pc-badge--history/); assert.ok(card.includes(asOf), asOf); assert.ok(card.includes(past)); assert.match(card, /RBF460/); assert.match(card, /href="#src-rbcgam-rbf460"/);
    assert.match(html, /<li id="src-rbcgam-rbf460">[^<]*<a href="https:\/\/www\.rbcgam\.com\/en\/ca\/products\/mutual-funds\/RBF460\/detail"/);
    assert.match(html, /<input id="gic-fundReturn" name="fundReturn" type="range" min="-10" max="12" step="0.1" value="6.6">/);
  }
  assert.match(renderFigure('gic', {}).summary, /6\.6% return is an illustrative assumption that starts at a dated, published 10-year figure/);
  assert.match(renderFigure('gic', { fundReturn: 3 }).summary, /3% return is your assumption for the future/);
  // No other fund data: no other fund code, no MER or calendar returns, no fund-specific distribution split.
  const assets = [home, zh, ...await Promise.all(['planner.js', 'planner-sections.js', 'planner-strings.js', 'planner-math.js', 'planner-fund-sample.js'].map(f => readFile('dist/' + f, 'utf8')))].join('\n');
  assert.deepEqual([...new Set(assets.match(/RBF\d{3}/g))], ['RBF460']);
  assert.doesNotMatch(assets, /\b1\.94\b|\b13\.9\b|\b11\.6\b/, 'no MER or calendar returns copied');
  assert.ok(Object.keys(FIGURES.gic.inputs).filter(k => /^f[idfg]$/.test(k)).every(k => !String(FIGURES.gic.inputs[k][0]).includes('RBF')));
  // The invented year-by-year sequence elsewhere must still not be the real fund's calendar returns (compared by hash).
  const { createHash } = await import('node:crypto');
  assert.notEqual(createHash('sha256').update(JSON.stringify(FIGURES.hypoReturns.returns)).digest('hex'), '529b3ddfff4ffddbc1d2fc006a3c04a913ae43a7e102af065dc2fde6095ae3ca');
  assert.match(renderFigure('hypoReturns', {}).summary, /not data for any real fund/);
});
test('valuation app moved intact to /valuations; old homepage anchors are forwarded', async () => {
  const v = await readFile('dist/valuations.html', 'utf8');
  assert.ok(v.includes('<link rel="canonical" href="https://tickerlantern.com/valuations">'));
  for (const id of ['indices', 'model', 'methodology']) assert.ok(v.includes(`id="${id}"`), id);
  assert.ok((await readFile('dist/sitemap.xml', 'utf8')).includes('<loc>https://tickerlantern.com/valuations</loc>'));
  assert.ok((await readFile('src/planner.js', 'utf8')).includes("'#indices'"));
});

test('every built page uses the current navigation, with no legacy Indices link left', async () => {
  const files = [];
  const walk = async dir => { for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) await walk(p); else if (e.name.endsWith('.html')) files.push(p); } };
  await walk('dist');
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (!html.includes('tl-nav--desktop')) continue;
    assert.doesNotMatch(html, />(?:Indices|指数)<\/a>/, file);
    assert.doesNotMatch(html, /理财沟通工具（英文版）/, file);
    assert.match(html, /href="\/(?:zh\/)?valuations"/, file);
  }
  assert.match(home, /<a href="\/" aria-current="page">Planner toolkit<\/a><a href="\/valuations">Valuations<\/a>/);
  assert.match(zh, /<a href="\/zh\/" aria-current="page">理财沟通工具<\/a><a href="\/zh\/valuations">指数估值<\/a>/);
  assert.equal(applySiteNavigation('<a aria-current="page" href="/zh/">指数</a>', '/zh/valuations'), navLinks('/zh/valuations'));
});

test('one conversation at a time: every panel has a rail link, a pager and talking points; the first is shown by default', () => {
  for (const [html, label] of [[home, 'Talking points'], [zh, '谈话要点']]) {
    const panels = [...html.matchAll(/<section class="pc-section pc-panel( is-active)?" id="([a-z-]+)"/g)];
    assert.equal(panels.filter(p => p[1]).length, 1); assert.equal(panels[0][2], 'why'); assert.ok(panels[0][1]);
    const rail = html.slice(html.indexOf('<nav class="pc-rail"'), html.indexOf('</nav>', html.indexOf('<nav class="pc-rail"')));
    for (const [, , id] of panels) {
      assert.ok(rail.includes(`href="#${id}"`), 'rail link ' + id);
      const b = html.slice(html.indexOf(`id="${id}"`), html.indexOf('</section>', html.indexOf(`id="${id}"`)));
      assert.match(b, /class="pc-pager"/, 'pager ' + id);
      assert.ok(b.includes(`class="pc-notes" aria-label="${label}"`), 'talking points ' + id);
    }
    // The boot script must load before the module so the page never flashes every panel.
    assert.ok(html.indexOf('src="/planner-boot.js"') > 0 && html.indexOf('src="/planner-boot.js"') < html.indexOf('src="/planner.js"'));
    assert.match(html, /id="notes-toggle" aria-pressed="false"/);
  }
});

test('every input is still rendered; extras live under "More settings"', () => {
  for (const html of [home, zh]) for (const [name, fig] of Object.entries(FIGURES)) {
    const b = block(html, name);
    for (const key of Object.keys(fig.inputs)) assert.ok(b.includes(`id="${name}-${key}"`), `${name}-${key}`);
    if (Object.keys(fig.inputs).length > 4) assert.match(b, /class="pc-more-inputs"/, name);
  }
});

test('homepages stay CSP-clean: no inline scripts, styles or style attributes', () => {
  for (const html of [home, zh]) {
    assert.doesNotMatch(html, /<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>/);
    assert.doesNotMatch(html, /<style[\s>]/);
    assert.doesNotMatch(html, /\sstyle="/);
  }
});

test('chart labels fit at phone width in both languages', async () => {
  const { setChartWidth, textWidth } = await import('../src/planner-charts.js');
  try {
    for (const width of [320, 343, 358]) { // chart widths inside 360–390px phones
      setChartWidth(width);
      for (const lang of LANGS) {
        for (const name of ['dca', 'recovery', 'hypoReturns']) {
          const svg = renderFigure(name, {}, lang).chart, bars = +svg.match(/data-bars="(\d+)"/)[1];
          const slot = (width - 72 - 22) / bars;
          const lines = [...svg.matchAll(/<text class="pc-tick( pc-tick--wrap)?" x="[\d.]+" y="[\d.]+" text-anchor="middle">(.*?)<\/text>/g)]
            .flatMap(([, wrap, inner]) => (inner.includes('<tspan') ? [...inner.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map(m => m[1]) : [inner]).map(t => [t, wrap ? 12 : 13]));
          for (const [text, size] of lines) assert.ok(textWidth(text, size) <= slot + 2, `${lang} ${name} @${width}: "${text}" wider than ${slot.toFixed(0)}px slot`);
        }
        // Row charts put each label on its own line above the bar: it must fit the chart width.
        for (const [name, part] of [['assetRange', 'chart'], ['assetScenario', 'chart'], ['gic', 'extra']]) {
          for (const m of renderFigure(name, {}, lang)[part].matchAll(/class="pc-row-label[^"]*" x="[\d.]+" y="[\d.]+">([^<]+)/g)) assert.ok(textWidth(m[1], 13) <= width - 16, `${lang} ${name} @${width}: "${m[1]}"`);
        }
      }
    }
  } finally { setChartWidth(720); }
});

test('GIC charts keep one colour per product: GIC teal (pc-a), hypothetical fund orange (pc-b)', () => {
  for (const lang of LANGS) {
    const r = renderFigure('gic', {}, lang);
    assert.match(r.legend, /pc-key pc-a pc-dash[^<]*<\/i>GIC</, 'line legend: GIC is pc-a');
    const bars = [...r.extra.matchAll(/<rect class="pc-bar (pc-\w+)"[^>]*><title>([^<]+)</g)].map(m => [m[1], m[2]]);
    assert.equal(bars.length, 5);
    assert.equal(bars[0][0], 'pc-a', 'tax chart: GIC interest row in the GIC colour');
    for (const [cls, title] of bars.slice(1)) assert.equal(cls, 'pc-b', 'tax chart: fund row in the fund colour: ' + title);
    assert.match(r.stats, /pc-stat--a.*pc-stat--b/s, 'headline tiles use the same colours');
  }
});

test('row-chart gridlines stay inside each bar band, clear of the row labels', () => {
  for (const name of ['assetRange', 'assetScenario']) {
    const svg = renderFigure(name, {}, 'en').chart;
    const labels = [...svg.matchAll(/class="pc-row-label[^"]*" x="[\d.]+" y="([\d.]+)"/g)].map(m => +m[1]);
    const lines = [...svg.matchAll(/class="pc-gridline[^"]*" x1="[\d.]+" x2="[\d.]+" y1="([\d.]+)" y2="([\d.]+)"/g)].map(m => [+m[1], +m[2]]);
    assert.ok(labels.length && lines.length);
    for (const y of labels) for (const [a, b] of lines) assert.ok(!(y - 13 < b && y + 4 > a), `${name}: gridline ${a}-${b} crosses label at ${y}`);
  }
});

test('the scenario picker is a labelled radio group with one choice checked', () => {
  for (const html of [home, zh]) {
    const b = block(html, 'assetScenario');
    assert.match(b, /<fieldset class="pc-field pc-choices" id="assetScenario-scenario"><legend>/);
    assert.equal([...b.matchAll(/type="radio" name="scenario"/g)].length, Object.keys(SCENARIOS).length);
    assert.equal([...b.matchAll(/type="radio" name="scenario" value="\w+" checked/g)].length, 1);
  }
});

test('RRSP/RRIF: chart compares balances before withdrawal tax from the deductible contribution (no apparent day-one loss)', () => {
  for (const lang of LANGS) {
    const r = renderFigure('gic', { account: 'rrsp' }, lang), t = STRINGS[lang];
    assert.ok(r.chart.includes(t['gic.contribution']), 'reference line names the deductible contribution');
    assert.ok(r.chart.includes(t['gic.basis.rrsp'].slice(0, 6)), 'title says before withdrawal tax');
    assert.match(r.extra, lang === 'en' ? /deducted from taxable income.*after that tax the GIC leaves \$[\d,]+ and the fund \$[\d,]+/s : /可从应税收入中扣除.*缴税后GIC剩下\$[\d,]+，基金剩下\$[\d,]+/s);
    assert.ok(r.table.includes(t['gic.colGicPre']) && r.table.includes(t['gic.colGicNet']), 'table shows both bases');
    // Both lines start on the contribution, not 30% below it, and end at the pre-tax balances.
    const series = JSON.parse(r.chart.match(/data-series="([^"]+)"/)[1].replace(/&quot;/g, '"'));
    assert.equal(series.length, 2);
    for (const s of series) assert.equal(s.p[0][1], 50000, s.n);
    assert.equal(Math.round(series[0].p.at(-1)[1]), Math.round(50000 * 1.0325 ** 10));
  }
});

test('GIC term: renewals are labelled as assumed, maturities are marked, and no early cash-in is implied', () => {
  for (const lang of LANGS) {
    const t = STRINGS[lang], r = renderFigure('gic', { years: 7, term: 5, renewRate: 2 }, lang);
    assert.ok(r.extra.includes(t['gic.termNote.renew'].replace('{termSpan}', lang === 'en' ? '5-year' : '5年').replace('{renew}', '2%').slice(0, 30)));
    assert.match(r.summary, lang === 'en' ? /Year 7 falls before the GIC’s next maturity in year 10/ : /第7年早于GIC的下一次到期（第10年）/);
    assert.ok(r.table.includes(t['gic.yearMat'].replace('{n}', '5')));
    assert.doesNotMatch(r.chart + r.summary, /if cashed in|若当年兑现/);
    assert.doesNotMatch(renderFigure('gic', { years: 10, term: 5 }, lang).summary, /next maturity|下一次到期/);
  }
  assert.equal(normalizeState('gic', { term: 30 }).term, 5, 'GIC terms are capped at five years');
});

test('deposit insurance: CDIC limit, category, member institution and BC credit unions are spelled out; large balances warn', () => {
  for (const [html, lang] of [[home, 'en'], [zh, 'zh']]) {
    const b = block(html, 'gic');
    assert.match(b, lang === 'en' ? /\$100,000 of principal and interest combined, per insured category.*per member institution/s : /本金加利息合计，每个受保类别.*每家成员机构最多保障\$100,000/s);
    assert.match(b, lang === 'en' ? /BC credit unions are not CDIC members.*CUDIC with no dollar limit/s : /卑诗省信用合作社不是CDIC成员.*CUDIC保障，没有金额上限/s);
    assert.match(renderFigure('gic', { amount: 90000 }, lang).summary, lang === 'en' ? /^Deposit insurance: CDIC covers/ : /^存款保险/);
    assert.doesNotMatch(renderFigure('gic', { amount: 50000 }, lang).summary, /Deposit insurance|存款保险/);
  }
});

test('tax-payment convention, published-figure middle case with a lower–higher range, and weak-case tax notes', () => {
  assert.equal(normalizeState('gic', {}).fundReturn, 6.6, 'middle case starts at the published RBF460 10-year return');
  for (const lang of LANGS) {
    const t = STRINGS[lang], nr = renderFigure('gic', {}, lang);
    assert.ok(nr.extra.includes(t['gic.payNote']), 'convention note is visible, not only in the disclosure');
    assert.ok(nr.legend.includes('pc-fundRange') && nr.chart.includes('pc-band pc-fundRange'), 'range band drawn and in the legend');
    assert.equal([...nr.stats.matchAll(/<dt>/g)].length, 4);
    assert.ok(renderFigure('gic', { fundReturn: -5 }, lang).extra.includes(t['gic.lossNote'].slice(0, 8)), 'unused capital loss explained');
    assert.ok(nr.extra.includes(t['gic.lossNoteLow'].split('}').at(-1).slice(0, 40)), 'lower-case loss explained (default lower case ends below cost)');
    assert.ok(!renderFigure('gic', { account: 'tfsa' }, lang).extra.includes(t['gic.lossNoteLow'].split('}').at(-1).slice(0, 40)), 'no loss note where no tax applies');
    assert.ok(renderFigure('gic', { income: 40000 }, lang).extra.includes(t['gic.negDivNote'].slice(0, 6)), 'negative dividend rate explained');
    assert.ok(!renderFigure('gic', { account: 'tfsa', income: 40000 }, lang).extra.includes(t['gic.negDivNote'].slice(0, 6)));
  }
});

test('GIC controls: amount and income up front; account-specific settings marked for hiding', () => {
  for (const html of [home, zh]) {
    const b = block(html, 'gic'), front = b.slice(0, b.indexOf('pc-more-inputs'));
    for (const key of ['account', 'amount', 'income', 'withdraw', 'years', 'term', 'gicRate', 'renewRate', 'fundReturn']) assert.ok(front.includes(`id="gic-${key}"`), key);
    assert.match(b, /<div data-when="nonreg" class="pc-field[^"]*"><label for="gic-income"/);
    assert.match(b, /<div data-when="rrsp" class="pc-field[^"]*"><label for="gic-withdraw"/);
  }
});

test('wording: dividend credit is non-refundable (not "no refund"); CDIC limit is shared within a category; intro matches the caveat', () => {
  for (const [html, lang] of [[home, 'en'], [zh, 'zh']]) {
    const note = renderFigure('gic', { income: 40000 }, lang).extra;
    assert.match(note, lang === 'en' ? /non-refundable.*increase a refund of tax already paid.*cannot reduce total tax below zero/ : /不可退还.*增加已缴税款.*退税.*不能使总税款低于零/);
    assert.doesNotMatch(note, /cannot create a refund|不能产生退税/);
    assert.match(renderFigure('gic', { amount: 90000 }, lang).summary, lang === 'en' ? /Other deposits in the same category at the same institution count toward the same limit/ : /同一机构同一类别中的其他存款也计入同一上限/);
    const b = block(html, 'gic');
    assert.match(b, lang === 'en' ? /Other eligible deposits you hold in the same category at the same institution count toward the same limit/ : /同一机构同一类别中持有的其他合资格存款也计入同一上限/);
    assert.match(html, lang === 'en' ? /Eligible GIC deposits at an insured institution are protected, principal and interest, within deposit-insurance limits/ : /在受保机构持有的合资格GIC存款，其本金和利息在存款保险限额内受保障/);
    assert.doesNotMatch(html, /its principal is protected|本金在存款保险限额内受保障。平衡/);
  }
});
