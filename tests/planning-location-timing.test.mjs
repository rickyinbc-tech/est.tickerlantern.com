import test from 'node:test';
import assert from 'node:assert/strict';
import { assetLocationPlan, exitWindowPlan, placements, rankedMonths, strongMonthReturns, strongMonthsPlan, strongMonthsSummary, tfsaDollarLimits } from '../src/planning-location-timing-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('CRA TFSA dollar limits sum to CAD 109,000 for 2009–2026',()=>{
 assert.equal(tfsaDollarLimits.length,18);assert.equal(tfsaDollarLimits.reduce((a,[,v])=>a+v,0),109000);
 assert.deepEqual(tfsaDollarLimits.slice(-3).map(([,v])=>v),[7000,7000,7000]);assert.equal(tfsaDollarLimits.find(([y])=>y===2015)[1],10000);
});

test('every placement holds the same combined mix',()=>{
 const input=defaults('assetLocation');
 for(const [key] of placements){const h=assetLocationPlan(input,key).holdings;near(h.tfsaBond+h.taxBond,40000);near(h.tfsaEquity+h.taxEquity,60000);near(h.tfsaBond+h.tfsaEquity,40000);assert.ok(Object.values(h).every(v=>v>=-1e-9));}
});

test('default asset-location results match an independent 40-digit Decimal check',()=>{
 const input=defaults('assetLocation'),[bf,ef,sm]=placements.map(([k])=>assetLocationPlan(input,k));
 near(bf.afterTax,289292.743627384,1e-12);near(ef.afterTax,291493.313454667,1e-12);near(sm.afterTax,290613.085523754,1e-12);
 near(bf.saleTax,17854.7669629471,1e-12);near(ef.annualTax,15019.2051607184,1e-12);
});

test('bond-only non-registered growth follows the after-tax interest recurrence',()=>{
 const input={...defaults('assetLocation'),alTfsa:0,alTaxable:10000,alBond:100,alYears:7};
 const p=assetLocationPlan(input,'bondFirst');near(p.afterTax,10000*(1+.04*.7)**7);near(p.saleTax,0);
});

test('zero tax rates make placement irrelevant; a TFSA-only account is untaxed',()=>{
 const zero={...defaults('assetLocation'),alInterestTax:0,alDistTax:0};const v=placements.map(([k])=>assetLocationPlan(zero,k).afterTax);near(v[0],v[1]);near(v[1],v[2]);
 const tfsa={...defaults('assetLocation'),alTaxable:0};const p=assetLocationPlan(tfsa,'sameMix');near(p.afterTax,16000*1.04**20+24000*1.07**20);
});

test('a loss on the final sale gives no tax value',()=>{
 const p=assetLocationPlan({...defaults('assetLocation'),alEquityGrowth:-5,alEquityDist:0},'bondFirst');assert.equal(p.saleTax,0);
});

test('authored path and hindsight removals match independent results',()=>{
 assert.equal(strongMonthReturns.length,120);
 const input=defaults('strongMonths'),s=strongMonthsSummary(input),{best,worst}=rankedMonths(input);
 assert.deepEqual(best.map(m=>m.month).sort((a,b)=>a-b),[45,47,48,50,52]);assert.deepEqual(worst.map(m=>m.month).sort((a,b)=>a-b),[41,43,44,46,49]);
 near(s.invested,18044.8955738598,1e-12);near(s.missBest,12739.6295032217,1e-12);near(s.missWorst,27590.3419168784,1e-12);near(s.missBoth,19478.6793001681,1e-12);
 near(exitWindowPlan(input).end,15156.7860963080,1e-12);
 near(s.invested,10000*strongMonthReturns.reduce((a,r)=>a*(1+r),1));
});

test('zero removals, zero-length scale and windows behave as identities',()=>{
 const input=defaults('strongMonths'),s0=strongMonthsSummary(input,0);near(s0.missBest,s0.invested);near(s0.missBoth,s0.invested);
 const flat={...input,smScale:0,smCash:0};near(strongMonthsPlan(flat).end,10000);near(exitWindowPlan(flat).end,10000);
 const late=exitWindowPlan({...input,smExit:119,smWindow:24});assert.equal(late.rows.length,121);
 const ranked=rankedMonths(flat,10);assert.equal(new Set([...ranked.best,...ranked.worst].map(m=>m.month)).size,20);
});

test('registered guides have four finite charts, sources and resolvable related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const [slug,kind] of [['tfsa-asset-location-bond-fund-equity-fund-after-tax','assetLocation'],['missing-best-months-worst-months-market-exit-window','strongMonths']]){
  const guide=planningGuides.find(g=>g.slug===slug);assert.ok(guide);assert.equal(guide.planning,kind);
  assert.ok(guide.sources.length>=4);assert.ok(guide.related.every(s=>slugs.has(s)));
  for(const href of guide.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(m=>m[1])))assert.ok(slugs.has(href),href);
  const result=planningResult(kind);assert.equal(result.charts.length,4);
  for(const c of result.charts){assert.ok(c.id&&c.title&&c.note);const values=JSON.stringify(c.rows??c.series);assert.ok(!/null|NaN|Infinity/.test(values));}
 }
});

test('inputs remain valid and finite at their bounds',()=>{
 for(const [kind,edges] of [['assetLocation',[{alTfsa:0,alTaxable:0},{alTfsa:500000,alTaxable:2000000,alBond:100,alBondReturn:10,alEquityGrowth:12,alEquityDist:8,alInterestTax:55,alDistTax:55,alYears:40},{alBond:0,alEquityGrowth:-5,alYears:1}]],['strongMonths',[{smCount:0},{smCount:10,smScale:150,smCash:8,smExit:1,smWindow:24},{smExit:119,smWindow:1,smScale:0}]]]){
  const d=defaults(kind);assert.ok(validInputs(kind,d));
  for(const edge of edges){const input={...d,...edge};assert.ok(validInputs(kind,input));const r=planningResult(kind,input);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));assert.ok(r.charts.every(c=>!/null|NaN|Infinity/.test(JSON.stringify(c.rows??c.series))));}
 }
 assert.equal(validInputs('strongMonths',{...defaults('strongMonths'),smCount:2.5}),false);
});
