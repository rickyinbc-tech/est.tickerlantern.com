#!/usr/bin/env node
// Re-runs selected cache entries through the offline translator. The first
// bulk pass left some strings unchanged (mostly short UI labels and HTML
// fragments); this repairs those without touching reviewed terminology.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const CACHE_PATH = new URL('../../src/locales/zh/cache.json', import.meta.url);
const cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const clean = value => String(value).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const glossary = [
  ['偿债基金', '专项储备金'],
  ['每日例会', '每日计息惯例'],
  ['本金支付', '本金还款'],
  ['贷方', '贷款机构'],
  ['抵消账户', '冲抵账户'],
  ['抵消式', '冲抵式'],
  ['抵消余额', '冲抵余额'],
  ['按揭抵消', '房屋贷款冲抵'],
  ['偿付能力', '偿债能力'],
];
const post = value => { let out = clean(value); for (const [a, b] of glossary) out = out.replaceAll(a, b); return out; };
const hasEnglish = value => /[A-Za-z]{3,}/.test(value);
const CJK = /[\u3400-\u9fff]/;

const todo = [];
for (const [key, entry] of Object.entries(cache)) {
  const src = String(entry.src || '');
  if (!hasEnglish(src) || entry.zh !== src) continue;
  // Keep identifiers, tickers, URLs and dates exactly as written.
  const plain = src.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').trim();
  if (!/[a-z]{3,}/i.test(plain)) continue;
  if (/^(?:[A-Z0-9.%+−–-]{2,12}|[A-Z][A-Za-z&. -]{1,20}\([A-Z]+\))$/.test(plain)) continue;
  if (/^(?:https?:|www\.)/.test(plain)) continue;
  todo.push({ key, src });
}
console.log(`identity cache entries to retry: ${todo.length}`);

const SEP = '\u241f';
const BATCH = 1200;
const batches = [];
for (let index = 0; index < todo.length;) {
  const items = [];
  let size = 0;
  while (index < todo.length && size < BATCH) { items.push(todo[index++]); size += items.at(-1).src.length + 1; }
  batches.push(items);
}
let changed = 0;
for (const items of batches) {
  const params = new URLSearchParams({ client: 'dict-chrome-ex', sl: 'en', tl: 'zh-CN' });
  for (const item of items) params.append('q', item.src);
  let result;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch('https://clients5.google.com/translate_a/t?' + params, { headers: { 'User-Agent': 'Mozilla/5.0 TickerLanternLocaleBuilder/1.0' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      result = (Array.isArray(data) ? data : [data]).map(part => post(typeof part === 'string' ? part : String(part ?? '')));
      if (result.length !== items.length) throw new Error(`segment mismatch ${result.length}/${items.length}`);
      break;
    } catch (error) {
      if (attempt === 3) { console.warn(`batch failed: ${error.message}`); result = null; }
      else await new Promise(resolve => setTimeout(resolve, 800 * 2 ** attempt));
    }
  }
  if (!result) continue;
  items.forEach((item, index) => {
    const zh = result[index];
    if (!zh || zh === item.src) return;
    cache[item.key] = { src: item.src, zh };
    changed += 1;
  });
  await writeFile(CACHE_PATH, JSON.stringify(cache));
  console.log(`retried ${Math.min(todo.length, batches.slice(0, batches.indexOf(items) + 1).reduce((n, b) => n + b.length, 0))}/${todo.length}; changed ${changed}`);
}
console.log(`updated ${changed} cache entries`);
