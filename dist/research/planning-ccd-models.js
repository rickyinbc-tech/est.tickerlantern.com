import { childcareSource } from './planning-childcare-data.js';

export const ccdDefinitions={
  ccdDeduction:{title:'Child care expense deduction (line 21400) for 2025: the three limits, which spouse claims, the tax it saves and the larger Canada child benefit from July 2026',fields:[
    ['ccdYoung','Children under 7 at the end of 2025 (CAD 8,000 limit each)',1,0,6,1],
    ['ccdSchool','Children aged 7 to 16 at the end of 2025 (CAD 5,000 limit each)',1,0,6,1],
    ['ccdUnder6','Of the children under 7, how many are under 6 for the July 2026 to June 2027 CCB',1,0,6,1],
    ['ccdPaid','Eligible child care expenses paid for 2025 (CAD)',12000,0,40000,250],
    ['ccdLowIncome','Lower-income spouse’s 2025 earned income, also used as their net income (CAD)',30000,0,150000,500],
    ['ccdHighIncome','Higher-income spouse’s 2025 net income (CAD)',70000,0,300000,500],
    ['ccdRate','Assumed marginal income tax rate of the lower-income spouse (%)',19.55,0,55,.05],
    ['ccdTaxFree','Income the lower-income spouse can earn before paying any income tax (CAD)',16129,0,25000,100]
  ]}
};
export const ccdWholeKeys=['ccdYoung','ccdSchool','ccdUnder6'];

// CRA Income Tax Folio S1-F3-C1, Child Care Expense Deduction (effective 9 December 2024), ¶1.38.1 and ¶1.40–1.41:
// the deduction is the least of expenses paid, the annual child care expense amount (CAD 8,000 per child under 7 at the
// end of the year, CAD 5,000 per child aged 7 to 16 or older with an infirmity, CAD 11,000 for a child eligible for the
// disability tax credit) and two-thirds of the claimant's earned income. ¶1.21: periodic amount = 1/40 of the annual one.
// CRA line 21400, "Determine who can claim the deduction" (page details 2026-01-20): the lower-net-income person must claim.
export const ccdRules={young:8000,school:5000,dtc:11000,earnedShare:2/3,weeks:40};

// CRA, "How we calculate your CCB" (page details 2026-10-22), July 2026 to June 2027 benefit year, based on 2025 AFNI.
export const ccbRules={period:'July 2026 to June 2027',under6:8157,age6to17:6883,t1:38237,t2:82847,
  r1:[0,.07,.135,.19,.23],base:[0,3123,6022,8476,10260],r2:[0,.032,.057,.08,.095]};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const cents=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
const pos=x=>Math.max(0,x);
const kTick=v=>v===0?'0':(v/1e3)+'k';

export function ccbAnnual(afni,under6,older){
  const R=ccbRules,n=Math.min(4,under6+older);
  if(n===0)return 0;
  const max=under6*R.under6+older*R.age6to17,A=pos(afni);
  const cut=A<=R.t1?0:A<=R.t2?R.r1[n]*(A-R.t1):R.base[n]+R.r2[n]*(A-R.t2);
  return pos(max-cut);
}

export function ccdLimits(young,school,paid,earned){
  const childLimit=young*ccdRules.young+school*ccdRules.school,earnedLimit=ccdRules.earnedShare*pos(earned);
  const deduction=Math.min(pos(paid),childLimit,earnedLimit);
  const binding=deduction===pos(paid)?'expenses paid':deduction===childLimit?'per-child limits':'two-thirds of earned income';
  return {childLimit,earnedLimit,deduction,binding};
}

// Value of the claim: tax saved by the lower-income spouse at the assumed marginal rate, on the part of the deduction
// that comes off income above the tax-free level, plus the higher CCB for July 2026 to June 2027.
export function ccdValue(input,over={}){
  const i={...input,...over},kids=i.ccdYoung+i.ccdSchool,u6=Math.min(i.ccdUnder6,i.ccdYoung),older=kids-u6;
  const l=ccdLimits(i.ccdYoung,i.ccdSchool,i.ccdPaid,i.ccdLowIncome);
  const taxable=Math.min(l.deduction,pos(i.ccdLowIncome-i.ccdTaxFree)),taxSaved=taxable*i.ccdRate/100;
  const afni=i.ccdLowIncome+i.ccdHighIncome,ccbBefore=ccbAnnual(afni,u6,older),ccbAfter=ccbAnnual(afni-l.deduction,u6,older);
  const ccbGain=ccbAfter-ccbBefore,total=taxSaved+ccbGain;
  return {...l,u6,older,kids,taxable,taxSaved,afni,ccbBefore,ccbAfter,ccbGain,total,netCost:pos(i.ccdPaid)-total};
}

export function ccdResult(kind,input){
  if(kind!=='ccdDeduction')throw Error('Unknown child care deduction topic');
  const v=ccdValue(input),R=ccdRules,C=ccbRules,lowClaims=input.ccdLowIncome<=input.ccdHighIncome;
  const paidGrid=Array.from({length:101},(_,j)=>j*300);
  const earnGrid=Array.from({length:121},(_,j)=>j*500);
  const afniGrid=Array.from({length:111},(_,j)=>10000+j*2000);
  const paidBars=[4000,8000,12000,16000,20000,26000];
  const tick=money(v.deduction),bind=v.binding;
  const who=lowClaims?'The lower-income spouse claims, as CRA requires.':'The incomes as entered make the “higher-income” spouse the lower earner; CRA requires the person with the lower net income to claim, so read the results for whoever that is.';
  const regions=childcareSource.regions.map(r=>({label:r.label,value:r.value*12}));
  const nat=childcareSource.national.at(-1);
  return {metrics:[
    ['Child care expense deduction allowed for 2025 (line 21400)',v.deduction,'money'],
    ['Per-child limits added together',v.childLimit,'money'],
    ['Two-thirds of the claimant’s earned income',v.earnedLimit,'money'],
    ['Income tax saved at the assumed rate',v.taxSaved,'money'],
    [`Extra Canada child benefit, ${C.period}`,v.ccbGain,'money'],
    ['Tax saved and extra CCB together',v.total,'money'],
    ['Child care paid, less the tax saved and extra CCB',v.netCost,'money'],
    ['Share of child care paid that comes back',input.ccdPaid>0?v.total/input.ccdPaid:0,'percent']
  ],
  note:`With ${input.ccdYoung} child${input.ccdYoung===1?'':'ren'} under 7 and ${input.ccdSchool} aged 7 to 16, ${money(input.ccdPaid)} of 2025 child care and ${money(input.ccdLowIncome)} of earned income for the lower-income spouse, the deduction is ${tick}, set by the ${bind}. ${who} At the assumed ${input.ccdRate}% marginal rate it saves ${cents(v.taxSaved)} of income tax. It also lowers adjusted family net income from ${money(v.afni)} to ${money(v.afni-v.deduction)}, which raises the ${C.period} Canada child benefit from ${cents(v.ccbBefore)} to ${cents(v.ccbAfter)}, ${cents(v.ccbGain)} more. Together ${cents(v.total)} comes back, ${input.ccdPaid>0?(v.total/input.ccdPaid*100).toFixed(1):'0.0'}% of what was paid. The tax rate is an assumption; provincial child care credits (such as Ontario’s CARE credit), the child disability benefit, GST/HST credit and other income-tested amounts are not included.`,
  charts:[
    {id:'ccd-paid',type:'line',evidence:'Rules applied to hypothetical expenses',unit:'money',title:`Deduction allowed as child care paid rises, with ${money(input.ccdLowIncome)} of earned income`,xLabel:'Eligible child care paid for 2025 (CAD)',xTicks:[0,10000,20000,30000].map(x=>({value:x,label:kTick(x)})),series:[
      {name:'Per-child limits',dash:true,rows:paidGrid.map(x=>({x,value:v.childLimit}))},
      {name:'Two-thirds of earned income',dash:true,rows:paidGrid.map(x=>({x,value:v.earnedLimit}))},
      {name:'Deduction allowed',rows:paidGrid.map(x=>({x,value:ccdLimits(input.ccdYoung,input.ccdSchool,x,input.ccdLowIncome).deduction}))}],
      note:`The deduction follows the amount paid until it meets the lower of the two dashed lines, then stays flat. Here that ceiling is ${money(Math.min(v.childLimit,v.earnedLimit))}. Anything paid above it gives no deduction and cannot be carried forward to another year.`},
    {id:'ccd-earned',type:'line',evidence:'Rules applied to hypothetical incomes',unit:'money',title:`What the claim is worth as the lower-income spouse earns more, with ${money(input.ccdPaid)} paid and the other spouse at ${money(input.ccdHighIncome)}`,xLabel:'Lower-income spouse’s 2025 earned income (CAD)',xTicks:[0,20000,40000,60000].map(x=>({value:x,label:kTick(x)})),series:[
      {name:'Deduction allowed',dash:true,rows:earnGrid.map(x=>({x,value:ccdValue(input,{ccdLowIncome:x}).deduction}))},
      {name:'Income tax saved',rows:earnGrid.map(x=>({x,value:ccdValue(input,{ccdLowIncome:x}).taxSaved}))},
      {name:'Extra CCB',rows:earnGrid.map(x=>({x,value:ccdValue(input,{ccdLowIncome:x}).ccbGain}))},
      {name:'Both together',rows:earnGrid.map(x=>({x,value:ccdValue(input,{ccdLowIncome:x}).total}))}],
      note:`At low earnings the two-thirds limit caps the deduction, and below the tax-free level of ${money(input.ccdTaxFree)} there is no tax to save, but the CCB increase still applies because it depends on family income. The chart keeps the other spouse’s income fixed, so family income rises along the axis too. Past ${money(input.ccdHighIncome)} the spouse on the axis would become the higher earner and the other spouse would have to claim instead; the chart does not switch.`},
    {id:'ccd-afni',type:'line',evidence:'Rules applied to hypothetical incomes',unit:'money',title:`Extra CCB from the same ${tick} deduction at different family incomes`,xLabel:'Adjusted family net income before the deduction (CAD)',xTicks:[50000,100000,150000,200000].map(x=>({value:x,label:kTick(x)})),series:[
      {name:'CCB without the deduction',dash:true,rows:afniGrid.map(x=>({x,value:ccbAnnual(x,v.u6,v.older)}))},
      {name:'CCB with the deduction',rows:afniGrid.map(x=>({x,value:ccbAnnual(x-v.deduction,v.u6,v.older)}))},
      {name:'Extra CCB',rows:afniGrid.map(x=>({x,value:ccbAnnual(x-v.deduction,v.u6,v.older)-ccbAnnual(x,v.u6,v.older)}))}],
      note:`The CCB falls by a fixed percentage of income over ${money(C.t1)} and a smaller one over ${money(C.t2)}; with ${v.kids} child${v.kids===1?'':'ren'} those rates are ${(C.r1[Math.min(4,v.kids)]*100).toFixed(1)}% and ${(C.r2[Math.min(4,v.kids)]*100).toFixed(1)}%. So the deduction is worth most in the first band and little below ${money(C.t1)}, where the full benefit is already paid. Your family income: ${money(v.afni)}, extra CCB ${cents(v.ccbGain)}.`},
    {id:'ccd-split',type:'stackbar',evidence:'Rules applied to hypothetical expenses',unit:'money',title:'Where each amount of child care paid ends up',rowLabel:'Child care paid for 2025',seriesNames:['Income tax saved','Extra CCB','Not deductible','Deductible but not returned'],rows:paidBars.map(p=>{const r=ccdValue(input,{ccdPaid:p});return {label:money(p),values:[r.taxSaved,r.ccbGain,p-r.deduction,r.deduction-r.total]};}),
      note:`Each bar is the amount paid. The first two pieces come back, as a lower tax bill (or larger refund) in spring 2026 and as twelve higher CCB payments from July 2026. The “not deductible” piece is what exceeds the ${money(Math.min(v.childLimit,v.earnedLimit))} ceiling. The last piece is deductible spending the household still bears.`},
    {id:'ccd-statcan',type:'bar',evidence:'Official statistics',unit:'money',unitLabel:`Mean monthly expense × 12, ${nat.year} · CAD per year`,title:'Typical full-time centre-based child care for children 0 to 5, annualized, beside the CAD 8,000 limit for a child under 7',rows:[{label:'Deduction limit, child under 7',value:R.young},{label:`Canada, ${nat.year}`,value:nat.value*12},...regions],source:childcareSource.url,sourceLabel:`Statistics Canada · The Daily, released ${childcareSource.released} (table ${childcareSource.table})`,
      note:`Parent-reported mean monthly expense for ${childcareSource.population.toLowerCase()}, multiplied by 12 (a calculation; the survey reports monthly amounts). National ${money(nat.value)} a month is ${money(nat.value*12)} a year, below the CAD 8,000 limit; where fees in regulated spaces have fallen under the federal–provincial early learning and child care agreements, expenses paid, not the CAD 8,000 limit, are more likely to set the deduction for a young child. Unregulated care, before- and after-school programs and day camps can still exceed it.`}
  ]};
}
