import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { dcaBudgetPlan, fundTaxCashPlan, budgetReturnPaths } from '../src/planning-contribution-tax-cash-models.js';
import { contributionTaxCashGuides } from '../src/planning-contribution-tax-cash-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('income interruption creates the disclosed pause, partial restart and sale comparison',()=>{
 const input=defaults('dcaBudget'),p=dcaBudgetPlan(input),q=dcaBudgetPlan(input,{floor:0});
 assert.deepEqual(p.rows.slice(1,6).map(r=>r.cash),[5300,5600,3400,1700,0]);
 assert.deepEqual(p.rows.slice(1,6).map(r=>r.transfer),[500,500,500,0,0]);
 near(p.rows[9].transfer,200);near(p.transfers,3200);near(p.sales,0);near(p.shortfall,0);near(p.cash,3900);
 near(q.transfers,5500);near(q.rows[5].sale,500);near(q.sales,500);near(q.cash,2100);
 // Independently calculated using Python Decimal and a fractional-unit ledger.
 near(p.wealth,27442.773095551615);near(q.wealth,27624.94142077906);
 assert.ok(p.cash>q.cash&&p.wealth<q.wealth); // Liquidity protection is not a free return enhancement.
});

test('cash plus investment conserves resources and a separate unit ledger prices each transaction',()=>{
 for(const budgetPath of [1,2])for(const floor of [0,3000,20000]){
  const input={...defaults('dcaBudget'),budgetPath},p=dcaBudgetPlan(input,{floor});
  let price=100,units=input.budgetFund/price;
  for(let i=1;i<p.rows.length;i++){
   const row=p.rows[i],prior=p.rows[i-1];price*=1+budgetReturnPaths[budgetPath-1].returns[i-1];
   units+=(row.transfer-row.sale)/price;near(row.fund,units*price);
   near(row.wealth,prior.wealth+row.investmentChange+row.income-row.spending+row.unfunded);
   near(row.cash,Math.max(0,prior.cash+row.income-row.spending+row.sale)-row.transfer);
   assert.ok(row.cash>=0&&row.fund>=0&&row.transfer<=input.budgetTransfer);
   if(row.transfer>0)assert.ok(row.cash>=floor-1e-8);
  }
 }
});

test('flat markets isolate saving and spending, and exhausted resources remain an unfunded expense',()=>{
 const input={...defaults('dcaBudget'),budgetScale:0};
 near(dcaBudgetPlan(input).wealth,27100);near(dcaBudgetPlan(input,{floor:0}).wealth,27100);
 near(dcaBudgetPlan(input,{duration:0}).wealth,34600);
 const none=dcaBudgetPlan({...input,budgetFund:0,budgetCash:0,budgetIncome:0,budgetLowIncome:0});
 near(none.shortfall,12*3200);near(none.wealth,0);near(none.sales,0);near(none.transfers,0);
 const clipped=dcaBudgetPlan({...input,budgetStart:12,budgetDuration:12});
 assert.equal(clipped.rows.filter(r=>r.x>0&&r.income===1500).length,1);
 const unbound=dcaBudgetPlan({...input,budgetFloor:0});assert.deepEqual(unbound,dcaBudgetPlan(input,{floor:0}));
});

test('distribution reinvestment changes units and cash location without creating resources',()=>{
 const input=defaults('fundTaxCash'),p=fundTaxCashPlan(input);
 near(p.distribution,500);near(p.postNav,20);near(p.newUnits,25);near(p.fund,10500);near(p.cash,0);
 near(p.provision,150);near(p.unfunded,150);near(p.net,10350);near(p.maxReinvest,70);
 const retained=fundTaxCashPlan(input,{reinvest:70});near(retained.newUnits,17.5);near(retained.fund,10350);near(retained.cash,150);near(retained.unfunded,0);near(retained.net,p.net);
 for(const reinvest of [0,25,70,100])for(const factor of [0,10,30,60])for(const outside of [0,100,150,1000]){
  const q=fundTaxCashPlan({...input,taxCashOutside:outside},{reinvest,factor});
  near(q.fund+q.cash,10500+outside);near(q.net,10500+outside-500*factor/100);
  near(q.unfunded,Math.max(0,q.provision-q.cash));
  const funded=fundTaxCashPlan({...input,taxCashOutside:outside},{reinvest:q.maxReinvest,factor});near(funded.unfunded,0);
 }
});

test('outside money is counted once, and zero distribution leaves no provision or artificial unit purchase',()=>{
 const input=defaults('fundTaxCash'),outside=fundTaxCashPlan({...input,taxCashOutside:150});
 near(outside.before,10650);near(outside.net,10500);near(outside.maxReinvest,100);near(outside.unfunded,0);
 const none=fundTaxCashPlan({...input,taxCashDistribution:0});near(none.newUnits,0);near(none.provision,0);near(none.maxReinvest,100);near(none.fund,10500);near(none.unfunded,0);
 const result=planningResult('fundTaxCash');
 assert.ok(result.charts[0].rows.every(r=>r.values.reduce((a,b)=>a+b,0)===10500));
 near(result.charts[1].rows.reduce((n,r)=>n+r.value,0),10350);
 near(result.charts[2].series[0].rows.at(-1).value,-150);
});

test('new detailed articles resolve related guides and render four accessible finite chart/table pairs at every field edge',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const guide of contributionTaxCashGuides){
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,7);
  for(const input of [defaults(guide.planning),...['min','max'].map(edge=>Object.fromEntries(definitions[guide.planning].fields.map(f=>[f[0],f[edge==='min'?3:4]])))]){
   assert.ok(validInputs(guide.planning,input));const result=planningResult(guide.planning,input);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('dcaBudget',{...defaults('dcaBudget'),budgetDuration:1.5}),false);
 assert.equal(validInputs('dcaBudget',{...defaults('dcaBudget'),budgetPath:3}),false);
 assert.throws(()=>planningResult('fundTaxCash',{...defaults('fundTaxCash'),taxCashFactor:NaN}));
});
