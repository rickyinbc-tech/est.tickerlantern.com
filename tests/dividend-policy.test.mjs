import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULTS,project,annualCSV} from '../src/model.js';
import {scenarioInputs,switchScenario,loadScenarios,saveScenarios} from '../src/scenario-state.js';
import {calibratedPayout,payoutProvenance,DIVIDEND_POLICY_VERSION} from '../src/dividend-policy.js';
import {baselineAssessment,baselineForecast,fiveYearCSV} from '../src/five-year-report.js';
const feed=JSON.parse(readFileSync(new URL('../data/indices.json',import.meta.url)));
const now=new Date('2026-10-23T14:00:00Z');
const row=id=>feed.indices.find(r=>r.id===id);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function csv(text){return text.split('\n').map(line=>{const cells=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){v+='"';i++;}else q=!q;}else if(c===','&&!q){cells.push(v);v='';}else v+=c;}return [...cells,v];});}

test('20 accepted cash anchors have individual payouts; the STOXX reference does not fabricate cash',()=>{
 assert.equal(feed.indices.length,21);const payouts=[];
 for(const r of feed.indices){
  if(r.id==='stoxx600'){
   assert.ok(r.metricDefinitions.dividendYield.permittedUse.includes('display'));
   assert.equal(r.metricDefinitions.dividendYield.permittedUse.includes('first-payment-anchor'),false);
   assert.equal(calibratedPayout(r,r.forwardPE),'');
   const assessment=baselineAssessment(r,now);assert.equal(assessment.model,null);assert.equal(assessment.input.payout,'');assert.equal(assessment.input.dividendYield,'');
   assert.match(assessment.reason,/cash-dividend anchor/);continue;
  }
  assert.ok(r.metricDefinitions.dividendYield.permittedUse.includes('first-payment-anchor'));
  const m=baselineForecast(r,now);assert.equal(m.input.dividendMode,'payout');assert.equal(m.input.years,5);
  payouts.push(m.input.payout);close(m.points[1].dividend,r.dividendYield);
  // Independently check every later distribution against the prior EPS factor.
  let factor=1;for(let i=1;i<=5;i++){close(m.points[i].dividend,r.dividendYield*factor);factor*=1+m.input.annualGrowth[i-1]/100;}
  const alternative=project({...m.input,dividendMode:'yield',dividendYield:r.dividendYield});
  close(m.cashIRR,alternative.cashIRR);close(m.last.cashWealth,alternative.last.cashWealth);close(m.reinvestedCAGR,alternative.reinvestedCAGR);
 }
 assert.equal(payouts.length,20);assert.ok(payouts.every(p=>p!==30));assert.ok(new Set(payouts).size>15);
 // Fixed anchors keep the arithmetic check independent of daily source refreshes.
 assert.equal(calibratedPayout({...row('sp500'),dividendYield:1.09},19),20.71);assert.equal(calibratedPayout({...row('nasdaq100'),dividendYield:0.5},21.36),10.68);assert.equal(calibratedPayout({...row('australia'),dividendYield:3.3},18.3),60.39);
});

test('payout follows the active entry and source yield unless the reader edits it',()=>{
 const r=row('sp500'), first=scenarioInputs(r,undefined,{},true,now);
 const changed={...r,dividendYield:1.2};
 const next=scenarioInputs(changed,{...first,entryPE:22},{entryPE:true},true,now);
 assert.equal(next.payout,26.4);assert.equal(next.entryPE,22);
 const custom=scenarioInputs(changed,{...next,payout:42},{entryPE:true,payout:true},true,now);assert.equal(custom.payout,42);
 assert.equal(payoutProvenance(changed,custom,{payout:true},true,now).classification,'user-assumption');
});

test('unmodified legacy 30 percent settings migrate, including paused scenarios; custom 30 survives',()=>{
 // A fixed anchor keeps the migration arithmetic independent of daily source refreshes.
 const sp={...row('sp500'),dividendYield:1.09},legacy={...DEFAULTS,entryPE:19,payout:30};
 assert.equal(switchScenario(sp,legacy,{},false,now).payout,20.71);
 assert.equal(switchScenario(sp,legacy,{payout:true},false,now).payout,30);
 const frozen={...legacy,payout:22,dividendPolicyVersion:DIVIDEND_POLICY_VERSION};
 assert.equal(switchScenario(sp,frozen,{},false,now).payout,22);
 let stored;const storage={setItem:(_,v)=>stored=v,getItem:()=>stored};
 const input=scenarioInputs(sp,undefined,{},true,now);
 saveScenarios(storage,{scenarios:new Map([['sp500',input]]),overrides:new Map(),selectedIndexId:'sp500',following:true});
 assert.equal(loadScenarios(storage).scenarios.get('sp500').dividendPolicyVersion,DIVIDEND_POLICY_VERSION);
});

test('missing, invalid or withdrawn dividend inputs remain blank, distinguishable from a verified zero',()=>{
 for(const dividendYield of [null,undefined,'',NaN,-1])assert.equal(calibratedPayout({dividendYield},19),'');
 assert.equal(calibratedPayout({...row('sp500'),metricDefinitions:{dividendYield:{permittedUse:['display']}}},19),'');
 const missing=scenarioInputs({...row('sp500'),dividendYield:null},undefined,{},true,now);assert.equal(missing.payout,'');assert.throws(()=>project(missing));
 assert.equal(switchScenario({...row('sp500'),dividendYield:null},{...DEFAULTS,payout:30},{},false,now).payout,'');
 const excessive=scenarioInputs({...row('sp500'),dividendYield:10},undefined,{},true,now);close(excessive.payout,10*row('sp500').forwardPE);assert.throws(()=>project(excessive));
 const zero=scenarioInputs({...row('sp500'),dividendYield:0},undefined,{},true,now);
 assert.equal(zero.payout,0);assert.equal(project(zero).last.cumulativeDividend,0);
 const blank={...feed,indices:[{...row('sp500'),dividendYield:null}]},records=csv(fiveYearCSV(blank,now));
 const status=records[0].indexOf('Model status');assert.equal(records.length,7);
 for(const record of records.slice(1)){
  assert.equal(record[status],'unavailable');
  assert.equal(record[records[0].indexOf('Payout percent')],'');
  assert.equal(record[records[0].indexOf('Dividend per original unit')],'');
  assert.equal(record[records[0].indexOf('Price plus cash wealth')],'');
 }
});

test('a reader can explicitly supply a cash payout for a reference-only benchmark',()=>{
 const r=row('stoxx600'),custom=scenarioInputs(r,{...DEFAULTS,payout:30},{payout:true},true,now);
 assert.equal(custom.payout,30);assert.equal(custom.years,5);
 const model=project(custom);assert.ok(model.last.cumulativeDividend>0);
 assert.equal(payoutProvenance(r,custom,{payout:true},true,now).classification,'user-assumption');
});

test('CSV labels calibrated payouts as model inputs with separate yield and earnings evidence',()=>{
 const r=row('sp500'),m=baselineForecast(r,now),evidence=payoutProvenance(r,m.input,{},true,now);
 assert.equal(evidence.classification,'model-implied-payout');assert.equal(evidence.initialDividendAnchorPercent,r.dividendYield);
 assert.equal(evidence.yieldEvidence.observationDate,r.yieldAsOf);assert.match(evidence.interpretation,/Not a publisher-reported payout/);
 const records=csv(annualCSV(m,r.growthForecast,{payoutMetric:evidence}));const at=records[0].indexOf('Payout metric provenance');
 assert.ok(Math.abs(JSON.parse(records[1][at]).value-r.dividendYield*r.forwardPE)<=5e-4);
 const all=csv(fiveYearCSV(feed,now)),payout=all[0].indexOf('Payout percent'),id=all[0].indexOf('Benchmark ID');
 assert.equal(all.length,127);
 for(const r of feed.indices){
  const records=all.slice(1).filter(v=>v[id]===r.id);assert.equal(records.length,6);
  if(r.id==='stoxx600'){
   const status=all[0].indexOf('Model status');
   assert.ok(records.every(record=>record[status]==='unavailable' && record[payout]==='' && record[at]===''));
  }else{close(+records[0][payout],calibratedPayout(r,r.forwardPE));assert.equal(JSON.parse(records[0][at]).classification,'model-implied-payout');}
 }
 assert.equal(row('stoxx600').metricDefinitions.dividendYield.classification,'published-net-return-spread-proxy');
 assert.match(row('stoxx600').metricDefinitions.dividendYield.economic.yieldConstruction,/net return index return minus price index return/);
});
