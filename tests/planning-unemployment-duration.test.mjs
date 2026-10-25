import test from 'node:test';
import assert from 'node:assert/strict';
import {unemploymentDurationData as data} from '../src/planning-unemployment-duration-data.js';
import {futureUnemploymentBudget} from '../src/planning-unemployment-duration-models.js';
import {unemploymentDurationGuides} from '../src/planning-unemployment-duration-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('unemployment duration snapshot preserves selected national controls and disjoint source bins',()=>{
 assert.equal(data.table,'14-10-0057-01');assert.equal(data.latestReferenceYear,2025);assert.equal(data.released,'2026-01-09');
 assert.equal(data.total2025.value,1538.9);assert.equal(data.long2025.value,349.3);assert.equal(data.bins2025.at(-1).value,57.2);
 assert.equal(data.bins2025.length,8);assert.equal(new Set(data.bins2025.map(r=>r.category)).size,8);assert.ok(!data.bins2025.some(r=>r.category==='27 weeks or more'));
 near(data.bins2025.reduce((s,r)=>s+r.value,0),data.total2025.value);assert.equal(Number((data.long2025.value/data.total2025.value*100).toFixed(1)),22.7);
 assert.match(data.population,/excluding territories/);assert.match(data.uncertainty,/not observation-specific confidence/);
});
test('capped and uncapped means retain their definitions units years flags and original precision',()=>{
 assert.deepEqual(data.means.map(r=>r.year),Array.from({length:11},(_,i)=>2015+i));assert.equal(data.means.at(-1).uncapped.value,21.8);assert.equal(data.means.at(-1).capped99.value,19.6);
 const observations=[...data.bins2025,data.total2025,data.long2025,...data.means.flatMap(r=>[r.uncapped,r.capped99])];assert.equal(observations.length,32);
 assert.equal(new Set(observations.map(r=>[r.year,r.category].join('|'))).size,32);
 for(const r of observations){assert.equal(r.value,Number(r.source.VALUE));assert.equal(r.source.STATUS,'');assert.equal(r.source.DECIMALS,'1');assert.match(r.source.VECTOR,/^v\d+$/);assert.match(r.source.VALUE,/^\d+\.\d$/);assert.equal(r.source.SCALAR_FACTOR,r.source.UOM==='Weeks'?'units':'thousands');}
 for(const r of data.means)assert.ok(r.uncapped.value>=r.capped99.value);
 assert.match(data.downloadSHA256,/^[a-f0-9]{64}$/);
});
test('future reserve arithmetic starts today and never uses a source duration as a personal forecast',()=>{
 const d=defaults('unemploymentDuration'),p=futureUnemploymentBudget(d);assert.equal(p.weeklyGap,600);assert.equal(p.target,7800);assert.equal(p.extra,0);near(p.runway,50/3);
 const longer=futureUnemploymentBudget({...d,futureWeeks:26});assert.equal(longer.target,15600);assert.equal(longer.extra,5600);
 assert.equal(futureUnemploymentBudget({...d,futureWeeks:52}).extra,21200);
 const r=planningResult('unemploymentDuration',d);assert.deepEqual(r.charts[2].rows.map(x=>x.values),[[2400,10000],[7800,10000],[15600,10000],[31200,10000]]);
 assert.equal(r.charts[3].rows[1].values[2],5600);
});
test('household control changes preserve official charts and zero cash deficits do not display infinity',()=>{
 const d=defaults('unemploymentDuration'),a=planningResult('unemploymentDuration',d),b=planningResult('unemploymentDuration',{...d,weeklyInflow:900,cashNow:0,futureWeeks:52});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.equal(b.metrics[0][1],0);assert.equal(b.metrics[1][1],0);assert.equal(b.metrics[2][1],null);assert.equal(b.metrics[2][3],'No weekly cash deficit');
 const zero=futureUnemploymentBudget({...d,weeklyEssentials:0,weeklyInflow:0});assert.equal(zero.runway,null);assert.equal(zero.target,0);
 assert.equal(validInputs('unemploymentDuration',{...d,futureWeeks:13.5}),false);
});
test('elapsed-duration guide preserves the future-horizon distinction, source limits and related links',()=>{
 const g=unemploymentDurationGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/rather than a count of all distinct people/);assert.match(prose,/not the probability that a newly unemployed/);assert.match(prose,/No survey mean is silently converted/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('source and household extremes render four accessible charts with finite tables and explicit units',()=>{
 const kind='unemploymentDuration',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){
  const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/persons in thousands/);assert.match(html,/Mean elapsed weeks/);
 }
});
