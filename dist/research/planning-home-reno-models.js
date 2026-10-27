import { hatcClaimsSource } from './planning-home-reno-data.js';
import { METC_2026, METC_2025 } from './planning-metc-claim-models.js';

const issue=i=>i.hrcMedical>i.hrcAccess?{message:'The medical part is a share of the accessibility features, so it cannot be larger than their cost.',fields:['hrcMedical','hrcAccess']}:null;
export const homeRenoDefinitions={homeRenoCredit:{title:'Home accessibility tax credit, multigenerational home renovation tax credit and medical expenses: where each renovation dollar should be claimed in 2025 or 2026',inputIssue:issue,fields:[
  ['hrcYear','Tax year of the claim (2025 or 2026)',2026,2025,2026,1],
  ['hrcSecondary','Does the work create a secondary unit and is this the first MHRTC for the senior or adult with a disability? (1 = yes · 0 = no)',1,0,1,1],
  ['hrcUnit','Cost of the secondary unit other than accessibility features (CAD)',45000,0,150000,500],
  ['hrcAccess','Accessibility and safety features in the work, such as a ramp, walk-in shower, grab bars, wider doors (CAD)',15000,0,60000,250],
  ['hrcMedical','Of those features, the part that also qualifies as a medical expense (CAD)',6000,0,60000,250],
  ['hrcOtherMed','Other medical expenses the claimant already claims for the same 12-month period (CAD)',1500,0,30000,100],
  ['hrcNet','Claimant’s net income, line 23600 (CAD; sets the medical expense threshold)',60000,0,300000,500],
  ['hrcTax','Federal tax the claimant owes before these credits, after the basic personal amount and other credits (CAD)',5000,0,40000,100]
]}};
export const homeRenoWholeKeys=['hrcYear','hrcSecondary'];

// ITA 118.041(3) and (5) (consolidated to 2026-09-30): HATC = appropriate percentage × lesser of CAD 20,000 and the
// qualifying expenditures, CAD 20,000 a year per qualifying individual (and per dwelling). 118.041(1) "qualifying
// expenditure" (k), added by 2026, c. 3, s. 42 and applying from 2026 (CRA Budget 2025 page): an expense included in a
// medical expense claim under 118.2 is no longer a qualifying expenditure. ITA 122.92(3)-(4): MHRTC = appropriate
// percentage × least of CAD 50,000 and the qualifying expenditures, refundable, one qualifying renovation per qualifying
// individual for life. CRA line 45355 "How to claim" (2026-01-20): an expense in the MHRTC claim cannot also be claimed
// for the METC or HATC. Appropriate percentage = lowest federal rate: 14.5% for 2025, 14% for 2026.
export const homeRenoRules={hatcCap:20000,mhrtcCap:50000,
  years:{2025:{rate:.145,threshold:METC_2025.threshold,double:true},2026:{rate:.14,threshold:METC_2026.threshold,double:false}},
  metcPct:.03,
  hatcHistory:[[2016,10000,.15],[2017,10000,.15],[2018,10000,.15],[2019,10000,.15],[2020,10000,.15],[2021,10000,.15],[2022,20000,.15],[2023,20000,.15],[2024,20000,.15],[2025,20000,.145],[2026,20000,.14]]};

const pos=x=>Math.max(0,x);
const clip=(x,hi)=>Math.min(hi,pos(x));
const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const cents=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
const kTick=v=>v===0?'0':(v/1e3)+'k';

export function yearRules(year){return homeRenoRules.years[year>=2026?2026:2025];}
export function metcThreshold(year,net){return Math.min(yearRules(year).threshold,homeRenoRules.metcPct*pos(net));}

// Credits for one allocation. xN, xM: non-medical and medical accessibility dollars moved into the MHRTC claim;
// h (2026 only): medical dollars left outside that go to the HATC instead of the METC. In 2025 the medical dollars left
// outside count for both the HATC and the METC. Non-refundable credits are limited to the federal tax entered.
export function allocate(i,xN,xM,h=0){
  const Y=yearRules(i.hrcYear),r=Y.rate,med=Math.min(pos(i.hrcMedical),pos(i.hrcAccess)),N=pos(i.hrcAccess)-med;
  const sec=i.hrcSecondary?1:0,mU=sec?pos(i.hrcUnit):0;
  xN=sec?clip(xN,N):0;xM=sec?clip(xM,med):0;
  const m=med-xM;h=Y.double?m:clip(h,m);
  const toMhrtc=mU+xN+xM,mhrtcBase=Math.min(homeRenoRules.mhrtcCap,toMhrtc);
  const hatcIn=N-xN+h,hatcBase=Math.min(homeRenoRules.hatcCap,hatcIn);
  const metcIn=Y.double?m:m-h,thr=metcThreshold(i.hrcYear,i.hrcNet),other=pos(i.hrcOtherMed);
  const metcBase=pos(other+metcIn-thr)-pos(other-thr);
  const mhrtc=r*mhrtcBase,hatcRaw=r*hatcBase,metcRaw=r*metcBase,room=pos(i.hrcTax);
  const used=Math.min(room,hatcRaw+metcRaw),share=hatcRaw+metcRaw>0?used/(hatcRaw+metcRaw):0;
  const hatc=hatcRaw*share,metc=metcRaw*share;
  return {xN,xM,h,toMhrtc,mhrtcBase,hatcIn,hatcBase,metcIn,metcBase,thr,mhrtc,hatcRaw,metcRaw,hatc,metc,
    lost:hatcRaw+metcRaw-used,nonref:used,total:mhrtc+used,rate:r,double:Y.double,med,N,
    overMhrtc:pos(toMhrtc-homeRenoRules.mhrtcCap),overHatc:pos(hatcIn-homeRenoRules.hatcCap)};
}

// Two simple rules people follow, and the best split the calculator finds. The search tries every CAD 500 step of
// both amounts moved into the MHRTC plus the exact cap and endpoint values, and for 2026 the breakpoints of h.
export function strategies(i){
  const med=Math.min(pos(i.hrcMedical),pos(i.hrcAccess)),N=pos(i.hrcAccess)-med,sec=i.hrcSecondary?1:0;
  const room=pos(homeRenoRules.mhrtcCap-(sec?pos(i.hrcUnit):0)),Y=yearRules(i.hrcYear);
  const allIn=allocate(i,N,med),keepOut=bestH(i,0,0,Y);
  const grid=(hi,extra)=>{const s=new Set([0,hi,...extra.map(v=>clip(v,hi))]);for(let v=500;v<hi;v+=500)s.add(v);return [...s];};
  let best=null;
  if(sec)for(const xN of grid(N,[room,room-med]))for(const xM of grid(med,[room,room-N,room-xN])){const a=bestH(i,xN,xM,Y);if(!best||a.total>best.total+1e-9)best=a;}
  else best=keepOut;
  return {allIn,keepOut,best};
}
function bestH(i,xN,xM,Y){
  if(Y.double)return allocate(i,xN,xM);
  const med=Math.min(pos(i.hrcMedical),pos(i.hrcAccess)),m=med-(i.hrcSecondary?clip(xM,med):0),N=pos(i.hrcAccess)-med;
  const thrLeft=pos(metcThreshold(i.hrcYear,i.hrcNet)-pos(i.hrcOtherMed)),hatcRoom=pos(homeRenoRules.hatcCap-(N-(i.hrcSecondary?clip(xN,N):0)));
  let best=null;
  for(const h of new Set([0,m,clip(thrLeft,m),clip(hatcRoom,m)])){const a=allocate(i,xN,xM,h);if(!best||a.total>best.total+1e-9)best=a;}
  return best;
}

export function homeRenoResult(kind,input){
  if(kind!=='homeRenoCredit')throw Error('Unknown home renovation credit topic');
  const s=strategies(input),b=s.best,Y=yearRules(input.hrcYear),cost=pos(input.hrcUnit)*(input.hrcSecondary?1:0)+pos(input.hrcAccess);
  const other=input.hrcYear>=2026?2025:2026,sOther=strategies({...input,hrcYear:other}).best;
  const accessGrid=Array.from({length:61},(_,j)=>j*1000);
  const taxGrid=Array.from({length:61},(_,j)=>j*200);
  const unitBars=[0,15000,30000,45000,60000,90000];
  const pct=(Y.rate*100).toFixed(1).replace('.0','');
  const how=input.hrcSecondary?`put ${money(b.toMhrtc)} into the multigenerational home renovation tax credit (MHRTC), ${money(b.hatcIn)} into the home accessibility tax credit (HATC) and ${money(b.metcIn)} into the medical expense tax credit (METC)`:`claim ${money(b.hatcIn)} as home accessibility expenses and ${money(b.metcIn)} as medical expenses (no MHRTC, because no first secondary unit is being created)`;
  const rule=Y.double?'For 2025 an expense can still be claimed as both a medical expense and a home accessibility expense, so the medical part counts twice outside the MHRTC.':'From 2026 an expense claimed as a medical expense is no longer a home accessibility expense, so each dollar goes to one credit only.';
  const hist=homeRenoRules.hatcHistory,stats=hatcClaimsSource.years;
  return {metrics:[
    ['Credits from the best split found',b.total,'money'],
    ['Of which refundable MHRTC',b.mhrtc,'money'],
    ['Of which home accessibility tax credit used',b.hatc,'money'],
    ['Of which medical expense tax credit from the renovation, used',b.metc,'money'],
    ['Non-refundable credit lost because federal tax is too low',b.lost,'money'],
    ['Credits if everything goes into the MHRTC',s.allIn.total,'money'],
    ['Credits if accessibility features stay out of the MHRTC',s.keepOut.total,'money'],
    ['Share of the renovation cost that comes back',cost>0?b.total/cost:0,'percent']
  ],
  note:`For ${input.hrcYear}, with ${money(cost)} of work, the best split the calculator finds is to ${how}. At the ${pct}% rate that returns ${cents(b.total)}: ${cents(b.mhrtc)} refundable and ${cents(b.nonref)} of non-refundable credits${b.lost>0.005?`, after ${cents(b.lost)} of non-refundable credit is lost because only ${money(input.hrcTax)} of federal tax is owed`:''}. ${rule} Putting everything into the MHRTC gives ${cents(s.allIn.total)}; keeping the accessibility features out of it gives ${cents(s.keepOut.total)}. Under ${other} rules the same work would return ${cents(sOther.total)}. Provincial credits, a spouse’s or relative’s separate claims and the eligibility tests themselves are not modelled; CRA decides the claims.`,
  charts:[
    {id:'hrc-access',type:'line',evidence:'Rules applied to hypothetical renovations',unit:'money',title:`Credits as the accessibility features cost more, with a ${money(input.hrcSecondary?input.hrcUnit:0)} secondary unit, ${input.hrcYear} rules`,xLabel:'Accessibility and safety features (CAD)',xTicks:[0,20000,40000,60000].map(x=>({value:x,label:kTick(x)})),series:(()=>{const g=accessGrid.map(x=>[x,strategies({...input,hrcAccess:x,hrcMedical:Math.min(input.hrcMedical,x)})]);return [
      {name:'Best split',rows:g.map(([x,r])=>({x,value:r.best.total}))},
      {name:'Everything in the MHRTC',dash:true,rows:g.map(([x,r])=>({x,value:r.allIn.total}))},
      {name:'Accessibility kept out of the MHRTC',dash:true,rows:g.map(([x,r])=>({x,value:r.keepOut.total}))}];})(),
      note:`The medical part is held at ${money(input.hrcMedical)} (or the whole feature cost if smaller). While the secondary unit and features together are under CAD 50,000, the MHRTC has room and putting features into it costs nothing. Beyond that, the HATC’s CAD 20,000 a year takes the overflow, so the best split keeps rising until both caps are used and then flattens.`},
    {id:'hrc-split',type:'stackbar',evidence:'Rules applied to hypothetical renovations',unit:'money',title:`Where the credits come from as the secondary unit costs more, with ${money(input.hrcAccess)} of accessibility features`,rowLabel:'Secondary unit cost, excluding accessibility',seriesNames:['MHRTC (refundable)','HATC used','METC used','Non-refundable credit lost'],rows:unitBars.map(u=>{const r=strategies({...input,hrcUnit:u}).best;return {label:money(u),values:[r.mhrtc,r.hatc,r.metc,r.lost]};}),
      note:`Each bar is the best split for that secondary unit cost. As the unit itself fills the CAD 50,000 MHRTC limit, accessibility features move out to the HATC and METC, which are non-refundable: with ${money(input.hrcTax)} of federal tax, anything above that is lost (the last segment).${input.hrcSecondary?'':' The MHRTC is switched off in the inputs, so only the HATC and METC appear.'}`},
    {id:'hrc-tax',type:'line',evidence:'Rules applied to hypothetical incomes',unit:'money',title:'Why refundability matters: credits at different amounts of federal tax owed',xLabel:'Federal tax owed before these credits (CAD)',xTicks:[0,4000,8000,12000].map(x=>({value:x,label:kTick(x)})),series:(()=>{const g=taxGrid.map(x=>[x,strategies({...input,hrcTax:x})]);return [
      {name:'Best split, total',rows:g.map(([x,r])=>({x,value:r.best.total}))},
      {name:'Refundable MHRTC in it',dash:true,rows:g.map(([x,r])=>({x,value:r.best.mhrtc}))},
      {name:'Everything in the MHRTC',dash:true,rows:g.map(([x,r])=>({x,value:r.allIn.total}))}];})(),
      note:`A senior with little taxable income can use only part of the non-refundable HATC and METC; the MHRTC is paid even if no tax is owed. That is why, at low tax, the best split pushes as much as possible into the MHRTC. A spouse or another eligible relative with more tax can sometimes claim the HATC instead, which the chart does not model.`},
    {id:'hrc-years',type:'groupbar',evidence:'Rules applied to the same hypothetical renovation',unit:'money',title:'The same renovation under 2025 and 2026 rules',seriesNames:['2025: 14.5%, medical and HATC double claim allowed','2026: 14%, no double claim'],rows:(()=>{const a=strategies({...input,hrcYear:2025}).best,c=strategies({...input,hrcYear:2026}).best;return [{label:'MHRTC',values:[a.mhrtc,c.mhrtc]},{label:'HATC used',values:[a.hatc,c.hatc]},{label:'METC used',values:[a.metc,c.metc]},{label:'Total',values:[a.total,c.total]}];})(),
      note:'Two things changed for 2026: the lowest federal rate, which sets all three credits, fell from 14.5% to 14%, and an expense claimed as a medical expense no longer also counts for the HATC. The MHRTC is claimed in the year the renovation is completed at that year’s rate, even for costs paid in an earlier year.'},
    {id:'hrc-history',type:'bar',evidence:'Official rules, calculated',unit:'money',unitLabel:'Annual expense limit × lowest federal rate · CAD',title:'Largest possible home accessibility tax credit in each year since it began',rows:hist.map(([y,cap,r])=>({label:String(y),value:cap*r})),
      note:'CAD 10,000 × 15% = CAD 1,500 for 2016 to 2021; CAD 20,000 × 15% = CAD 3,000 for 2022 to 2024; then CAD 2,900 for 2025 and CAD 2,800 for 2026 as the lowest rate fell. The CAD 20,000 limit itself is not indexed to inflation.'},
    {id:'hrc-claims',type:'bar',evidence:'Official statistics',unit:'money',unitLabel:'Amount claimed ÷ number of returns · CAD per return',title:'Average home accessibility expenses claimed per return, Canada, 2018 to 2023 tax years',rows:stats.map(y=>({label:`${y.year} · ${y.returns.toLocaleString('en-CA')} returns`,value:y.thousands*1000/y.returns})),source:stats.at(-1).url,sourceLabel:'Canada Revenue Agency · T1 final statistics, Table 2, “Home accessibility expenses”',
      note:`CRA’s final statistics count returns with a claim and the total amount claimed (rounded, in thousands); the average is a division of the two. Claims rose from ${stats[0].returns.toLocaleString('en-CA')} in ${stats[0].year} to ${stats[4].returns.toLocaleString('en-CA')} in 2022, the first year of the CAD 20,000 limit, when the average reached ${money(stats[4].thousands*1000/stats[4].returns)}; in 2023 there were ${stats[5].returns.toLocaleString('en-CA')}. The averages sit far below the limit, which suggests most claims are for modest work such as grab bars, railings and bathroom changes.`}
  ]};
}
