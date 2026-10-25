import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {operatingYear,forecast,cases,totalReturn,stress,justifiedBook,fiveYear} from '../src/banks/model.js';
const ids=['td','bmo','bns','cibc'];
const banks=await Promise.all(ids.map(async id=>JSON.parse(await readFile('src/banks/'+id+'.json'))));
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
test('actual nine-month bank inputs reconcile with insurance and non-common claims',()=>{
 for(const b of banks){const y=b.ytd;close(y.revenue-y.expenses-(y.insurance||0)-y.pcl,y.pretax);close(y.pretax-y.tax,y.net);assert.ok(y.net>y.common);assert.ok(y.shares>500&&y.shares<2000);}
});
test('forecast keeps actual 9M tax and income; FY2027 base scenario ties linked model',()=>{
 const expected={td:[10.28170607,11.19376947,12.10384615],bmo:[15.08037808,17.15072464,18.85588235],bns:[8.55272653,9.56291667,10.72330508],cibc:[10.60145498,11.55937127,12.49043921]};
 for(const b of banks){const f=forecast(b);f.forEach((x,i)=>close(x.eps,expected[b.id][i],1e-7));const cs=cases(b);close(cs.find(c=>c.name==='Base').eps,f[1].eps);assert.ok(cs[0].totalReturn<cs[1].totalReturn&&cs[1].totalReturn<cs[2].totalReturn);close(f[0].tax,b.ytd.tax+operatingYear(b.q4).tax);}
});
test('Chile deferred-tax charge remains inside FY2026 adjusted earnings exactly once',()=>{
 const b=banks.find(x=>x.id==='bns');const noCharge=structuredClone(b);noCharge.q4.afterTaxCharge=0;close(forecast(noCharge)[0].common-forecast(b)[0].common,55);close(forecast(noCharge)[1].common,forecast(b)[1].common);assert.equal(forecast(b)[0].afterTaxCharge,55);
});
test('ten credit basis points translate dollars to after-tax EPS; revenue and expense shocks combine',()=>{
 for(const b of banks){const f=forecast(b)[1],x=stress(b,{extraPclBps:10});close(f.eps-x.eps,b.loanProxy*.001*(1-f.taxRate)/f.shares);const combined=stress(b,{revenueChange:-.02,expenseChange:.03,extraPclBps:25});close(combined.pretax,f.pretax-.02*f.revenue-.03*f.expenses-.0025*b.loanProxy);}
});
test('return math has no double-counted buyback yield and solves the return hurdle',()=>{
 const r=totalReturn(100,8,12,4);close(r.value,96);close(r.totalReturn,0);close(r.priceReturn,-.04);const entry=(r.value+4)/1.1;close(totalReturn(entry,8,12,4).totalReturn,.1);
 assert.throws(()=>totalReturn(0,8,12,4));
});
test('bank book identity rejects singular/impossible growth assumptions',()=>{
 close(justifiedBook(.16,.1,.03).pb,13/7);assert.throws(()=>justifiedBook(.16,.03,.03));assert.throws(()=>justifiedBook(.02,.1,.03));
});
test('five-year dividends occur five times, terminal sale once, and cash IRR differs from cash-wealth CAGR',()=>{
 const f=fiveYear({price:100,eps:10,growth:0,exitPE:10,dividend:5,dividendGrowth:0});close(f.cashIRR,.05);close(f.final,125);assert.equal(f.rows.length,5);close(f.rows.at(-1).cumulative,25);assert.ok(f.cashIRR>f.wealthCAGR);const zero=fiveYear({price:100,eps:10,growth:.06,exitPE:10,dividend:0,dividendGrowth:0});close(zero.cashIRR,.06);
});
test('source references and report scope are complete for all four banks',()=>{
 for(const b of banks){const sourceIds=new Set(b.sources.map(x=>x.id));assert.equal(sourceIds.size,b.sources.length);for(const id of [...b.sections.flatMap(x=>x.sourceIds),...b.modelSources,...b.valuationSources,b.market.sourceId])assert.ok(sourceIds.has(id),id);for(const s of b.sources){assert.match(s.url,/^https:\/\//);assert.ok(s.published&&s.location);}assert.deepEqual(b.sections.map(x=>x.id),['investment-case','earnings-quality','franchise','credit-capital','distributions','catalysts-risks']);assert.ok(b.sections.flatMap(x=>x.paragraphs).join(' ').split(/\s+/).length>1200);assert.equal(b.market.date,'2026-10-23');}
});
