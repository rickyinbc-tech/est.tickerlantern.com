import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {planningGuides} from '../src/planning-guides.js';
import {guides as investmentGuides} from '../src/research-guides.js';
import {planningResult} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
import {studyPages} from '../src/seo.js';
import {addSearchNavigation} from '../src/search-navigation.js';

// The publication's own source and dist/ are the only inputs. Never crawl the
// surrounding research workspace, account records, private archives or PDFs.
const decode=value=>value.replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,v)=>String.fromCodePoint(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v))).replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g,v=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '}[v]));
const plain=value=>decode(String(value).replace(/<(script|style|svg|table|nav)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const documents=[];
const articleURLs=new Set();
await mkdir('dist/search-thumbnails',{recursive:true});
for(const guide of [...planningGuides,...investmentGuides]){
  const url='/research/'+guide.slug;
  articleURLs.add(url);
  const category=guide.category.replace(/^Financial planning · /,'');
  const topic=guide.planning?'planning':'investing';
  documents.push({url,type:'article',topic,category,title:guide.title,description:guide.description,body:plain(guide.takeaway+' '+guide.sections.map(s=>s.title+' '+s.html).join(' '))});
  if(!guide.planning)continue;
  for(const chart of planningResult(guide.planning).charts){
    const svg=renderFigure(chart,520).match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
    if(!svg)throw Error('Missing chart SVG: '+url+'#'+chart.id);
    // Reuse the real example geometry; do not invent a decorative search chart.
    const thumbnail='/search-thumbnails/'+createHash('sha256').update(url+'#'+chart.id+svg).digest('hex').slice(0,20)+'.svg';
    const image=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace(/<text /g,'<text font-family="sans-serif" font-size="10" fill="#556779" ').replace(/class="plot-grid"/g,'stroke="#d7e0e8" stroke-width="1"').replace(/class="plot-axis"/g,'stroke="#91aabd" stroke-width="1"');
    await writeFile('dist'+thumbnail,image);
    documents.push({url:url+'#'+chart.id,type:'chart',topic,category,title:chart.title,parentTitle:guide.title,description:chart.note||guide.description,body:plain(chart.note||''),thumbnail,evidence:chart.evidence||(chart.source?'Official statistics':'Hypothetical scenario')});
  }
}

// Include every other public article emitted by the normal build, including
// bank research, without maintaining a second manual list of article titles.
async function scan(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=dir+'/'+entry.name;
    if(entry.isDirectory()){await scan(file);continue;}
    if(!entry.name.endsWith('.html'))continue;
    let html=await readFile(file,'utf8');
    const canonical=html.match(/rel="canonical" href="([^"]+)"/);
    if(!canonical){await writeFile(file,addSearchNavigation(html));continue;}
    const url=new URL(canonical[1]).pathname;
    if(!articleURLs.has(url)&&url.startsWith('/research/')&&url!=='/research/'){
      const title=plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').replace(/ \| TickerLantern$/,'');
      const description=decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'');
      const body=plain(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]||'').slice(0,24000);
      const banks=/bank|scotia|cibc|bmo|toronto.dominion|\brbc\b|\btd\b/i.test(title);
      documents.push({url,type:url==='/research/banks'?'tool':'article',topic:banks?'stocks':'investing',category:banks?'Canadian banks':'Investment research',title,description,body});
    }
    html=addSearchNavigation(html);
    if(url==='/'||url==='/research/'){
      const form='<aside class="home-search" aria-label="Search the research library"><form action="/search" role="search"><label for="home-search">Find an article or chart</label><input id="home-search" type="search" name="q" maxlength="180" placeholder="A topic, a question, or a few words…" aria-label="Search articles and charts"><button type="submit">Search</button></form></aside>';
      html=html.replace('</header>', '</header>'+form);
    }
    await writeFile(file,html);
  }
}
await scan('dist');
documents.push(
  {url:'/#indices',type:'tool',topic:'investing',category:'Global indices',title:'Global index valuations and benchmark comparison',description:'Compare 21 benchmarks, forward P/E, historical valuation references, earnings growth and dividends.',body:'S&P 500 Nasdaq Dow Jones Russell TSX MSCI World ACWI EAFE Canada emerging markets Europe Japan China India Hang Seng FTSE STOXX Nikkei'},
  {url:'/#model',type:'tool',topic:'investing',category:'Global indices',title:'Five-year earnings, valuation and dividend scenario lab',description:'Change growth, entry and exit P/E, dividends and reinvestment. Inspect wealth paths and annual calculations.'},
  {url:'/#wealth-chart',type:'chart',topic:'investing',category:'Global indices',title:'How 100 indexed units evolve',description:'Compare price only, price plus cash dividends and reinvested wealth over five years.',evidence:'Hypothetical scenario'},
  ...Object.entries(studyPages).map(([url,page])=>({url,type:url==='/notes/research'||url==='/methodology'||url==='/sources'?'article':'tool',topic:'products',category:'Notes & GICs',...page,keywords:url==='/gics'?'equity-linked gic market-linked gic': 'structured notes autocall coupon barrier'}))
);
const counts={article:0,chart:0,tool:0};
const seen=new Set();
for(const doc of documents){
  if(seen.has(doc.url))throw Error('Duplicate search URL: '+doc.url);
  if(!/^\/(?!\/)[a-z0-9/#-]*$/.test(doc.url))throw Error('Unexpected search URL: '+doc.url);
  seen.add(doc.url);counts[doc.type]++;
  // Every local deep link must resolve to an emitted page and a real element.
  if(doc.topic==='products')continue;
  const [path,id]=doc.url.split('#');
  const file=path==='/'?'dist/index.html':'dist'+path+'.html';
  const html=await readFile(file,'utf8');
  if(id&&!html.includes('id="'+id+'"'))throw Error('Broken search anchor: '+doc.url);
}
await writeFile('dist/search-index.json',JSON.stringify({version:1,counts,documents}));
for(const file of ['search-engine.js','search-ui.js','search-shortcut.js','search.css'])await copyFile('src/'+file,'dist/'+file);
await writeFile('dist/search.html',addSearchNavigation(await readFile('src/search.html','utf8')));
console.log('Search library built:',counts,'·',documents.length,'entries');
