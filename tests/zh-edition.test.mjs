import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import worker from '../src/worker.js';

async function englishPages(dir='dist'){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory()){if(path!=='dist/zh')out.push(...await englishPages(path));}
  else if(entry.name.endsWith('.html'))out.push(path);
 }
 return out;
}
const classes=html=>new Set([...html.matchAll(/class="([^"]*)"/g)].map(match=>match[1]));

test('every English page has a Chinese edition and both link to each other',async()=>{
 const pages=await englishPages();
 assert.ok(pages.length>300);
 for(const en of pages){
  const zh=en.replace(/^dist\//,'dist/zh/');
  assert.ok(existsSync(zh),zh);
  const [english,chinese]=await Promise.all([readFile(en,'utf8'),readFile(zh,'utf8')]);
  assert.match(english,/data-tl-lang="zh"/,en);
  assert.match(chinese,/data-tl-lang="en"/,zh);
  if(english.includes('class="tl-menu"')){
   assert.match(english,/<details class="tl-menu">[\s\S]*?<\/summary><nav\b[^>]*><a class="tl-lang tl-lang--menu"[^>]*data-tl-lang="zh"/,en);
   assert.match(chinese,/<details class="tl-menu">[\s\S]*?<\/summary><nav\b[^>]*><a class="tl-lang tl-lang--menu"[^>]*data-tl-lang="en"/,zh);
  }
  assert.match(chinese,/<html lang="zh-Hans"/,zh);
  assert.match(english,/hreflang="zh-Hans"/,en);
  assert.match(chinese,/<title>[^<]*[一-鿿]/,zh);
 }
});

test('translation leaves class names exactly as in the English markup',async()=>{
 for(const en of await englishPages()){
  const zh=en.replace(/^dist\//,'dist/zh/');
  const source=classes(await readFile(en,'utf8'));
  for(const name of classes(await readFile(zh,'utf8'))){
   if(name==='tl-translation-foot'||name==='tl-translation-banner')continue;
   assert.ok(source.has(name),`${zh}: class "${name}" is not in the English page`);
  }
 }
});

test('Chinese routes canonicalize like English routes',async()=>{
 for(const [from,to] of [['/zh','/zh/'],['/zh/index.html','/zh/'],['/zh/research','/zh/research/'],['/zh/about.html','/zh/about'],['/zh/research/annual-bills-sinking-fund.html','/zh/research/annual-bills-sinking-fund']]){
  const response=await worker.fetch(new Request('https://tickerlantern.com'+from),{});
  assert.equal(response.status,308,from);
  assert.equal(response.headers.get('Location'),'https://tickerlantern.com'+to);
 }
});
