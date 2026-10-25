import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {giftCardCashLedger} from '../src/planning-gift-card-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('discounted card defaults retain unused purchasing credit beside the higher cash outlay',()=>{
 const p=giftCardCashLedger(defaults('giftCard'));near(p.price,450);near(p.used,300);near(p.remaining,200);near(p.end.cardCash,450);near(p.end.controlCash,300);near(p.end.extra,150);near(p.thresholdShare,.9);assert.equal(p.cashCatchUpMonth,null);assert.equal(p.rows.length,13);
});
test('every monthly ledger conserves face value and reconciles the signed cash identity',()=>{
 const d=defaults('giftCard');for(const input of [d,{...d,monthlyCardUse:73,shopMonths:24,months:24},{...d,monthlyCardUse:1000},{...d,cardDiscount:0}]){
  const p=giftCardCashLedger(input);for(const r of p.rows){near(r.redeemed+r.remaining,input.cardFace);near(r.extra,p.price-r.redeemed);near(r.cardCash,p.price+r.controlCash-r.redeemed);assert.ok(r.remaining>=0);assert.ok(r.redeemed<=input.cardFace);}
 }
});
test('full-use cash top-ups and the month-nine catch-up are counted once',()=>{
 const d=defaults('giftCard'),p=giftCardCashLedger({...d,shopMonths:12});near(p.used,500);near(p.remaining,0);near(p.end.controlCash,600);near(p.end.cardCash,550);near(p.end.extra,-50);assert.equal(p.cashCatchUpMonth,9);near(p.rows[9].extra,0);near(p.rows[10].extra,-50);near(p.rows[11].cardCash,500);
});
test('stopping the purchase plan does not erase credit or invent an expiry refund',()=>{
 const d=defaults('giftCard'),a=giftCardCashLedger({...d,months:6}),b=giftCardCashLedger({...d,months:24});near(a.used,b.used);near(a.remaining,b.remaining);near(a.end.extra,b.end.extra);for(const row of b.rows.filter(r=>r.month>6))near(row.spend,0);
 const none=giftCardCashLedger({...d,shopMonths:0});near(none.used,0);near(none.end.extra,450);near(none.remaining,500);
});
test('zero face value, zero usage and an undiscounted card have explicit finite limits',()=>{
 const d=defaults('giftCard'),zero=giftCardCashLedger({...d,cardFace:0});near(zero.end.extra,0);near(zero.end.cardCash,zero.end.controlCash);assert.equal(zero.thresholdShare,null);assert.equal(zero.redemptionShare,null);
 const noUse=giftCardCashLedger({...d,monthlyCardUse:0});near(noUse.end.extra,450);assert.equal(noUse.cashCatchUpMonth,null);
 const noDiscount=giftCardCashLedger({...d,cardDiscount:0,shopMonths:12});near(noDiscount.end.extra,0);near(noDiscount.maxCashReduction,0);assert.ok(noDiscount.rows.every(r=>r.extra>=0));
});
test('waterfall, face ledger and redemption curve agree without refunding unused credit',()=>{
 const d=defaults('giftCard'),r=planningResult('giftCard',d),p=giftCardCashLedger(d);near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),p.end.extra);for(const row of r.charts[1].rows)near(row.values.reduce((a,b)=>a+b,0),500);
 const points=r.charts[3].series[0].rows;near(points.find(v=>v.x===90).value,0);near(points.at(-1).value,-50);near(points[0].value,450);assert.deepEqual(r.charts[3],planningResult('giftCard',{...d,monthlyCardUse:100,shopMonths:12}).charts[3]);
});
test('whole-month fields and all field endpoints render four finite accessible figures',()=>{
 const d=defaults('giftCard');assert.equal(validInputs('giftCard',{...d,shopMonths:1.5}),false);const variants=[d];for(const [key,,,min,max] of definitions.giftCard.fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs('giftCard',input),true);const html=renderResult(planningResult('giftCard',input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/purchasing credit/);}
});
