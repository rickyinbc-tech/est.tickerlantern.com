import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,project,annualCSV} from '../src/model.js';
import {sourceGrowthPath} from '../src/growth-data.js';
import {scenarioInputs,loadScenarios,saveScenarios} from '../src/scenario-state.js';
import {GROWTH_POLICY} from '../src/five-year-growth.js';
const now=new Date('2026-10-23T12:00:00Z');
const forecast={asOf:'2026-10-01',forecastType:'consensus',periodBasis:'calendar-year',source:{publisher:'Test',url:'https://example.com/source'},estimates:[{year:2027,growth:15,periodLabel:'Calendar year 2027'},{year:2028,growth:12,periodLabel:'Calendar year 2028'}]};
const row={id:'sp500',asOf:'2026-10-15',dividendYield:1.2,forwardPE:19,mean10YearForwardPE:18,metricDefinitions:{forwardPE:{economic:{horizon:'rolling-12m'}},growthForecast:{permittedUse:['display','approximate-scenario-growth']}},growthForecast:forecast};
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
function csv(text){return text.split('\n').map(line=>{const cells=[];let v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){cells.push(v);v='';}else v+=c;}return [...cells,v];});}
test('source revision protects only the year edited by the reader',()=>{
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:8}}, {},true,now);
 const changed={...row,growthForecast:{...forecast,estimates:[{year:2027,growth:17},{year:2028,growth:10}]}};
 const next=scenarioInputs(changed,input,{},true,now);
 assert.equal(next.annualGrowth[0],8);[8.42831597663194,8.04,8.04,8.04].forEach((value,i)=>close(next.annualGrowth[i+1],value));assert.deepEqual(next.growthOverrides,{2027:8});
 assert.equal(next.growthPlan[0].basis,'custom assumption');assert.equal(next.growthPlan[1].basis,'calendar-to-forward model');assert.ok(next.growthPlan.slice(2).every(p=>p.basis==='long-term EPS projection'));
 assert.deepEqual(sourceGrowthPath(changed,2,now).rates,[17,10]);
});
test('source-linked overrides survive browser storage and stay with their own benchmark',()=>{
 let saved;const storage={setItem:(_,v)=>saved=v,getItem:()=>saved};
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:'8'}}, {},true,now);
 saveScenarios(storage,{scenarios:new Map([['sp500',input]]),overrides:new Map(),selectedIndexId:'sp500',following:true});
 const restored=loadScenarios(storage);assert.deepEqual(restored.scenarios.get('sp500').growthOverrides,{2027:'8'});assert.equal(restored.scenarios.get('sp500').growthPolicyVersion,GROWTH_POLICY.version);assert.equal(restored.scenarios.has('em'),false);
});
test('an uncovered year can be supplied without replacing the linked earlier years',()=>{
 const path=sourceGrowthPath(row,4,now,{2029:6});assert.deepEqual(path.rates,[15,12,6,'']);assert.deepEqual(path.missingYears,[2030]);
 const next=sourceGrowthPath(row,2,new Date('2027-10-23T12:00:00Z'),{2027:8,2028:9});assert.deepEqual(next.rates,[9,'']);assert.equal(next.startYear,2028);
});
test('CSV distinguishes published periods, long-term projections and reader overrides',()=>{
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:8}}, {},true,now);
 const model=project(input),rows=csv(annualCSV(model,forecast));
 assert.equal(rows[1][9],'');assert.equal(rows[2][9],'custom assumption');assert.equal(rows[2][10],'');assert.equal(rows[2][11],'');assert.equal(+rows[2].at(-1),8);
 assert.equal(rows[3][9],'calendar-to-forward model');assert.equal(rows[3][10],'');assert.equal(rows[3][11],'');close(+rows[3].at(-1),8.813282595633897);
 assert.equal(rows[3][8],'Holding year 2 · modeled NTM transition');
 const evidence=JSON.parse(rows[3][rows[0].indexOf('Growth source provenance')]);
 assert.equal(evidence.policyVersion,GROWTH_POLICY.version);assert.equal(evidence.sourceEvidence.url,forecast.source.url);
 assert.equal(evidence.sourceEvidence.calendarInputs[1].year,2028);assert.equal(evidence.sourceEvidence.calendarInputs[1].source.periodBasis,'calendar-year');
 close(model.last.eps,model.initialEPS*1.08*1.088132825956339*1.0804**3);
});
test('display-only evidence never upgrades a long-term projection into published consensus',()=>{
 const reference={...row,metricDefinitions:{growthForecast:{permittedUse:['display']}},growthForecast:{...forecast,estimates:[{year:2027,growth:8.04,periodLabel:'Calendar year 2027'}]}};
 const model=project(scenarioInputs(reference,undefined,{},true,now)),rows=csv(annualCSV(model,reference.growthForecast));
 assert.equal(+rows[2].at(-1),8.04);assert.equal(rows[2][9],'long-term EPS projection');assert.equal(rows[2][10],'');assert.equal(rows[2][11],'');
 const evidence=JSON.parse(rows[2][rows[0].indexOf('Growth source provenance')]);
 assert.equal(evidence.policyVersion,GROWTH_POLICY.version);assert.equal(evidence.sourceEvidence.publisher,'Invesco Solutions');
});
