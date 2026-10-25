import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedBondLedger} from '../src/planning-indexed-bond-models.js';
import {indexedBondGuides} from '../src/planning-indexed-bond-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} versus ${b}`);
const base=defaults('inflationLinkedCash');

test('indexed principal and coupon totals match independent powers and a geometric sum',()=>{
  const p=indexedBondLedger(base),halfFactor=Math.sqrt(1.03),n=10;
  near(p.last.adjustedPrincipal,10000*1.03**5);
  near(p.cumulativeCoupons,100*halfFactor*(halfFactor**n-1)/(halfFactor-1));
  near(p.purchaseOutlay,10500);near(p.redemption,11592.740743);
  near(p.totalCash,p.redemption+p.cumulativeCoupons);near(p.netCash,p.totalCash-10500);
  near(p.annualCoupons.reduce((s,r)=>s+r.nominal,0),p.cumulativeCoupons);
});
test('zero index movement produces fixed coupon cash without a fictitious principal uplift',()=>{
  const p=indexedBondLedger({...base,indexedInflation:0,indexedCostPct:100});
  assert.equal(p.rows.length,11);assert.ok(p.rows.every(r=>r.adjustedPrincipal===10000));
  assert.equal(p.redemption,10000);assert.equal(p.floorTopUp,0);assert.equal(p.cumulativeCoupons,1000);assert.equal(p.netCash,1000);
  assert.deepEqual(p.annualCoupons.map(r=>r.nominal),Array(5).fill(200));
});
test('deflation can reduce the coupon base below face even though principal redemption has a floor',()=>{
  const p=indexedBondLedger({...base,indexedInflation:-4});
  near(p.last.adjustedPrincipal,8153.726976);assert.equal(p.redemption,10000);
  near(p.floorTopUp,10000-8153.726976);near(p.last.coupon,81.53726976);
  assert.ok(p.rows.slice(1).every(r=>r.coupon<100&&r.adjustedPrincipal<10000));
  assert.equal(p.principalMinusOutlay,-500);
  assert.ok(p.netCash>p.principalMinusOutlay,'principal-only difference excludes coupon cash');
});
test('each coupon deflated at its own date is constant, independently of whether nominal payments rise or fall',()=>{
  for(const indexedInflation of [-5,0,3,10]){
    const p=indexedBondLedger({...base,indexedInflation});
    for(const r of p.rows.slice(1))near(r.realCoupon,100);
    for(const r of p.annualCoupons)near(r.baseYear,200);
  }
});
test('purchase outlay changes the cash comparison but never changes a contractual payment',()=>{
  const a=indexedBondLedger({...base,indexedCostPct:95}),b=indexedBondLedger({...base,indexedCostPct:110});
  assert.deepEqual(a.rows,b.rows);assert.equal(a.redemption,b.redemption);near(a.netCash-b.netCash,1500);
  const result=planningResult('inflationLinkedCash',base),waterfall=result.charts[2],matrix=result.charts[3];
  near(waterfall.rows.reduce((s,r)=>s+r.value,0),indexedBondLedger(base).netCash);
  assert.deepEqual(matrix.rows[0].values,[500,0,-500,-1000]);
  const changedCoupon=planningResult('inflationLinkedCash',{...base,indexedCoupon:8});
  assert.deepEqual(changedCoupon.charts[3].rows,matrix.rows,'principal matrix excludes coupons');
});
test('supported extremes keep all payment amounts finite and years remain whole',()=>{
  for(const indexedFace of [100,1000000])for(const indexedInflation of [-5,10])for(const indexedYears of [1,10]){
    const input={...base,indexedFace,indexedInflation,indexedYears,indexedCostPct:130,indexedCoupon:8};
    assert.equal(validInputs('inflationLinkedCash',input),true);
    const p=indexedBondLedger(input);assert.ok(p.rows.every(r=>[r.index,r.adjustedPrincipal,r.coupon].every(Number.isFinite)));
    assert.ok(p.redemption>=indexedFace);near(p.cumulativeCoupons+p.redemption-p.purchaseOutlay,p.netCash);
  }
  for(const change of [{indexedYears:1.5},{indexedYears:0},{indexedInflation:-100},{indexedCoupon:NaN},{indexedCostPct:131}]){
    assert.equal(validInputs('inflationLinkedCash',{...base,...change}),false);assert.throws(()=>planningResult('inflationLinkedCash',{...base,...change}));
  }
});
test('four distinct figures identify USD in captions and accessible line/bar descriptions',()=>{
  const result=planningResult('inflationLinkedCash',base);assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
  for(const c of result.charts)for(const width of [300,354,760]){
    const html=renderFigure(c,width);assert.match(html,/<table/);assert.match(html,/role="img"/);assert.match(html,/US dollars \(USD\)/);assert.doesNotMatch(html,/NaN|Infinity|undefined|Canadian dollars|Values in CAD|CAD; value axis/);
  }
  const cad={id:'cad-default',type:'line',title:'Default remains CAD',unit:'money',xLabel:'Year',series:[{name:'Cash',rows:[{x:0,value:100},{x:1,value:110}]}]};
  assert.match(renderFigure(cad),/Values in CAD/);
});
test('the guide explains cash timing, premium and index limitations with six substantial English sections',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const guide of indexedBondGuides){
    assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));assert.ok(slugs.has(guide.slug));
    const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=850);
    assert.match(prose,/publication lag/);assert.match(prose,/USD 10,500/);assert.match(prose,/coupon rate equals return/);
    assert.match(guide.chartScope,/hypothetical USD/);
  }
});
