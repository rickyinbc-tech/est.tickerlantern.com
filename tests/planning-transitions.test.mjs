import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { bridgePlan, careCash, estateLedger } from '../src/planning-transitions-models.js';
import { caregivingSource } from '../src/planning-care-data.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('retirement bridge follows the income calendar and distinguishes pre-start gaps from all-horizon capital',()=>{
  const p=bridgePlan({...defaults('retirementBridge'),inflation:0,rate:0});
  assert.deepEqual(p.rows.slice(1).map(r=>r.gap),[30000,30000,30000,42000,42000,18000,18000,18000,18000,18000,18000,18000]);
  near(p.bridgeGap,174000);near(p.totalGap,300000);near(p.capital,300000);near(p.value,0);near(p.unfunded,100000);
});
test('bridge capital matches a discounted annuity and fully funds its defined schedule without a terminal reserve',()=>{
  for(const rate of [-5,0,4,8]){
    const input={...defaults('retirementBridge'),spending:60000,base:40000,later:0,work:0,inflation:0,rate,years:12,reserve:0};
    const p=bridgePlan(input),r=rate/100,expected=r===0?20000*12:20000*(1-(1+r)**-12)/r;
    near(p.capital,expected);
    const funded=bridgePlan({...input,reserve:p.capital});near(funded.value,0);near(funded.unfunded,0);
  }
});
test('bridge withdrawals stop at assets, and income surplus does not become an assumed deposit',()=>{
  const empty=bridgePlan({...defaults('retirementBridge'),reserve:0});near(empty.unfunded,empty.totalGap);
  const surplus=bridgePlan({...defaults('retirementBridge'),base:100000,later:100000,work:100000,rate:0});
  near(surplus.totalGap,0);near(surplus.capital,0);near(surplus.value,200000);assert.ok(surplus.rows[1].surplus>0);
  const end=bridgePlan({...defaults('retirementBridge'),startYear:15,years:5});near(end.bridgeGap,end.totalGap);
});
test('caregiving monthly conversion, setup and lost earnings reconcile to the default cash gap',()=>{
  const p=careCash(defaults('caregiving'));near(p.paid,8*35*52/12);near(p.draw,1363.3333333333333);near(p.required,34720);near(p.extra,22720);
  near(p.rows[0].value,10000);assert.ok(p.rows[7].value>0&&p.rows[8].value<0);near(p.ending,-22720);
});
test('later caregiving replenishment cannot pay setup in advance, and reserve offsets are floored at zero',()=>{
  const input={...defaults('caregiving'),hours:0,travel:0,lostIncome:0,support:0,surplus:1000,setup:5000,reserve:1000,months:12};
  const p=careCash(input);near(p.draw,-1000);near(p.required,5000);near(p.extra,4000);near(p.ending,8000);
  near(careCash({...input,reserve:10000}).extra,0);
});
test('estate timing can require cash even with a positive endpoint, while zero sale proceeds expose a permanent gap',()=>{
  const input=defaults('estateCash'),p=estateLedger(input);near(p.extra,67000);near(p.costs,116000);near(p.ending,159000);
  near(p.rows[6].value,-64000);near(p.rows[8].value,-67000);near(p.rows[9].value,181500);
  const early=estateLedger({...input,receiptMonth:3});near(early.extra,0);near(early.ending,p.ending);
  const noSale=estateLedger({...input,sale:0});near(noSale.extra,91000);near(noSale.ending,-91000);
});
test('estate access-date convention treats same-month receipts as arriving before payment and retains time-zero shortfalls',()=>{
  const input={...defaults('estateCash'),cash:0,immediate:0,monthly:0,taxPayment:50000,dueMonth:6,sale:50000,receiptMonth:6};
  near(estateLedger(input).extra,0);near(estateLedger({...input,receiptMonth:7}).extra,50000);
  near(estateLedger({...input,immediate:10000}).extra,10000);
  const base=defaults('estateCash');
  for(const receiptMonth of [1,6,12,24])for(const dueMonth of [1,6,12,24]){
    const p=estateLedger({...base,receiptMonth,dueMonth});near(p.ending,base.cash+base.sale-base.immediate-base.taxPayment-base.monthly*24);
  }
});
test('caregiving data preserve four mutually exclusive survey estimates with confidence bounds and dated scope',()=>{
  assert.equal(caregivingSource.period,'2022');assert.equal(caregivingSource.released,'2024-04-02');
  assert.deepEqual(caregivingSource.rows.map(r=>r.percent),[58.1,14.4,21.9,5.6]);
  near(caregivingSource.rows.reduce((s,r)=>s+r.percent,0),100);
  for(const row of caregivingSource.rows)assert.ok(0<=row.lower&&row.lower<=row.percent&&row.percent<=row.upper&&row.upper<=100);
  const before=planningResult('caregiving').charts[0],after=planningResult('caregiving',{...defaults('caregiving'),hours:40,months:60}).charts[0];assert.deepEqual(before,after);
});
test('new schedule date inputs reject fractional calendar periods',()=>{
  for(const [kind,key] of [['retirementBridge','startYear'],['retirementBridge','workYears'],['estateCash','dueMonth'],['estateCash','receiptMonth']]){
    assert.equal(validInputs(kind,{...defaults(kind),[key]:2.5}),false);
    assert.throws(()=>planningResult(kind,{...defaults(kind),[key]:2.5}));
  }
});
test('transition figures retain finite numerical values at supported edges and expose accessible data',()=>{
  const walk=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};
  for(const kind of ['retirementBridge','caregiving','estateCash']){
    const d=defaults(kind),inputs=[d,...definitions[kind].fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])];
    for(const input of inputs){const result=planningResult(kind,input);walk(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
