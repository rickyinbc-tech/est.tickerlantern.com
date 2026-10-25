import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult } from '../src/planning-models.js';
import { lookthroughPortfolio,lookthroughPositions } from '../src/planning-lookthrough-models.js';
import { planningGuides } from '../src/planning-guides.js';
import { guides as investmentGuides } from '../src/research-guides.js';
import { renderResult,renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the complete invented matrix allocates every fund dollar exactly once',()=>{
  for(let fund=0;fund<3;fund++)near(lookthroughPositions.reduce((n,r)=>n+r.weights[fund],0),1);
  const p=lookthroughPortfolio(defaults('fundLookthroughPlanning'));near(p.total,100000);near(p.positions.reduce((n,r)=>n+r.value,0),p.total);near(p.positions.reduce((n,r)=>n+r.share,0),1);
  assert.deepEqual(p.positions.map(r=>r.value),[35000,18000,19000,12000,16000]);
});
test('Company A combines the fund portions and direct position without adding wrappers again',()=>{
  const p=lookthroughPortfolio(defaults('fundLookthroughPlanning'));assert.deepEqual(p.companyA.fromFunds,[16000,9000,0]);near(p.companyA.direct,10000);near(p.companyA.value,35000);near(p.companyA.share,.35);
  near(planningResult('fundLookthroughPlanning').charts[4].rows.reduce((n,r)=>n+r.value,0),p.companyA.value);near(p.companyA.share-p.companyA.direct/p.total,.25);
});
test('asset and geography are separate complete partitions with overlapping categories',()=>{
  const p=lookthroughPortfolio(defaults('fundLookthroughPlanning'));near(p.equity,72000);near(p.bonds,28000);near(p.us,69000);near(p.nonUs,31000);near(p.equity+p.bonds,p.total);near(p.us+p.nonUs,p.total);
  const both=(asset,geography)=>p.positions.filter(r=>r.asset===asset&&r.geography===geography).reduce((n,r)=>n+r.value,0);
  assert.deepEqual([both('equity','US'),both('equity','Non-US'),both('bond','US'),both('bond','Non-US')],[53000,19000,16000,12000]);
});
test('scaling the whole portfolio preserves shares and changing direct A also changes the denominator',()=>{
  const d=defaults('fundLookthroughPlanning'),p=lookthroughPortfolio(d),twice=lookthroughPortfolio(Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v*2])));
  near(twice.total,p.total*2);for(let i=0;i<p.positions.length;i++){near(twice.positions[i].value,p.positions[i].value*2);near(twice.positions[i].share,p.positions[i].share);}
  const more=lookthroughPortfolio({...d,lookDirectA:20000});near(more.total,110000);near(more.companyA.value,45000);near(more.companyA.share,45000/110000);
});
test('empty portfolios keep percentages unavailable and the fixed composition independent of balances',()=>{
  const d=Object.fromEntries(Object.keys(defaults('fundLookthroughPlanning')).map(k=>[k,0])),p=lookthroughPortfolio(d),result=planningResult('fundLookthroughPlanning',d);
  near(p.total,0);assert.equal(p.companyA.share,null);assert.equal(p.equityShare,null);assert.ok(p.positions.every(r=>r.share===null));assert.match(result.note,/No portfolio entered/);
  const html=renderFigure(result.charts[3],300);assert.match(html,/allocation unavailable/);assert.doesNotMatch(html,/0\.0%/);
  assert.deepEqual(result.charts[1],planningResult('fundLookthroughPlanning').charts[1]);
});
test('the concentration upgrade preserves its existing URL as one chart-enabled guide',()=>{
  const matches=[...planningGuides,...investmentGuides].filter(g=>g.slug==='portfolio-concentration-overlap');assert.equal(matches.length,1);assert.equal(matches[0].planning,'fundLookthroughPlanning');
  assert.equal(investmentGuides.some(g=>g.slug===matches[0].slug),false);assert.equal(planningResult(matches[0].planning).charts.length,5);
  const separate=matches[0].sections.find(s=>s.id==='look-through');assert.match(separate.html,/Fund P/);assert.match(separate.html,/Fund Q/);assert.match(separate.html,/26\.6%/);
});
test('nonnegative boundary balances retain five finite accessible figures and do not mutate the fixture',()=>{
  const kind='fundLookthroughPlanning',d=defaults(kind),fields=definitions[kind].fields,before=JSON.stringify(lookthroughPositions),inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const p=lookthroughPortfolio(input),result=planningResult(kind,input);finite(result);near(p.positions.reduce((n,r)=>n+r.value,0),p.total);assert.equal(result.charts.length,5);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
  assert.equal(JSON.stringify(lookthroughPositions),before);
});
