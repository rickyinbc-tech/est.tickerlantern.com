// Dependency-free SVG charts for the planner toolkit. They are pure string
// functions so the build pre-renders each default chart and the browser
// re-renders the same markup when an input changes.
let W = 720, H = 360;
const M = { top: 18, right: 22, bottom: 44, left: 72 };
/** Narrow screens re-render at a smaller width so text stays legible. */
export function setChartWidth(width) { W = width; H = width < 560 ? 340 : 360; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = n => Math.round(n * 10) / 10;

/** Round tick step: 1, 2, 2.5 or 5 × 10^k, giving about `count` intervals. */
export function niceTicks(min, max, count = 5) {
  if (!(max > min)) max = min + 1;
  const raw = (max - min) / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, ticks = [];
  for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(+v.toFixed(10));
  return { lo, hi, ticks };
}

function frame({ id, title, desc, body, height }) {
  return `<svg class="pc-svg" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="${id}-t ${id}-d" focusable="false" preserveAspectRatio="xMidYMid meet"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${body}</svg>`;
}

function axes({ y, xs, ys, xFormat, yFormat, xTicks, xLabel, yLabel, height }) {
  const iw = W - M.left - M.right, ih = height - M.top - M.bottom;
  let out = '';
  for (const t of y.ticks) out += `<line class="pc-gridline${t === 0 ? ' pc-zero' : ''}" x1="${M.left}" x2="${M.left + iw}" y1="${r1(ys(t))}" y2="${r1(ys(t))}"/><text class="pc-tick" x="${M.left - 10}" y="${r1(ys(t)) + 4}" text-anchor="end">${esc(yFormat(t))}</text>`;
  for (const t of xTicks) out += `<text class="pc-tick" x="${r1(xs(t))}" y="${M.top + ih + 20}" text-anchor="middle">${esc(xFormat(t))}</text>`;
  out += `<line class="pc-axis" x1="${M.left}" x2="${M.left + iw}" y1="${M.top + ih}" y2="${M.top + ih}"/>`;
  if (xLabel) out += `<text class="pc-label" x="${M.left + iw / 2}" y="${height - 4}" text-anchor="middle">${esc(xLabel)}</text>`;
  if (yLabel) out += `<text class="pc-label" x="14" y="${M.top + ih / 2}" text-anchor="middle" transform="rotate(-90 14 ${M.top + ih / 2})">${esc(yLabel)}</text>`;
  return out;
}

/**
 * Line / area chart. `series`: [{ key, name, points: [[x, y]], kind: 'line'|'area'|'dash' }].
 * `bands`: [{ key, lower: [[x,y]], upper: [[x,y]] }]. The value axis includes 0
 * unless `zeroBased: false` is passed (only for charts where 0 is meaningless).
 */
export function lineChart({ id, title, desc, series, bands = [], xFormat = String, yFormat = String, xLabel, yLabel, zeroBased = true, xTickEvery, refLines = [], markers = [], height, unit = 'money', xKind = 'auto' }) {
  height = height || H;
  const all = [...series.flatMap(s => s.points), ...bands.flatMap(b => [...b.lower, ...b.upper]), ...refLines.map(r => [null, r.y]), ...markers.map(m => [m.x, m.y])];
  const xsAll = all.filter(p => p[0] != null).map(p => p[0]), ysAll = all.map(p => p[1]);
  const xMin = Math.min(...xsAll), xMax = Math.max(...xsAll);
  const y = niceTicks(zeroBased ? Math.min(0, ...ysAll) : Math.min(...ysAll), Math.max(...ysAll), 5);
  const iw = W - M.left - M.right, ih = height - M.top - M.bottom;
  const xs = v => M.left + (xMax === xMin ? 0 : (v - xMin) / (xMax - xMin) * iw);
  const ys = v => M.top + ih - (v - y.lo) / (y.hi - y.lo) * ih;
  const every = Math.max(xTickEvery || 1, Math.ceil((xMax - xMin) / (W < 560 ? 5 : 8)));
  const xTicks = []; for (let v = xMin; v <= xMax; v += every) xTicks.push(v);
  if (xTicks.at(-1) !== xMax && (xMax - xTicks.at(-1)) > every / 2) xTicks.push(xMax);
  const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + r1(xs(p[0])) + ' ' + r1(ys(p[1]))).join('');
  let body = axes({ y, xs, ys, xFormat, yFormat, xTicks, xLabel, yLabel, height });
  for (const b of bands) body += `<path class="pc-band pc-${b.key}" d="${path(b.upper)}${b.lower.slice().reverse().map(p => 'L' + r1(xs(p[0])) + ' ' + r1(ys(p[1]))).join('')}Z"/>`;
  for (const s of series) {
    if (s.kind === 'area') body += `<path class="pc-area pc-${s.key}" d="${path(s.points)}L${r1(xs(s.points.at(-1)[0]))} ${r1(ys(Math.max(0, y.lo)))}L${r1(xs(s.points[0][0]))} ${r1(ys(Math.max(0, y.lo)))}Z"/>`;
    body += `<path class="pc-line pc-${s.key}${s.kind === 'dash' ? ' pc-dash' : ''}" d="${path(s.points)}"/>`;
  }
  for (const r of refLines) body += `<line class="pc-ref" x1="${M.left}" x2="${M.left + iw}" y1="${r1(ys(r.y))}" y2="${r1(ys(r.y))}"/><text class="pc-ref-label" x="${M.left + iw - 4}" y="${r1(ys(r.y)) - 6}" text-anchor="end">${esc(r.label)}</text>`;
  for (const m of markers) body += `<circle class="pc-marker" cx="${r1(xs(m.x))}" cy="${r1(ys(m.y))}" r="7"/><text class="pc-marker-label" x="${r1(xs(m.x)) + 12}" y="${r1(ys(m.y)) - 10}">${esc(m.label)}</text>`;
  body += `<g class="pc-guide" hidden><line class="pc-guide-line" y1="${M.top}" y2="${M.top + ih}"/></g>`;
  const data = esc(JSON.stringify(series.map(s => ({ n: s.name, p: s.points.map(p => [p[0], Math.round(p[1] * 100) / 100]) }))));
  return frame({ id, title, desc, body, height }).replace('<svg ', `<svg data-unit="${unit}" data-x-kind="${xKind}" data-series="${data}" data-x-min="${xMin}" data-x-max="${xMax}" data-plot-left="${M.left}" data-plot-width="${iw}" data-plot-top="${M.top}" data-plot-height="${ih}" tabindex="0" `);
}

/** Rough text width for the chart font: about 0.6em per character. */
export const textWidth = (text, size) => String(text).length * size * 0.6;
/** Split a label into at most two lines at the space nearest its middle. */
export function twoLines(label) {
  const words = String(label).split(' ');
  if (words.length < 2) return [String(label)];
  let best = 1, diff = Infinity;
  for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (d < diff) { diff = d; best = i; } }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** Vertical bars, grouped by category. Negative values extend below a drawn zero line. */
export function barChart({ id, title, desc, categories, series, yFormat = String, yLabel, height, valueLabels = true, shortCategories }) {
  // Narrow charts with many bars use short labels and drop in-bar values (the table keeps them).
  const crowded = W < 560 && categories.length > 7;
  const labels = crowded && shortCategories ? shortCategories : categories;
  if (crowded) valueLabels = false;
  height = Math.round((height || H) * (W < 560 ? 1.1 : 1));
  const vals = series.flatMap(s => s.values);
  // Headroom keeps value labels on the tallest bar inside the chart.
  const y = niceTicks(Math.min(0, ...vals) * 1.1, Math.max(0, ...vals) * 1.12, 5);
  const iw = W - M.left - M.right, ih = height - M.top - M.bottom;
  const ys = v => M.top + ih - (v - y.lo) / (y.hi - y.lo) * ih;
  const band = iw / categories.length, gap = band * .22, bw = (band - gap) / series.length;
  // Category labels wider than their slot wrap onto two lines at a smaller size.
  const wrap = labels.some(l => textWidth(l, 13) > band - 6);
  let body = axes({ y, xs: () => 0, ys, xFormat: String, yFormat, xTicks: [], yLabel, height });
  labels.forEach((l, i) => {
    const x = r1(M.left + band * i + band / 2), base = M.top + ih + 20;
    body += wrap
      ? `<text class="pc-tick pc-tick--wrap" x="${x}" y="${base - 2}" text-anchor="middle">${twoLines(l).map((line, n) => `<tspan x="${x}" dy="${n ? 15 : 0}">${esc(line)}</tspan>`).join('')}</text>`
      : `<text class="pc-tick" x="${x}" y="${base}" text-anchor="middle">${esc(l)}</text>`;
  });
  series.forEach((s, si) => s.values.forEach((v, i) => {
    const x = M.left + band * i + gap / 2 + bw * si, top = ys(Math.max(0, v)), h = Math.abs(ys(v) - ys(0));
    body += `<rect class="pc-bar pc-${s.key}${v < 0 ? ' pc-neg' : ''}" x="${r1(x)}" y="${r1(top)}" width="${r1(bw - 2)}" height="${r1(Math.max(h, .5))}"><title>${esc(categories[i] + ' · ' + s.name + ': ' + yFormat(v))}</title></rect>`;
    if (valueLabels) body += `<text class="pc-value" x="${r1(x + (bw - 2) / 2)}" y="${r1(v >= 0 ? top - 6 : top + h + 14)}" text-anchor="middle">${esc(yFormat(v))}</text>`;
  }));
  return frame({ id, title, desc, body, height }).replace('<svg ', `<svg data-bars="${categories.length}" `);
}

/** Legend markup shared by charts and tables. */
export const legend = items => `<ul class="pc-legend">${items.map(i => `<li><i class="pc-key pc-${i.key}${i.dash ? ' pc-dash' : ''}" aria-hidden="true"></i>${esc(i.name)}</li>`).join('')}</ul>`;

/** Accessible data table that mirrors a chart. */
export function dataTable({ caption, head, rows }) {
  return `<div class="pc-table-wrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="pc-table"><caption>${esc(caption)}</caption><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
