import test from 'node:test';
import assert from 'node:assert/strict';
import {glideExposureDefinitions as defs,glideExposureLedger} from '../src/planning-glide-exposure-models.js';
import {glideExposureGuides as guides} from '../src/planning-glide-exposure-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('default declining equity share coexists with larger equity dollars and an earlier peak',()=>{
  const p=glideExposureLedger(defaults('glideDollarExposure'));
  close(p.first.equityShare,.8);close(p.first.equity,80000);close(p.last.total,700000);close(p.last.equityShare,.35);close(p.last.equity,245000);
  assert.equal(p.peak.x,24);close(p.peak.total,580000);close(p.peak.equityShare,.44);close(p.peak.equity,255200);
  close(p.first.shockChange,-24000);close(p.last.shockChange,-73500);close(p.peak.shockChange,-76560);close(p.last.shockChange/p.last.total,-.105);
});
test('assets reconcile at every checkpoint and the peak matches an independent quadratic-vertex solution',()=>{
  const base=defaults('glideDollarExposure');
  for(const glideCapital of [0,100000,500000])for(const glideContribution of [0,20000,50000])for(const glideStartEquity of [0,80,100])for(const glideEndEquity of [0,35,100])for(const glideYears of [1,30,40]){
    const q={...base,glideCapital,glideContribution,glideStartEquity,glideEndEquity,glideYears},p=glideExposureLedger(q);
    const a=glideStartEquity/100,b=(glideEndEquity-glideStartEquity)/(100*glideYears),quadratic=glideContribution*b,linear=glideContribution*a+glideCapital*b;
    const vertex=quadratic<0?-linear/(2*quadratic):0,clamp=y=>Math.max(0,Math.min(glideYears,y));
    const candidates=[0,glideYears,clamp(Math.floor(vertex)),clamp(Math.ceil(vertex))],e=y=>(glideCapital+glideContribution*y)*(a+b*y);
    close(p.peak.equity,Math.max(...candidates.map(e)));
    for(const row of p.rows){close(row.equity+row.other,row.total);close(row.total,glideCapital+row.x*glideContribution);close(row.equityShare+row.otherShare,1);assert.ok(row.equity>=0&&row.other>=0);}
  }
});
test('snapshot shocks are independent, proportional and never deducted from the contribution path',()=>{
  const q=defaults('glideDollarExposure'),a=glideExposureLedger(q),b=glideExposureLedger({...q,glideEquityDecline:60}),zero=glideExposureLedger({...q,glideEquityDecline:0});
  for(let i=0;i<a.rows.length;i++){close(a.rows[i].total,b.rows[i].total);close(b.rows[i].shockChange,2*a.rows[i].shockChange);close(zero.rows[i].shockChange,0);}
  const withoutContributions=glideExposureLedger({...q,glideContribution:0});assert.equal(withoutContributions.peak.x,0);assert.ok(withoutContributions.last.equity<withoutContributions.first.equity);
  assert.equal(a.last.total,q.glideCapital+q.glideYears*q.glideContribution);
});
test('target loss matrix depends on endpoint inputs while the initial mix changes only the interim path',()=>{
  const q=defaults('glideDollarExposure'),a=planningResult('glideDollarExposure',q),b=planningResult('glideDollarExposure',{...q,glideStartEquity:0});
  assert.deepEqual(a.charts[3].rows,b.charts[3].rows);assert.notDeepEqual(a.charts[0].series,b.charts[0].series);
  close(a.charts[3].rows[1].values[2],73500);assert.match(a.charts[3].note,/loss magnitudes/);assert.match(a.note,/separate snapshots/);
});
test('whole target years and supported boundaries produce finite accessible figures',()=>{
  const base=defaults('glideDollarExposure'),fields=defs.glideDollarExposure.fields;
  assert.equal(validInputs('glideDollarExposure',{...base,glideYears:2.5}),false);assert.throws(()=>planningResult('glideDollarExposure',{...base,glideYears:2.5}));
  const variants=[base,Object.fromEntries(fields.map(f=>[f[0],f[3]])),Object.fromEntries(fields.map(f=>[f[0],f[4]])),...fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
  for(const q of variants){assert.ok(validInputs('glideDollarExposure',q));const p=planningResult('glideDollarExposure',q);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
    for(const c of p.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
  }
});
test('allocation-path guide is a distinct detailed English article with valid related links',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${words} words`);assert.ok(slugs.has(g.slug));}
});
