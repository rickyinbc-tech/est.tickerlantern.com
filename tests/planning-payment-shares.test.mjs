import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {paymentShareTally,paymentShareGroups} from '../src/planning-payment-shares-models.js';
import {paymentShareRows,paymentShareSource} from '../src/planning-payment-shares-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='paymentSharePlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('the ten-purchase fixture has count shares60/30/10 but dollar shares6/24/70',()=>{
 const p=paymentShareTally(defaults(kind));assert.equal(p.count,10);assert.equal(p.spending,500);assert.equal(p.mean,50);assert.deepEqual(p.rows.map(r=>r.spending),[30,120,350]);assert.deepEqual(p.rows.map(r=>r.countShare),[.6,.3,.1]);assert.deepEqual(p.rows.map(r=>r.valueShare),[.06,.24,.7]);assert.equal(planningResult(kind).charts[4].rows.reduce((n,r)=>n+r.value,0),500);
});
test('a larger credit ticket changes dollars and the overall mean while count shares stay fixed',()=>{
 const d=defaults(kind),a=paymentShareTally(d),b=paymentShareTally({...d,methodCreditTicket:700});assert.equal(b.count,10);assert.equal(b.spending,850);assert.equal(b.mean,85);near(b.rows[2].valueShare,14/17);assert.deepEqual(a.rows.map(r=>r.countShare),b.rows.map(r=>r.countShare));assert.deepEqual(planningResult(kind).charts[2],planningResult(kind,{...d,methodCreditTicket:700}).charts[2]);
});
test('empty counts and positive counts with zero prices retain different undefined denominators',()=>{
 const d=defaults(kind),empty={...d,methodCashCount:0,methodDebitCount:0,methodCreditCount:0},p=paymentShareTally(empty);assert.equal(p.count,0);assert.equal(p.spending,0);assert.equal(p.mean,null);assert.ok(p.rows.every(r=>r.countShare===null&&r.valueShare===null&&r.observedMean===null));
 const free={...d,methodCashTicket:0,methodDebitTicket:0,methodCreditTicket:0},f=paymentShareTally(free);assert.equal(f.count,10);assert.equal(f.mean,0);assert.ok(f.rows.every(r=>r.valueShare===null));assert.deepEqual(f.rows.map(r=>r.countShare),[.6,.3,.1]);
 const html=renderResult(planningResult(kind,empty),300);assert.match(html,/allocation unavailable/);assert.match(html,/No purchases/);assert.match(html,/No positive dollars/);assert.doesNotMatch(html,/Total listed assets|No listed assets|gross assets/);
});
test('whole counts and cent-rounded means conserve totals across independent combinations',()=>{
 const d=defaults(kind);for(const cash of [0,1,6])for(const debit of [0,1,3])for(const credit of [0,1,5])for(const ticket of [0,5.01,40,350]){
  const input={...d,methodCashCount:cash,methodDebitCount:debit,methodCreditCount:credit,methodCashTicket:ticket},p=paymentShareTally(input);assert.equal(p.count,cash+debit+credit);assert.equal(p.spending,(cash*Math.round(ticket*100)+debit*4000+credit*35000)/100);
  if(p.count)near(p.rows.reduce((n,r)=>n+r.countShare,0),1);if(p.spending)near(p.rows.reduce((n,r)=>n+r.valueShare,0),1);
 }
 const noCash=paymentShareTally({...d,methodCashCount:0,methodCashTicket:1000});assert.equal(noCash.rows[0].spending,0);assert.equal(noCash.rows[0].observedMean,null);
});
test('the2025 extract retains all original bins, identifiers, year and the published rounding discrepancy',()=>{
 assert.equal(paymentShareRows.length,9);assert.equal(paymentShareSource.referenceYear,2025);assert.equal(paymentShareSource.reportPublicationMonth,'2026-08');assert.equal(paymentShareRows[0].countSeries,'MOP_PAYMENT_VOLUME_CASH');assert.equal(paymentShareRows[0].valueSeries,'MOP_PAYMENT_VALUE_CASH');assert.ok(paymentShareRows.every(r=>r.referenceYear===2025&&r.apiDateKey==='2025-01-01'));near(paymentShareRows.reduce((n,r)=>n+r.countShare,0),100);near(paymentShareRows.reduce((n,r)=>n+r.valueShare,0),100.1);
 const g=paymentShareGroups();assert.deepEqual(g[1].keys,['CREDIT','CTCC','CTCCM']);assert.equal(g[1].countShare,48.2);assert.equal(g[1].valueShare,58.5);near(g[1].gap,.103);near(g[0].gap,-.083);near(g.reduce((n,r)=>n+r.gap,0),.001);
});
test('source categories and derived source gaps do not respond to the fictional tally',()=>{
 const d=defaults(kind),r=planningResult(kind),other=planningResult(kind,{...d,methodCashCount:100,methodCashTicket:1000,methodCreditCount:0});assert.deepEqual(r.charts.slice(0,2),other.charts.slice(0,2));assert.equal(r.charts[0].rows.length,9);assert.equal(r.charts[1].unit,'pp');assert.ok(r.charts[0].evidence.startsWith('Official'));assert.equal(r.charts[1].evidence,'Derived from official statistics');
});
test('the guide distinguishes annual categories, fictional prices and purchase-versus-settlement records',()=>{
 const matches=planningGuides.filter(g=>g.planning===kind);assert.equal(matches.length,1);const g=matches[0],text=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,8);assert.match(text,/100\.1%/);assert.match(text,/cannot be fully harmonized/);assert.match(text,/not a competing estimate/);assert.match(text,/about 82\.35%/);assert.match(text,/three-day payment diary/);assert.match(text,/not a competing estimate/);for(const slug of g.related)assert.ok(planningGuides.some(p=>p.slug===slug),slug);
});
test('fractional or out-of-range counts are rejected before any figure is generated',()=>{
 const d=defaults(kind);for(const key of ['methodCashCount','methodDebitCount','methodCreditCount'])for(const value of [-1,.5,101,NaN])assert.throws(()=>planningResult(kind,{...d,[key]:value}));assert.throws(()=>planningResult(kind,{...d,methodCreditTicket:-1}));
});
test('zero distributions and all supported field boundaries render five finite accessible figures',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,methodCashTicket:0,methodDebitTicket:0,methodCreditTicket:0}];
 for(const input of cases)for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
