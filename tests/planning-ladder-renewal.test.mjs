import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { ladderRenewalPlan } from '../src/planning-ladder-renewal-models.js';
import { ladderRenewalGuides } from '../src/planning-ladder-renewal-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('each original rung pays through its maturity year and the new rate begins in the following year',()=>{
  const input=defaults('ladderRenewal'),p=ladderRenewalPlan(input);
  assert.deepEqual(p.rows.slice(1).map(r=>r.income),[2000,1800,1600,1400,1200,1000,1000,1000,1000,1000]);
  near(p.rows[1].oldInterest,2000);near(p.rows[1].newInterest,0);
  near(p.rows[5].oldInterest,400);near(p.rows[5].newInterest,800);
  near(p.rows[6].oldInterest,0);near(p.rows[6].newInterest,1000);
  near(p.totalInterest,10000*(15*.04+35*.02));near(p.totalRolled,100000);
});

test('the spending reserve excludes rolled principal and reconciles every annual income gap',()=>{
  const input=defaults('ladderRenewal'),p=ladderRenewalPlan(input);
  near(p.required,7000);near(p.extra,6000);near(p.ending,-6000);
  near(p.rows[2].reserve,800);near(p.rows[3].reserve,400);near(p.rows[4].reserve,-200);
  near(p.ending,input.incomeReserve+p.totalInterest-10*input.interestNeed);
  const funded=ladderRenewalPlan({...input,incomeReserve:p.required});assert.ok(funded.rows.every(r=>r.reserve>=0));
  assert.ok(p.rows.slice(1).every(r=>r.principalRolled===10000));
});

test('rising renewal rates can restore the endpoint while an earlier opening-cash requirement persists',()=>{
  const input={...defaults('ladderRenewal'),initialCoupon:2,renewalCoupon:4,interestNeed:1500},p=ladderRenewalPlan(input);
  near(p.required,900);near(p.rows[3].reserve,100);near(p.ending,3000);
  for(let year=1;year<=10;year++){
    const old=Math.max(0,6-year);
    near(p.rows[year].income,input.ladderCapital*(old/5*.02+(1-old/5)*.04));
  }
  const equal=ladderRenewalPlan({...input,initialCoupon:4,renewalCoupon:4,interestNeed:2000});near(equal.required,0);
  assert.ok(equal.rows.slice(1).every(r=>r.income===2000));
  const zero=ladderRenewalPlan({...input,ladderCapital:0});near(zero.totalInterest,0);near(zero.totalRolled,0);near(zero.required,15000);
});

test('the source-scoped article has resolved links and four finite accessible charts at supported field edges',()=>{
  const kind='ladderRenewal',guide=ladderRenewalGuides[0],slugs=new Set(planningGuides.map(g=>g.slug));
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,6);
  assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>850);
  for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([k,,,min])=>[k,min])),Object.fromEntries(definitions[kind].fields.map(([k,,,,max])=>[k,max]))]){
    assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){
      const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);
    }
  }
  near(planningResult(kind).charts[3].rows[0].values[1],10500);near(planningResult(kind).charts[3].rows[1].values[1],7000);near(planningResult(kind).charts[3].rows[2].values[1],3500);
});
