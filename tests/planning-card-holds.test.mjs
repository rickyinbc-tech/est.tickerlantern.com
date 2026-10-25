import test from 'node:test';
import assert from 'node:assert/strict';
import {cardHoldDay,cardHoldCapacity} from '../src/planning-card-holds-models.js';
import {cardHoldGuides} from '../src/planning-card-holds-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';

test('overlapping holds consume capacity without becoming posted purchases',()=>{
 const d=defaults('cardHoldCapacity'),p=cardHoldCapacity(d);
 assert.equal(p.rows[0].available,2100);assert.equal(p.rows[1].available,900);assert.equal(p.rows[3].available,0);
 assert.equal(p.planned.posted,900);assert.equal(p.planned.first+p.planned.second,2100);assert.equal(p.planned.available,0);assert.equal(p.extraCapacity,600);assert.equal(p.firstFit,6);
 for(const row of p.rows)assert.equal(row.available+row.posted+row.first+row.second,3000);
});
test('payment-credit and hold-release boundaries restore headroom through different ledger components',()=>{
 const d=defaults('cardHoldCapacity'),p=cardHoldCapacity(d);
 assert.equal(p.rows[5].payment,0);assert.equal(p.rows[6].payment,600);assert.equal(p.rows[6].posted,300);assert.equal(p.rows[6].available,600);
 assert.equal(p.rows[7].first,1200);assert.equal(p.rows[8].first,0);assert.equal(p.rows[8].posted,p.rows[7].posted);assert.equal(p.rows[8].available-p.rows[7].available,1200);
 assert.equal(p.rows[11].second,900);assert.equal(p.rows[12].second,0);assert.equal(p.rows[12].available,2700);
 assert.equal(cardHoldCapacity({...d,paymentDay:14}).firstFit,8);
});
test('proposed purchases stay outside posted debt and unavailable dates do not imply approval',()=>{
 const d=defaults('cardHoldCapacity'),base=cardHoldCapacity(d),large=cardHoldCapacity({...d,newPurchase:10000}),none=cardHoldCapacity({...d,newPurchase:0});
 assert.deepEqual(base.rows,large.rows);assert.equal(large.firstFit,null);assert.equal(none.firstFit,null);assert.equal(none.extraCapacity,0);
 const over=cardHoldCapacity({...d,cardLimit:500});assert.equal(over.planned.available,-2500);assert.equal(over.extraCapacity,3100);assert.equal(over.firstFit,null);
 assert.equal(planningResult('cardHoldCapacity',{...d,newPurchase:0}).metrics[2][3],'No purchase entered');
});
test('credited payments are capped at opening debt and an absent first hold ceases to affect the matrix',()=>{
 const d=defaults('cardHoldCapacity'),paid=cardHoldCapacity({...d,cardPayment:20000,paymentDay:1});assert.equal(paid.appliedPayment,900);assert.equal(paid.rows[1].posted,0);assert.equal(paid.rows[14].available,3000);
 const early={...d,holdReleaseDay:4},a=cardHoldDay({...early,firstHold:500},4),b=cardHoldDay({...early,firstHold:10000},4);assert.deepEqual(a,b);
 const result=planningResult('cardHoldCapacity',d);assert.equal(result.charts[2].rows.reduce((s,r)=>s+r.value,0),-600);
 const matrix=planningResult('cardHoldCapacity',early).charts[3];assert.deepEqual(matrix.rows[0].values,matrix.rows[3].values);
 for(const key of ['paymentDay','holdReleaseDay'])assert.equal(validInputs('cardHoldCapacity',{...d,[key]:d[key]+.5}),false);
});
test('hold prose retains the authorization boundary and source jurisdiction while providing detailed English explanations',()=>{
 const g=cardHoldGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/US issuer/);assert.match(prose,/does not add the purchase to posted debt/);assert.match(prose,/not a CAD 1,200 cash refund/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('capacity extremes render finite signed axes and four accessible data tables',()=>{
 const kind='cardHoldCapacity',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){
  const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
 }
});
