export const otbComponentsDefinitions={
  otbComponents:{title:'Estimate the three parts of a 2026–27 Ontario trillium benefit and compare monthly payments with one June payment',fields:[
    ['otbRent','Rent paid in Ontario for 2025 for your principal residence (CAD)',24000,0,120000,100],
    ['otbPropTax','Property tax paid in Ontario for 2025 for your principal residence (CAD)',0,0,30000,50],
    ['otbIncome','Adjusted family net income for 2025 (CAD)',35000,0,200000,500],
    ['otbAdults','Adults in the family on 31 December 2025 (1 = single · 2 = with a spouse or common-law partner)',1,1,2,1],
    ['otbKids','Children under 19 in your sole care, or your couple’s care',0,0,8,1],
    ['otbSenior','You, or your spouse, were 64 or older on 31 December 2025 (1 = yes · 0 = no)',0,0,1,1],
    ['otbNorth','Lived in Northern Ontario on 31 December 2025 (1 = yes · 0 = no)',0,0,1,1],
    ['otbSaving','Savings interest rate on payments received before June 2027 (%)',2.5,0,8,.05]
  ]}
};
export const otbComponentsWholeKeys=['otbAdults','otbKids','otbSenior','otbNorth'];

// CRA, 2026 OEPTC calculation sheets (page details 2026-07-30), 2026 NOEC calculation sheets, and the CRA Province of
// Ontario page for the OSTC: benefit year July 2026 to June 2027, based on the 2025 return. "Family" covers a spouse or
// common-law partner, or a single person with the sole care of a child. Shared-care sheets split the amounts and are
// not modelled. Senior means 64 or older on 31 December 2025 (either spouse for couples).
export const otbParameters={benefitYear:'July 2026 to June 2027',incomeYear:2025,
  oeptc:{rentShare:.2,energyMax:290,propertyRate:.1,reduction:.02,
    nonSenior:{base:73,cap:944,threshold:{single:29047,family:36309}},
    senior:{base:617,cap:581,threshold:{single:36309,family:43571}}},
  noec:{reduction:.01,single:{max:189,threshold:50833},family:{max:290,threshold:65356}},
  ostc:{perPerson:378,reduction:.04,threshold:{single:29047,family:36309}},
  payment:{none:2,minimum:10,lumpSum:500}
};
// Ontario.ca, Ontario Trillium Benefit (updated 27 April 2026): published maximum annual amounts for the 2026 benefit year.
export const otbMaximums=[
  ['OEPTC · age 64 or older',1488],['OEPTC · under age 64',1307],['OSTC · each adult and child',378],
  ['NOEC · family',290],['OEPTC · on a reserve or in a public long-term care home',290],['NOEC · single person',189],['OEPTC · student residence only',25]
];

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const cents=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
const pos=x=>Math.max(0,x);

// OEPTC before the income reduction: occupancy cost is 20% of rent plus property tax. Energy component is the
// occupancy cost up to CAD 290. Property tax component is a base amount plus 10% of occupancy cost (capped), and never
// more than the occupancy cost itself. Reserve energy costs, long-term care and student residences are not modelled.
export function oeptcGross(rent,propTax,senior){
  const P=otbParameters.oeptc,s=senior?P.senior:P.nonSenior,occ=rent*P.rentShare+propTax;
  const energy=Math.min(occ,P.energyMax),property=Math.min(occ,s.base+Math.min(occ*P.propertyRate,s.cap));
  return {occ,energy,property,gross:energy+property};
}
export function otbPlan(input,overrides={}){
  const i={...input,...overrides},P=otbParameters,family=i.otbAdults>1||i.otbKids>0,key=family?'family':'single';
  const o=oeptcGross(i.otbRent,i.otbPropTax,i.otbSenior>0),s=i.otbSenior>0?P.oeptc.senior:P.oeptc.nonSenior;
  const oeptc=pos(o.gross-P.oeptc.reduction*pos(i.otbIncome-s.threshold[key]));
  const persons=i.otbAdults+i.otbKids,ostcMax=P.ostc.perPerson*persons;
  const ostc=pos(ostcMax-P.ostc.reduction*pos(i.otbIncome-P.ostc.threshold[key]));
  const n=P.noec[key],paidHousing=i.otbRent+i.otbPropTax>0;
  const noec=i.otbNorth>0&&paidHousing?pos(n.max-P.noec.reduction*pos(i.otbIncome-n.threshold)):0;
  const raw=oeptc+ostc+noec,total=raw<=P.payment.none?0:raw<=P.payment.minimum?P.payment.minimum:raw;
  const mode=total===0?'none':total<=P.payment.lumpSum?'lump':'monthly';
  // Receipts July 2026 (month 0) to June 2027 (month 11). Monthly: one twelfth on each 10th; a total of CAD 500 or less
  // is one July payment; the June option pays the full year on 10 June 2027. Earlier receipts earn the savings rate
  // (monthly-equivalent) until 10 June 2027, so the difference is the interest given up by waiting.
  const g=Math.pow(1+i.otbSaving/100,1/12)-1,monthly=mode==='monthly'?total/12:0;
  const receipts=Array.from({length:12},(_,m)=>mode==='monthly'?monthly:(mode==='lump'&&m===0?total:0));
  const atJune=receipts.reduce((a,r,m)=>a+r*Math.pow(1+g,11-m),0);
  let cm=0;const cumMonthly=receipts.map((r,m)=>({x:m,value:(cm+=r)})),cumJune=receipts.map((_,m)=>({x:m,value:mode==='monthly'&&m===11?total:mode==='monthly'?0:cumMonthly[m].value}));
  return {family,occ:o.occ,energy:o.energy,property:o.property,oeptcGross:o.gross,oeptc,ostc,ostcMax,noec,raw,total,mode,monthly,receipts,atJune,interestGivenUp:mode==="monthly"?pos(atJune-total):0,cumMonthly,cumJune,
    zeroIncome:{oeptc:s.threshold[key]+o.gross/P.oeptc.reduction,ostc:P.ostc.threshold[key]+ostcMax/P.ostc.reduction}};
}

export function otbComponentsResult(kind,input){
  if(kind!=='otbComponents')throw Error('Unknown OTB topic');
  const p=otbPlan(input),P=otbParameters,months=['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
  const incomes=Array.from({length:41},(_,k)=>k*2500),rents=Array.from({length:31},(_,k)=>k*2000);
  const byIncome=incomes.map(x=>({x,p:otbPlan(input,{otbIncome:x})}));
  const series=[{name:'OEPTC',rows:byIncome.map(r=>({x:r.x,value:r.p.oeptc}))},{name:'OSTC',rows:byIncome.map(r=>({x:r.x,value:r.p.ostc}))}];
  if(input.otbNorth>0)series.push({name:'NOEC',rows:byIncome.map(r=>({x:r.x,value:r.p.noec}))});
  series.push({name:'Total Ontario trillium benefit',dash:true,rows:byIncome.map(r=>({x:r.x,value:r.p.total}))});
  const who=`${p.family?'family':'single person with no children'}${input.otbSenior>0?', 64 or older':', under 64'}`;
  const payLine=p.mode==='monthly'?`${cents(p.monthly)} a month from 10 July 2026, or ${cents(p.total)} on 10 June 2027 if that option was chosen on the 2025 return`:p.mode==='lump'?`one payment of ${cents(p.total)} in July 2026, because the year’s total is CAD 500 or less`:'no payment, because the year’s total is CAD 2 or less';
  return {metrics:[['Occupancy cost: 20% of rent plus property tax',p.occ,'money'],['OEPTC after the income reduction',p.oeptc,'money'],['Ontario sales tax credit (OSTC)',p.ostc,'money'],['Northern Ontario energy credit (NOEC)',p.noec,'money'],['Annual Ontario trillium benefit, July 2026 to June 2027',p.total,'money'],['Interest given up by waiting for one June payment',p.interestGivenUp,'money']],
  note:`Estimate for a ${who}, using CRA’s 2026 calculation sheets for the benefit year ${P.benefitYear}, based on 2025 rent of ${money(input.otbRent)}, property tax of ${money(input.otbPropTax)} and adjusted family net income of ${money(input.otbIncome)}. Payment: ${payLine}. Shared custody, long-term care, reserve energy costs, student residences and the senior homeowners’ grant are not modelled. CRA determines the actual amount; check it with CRA’s calculator or your notice.`,
  charts:[
    {id:'otb-maximums',type:'bar',evidence:'Official program amounts',title:'Maximum annual amounts, 2026 benefit year (July 2026 to June 2027)',unit:'money',unitLabel:'CAD a year · before income reductions',rows:otbMaximums.map(([label,value])=>({label,value})),source:'https://www.ontario.ca/page/ontario-trillium-benefit',sourceLabel:'Government of Ontario · Ontario Trillium Benefit',note:'Ontario lists these maximums for the 2026 benefit year, based on the 2025 return (page updated 27 April 2026). The OEPTC maximum needs a large occupancy cost: CAD 9,440 under age 64, CAD 5,810 at 64 or older. The OSTC maximum applies to each adult and each child, so a family of four can receive up to CAD 1,512 before the income reduction.'},
    {id:'otb-income',type:'line',title:`Annual benefit by adjusted family net income, with your housing costs held fixed`,unit:'money',xLabel:'Adjusted family net income for 2025 (CAD)',series,note:`The OEPTC falls by 2% of income above ${money(input.otbSenior>0?P.oeptc.senior.threshold[p.family?'family':'single']:P.oeptc.nonSenior.threshold[p.family?'family':'single'])} and reaches zero near ${money(p.zeroIncome.oeptc)}. The OSTC falls by 4% above ${money(P.ostc.threshold[p.family?'family':'single'])} and reaches zero near ${money(p.zeroIncome.ostc)}. Where both are falling, each extra CAD 1,000 of income costs CAD 60 of benefit, before income tax. The NOEC, if you qualify, falls by 1% only above its higher thresholds of CAD 50,833 (single) and CAD 65,356 (family), so it is often the last part left.`},
    {id:'otb-rent',type:'line',title:'OEPTC before the income reduction, by annual rent: under 64 and 64 or older',unit:'money',xLabel:'Rent paid for 2025 (CAD a year) · no property tax',series:[{name:'Under 64 on 31 December 2025',rows:rents.map(x=>({x,value:oeptcGross(x,0,false).gross}))},{name:'64 or older on 31 December 2025',rows:rents.map(x=>({x,value:oeptcGross(x,0,true).gross}))}],note:'Only 20% of rent counts as occupancy cost, while property tax counts in full, so CAD 10,000 of rent counts the same as CAD 2,000 of property tax. The senior sheets start the property tax component at CAD 617 instead of CAD 73, which is why the 64-or-older line reaches its CAD 1,488 ceiling at rent of about CAD 29,050, while the under-64 line keeps rising until about CAD 47,200.'},
    {id:'otb-payment',type:'line',title:'Cumulative benefit received, July 2026 to June 2027: monthly or one June payment',unit:'money',xLabel:'Payment month',xTicks:[0,3,6,9,11].map(k=>({value:k,label:months[k]})),series:[{name:'Monthly on the 10th',rows:p.cumMonthly},{name:'One payment on 10 June 2027',dash:true,rows:p.cumJune}],note:p.mode==='monthly'?`Both paths pay ${cents(p.total)}. Monthly payments, saved at ${input.otbSaving}% until June, would be worth ${cents(p.atJune)} on 10 June 2027, so waiting gives up about ${cents(p.interestGivenUp)}. The June option is a budgeting choice, not a better rate: it only helps if a lump sum would otherwise not be saved.`:`With an annual total of ${cents(p.total)}, the benefit is paid in July as one payment and there is no monthly-or-June choice.`}
  ]};
}
