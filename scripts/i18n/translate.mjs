#!/usr/bin/env node
// Offline translation pipeline for the Simplified Chinese edition.
// Reads {units:[{id,text}]} and writes {translations:{id:text}}.
// Google's public gtx endpoint is used only while generating committed locale
// data; the production build never calls it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/i18n/translate.mjs <units.json> <out.json>');
  process.exit(1);
}
const CACHE_PATH = new URL('../../src/locales/zh/cache.json', import.meta.url);
const SEP = '<div data-tl-sep="1"></div>';
const CONCURRENCY = Number(process.env.TL_CONCURRENCY || 6);
const MAX_CHARS = Number(process.env.TL_BATCH_CHARS || 3200);
// The gtx single endpoint rate-limits bursts with HTTP 429. The Chrome
// dictionary endpoint accepts repeated q parameters, which lets us keep the
// same batching and is far more tolerant of bulk offline work.
const HOSTS = [
  'https://clients5.google.com/translate_a/t',
];

const sha = value => createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const collapse = value => String(value).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

// Clear, repeatable fixes for phrases the generic engine handles poorly.
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
  ['阴性细胞', '负值单元格'],
  ['阳性细胞', '正值单元格'],
  ['零细胞', '零值单元格'],
  ['细胞', '单元格'],
  ['生长', '增长'],
  ['终端', '期末'],
  ['抵消', '冲抵'],
  ['入门市盈率', '起始市盈率'],
  ['条目市盈率', '起始市盈率'],
];

function clean(value) {
  let out = collapse(value);
  for (const [from, to] of glossary) out = out.replaceAll(from, to);
  return out;
}

let cache = {};
if (existsSync(CACHE_PATH)) cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'));

const input = JSON.parse(await readFile(inputPath, 'utf8'));
const units = input.units || input;
const translations = {};
const todo = [];
let hit = 0;
for (const unit of units) {
  const id = String(unit.id);
  const text = String(unit.text ?? '');
  if (!text.trim()) { translations[id] = text; continue; }
  const key = sha(text);
  if (cache[key]?.src === text && cache[key]?.zh) { translations[id] = cache[key].zh; hit++; continue; }
  todo.push({ id, text, key });
}
console.log(`translation units: ${units.length}; cached: ${hit}; to translate: ${todo.length}`);

function batches() {
  const list = [];
  let current = [], size = 0;
  for (const item of todo) {
    const length = item.text.length + SEP.length;
    if (current.length && size + length > MAX_CHARS) { list.push(current); current = []; size = 0; }
    if (length > MAX_CHARS) { list.push([item]); continue; }
    current.push(item); size += length;
  }
  if (current.length) list.push(current);
  return list;
}

async function requestBatch(items, attempt = 0) {
  const params = new URLSearchParams({ client: 'dict-chrome-ex', sl: 'en', tl: 'zh-CN' });
  for (const item of items) params.append('q', item.text);
  const host = HOSTS[attempt % HOSTS.length];
  const url = host + '?' + params;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 TickerLanternLocaleBuilder/1.0' } });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const parts = (Array.isArray(data) ? data : [data]).map(part => {
      if (typeof part === 'string') return part;
      if (Array.isArray(part)) return part.map(piece => (Array.isArray(piece) ? piece[0] : piece)).join('');
      return String(part ?? '');
    });
    if (parts.length !== items.length) throw new Error(`segment mismatch ${parts.length}/${items.length}`);
    return parts.map(clean);
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(800 * 2 ** attempt + Math.random() * 400);
    return requestBatch(items, attempt + 1);
  }
}

async function translateOne(item) {
  const parts = await requestBatch([item]);
  return parts[0];
}

let completed = 0;
const list = batches();
console.log(`batches: ${list.length}`);
let cursor = 0;
async function worker() {
  while (cursor < list.length) {
    const batch = list[cursor++];
    let parts;
    try {
      parts = await requestBatch(batch);
    } catch (error) {
      // A failed batch is retried one segment at a time so one bad string does
      // not discard the rest of the page.
      console.warn(`batch fallback (${batch.length} units): ${error.message}`);
      parts = [];
      for (const item of batch) {
        try { parts.push(await translateOne(item)); }
        catch (inner) { console.warn(`unit failed ${item.id}: ${inner.message}`); parts.push(null); }
      }
    }
    batch.forEach((item, index) => {
      const zh = parts[index];
      if (zh == null) return;
      translations[item.id] = zh;
      cache[item.key] = { src: item.text, zh };
    });
    completed += batch.length;
    if (completed % 200 < batch.length) {
      await mkdir(new URL('../../src/locales/zh/', import.meta.url), { recursive: true });
      await writeFile(CACHE_PATH, JSON.stringify(cache));
      console.log(`translated ${completed}/${todo.length}`);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker));

await mkdir(new URL('../../src/locales/zh/', import.meta.url), { recursive: true });
await writeFile(CACHE_PATH, JSON.stringify(cache));
await writeFile(outputPath, JSON.stringify({ translations }, null, 0));
console.log(`wrote ${outputPath}; cache entries: ${Object.keys(cache).length}`);
