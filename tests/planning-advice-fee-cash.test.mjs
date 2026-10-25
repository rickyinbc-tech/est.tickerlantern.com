import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { adviceFeePlan } from '../src/planning-advice-fee-cash-models.js';
import { adviceFeeSource } from '../src/planning-advice-fee-cash-data.js';
import { adviceFeeCashGuides } from '../src/planning-advice-fee-cash-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('the overlapping survey observations stay fixed when independent fees and cash change',()=>{
  assert.equal(adviceFeeSource.rows.length,8);near(adviceFeeSource.rows.reduce((sum,r)=>sum+r.value,0),1.42);
  const result=planningResult('adviceFeeCash');
  assert.equal(result.charts[0].type,'bar');assert.equal(result.charts[0].source,adviceFeeSource.url);
  assert.deepEqual(result.charts[0],planningResult('adviceFeeCash',{...defaults('adviceFeeCash'),feeAssets:100000,projectFee:0,feeCash:50000}).charts[0]);
});

test('default fee totals and outside-cash endpoints reconcile with closed-form amounts',()=>{
  const input=defaults('adviceFeeCash'),p=adviceFeePlan(input);
  near(p.assetMonthly,400000*.008/12);near(p.annualAssetFee,3200);near(p.equivalentAssets,300000);
  const totals=[2500,4800,6400],ends=[3100,800,-800],required=[2500,1200,2800],extra=[500,0,800];
  p.schedules.forEach((s,i)=>{
    near(s.total,totals[i]);near(s.ending,ends[i]);near(s.required,required[i]);near(s.extra,extra[i]);
    near(s.ending,input.feeCash+input.feeSurplus*input.feeMonths-s.total);
  });
  near(p.schedules[0].rows[0].cash,-500);near(p.schedules[1].rows[0].cash,2000);
  near(p.schedules[1].rows[1].cash,1950);near(p.schedules[2].rows[1].paid,3200/12);
});

test('calendar requirements include immediate bills, charge outside assets only once and cure every deficit',()=>{
  for(const feeMonths of [1,12,60])for(const feeSurplus of [0,150,1000]){
    const input={...defaults('adviceFeeCash'),feeMonths,feeSurplus},p=adviceFeePlan(input);
    for(const s of p.schedules){
      near(s.required,s.upfront+Math.max(0,s.monthly-feeSurplus)*feeMonths);
      const funded=adviceFeePlan({...input,feeCash:s.required}).schedules.find(r=>r.name===s.name);
      assert.ok(funded.rows.every(r=>r.cash>=-1e-7));
    }
    near(p.schedules[2].total,input.feeAssets*(input.assetFee/100)*feeMonths/12);
  }
  const zero=adviceFeePlan({...defaults('adviceFeeCash'),projectFee:0,monthlyFee:0,assetFee:0});
  assert.equal(zero.equivalentAssets,null);assert.ok(zero.schedules.every(s=>s.total===0&&s.required===0));
  near(adviceFeePlan({...defaults('adviceFeeCash'),feeAssets:0}).schedules[2].total,0);
});

test('a detailed guide and four accessible figures work at all supported field boundaries',()=>{
  const kind='adviceFeeCash',slugs=new Set(planningGuides.map(g=>g.slug));
  assert.equal(adviceFeeCashGuides.length,1);const guide=adviceFeeCashGuides[0];
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,6);
  assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>850);
  for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([k,,,min])=>[k,min])),Object.fromEntries(definitions[kind].fields.map(([k,,,,max])=>[k,max]))]){
    assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){
      const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
      assert.equal((html.match(/View chart data/g)||[]).length,4);
    }
  }
  const fractional={...defaults(kind),feeMonths:12.5};assert.equal(validInputs(kind,fractional),false);assert.throws(()=>planningResult(kind,fractional));
});
