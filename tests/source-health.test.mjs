import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {metricHealth,metricStatusText,updateHealth,metricProvenance,metricDisclosure} from '../src/update-status.js';
import {annualCSV,project,DEFAULTS} from '../src/model.js';
import {scenarioInputs,fieldBasis} from '../src/scenario-state.js';
const feed=JSON.parse(await readFile(new URL('../data/indices.json',import.meta.url)));
const now=new Date('2026-10-23T10:00:00Z');
test('retained same-document yields inherit the existing proven primary failure',()=>{
 for(const id of ['msci-canada','eafe','uk']) {
  const row=structuredClone(feed.indices.find(r=>r.id===id)); delete row.yieldSync;
  assert.equal(metricHealth(row,'dividendYield',now).sourceFailure,true,id);
  assert.match(metricStatusText(row,'dividendYield',now),/check failed/);
 }
});
test('primary-only failed attempts cannot produce an all-success summary',()=>{
 const rows=structuredClone(feed.indices);
 for(const r of rows) {
  for(const key of ['sync','yieldSync','meanSync']) r[key]={status:'ok',lastAttempt:now.toISOString(),lastSuccess:now.toISOString()};
  if(r.growthForecast) r.growthForecast.sync={status:'ok',lastAttempt:now.toISOString(),lastSuccess:now.toISOString()};
  delete r.growthSync;
 }
 for(const r of rows.filter(r=>['msci-canada','eafe','uk'].includes(r.id))) r.sync={status:'retained',lastAttempt:now.toISOString(),lastSuccess:'2026-10-23T07:28:55Z',error:'Truncated PDF'};
 const isolated={...feed,indices:rows,sourceJobs:[],growthRefresh:{failures:[]},refresh:{failed:3},sourceCheckAt:now.toISOString(),growthCheckAt:now.toISOString()};
 const health=updateHealth(isolated,now); assert.ok(health.failures>0);assert.match(health.message,/failed/);assert.equal(health.missed,false);
});
test('retained growth provenance includes the operational outcome in annual CSV',()=>{
 const forecast=feed.indices.find(r=>r.id==='russell2000').growthForecast;
 const model=project({...DEFAULTS,growthMode:'source',growthStartYear:2027,annualGrowth:[44],years:1});
 const csv=annualCSV(model,forecast,{healthEvaluatedAt:now.toISOString()});
 assert.match(csv,/retained/);assert.match(csv,/2026-10-23T09:18:44Z/);assert.match(csv,/robots policy unavailable/i);
});

test('an older explicit yield status yields to a newer shared failure but independent documents do not',()=>{
 const row=structuredClone(feed.indices.find(r=>r.id==='eafe'));
 row.yieldSync={status:'ok',lastAttempt:'2026-10-23T06:00:00Z',lastSuccess:'2026-10-23T06:00:00Z'};
 let health=metricHealth(row,'dividendYield',now);
 assert.equal(health.sourceFailure,true);assert.equal(health.lastSuccess,row.yieldSync.lastSuccess);assert.equal(health.lastAttempt,row.sync.lastAttempt);
 row.yieldSource={...row.yieldSource,url:'https://www.msci.com/independent-factsheet.pdf'};
 assert.equal(metricHealth(row,'dividendYield',now).sourceFailure,false);
 delete row.yieldSync;assert.equal(metricHealth(row,'dividendYield',now).sourceFailure,false);
});
test('later recovery clears only validated source-owned metrics; availability is not health',()=>{
 const row=structuredClone(feed.indices.find(r=>r.id==='world'));
 row.sync={status:'retained',lastAttempt:'2026-10-23T08:00:00Z',lastSuccess:'2026-10-22T08:00:00Z',error:'Fixture',metrics:['forwardPE','dividendYield']};
 row.yieldSync={status:'ok',lastAttempt:'2026-10-23T09:00:00Z',lastSuccess:'2026-10-23T09:00:00Z',error:null,metrics:['dividendYield']};
 assert.equal(metricHealth(row,'dividendYield',now).sourceFailure,false);
 assert.equal(metricHealth(row,'forwardPE',now).sourceFailure,true);
 row.sync={...row.sync,status:'ok',lastAttempt:'2026-10-23T09:30:00Z',lastSuccess:'2026-10-23T09:30:00Z',metrics:['forwardPE'],error:null};
 assert.equal(metricHealth(row,'forwardPE',now).sourceFailure,false);
 row.sync.status='not-meaningful';assert.equal(metricHealth(row,'forwardPE',now).checkStatus,'ok');assert.equal(metricHealth(row,'forwardPE',now).sourceFailure,false);
});
test('one shared document failure is counted once across owned metrics and job metadata',()=>{
 const row=structuredClone(feed.indices.find(r=>r.id==='world'));
 row.sync={status:'retained',lastAttempt:now.toISOString(),lastSuccess:'2026-10-22T08:00:00Z',error:'Fixture',ownerId:'primary:msci:acwi',metrics:['forwardPE','dividendYield']};
 row.yieldSync={...row.sync}; row.meanSync={status:'ok',lastAttempt:now.toISOString(),lastSuccess:now.toISOString()}; row.growthForecast.sync={...row.meanSync};
 const isolated={sourceCheckAt:now.toISOString(),growthCheckAt:now.toISOString(),indices:[row],primarySourceJobs:[{id:'primary:msci:acwi',indices:['acwi','world','em'],status:'retained'}],sourceJobs:[],growthRefresh:{failures:[]},refresh:{failed:3}};
 assert.equal(updateHealth(isolated,now).failures,1);
});
test('retained evidence exposes check times and independently evaluated cadence',()=>{
 const row=structuredClone(feed.indices.find(r=>r.id==='eafe'));
 const later=new Date('2026-12-31T10:00:00Z'); const h=metricHealth(row,'dividendYield',later);
 assert.equal(h.checkOverdue,true);assert.equal(h.observationStale,true);assert.equal(h.sourceFailure,true);assert.equal(h.evaluatedAt,later.toISOString());
 assert.match(metricStatusText(row,'dividendYield',later),/overdue/);assert.match(metricStatusText(row,'dividendYield',later),/older/);
});

const readCSV=text=>text.split('\n').map(line=>{const cells=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){if(line[i]==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(line[i]===','&&!quoted){cells.push(cell);cell='';}else cell+=line[i];}cells.push(cell);return cells;});
test('CSV carries resolved metric checks and evaluation time without misattributing custom values',()=>{
 const row=feed.indices.find(r=>r.id==='eafe');
 assert.equal(fieldBasis('dividendYield',row,{dividendMode:true}),'source');
 assert.equal(scenarioInputs(row,{...DEFAULTS,dividendMode:'yield',dividendYield:1},{dividendMode:true}).dividendYield,row.dividendYield);
 const model=project({...DEFAULTS,dividendMode:'yield',dividendYield:2.5,growthMode:'source',growthStartYear:2027,annualGrowth:[12.3],growthOverrides:{2027:12.3},years:1});
 const context={healthEvaluatedAt:now.toISOString(),entryMetric:metricProvenance(row,'forwardPE',now),yieldMetric:{classification:'user-assumption',value:2.5,units:'percent'},growthMetric:metricProvenance(row,'growthForecast',now)};
 const rows=readCSV(annualCSV(model,row.growthForecast,context));const values=Object.fromEntries(rows[0].map((h,i)=>[h,rows[2][i]]));
 assert.equal(values['Health evaluated at'],now.toISOString());assert.equal(JSON.parse(values['Entry metric provenance']).synchronization.status,'retained');
 assert.equal(JSON.parse(values['Yield metric provenance']).classification,'user-assumption');assert.equal(JSON.parse(values['Yield metric provenance']).synchronization,undefined);
 assert.equal(values['Growth source provenance'],'');assert.equal(values['Growth basis'],'custom assumption');assert.equal(+values['EPS growth percent'],12.3);
 assert.match(metricDisclosure(row,'dividendYield',now),/Last attempt/);assert.match(metricDisclosure(row,'dividendYield',now),/Last successful validation/);assert.match(metricDisclosure(row,'dividendYield',now),/Truncated PDF/);
});
test('retained Russell and JPM export original source dates, attempts, successes and safe failure summaries',()=>{
 for(const id of ['russell2000','japan']) {
  const row=feed.indices.find(r=>r.id===id),forecast=row.growthForecast,point=forecast.estimates.find(p=>p.year===2027);
  const model=project({...DEFAULTS,growthMode:'source',growthStartYear:2027,annualGrowth:[point.growth],years:1});
  const context={healthEvaluatedAt:now.toISOString(),growthMetric:metricProvenance(row,'growthForecast',now)};
  const rows=readCSV(annualCSV(model,forecast,context)),values=Object.fromEntries(rows[0].map((h,i)=>[h,rows[2][i]])),evidence=JSON.parse(values['Growth source provenance']);
  assert.equal(evidence.synchronization.status,'retained');assert.equal(evidence.synchronization.lastAttempt,forecast.sync.lastAttempt);assert.equal(evidence.synchronization.lastSuccess,forecast.sync.lastSuccess);
  assert.equal(evidence.health.evaluatedAt,now.toISOString());assert.equal(evidence.health.observationDate,forecast.asOf);assert.equal(evidence.health.sourceFailure,true);assert.ok(evidence.health.failureSummary);
 }
});
