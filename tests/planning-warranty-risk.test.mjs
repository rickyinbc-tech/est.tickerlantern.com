import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {warrantyComparison} from '../src/planning-warranty-risk-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('expected costs are independent weighted sums of the two complete outcome costs',()=>{
 const d=defaults('warrantyRisk'),p=warrantyComparison(d),q=d.warrantyProbability/100;
 near(p.selfExpected,(1-q)*0+q*d.warrantyRepair);
 near(p.contractExpected,(1-q)*d.warrantyFee+q*(d.warrantyFee+d.warrantyDeductible));
 near(p.selfExpected,160);near(p.contractExpected,200);near(p.contractExpected-p.selfExpected,40);
 near(p.selfRepairPosition,-300);near(p.contractRepairPosition,220);
});
test('the analytical equality probability produces equal expectations, with correct signs on either side',()=>{
 const d=defaults('warrantyRisk'),p=warrantyComparison(d);near(p.equality,180/700);
 const at=warrantyComparison({...d,warrantyProbability:p.equality*100});near(at.selfExpected,at.contractExpected);near(at.selfExpected,205.71428571428572);
 assert.ok(warrantyComparison({...d,warrantyProbability:10}).contractExpected>warrantyComparison({...d,warrantyProbability:10}).selfExpected);
 assert.ok(warrantyComparison({...d,warrantyProbability:50}).contractExpected<warrantyComparison({...d,warrantyProbability:50}).selfExpected);
 assert.equal(warrantyComparison({...d,warrantyFee:701}).equality,null);
 near(warrantyComparison({...d,warrantyFee:700}).equality,1);
});
test('deductibles are capped at repair costs and equality states distinguish no crossing from all ties',()=>{
 const d=defaults('warrantyRisk'),p=warrantyComparison({...d,warrantyRepair:80,warrantyDeductible:100});
 near(p.outOfPocket,80);near(p.covered,0);assert.equal(p.equality,null);assert.equal(p.allEqual,false);
 const tie=warrantyComparison({...d,warrantyRepair:80,warrantyFee:0});assert.equal(tie.allEqual,true);near(tie.selfExpected,tie.contractExpected);
 const free=warrantyComparison({...d,warrantyFee:0,warrantyDeductible:0});near(free.equality,0);near(free.contractExpected,0);
 const noRepair=warrantyComparison({...d,warrantyRepair:0});near(noRepair.covered,0);near(noRepair.selfExpected,0);near(noRepair.contractExpected,d.warrantyFee);
});
test('reserve positions do not vary with probability and expectations do not vary with reserves',()=>{
 const d=defaults('warrantyRisk'),zero=warrantyComparison({...d,warrantyProbability:0}),certain=warrantyComparison({...d,warrantyProbability:100});
 for(const k of ['selfRepairPosition','contractNoRepairPosition','contractRepairPosition'])near(zero[k],certain[k]);
 const poor=warrantyComparison({...d,warrantyReserve:0}),rich=warrantyComparison({...d,warrantyReserve:10000});
 near(poor.selfExpected,rich.selfExpected);near(poor.contractExpected,rich.contractExpected);
 near(poor.contractNoRepairPosition,-d.warrantyFee);near(poor.contractRepairPosition,-d.warrantyFee-d.warrantyDeductible);
 near(zero.selfExpected,0);near(zero.contractExpected,d.warrantyFee);
 near(certain.selfExpected,d.warrantyRepair);near(certain.contractExpected,d.warrantyFee+d.warrantyDeductible);
});
test('the scenario matrix replaces chance and severity while retaining fee and capped deductible',()=>{
 const d=defaults('warrantyRisk'),r=planningResult('warrantyRisk',d),m=r.charts.find(c=>c.type==='heatmap');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const p=warrantyComparison({...d,warrantyProbability:[10,25,50,75][row],warrantyRepair:[300,600,900,1200][col]});
  near(m.rows[row].values[col],p.contractExpected-p.selfExpected);
 }
});
test('supported input boundaries produce finite inspectable figures including all-zero cases',()=>{
 const d=defaults('warrantyRisk'),fields=definitions.warrantyRisk.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('warrantyRisk',i));const p=warrantyComparison(i),r=planningResult('warrantyRisk',i);finite(p);finite(r);assert.equal(r.charts.length,4);assert.ok(p.covered>=0);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('warrantyRisk',{...d,warrantyProbability:101}),false);
});
