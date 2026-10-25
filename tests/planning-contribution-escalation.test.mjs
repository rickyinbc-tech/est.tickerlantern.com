import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionEscalationLedger } from '../src/planning-contribution-escalation-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('same return and no escalation make all three schedules equal',()=>{
 const p=contributionEscalationLedger({...defaults('contributionEscalation'),escalateInflation:0,escalatePay:0,escalateReturn:0,escalateYears:3});
 near(p.annual.at(-1).flat,14400);near(p.annual.at(-1).cpi,14400);near(p.annual.at(-1).pay,14400);
});

test('CPI and pay escalation change deposits, compounding and real balances transparently',()=>{
 const input=defaults('contributionEscalation'),p=contributionEscalationLedger(input),last=p.annual.at(-1);
 near(last.flatMonthly,400);near(last.cpiMonthly,400*1.025**19);near(last.payMonthly,400*1.02**19);
 assert.ok(last.cpi>last.pay&&last.pay>last.flat);
 near(last.flatReal,last.flat/1.025**20);near(last.cpiReal,last.cpi/1.025**20);near(last.payReal,last.pay/1.025**20);
});

test('registered guide uses four labelled charts, sources and the library registry',()=>{
 const guide=planningGuides.find(g=>g.slug==='inflation-adjusted-regular-investing-contributions');
 assert.ok(guide);assert.equal(planningResult('contributionEscalation').charts.length,4);
 assert.equal(guide.sources.length,4);assert.ok(guide.related.includes('dollar-cost-averaging-income-interruption-cash-floor'));
 assert.ok(planningResult('contributionEscalation').charts.every(c=>c.id&&c.title&&c.note));
});

test('inputs remain finite and bounded at their endpoints',()=>{
 const input=defaults('contributionEscalation');assert.ok(validInputs('contributionEscalation',input));
 assert.ok(validInputs('contributionEscalation',{...input,escalateReturn:-10,escalateInflation:0,escalatePay:8,escalateYears:40}));
 assert.equal(validInputs('contributionEscalation',{...input,escalateInflation:9}),false);
});
