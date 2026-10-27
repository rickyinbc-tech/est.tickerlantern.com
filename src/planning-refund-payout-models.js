export const refundPayoutDefinitions={
  rrspPayroll:{title:'Compare waiting for a spring RRSP refund with reducing tax at source each payday',fields:[
    ['rpMonthly','Money you set aside for the RRSP each month, after tax (CAD)',500,50,5000,50],
    ['rpRate','Marginal tax rate the RRSP deduction saves (%)',28.2,0,60,.1],
    ['rpReturn','Fund return each year inside the RRSP (%)',6,-5,15,.25],
    ['rpRefundMonth','Month the refund is invested in the following year (1 = January)',5,2,12,1],
    ['rpYears','Years the same saving pattern continues',25,1,40,1]
  ]},
  tSeriesSwp:{title:'Compare T-series payouts with a systematic withdrawal plan from the same non-registered fund',inputIssue:i=>i.tsIncome>i.tsPayout||i.tsCost>i.tsAmount*4,fields:[
    ['tsAmount','Market value of the fund units at the start (CAD)',300000,10000,5000000,5000],
    ['tsCost','Adjusted cost base of those units (CAD)',180000,0,5000000,5000],
    ['tsPayout','Annual payout rate, set on the previous year-end value (%)',5,1,10,.5],
    ['tsReturn','Fund total return each year before payouts (%)',5,-5,12,.25],
    ['tsIncome','Taxable income the fund distributes each year, part of the payout (%)',2,0,6,.25],
    ['tsRate','Marginal tax rate on capital gains income during the payout years (%)',30,0,60,.5],
    ['tsLaterRate','Marginal tax rate when the remaining units are finally sold (%)',30,0,60,.5],
    ['tsYears','Years of payouts before the remaining units are sold',25,1,40,1]
  ]}
};
export const refundPayoutWholeKeys=['rpRefundMonth','rpYears','tsYears'];

// CRA, "Tax rates and income brackets for individuals – current year (2026)" (page dated 25 June 2026).
// Statutory bracket rates only: before the basic personal amount, other credits and the BC tax reduction.
export const brackets2026={
  federal:[[58523,14],[117045,20.5],[181440,26],[258482,29],[Infinity,33]],
  bc:[[50363,5.6],[100728,7.7],[115648,10.5],[140430,12.29],[190405,14.7],[265545,16.8],[Infinity,20.5]]
};
// CRA, MP, DB, RRSP, DPSP, ALDA, TFSA limits and YMPE (page dated 1 December 2025).
export const rrspDollarLimits={2020:27230,2021:27830,2022:29210,2023:30780,2024:31560,2025:32490,2026:33810,2027:35390};
const rateAt=(list,x)=>list.find(([top])=>x<=top)[1];
export function combinedBands(){
  const tops=[...new Set([...brackets2026.federal,...brackets2026.bc].map(([t])=>t))].sort((a,b)=>a-b);
  let low=0;return tops.map(top=>{const band={low,top,rate:rateAt(brackets2026.federal,top)+rateAt(brackets2026.bc,top)};low=top;return band;});
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const monthly=a=>Math.pow(1+a,1/12)-1;

// RRSP saving from pay, same after-tax effort P each month in every path. Contributions go in at the start of
// each month and the fund then earns the monthly equivalent of the annual return.
// Reduced at source: with a CRA letter of authority (or employer payroll deductions), withholding falls by the
// tax the deduction saves, so P/(1-t) goes in each month and no refund is due.
// Spring refund: P goes in each month; the refund t x (that calendar year's contributions) is invested at the start
// of month L of the next year and itself counts as a contribution for that year. At each year-end the refund still
// owed is added together with the refunds it would generate in turn, t x C/(1-t), so this path is not penalised
// for the cut-off: with a 0% return the two paths are then exactly equal.
// Refund spent: P each month only. RRSP room is assumed to be sufficient in every path.
export function rrspPayrollPlan(input,overrides={}){
  const i={...input,...overrides},P=i.rpMonthly,t=i.rpRate/100,r=monthly(i.rpReturn/100),L=i.rpRefundMonth-1,n=i.rpYears;
  let atSource=0,spring=0,spent=0,yearContrib=0,owed=0;const rows=[],first=[];
  for(let m=0;m<12*n;m++){
    if(m%12===0){owed=t*yearContrib;yearContrib=0;}
    atSource+=P/(1-t);spring+=P;spent+=P;yearContrib+=P;
    if(m%12===L&&m>=12){spring+=owed;yearContrib+=owed;owed=0;}
    atSource*=1+r;spring*=1+r;spent*=1+r;
    if(m<24)first.push({x:m+1,atSource,spring,spent});
    if((m+1)%12===0)rows.push({x:(m+1)/12,atSource,spring:spring+t*yearContrib/(1-t),springInvested:spring,spent});
  }
  const end=rows.at(-1);
  return {rows,first,end,annualAtSource:12*P/(1-t),annualRefundFirst:12*P*t,gap:end.atSource-end.spring,refundGap:end.spring-end.spent};
}

// Same fund, same payout cash W = payout rate x value at the start of each year, paid at year-end after the fund's
// total return. The fund's taxable income (income rate x start value) is part of W in both routes and is taxed the
// same way in both, so it is left out of the comparison. The rest of W is:
// T-series: return of capital, which lowers the ACB; once the ACB would go below zero, CRA deems the negative amount
// a capital gain in that year and resets the ACB to zero.
// SWP: a redemption of that amount, realising the gain share (1 - ACB/value) of it and reducing the ACB in proportion.
// Capital gains are half taxable. Taxes are paid from outside cash; the remaining units are sold after the last year.
export function tSeriesStep(V,B,i){
  const W=i.tsPayout/100*V,I=i.tsIncome/100*V,R=W-I,before=V*(1+i.tsReturn/100)-I;
  return {W,R,before,after:before-R};
}
export function tSeriesSwpPlan(input,overrides={}){
  const i={...input,...overrides},h=.5*i.tsRate/100,hLater=.5*i.tsLaterRate/100,rows=[];
  let V=i.tsAmount,bT=i.tsCost,bS=i.tsCost,cumT=0,cumS=0,payout=0,zeroYear=null;
  rows.push({x:0,value:V,acbT:bT,acbS:bS,taxT:0,taxS:0,cumT:0,cumS:0});
  for(let y=1;y<=i.tsYears;y++){
    const s=tSeriesStep(V,bT,i);
    let gainT=0;bT-=s.R;if(bT<0){gainT=-bT;bT=0;}
    if(bT===0&&zeroYear===null)zeroYear=y;
    const share=s.before>0?Math.min(1,s.R/s.before):1,gainS=s.R-bS*share;bS*=1-share;
    const taxT=Math.max(0,gainT)*h,taxS=gainS*h;
    cumT+=taxT;cumS+=taxS;payout+=s.W;V=s.after;
    rows.push({x:y,value:V,acbT:bT,acbS:bS,taxT,taxS,cumT,cumS,payout:s.W});
  }
  const finalT=(V-bT)*hLater,finalS=(V-bS)*hLater;
  return {rows,end:rows.at(-1),finalT,finalS,payout,zeroYear,totalT:cumT+finalT,totalS:cumS+finalS,firstTenT:rows.slice(1,11).reduce((a,r)=>a+r.taxT,0),firstTenS:rows.slice(1,11).reduce((a,r)=>a+r.taxS,0)};
}
export function yearsToZeroAcb(input,payout,ret,limit=60){
  const i={...input,tsPayout:payout,tsReturn:ret};let V=i.tsAmount,B=i.tsCost;
  if(B<=0)return 0;
  for(let y=1;y<=limit;y++){const s=tSeriesStep(V,B,i);B-=s.R;V=s.after;if(B<=0)return y;if(V<=0)return y;}
  return limit;
}

export function refundPayoutResult(kind,input){
  if(kind==='rrspPayroll'){
    const p=rrspPayrollPlan(input),t=input.rpRate/100,e=p.end,bands=combinedBands(),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rates=[20,30,40,50],rets=[0,3,6,9];
    return {metrics:[['Monthly RRSP contribution when tax is reduced at source',input.rpMonthly/(1-t),'money'],['First spring refund if tax is not reduced',p.annualRefundFirst,'money'],[`RRSP value after ${input.rpYears} years · tax reduced at source`,e.atSource,'money'],[`RRSP value after ${input.rpYears} years · spring refund invested`,e.spring,'money'],[`RRSP value after ${input.rpYears} years · refund spent`,e.spent,'money'],['Reduced at source minus spring refund invested',p.gap,'money']],
    note:`Every path costs you the same ${money(input.rpMonthly)} a month after tax. Reducing tax at source lets ${money(input.rpMonthly/(1-t))} go in each month, about ${money(p.annualAtSource)} a year; the spring-refund path puts in ${money(input.rpMonthly)} a month and invests each refund in ${months[input.rpRefundMonth-1]} of the following year. The ${input.rpRate}% rate is the tax one more dollar of deduction saves; a large deduction can cross into a lower bracket. The return of ${input.rpReturn}% is smooth and hypothetical, fees are inside it, and RRSP room is assumed to cover every contribution. RRSP balances are compared before the tax due on later withdrawals, which applies to every path in the same way.`,
    charts:[
      {id:'rrsp-payroll-brackets',type:'bar',evidence:'Official tax rates',title:'What one more dollar of RRSP deduction saves in British Columbia, 2026',unit:'percent',unitLabel:'Federal plus BC statutory rate on taxable income in each band · before credits',rows:bands.map(b=>({label:b.top===Infinity?`Over ${money(b.low)}`:`${money(b.low)} to ${money(b.top)}`,value:b.rate/100})),source:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html',sourceLabel:'Canada Revenue Agency · 2026 tax rates and income brackets',note:`Federal rates from 14% to 33% plus British Columbia rates from 5.6% to 20.5%, as listed by CRA for 2026 (page dated 25 June 2026). An RRSP deduction comes off the top of taxable income, so it saves the rate of the band your income falls in. These are bracket rates before the basic personal amount and other credits, and before the BC tax reduction for lower incomes; other provinces use different bands.`},
      {id:'rrsp-payroll-first-two-years',type:'line',title:'The first two years: RRSP balance at each month-end',unit:'money',xLabel:'Months from the first contribution',xTicks:[1,6,12,18,24].map(k=>({value:k,label:k===12?'Dec, year 1':k===24?'Dec, year 2':`Month ${k}`})),series:[{name:'Tax reduced at source each payday',rows:p.first.map(r=>({x:r.x,value:r.atSource}))},{name:'Spring refund invested',rows:p.first.map(r=>({x:r.x,value:r.spring}))},{name:'Refund spent',dash:true,rows:p.first.map(r=>({x:r.x,value:r.spent}))}],note:`The spring-refund path catches up by part of the gap in ${months[input.rpRefundMonth-1]} of year 2, when the first refund of about ${money(p.annualRefundFirst)} is invested. Until then the tax saving sits with CRA. Reducing tax at source moves that money into the RRSP from the first payday instead.`},
      {id:'rrsp-payroll-long-run',type:'line',title:`After ${input.rpYears} years: the same monthly effort, three ways`,unit:'money',xLabel:'Years of saving',series:[{name:'Tax reduced at source each payday',rows:p.rows.map(r=>({x:r.x,value:r.atSource}))},{name:'Spring refund invested, counting the refund still owed',rows:p.rows.map(r=>({x:r.x,value:r.spring}))},{name:'Refund spent',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.spent}))}],note:`Reducing tax at source ends ${money(p.gap)} ahead of investing each spring refund, because each year’s tax saving reaches the fund months earlier. Spending the refund is the larger difference: ${money(p.refundGap)} behind the spring-refund path, because the contributions then never grow beyond the after-tax amount.`},
      {id:'rrsp-payroll-grid',type:'heatmap',title:`Reduced at source minus spring refund invested after ${input.rpYears} years`,unit:'money',rowLabel:'Marginal tax rate saved',columns:rets.map(g=>`${g}% fund return`),rows:rates.map(rt=>({label:`${rt}%`,values:rets.map(g=>{const v=rrspPayrollPlan(input,{rpRate:rt,rpReturn:g}).gap;return Math.abs(v)<.005?0:v;})})),note:`Each cell keeps ${money(input.rpMonthly)} a month of after-tax saving and the refund month, and changes only the tax rate and the fund return. The gap grows with both: a higher rate makes the refund larger, and a higher return makes the months of waiting cost more. At a 0% return the two paths end level, because waiting then costs nothing.`}
    ]};
  }
  if(kind==='tSeriesSwp'){
    const p=tSeriesSwpPlan(input),e=p.end,payouts=[4,5,6,7,8],rets=[0,2,4,6,8],n=input.tsYears;
    return {metrics:[['Payout in year 1, either route',input.tsPayout/100*input.tsAmount,'money'],[`Capital-gains tax over the first ${Math.min(10,n)} years · T-series`,p.firstTenT,'money'],[`Capital-gains tax over the first ${Math.min(10,n)} years · withdrawal plan`,p.firstTenS,'money'],['Year the T-series cost base reaches zero at these inputs (60 = 60 or later)',p.zeroYear??yearsToZeroAcb(input,input.tsPayout,input.tsReturn),'integer'],[`Total capital-gains tax including the final sale · T-series`,p.totalT,'money'],[`Total capital-gains tax including the final sale · withdrawal plan`,p.totalS,'money']],
    note:`Units worth ${money(input.tsAmount)} with a ${money(input.tsCost)} cost base pay ${input.tsPayout}% of the previous year-end value each year. ${input.tsIncome}% is the fund’s own taxable income, taxed the same way in both routes and left out of the tax figures; the rest is return of capital in the T-series and a redemption of units in the withdrawal plan. Capital gains are half taxable at ${input.tsRate}% during the payout years and ${input.tsLaterRate}% at the final sale. ${p.zeroYear?`The T-series cost base reaches zero in year ${p.zeroYear}.`:`The T-series cost base stays above zero for all ${n} years.`} The ${input.tsReturn}% return is a smooth hypothetical input, not a forecast; real returns vary and can be negative for years.`,
    charts:[
      {id:'t-series-acb',type:'line',title:'Market value and adjusted cost base under each route',unit:'money',xLabel:'Years of payouts',series:[{name:'Market value of the remaining units, both routes',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Cost base · T-series (return of capital)',rows:p.rows.map(r=>({x:r.x,value:r.acbT}))},{name:'Cost base · systematic withdrawal plan',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.acbS}))}],note:`Both routes hold the same fund and pay the same cash, so the market value is identical. Return of capital lowers the T-series cost base by the full non-income part of each payout; a redemption lowers it only by the cost share of the units sold. The gap between market value and cost base is the gain still waiting to be taxed.`},
      {id:'t-series-annual-tax',type:'line',title:'Capital-gains tax paid in each payout year',unit:'money',xLabel:'Years of payouts',series:[{name:'T-series',rows:p.rows.slice(1).map(r=>({x:r.x,value:r.taxT}))},{name:'Systematic withdrawal plan',dash:true,rows:p.rows.slice(1).map(r=>({x:r.x,value:r.taxS}))}],note:`The withdrawal plan pays some tax from the first year, because each redemption includes part of the gain. The T-series pays none on return of capital until its cost base is used up${p.zeroYear?`, in year ${p.zeroYear}; from then on CRA deems the excess a capital gain each year, so its annual tax jumps above the withdrawal plan’s`:''}. Tax on the fund’s own income is the same in both routes and is not shown.`},
      {id:'t-series-total-tax',type:'stackbar',title:`Capital-gains tax over ${n} years and at the final sale`,unit:'money',rowLabel:'Route',seriesNames:['Tax during the payout years',`Tax when the remaining units are sold at ${input.tsLaterRate}%`],rows:[{label:'T-series',values:[e.cumT,p.finalT]},{label:'Systematic withdrawal plan',values:[e.cumS,p.finalS]}],note:`Return of capital defers tax; it does not remove it. With the same tax rate throughout, both routes pay the same total, because the total gain is the same: ${money(p.totalT)} for the T-series and ${money(p.totalS)} for the withdrawal plan here. The T-series comes out ahead in total only when the final sale is taxed at a lower rate than the payout years, and behind when it is taxed at a higher one.`},
      {id:'t-series-zero-grid',type:'heatmap',title:'Years until the T-series cost base reaches zero',unit:'integer',rowLabel:'Annual payout rate',columns:rets.map(g=>`${g}% return`),rows:payouts.map(d=>({label:`${d}%`,values:rets.map(g=>yearsToZeroAcb(input,d,g))})),note:`Each cell keeps the ${money(input.tsAmount)} value, the ${money(input.tsCost)} cost base and ${input.tsIncome}% of taxable fund income, and changes the payout rate and the fund’s return. Higher payouts use up the cost base faster. A cell showing 60 means the cost base lasts at least 60 years. When the payout is above the return, the payout itself also shrinks year by year, because it is reset on a falling value.`}
    ]};
  }
  throw Error('Unknown refund-payout topic');
}
