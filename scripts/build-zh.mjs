import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { studyPages } from '../src/seo.js';

const ORIGIN = 'https://tickerlantern.com';
const DIST = 'dist';
const ZH_PAGES = 'src/locales/zh/pages';
const ZH_DICTS = 'src/locales/zh/dicts';
const metaPath = 'src/locales/zh/meta.json';
const meta = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, 'utf8')) : {};
const revision = (meta.sourceRevision || '').slice(0, 12);

function urlFor(file) {
  const rel = '/' + relative(DIST, file).split('\\').join('/');
  if (rel === '/index.html') return '/';
  if (rel.endsWith('/index.html')) return rel.slice(0, -10);
  return rel.slice(0, -5);
}

function zhUrlFor(url) {
  return url === '/' ? '/zh/' : '/zh' + url;
}

function zhRelative(url) {
  if (url === '/') return 'index.html';
  if (url.endsWith('/')) return url.slice(1) + 'index.html';
  return url.slice(1) + '.html';
}

function dictKey(url) {
  if (url === '/') return 'home';
  const clean = url.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-');
  return clean || 'home';
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'zh') continue;
      yield* htmlFiles(path);
    } else if (entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

function hasHeader(html) {
  return html.includes('class="tl-header__inner"');
}

function injectAssets(html, zh) {
  if (html.includes('/locale.css')) return html;
  const assets = `<link rel="stylesheet" href="/locale.css"><script src="/locale-preference.js"></script>${zh ? '<script src="/zh-runtime.js" defer></script>' : ''}`;
  return html.replace('</head>', assets + '</head>');
}

function alternateHead(html, enPath, zhPath, zh) {
  if (html.includes('<link rel="alternate" hreflang="zh-Hans"')) return html;
  const alternates = `<link rel="alternate" hreflang="en" href="${ORIGIN}${enPath}"><link rel="alternate" hreflang="zh-Hans" href="${ORIGIN}${zhPath}"><link rel="alternate" hreflang="x-default" href="${ORIGIN}${enPath}">`;
  const locale = zh
    ? '<meta property="og:locale" content="zh_CN"><meta property="og:locale:alternate" content="en_US">'
    : '<meta property="og:locale" content="en_US"><meta property="og:locale:alternate" content="zh_CN">';
  const source = zh && revision ? `<meta name="translation-source" content="${revision}"><meta name="translation-method" content="machine-assisted, terminology-reviewed">` : '';
  return html.replace('</head>', alternates + locale + source + '</head>');
}

function switcher(href, lang, label, title, menu = false) {
  const hreflang = lang === 'zh' ? 'zh-Hans' : 'en';
  return `<a class="tl-lang${menu ? ' tl-lang--menu' : ''}" href="${href}" hreflang="${hreflang}" lang="${hreflang}" data-tl-lang="${lang}" title="${title}" data-tl-ignore>${label}</a>`;
}

function injectSwitcher(html, href, lang, label, title) {
  if (!hasHeader(html) || html.includes('data-tl-lang="' + lang + '"')) return html;
  const desktop = switcher(href, lang, label, title);
  const mobile = switcher(href, lang, label, title, true).replace('class="tl-lang tl-lang--menu"', 'class="tl-lang tl-lang--menu"');
  html = html.replace('</div></header>', desktop + '</div></header>');
  // The menu's aria-label is translated on Chinese pages and attribute order
  // differs, so find the first nav inside the mobile menu instead.
  return html.replace(/(<details class="tl-menu"><summary>[^<]*<\/summary><nav\b[^>]*>)/, '$1' + mobile);
}

function rewriteInternal(html) {
  const keep = /^\/(?:zh(?:\/|$)|notes(?:\/|$)|gics(?:\/|$)|api(?:\/|$)|data(?:\/|$)|zh-locales(?:\/|$)|favicon|social|sitemap|robots)/;
  const asset = /\.(?:css|js|json|svg|png|jpe?g|webp|gif|xml|txt|csv|pdf|ico|woff2?)$/i;
  return html.replace(/(href|action)="(\/[^"]*)"/g, (match, attr, url) => {
    if (keep.test(url) || asset.test(url) || url.startsWith('//')) return match;
    return `${attr}="/zh${url}"`;
  });
}

function localizeJsonLd(html, zhPath) {
  const zhURL = ORIGIN + zhPath;
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, body) => {
    let data;
    try { data = JSON.parse(body); } catch { return match; }
    const local = value => {
      if (typeof value !== 'string' || !value.startsWith(ORIGIN)) return value;
      const rest = value.slice(ORIGIN.length);
      if (!rest || rest === '/' || rest.startsWith('/#')) return value;
      if (/^\/(?:zh|notes|gics|api|data)\b/.test(rest)) return value;
      if (/\.(?:png|jpe?g|svg|webp|gif|css|js|json|xml|txt|csv|pdf)(?:[?#]|$)/i.test(rest)) return value;
      return ORIGIN + '/zh' + rest;
    };
    const walk = node => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && ['url', '@id', 'mainEntityOfPage', 'image', 'item'].includes(key)) node[key] = local(value);
        else if (typeof value === 'object') walk(value);
      }
    };
    walk(data);
    for (const node of data['@graph'] || []) {
      if (node['@type'] === 'WebPage') { node.url = zhURL; node['@id'] = zhURL + '#page'; }
    }
    return '<script type="application/ld+json">' + JSON.stringify(data) + '</script>';
  });
}

function canonical(html, zhPath) {
  const href = ORIGIN + zhPath;
  if (/<link[^>]*rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${href}">`);
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${href}"></head>`);
  }
  html = html.replace(/<meta[^>]*property="og:url"[^>]*>/gi, `<meta property="og:url" content="${href}">`);
  return html;
}

function zhDocument(html, enPath, zhPath, fallback, dict) {
  if (!html.includes('lang="zh-Hans"')) html = html.replace(/<html lang="en"/, `<html lang="zh-Hans" data-zh-dict="/zh-locales/${dict}.json"${fallback ? ' data-zh-fallback="true"' : ''}`);
  html = canonical(html, zhPath);
  html = rewriteInternal(html);
  html = injectSwitcher(html, enPath, 'en', 'English', 'Read this page in English');
  html = injectAssets(html, true);
  html = alternateHead(html, enPath, zhPath, true);
  html = html.replace(/"inLanguage":"en"/g, '"inLanguage":"zh-Hans"');
  html = localizeJsonLd(html, zhPath);
  if (fallback) {
    html = html.replace(/<body([^>]*)>/, `<body$1><div class="tl-translation-banner">本页的完整中文译文尚未生成，以下保留英文原文。<a href="${enPath}" hreflang="en" lang="en">Read in English</a></div>`);
  }
  const note = `<div class="tl-translation-foot"><span>简体中文为机器翻译，术语与数字已校对。</span><a href="${enPath}" hreflang="en" lang="en">英文原文</a><a href="mailto:support@tickerlantern.com?subject=Translation%20correction">报告翻译问题</a></div>`;
  return html.replace('</body>', note + '</body>');
}

function englishDocument(html, enPath, zhPath) {
  html = injectSwitcher(html, zhPath, 'zh', '中文', '阅读简体中文版');
  html = injectAssets(html, false);
  html = alternateHead(html, enPath, zhPath, false);
  return html;
}

async function copyRuntime() {
  for (const file of ['locale.css', 'locale-preference.js', 'zh-runtime.js']) {
    await copyFile('src/' + file, 'dist/' + file);
  }
  if (!existsSync(ZH_DICTS)) return;
  await mkdir('dist/zh-locales', { recursive: true });
  for (const entry of await readdir(ZH_DICTS, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      await copyFile(join(ZH_DICTS, entry.name), join('dist/zh-locales', entry.name));
    }
  }
}

async function buildSearch() {
  const source = 'src/locales/zh/search-index.json';
  if (!existsSync(source)) return;
  await mkdir('dist/zh', { recursive: true });
  await writeFile('dist/zh/search-index.json', await readFile(source));
}

async function extendSitemap() {
  const path = 'dist/sitemap.xml';
  if (!existsSync(path)) return;
  let xml = await readFile(path, 'utf8');
  if (!xml.includes('zh-Hans')) {
    const zh = [];
    for (const match of xml.matchAll(/<loc>https:\/\/tickerlantern\.com(\/[^<]*)<\/loc>/g)) {
      const url = match[1];
      if (url === '/search' || studyPages[url]) continue;
      zh.push(`<url><loc>${ORIGIN}${zhUrlFor(url)}</loc></url>`);
    }
    if (zh.length) xml = xml.replace('</urlset>', zh.join('') + '</urlset>');
  }
  await writeFile(path, xml);
}

async function extendHeaders() {
  const path = 'dist/_headers';
  if (!existsSync(path)) return;
  let text = await readFile(path, 'utf8');
  if (!text.includes('/zh-locales/*')) text += '/zh-locales/*\n  Cache-Control: public, max-age=0, must-revalidate\n';
  await writeFile(path, text);
}

await copyRuntime();
await buildSearch();

for await (const file of htmlFiles(DIST)) {
  const enPath = urlFor(file);
  const zhPath = zhUrlFor(enPath);
  const source = join(ZH_PAGES, zhRelative(enPath));
  let zh;
  let fallback = false;
  if (existsSync(source)) {
    zh = await readFile(source, 'utf8');
  } else {
    zh = await readFile(file, 'utf8');
    fallback = true;
  }
  const target = join(DIST, 'zh', zhRelative(enPath));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, zhDocument(zh, enPath, zhPath, fallback, dictKey(enPath)));
  const english = await readFile(file, 'utf8');
  await writeFile(file, englishDocument(english, enPath, zhPath));
}

await extendSitemap();
await extendHeaders();
console.log(`Chinese edition built for ${meta.pages || '?'} pages${revision ? ' · source ' + revision : ''}`);
