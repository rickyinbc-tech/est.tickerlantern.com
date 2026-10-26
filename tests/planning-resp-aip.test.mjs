import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {respAipAllocation} from '../src/planning-resp-aip-models.js';import {respAipGuides} from '../src/planning-resp-aip-guides.js';
import {planningGuides} from '../src/planning-guides.js';import {renderFigure,renderResult} from '../src/planning-charts.js';
const input=o=>({...defaults('respAipClose'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('default closeout sources and the maximum qualifying deduction reconcile independently',()=>{
 const i=input(),p=respAipAllocation(i),r=planningResult('respAipClose',i);
 assert.deepEqual([p.contributions,p.benefits,p.aip,p.total],[32000,6400,26000,64400]);assert.deepEqual([p.remainingLifetime,p.maximumDeduction,p.remainingAip,p.regularTax,p.additionalTax,p.tax,p.subscriberCash,p.retirementAssets],[10000,10000,16000,4800,3200,8000,40000,10000]);assert.equal(p.subscriberCash+p.retirementAssets+p.benefits+p.tax,p.total);
 assert.deepEqual(r.metrics.map(x=>x[1]),[10000,40000,8000]);
});
test('the no-deduction alternative and maximum-deduction plan reconcile to the same starting balance',()=>{
 const i=input(),none=respAipAllocation(i,0),maximum=respAipAllocation(i);
 assert.deepEqual([none.deduction,none.regularTax,none.additionalTax,none.tax,none.subscriberCash],[0,7800,5200,13000,45000]);
 for(const p of [none,maximum])assert.equal(p.subscriberCash+p.retirementAssets+p.benefits+p.tax,64400);
 assert.equal(none.subscriberCash-maximum.subscriberCash,5000);
});
test('RRSP deduction capacity, current AIP and prior use of the separate lifetime ceiling bind independently',()=>{
 const run=o=>respAipAllocation(input(o));
 assert.equal(run({respAipRoom:5000}).maximumDeduction,5000);
 assert.equal(run({respCloseAip:5000}).maximumDeduction,5000);
 assert.equal(run({respAipPriorRelief:50000}).maximumDeduction,0);
 assert.equal(run({respAipPriorRelief:49999.99}).maximumDeduction,.01);
 assert.equal(run({respAipPriorRelief:0,respAipRoom:50000}).maximumDeduction,26000);
 assert.equal(run({respAipRoom:15000,respAipPriorRelief:40000}).maximumDeduction,10000);
});
test('a tax-rate change never changes eligibility capacity, returned benefits or the starting balance',()=>{
 const a=respAipAllocation(input()),b=respAipAllocation(input({respAipTaxRate:0}));assert.equal(a.maximumDeduction,b.maximumDeduction);assert.equal(a.benefits,b.benefits);assert.equal(a.total,b.total);assert.equal(b.additionalTax,3200);assert.equal(b.regularTax,0);assert.equal(b.subscriberCash,44800);
});
test('the tax curve uses separately rounded regular and additional components',()=>{
 const i=input(),r=planningResult('respAipClose',i).charts[2];assert.equal(r.series[0].rows.length,21);assert.deepEqual(r.series[0].rows.at(0),{x:0,value:7800});assert.deepEqual(r.series[1].rows.at(0),{x:0,value:5200});assert.deepEqual(r.series[0].rows.at(-1),{x:10000,value:4800});assert.deepEqual(r.series[1].rows.at(-1),{x:10000,value:3200});
 for(let k=0;k<=20;k++){const d=500*k,p=respAipAllocation(i,d),row=r.series[0].rows[k];assert.equal(row.value,p.regularTax);assert.equal(r.series[1].rows[k].value,p.additionalTax);}
});
test('the maximum-deduction grid keeps tax-year capacity separate from prior lifetime use',()=>{
 const c=planningResult('respAipClose').charts[3];assert.deepEqual(c.rows.map(r=>r.values),[[0,10000,25000,26000],[0,10000,25000,25000],[0,10000,10000,10000],[0,0,0,0]]);assert.equal(c.columns.length,4);
});
test('zero and every independent input endpoint preserve conservation and finite chart tables',()=>{
 const zero=Object.fromEntries(definitions.respAipClose.fields.map(([k])=>[k,0]));
 for(const i of [zero,...definitions.respAipClose.fields.flatMap(([k,,,lo,hi])=>[input({[k]:lo}),input({[k]:hi})])]){
  const r=planningResult('respAipClose',i),p=respAipAllocation(i);assert.equal(p.total,p.contributions+p.benefits+p.aip);assert.equal(p.total,p.subscriberCash+p.retirementAssets+p.benefits+p.tax);assert.equal(r.metrics[0][1],p.maximumDeduction);
  for(const c of r.charts){const html=renderFigure(c,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);}
 }
 assert.deepEqual(planningResult('respAipClose',zero).metrics.map(x=>x[1]),[0,0,0]);
});
test('tax limits hold for half-cent inputs after component-by-component rounding',()=>{
 for(const i of [input({respCloseAip:19999.995,respAipRoom:2500.005,respAipPriorRelief:49999.995,respAipTaxRate:17.5}),input({respCloseAip:.005,respAipRoom:50,respAipTaxRate:60})]){
  const p=respAipAllocation(i);near(p.total,p.subscriberCash+p.retirementAssets+p.benefits+p.tax);assert.ok(p.regularTax>=0&&p.additionalTax>=0);assert.ok(p.maximumDeduction<=p.aip&&p.maximumDeduction<=i.respAipRoom&&p.maximumDeduction<=Math.max(0,50000-i.respAipPriorRelief)+.005);
 }
});
test('invalid inputs and a manually requested amount above a supported limit are rejected',()=>{
 for(const o of [{respCloseAip:-1},{respAipRoom:100001},{respAipPriorRelief:50001},{respAipTaxRate:60.1},{respCloseBenefits:NaN}]){assert.equal(validInputs('respAipClose',input(o)),false);assert.throws(()=>planningResult('respAipClose',input(o)));}
 assert.throws(()=>respAipAllocation(input(),10000.01));assert.throws(()=>respAipAllocation(input({respAipPriorRelief:50000}),.01));
});
test('the English guide is detailed, distinguishable from education withdrawals and tied to public primary sources',()=>{
 const g=respAipGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>1000);assert.equal(g.sources.length,4);assert.ok(g.sources.every(s=>s.url.startsWith('https://www.canada.ca/')));assert.match(g.sections.map(s=>s.html).join(' '),/withholding and final tax are separate/i);assert.match(r.note,/Quebec’s 12% rate is excluded/);assert.ok(r.charts.every(c=>!c.source));const stack=renderFigure(r.charts[1],390);for(const colour of ['#087f76','#102f50','#b8822e','#6758a6'])assert.ok(stack.includes('fill=\"'+colour+'\"'),colour);assert.doesNotMatch(stack,/fill=\"undefined\"/);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug)));assert.equal(planningGuides.filter(x=>x.planning===g.planning).length,1);assert.match(renderResult(r,390),/first AIP requires RESP termination/i);
});
