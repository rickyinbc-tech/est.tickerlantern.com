import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {arrearsCountTally} from '../src/planning-arrears-count-models.js';
import {arrearsCountRows,arrearsCountSource} from '../src/planning-arrears-count-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='arrearsCountPlanning',keys=['arrearsA1','arrearsA2','arrearsB1','arrearsB2'];
test('the assigned fixture has two qualifying borrowers, three 60+ accounts and two 90+ accounts',()=>{
 const p=arrearsCountTally(defaults(kind));assert.equal(p.borrower60,2);assert.equal(p.account60,3);assert.equal(p.account90,2);assert.deepEqual([p.borrower60Share,p.account60Share,p.account90Share],[.5,.375,.25]);assert.deepEqual(p.borrowers.map(b=>b.bands),[[1,0,1],[0,1,1],[2,0,0],[2,0,0]]);
});
test('moving B1 to the stricter assigned band adds an account to 90+ without adding a borrower',()=>{
 const d=defaults(kind),p=arrearsCountTally({...d,arrearsB1:2});assert.equal(p.borrower60,2);assert.equal(p.account60,3);assert.equal(p.account90,3);assert.deepEqual(planningResult(kind,{...d,arrearsB1:2}).metrics.map(m=>m[1]),[.5,.375,.375]);
});
test('another qualifying A account leaves the borrower numerator fixed and removing its last one removes A',()=>{
 const d=defaults(kind),extra=arrearsCountTally({...d,arrearsA2:1}),removed=arrearsCountTally({...d,arrearsA1:0});assert.equal(extra.borrower60,2);assert.equal(extra.account60,4);assert.equal(removed.borrower60,1);assert.equal(removed.account60,2);assert.equal(removed.account90,1);
});
test('all 81 assigned combinations conserve fixed denominators and count each borrower once',()=>{
 for(let n=0;n<81;n++){
  let code=n;const values=keys.map(()=>{const v=code%3;code=Math.floor(code/3);return v;}),input=Object.fromEntries(keys.map((k,i)=>[k,values[i]])),p=arrearsCountTally(input);
  const independentBorrowers=Number(values[0]>0||values[1]>0)+Number(values[2]>0||values[3]>0);
  assert.equal(p.borrower60,independentBorrowers);assert.equal(p.account60,values.filter(v=>v>0).length);assert.equal(p.account90,values.filter(v=>v===2).length);
  assert.ok(p.account90<=p.account60&&p.account60<=4&&p.borrower60<=p.account60&&p.account60<=2*p.borrower60);
  assert.equal(p.borrowers.length,4);assert.ok(p.borrowers.every(b=>b.codes.length===2&&b.bands.reduce((a,v)=>a+v,0)===2));
  assert.equal(p.borrower60Share,p.borrower60/4);assert.equal(p.account60Share,p.account60/8);assert.equal(p.account90Share,p.account90/8);
 }
});
test('the twelve-quarter extract retains separate series, exact latest values and household metadata caveat',()=>{
 assert.equal(arrearsCountRows.length,12);assert.equal(arrearsCountRows[0].quarter,'2023Q3');assert.equal(arrearsCountRows.at(-1).quarter,'2026Q2');assert.ok(arrearsCountRows.every(r=>Object.keys(r.values).length===7));assert.deepEqual(Object.values(arrearsCountRows.at(-1).values),[2.23,.23,.87,.80,.11,.40,2.95]);
 assert.equal(arrearsCountSource.updated,'2026-09-25');assert.match(arrearsCountSource.seriesMetadata.FVI_FIN_STRESS.description,/households/);assert.match(arrearsCountSource.namingCaveat,/borrowers/);assert.match(arrearsCountSource.adjustment,/X-13/);
});
test('published indicators stay fixed when assigned sample codes change',()=>{
 const a=planningResult(kind),b=planningResult(kind,Object.fromEntries(keys.map(k=>[k,0])));assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.equal(a.charts[0].series[0].rows.at(-1).value,.0223);assert.equal(a.charts[1].rows.length,6);assert.ok(a.charts.slice(2).every(c=>c.evidence==='Hypothetical counting example'));
});
test('the article keeps coverage, two thresholds and the fictional sample explicit',()=>{
 const matches=planningGuides.filter(g=>g.planning===kind);assert.equal(matches.length,1);const g=matches[0],text=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,8);assert.match(text,/household label/);assert.match(text,/joint-account treatment/);assert.match(text,/not construct households/);assert.match(text,/fifty|50%/);assert.match(text,/37\.5%/);assert.match(text,/does not model the passage of time/);for(const slug of g.related)assert.ok(planningGuides.some(p=>p.slug===slug),slug);
});
test('assigned codes reject fractions, unsupported bands and non-finite inputs with a specific issue',()=>{
 const d=defaults(kind);assert.equal(definitions[kind].inputIssue(d),null);for(const key of keys)for(const value of [-1,.5,3,NaN,Infinity]){const input={...d,[key]:value};assert.throws(()=>planningResult(kind,input));assert.deepEqual(definitions[kind].inputIssue(input).fields,[key]);assert.match(definitions[kind].inputIssue(input).message,/code 0, 1 or 2/);}
});
test('empty and upper-bound assignments render five finite accessible figures with non-asset rings',()=>{
 for(const value of [0,1,2])for(const width of [300,760]){const html=renderResult(planningResult(kind,Object.fromEntries(keys.map(k=>[k,value]))),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"|Total listed assets|gross assets/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);assert.match(html,/Fictional borrowers/);assert.match(html,/Fictional accounts/);}
});
