import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {settlementCashCalendar,settlementReceiptStage,advanceSettlementDays,settlementOpenDay,settlementDayName} from '../src/planning-settlement-cash-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {guides} from '../src/research-guides.js';
const kind='settlementCashPlanning';
test('Friday execution crosses the weekend and keeps settlement distinct from bank receipt',()=>{
 const d=defaults(kind),p=settlementCashCalendar(d);assert.equal(p.settlement,8);assert.equal(p.arrival,10);assert.equal(settlementDayName(p.arrival),'Day 10 · Wed');assert.equal(p.required,0);assert.equal(p.additional,0);assert.equal(p.minimum,1000);assert.equal(p.ending,2000);
 assert.equal(p.rows.find(r=>r.x===10).value,2000);assert.equal(p.rows.find(r=>r.x===9).value,1000);
});
test('one fictional closure creates an earlier gap despite an identical within-window endpoint',()=>{
 const d=defaults(kind),base=settlementCashCalendar(d),closed=settlementCashCalendar({...d,settleClosures:1});assert.equal(closed.settlement,9);assert.equal(closed.arrival,11);assert.equal(closed.required,4000);assert.equal(closed.additional,3000);assert.equal(closed.rows[10].value,-3000);assert.equal(closed.rows[11].value,2000);assert.equal(closed.ending,base.ending);
});
test('business-day advancement excludes the start and agrees with independently selected future open days',()=>{
 for(const closures of [0,1,2,3])for(let start=1;start<=20;start++)for(let count=0;count<=9;count++){
  const closed=new Set(Array.from({length:closures},(_,i)=>8+i));const future=Array.from({length:50},(_,i)=>start+i+1).filter(day=>[1,2,3,4,5].includes(((day-1)%7)+1)&&!closed.has(day));
  assert.equal(advanceSettlementDays(start,count,closures),count===0?start:future[count-1]);
 }
 assert.equal(settlementOpenDay(8,3),false);assert.equal(settlementOpenDay(10,3),false);assert.equal(settlementOpenDay(11,3),true);
});
test('same-day receipt precedes the bill and a zero post-settlement wait creates no duplicate receipt',()=>{
 const d={...defaults(kind),settleBankWait:0,settleDueDay:8},p=settlementCashCalendar(d),result=planningResult(kind,d);assert.equal(p.settlement,p.arrival);assert.equal(p.additional,0);assert.equal(p.rows[8].value,2000);
 assert.deepEqual(result.charts[1].rows[1].values,[0,0,5000]);assert.deepEqual(result.charts[1].rows[2].values,[0,0,5000]);assert.equal(p.rows[8].value-p.rows[7].value,1000);
});
test('arrivals after Day14 are not clipped into the bank ledger',()=>{
 const d={...defaults(kind),settleClosures:1,settleBankWait:6},p=settlementCashCalendar(d);assert.equal(p.arrival,17);assert.equal(p.ending,-3000);assert.equal(p.pendingAtEnd,5000);assert.equal(p.additional,3000);assert.equal(p.rows.length,15);
 const result=planningResult(kind,d);assert.match(result.metrics[0][3],/after Day 14/);assert.match(result.note,/has not reached the bank/);
 const zero=planningResult(kind,{...d,settleProceeds:0});assert.match(zero.note,/receipt date remains beyond the window/);assert.doesNotMatch(zero.note,/within the displayed window/);
});
test('each dollar has one receipt stage and opening-cash need reconciles the deepest signed position',()=>{
 for(const settleTradeDay of [1,3,5])for(const settleBusinessDays of [1,3])for(const settleBankWait of [0,2,6])for(const settleClosures of [0,1,3])for(const settleDueDay of [1,8,10,14])for(const [settleOpening,settleProceeds,settleBill] of [[1000,5000,4000],[0,0,4000],[1000,5000,0]]){
  const input={...defaults(kind),settleTradeDay,settleBusinessDays,settleBankWait,settleClosures,settleDueDay,settleOpening,settleProceeds,settleBill},p=settlementCashCalendar(input);assert.equal(p.additional,Math.max(0,-p.minimum));
  assert.equal(p.ending,settleOpening+(p.arrival<=14?settleProceeds:0)-settleBill);
  for(const day of [0,settleTradeDay,p.settlement,p.arrival,14]){const stage=settlementReceiptStage(input,day),values=Object.values(stage);assert.equal(values.reduce((n,v)=>n+v,0),settleProceeds);assert.ok(values.filter(v=>v>0).length<=1);}
 }
});
test('fixed closure comparison is independent of the selected closure count and grid cells replace only stated assumptions',()=>{
 const d=defaults(kind),r=planningResult(kind),closed=planningResult(kind,{...d,settleClosures:3});assert.deepEqual(r.charts[3],closed.charts[3]);assert.deepEqual(r.charts[3].rows[4].values,[10,11]);
 assert.deepEqual(r.charts[2].rows[1].values,[1,1,1,1,1,0,0]);assert.deepEqual(closed.charts[2].rows[1].values,[0,0,0,1,1,0,0]);
 for(let row=0;row<5;row++)for(let col=0;col<5;col++)assert.equal(r.charts[4].rows[row].values[col],settlementCashCalendar({...d,settleTradeDay:row+1,settleBankWait:[0,1,2,3,6][col]}).additional);
});
test('the new cash-timing guide is unique and preserves distinct tax and account-authority articles',()=>{
 const all=[...planningGuides,...guides],matches=all.filter(g=>g.slug==='investment-sale-settlement-bank-receipt-bill-calendar');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,8);
 for(const slug of ['investment-sale-proceeds-tax-earmark-cash-goal','account-access-interruption-authorized-bill-payer']){assert.equal(all.filter(g=>g.slug===slug).length,1);assert.ok(matches[0].related.includes(slug));}
});
test('whole-day inputs and every allowed boundary keep five finite accessible chart/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields;
 for(const key of ['settleDueDay','settleTradeDay','settleBusinessDays','settleBankWait','settleClosures'])assert.equal(validInputs(kind,{...d,[key]:d[key]+.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult(kind,input);assert.equal(result.charts.length,5);for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
