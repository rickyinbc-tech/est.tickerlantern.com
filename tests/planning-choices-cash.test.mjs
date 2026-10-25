import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { instalmentCalendar, contributionMix, parentalBudget, parentalParameters } from '../src/planning-choices-cash-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('four instalments per purchase aggregate into the expected weeks without charging the full price again',()=>{
  const input=defaults('bnplCalendar'),p=instalmentCalendar(input);near(p.total,1800);near(p.peak,450);
  assert.deepEqual(p.schedule.filter(r=>r.values.some(v=>v>0)).map(r=>r.week),[0,2,4,6,8,10]);
  assert.deepEqual(p.schedule[4].values,[200,150,100]);assert.deepEqual(p.schedule[6].values,[200,150,100]);
  for(let i=0;i<3;i++)near(p.schedule.reduce((sum,r)=>sum+r.values[i],0),p.amounts[i]);
  near(p.rows.reduce((sum,r)=>sum+r.payment,0),p.total);
});
test('BNPL funding includes time-zero payments and later bills before each weekly surplus',()=>{
  const input=defaults('bnplCalendar'),p=instalmentCalendar(input);near(p.rows[0].before,100);near(p.rows[0].end,100);
  near(p.rows[2].before,-150);near(p.rows[2].end,-50);near(p.rows[8].before,-700);near(p.required,1000);near(p.extra,700);near(p.ending,-300);
  near(p.ending,input.cash+12*input.surplus-p.total);
  const funded=instalmentCalendar({...input,cash:p.required});assert.ok(funded.rows.every(r=>r.before>=0&&r.end>=0));
});
test('purchase spacing changes timing while preserving all amounts and twelve weekly resources',()=>{
  const input=defaults('bnplCalendar');for(const gapWeeks of [0,1,2,3]){const p=instalmentCalendar({...input,gapWeeks});near(p.total,1800);near(p.rows.reduce((s,r)=>s+r.payment,0),1800);near(p.ending,-300);assert.equal(p.rows.length,13);}
  const noIncome=instalmentCalendar({...input,surplus:0});near(noIncome.required,1800);
  const empty=instalmentCalendar({...input,purchaseA:0,purchaseB:0,purchaseC:0});near(empty.required,0);near(empty.peak,0);near(empty.ending,input.cash+12*input.surplus);
});
test('buy-only allocation preserves existing holdings and uses the new contribution exactly once',()=>{
  const input=defaults('newMoneyMix'),p=contributionMix(input);near(p.total,100000);near(p.afterTotal,105000);near(p.weight,.65);near(p.afterWeight,65000/105000);
  near(p.buyA,0);near(p.buyB,5000);near(p.afterA,65000);near(p.afterB,40000);near(p.gap,(65000/105000-.6)*100);
  for(const contribution of [0,5000,8333.34,10000,200000]){const q=contributionMix({...input,contribution});near(q.buyA+q.buyB,contribution);near(q.afterA+q.afterB,q.afterTotal);assert.ok(q.afterA>=input.assetA&&q.afterB>=input.assetB);}
});
test('the minimum cash threshold is independently solved from the overweight holding and rounded upward',()=>{
  const input=defaults('newMoneyMix'),p=contributionMix(input);near(p.exact,65000/.6-100000);near(p.required,8333.34);
  const enough=contributionMix({...input,contribution:p.required}),short=contributionMix({...input,contribution:p.required-.01});near(enough.afterWeight,.6);assert.ok(short.afterWeight>.6);
  const under=contributionMix({...input,assetA:35000,assetB:65000});near(under.required,65000/.4-100000);near(under.buyA,5000);near(under.buyB,0);
  const matched=contributionMix({...input,assetA:60000,assetB:40000});near(matched.required,0);near(matched.buyA,3000);near(matched.buyB,2000);
});
test('empty portfolios keep undefined weights explicit while positive contributions can establish a mix',()=>{
  const input={...defaults('newMoneyMix'),assetA:0,assetB:0,contribution:0},empty=contributionMix(input);assert.equal(empty.weight,null);assert.equal(empty.afterWeight,null);assert.equal(empty.required,null);
  const funded=contributionMix({...input,contribution:5000});near(funded.buyA,3000);near(funded.buyB,2000);near(funded.afterWeight,.6);
  const result=planningResult('newMoneyMix',input);assert.match(renderResult(result),/No holdings/);assert.match(renderResult(result),/<caption>Remaining allocation gap across targets and contributions · percentage points<\/caption>/);assert.equal(result.charts[3].rows[0].values[0],null);
  const large=planningResult('newMoneyMix',{...defaults('newMoneyMix'),assetA:1000000,assetB:1000000,targetA:5,contribution:200000});assert.ok(large.charts[2].series.every(s=>s.rows.every(r=>r.x<=200000)));
});
test('parental parameter graphic preserves gross published rates and one-parent maxima independently of net cash assumptions',()=>{
  assert.equal(parentalParameters.standardRate,.55);assert.equal(parentalParameters.extendedRate,.33);assert.equal(parentalParameters.standardSingleParentWeeks,35);assert.equal(parentalParameters.extendedSingleParentWeeks,61);assert.equal(parentalParameters.reviewed,'2026-10-25');
  const changed=planningResult('parentalCash',{...defaults('parentalCash'),standardNet:1500,extendedNet:1000,otherNet:0});assert.deepEqual(changed.charts[0],planningResult('parentalCash').charts[0]);
  assert.equal(validInputs('parentalCash',{...defaults('parentalCash'),standardWeeks:36}),false);assert.equal(validInputs('parentalCash',{...defaults('parentalCash'),extendedWeeks:62}),false);
});
test('parental alternatives reconcile independently over equal 78-week windows with different spending phases',()=>{
  const input=defaults('parentalCash'),standard=parentalBudget(input),extended=parentalBudget(input,true);
  near(standard.leavePaid,35*600);near(standard.workPaid,43*1000);near(standard.spending,35*900+43*1100);
  near(extended.leavePaid,61*360);near(extended.workPaid,17*1000);near(extended.spending,61*900+17*1100);
  for(const p of [standard,extended])near(p.ending,input.cash-input.setup+p.leavePaid+p.workPaid+78*input.otherNet-p.spending);
  near(standard.ending,19400);near(extended.ending,-440);near(extended.ending-standard.ending,-19840);
  near(planningResult('parentalCash').charts[3].rows.reduce((s,r)=>s+r.value,0),extended.ending-standard.ending);
});
test('parent cash needs include the first return-to-work budget before its higher income receipt',()=>{
  const input=defaults('parentalCash'),standard=parentalBudget(input),extended=parentalBudget(input,true);
  near(standard.required,2900);near(extended.required,11640);near(extended.extra,6640);near(extended.rows[61].end,-5540);near(extended.rows[62].before,-6640);near(extended.rows[62].end,-5240);
  near(standard.rows[35].parent,600);near(standard.rows[36].parent,1000);near(extended.rows[61].parent,360);near(extended.rows[62].parent,1000);
  near(extended.rows[61].expense,900);near(extended.rows[62].expense,1100);
  const funded=parentalBudget({...input,cash:extended.required},true);assert.ok(funded.rows.every(r=>r.before>=0&&r.end>=0));
});
test('instalment gaps and leave durations reject fractional calendar periods',()=>{
  for(const [kind,key,value] of [['bnplCalendar','gapWeeks',1.5],['parentalCash','standardWeeks',20.5],['parentalCash','extendedWeeks',40.5]])assert.equal(validInputs(kind,{...defaults(kind),[key]:value}),false);
});
test('choices-and-cash models retain finite accessible graphics at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['bnplCalendar','newMoneyMix','parentalCash']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input),count=kind==='parentalCash'?5:4;finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
