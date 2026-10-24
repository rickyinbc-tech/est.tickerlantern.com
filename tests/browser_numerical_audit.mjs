// Run from the repository root: node tests/browser_numerical_audit.mjs [origin]
// Requires agent-browser; exercises the rendered workbench and actual CSV download.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
function browser(session){
 const run=(...args)=>execFileSync('agent-browser',['--session',session,...args],{encoding:'utf8',timeout:40000,maxBuffer:50*1024*1024}).trim();
 const evaluate=code=>{const value=JSON.parse(run('eval',code));return typeof value==='string'?JSON.parse(value):value;};
 return {run,evaluate};
}
mkdirSync('qa/numerical-audit',{recursive:true});
import {fiveYearGrowthPath,longTermGrowth} from '../src/five-year-growth.js';
import {baselineForecast} from '../src/five-year-report.js';
import {eligibleExitMean} from '../src/valuation-policy.js';
const base=process.argv[2]||'http://localhost:8797';
const feed=JSON.parse(readFileSync('data/indices.json'));
const {run,evaluate}=browser('tl-audit-index-'+process.pid);
const log=[];
const choose=id=>{evaluate(`(()=>{document.querySelector('.index-choice[data-index="${id}"]').scrollIntoView({behavior:'instant',block:'center'});return {ok:true};})()`);run('wait','180');run('click',`.index-choice[data-index="${id}"]`);run('wait','--fn',`document.querySelector('#selected-index-name').textContent === ${JSON.stringify(feed.indices.find(r=>r.id===id).name)}`);};
try{
 run('set','viewport','1440','1600');run('open',base);run('wait','#check-data:not(:disabled)');
 for(const row of feed.indices){
  choose(row.id);
  const v=evaluate('({rates:[...document.querySelectorAll("[data-growth-year]")].map(e=>+e.value),exit:+document.querySelector("#exitPE").value,card:!document.querySelector("#valuation-reference-card").hidden,optional:!document.querySelector("#qualified-exit-option").hidden,irr:document.querySelector("#cash-irr").textContent})');
  const path=fiveYearGrowthPath(row),model=baselineForecast(row);
  assert.equal(v.rates.length,5,row.id);v.rates.forEach((r,i)=>assert.ok(Math.abs(r-path.rates[i])<1e-6,row.id+' growth'+i));
  assert.equal(v.card,eligibleExitMean(row),row.id+' matched-only current reference');
  assert.equal(v.optional,!eligibleExitMean(row),row.id+' qualified option');
  assert.ok(Math.abs(v.exit-(eligibleExitMean(row)?row.mean10YearForwardPE:row.forwardPE))<1e-6,row.id+' exit');
  if(model)assert.equal(v.irr,(model.cashIRR*100).toFixed(2)+'%',row.id+' IRR');
  const method=run('get','text','#growth-forecast-method');assert.ok(method.length>0,row.id+' method');if(['ftse100','stoxx600','nikkei225','hangseng'].includes(row.id)){assert.match(method,/published periods above remain reference observations/i);assert.doesNotMatch(method,/No published/);}
  log.push({id:row.id,...v});
 }
 choose('nasdaq100');
 const n=feed.indices.find(r=>r.id==='nasdaq100'),y=+n.asOf.slice(0,4),w=(Date.parse(n.asOf)-Date.UTC(y,0,1))/(Date.UTC(y+1,0,1)-Date.UTC(y,0,1));
 const first=1+n.growthForecast.estimates.find(p=>p.year===y+1).growth/100;
 const second=1+(n.growthForecast.estimates.find(p=>p.year===y+2)?.growth ?? longTermGrowth(n.id).growth)/100;
 const expected=(first*((1-w)+w*second)/((1-w)+w*first)-1)*100;
 assert.ok(Math.abs(log.find(r=>r.id==='nasdaq100').rates[0]-expected)<1e-6);
 assert.match(run('get','text','.growth-forecast-card'),/Published earnings-growth estimates/);
 choose('em');evaluate('(()=>{document.querySelector("#use-qualified-exit").scrollIntoView({behavior:"instant",block:"center"});return {ok:true}})()');run('wait','180');run('click','#use-qualified-exit');
 assert.equal(+run('get','value','#exitPE'),feed.indices.find(r=>r.id==='em').mean10YearForwardPE);assert.match(run('get','text','#exitPE-basis'),/Your assumption/);
 run('click','#restore-source');assert.equal(+run('get','value','#exitPE'),feed.indices.find(r=>r.id==='em').forwardPE);
 run('fill','#growth-year-1','12.3');run('fill','#exitPE','10');run('click','#check-data');run('wait','#check-data:not(:disabled)');
 assert.equal(+run('get','value','#growth-year-1'),12.3);assert.equal(+run('get','value','#exitPE'),10);
 run('click','#restore-source');assert.equal(+run('get','value','#growth-year-1'),12.3);assert.equal(+run('get','value','#exitPE'),feed.indices.find(r=>r.id==='em').forwardPE);
 run('click','#restore-growth-years');
 run('download','#download-five-year',resolve('qa/numerical-audit/'+(base.startsWith('https:')?'live':'local')+'-five-year.csv'));
 for(const width of [1440,390]){run('set','viewport',String(width),'1000');evaluate('(()=>{scrollTo(0,0);return {ok:true}})()');run('wait','--fn','document.documentElement.scrollWidth <= innerWidth+1');run('screenshot',resolve(`qa/numerical-audit/${base.startsWith('https:')?'live':'local'}-index-${width}.png`));}
 assert.equal(run('errors'),'');
 writeFileSync('qa/numerical-audit/'+(base.startsWith('https:')?'live':'local')+'-index-checks.json',JSON.stringify({base,log,independentNasdaqFirstTransition:expected,qualifiedButton:true,protectedEdits:true},null,2));
 console.log('PASS all21 growth/defaults, independentNasdaq bridge, optionalexit/reset, customprotection, downloadedCSV, desktop/mobile, noerrors');
}finally{run('close');}
