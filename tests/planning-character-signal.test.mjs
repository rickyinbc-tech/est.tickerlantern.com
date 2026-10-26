import test from 'node:test';
import assert from 'node:assert/strict';
import { breakEvenHitRate, crashSignalPlan, eligibleGrossUp, federalEligibleCredit, incomeCharacterPlan, incomeTaxRates, profiles } from '../src/planning-character-signal-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('CRA dividend constants and default tax rates per dollar',()=>{
 assert.equal(eligibleGrossUp,1.38);assert.equal(federalEligibleCredit,.150198);
 const t=incomeTaxRates(defaults('incomeCharacter'));near(t.interest,.2965);near(t.gain,.14825);near(t.dividend,1.38*(.2965-.150198-.10));
 near(incomeTaxRates({icFedRate:14,icProvRate:5.05,icProvDtc:10}).dividend,-.08238324);
 near(incomeTaxRates({icFedRate:33,icProvRate:13.16,icProvDtc:10}).dividend,.29173476);
});

test('default income-type results match an independent 40-digit Decimal check',()=>{
 const input=defaults('incomeCharacter'),v=Object.fromEntries(profiles.map(([k])=>[k,incomeCharacterPlan(input,k)]));
 near(v.interest.afterTax,50000*(1+.06*(1-.2965))**20,1e-12);
 near(v.turnover.afterTax,50000*(1+.06*(1-.14825))**20,1e-12);
 near(v.deferred.afterTax,50000*1.06**20-(50000*1.06**20-50000)*.14825,1e-12);
 near(v.tfsa.afterTax,50000*1.06**20,1e-12);
 near(v.dividend.afterTax,146641.944208839654,1e-12);near(v.dividend.saleTax,8013.61538431447,1e-12);near(v.dividend.paid,3453.92282592816,1e-12);
 near(v.interest.paid,27103.3026776074,1e-12);
});

test('each non-registered profile reconciles to the TFSA value',()=>{
 const input=defaults('incomeCharacter'),tfsa=incomeCharacterPlan(input,'tfsa').afterTax;
 for(const [k] of profiles.slice(0,4)){const p=incomeCharacterPlan(input,k);assert.ok(tfsa-p.afterTax-p.paid-p.saleTax>=-1e-6,k);}
 const zero={...input,icFedRate:0,icProvRate:0,icProvDtc:0};const vals=['interest','turnover','deferred','tfsa'].map(k=>incomeCharacterPlan(zero,k).afterTax);for(const x of vals)near(x,vals[3]);
 // With no tax on income, the dividend credits alone reduce tax elsewhere, so the dividend fund exceeds the TFSA.
 assert.ok(incomeCharacterPlan(zero,'dividend').afterTax>vals[3]);
});

test('default crash-signal results and break-even hit rate',()=>{
 const input=defaults('crashSignal'),p=crashSignalPlan(input);
 near(p.inv,100000*1.06**19*.9375**3,1e-12);near(p.timer,100000*1.06**11*1.025**12*.9375,1e-12);
 assert.equal(p.horizon,25);assert.equal(p.cashYears,12);assert.equal(p.invRows.length,26);assert.equal(p.timerRows.length,26);
 assert.equal(p.detail.filter(d=>d.kind==='hit').length,2);assert.equal(p.detail.filter(d=>d.kind==='missed').length,1);
 const a=Math.log(1.025**2/.9375),f=Math.log(1.025**2/1.06**2);near(breakEvenHitRate(input),-f/(a-f),1e-12);
 assert.equal(breakEvenHitRate(input,{csCrash:15,csOut:2}),null);
 near(crashSignalPlan(input,{csTrue:3}).timer-crashSignalPlan(input,{csTrue:3}).inv,31334,1e-4);
});

test('crash-signal identities: no warnings, cash equal to market, extended horizon',()=>{
 const input=defaults('crashSignal');
 const none=crashSignalPlan(input,{csWarnings:0,csTrue:0});near(none.timer,none.inv);
 const same=crashSignalPlan(input,{csCash:6,csTrue:0});near(same.timer,same.inv);
 const long=crashSignalPlan(input,{csYears:10,csWarnings:12,csTrue:2,csOut:5,csMissed:6});assert.ok(long.extended);assert.equal(long.invRows.length,long.horizon+1);
 assert.equal(validInputs('crashSignal',{...input,csTrue:7}),false);
});

test('registered guides have four finite charts, sources and resolvable links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const [slug,kind] of [['fund-income-type-interest-dividends-capital-gains-after-tax-return','incomeCharacter'],['market-crash-warning-false-alarms-cash-break-even','crashSignal']]){
  const guide=planningGuides.find(g=>g.slug===slug);assert.ok(guide);assert.equal(guide.planning,kind);
  assert.ok(guide.sources.length>=5);assert.ok(guide.related.every(s=>slugs.has(s)));
  for(const href of guide.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(m=>m[1])))assert.ok(slugs.has(href),href);
  const result=planningResult(kind);assert.equal(result.charts.length,4);
  for(const c of result.charts){assert.ok(c.id&&c.title&&c.note);assert.ok(!/NaN|Infinity/.test(JSON.stringify(c.rows??c.series)));}
 }
});

test('inputs remain valid and finite at their bounds',()=>{
 for(const [kind,edges] of [['incomeCharacter',[{icAmount:1000,icReturn:0,icYield:8,icYears:1},{icAmount:2000000,icReturn:12,icYield:0,icFedRate:33,icProvRate:25,icProvDtc:20,icYears:40},{icFedRate:0,icProvRate:0,icProvDtc:20}]],['crashSignal',[{csWarnings:0,csTrue:0,csMissed:0},{csYears:10,csWarnings:12,csTrue:12,csMissed:6,csOut:5,csCrash:60,csRebound:80,csNormal:12,csCash:8},{csCrash:5,csRebound:0,csNormal:-2,csCash:0}]]]){
  const d=defaults(kind);assert.ok(validInputs(kind,d));
  for(const edge of edges){const input={...d,...edge};assert.ok(validInputs(kind,input),JSON.stringify(edge));const r=planningResult(kind,input);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));assert.ok(r.charts.every(c=>!/NaN|Infinity/.test(JSON.stringify(c.rows??c.series))));}
 }
});
