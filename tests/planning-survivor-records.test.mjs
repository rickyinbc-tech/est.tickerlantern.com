import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {survivorRecordPlan} from '../src/planning-survivor-records-models.js';
import {survivorRecordGuides} from '../src/planning-survivor-records-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('complete capital ledgers independently reconcile the listed and full-cohort means',()=>{
 for(const recordOpening of [1000,10000,100000])for(const recordOmitted of [0,1,2,3])for(const recordShift of [-30,0,30,60]){
  const d={recordOpening,recordOmitted,recordShift},p=survivorRecordPlan(d);let opening=0,ending=0,listedOpening=0,listedEnding=0,omittedOpening=0,omittedEnding=0;
  const rates=[.2,.12,.08,.04,0,-.05,-.15,-.4];
  for(let i=0;i<8;i++){
   const missing=i>=8-recordOmitted,growth=rates[i]+(missing?recordShift/100:0),finish=recordOpening+recordOpening*growth;
   opening+=recordOpening;ending+=finish;if(missing){omittedOpening+=recordOpening;omittedEnding+=finish;}else{listedOpening+=recordOpening;listedEnding+=finish;}
  }
  near(p.opening,opening);near(p.ending,ending);near(p.fullMean,(ending-opening)/opening);near(p.listedMean,(listedEnding-listedOpening)/listedOpening);
  if(recordOmitted)near(p.omittedMean,(omittedEnding-omittedOpening)/omittedOpening);else assert.equal(p.omittedMean,null);
  near(p.listedContribution,(listedEnding-listedOpening)/opening);near(p.omittedContribution,(omittedEnding-omittedOpening)/opening);near(p.listedContribution+p.omittedContribution,p.fullMean);
  assert.equal(p.rows.length,8);assert.equal(p.omitted.length,recordOmitted);assert.equal(p.listed.length,8-recordOmitted);assert.ok(p.rows.every(r=>r.ending>0));
 }
});
test('omission changes the denominator without deleting ending capital and the reporting gap can reverse',()=>{
 const d=defaults('survivorRecords'),p=survivorRecordPlan(d);near(p.fullMean,-.02);near(p.listedMean,.088);near(p.omittedMean,-.2);near(p.gap,.108);near(p.ending,78400);near(p.listedContribution,.055);near(p.omittedContribution,-.075);
 near(p.listed.reduce((s,r)=>s+r.ending,0),54400);near(p.omitted.reduce((s,r)=>s+r.ending,0),24000);
 const stronger=survivorRecordPlan({...d,recordShift:60});near(stronger.fullMean,.205);near(stronger.listedMean,.088);near(stronger.gap,-.117);assert.deepEqual(stronger.omitted.map(r=>r.rate),[.55,.45,.2]);
 const none=survivorRecordPlan({...d,recordOmitted:0,recordShift:60});near(none.gap,0);near(none.ending,78400);near(none.omittedContribution,0);assert.equal(none.omittedMean,null);
 near(survivorRecordPlan({...d,recordOmitted:1}).listedMean,.24/7);near(survivorRecordPlan({...d,recordOmitted:2}).listedMean,.065);
 const bigger=survivorRecordPlan({...d,recordOpening:100000});near(bigger.ending,p.ending*10);near(bigger.gap,p.gap);
 const result=planningResult('survivorRecords',d);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),p.fullMean);assert.deepEqual(result.charts[1].rows[0].values,[5,3]);
 near(result.charts[3].series[0].rows.find(r=>r.x===0).value,-.02);near(result.charts[3].series[0].rows.at(-1).value,.205);assert.ok(result.charts[3].series[1].rows.every(r=>Math.abs(r.value-.088)<1e-10));
 const noFilter=planningResult('survivorRecords',{...d,recordOmitted:0}).charts[3];assert.deepEqual(noFilter.series[0].rows,noFilter.series[1].rows);
});
test('survivorship guide preserves complete English explanations, valid related links and accessible finite figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of survivorRecordGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);near(result.charts[1].rows[0].values.reduce((a,b)=>a+b,0),8);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('survivorRecords',{...defaults('survivorRecords'),recordOmitted:1.5}),false);assert.equal(validInputs('survivorRecords',{...defaults('survivorRecords'),recordOmitted:8}),false);
});
