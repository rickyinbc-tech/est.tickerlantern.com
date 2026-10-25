import {createSearch,excerpt} from './search-engine.js';
const $=selector=>document.querySelector(selector);
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
  document.title=query?'Search: '+query+' | TickerLantern':'Search articles, charts and tools | TickerLantern';
  if(!query){status.textContent='Search the whole library, or choose a question below.';results.replaceChildren();return;}
  status.textContent=found.total?`${found.total} ${found.total===1?'result':'results'} for “${query}”${found.total>limit?` · showing ${Math.min(limit,found.total)}`:''}`:`No results for “${query}”. Try fewer words, a broader topic, or All topics.`;
  results.innerHTML=found.results.map(doc=>`<article class="search-result${doc.thumbnail?' search-result--chart':''}">${doc.thumbnail?`<a class="search-thumbnail" href="${esc(doc.url)}" tabindex="-1" aria-hidden="true"><img src="${esc(doc.thumbnail)}" width="190" height="110" loading="lazy" alt=""></a>`:''}<div><p class="search-result-meta">${doc.type==='chart'?'Chart':doc.type==='tool'?'Tool':'Article'} <span aria-hidden="true">/</span> ${esc(doc.category)}</p><h2><a href="${esc(doc.url)}">${highlighted(doc.title,found.terms)}</a></h2>${doc.parentTitle?`<p class="search-parent">In: ${highlighted(doc.parentTitle,found.terms)}</p>`:''}<p class="search-excerpt">${highlighted(excerpt(doc,found.terms),found.terms)}</p>${doc.evidence?`<span class="search-evidence">${esc(doc.evidence)}</span>`:''}</div></article>`).join('');
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
  const id=++requestId;results.setAttribute('aria-busy','true');status.textContent='Loading the search library…';
  try{
    const response=await fetch('/search-index.json');if(!response.ok)throw Error('Index unavailable');
    const index=await response.json();if(id!==requestId)return;
    search=createSearch(index.documents);
    $('#search-coverage').textContent=`Search ${index.counts.article} articles, ${index.counts.chart} individual charts and ${index.counts.tool} tools. New articles and charts join the index whenever the site is published.`;
    render();
  }catch{
    status.textContent='The search library could not load. Check your connection and try again.';results.setAttribute('aria-busy','false');
    const retry=document.createElement('button');retry.type='button';retry.className='search-more';retry.textContent='Try again';retry.addEventListener('click',()=>{retry.remove();load();});results.replaceChildren(retry);
  }
}
syncFromURL();load();
