import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,project,annualCSV} from '../src/model.js';
import {sourceGrowthPath} from '../src/growth-data.js';
import {scenarioInputs,loadScenarios,saveScenarios} from '../src/scenario-state.js';
const now=new Date('2026-10-23T12:00:00Z');
const forecast={asOf:'2026-10-01',forecastType:'consensus',periodBasis:'calendar-year',source:{publisher:'Test',url:'https://example.com/source'},estimates:[{year:2027,growth:15,periodLabel:'Calendar year 2027'},{year:2028,growth:12,periodLabel:'Calendar year 2028'}]};
const row={id:'sp500',dividendYield:1.2,forwardPE:19,mean10YearForwardPE:18,growthForecast:forecast};
test('source revision protects only the year edited by the reader',()=>{
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:8}}, {},true,now);
 const changed={...row,growthForecast:{...forecast,estimates:[{year:2027,growth:17},{year:2028,growth:10}]}};
 const next=scenarioInputs(changed,input,{},true,now);
 assert.deepEqual(next.annualGrowth,[8,10,8.6667,7.3333,6]);assert.deepEqual(next.growthOverrides,{2027:8});
 assert.deepEqual(sourceGrowthPath(changed,2,now).rates,[17,10]);
});
test('source-linked overrides survive browser storage and stay with their own benchmark',()=>{
 let saved;const storage={setItem:(_,v)=>saved=v,getItem:()=>saved};
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:'8'}}, {},true,now);
 saveScenarios(storage,{scenarios:new Map([['sp500',input]]),overrides:new Map(),selectedIndexId:'sp500',following:true});
 const restored=loadScenarios(storage);assert.deepEqual(restored.scenarios.get('sp500').growthOverrides,{2027:'8'});assert.equal(restored.scenarios.has('em'),false);
});
test('an uncovered year can be supplied without replacing the linked earlier years',()=>{
 const path=sourceGrowthPath(row,4,now,{2029:6});assert.deepEqual(path.rates,[15,12,6,'']);assert.deepEqual(path.missingYears,[2030]);
 const next=sourceGrowthPath(row,2,new Date('2027-10-23T12:00:00Z'),{2027:8,2028:9});assert.deepEqual(next.rates,[9,'']);assert.equal(next.startYear,2028);
});
test('CSV attributes linked and custom years correctly and matches their actual compounded path',()=>{
 const input=scenarioInputs(row,{...DEFAULTS,growthOverrides:{2027:8}}, {},true,now);
 const model=project(input),rows=annualCSV(model,forecast).split('\n').map(r=>r.split(','));
 assert.equal(rows[1][9],'');assert.equal(rows[2][9],'custom assumption');assert.equal(rows[2][10],'');assert.equal(rows[2][11],'');assert.equal(+rows[2].at(-1),8);
 assert.equal(rows[3][9],'consensus');assert.equal(rows[3][10],'2026-10-01');assert.equal(rows[3][11],forecast.source.url);assert.equal(+rows[3].at(-1),12);
 assert.ok(Math.abs(model.last.eps-model.initialEPS*1.08*1.12*(1+10/100)*(1+8/100)*(1+6/100))<1e-10);
});
