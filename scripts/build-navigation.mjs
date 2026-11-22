// Final build step: apply the current site navigation to every static page,
// English and Chinese, after all other generators have written dist/.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { applySiteNavigation } from '../src/site-navigation.js';

const urlFor = file => {
  const rel = '/' + relative('dist', file).split('\\').join('/');
  if (rel === '/index.html') return '/';
  if (rel.endsWith('/index.html')) return rel.slice(0, -10);
  return rel.slice(0, -5);
};
let changed = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(path, 'utf8'), next = applySiteNavigation(html, urlFor(path));
    if (next !== html) { await writeFile(path, next); changed++; }
  }
}
await walk('dist');
console.log('Site navigation applied to', changed, 'pages');
