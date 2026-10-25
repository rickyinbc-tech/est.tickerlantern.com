import test from 'node:test';
import assert from 'node:assert/strict';
import {giftCreditLedger} from '../src/planning-gift-credit-models.js';
import {giftCreditGuides} from '../src/planning-gift-credit-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('gift bonus uses cash-paid and full-basket denominators separately',()=>{
 const p=giftCreditLedger(defaults('giftCredit'));assert.equal(p.bonus,10);assert.equal(p.loaded,110);near(p.bonusOnPaid,.1);near(p.discountAtFullSamePrice,1/11);
 assert.equal(p.used,88);assert.equal(p.remaining,22);near(p.alternativeCash,83.6);near(p.cashDifference,16.4);near(p.fullUseCashSaving,4.5);
 near(p.cashCatchUpUse,100/104.5);
});
test('the restricted balance remains owned while the cash difference records only outlays so far',()=>{
 const d=defaults('giftCredit');
 for(const use of [0,25,80,100]){
  const p=giftCreditLedger({...d,giftUse:use});near(p.used+p.remaining,p.loaded);near(p.cashDifference+p.alternativeCash,d.giftCash);
  const noBonus=giftCreditLedger({...d,giftBonus:0,cashPriceGap:0,giftUse:use});near(noBonus.cashDifference,noBonus.remaining);
 }
 const none=giftCreditLedger({...d,giftUse:0});assert.equal(none.used,0);assert.equal(none.remaining,110);assert.equal(none.cashDifference,100);
 const full=giftCreditLedger({...d,giftUse:100});assert.equal(full.remaining,0);near(full.cashDifference,-4.5);
});
test('cash-commitment catch-up can occur with residual credit and can be unavailable within full card use',()=>{
 const d=defaults('giftCredit'),p=giftCreditLedger(d),at=giftCreditLedger({...d,giftUse:100*p.cashCatchUpUse});near(at.cashDifference,0);assert.ok(at.remaining>0);
 const cheap=giftCreditLedger({...d,giftUse:100,cashPriceGap:15});near(cheap.alternativeCash,93.5);near(cheap.cashDifference,6.5);assert.ok(cheap.cashCatchUpUse>1);
 const samePrice=giftCreditLedger({...d,giftUse:100,cashPriceGap:0});near(samePrice.cashDifference,-10);
});
test('cash is paid at load while monthly matched purchases preserve the selected total use',()=>{
 const d=defaults('giftCredit'),p=giftCreditLedger(d);assert.equal(p.rows.length,13);assert.equal(p.rows[0].cardCash,100);assert.equal(p.rows[0].alternativeCash,0);assert.equal(p.rows[0].remaining,110);
 near(p.rows.at(-1).alternativeCash,p.alternativeCash);near(p.rows.at(-1).remaining,p.remaining);near(p.rows.at(-1).redeemed,p.used);
 for(const r of p.rows){assert.equal(r.cardCash,100);near(r.redeemed+r.remaining,p.loaded);}
 const short=giftCreditLedger({...d,giftMonths:1});assert.equal(short.rows.length,2);near(short.cashDifference,p.cashDifference);near(short.remaining,p.remaining);
 assert.equal(validInputs('giftCredit',{...d,giftMonths:1.5}),false);
});
test('gift-credit prose preserves residual value and the hypothetical combined-pool assumption',()=>{
 const g=giftCreditGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/not a CAD 16.40 realized loss/);assert.match(prose,/paid balance and bonus different restrictions/);assert.match(prose,/not an economic break-even valuation/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('gift-credit boundaries render five accessible figures and finite cash comparisons',()=>{
 const kind='giftCredit',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){const p=giftCreditLedger(input);assert.ok(p.remaining>=0);assert.ok(Number.isFinite(p.cashCatchUpUse));const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
