import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {flatLoanSchedule,flatLoanMonthlyEquivalent} from '../src/planning-flat-loan-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('default payment schedules distinguish original-principal interest from reducing interest',()=>{
 const d=defaults('flatLoan'),p=flatLoanSchedule(d);near(p.flatPayment,466.6666666666667);near(p.restPayment,443.2061025275781);
 near(p.flatInterestTotal,1200);near(p.restInterestTotal,636.946460661875);near(p.flatPaid,11200);near(p.restPaid,10636.946460661875);
 near(p.rows[1].flatInterest,50);near(p.rows[1].restInterest,50);assert.ok(p.rows[24].restInterest<3);near(p.rows[24].flatInterest,50);
 near(p.flatMonthly,.009272219723800101);near(p.flatEffective,.11712001571730513);near(p.restEffective,.06167781186449828);
});
test('independent present-value sums solve each complete advance/repayment schedule',()=>{
 const d=defaults('flatLoan');
 for(const months of [1,12,24,60])for(const quote of [0,3,6,15]){
  const i={...d,flatMonths:months,flatQuote:quote,restQuote:quote},p=flatLoanSchedule(i);
  const flatPV=p.rows.slice(1).reduce((v,r)=>v+r.flatPayment/(1+p.flatMonthly)**r.x,0);
  const restPV=p.rows.slice(1).reduce((v,r)=>v+r.restPayment/(1+quote/1200)**r.x,0);
  near(flatPV,i.flatPrincipal);near(restPV,i.flatPrincipal);
  if(quote>0){assert.ok(p.rows.slice(1).reduce((v,r)=>v+r.flatPayment/(1+p.flatMonthly+.0001)**r.x,0)<i.flatPrincipal);assert.ok(p.flatMonthly>0);}
 }
});
test('principal and payment components reconcile period by period and in aggregate',()=>{
 const d=defaults('flatLoan'),p=flatLoanSchedule(d);let flatPrincipalPaid=0,restPrincipalPaid=0;
 for(let m=1;m<=d.flatMonths;m++){
  const a=p.rows[m-1],b=p.rows[m];near(b.restInterest,a.restPrincipal*d.restQuote/1200);
  near(a.flatPrincipal-b.flatPrincipal,b.flatPayment-b.flatInterest);near(a.restPrincipal-b.restPrincipal,b.restPayment-b.restInterest);
  flatPrincipalPaid+=b.flatPayment-b.flatInterest;restPrincipalPaid+=b.restPayment-b.restInterest;
 }
 near(flatPrincipalPaid,d.flatPrincipal);near(restPrincipalPaid,d.flatPrincipal);near(p.rows.at(-1).flatPrincipal,0);near(p.rows.at(-1).restPrincipal,0);
 near(p.flatPaid,d.flatPrincipal+p.flatInterestTotal);near(p.restPaid,d.flatPrincipal+p.restInterestTotal);
});
test('scaling the advance changes dollars but leaves positive-advance equivalent rates unchanged',()=>{
 const d=defaults('flatLoan'),a=flatLoanSchedule(d),b=flatLoanSchedule({...d,flatPrincipal:25000});
 near(b.flatPayment,2.5*a.flatPayment);near(b.restInterestTotal,2.5*a.restInterestTotal);near(a.flatEffective,b.flatEffective);
 const zero=flatLoanSchedule({...d,flatPrincipal:0});near(zero.flatPaid,0);near(zero.restPaid,0);assert.equal(zero.flatEffective,null);assert.equal(zero.restEffective,null);
 const r=planningResult('flatLoan',{...d,flatPrincipal:0});assert.equal(r.metrics[2][3],'N/A · no advance or repayments');assert.ok(r.charts[3].rows.some(row=>row.values.some(v=>v>0)));
});
test('zero rates and a single payment retain the exact schedule interpretation',()=>{
 const d=defaults('flatLoan'),zero=flatLoanSchedule({...d,flatQuote:0,restQuote:0});near(zero.flatPayment,d.flatPrincipal/d.flatMonths);near(zero.restPayment,zero.flatPayment);near(zero.flatEffective,0);near(zero.restEffective,0);
 const monthly=flatLoanMonthlyEquivalent(6,1);near(monthly,.06/12);near(Math.expm1(12*Math.log1p(monthly)),Math.pow(1+.06/12,12)-1);
 const cheapFlat=flatLoanSchedule({...d,flatQuote:1,restQuote:24});assert.ok(cheapFlat.flatPaid<cheapFlat.restPaid);
});
test('interest snapshots, total-payment components and positive-unit matrix retain explicit assumptions',()=>{
 const d=defaults('flatLoan'),p=flatLoanSchedule(d),r=planningResult('flatLoan',d);
 [1,12,24].forEach((month,j)=>{near(r.charts[0].rows[j].values[0],p.rows[month].flatInterest);near(r.charts[0].rows[j].values[1],p.rows[month].restInterest);});
 near(r.charts[2].rows[0].values.reduce((a,b)=>a+b),p.flatPaid);near(r.charts[2].rows[1].values.reduce((a,b)=>a+b),p.restPaid);
 [0,3,6,9].forEach((quote,j)=>[1,12,24,60].forEach((n,k)=>near(r.charts[3].rows[j].values[k],Math.pow(1+flatLoanMonthlyEquivalent(quote,n),12)-1)));
 assert.deepEqual(r.charts[3],planningResult('flatLoan',{...d,flatPrincipal:0,flatQuote:15,restQuote:0,flatMonths:1}).charts[3]);
});
test('supported boundaries and a whole payment count render four finite figures/tables',()=>{
 const d=defaults('flatLoan'),fields=definitions.flatLoan.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('flatLoan',i));const r=planningResult('flatLoan',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('flatLoan',{...d,flatMonths:1.5}),false);
});
