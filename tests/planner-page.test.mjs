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
  assert.match(block(home, 'gic'), /not data for any fund/);
  assert.match(home, /returns and recoveries are not guaranteed/i);
  assert.doesNotMatch(home, /guaranteed (?:return|growth|recovery)/i);
});

test('caveats that separate history from hypothesis stay visible, not inside a disclosure', () => {
  for (const [html, pairs] of [[home, [['hypoReturns', 'Hypothetical and invented for teaching'], ['volatility', 'not market history and not a forecast'], ['assetRange', 'Not historical returns'], ['assetScenario', 'not any actual year'], ['gic', 'not data for any fund']]], [zh, [['hypoReturns', '为教学而虚构'], ['assetRange', '并非历史回报'], ['assetScenario', '并非任何实际年份'], ['gic', '并非任何基金的数据']]]]) {
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
  const main = zh.slice(zh.indexOf('<main'), zh.indexOf('</main>')).replace(/<ol class="pc-source-list">[\s\S]*?<\/ol>/, '').replace(/<(svg|title|desc)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');
  const english = main.match(/[A-Za-z][a-z]+(?:[ ,'’-]+[A-Za-z][a-z]+){2,}/g) || [];
  assert.deepEqual(english, [], 'English phrases left on the Chinese page');
  // Every control label, option and button is Chinese.
  for (const m of zh.matchAll(/<label for="[^"]+">(?:<span>)?([^<]+)/g)) assert.match(m[1], /[一-鿿]/, m[1]);
  for (const m of zh.matchAll(/<option value="([a-z]+)"[^>]*>([^<]+)/g)) if (!/^(?:tfsa)$/.test(m[1])) assert.match(m[2], /[一-鿿]/, m[2]);
  for (const name of Object.keys(FIGURES)) assert.match(renderFigure(name, {}, 'zh').summary, /[一-鿿]/, name);
});

test('the toolkit names, quotes or calculates no real fund: no fund names, codes, fund-company data or sources', async () => {
  const assets = [home, zh, ...await Promise.all(['planner.js', 'planner-sections.js', 'planner-strings.js', 'planner-math.js'].map(f => readFile('dist/' + f, 'utf8')))].join('\n');
  assert.doesNotMatch(assets, /RBC[^<.]{0,40}(?:Balanced|Fund|Portfolio)|RBF\d{3}|rbcgam/i);
  assert.ok(!(await readdir('src')).includes('planner-fund-data.js'));
  // The invented sequence must not be the real fund's published calendar returns.
  // Compared by hash so the real fund's returns are never written into this repository.
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
