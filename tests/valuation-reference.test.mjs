import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicalAssessment,canCompareHistory,eligibleExitMean,qualifiedForwardReference,eligibleTTMReference,valuationReference,exitMetricProvenance,sourceExitPE} from '../src/valuation-policy.js';
import {scenarioInputs} from '../src/scenario-state.js';
import {DEFAULTS,project,annualCSV} from '../src/model.js';
import {fiveYearCSV} from '../src/five-year-report.js';
import {validateFeed} from '../src/index-data.js';
const feed=JSON.parse(readFileSync(new URL('../data/indices.json',import.meta.url)));
const now=new Date('2026-10-26T12:00:00Z'),r=id=>structuredClone(feed.indices.find(x=>x.id===id));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const evidence={publisher:'Synthetic QA source',url:'https://example.test/valuation',checkedAt:'2026-10-23T10:00:00Z'};
function trailingRow(){const row=r('sp500');row.mean10YearForwardPE=null;row.meanAsOf=null;row.meanMethod=null;row.historicalCompatibility={outcome:'insufficient',allowComparison:false,allowExitDefault:false,reasons:['No forward mean']};row.metricDefinitions.mean10YearForwardPE={...row.metricDefinitions.mean10YearForwardPE,state:'unavailable',rawReportedValue:null,observationDate:null,evidence:{...row.metricDefinitions.mean10YearForwardPE.evidence,observationDate:null}};
 row.trailingValuation={indexId:row.id,verification:'verified-exact-index',earningsBasis:'trailing-12m',windowYears:10,statistic:'arithmetic-mean',outlierTreatment:'none',aggregationAligned:true,currentPE:25,currentAsOf:'2026-10-22',currentSource:evidence,mean10YearPE:20,meanAsOf:'2026-09-30',meanSource:evidence};return row;}
function csv(text){return text.split('\n').map(line=>{const a=[];let v='',q=false;for(let i=0;i<line.length;i++){if(line[i]==='"'){if(q&&line[i+1]==='"'){v+='"';i++;}else q=!q;}else if(line[i]===','&&!q){a.push(v);v='';}else v+=line[i];}return [...a,v];});}

test('only six compatible pairs default historical exits; qualified fifteen remain optional assumptions',()=>{
 const types={};for(const row of feed.indices){const ref=valuationReference(row),input=scenarioInputs(row);types[ref.type]=(types[ref.type]||0)+1;
  if(historicalAssessment(row).allowExitDefault){
   assert.equal(input.exitPE,row.mean10YearForwardPE);assert.equal(ref.historicalPE,row.mean10YearForwardPE);
   close(ref.normalizedCurrentEPS,100/row.forwardPE);close(ref.normalizedReferenceValue,100*row.mean10YearForwardPE/row.forwardPE);
  }else{
   assert.equal(input.exitPE,row.forwardPE);assert.equal(ref.normalizedReferenceValue,undefined);assert.equal(canCompareHistory(row),false);
   assert.equal(qualifiedForwardReference(row),true);assert.equal(eligibleExitMean(row),false);
   assert.equal(scenarioInputs(row,{...input,exitPE:row.mean10YearForwardPE},{exitPE:true}).exitPE,row.mean10YearForwardPE);
  }
 }
 assert.deepEqual(types,{'matched-forward':6,'constant-multiple':15});
});

test('a qualified reference still needs exact index, ten-year mean, forward definition and accepted evidence',()=>{
 const row=r('em');assert.equal(qualifiedForwardReference(row),true);
 for(const patch of [{evidenceStatus:'definition-review-required'},{economic:{...row.metricDefinitions.forwardPE.economic,horizon:'trailing-12m'}}]){const changed={...row,metricDefinitions:{...row.metricDefinitions,forwardPE:{...row.metricDefinitions.forwardPE,...patch}}};assert.equal(!!qualifiedForwardReference(changed),false);}
 const variants=[{historicalCompatibility:{outcome:'incompatible'}},{meanAsOf:'2026-99-99'},{meanSource:{url:'https://example.test'}},{mean10YearForwardPE:null}];
 for(const patch of variants)assert.equal(!!qualifiedForwardReference({...row,...patch}),false);
 for(const patch of [{state:'withdrawn'},{evidenceStatus:'definition-review-required'},{economic:{...row.metricDefinitions.mean10YearForwardPE.economic,identity:'world'}},{economic:{...row.metricDefinitions.mean10YearForwardPE.economic,horizon:'trailing-12m'}},{history:{windowYears:5,statistic:'publisher-reported mean'}},{history:{windowYears:10,statistic:'median'}}]){
  const changed={...row,metricDefinitions:{...row.metricDefinitions,mean10YearForwardPE:{...row.metricDefinitions.mean10YearForwardPE,...patch}}};assert.equal(!!qualifiedForwardReference(changed),false);
 }
});

test('TTM fallback values current trailing EPS and uses terminal trailing EPS without mixing earnings periods',()=>{
 const row=trailingRow();assert.equal(eligibleTTMReference(row),true);
 const input=scenarioInputs(row,undefined,{},true,now),ref=valuationReference(row,input),m=project(input);
 assert.equal(ref.type,'trailing-fallback');assert.equal(ref.earningsBasis,'trailing-12m');
 close(ref.normalizedCurrentEPS,4);close(ref.normalizedReferenceValue,80);
 close(input.exitPE,20/1.0804);close(m.last.price,20*m.points[4].eps);
 assert.ok(Math.abs(m.last.price-20*m.last.eps)>1);
 const next=scenarioInputs(row,{...input,growthOverrides:{2031:30}}, {},true,now),changed=project(next);
 close(next.exitPE,20/1.3);close(changed.last.price,m.last.price);close(changed.cashIRR,m.cashIRR);
});

test('TTM fallback cannot replace a usable forward mean or accept CAPE, medians, trimmed ETF proxies or mismatched data',()=>{
 const t=trailingRow(),row=r('sp500');row.trailingValuation=t.trailingValuation;assert.equal(valuationReference(row).type,'matched-forward');
 for(const patch of [{indexId:'world'},{earningsBasis:'CAPE'},{statistic:'median'},{outlierTreatment:'trimmed-20-percent'},{verification:'ETF-proxy'},{aggregationAligned:false},{windowYears:5},{currentPE:0},{mean10YearPE:NaN},{currentAsOf:'2026-99-99'},{meanSource:{publisher:'Missing URL'}}]){
  const changed={...t,trailingValuation:{...t.trailingValuation,...patch}};assert.equal(eligibleTTMReference(changed),false);assert.equal(valuationReference(changed).type,'constant-multiple');
 }
});

test('feed validation rejects unverified TTM fallback fields rather than publishing them',()=>{
 // The feed is refreshed before this test in CI, so its publication and check
 // timestamps must be validated against the actual clock, not the fixed model
 // clock used by the synthetic scenario tests above.
 const f=structuredClone(feed),row=trailingRow(),validationNow=new Date();f.publishedAt=validationNow.toISOString();f.indices[0]=row;assert.doesNotThrow(()=>validateFeed(f,validationNow));
 for(const patch of [{verification:'unverified'},{indexId:'eafe'},{currentAsOf:'2099-01-01'}]){const broken=structuredClone(f);Object.assign(broken.indices[0].trailingValuation,patch);assert.throws(()=>validateFeed(broken,validationNow));}
});

test('manual exit and paused scenarios stay protected; source restoration uses the correct converted TTM exit',()=>{
 const row=trailingRow(),base=scenarioInputs(row,undefined,{},true,now);
 assert.equal(scenarioInputs(row,{...base,exitPE:17},{exitPE:true},true,now).exitPE,17);
 assert.equal(scenarioInputs(row,{...base,exitPE:17},{},false,now).exitPE,17);
 close(sourceExitPE(row,19,{...DEFAULTS,growthMode:'constant',growth:10}),20/1.1);
 assert.equal(exitMetricProvenance(row,{...base,exitPE:17},true,{exitPE:true}).classification,'user-assumption');
});

test('CSV exports historical basis, current EPS normalization and terminal conversion as exit provenance',()=>{
 const row=trailingRow(),input=scenarioInputs(row,undefined,{},true,now),m=project(input),rows=csv(annualCSV(m,row.growthForecast,{exitMetric:exitMetricProvenance(row,m.input)}));
 const at=rows[0].indexOf('Exit metric provenance');for(const record of rows.slice(1)){
  const ref=JSON.parse(record[at]).reference;assert.equal(ref.type,'trailing-fallback');assert.equal(ref.historicalPE,20);assert.equal(ref.currentPE,25);close(ref.normalizedReferenceValue,80);close(ref.exitPE,20/1.0804);assert.equal(ref.currentSource.publisher,evidence.publisher);
 }
 const all=csv(fiveYearCSV(feed,now)),header=all[0],id=header.indexOf('Benchmark ID'),provenance=header.indexOf('Exit metric provenance');
 for(const record of all.slice(1).filter(x=>x[id]==='stoxx600'))assert.equal(JSON.parse(record[provenance]).reference.type,'matched-forward');
 const qualified=r('em'),value=exitMetricProvenance(qualified,scenarioInputs(qualified));assert.equal(value.reference.type,'constant-multiple');assert.equal(value.classification,'model-assumption');assert.equal(value.sourceMetric,null);assert.equal(value.reference.normalizedReferenceValue,undefined);
});
