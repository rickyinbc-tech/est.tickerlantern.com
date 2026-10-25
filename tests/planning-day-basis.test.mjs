import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {calendarYearDays,dayBasisLedger} from '../src/planning-day-basis-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('the default exact interval includes its start, excludes its close and partitions 91 actual dates',()=>{
 const d=defaults('dayBasis'),p=dayBasisLedger(d);assert.equal(p.start,'2027-12-15');assert.equal(p.close,'2028-03-15');assert.equal(p.days.length,91);assert.equal(new Set(p.days.map(r=>r.date)).size,91);
 assert.equal(p.days[0].date,'2027-12-15');assert.equal(p.days.at(-1).date,'2028-03-14');assert.ok(p.days.some(r=>r.date==='2028-02-29'));
 assert.deepEqual(p.years,[{year:2027,count:17,denominator:365},{year:2028,count:74,denominator:366}]);
 near(p.last.fixed365,124.65753424657534);near(p.last.fixed360,126.38888888888889);near(p.last.calendar,10000*.05*(17/365+74/366));near(p.last.fixed360-p.last.fixed365,1.73135464231355);
});
test('independent year-end arithmetic matches all December starts and several actual-day windows',()=>{
 const d=defaults('dayBasis');
 for(let start=1;start<=31;start++)for(const n of [1,30,91,180]){
  const p=dayBasisLedger({...d,dayBasisStart:start,dayBasisDays:n}),a=Math.min(n,32-start),b=n-a;
  near(p.last.calendar,500*(a/365+b/366));assert.equal(p.years.reduce((s,r)=>s+r.count,0),n);assert.equal(p.rows.length,n+1);
  assert.equal(p.years.find(r=>r.year===2027).count,a);assert.equal(p.years.find(r=>r.year===2028)?.count??0,b);
  let daily=0;for(const day of p.days)daily+=500/(day.year===2027?365:366);near(daily,p.last.calendar);
 }
});
test('closing on 1 January does not accrue that date; adding a day includes the leap-year denominator',()=>{
 const d={...defaults('dayBasis'),dayBasisStart:31,dayBasisDays:1},a=dayBasisLedger(d),b=dayBasisLedger({...d,dayBasisDays:2});
 assert.equal(a.close,'2028-01-01');assert.deepEqual(a.years,[{year:2027,count:1,denominator:365}]);near(a.last.calendar,a.last.fixed365);
 assert.equal(b.close,'2028-01-02');assert.equal(b.days[1].date,'2028-01-01');near(b.last.calendar,500/365+500/366);
 assert.equal(calendarYearDays(1900),365);assert.equal(calendarYearDays(2000),366);assert.equal(calendarYearDays(2027),365);assert.equal(calendarYearDays(2028),366);assert.equal(calendarYearDays(2100),365);
});
test('fixed denominators use actual days and retain their ratio, with no compounding',()=>{
 const d=defaults('dayBasis'),p=dayBasisLedger(d);
 for(const row of p.rows){near(row.fixed365,500*row.x/365);near(row.fixed360,500*row.x/360);if(row.x)near(row.fixed360/row.fixed365,365/360);}
 near(p.rows[0].calendar,0);near(p.rows[0].fixed365,0);near(p.rows[0].fixed360,0);
 const simpleLast=500*d.dayBasisDays/365,compounded=10000*((1+.05/365)**d.dayBasisDays-1);near(p.last.fixed365,simpleLast);assert.ok(Math.abs(p.last.fixed365-compounded)>.1);
});
test('zero principal or rate removes interest without changing dates, and size scales amounts only',()=>{
 const d=defaults('dayBasis'),p=dayBasisLedger(d);
 for(const key of ['dayBasisPrincipal','dayBasisRate']){const z=dayBasisLedger({...d,[key]:0});assert.deepEqual(z.days,p.days);assert.ok(z.rows.every(r=>r.fixed365===0&&r.fixed360===0&&r.calendar===0));}
 const twice=dayBasisLedger({...d,dayBasisPrincipal:20000});near(twice.last.calendar,2*p.last.calendar);near(twice.last.fixed365,2*p.last.fixed365);
});
test('day donut partitions the actual dates and matrix changes only start/day count',()=>{
 const d=defaults('dayBasis'),r=planningResult('dayBasis',d);assert.equal(r.charts[2].type,'donut');assert.equal(r.charts[2].centerLabel,'Accrued days');assert.deepEqual(r.charts[2].rows.map(x=>x.value),[17,74]);assert.match(r.charts[2].description,/calendar days/);
 [1,10,20,31].forEach((start,j)=>[30,60,90,120].forEach((n,k)=>{const p=dayBasisLedger({...d,dayBasisStart:start,dayBasisDays:n});near(r.charts[3].rows[j].values[k],p.last.calendar-p.last.fixed365);}));
 assert.equal(r.charts[3].rows[0].values[0],0);assert.deepEqual(r.charts[3],planningResult('dayBasis',{...d,dayBasisStart:31,dayBasisDays:1}).charts[3]);
});
test('whole day controls and supported limits render four finite accessible figures/tables',()=>{
 const d=defaults('dayBasis'),fields=definitions.dayBasis.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('dayBasis',i));const r=planningResult('dayBasis',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"|composition of listed gross assets/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 for(const key of ['dayBasisStart','dayBasisDays'])assert.equal(validInputs('dayBasis',{...d,[key]:1.5}),false);
});
