export const spouseLoanDefinitions={
  spouseLoan:{title:'Investing through a lower-earning spouse: TFSA gift, prescribed-rate loan or your own name',fields:[
    ['splAmount','Money to invest beyond your own TFSA and RRSP (CAD)',100000,1000,5000000,1000],
    ['splRoom','Spouse’s unused TFSA room (CAD)',30000,0,200000,500],
    ['splRate','Prescribed rate in effect when the loan is made (%)',3,0,10,1],
    ['splReturn','Fund total return (% a year)',6,-2,12,.25],
    ['splDist','Part of the return paid out each year as taxable income (% of value)',2.5,0,8,.25],
    ['splHigh','Your marginal tax rate (%)',48,0,55,1],
    ['splLow','Spouse’s marginal tax rate (%)',25,0,55,1],
    ['splYears','Years until everything is sold',15,1,40,1]
  ]}
};
export const spouseLoanWholeKeys=['splYears'];

// CRA prescribed interest rate used for taxable benefits from low-interest loans (Income Tax Regulations
// 4301(c)), by calendar quarter, from CRA's quarterly prescribed-rate pages reviewed 27 October 2026. Each is
// paired with the Bank of Canada monthly 3-month treasury bill yield (Valet V122531) for the first month of the
// preceding quarter, the month the regulation's auction average is drawn from.
export const prescribedQuarters=[
  ['2021 Q4',1,.17],['2022 Q1',1,.13],['2022 Q2',1,.32],['2022 Q3',2,1.32],['2022 Q4',3,2.65],
  ['2023 Q1',4,3.86],['2023 Q2',5,4.37],['2023 Q3',5,4.38],['2023 Q4',5,5],
  ['2024 Q1',6,5.08],['2024 Q2',6,4.94],['2024 Q3',5,4.91],['2024 Q4',5,4.39],
  ['2025 Q1',4,3.51],['2025 Q2',4,2.89],['2025 Q3',3,2.64],['2025 Q4',3,2.68],
  ['2026 Q1',3,2.23],['2026 Q2',3,2.18],['2026 Q3',3,2.28],['2026 Q4',3,2.27]
];

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;

// One non-registered holding over the years. Each year the fund earns r, of which d of the starting value is paid out
// and reinvested (raising the cost base) and taxed at rate m as ordinary income, less any deductible loan interest i.
// The interest and the tax are paid by selling units, and the gain on the units sold is taxed too (half the gain at m),
// so the sale is grossed up. A negative tax (interest larger than the payout) is a deduction against other income and is
// added back to the fund. Optional yearly additions (after-tax interest received) are invested at each year-end.
export function holding({start,m,r,d,years,interest=0,add=0}){
  let V=start,acb=start,tax=0;const rows=[];
  for(let y=1;y<=years;y++){
    const dist=V*d;V*=1+r;acb+=dist;
    const t=m*(dist-interest),need=interest+t;
    if(need>0&&V>0){
      const g=Math.max(0,(V-acb)/V),sale=Math.min(V,need/(1-g*m/2));
      tax+=t+(sale-need);acb-=acb*sale/V;V-=sale;
    }else{V-=need;acb-=need;tax+=t;}
    if(add){V+=add;acb+=add;}
    rows.push({x:y,value:V,after:V-Math.max(0,V-acb)*m/2});
  }
  return {rows,value:V,acb,after:V-Math.max(0,V-acb)*m/2,tax};
}

// Household after-tax value at year N for each approach.
export function spouseLoanPlan(input,o={}){
  const i={...input,...o},A=i.splAmount,r=i.splReturn/100,d=i.splDist/100,mH=i.splHigh/100,mL=i.splLow/100,N=i.splYears,p=i.splRate/100;
  const own=holding({start:A,m:mH,r,d,years:N});
  const loanOf=L=>{
    const spouse=holding({start:L,m:mL,r,d,years:N,interest:p*L});
    const lender=holding({start:0,m:mH,r,d,years:N,add:p*L*(1-mH)});
    return {spouse,lender,after:spouse.after+lender.after,rows:spouse.rows.map((row,k)=>({x:row.x,value:row.after+lender.rows[k].after}))};
  };
  const loan=loanOf(A),inTfsa=Math.min(A,i.splRoom),rest=loanOf(A-inTfsa);
  const tfsa=inTfsa*(1+r)**N,mix=tfsa+rest.after;
  return {own,loan,mix,tfsa,inTfsa,rest,interest:p*A,interestRest:p*(A-inTfsa),diff:loan.after-own.after,mixDiff:mix-own.after};
}

// Highest prescribed rate (continuous) at which the loan still matches investing in your own name.
export function breakEvenRate(input){
  const f=p=>spouseLoanPlan(input,{splRate:p}).diff;
  if(f(0)<=0)return 0;
  let lo=0,hi=30;
  if(f(hi)>0)return hi/100;
  for(let k=0;k<80;k++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
  return lo/100;
}

export function spouseLoanResult(kind,input){
  if(kind!=='spouseLoan')throw Error('Unknown spouse loan topic');
  const plan=spouseLoanPlan(input),N=input.splYears,yrs=`${N} year${N===1?'':'s'}`,be=breakEvenRate(input);
  const ownRows=plan.own.rows,rates=[1,3,5,6],lows=[0,15,20,25,30,35,40],cols=[1,2,3,4,5,6];
  const sign=v=>v>=0?`${money(v)} ahead of`:`${money(-v)} behind`;
  return {metrics:[
    ['Interest your spouse pays you by 30 January each year (whole amount lent)',plan.interest,'money'],
    [`After tax at year ${N}: invested in your own name (or gifted and attributed back)`,plan.own.after,'money'],
    [`After tax at year ${N}: whole amount lent at ${input.splRate}%`,plan.loan.after,'money'],
    [`After tax at year ${N}: ${money(plan.inTfsa)} to the spouse’s TFSA, the rest lent`,plan.mix,'money'],
    ['Loan minus own name, after tax',plan.diff,'money'],
    ['Highest prescribed rate at which the loan still breaks even',be,'percent']
  ],
  note:`Lending ${money(input.splAmount)} at ${input.splRate}% means your spouse must pay you ${money(plan.interest)} of interest for each year by 30 January of the next year; you report it and they deduct it. With a ${input.splReturn}% return, ${input.splDist}% paid out each year and marginal rates of ${input.splHigh}% and ${input.splLow}%, the household has ${money(plan.loan.after)} after tax at year ${N}, ${sign(plan.diff)} investing in your own name. Putting ${money(plan.inTfsa)} into your spouse’s TFSA first gives ${money(plan.mix)}. A gift invested outside a TFSA does not move the tax: its income and gains are attributed back to you. The loan breaks even at a prescribed rate of about ${pct(be,2)}. Returns are assumptions, not forecasts.`,
  charts:[
    {id:'spouse-loan-rate',type:'line',evidence:'Official published rates',title:'CRA’s prescribed rate for each quarter and the treasury bill yield it follows, 2021 Q4 to 2026 Q4',unit:'percent',xLabel:'Calendar quarter',xTicks:[0,5,9,13,17,20].map(k=>({value:k,label:prescribedQuarters[k][0]})),series:[{name:'CRA prescribed rate for the quarter',rows:prescribedQuarters.map((q,k)=>({x:k,value:q[1]/100}))},{name:'3-month treasury bill yield, first month of the previous quarter',dash:true,rows:prescribedQuarters.map((q,k)=>({x:k,value:q[2]/100}))}],source:'https://www.canada.ca/en/revenue-agency/services/tax/prescribed-interest-rates.html',sourceLabel:'Canada Revenue Agency · Prescribed interest rates; Bank of Canada Valet series V122531',note:'The regulation sets each quarter’s rate from the average 3-month treasury bill yield at auctions in the first month of the previous quarter, rounded up to the next whole percent. The dashed line is the Bank of Canada’s monthly series for that month, a close but not identical measure: rounding it up matches CRA’s rate in 19 of the 21 quarters, but for the second quarters of 2024 and 2025 it gives one point less than CRA set (4.94% against 6%, and 2.89% against 4%), because the regulation averages that month’s auctions rather than taking one reading. The rate was 1% in late 2021 and the first half of 2022, peaked at 6% in the first half of 2024 and has been 3% since July 2025, including the fourth quarter of 2026. A loan keeps the rate in effect on the day it is made.'},
    {id:'spouse-loan-bars',type:'bar',evidence:'Hypothetical scenario',title:`Household value after tax at year ${N}, by how the money is invested`,unit:'money',rows:[{label:'Your own name (same as a gift outside a TFSA)',value:plan.own.after},{label:`Whole amount lent at ${input.splRate}%`,value:plan.loan.after},{label:`${money(plan.inTfsa)} to the spouse’s TFSA, the rest lent`,value:plan.mix},{label:'Whole amount in a TFSA (if the room existed)',value:input.splAmount*(1+input.splReturn/100)**N}],note:`Each bar is the household total after selling everything at year ${N} and paying the tax that sale triggers. For the loan, it adds your spouse’s holding to a second holding in your name built from the after-tax interest you receive. The last bar is a reference only: it would need ${money(input.splAmount)} of TFSA room. Money moved into a spouse’s TFSA is not attributed back as long as it does not create an excess TFSA amount.`},
    {id:'spouse-loan-years',type:'line',evidence:'Hypothetical scenario',title:'Loan minus own name, household after tax, by year and by the rate locked in',unit:'money',xLabel:'Years after the loan',series:rates.map(p=>({name:`Loan at ${p}%`,dash:p!==input.splRate&&p!==3,rows:spouseLoanPlan(input,{splRate:p}).loan.rows.map((row,k)=>({x:row.x,value:row.value-ownRows[k].after}))})),note:`Above zero, the loan left the household with more after tax by that year than investing in your own name. The rate is fixed for the life of the loan, so a loan made at 1% in 2021 or early 2022 still costs 1%, while one made in early 2024 locked in 6%. At your inputs the loan breaks even at about ${pct(be,2)}. The interest costs the household the gap between your two tax rates each year, so it pays only when the fund’s income and growth taxed at the lower rate save more than that.`},
    {id:'spouse-loan-grid',type:'heatmap',signed:true,evidence:'Hypothetical two-input sensitivity',title:`Loan minus own name after tax at year ${N}, by your spouse’s tax rate and the prescribed rate`,unit:'money',rowLabel:'Spouse’s marginal rate',columns:cols.map(c=>`${c}% loan`),rows:lows.map(l=>({label:`${l}%`,values:cols.map(c=>spouseLoanPlan(input,{splLow:l,splRate:c}).diff)})),note:`Each cell keeps your other inputs at ${input.splHigh}% for you and changes your spouse’s rate and the prescribed rate. The wider the gap in tax rates and the lower the rate, the more the loan saves; where the rates are close, the interest you report can cost more than it saves. Results also depend on the fund’s return and payout, which are not known in advance.`}
  ]};
}
