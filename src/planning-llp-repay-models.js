import { tuitionSource } from './planning-tuition-data.js';

const issue=i=>i.llpW2>0&&i.llpStudy<2?{message:'A second-year withdrawal needs the student to still be enrolled that year; set at least 2 years of qualifying study, or a second-year withdrawal of 0.',fields:['llpW2','llpStudy']}:null;
export const llpRepayDefinitions={
  llpRepay:{title:'Plan Lifelong Learning Plan withdrawals: when repayments start, what each year requires, and what skipping one costs',inputIssue:issue,fields:[
    ['llpW1','LLP withdrawal in 2026 (CAD · annual limit 10,000)',10000,500,10000,500],
    ['llpW2','LLP withdrawal in 2027 (CAD · total limit 20,000)',10000,0,10000,500],
    ['llpStudy','Calendar years the student is a qualifying student, from the first withdrawal year (2026)',2,1,5,1],
    ['llpPaid','Share of each required repayment you actually designate on Schedule 7 (%)',100,0,100,5],
    ['llpTax','Marginal tax rate on any shortfall added to income (%)',30,0,55,1],
    ['llpReturn','Assumed annual RRSP return (%)',5,0,10,.25]
  ]}
};
export const llpRepayWholeKeys=['llpStudy'];

// CRA, Lifelong Learning Plan pages (withdrawals page 2026-09-17, participation 2026-09-16, repayments, cancellation and
// definitions 2025-12-19): CAD 10,000 a calendar year and CAD 20,000 a participation; 10-year repayment period; each
// year's amount is the balance at the start of the year divided by the years left; shortfalls go on line 12900.
export const llpRules={firstYear:2026,annualLimit:10000,totalLimit:20000,years:10,latestStart:5,graceDays:60,minMonths:3,minHours:10};

// Repayment starts in the second of two consecutive years in which the student is not a qualifying student for at least
// three months, and no later than the fifth year after the first withdrawal. With qualifying study in years 0..k-1 and
// none after, years k and k+1 fail the test, so the first repayment year index is min(k + 1, 5). Short programs that
// never reach three consecutive months, leaving the program and cancellations are described in the text, not modelled.
export const llpStartIndex=study=>Math.min(study+1,llpRules.latestStart);

// Required amounts for a list of designated repayments; overpaying lowers later amounts, underpaying adds the shortfall
// to income and still reduces the balance by the full requirement (CRA's Alexander and Josée examples).
export function llpRequiredSeries(balance,designated){
  let bal=balance;return designated.map((d,k)=>{const required=bal/(llpRules.years-k),included=Math.max(0,required-d),row={start:bal,required,designated:d,included};bal=Math.max(0,bal-d-included);return row;});
}

export function llpPlan(input,overrides={}){
  const i={...input,...overrides},R=llpRules,first=i.llpFirst??R.firstYear,r=i.llpReturn/100,share=i.llpPaid/100;
  const w=[Math.min(i.llpW1,R.annualLimit),Math.min(i.llpW2,R.annualLimit)],total=Math.min(w[0]+w[1],R.totalLimit);
  const s=llpStartIndex(i.llpStudy),end=s+R.years-1;
  let bal=total,included=0,paid=0;const rows=[];
  for(let t=s;t<=end;t++){
    const required=bal/(R.years-(t-s)),pay=required*share,inc=required-pay;
    rows.push({t,year:first+t,start:bal,required,paid:pay,included:inc,tax:inc*i.llpTax/100});
    bal-=required;paid+=pay;included+=inc;
  }
  // Withdrawals are taken at the start of their year; repayments are counted at 31 December of the repayment year
  // (contributions in the first 60 days of the next year also qualify, which would shift growth by up to two months).
  const keptValue=t=>w.reduce((a,x,k)=>a+(k<=t?x*Math.pow(1+r,t-k+1):0),0);
  const repaidValue=t=>rows.reduce((a,q)=>a+(q.t<=t?q.paid*Math.pow(1+r,t-q.t):0),0);
  const path=Array.from({length:end+1},(_,t)=>({t,year:first+t,kept:keptValue(t),repaid:repaidValue(t)}));
  const kept=keptValue(end),repaid=repaidValue(end),gap=kept-repaid;
  return {first,w,total,startIndex:s,firstRepayYear:first+s,lastRepayYear:first+end,firstRequired:rows[0].required,rows,paid,included,tax:included*i.llpTax/100,path,kept,repaid,gap,lostGrowth:gap-included,withdrawalYears:w[1]>0?2:1};
}

export function llpRepayResult(kind,input){
  if(kind!=='llpRepay')throw Error('Unknown LLP topic');
  const p=llpPlan(input),money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}),cents=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
  const sched=[{name:'LLP balance at the start of the year',rows:p.rows.map(q=>({x:q.year,value:q.start}))},{name:'Required repayment for the year',dash:true,rows:p.rows.map(q=>({x:q.year,value:q.required}))}];
  if(p.included>0)sched.push({name:'Shortfall added to income (line 12900)',rows:p.rows.map(q=>({x:q.year,value:q.included}))});
  const shares=Array.from({length:11},(_,k)=>k*10),byShare=shares.map(x=>({x,p:llpPlan(input,{llpPaid:x})}));
  const ticks=p.path.filter((_,k)=>k%2===0||k===p.path.length-1).map(q=>({value:q.year,label:String(q.year)}));
  return {metrics:[['Total LLP withdrawals',p.total,'money'],['Years from the first withdrawal to the first repayment',p.startIndex,'integer'],['Required repayment in the first repayment year',p.firstRequired,'money'],['Shortfall added to income over the 10 years',p.included,'money'],['Extra income tax on that shortfall',p.tax,'money'],['RRSP growth given up by the end of repayment',p.lostGrowth,'money']],
  note:`With ${money(p.total)} withdrawn and ${input.llpStudy} calendar year${input.llpStudy>1?'s':''} of qualifying study from ${p.first}, the first repayment is due for ${p.firstRepayYear} (paid by the 60th day of ${p.firstRepayYear+1}) and the last for ${p.lastRepayYear}. Designating ${input.llpPaid}% of each required amount adds ${cents(p.included)} to income over the period. At ${input.llpReturn}% a year, the withdrawn money would have been worth ${money(p.kept)} in the RRSP by the end of ${p.lastRepayYear}; the repayments are worth ${money(p.repaid)}. Leaving the program, cancellation, short programs, death, emigration and turning 71 are not modelled. CRA’s LLP Statement of Account shows your actual balance and amount due.`,
  charts:[
    {id:'llp-tuition',type:'bar',evidence:'Official statistics · preliminary 2026/2027',title:'Average undergraduate tuition for Canadian full-time students, 2026/2027, by province',unit:'money',unitLabel:'CAD a year · tuition only',rows:[...tuitionSource.provinces].sort((a,b)=>a.value-b.value).map(r=>({label:r.label,value:r.value})).concat([{label:'Canada · weighted average',value:tuitionSource.national[0].value}]),source:tuitionSource.url,sourceLabel:'Statistics Canada · Table 37-10-0045-01',note:`Statistics Canada’s preliminary weighted averages for full-time Canadian undergraduates at public degree-granting institutions, released ${tuitionSource.released}. Every provincial average is below the CAD 10,000 annual LLP limit except Nova Scotia (CAD 10,029), New Brunswick (CAD 10,373) and Saskatchewan (CAD 10,167). Tuition excludes compulsory fees, books and living costs, which a household may also need to cover; CRA’s LLP pages set conditions on the student and the program, not on how the withdrawn money is spent. Averages are not a quote for any program, and graduate, college and professional programs can cost much more or less.`},
    {id:'llp-schedule',type:'line',title:`LLP balance and required repayment by year, ${p.firstRepayYear} to ${p.lastRepayYear}`,unit:'money',xLabel:'Repayment year',xTicks:p.rows.filter((_,k)=>k%3===0||k===9).map(q=>({value:q.year,label:String(q.year)})),series:sched,note:`Each year CRA divides the balance at the start of the year by the years left in the 10-year period. With full repayments, that is ${cents(p.total/10)} every year. A shortfall is added to income on line 12900, and the balance falls by the full required amount anyway, so the next year’s requirement does not rise. Paying more than required lowers every later amount, because the smaller balance is divided by the years left.`},
    {id:'llp-shortfall',type:'line',title:'Income added and extra tax over 10 years, by the share of each required repayment you make',unit:'money',xLabel:'Share of each required repayment designated (%)',xTicks:[0,20,40,60,80,100].map(v=>({value:v,label:v+'%'})),series:[{name:'Total shortfall added to income',rows:byShare.map(q=>({x:q.x,value:q.p.included}))},{name:`Extra tax at a ${input.llpTax}% marginal rate`,dash:true,rows:byShare.map(q=>({x:q.x,value:q.p.tax}))}],note:`Skipping every repayment adds the whole ${money(p.total)} to income, one tenth a year, costing ${money(p.total*input.llpTax/100)} of tax at a ${input.llpTax}% rate. The tax is the visible cost; the larger one is that the money never returns to the RRSP and loses tax-sheltered growth for good. A shortfall is not a penalty, but it is permanent: the RRSP room used by the original contributions does not come back.`},
    {id:'llp-rrsp',type:'line',title:`What the withdrawn money would have been worth in the RRSP, against the repayments, at ${input.llpReturn}% a year`,unit:'money',xLabel:'End of calendar year',xTicks:ticks,series:[{name:'Withdrawn amounts, had they stayed invested',rows:p.path.map(q=>({x:q.year,value:q.kept}))},{name:'Repayments made, growing in the RRSP',dash:true,rows:p.path.map(q=>({x:q.year,value:q.repaid}))}],note:`At the end of ${p.lastRepayYear}, the gap is ${money(p.gap)}${p.included>0?`: ${money(p.included)} of principal never repaid, and ${money(p.lostGrowth)} of growth`:` of growth, even though every dollar was repaid`}. These are pre-tax RRSP dollars and a constant assumed return, not a forecast. The comparison ignores what the education is worth and the interest a student loan or line of credit would cost instead.`}
  ]};
}
