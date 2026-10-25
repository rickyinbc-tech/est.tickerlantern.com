import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {unpaidTimePlan} from '../src/planning-unpaid-time-models.js';
import {unpaidTimeRows,unpaidTimeSource} from '../src/planning-unpaid-time-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='unpaidTimePlanning';
test('the default exclusive week has 22 then 26 unassigned hours and a separate 320 cash remainder',()=>{
 const p=unpaidTimePlan(defaults(kind));assert.equal(p.beforeAssigned,146);assert.equal(p.afterAssigned,142);assert.equal(p.before,22);assert.equal(p.after,26);assert.equal(p.timeChange,4);assert.equal(p.available,800);assert.equal(p.invoice,480);assert.equal(p.cashRemainder,320);
 const r=planningResult(kind);assert.equal(r.charts[2].rows.reduce((n,p)=>n+p.value,0),26);assert.deepEqual(r.charts[3].rows.map(r=>r.value),[22,26]);assert.equal(r.charts[4].rows.reduce((n,p)=>n+p.value,0),320);
});
test('exclusive assignments retain the impossible excess instead of normalizing it into a week',()=>{
 const d=defaults(kind),p=unpaidTimePlan({...d,unpaidTimeWork:80});assert.equal(p.afterAssigned,177);assert.equal(p.after,-9);assert.equal(p.overscheduled,9);assert.equal(p.before,-13);
 for(const unpaidTimeWork of [0,25,45,80,100])for(const unpaidTimeBefore of [0,15,30,60,100])for(const unpaidTimeAfter of [0,15,26,60,100]){const p=unpaidTimePlan({...d,unpaidTimeWork,unpaidTimeBefore,unpaidTimeAfter});assert.equal(p.before+71+unpaidTimeWork+unpaidTimeBefore,168);assert.equal(p.after+71+unpaidTimeWork+unpaidTimeAfter,168);assert.equal(p.timeChange,unpaidTimeBefore-unpaidTimeAfter);}
});
test('a higher own-time after assumption reduces unassigned time without changing any quoted cost',()=>{
 const d=defaults(kind),p=unpaidTimePlan({...d,unpaidTimeAfter:40});assert.equal(p.after,12);assert.equal(p.timeChange,-10);assert.equal(p.cashRemainder,320);
 const r=planningResult(kind),change=planningResult(kind,{...d,unpaidTimeBefore:60});assert.deepEqual(r.charts[2],change.charts[2]);assert.deepEqual(r.charts[4],change.charts[4]);assert.notDeepEqual(r.charts[3],change.charts[3]);
});
test('actual quoted cash is independent of own-time assumptions and can exceed the available amount',()=>{
 const d=defaults(kind),base=unpaidTimePlan(d),p=unpaidTimePlan({...d,unpaidTimeInvoice:250});assert.equal(p.invoice,1000);assert.equal(p.cashRemainder,-200);assert.equal(p.after,base.after);assert.equal(p.timeChange,base.timeChange);
 for(const unpaidTimeCash of [0,100,200,3000])for(const unpaidTimeInvoice of [0,120,250,2000]){const p=unpaidTimePlan({...d,unpaidTimeCash,unpaidTimeInvoice});assert.equal(p.cashRemainder,4*(unpaidTimeCash-unpaidTimeInvoice));assert.equal(p.after,26);}
 const cents=unpaidTimePlan({...d,unpaidTimeInvoice:120.01,unpaidTimeCash:200.02});assert.equal(cents.available,800.08);assert.equal(cents.invoice,480.04);assert.equal(cents.cashRemainder,320.04);
});
test('source observations preserve 2022 daily person denominators, means, participation and confidence intervals',()=>{
 assert.equal(unpaidTimeSource.table,'45-10-0104-01');assert.equal(unpaidTimeSource.referenceYear,2022);assert.equal(unpaidTimeSource.released,'2024-06-05');assert.equal(unpaidTimeSource.age,'Total, 15 years and over');assert.deepEqual(unpaidTimeRows.slice(0,4).map(r=>[r.population.value,r.participants.value,r.participation.value]),[[2.1,3,71.4],[.5,3.4,16.2],[.1,2.6,3.9],[.4,1.5,25.9]]);
 assert.equal(unpaidTimeRows[0].population.vectors.value,'v1592189785');assert.equal(unpaidTimeRows[4].population.value,3.2);assert.equal(unpaidTimeRows[5].population.value,.2);
 for(const r of unpaidTimeRows)for(const k of ['population','participants','participation']){const p=r[k];assert.ok(p.lower<=p.value&&p.value<=p.upper);assert.equal(p.status,'');assert.equal(p.unit,k==='participation'?'Percent':'Hours');}
});
test('two official charts remain fixed when personal time and invoice controls change',()=>{
 const d=defaults(kind),r=planningResult(kind),other=planningResult(kind,{...d,unpaidTimeWork:100,unpaidTimeAfter:100,unpaidTimeInvoice:2000,unpaidTimeCash:0});assert.deepEqual(r.charts.slice(0,2),other.charts.slice(0,2));assert.notDeepEqual(r.metrics,other.metrics);assert.equal(r.charts[1].type,'intervalbar');assert.equal(r.charts[1].rows.length,4);
 for(let i=0;i<4;i++){assert.deepEqual(r.charts[0].rows[i].values,[unpaidTimeRows[i].population.value,unpaidTimeRows[i].participants.value]);assert.equal(r.charts[1].rows[i].lower,unpaidTimeRows[i].participation.lower/100);assert.equal(r.charts[1].rows[i].upper,unpaidTimeRows[i].participation.upper/100);}
});
test('daily hour, weekly hour and four-week cash units remain explicit across figures and prose',()=>{
 const r=planningResult(kind);assert.equal(r.charts[0].tableUnit,'Hours per day');assert.equal(r.charts[2].tableUnit,'Hours per week');assert.equal(r.charts[4].unit,'money');
 const matches=planningGuides.filter(g=>g.planning===kind);assert.equal(matches.length,1);const g=matches[0],text=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,8);assert.match(text,/twenty-eight-day/);assert.match(text,/not an average calendar month/);assert.match(text,/negative nine/);assert.match(text,/not a health/);assert.match(text,/same opening cash balance/);assert.match(text,/0\.1–0\.1/);for(const slug of g.related)assert.ok(planningGuides.some(p=>p.slug===slug),slug);
});
test('individual numerical bounds reject malformed inputs while valid overscheduled totals remain visible',()=>{
 const d=defaults(kind);assert.throws(()=>planningResult(kind,{...d,unpaidTimeWork:101}));assert.throws(()=>planningResult(kind,{...d,unpaidTimeInvoice:-1}));assert.throws(()=>planningResult(kind,{...d,unpaidTimeCash:NaN}));assert.ok(planningResult(kind,{...d,unpaidTimeWork:100,unpaidTimeAfter:100}).metrics[0][1]<0);
});
test('zero and overscheduled/unfunded extremes retain five finite accessible figure/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,unpaidTimeWork:100,unpaidTimeAfter:100,unpaidTimeInvoice:2000,unpaidTimeCash:0}];
 for(const input of cases)for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
