import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { tuitionCreditCapacityPlan } from '../src/planning-tuition-credit-capacity-models.js';
import { tuitionCreditCapacityGuides } from '../src/planning-tuition-credit-capacity-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('baseline value, absorbed reduction and prepayment refund remain separate default amounts',()=>{
  const input=defaults('tuitionCreditCapacity'),p=tuitionCreditCapacityPlan(input);
  near(p.potential,1120);near(p.used,600);near(p.unabsorbed,520);near(p.after,0);near(p.refund,600);near(p.balance,0);
  near(p.refundWithout,0);near(p.balanceWithout,0);
  const noPrepay=tuitionCreditCapacityPlan({...input,creditPrepaid:0});near(noPrepay.used,600);near(noPrepay.refund,0);
  const partialPrepay=tuitionCreditCapacityPlan({...input,creditPrepaid:300});near(partialPrepay.refund,300);
  const moreTax=tuitionCreditCapacityPlan({...input,creditTax:2000});near(moreTax.used,1120);near(moreTax.after,880);near(moreTax.balance,280);
});

test('conservation identities hold across tax, credit and prepayment boundaries without cashing unused value',()=>{
  for(const creditTuition of [0,4000,8000,50000])for(const creditFactor of [0,14,20])for(const creditTax of [0,500,1500,50000])for(const creditPrepaid of [0,600,50000]){
    const p=tuitionCreditCapacityPlan({creditTuition,creditFactor,creditTax,creditPrepaid});
    near(p.used+p.unabsorbed,p.potential);near(p.used+p.after,creditTax);
    near(p.refund-p.balance,creditPrepaid-p.after);
    near((p.refund-p.balance)-(p.refundWithout-p.balanceWithout),p.used);
    assert.ok(p.used>=0&&p.used<=creditTax);assert.ok(p.used<=p.potential);
    assert.ok(p.refund>=0&&p.refund<=creditPrepaid);assert.ok(p.refund===0||p.balance===0);
    if(creditPrepaid===0)assert.equal(p.refund,0);
    if(creditTax===0)assert.equal(p.used,0);
  }
});

test('scenario charts preserve tax-value units and isolate the different prepayment question',()=>{
  const input=defaults('tuitionCreditCapacity'),result=planningResult('tuitionCreditCapacity');
  assert.deepEqual(result.charts[0].rows.map(r=>r.value),[600,-600]);
  assert.deepEqual(result.charts[1].rows.map(r=>r.values),[[0,1120],[600,520],[1120,0]]);
  const changed=planningResult('tuitionCreditCapacity',{...input,creditPrepaid:0});
  assert.deepEqual(result.charts[0],changed.charts[0]);assert.deepEqual(result.charts[1],changed.charts[1]);assert.deepEqual(result.charts[3],changed.charts[3]);
  const [withCredit,without]=result.charts[2].series;
  for(let i=0;i<withCredit.rows.length;i++)near(withCredit.rows[i].value-without.rows[i].value,600);
  near(result.charts[3].rows[1].values[2],500);near(result.charts[3].rows[2].values[2],1120);near(result.charts[3].rows[2].values[3],1500);
});

test('the detailed English article resolves related links and keeps four accessible charts finite at field edges',()=>{
  const kind='tuitionCreditCapacity',guide=tuitionCreditCapacityGuides[0],slugs=new Set(planningGuides.map(g=>g.slug));
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,6);
  assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>900);
  for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([k,,,min])=>[k,min])),Object.fromEntries(definitions[kind].fields.map(([k,,,,max])=>[k,max]))]){
    assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){
      const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);
    }
  }
  assert.equal(validInputs(kind,{...defaults(kind),creditTax:-1}),false);
  assert.throws(()=>planningResult(kind,{...defaults(kind),creditPrepaid:NaN}));
});
