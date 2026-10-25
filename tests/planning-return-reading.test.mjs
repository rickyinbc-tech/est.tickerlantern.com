import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {distributionPath,measuredReturnPath,moneyWeightedReturn} from '../src/planning-return-reading-models.js';
import {returnReadingGuides} from '../src/planning-return-reading-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('fund distribution recurrence agrees with independent annuity NAV and reinvested total return',()=>{
 const d=defaults('fundDistributions');
 for(const annualReturn of [-10,0,5,10])for(const distributionRate of [0,8,10])for(const years of [1,5]){
  const p=distributionPath({...d,annualReturn,distributionRate,years}),g=(1+annualReturn/100)**(1/12),n=12*years,c=10*distributionRate/100/12;
  const nav=annualReturn===0?10-n*c:10*g**n-c*(g**n-1)/(g-1);
  near(p.end.nav,nav);assert.ok(nav>0);near(p.end.reinvested,d.initial*(1+annualReturn/100)**years);
  near(p.cash,d.initial*distributionRate/100*years);near(p.end.total,p.end.fund+p.cash);near(p.end.fund,d.initial+p.investmentGain-p.cash);
 }
 const p=distributionPath(d);near(p.end.fund,82418.99763960677);near(p.end.total,122418.99763960677);near(p.end.reinvested,127628.15625);
});
test('outside cash is retained once and changes subsequent exposure rather than creating investment profit',()=>{
 const d=defaults('fundDistributions');
 const zero=distributionPath({...d,annualReturn:0});near(zero.end.total,d.initial);near(zero.investmentGain,0);
 const none=distributionPath({...d,distributionRate:0});near(none.end.total,none.end.reinvested);near(none.cash,0);
 assert.ok(distributionPath(d).end.reinvested>distributionPath(d).end.total);
 const loss=distributionPath({...d,annualReturn:-10});assert.ok(loss.end.total>loss.end.reinvested);assert.ok(loss.end.total<d.initial);
});
test('contribution timing reconciles ending wealth with an independent exposure-period formula',()=>{
 const d=defaults('returnMeasurement');
 for(const firstHalf of [-40,-20,0,40])for(const secondHalf of [-40,0,25,40])for(const depositMonth of [1,6,7,12]){
  const p=measuredReturnPath({...d,firstHalf,secondHalf,depositMonth});
  const remaining=depositMonth<=6?(1+firstHalf/100)**((6-depositMonth)/6)*(1+secondHalf/100):(1+secondHalf/100)**((12-depositMonth)/6);
  const ending=d.initial*(1+firstHalf/100)*(1+secondHalf/100)+d.contribution*remaining;
  near(p.ending,ending);near(p.gain,p.ending-d.initial-d.contribution);near(p.rows.at(-1).normalized/1000-1,p.twr);
  near(d.initial*(1+p.mwr)+d.contribution*(1+p.mwr)**((12-depositMonth)/12),p.ending);
 }
 const p=measuredReturnPath(d);near(p.ending,22500);near(p.gain,2500);near(p.twr,0);near(p.mwr,((-1+Math.sqrt(10))/2)**2-1);
 const points=planningResult('returnMeasurement').charts[0].series[0].rows.filter(r=>r.x===6);assert.equal(points.length,2);near(points[0].value,8000);near(points[1].value,18000);
});
test('money-weighted and time-weighted rates coincide without exposed additional cash but respond to return order',()=>{
 const d=defaults('returnMeasurement');
 for(const changes of [{contribution:0},{depositMonth:12}]){const p=measuredReturnPath({...d,...changes});near(p.mwr,p.twr);}
 const flat=measuredReturnPath({...d,firstHalf:0,secondHalf:0});near(flat.mwr,0);near(flat.gain,0);
 const original=measuredReturnPath(d),reversed=measuredReturnPath({...d,firstHalf:25,secondHalf:-20});near(reversed.twr,original.twr);assert.ok(reversed.mwr<0);assert.ok(original.mwr>0);
 const doubled=measuredReturnPath({...d,initial:d.initial*2,contribution:d.contribution*2});near(doubled.mwr,original.mwr);near(doubled.gain,original.gain*2);
 near(moneyWeightedReturn(10000,0,6,8000),-.2);
});
test('return-reading guides retain complete prose and finite accessible figures across supported input boundaries',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of returnReadingGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800,g.slug);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('returnMeasurement',{...defaults('returnMeasurement'),depositMonth:6.5}),false);
 assert.equal(validInputs('fundDistributions',{...defaults('fundDistributions'),years:1.5}),false);
});
