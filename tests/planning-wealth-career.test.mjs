import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { trainingPlan, pensionBuybackPlan } from '../src/planning-wealth-career-models.js';
import { wealthSource } from '../src/planning-wealth-data.js';
import { wealthCareerGuides } from '../src/planning-wealth-career-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
const annuity=(rate,months)=>rate===0?months:(1-(1+rate)**-months)/rate;

test('wealth observations remain fixed while the hypothetical balance sheet and liquidity change',()=>{
  const input=defaults('wealthContext'),p=planningResult('wealthContext');
  near(p.metrics[0][1],465000);near(p.metrics[2][1],5);
  const changed=planningResult('wealthContext',{...input,home:1000000,cash:30000});
  assert.deepEqual(p.charts.slice(0,3),changed.charts.slice(0,3));near(changed.metrics[0][1],880000);near(changed.metrics[2][1],10);
  const negative=planningResult('wealthContext',{...input,home:0,pension:0,cash:0,debt:100000});
  near(negative.metrics[0][1],-100000);near(negative.charts[3].rows.reduce((s,r)=>s+r.value,0),-100000);
  assert.equal(wealthSource.ages.length,5);assert.equal(wealthSource.provinces.length,10);assert.equal(wealthSource.national,519700);
});

test('training opportunity cost, nominal recovery and common ten-year endpoint reconcile',()=>{
  const input=defaults('careerTraining'),p=trainingPlan(input);
  near(p.cost,30000);near(p.foregone,2000);near(p.gain,550);assert.equal(p.transition,9);assert.equal(p.recovery,64);
  near(p.rows[9].value,-30000);near(p.rows[63].value,-300);near(p.rows[64].value,250);near(p.ending,31050);
  near(p.ending,-12000-2000*9+700*111-150*111);
  const longer=trainingPlan({...input,delay:6});near(longer.cost,36000);near(longer.ending,23400);assert.equal(longer.rows.at(-1).x,120);
  near(trainingPlan({...input,discount:0}).npv,p.ending);
});

test('training present value matches independent deferred-annuity algebra',()=>{
  const input=defaults('careerTraining'),p=trainingPlan(input),rate=1.04**(1/12)-1;
  near(p.npv,-12000-2000*annuity(rate,9)+550*annuity(rate,111)/(1+rate)**9);
  assert.equal(trainingPlan({...input,uplift:150}).recovery,null);
  assert.equal(trainingPlan({...input,uplift:0}).recovery,null);
  assert.equal(trainingPlan({...input,uplift:200}).recovery,null);
  const free=trainingPlan({...input,tuition:0,retained:100,extraCosts:0,uplift:0});near(free.cost,0);near(free.npv,0);assert.equal(free.recovery,0);
});

test('pension cash schedule keeps the wait, deduction term and annual indexing separate',()=>{
  const input=defaults('pensionBuyback'),p=pensionBuybackPlan({...input,discount:0,index:0});
  near(p.totalInstalments,42000);near(p.pvBenefits,90000);near(p.upfrontNPV,60000);near(p.instalmentNPV,48000);
  near(p.upfrontRows[10].value,-30000);near(p.upfrontRows[11].value,-27000);near(p.instalmentRows[10].value,-42000);near(p.instalmentRows[11].value,-39000);
  assert.equal(p.upfrontRows.at(-1).x,40);near(p.remainingPayments,0);
  const indexed=pensionBuybackPlan({...input,wait:0,paymentYears:2,index:2,discount:0});
  near(indexed.upfrontRows[1].value,-27000);near(indexed.upfrontRows[2].value,-23940);
  near(indexed.instalmentRows[1].value,-1200);near(indexed.instalmentRows[2].value,-2340);
  near(indexed.pvBenefits,3000*((1.02**30-1)/.02));
});

test('pension present values reconcile independently with a deferred level-payment annuity',()=>{
  const input=defaults('pensionBuyback'),p=pensionBuybackPlan({...input,index:0}),r=1.04**(1/12)-1;
  near(p.pvBenefits,250*annuity(r,360)/(1+r)**120);near(p.pvInstalments,350*annuity(r,120));
  near(p.upfrontNPV,p.pvBenefits-30000);near(p.instalmentNPV,p.pvBenefits-p.pvInstalments);
  const noBenefit=pensionBuybackPlan({...input,benefit:0});near(noBenefit.upfrontNPV,-30000);
  assert.ok(pensionBuybackPlan(input,10).upfrontNPV<pensionBuybackPlan(input,30).upfrontNPV);
});

test('all new models render four finite charts at default and supported extremes, with integer calendar validation',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  for(const guide of wealthCareerGuides){
    assert.ok(guide.related.every(s=>slugs.has(s)));assert.ok(guide.sections.length>=6);
    const kind=guide.planning;
    for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([k,,,min])=>[k,min])),Object.fromEntries(definitions[kind].fields.map(([k,,,,max])=>[k,max]))]){
      assert.ok(validInputs(kind,input));const p=planningResult(kind,input);assert.equal(p.charts.length,4);
      for(const width of [300,760]){const html=renderResult(p,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);}
    }
  }
  for(const [kind,key] of [['careerTraining','study'],['careerTraining','delay'],['pensionBuyback','paymentYears'],['pensionBuyback','wait']]){
    const input={...defaults(kind),[key]:1.5};assert.equal(validInputs(kind,input),false);assert.throws(()=>planningResult(kind,input));
  }
});
