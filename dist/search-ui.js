import {createSearch,excerpt} from './search-engine.js';
const $=selector=>document.querySelector(selector);
const ZH=document.documentElement.lang==='zh-Hans';
const copy=ZH?{
  title:'搜索：',
  defaultTitle:'搜索文章、图表和工具 | TickerLantern',
  idle:'搜索整个资料库，或从下面的问题开始。',
  result:n=>`${n} 条结果`,
  prefix:'找到 ',
  for:'，关键词：“',
  showing:n=>` · 显示前 ${n} 条`,
  none:q=>`没有找到“${q}”的结果。请减少关键词、扩大主题范围，或选择“所有主题”。`,
  loading:'正在加载搜索库…',
  unavailable:'搜索库无法加载。请检查网络连接后重试。',
  retry:'重试',
  chart:'图表',
  tool:'工具',
  article:'文章',
  parent:'所属：',
  coverage:(a,c,t)=>`可搜索 ${a} 篇文章、${c} 个独立图表和 ${t} 个工具。网站每次发布后，新文章和图表都会加入索引。`
}:{
  title:'Search: ',
  defaultTitle:'Search articles, charts and tools | TickerLantern',
  idle:'Search the whole library, or choose a question below.',
  result:n=>`${n} ${n===1?'result':'results'}`,
  prefix:'',
  for:' for “',
  showing:n=>` · showing ${n}`,
  none:q=>`No results for “${q}”. Try fewer words, a broader topic, or All topics.`,
  loading:'Loading the search library…',
  unavailable:'The search library could not load. Check your connection and try again.',
  retry:'Try again',
  chart:'Chart',
  tool:'Tool',
  article:'Article',
  parent:'In: ',
  coverage:(a,c,t)=>`Search ${a} articles, ${c} individual charts and ${t} tools. New articles and charts join the index whenever the site is published.`
};
const input=$('#site-search'),results=$('#search-results'),status=$('#search-status'),topic=$('#search-topic'),more=$('#search-more');
let search,limit=24,timer,composing=false,requestId=0;
const validTypes=['all','article','chart','tool'];
let type='all';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function highlighted(value,terms){
  const matches=terms.filter(t=>t.length>1).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if(!matches.length)return esc(value);
  const regex=new RegExp('('+matches.join('|')+')','giu');
  return value.split(regex).map((part,i)=>i%2?'<mark>'+esc(part)+'</mark>':esc(part)).join('');
}
function syncFromURL(){
  const p=new URLSearchParams(location.search);input.value=(p.get('q')||'').slice(0,180);
  type=validTypes.includes(p.get('type'))?p.get('type'):'all';
  topic.value=[...topic.options].some(o=>o.value===p.get('topic'))?p.get('topic'):'all';
}
function syncURL(push=false){
  const url=new URL(location.href);url.search='';
  if(input.value.trim())url.searchParams.set('q',input.value.trim());
  if(type!=='all')url.searchParams.set('type',type);
  if(topic.value!=='all')url.searchParams.set('topic',topic.value);
  if(url.href!==location.href)history[push?'pushState':'replaceState'](null,'',url);
}
function render(){
  if(!search)return;
  const query=input.value.trim();
  document.body.classList.toggle('search-has-query',Boolean(query));
  const found=search(query,{type,topic:topic.value,limit});
  results.setAttribute('aria-busy','false');
  for(const button of document.querySelectorAll('[data-type]')){
    button.setAttribute('aria-pressed',String(button.dataset.type===type));
    button.querySelector('span').textContent=query?' '+found.counts[button.dataset.type]:'';
  }
  $('#search-discovery').hidden=Boolean(query&&found.total);
  more.hidden=found.total<=limit;
  document.title=query?copy.title+query+' | TickerLantern':copy.defaultTitle;
  if(!query){status.textContent=copy.idle;results.replaceChildren();return;}
  status.textContent=found.total?copy.prefix+copy.result(found.total)+copy.for+query+'”'+(found.total>limit?copy.showing(Math.min(limit,found.total)):''):copy.none(query);
  results.innerHTML=found.results.map(doc=>`<article class="search-result${doc.thumbnail?' search-result--chart':''}">${doc.thumbnail?`<a class="search-thumbnail" href="${esc(doc.url)}" tabindex="-1" aria-hidden="true"><img src="${esc(doc.thumbnail)}" width="190" height="110" loading="lazy" alt=""></a>`:''}<div><p class="search-result-meta">${doc.type==='chart'?copy.chart:doc.type==='tool'?copy.tool:copy.article} <span aria-hidden="true">/</span> ${esc(doc.category)}</p><h2><a href="${esc(doc.url)}">${highlighted(doc.title,found.terms)}</a></h2>${doc.parentTitle?`<p class="search-parent">${copy.parent}${highlighted(doc.parentTitle,found.terms)}</p>`:''}<p class="search-excerpt">${highlighted(excerpt(doc,found.terms),found.terms)}</p>${doc.evidence?`<span class="search-evidence">${esc(doc.evidence)}</span>`:''}</div></article>`).join('');
}
function update(push=false){limit=24;syncURL(push);render();}
input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);});
input.addEventListener('compositionend',()=>{composing=false;update();});
input.addEventListener('input',()=>{if(composing)return;clearTimeout(timer);timer=setTimeout(()=>update(),140);});
$('#search-form').addEventListener('submit',event=>{event.preventDefault();if(composing)return;clearTimeout(timer);update(true);});
for(const button of document.querySelectorAll('[data-type]'))button.addEventListener('click',()=>{type=button.dataset.type;update(true);});
topic.addEventListener('change',()=>update(true));
more.addEventListener('click',()=>{const previous=results.querySelectorAll('article').length;limit+=24;render();const link=results.querySelectorAll('article h2 a')[previous];if(link)link.focus();});
window.addEventListener('popstate',()=>{syncFromURL();limit=24;render();});
async function load(){
  const id=++requestId;results.setAttribute('aria-busy','true');status.textContent=copy.loading;
  try{
    const response=await fetch(ZH?'/zh/search-index.json':'/search-index.json');if(!response.ok)throw Error('Index unavailable');
    const index=await response.json();if(id!==requestId)return;
    search=createSearch(index.documents);
    $('#search-coverage').textContent=copy.coverage(index.counts.article,index.counts.chart,index.counts.tool);
    render();
  }catch{
    status.textContent=copy.unavailable;results.setAttribute('aria-busy','false');
    const retry=document.createElement('button');retry.type='button';retry.className='search-more';retry.textContent=copy.retry;retry.addEventListener('click',()=>{retry.remove();load();});results.replaceChildren(retry);
  }
}
syncFromURL();load();
