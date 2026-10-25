import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';import {cpiWindowLedger} from '../src/planning-cpi-window-models.js';import {cpiWindowData as data} from '../src/planning-cpi-window-data.js';import {cpiWindowGuides} from '../src/planning-cpi-window-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure,renderResult} from '../src/planning-charts.js';
const input=o=>({...defaults('cpiWindowCash'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('the CPI source subset preserves thirteen exact monthly periods, definitions, original precision and hashes',()=>{
 assert.equal(data.rows.length,13);assert.equal(data.geography,'Canada');assert.equal(data.aggregate,'All-items');assert.equal(data.released,'2026-10-19');assert.equal(data.indexUnit,'Index, 2002=100');assert.deepEqual(data.series,{nsa:'V41690973',sa:'V41690914',publishedYear:'STATIC_TOTALCPICHANGE'});
 data.rows.forEach((r,k)=>{const d=new Date(Date.UTC(2025,8+k,1)).toISOString().slice(0,7);assert.equal(r.reference,d);for(const key of ['nsa','sa','publishedYear']){assert.match(r[key].original,/^\d+\.\d$/);assert.equal(Number(r[key].original),r[key].value);}});data.sources.forEach(s=>assert.match(s.sha256,/^[a-f0-9]{64}$/));
});
test('official checkpoints, revised August level and each published rate window remain distinct',()=>{
 assert.deepEqual(data.rows.filter((_,k)=>[0,11,12].includes(k)).map(r=>r.nsa.value),[164.9,169.8,170]);assert.equal(data.rows[11].sa.value,169.4);assert.deepEqual(data.rows[11].sa.flags,{r:1});assert.deepEqual(data.publishedRates.map(x=>x.value),[3.1,.1,.4]);assert.equal(data.publishedRates[0].window,'2025-09 to 2026-09');assert.equal(data.publishedRates[1].adjustment,'Not seasonally adjusted');assert.equal(data.publishedRates[2].adjustment,'Seasonally adjusted');
});
test('source figures retain date-labelled tables, the revised row, index units and one-decimal percentages',()=>{
 const r=planningResult('cpiWindowCash'),a=r.charts[0],b=r.charts[1];assert.equal(a.yMin,160);assert.equal(a.yMax,172);assert.equal(a.series[0].rows[0].label,'2025-09');assert.equal(a.series[1].rows[11].label,'2026-08 (R)');assert.equal(a.unit,'decimal');assert.equal(b.unit,'decimal');assert.deepEqual(b.rows.map(x=>x.value),[3.1,.1,.4]);const html=renderFigure(a,300);assert.match(html,/2026-08 \(R\)/);assert.match(html,/2002=100/);assert.ok(renderResult(r,300).includes('<strong>3.1%</strong>'));
});
test('a ratio from rounded published indices is not silently substituted for an official published percentage',()=>{
 const roundedRatio=(170/169.8-1)*100;near(roundedRatio,.11778563015312216);assert.notEqual(data.publishedRates[1].value,roundedRatio);assert.equal(planningResult('cpiWindowCash').charts[1].rows[1].value,.1);near((170/169.4-1)*100,.35419126328217754);
});
test('the default hypothetical path and twelve future bills match independent numerical checkpoints',()=>{
 const r=cpiWindowLedger(input());near(r.ending,3147.210622604417);near(r.priceChange,.04907020753480573);near(r.spending,36949.8662737087);near(r.increment,949.8662737086997);assert.equal(r.baseline,36000);assert.equal(r.rows[0].value,3000);near(r.rows[1].value,3012);assert.equal(r.rows.length,13);
});
test('independent recurrence and geometric-series sums verify growth, zero and deflation cases',()=>{
 for(const rate of [-1,-.4,0,.4,2])for(const budget of [0,3000,20000]){const p=input({windowMonthlyRate:rate,windowBudget:budget}),r=cpiWindowLedger(p),m=rate/100;let cost=budget,total=0;for(let k=1;k<=12;k++){cost*=1+m;total+=cost;near(r.rows[k].value,cost);}near(r.spending,total);const geometric=m===0?12*budget:budget*(1+m)*((1+m)**12-1)/m;near(r.spending,geometric);near(r.priceChange,(1+m)**12-1);}
});
test('the first-year sum excludes the reference bill and differs from twelve final-price bills when prices change',()=>{
 const p=input(),r=cpiWindowLedger(p);near(r.spending,r.rows.slice(1).reduce((s,x)=>s+x.value,0));assert.ok(r.spending<12*r.ending);assert.ok(r.spending<r.rows.reduce((s,x)=>s+x.value,0));const flat=cpiWindowLedger(input({windowMonthlyRate:0}));assert.equal(flat.spending,36000);assert.equal(flat.increment,0);assert.equal(flat.priceChange,0);
});
test('the signed price-path adjustment reconciles both inflation and deflation without negative basket costs',()=>{
 for(const rate of [-1,0,2]){const p=input({windowMonthlyRate:rate}),r=planningResult('cpiWindowCash',p),ledger=cpiWindowLedger(p);near(r.charts[3].rows.reduce((s,x)=>s+x.value,0),ledger.spending);assert.equal(Math.sign(ledger.increment),Math.sign(rate));assert.ok(ledger.rows.every(x=>x.value>0));}
});
test('every cash-input endpoint leaves the official figures and their metric unchanged',()=>{
 const before=JSON.stringify(data),base=planningResult('cpiWindowCash');for(const [key,,,lo,hi] of definitions.cpiWindowCash.fields)for(const v of [lo,hi]){const r=planningResult('cpiWindowCash',input({[key]:v}));assert.deepEqual(r.charts.slice(0,2),base.charts.slice(0,2));assert.deepEqual(r.metrics[0],base.metrics[0]);}assert.equal(JSON.stringify(data),before);
});
test('zero-budget and supported control endpoints produce finite accessible charts, while invalid inputs fail',()=>{
 for(const p of definitions.cpiWindowCash.fields.flatMap(([key,,,lo,hi])=>[input({[key]:lo}),input({[key]:hi})])){assert.ok(validInputs('cpiWindowCash',p));for(const c of planningResult('cpiWindowCash',p).charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 for(const o of [{windowMonthlyRate:-1.01},{windowMonthlyRate:2.01},{windowBudget:-1},{windowBudget:NaN}]){assert.equal(validInputs('cpiWindowCash',input(o)),false);assert.throws(()=>planningResult('cpiWindowCash',input(o)));}
});
test('the substantive English article separates source history, annualization and original cash assumptions',()=>{
 const g=cpiWindowGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>750);assert.match(g.chartScope,/no CPI forecast/);assert.equal(g.sources.length,4);assert.ok(r.charts.slice(0,2).every(x=>x.source));assert.ok(r.charts.slice(2).every(x=>!x.source));g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(planningGuides.filter(x=>x.planning===g.planning).length,1);
});
