import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { businessCashPlan, replacementReserve, givingCashPlan } from '../src/planning-longer-budgets-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('business invoices reconcile to receipts, receivables, profit and cash after one earmark',()=>{
  const input=defaults('businessCash'),p=businessCashPlan(input);
  near(p.invoiced,144000);near(p.received,132000);near(p.receivable,12000);near(p.received+p.receivable,p.invoiced);
  near(p.annualProfit,100800);near(p.earmark,25200);near(p.rows.at(-1).end,50800);near(p.ending,25600);
  near(p.ending,input.cash+p.received-p.cost*12-input.draw*12-p.earmark);
  near(planningResult('businessCash').charts[0].rows.reduce((s,r)=>s+r.value,0),p.ending);
});
test('opening cash covers spending before collections and an earmark before the invoice is paid',()=>{
  const input=defaults('businessCash'),p=businessCashPlan(input);
  near(p.rows[1].before,2400);near(p.rows[1].end,2400);near(p.rows[1].free,300);near(p.rows[1].earmark,2100);
  near(p.rows[2].before,-7300);near(p.rows[2].end,6800);near(p.rows[2].free,2600);near(p.required,17300);near(p.extra,7300);
  for(const delay of [0,1,2,3,6]){
    const q=businessCashPlan({...input,collectionDelay:delay});near(q.required,(delay+1)*7600+delay*2100);near(q.receivable,delay*12000);
    const funded=businessCashPlan({...input,collectionDelay:delay,cash:q.required});assert.ok(funded.rows.every(r=>r.before>=-1e-7&&r.free>=-1e-7));
  }
});
test('owner draws change available cash without changing operating profit and losses create no assumed tax refund',()=>{
  const input=defaults('businessCash'),p=businessCashPlan(input),larger=businessCashPlan({...input,draw:6000});
  near(larger.annualProfit,p.annualProfit);near(larger.earmark,p.earmark);near(p.ending-larger.ending,2000*12);
  const loss=businessCashPlan({...input,costPercent:120});near(loss.annualProfit,-28800);near(loss.earmark,0);
  const noTax=businessCashPlan({...input,taxAllowance:0});near(noTax.ending,noTax.rows.at(-1).end);
  const empty=businessCashPlan({...input,revenue:0,draw:0,cash:0});near(empty.required,0);near(empty.ending,0);
});
test('replacement totals count repeated components and independently inflated event costs',()=>{
  const input=defaults('homeReplacement'),p=replacementReserve(input);
  assert.deepEqual(p.totals.map(c=>c.base),[15000,14000,9000]);
  const expected=15000*1.03**8+7000*(1.03**6+1.03**12)+3000*(1.03**4+1.03**8+1.03**12);
  near(p.total,expected);near(p.total,48794.36283914189);near(p.ending,input.saved+144*input.reserveMonthly-expected);
  assert.deepEqual(p.years.filter(y=>y.values.some(v=>v>0)).map(y=>y.year),[4,6,8,12]);
  const withoutGrowth=replacementReserve({...input,costGrowth:0});near(withoutGrowth.total,38000);
});
test('reserve funding must cover the earlier cluster rather than only the twelve-year ending total',()=>{
  const input=defaults('homeReplacement'),p=replacementReserve(input),year8=3000*1.03**4+7000*1.03**6+18000*1.03**8;
  near(p.extra,year8-5000-96*300);near(p.extra,736.7539706800962);near(p.rows[96].value,-p.extra);near(p.ending,-594.3628391418897);
  near(p.monthlyNeeded,307.68);assert.ok((p.total-input.saved)/144<p.monthlyNeeded);
  const funded=replacementReserve(input,0,p.monthlyNeeded),centLess=replacementReserve(input,0,p.monthlyNeeded-.01);
  assert.ok(funded.rows.every(r=>r.value>=-1e-7));assert.ok(centLess.rows.some(r=>r.value<0));
});
test('moving first replacement earlier preserves repeat spacing and can add an event inside the horizon',()=>{
  const input={...defaults('homeReplacement'),roofCost:100,roofCycle:7,heatCost:0,applianceCost:0,costGrowth:0,saved:0,reserveMonthly:0};
  const base=replacementReserve(input),earlier=replacementReserve(input,3);near(base.total,100);near(earlier.total,200);
  assert.deepEqual(earlier.years.filter(y=>y.values[0]>0).map(y=>y.year),[4,11]);
  const earlyClamp=replacementReserve({...input,roofCycle:1},3);assert.deepEqual(earlyClamp.years.filter(y=>y.values[0]>0).map(y=>y.year),Array.from({length:12},(_,i)=>i+1));
});
test('routine allowance is separate from reserve flows and no in-horizon replacements need no reserve saving',()=>{
  const input=defaults('homeReplacement'),p=replacementReserve(input);assert.deepEqual(replacementReserve({...input,routine:2000}),p);
  near(planningResult('homeReplacement').charts[0].rows.at(-1).values[0],14400);
  near(planningResult('homeReplacement',{...input,routine:2000}).charts[0].rows.at(-1).values[0],288000);
  const beyond=replacementReserve({...input,roofCycle:20,heatCycle:20,applianceCycle:20,saved:0,reserveMonthly:0});near(beyond.total,0);assert.equal(beyond.monthlyNeeded,0);near(beyond.extra,0);
  const html=renderResult(planningResult('homeReplacement',{...input,roofCost:0,heatCost:0,applianceCost:0}));assert.match(html,/No modeled replacement bills/);
});
test('gift alternatives preserve each annual commitment and the same ending resources',()=>{
  const input=defaults('givingCash'),plans=['monthly','start','end'].map(t=>givingCashPlan(input,t));
  assert.deepEqual(plans.map(p=>p.required),[950,3000,750]);
  for(const p of plans){near(p.gross,4800);near(p.saving,600);near(p.netOutflow,4200);near(p.ending,400);near(p.rows.at(-1).before,250);
    near(p.rows.slice(1,13).reduce((s,r)=>s+r.gift,0),2400);near(p.rows.slice(13).reduce((s,r)=>s+r.gift,0),2400);
    near(p.ending,input.cash+input.budget*24-p.gross+p.saving);assert.equal(p.rows.filter(r=>r.saving>0).length,1);
  }
});
test('tax-saving resources arrive after the gift and do not remove earlier funding needs',()=>{
  const input=defaults('givingCash'),p=givingCashPlan(input);near(p.rows[15].end,250);near(p.rows[16].before,50);near(p.rows[16].end,800);
  const noSaving=givingCashPlan({...input,taxSaving:0}),late=givingCashPlan({...input,savingMonth:24});near(noSaving.required,1350);near(late.required,1350);near(late.ending,p.ending);
  const budgetZero=givingCashPlan({...input,budget:0});near(budgetZero.required,4200);
});
test('giving model cap is explicit and no gifts produce no assumed tax-saving receipt',()=>{
  const input=defaults('givingCash'),capped=givingCashPlan({...input,taxSaving:12000});near(capped.saving,2400);
  const empty=givingCashPlan({...input,monthlyGift:0,taxSaving:12000});near(empty.gross,0);near(empty.saving,0);near(empty.required,0);near(empty.ending,input.cash+24*input.budget);
});
test('collection, replacement and saving-arrival periods must be whole numbers',()=>{
  for(const [kind,key,value] of [['businessCash','collectionDelay',1.5],['homeReplacement','roofCycle',8.5],['homeReplacement','heatCycle',6.5],['homeReplacement','applianceCycle',4.5],['givingCash','savingMonth',16.5]])assert.equal(validInputs(kind,{...defaults(kind),[key]:value}),false);
});
test('longer budgets retain four finite accessible figures at supported single-field and combined edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['businessCash','homeReplacement','givingCash']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
