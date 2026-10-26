#!/usr/bin/env node
// Builds the Chinese search index from the English index and the committed
// translation memory. No network access is used here.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const cache = JSON.parse(await readFile('src/locales/zh/cache.json', 'utf8'));
const index = JSON.parse(await readFile('dist/search-index.json', 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const FIXES = [
  ['股票行情灯笼', 'TickerLantern'], ['股票代码灯笼', 'TickerLantern'], ['股票灯笼', 'TickerLantern'],
  ['阴性细胞', '负值单元格'], ['阳性细胞', '正值单元格'], ['零细胞', '零值单元格'],
  ['细胞', '单元格'], ['生长', '增长'], ['终端', '期末'], ['抵消', '冲抵'],
  ['入门市盈率', '起始市盈率'], ['条目市盈率', '起始市盈率'],
];
const fix = value => FIXES.reduce((text, [from, to]) => text.split(from).join(to), value);
const zh = value => {
  if (!value) return value;
  const hit = cache[sha(value)];
  return hit?.src === value && hit.zh ? fix(hit.zh) : value;
};
const pageExists = url => {
  const path = url.split('#')[0];
  if (path === '/') return existsSync('src/locales/zh/pages/index.html');
  if (path.endsWith('/')) return existsSync('src/locales/zh/pages' + path + 'index.html');
  return existsSync('src/locales/zh/pages' + path + '.html');
};
const localizedURL = url => {
  const path = url.split('#')[0];
  const hash = url.includes('#') ? '#' + url.split('#').slice(1).join('#') : '';
  if (path === '/notes/research' || path === '/gics') return url;
  if (!pageExists(url)) return url;
  if (path === '/') return '/zh/' + hash;
  return '/zh' + url;
};
const documents = index.documents.map(doc => {
  const out = { ...doc, url: localizedURL(doc.url) };
  // Keep the English title in the hidden keyword field so an English query on
  // the Chinese search page still finds the article.
  const english = [doc.keywords, doc.title, doc.description].filter(Boolean).join(' ').slice(0, 4000);
  for (const key of ['title', 'description', 'body', 'parentTitle', 'category', 'evidence']) {
    if (out[key]) out[key] = zh(out[key]);
  }
  out.keywords = [zh(doc.keywords || ''), english].filter(Boolean).join(' ');
  return out;
});
await writeFile('src/locales/zh/search-index.json', JSON.stringify({ ...index, documents }));
console.log(`Chinese search index: ${documents.length} entries`);
