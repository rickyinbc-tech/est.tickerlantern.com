import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult } from '../src/planning-models.js';
import { lifeSource, levelFunding, feePath, billCalendar } from '../src/planning-resilience-models.js';
import { renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('life-table snapshot retains verified source anchors, period, preliminary status and complete selected ages',()=>{
  assert.equal(lifeSource.period,'2022/2024');assert.equal(lifeSource.preliminary,true);
  assert.equal(lifeSource.rows.length,36);assert.equal(Object.keys(lifeSource.vectors).length,74);
  assert.deepEqual(lifeSource.rows[0],[65,86136,91475]);
  assert.deepEqual(lifeSource.rows.find(r=>r[0]===90),[90,25102,38423]);
  assert.deepEqual(lifeSource.remainingYearsAt65,{Males:19.43,Females:22.15});
  for(let i=1;i<lifeSource.rows.length;i++){
    assert.equal(lifeSource.rows[i][0],65+i);
    for(const j of [1,2])assert.ok(lifeSource.rows[i][j]>=0&&lifeSource.rows[i][j]<=lifeSource.rows[i-1][j]);
  }
});
test('conditional survival uses the age-65 denominator and source charts stay unchanged under funding edits',()=>{
  const result=planningResult('longevity'),line=result.charts[0];
  near(line.series[0].rows[0].value,1);near(line.series[1].rows[0].value,1);
  near(line.series[0].rows.find(r=>r.x===90).value,25102/86136);
  near(line.series[1].rows.find(r=>r.x===90).value,38423/91475);
  const edited=planningResult('longevity',{gap:50000,years:40,real:-2,capital:0});
  assert.deepEqual(edited.charts.slice(0,2),result.charts.slice(0,2));
  const html=renderFigure(line,300);assert.match(html,/Derived from official statistics/);assert.match(html,/Conditional share/);assert.doesNotMatch(html,/Percentage returns/);
});
test('longevity reserve equals independently discounted year-end cash flows at positive, negative and zero real returns',()=>{
  for(const real of [-2,0,2,5])for(const years of [10,30,40]){
    const expected=Array.from({length:years},(_,i)=>20000/(1+real/100)**(i+1)).reduce((s,v)=>s+v,0);
    near(levelFunding(20000,years,real),expected);
  }
  assert.ok(levelFunding(20000,35,2)>levelFunding(20000,20,2));
  assert.equal(levelFunding(0,30,2),0);
});
test('fee paths match an independent after-cost ordinary-annuity formula',()=>{
  for(const gross of [-5,0,5,10])for(const fee of [0,.25,1.75,3]){
    const input={...defaults('fees'),gross},q=((1+gross/100)*(1-fee/100))**(1/12),n=input.years*12;
    const expected=q===1?input.initial+input.monthly*n:input.initial*q**n+input.monthly*(q**n-1)/(q-1);
    near(feePath(input,fee).end,expected);
  }
});
test('direct fee dollars match an independent sum of opening balances and preserve a negative return effect',()=>{
  for(const gross of [-5,5]){
    const input={...defaults('fees'),gross},fee=1.75,n=input.years*12;
    const g=(1+gross/100)**(1/12),f=1-(1-fee/100)**(1/12),q=g*(1-f);
    const annuity=(q**n-1)/(q-1),sumBalances=input.initial*annuity+input.monthly*(annuity-n)/(q-1);
    const path=feePath(input,fee),free=feePath(input,0);
    near(path.paid,g*f*sumBalances);
    assert.ok((free.end-path.end-path.paid)*(gross<0?-1:1)>0);
  }
});
test('equal or reversed fees keep the comparison honest and waterfall steps reconcile',()=>{
  const input={...defaults('fees'),feeA:2,feeB:.25},result=planningResult('fees',input);
  assert.ok(result.metrics[2][1]<0);
  near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),result.metrics[1][1]);
  near(feePath(input,0).paid,0);
  assert.equal(planningResult('fees',{...input,feeB:2}).metrics[2][1],0);
});
test('calendar preserves the midyear shortage despite a positive annual endpoint and solves the binding deadline',()=>{
  const input=defaults('calendar'),p=billCalendar(input);
  near(p.total,4500);near(p.ending,500);near(p.gap,100);near(p.rows.find(r=>r.x===8).value,-100);
  near(p.required,(input.insurance+input.repairs+input.travel-input.reserve)/8);
  near(p.required,387.5);
  const funded=billCalendar(input,p.required);assert.ok(funded.rows.every(r=>r.value>=-1e-8));
  assert.ok(billCalendar(input,p.required-.01).gap>0);
});
test('calendar empty bills and a fully prepaid year need no extra contribution; annual reconciliation retains spending once',()=>{
  const input=defaults('calendar');
  const empty=billCalendar({...input,insurance:0,repairs:0,travel:0,gifts:0,monthly:0,reserve:0});
  assert.equal(empty.required,0);assert.equal(empty.gap,0);
  const prepaid=billCalendar({...input,reserve:4500,monthly:0});assert.equal(prepaid.required,0);assert.equal(prepaid.gap,0);assert.equal(prepaid.ending,0);
  const result=planningResult('calendar');near(result.charts[2].rows.reduce((sum,r)=>sum+r.value,0),500);
});
test('all resilience topics have four complete figures and finite boundary representations',()=>{
  for(const kind of ['longevity','fees','calendar']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);
    assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const chart of result.charts){const html=renderFigure(chart,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/View chart data/);}
  }
});
