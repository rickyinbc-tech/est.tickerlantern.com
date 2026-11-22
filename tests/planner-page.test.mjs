import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { FIGURES, renderFigure, normalizeState } from '../src/planner-sections.js';
import { applySiteNavigation, navLinks } from '../src/site-navigation.js';

const home = await readFile('dist/index.html', 'utf8');
const SECTIONS = ['why', 'compounding', 'contributions', 'volatility', 'balanced-example', 'diversification', 'fees', 'mutual-funds', 'accounts', 'sources'];

test('toolkit homepage has every conversation section and a pre-rendered figure for every interactive figure', () => {
  for (const id of SECTIONS) assert.ok(home.includes(`id="${id}"`), id);
  for (const name of Object.keys(FIGURES)) {
    const start = home.indexOf(`data-figure="${name}" id="fig-${name}-wrap"`);
    assert.ok(start > 0, name);
    const block = home.slice(start, home.indexOf('</figure>', start));
    assert.ok(/data-out="summary"[^>]*>[^<]{20,}/.test(block), name + ' summary');
    if (name !== 'units') assert.ok(block.includes('class="pc-svg"') && block.includes('role="img"'), name + ' chart');
  }
});

test('every citation resolves to a listed https source, and every source is cited', () => {
  const cited = new Set([...home.matchAll(/href="#src-([a-z0-9-]+)"/g)].map(m => m[1]));
  const listed = [...home.matchAll(/<li id="src-([a-z0-9-]+)">[\s\S]*?href="([^"]+)"/g)];
  assert.ok(listed.length >= 20);
  for (const [, key, url] of listed) { assert.ok(url.startsWith('https://'), key); assert.ok(cited.has(key), 'uncited source ' + key); }
  for (const key of cited) assert.ok(listed.some(l => l[1] === key), 'missing source ' + key);
});

test('illustrations, historical data and published fund data are labelled distinctly', () => {
  const badge = name => home.match(new RegExp(`data-figure="${name}" id="fig-${name}-wrap">\\s*<div class="pc-figure__head"><span class="pc-badge [^"]+">([^<]+)<`))[1];
  assert.equal(badge('inflation'), 'Historical data');
  for (const name of ['cash', 'compounding', 'contributions', 'dca', 'volatility', 'recovery', 'diversification', 'mix', 'fees']) assert.equal(badge(name), 'Illustration', name);
  assert.equal(badge('hypoReturns'), 'Illustration'); assert.equal(badge('hypoPath'), 'Illustration');
  assert.equal(badge('rrsp'), '2026 rules'); assert.equal(badge('taxtypes'), '2026 rules');
  assert.match(home, /Hypothetical and invented for teaching\. Not the results of any real fund/);
  assert.match(home, /returns and recoveries are not guaranteed/i);
  assert.doesNotMatch(home, /guaranteed (?:return|growth|recovery)/i);
});

test('both tax tools state the enacted BC 5.60% status beside the tool, citing the legislative record', () => {
  for (const name of ['rrsp', 'taxtypes']) {
    const start = home.indexOf(`data-figure="${name}" id="fig-${name}-wrap"`), block = home.slice(start, home.indexOf('</figure>', start));
    assert.match(block, /BC rate status:<\/strong> the 5\.60% lowest BC rate is law for 2026\. Bill 2[^<]*Royal Assent on 16 April 2026[^<]*<a class="pc-cite" href="#src-bc-budget"/, name);
    assert.match(block, /href="#src-bc-bill2"/); assert.match(block, /href="#src-bc-hansard-ra"/);
  }
  assert.match(home, /lims\.leg\.bc\.ca\/pdms\/ldp\/43rd2nd\/3rd_read\/gov02-3\.htm/);
});

test('review fixes: dead fee notice gone, asset mix uses RBC categories, cautions and rough-guide wording surface', () => {
  assert.match(renderFigure('rrsp', {}).summary, /^Rough guide, not a tax calculation:/);
  assert.match(renderFigure('taxtypes', { income: 40000 }).summary, /^Caution: at or below \$44,952/);
  assert.match(renderFigure('taxtypes', { income: 200000 }).summary, /^Caution: between about \$181,440/);
  assert.doesNotMatch(renderFigure('taxtypes', { income: 100000 }).summary, /Caution/);
  assert.match(renderFigure('rrsp', { incomeLater: 30000 }).summary, /^Caution:/);
  assert.match(renderFigure('compounding', { rate: 0 }).summary, /growth is 0% of the balance/);
  assert.doesNotMatch(home, /Most of the final balance/);
  assert.doesNotMatch(home, /protecting what those dollars/);
  assert.match(home, /aims for growth that can help offset inflation over time, with the risk that values fall/);
});

test('RRSP cautions check the whole contribution and withdrawal income ranges, not just their endpoints', () => {
  const caution = raw => { const s = renderFigure('rrsp', raw).summary; return s.startsWith('Caution') ? s.slice(0, s.indexOf('Rough guide')) : ''; };
  assert.equal(caution({}), '', 'default: $85k–$95k and $50k–$53k avoid both zones');
  assert.equal(caution({ incomeNow: 120000, pretax: 10000, incomeLater: 70000, spread: 10 }), '');
  // Endpoints outside the zone, but the $10,000 deduction reaches down into it.
  assert.match(caution({ incomeNow: 50000, pretax: 10000 }), /^Caution: the income range the contribution is deducted from \(\$40,000 to \$50,000\) reaches \$44,952/);
  // Withdrawal income starts below the federal zone and ends above it: spans it entirely.
  assert.match(caution({ incomeNow: 120000, pretax: 30000, incomeLater: 170000, spread: 1 }), /each withdrawal year’s income range \(\$170,000 to \$[\d,]+\) overlaps about \$181,440/);
  // Both sides hit one zone: plural wording; one range spans both zones: two cautions.
  assert.match(caution({ incomeNow: 250000, pretax: 30000, incomeLater: 170000, spread: 1 }), /and each withdrawal year’s income range[^.]*\) overlap about/);
  const both = caution({ incomeNow: 300000, pretax: 280000, incomeLater: 20000 });
  assert.match(both, /reach \$44,952 or less/); assert.match(both, /overlaps about \$181,440/);
  // Boundary: income exactly at $181,440 is below the phase-down; a deduction from above it is not.
  assert.equal(caution({ incomeNow: 181440, pretax: 10000, incomeLater: 70000 }), '');
  assert.match(caution({ incomeNow: 191440, pretax: 10000, incomeLater: 70000 }), /\$181,440 to \$191,440/);
});

test('random and extreme inputs never produce NaN or Infinity in any figure', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [name, fig] of Object.entries(FIGURES)) {
    for (let i = 0; i < 60; i++) {
      const raw = {};
      for (const [key, spec] of Object.entries(fig.inputs)) raw[key] = Array.isArray(spec[1]) ? spec[1][Math.floor(rnd() * spec[1].length)] : i % 10 === 0 ? (rnd() < .5 ? -1e9 : 1e9) : spec[1] + rnd() * (spec[2] - spec[1]);
      const out = renderFigure(name, raw), text = JSON.stringify(out);
      assert.doesNotMatch(text, /NaN|Infinity|undefined/, name + ' ' + JSON.stringify(raw));
    }
  }
  assert.equal(normalizeState('fees', { feeA: 'abc' }).feeA, 2);
  assert.equal(normalizeState('compounding', { years: 1e6 }).years, 50);
});

test('the toolkit names, quotes or calculates no real fund: no fund names, codes, fund-company data or sources', async () => {
  const assets = [home, ...await Promise.all(['planner.js', 'planner-sections.js', 'planner-strings.js', 'planner-math.js'].map(f => readFile('dist/' + f, 'utf8')))].join('\n');
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
    assert.match(html, /href="\/(?:zh\/)?valuations"/, file);
  }
  assert.match(home, /<a href="\/" aria-current="page">Planner toolkit<\/a><a href="\/valuations">Valuations<\/a>/);
  assert.equal(applySiteNavigation('<a aria-current="page" href="/zh/">指数</a>', '/zh/valuations'), navLinks('/zh/valuations'));
});

test('Chinese homepage stays an explicitly English page until a reviewed translation exists', async () => {
  const zh = await readFile('dist/zh/index.html', 'utf8');
  assert.match(zh, /data-zh-fallback="true"/);
  assert.match(zh, /tl-translation-banner/);
  assert.match(zh, /<main id="main" lang="en" data-tl-ignore>/);
  assert.match(zh, /<title>英文页面：/);
  const zhVal = await readFile('dist/zh/valuations.html', 'utf8');
  assert.doesNotMatch(zhVal, /data-zh-fallback/);
});

test('one conversation at a time: every panel has a rail link, a pager and talking points; the first is shown by default', () => {
  const panels = [...home.matchAll(/<section class="pc-section pc-panel( is-active)?" id="([a-z-]+)"/g)];
  assert.equal(panels.length, 9);
  assert.equal(panels.filter(p => p[1]).length, 1); assert.equal(panels[0][2], 'why'); assert.ok(panels[0][1]);
  const rail = home.slice(home.indexOf('<nav class="pc-rail"'), home.indexOf('</nav>', home.indexOf('<nav class="pc-rail"')));
  for (const [, , id] of panels) {
    assert.ok(rail.includes(`href="#${id}"`), 'rail link ' + id);
    const block = home.slice(home.indexOf(`id="${id}"`), home.indexOf('</section>', home.indexOf(`id="${id}"`)));
    assert.match(block, /class="pc-pager"/, 'pager ' + id);
    assert.match(block, /class="pc-notes" aria-label="Talking points"/, 'talking points ' + id);
  }
  // The boot script must load before the module so the page never flashes all nine panels.
  assert.ok(home.indexOf('src="/planner-boot.js"') > 0 && home.indexOf('src="/planner-boot.js"') < home.indexOf('src="/planner.js"'));
  assert.match(home, /id="notes-toggle" aria-pressed="false"/);
});

test('caveats that separate history from hypothesis stay visible, not inside a disclosure', () => {
  for (const [name, text] of [['hypoReturns', 'Hypothetical and invented for teaching'], ['volatility', 'not market history and not a forecast'], ['rrsp', 'BC rate status:'], ['taxtypes', 'BC rate status:'], ['compounding', 'no rate of return is guaranteed']]) {
    const start = home.indexOf(`id="fig-${name}-wrap"`), block = home.slice(start, home.indexOf('</figure>', start));
    const at = block.indexOf(text), details = block.indexOf('<details class="pc-about"');
    assert.ok(at > 0, name); assert.ok(details < 0 || at < details, name + ' caveat must sit before the disclosure');
  }
});

test('every input is still rendered; extras live under "More settings"', () => {
  for (const [name, fig] of Object.entries(FIGURES)) {
    const start = home.indexOf(`id="fig-${name}-wrap"`), block = home.slice(start, home.indexOf('</figure>', start));
    for (const key of Object.keys(fig.inputs)) assert.ok(block.includes(`id="${name}-${key}"`), `${name}-${key}`);
    if (Object.keys(fig.inputs).length > 3) assert.match(block, /class="pc-more-inputs"/, name);
  }
});

test('homepage stays CSP-clean: no inline scripts, styles or style attributes', () => {
  assert.doesNotMatch(home, /<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>/);
  assert.doesNotMatch(home, /<style[\s>]/);
  assert.doesNotMatch(home, /\sstyle="/);
});

test('bar-chart category labels fit their slot at phone width (tax chart labels wrapped, not colliding)', async () => {
  const { setChartWidth, textWidth } = await import('../src/planner-charts.js');
  try {
    for (const width of [320, 343, 358]) { // chart widths inside 360–390px phones
      setChartWidth(width);
      for (const name of ['taxtypes', 'dca', 'rrsp', 'recovery', 'hypoReturns']) {
        const svg = renderFigure(name, {}).chart, bars = +svg.match(/data-bars="(\d+)"/)[1];
        const slot = (width - 72 - 22) / bars;
        const lines = [...svg.matchAll(/<text class="pc-tick( pc-tick--wrap)?" x="[\d.]+" y="[\d.]+" text-anchor="middle">(.*?)<\/text>/g)]
          .flatMap(([, wrap, inner]) => (inner.includes('<tspan') ? [...inner.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map(m => m[1]) : [inner]).map(t => [t, wrap ? 12 : 13]));
        for (const [text, size] of lines) assert.ok(textWidth(text, size) <= slot + 2, `${name} @${width}: "${text}" wider than ${slot.toFixed(0)}px slot`);
      }
      assert.match(renderFigure('taxtypes', {}).chart, /<tspan[^>]*>Eligible<\/tspan><tspan[^>]*>div\.<\/tspan>/);
    }
    setChartWidth(720);
    assert.doesNotMatch(renderFigure('taxtypes', {}).chart, /pc-tick--wrap/, 'desktop labels stay on one line');
  } finally { setChartWidth(720); }
});
