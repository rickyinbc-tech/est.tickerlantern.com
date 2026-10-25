import { mortgageMonthlyRate, mortgagePayment } from './planning-more-models.js';

export const protectionTransitionDefinitions={
  depositCover:{title:'Explore one-name deposit coverage and interest headroom',fields:[
    ['savingsA','Member A: eligible savings balance including accrued interest (CAD)',60000,0,300000,5000],
    ['otherA','Member A: all other eligible deposits in the same one-name category (CAD)',30000,0,300000,5000],
    ['memberB','Separate member B: eligible one-name deposits including interest (CAD)',50000,0,300000,5000],
    ['rate','Hypothetical effective annual interest, retained in deposits (%)',4,0,8,.5],['years','Years of retained interest to test',5,0,10,1]
  ]},
  refinanceCost:{title:'Compare refinancing over the same remaining-amortization window',fields:[
    ['balance','Existing mortgage balance before either choice (CAD)',400000,0,1500000,10000],['oldRate','Current quoted nominal annual rate (%)',6,0,12,.25],
    ['newRate','Proposed hypothetical quoted nominal annual rate (%)',4.5,0,12,.25],['amortYears','Same remaining amortization for both choices (years)',20,5,30,1],
    ['months','Months to compare before another rate decision',36,1,60,1],['breakFee','Quoted break charge entered as an assumption (CAD)',8000,0,50000,1000],
    ['closingFee','Other upfront refinance costs paid in cash (CAD)',2000,0,20000,500]
  ]},
  separationCash:{title:'Explore two separate household cash ledgers over twelve months',fields:[
    ['incomeA','Household A: monthly net income before the entered transfer (CAD)',5000,0,20000,250],['incomeB','Household B: monthly net income before the entered transfer (CAD)',3000,0,20000,250],
    ['transfer','Assumed net monthly transfer A to B; negative means B to A (CAD)',500,-3000,3000,100],
    ['oldCost','Previous single household: monthly running costs (CAD)',6000,0,20000,250],['costA','New household A: monthly running costs (CAD)',3500,0,15000,250],['costB','New household B: monthly running costs (CAD)',3000,0,15000,250],
    ['setupA','Household A: one-time transition cash outflow at time zero (CAD)',4000,0,50000,1000],['setupB','Household B: one-time transition cash outflow at time zero (CAD)',3000,0,50000,1000],
    ['cashA','Cash confirmed available to household A at time zero (CAD)',5000,0,100000,1000],['cashB','Cash confirmed available to household B at time zero (CAD)',2000,0,100000,1000]
  ]}
};
export const depositRule={limit:100000,reviewed:'2026-10-25',url:'https://www.cdic.ca/depositors/whats-covered/',oneNameUrl:'https://www.cdic.ca/depositors/whats-covered/deposits-held-in-one-name/'};
const coverage=value=>({value,covered:Math.min(value,depositRule.limit),above:Math.max(0,value-depositRule.limit)});
export function depositCoverage(input,years=input.years,rate=input.rate){
  const startA=input.savingsA+input.otherA,startB=input.memberB,growth=(1+rate/100)**years;
  const now=[{label:'Member A · accounts combined',...coverage(startA)},{label:'Separate member B',...coverage(startB)}];
  const future=[{label:'Member A · accounts combined',...coverage(startA*growth)},{label:'Separate member B',...coverage(startB*growth)}];
  const rows=Array.from({length:years*12+1},(_,month)=>({x:month/12,a:startA*(1+rate/100)**(month/12),b:startB*(1+rate/100)**(month/12)}));
  return {now,future,rows,coveredNow:now.reduce((s,r)=>s+r.covered,0),coveredFuture:future.reduce((s,r)=>s+r.covered,0),aboveFuture:future.reduce((s,r)=>s+r.above,0)};
}
export function refinanceLoan(balance,quotedRate,amortYears,months){
  const payment=mortgagePayment(balance,quotedRate,amortYears*12),r=mortgageMonthlyRate(quotedRate);
  let debt=balance,interest=0,paid=0;const rows=[{x:0,debt,interest,paid}];
  for(let month=1;month<=months;month++){
    const charge=debt*r,actual=Math.min(payment,debt+charge);interest+=charge;paid+=actual;debt=Math.max(0,debt+charge-actual);if(debt<1e-7)debt=0;
    rows.push({x:month,debt,interest,paid});
  }
  return {payment,debt,interest,paid,rows};
}
export function refinanceComparison(input){
  const current=refinanceLoan(input.balance,input.oldRate,input.amortYears,input.months),proposed=refinanceLoan(input.balance,input.newRate,input.amortYears,input.months);
  const fees=input.balance>0?input.breakFee+input.closingFee:0;
  const rows=current.rows.map((r,i)=>({x:r.x,cash:r.paid-proposed.rows[i].paid-fees,cost:r.interest-proposed.rows[i].interest-fees}));
  return {current,proposed,fees,rows,paymentRelief:current.payment-proposed.payment,cashRelief:rows.at(-1).cash,costAdvantage:rows.at(-1).cost,debtDifference:current.debt-proposed.debt};
}
export function separationBudget(input){
  let a=-input.setupA,b=-input.setupB,lowA=Math.min(0,a),lowB=Math.min(0,b);
  const rows=[{x:0,a:a+input.cashA,b:b+input.cashB,endA:a+input.cashA,endB:b+input.cashB}];
  for(let month=1;month<=12;month++){
    a-=input.costA+input.transfer;b-=input.costB-input.transfer;lowA=Math.min(lowA,a);lowB=Math.min(lowB,b);
    const beforeA=a+input.cashA,beforeB=b+input.cashB;a+=input.incomeA;b+=input.incomeB;
    rows.push({x:month,a:beforeA,b:beforeB,endA:a+input.cashA,endB:b+input.cashB});
  }
  const monthlyA=input.incomeA-input.costA-input.transfer,monthlyB=input.incomeB-input.costB+input.transfer;
  const requiredA=Math.max(0,-lowA),requiredB=Math.max(0,-lowB),extraA=Math.max(0,requiredA-input.cashA),extraB=Math.max(0,requiredB-input.cashB);
  return {rows,monthlyA,monthlyB,combinedMonthly:monthlyA+monthlyB,requiredA,requiredB,extraA,extraB,extra:extraA+extraB,endingA:rows.at(-1).endA,endingB:rows.at(-1).endB};
}

export function protectionTransitionResult(kind,input){
  if(kind==='depositCover'){
    const p=depositCoverage(input);
    return {metrics:[['Covered now under the eligibility assumptions',p.coveredNow,'money'],['Covered after the selected retained-interest period',p.coveredFuture,'money'],['Above the modeled caps after retained interest',p.aboveFuture,'money']],note:'CDIC one-name category illustration for one individual across both members, using the CAD 100,000 principal-plus-interest limit reviewed 25 October 2026. Both member labels are hypothetical, assumed to be distinct CDIC member institutions. Member A balances are aggregated in the same category; include all eligible deposits and accrued interest in that category, not only one account or brand. Eligibility, actual issuer/member identity and ownership records are not verified. All balances earn the same hypothetical constant effective annual interest, retained and compounded, with no new deposits, withdrawals, tax payments or fees. The current limit is held constant for sensitivity analysis, not forecast as future policy. Other coverage categories, trust/broker/nominee arrangements, foreign-currency valuation and provincial insurance schemes are excluded. Amounts above a modeled cap are unprotected by this assumed coverage, not a predicted loss; insurance also does not make a deposit accessible before maturity.',charts:[
      {id:'deposit-now',type:'stackbar',title:'One person’s accounts at a member share the one-name cap',unit:'money',seriesNames:['Within the assumed coverage cap','Above the assumed coverage cap'],source:depositRule.oneNameUrl,sourceLabel:'CDIC · Deposits held in one name',evidence:'Rule-based illustration · hypothetical eligible balances',rows:p.now.map(r=>({label:r.label,values:[r.covered,r.above]})),note:'Member A combines the selected savings balance and all other eligible one-name deposits there. Member B is assumed to be a genuinely separate member, not merely another branch or brand. The cap applies to eligible principal and interest together, subject to actual eligibility and records.'},
      {id:'deposit-interest-headroom',type:'line',title:'Retained interest can use up the headroom below the cap',unit:'money',xLabel:'Years of retained interest',series:[{name:'Member A · combined eligible balance',rows:p.rows.map(r=>({x:r.x,value:r.a}))},{name:'Current cap held constant in the model',rows:p.rows.map(r=>({x:r.x,value:depositRule.limit})),dash:true},{name:'Separate member B · eligible balance',rows:p.rows.map(r=>({x:r.x,value:r.b}))}],note:'The balances grow at the selected hypothetical effective annual rate with equivalent monthly observation points. All future interest remains in the same member/category. No future change in the legal limit is predicted. This chart is a coverage sensitivity, not an offered deposit yield or a maturity-liquidity plan.'},
      {id:'deposit-after-growth',type:'stackbar',title:'Apply the same cap again after the modeled interest accrues',unit:'money',seriesNames:['Within the assumed coverage cap','Above the assumed coverage cap'],rows:p.future.map(r=>({label:r.label,values:[r.covered,r.above]})),note:'These are projected balances under the assumptions, not a guarantee of future insurance treatment. A balance above the cap does not mean the excess will be lost; it means this illustration does not count that amount as covered. Confirm current rules, member identity and eligible balances when reviewing an actual deposit.'},
      {id:'deposit-rate-years',type:'heatmap',title:'Combined amounts above caps across retained interest and time',unit:'money',columns:['1 yr','3 yr','5 yr','10 yr'],rows:[0,2,4,6].map(rate=>({label:rate+'%',values:[1,3,5,10].map(years=>depositCoverage(input,years,rate).aboveFuture)})),note:'Rows replace the effective annual interest assumption; columns replace the horizon. Starting balances, the one-name classification and two distinct member assumptions stay selected. Cells sum the amounts above each member’s separate modeled cap, rather than netting unused coverage at one member against excess at another.'}
    ]};
  }
  if(kind==='refinanceCost'){
    const p=refinanceComparison(input);
    return {metrics:[['Monthly payment reduction / increase',p.paymentRelief,'money'],['Payment relief less upfront fees over the window',p.cashRelief,'money'],['Interest-cost saving less upfront fees',p.costAdvantage,'money']],note:'Hypothetical refinance with the same starting principal and remaining amortization, compared over the selected 1–60 months. Both quoted nominal annual rates are compounded semi-annually and converted to monthly rates, then held fixed for the comparison window only. Payments occur monthly and are calculated separately for each rate; intermediate amounts are unrounded and final payments capped at debt owed. Break charge and other costs are external quote assumptions, paid in cash at time zero and never financed. With zero opening debt there is no modeled refinance or fee. No extra borrowing, amortization extension, blend-and-extend, future renewal, discounting, tax deduction, investment of payment relief, borrower qualification or actual lender penalty formula is calculated. A positive cost advantage means lower modeled interest plus fees over this window, not approval or a complete lifetime recommendation.',charts:[
      {id:'refinance-payments',type:'bar',title:'A lower payment describes cash flow, not the whole saving',unit:'money',rows:[{label:'Current mortgage payment',value:p.current.payment},{label:'Proposed mortgage payment',value:p.proposed.payment}],note:'Both payments amortize the same opening principal over the same selected remaining years. The proposed balance excludes fees, which must be funded separately at the start. Rates and payments are hypothetical; actual lender schedules and eligibility can differ.'},
      {id:'refinance-financing-cost',type:'stackbar',title:'Compare interest and upfront costs within the same window',unit:'money',seriesNames:['Interest during the window','Upfront refinance costs'],rows:[{label:'Keep current mortgage',values:[p.current.interest,0]},{label:'Refinance with cash-paid costs',values:[p.proposed.interest,p.fees]}],note:'Principal repayment is excluded from borrowing cost because it reduces an outstanding liability. Both cases use the same comparison window. The cost difference is current interest minus proposed interest minus cash-paid fees; costs after the window are outside the calculation.'},
      {id:'refinance-cost-timing',type:'line',title:'Payment relief and financing-cost recovery can cross zero at different times',unit:'money',xLabel:'Monthly periods in the window',series:[{name:'Cumulative payment relief less fees',rows:p.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Cumulative interest saving less fees',rows:p.rows.map(r=>({x:r.x,value:r.cost})),dash:true}],note:'Both series begin with the cash-paid fee at time zero. Payment relief includes differences in principal repayment, while interest saving does not. Their gap is current outstanding debt minus proposed outstanding debt. Neither series discounts cash flows or assumes payment relief is invested; zero crossings apply only within this fixed-rate window.'},
      {id:'refinance-ending-debt',type:'bar',title:'Check how much principal still remains at the comparison date',unit:'money',rows:[{label:'Current mortgage remaining debt',value:p.current.debt},{label:'Proposed mortgage remaining debt',value:p.proposed.debt}],note:'These are liabilities at the end of the selected window, not extra charges to add to the interest-cost bars. Payment relief less fees plus the current-minus-proposed debt difference equals the financing-cost advantage under this no-discounting comparison. Future rates are not known or modeled.'},
      {id:'refinance-rate-fees',type:'heatmap',signed:true,title:'Net financing-cost advantage across proposed rates and cash costs',unit:'money',columns:['$0','$5k','$10k','$15k'],rows:[3,4,5,6].map(newRate=>({label:newRate+'%',values:[0,5000,10000,15000].map(fees=>refinanceComparison({...input,newRate,breakFee:fees,closingFee:0}).costAdvantage)})),note:'Rows replace the proposed quoted rate; columns replace all upfront costs combined. Starting balance, current rate, amortization and window remain selected. Positive cells mean lower modeled interest plus fees; negative cells mean higher costs. The rates are assumptions, not offers, and no lender penalty is inferred from the rate difference.'}
    ]};
  }
  if(kind==='separationCash'){
    const p=separationBudget(input);
    return {metrics:[['Household A: additional starting cash needed',p.extraA,'money'],['Household B: additional starting cash needed',p.extraB,'money'],['Combined monthly surplus / shortfall',p.combinedMonthly,'money']],note:'Hypothetical two-household cash budget, not legal advice or a division of property. Enter net income, cash ownership/access and any net transfer independently from confirmed arrangements; no support entitlement or tax treatment is calculated. Positive transfer means A pays B, negative means B pays A. Transition outflows occur at time zero. Each month the transfer is assumed received on time at the start, running costs are then paid, and net incomes arrive at month-end. The model assumes the transfer can be funded; a negative sender ledger flags an unresolved need that could affect its arrival in reality. Ledgers are separate and funds are not automatically pooled. The previous single-household cost is comparison context only. No shared-debt release, asset sale, borrowing approval, legal fee quote, benefit change, investment return or overlapping old-home costs beyond the entered lines are calculated.',charts:[
      {id:'separation-running-costs',type:'bar',title:'Compare the old running budget with the two new households',unit:'money',rows:[{label:'One household before separation',value:input.oldCost},{label:'Household A after separation',value:input.costA},{label:'Household B after separation',value:input.costB},{label:'Combined new running costs',value:input.costA+input.costB}],note:'The combined new bar equals A plus B; do not add all four bars together. A changed total is an input-based comparison, not a universal prediction about separation costs. Transition cash and the internal transfer are excluded from these running-expense amounts.'},
      {id:'separation-monthly-resources',type:'groupbar',title:'Check each household’s resources and commitments separately',unit:'money',seriesNames:['Net income plus transfer received','Running costs plus transfer paid'],rows:[{label:'Household A',values:[input.incomeA+Math.max(0,-input.transfer),input.costA+Math.max(0,input.transfer)]},{label:'Household B',values:[input.incomeB+Math.max(0,input.transfer),input.costB+Math.max(0,-input.transfer)]}],note:'These are separate household comparisons. The transfer appears as a resource to its recipient and a commitment to its payer; it cancels across the two-household total and does not create income. A positive combined surplus can still coexist with an individual deficit or earlier cash shortage.'},
      {id:'separation-early-cash',type:'line',title:'A later surplus cannot pay an earlier transition bill',unit:'money',xLabel:'Months after the transition',series:[{name:'A · after early-month cash commitments',rows:p.rows.map(r=>({x:r.x,value:r.a}))},{name:'B · after early-month cash commitments',rows:p.rows.map(r=>({x:r.x,value:r.b})),dash:true}],note:'At month zero each line is cash after its transition outflow. Later points are after the assumed transfer and running costs but before that month’s net income. The final plotted values therefore exclude the final month-end income. Negative points are individual unfunded needs; another household’s cash is not assumed accessible.'},
      {id:'separation-cost-matrix',type:'heatmap',title:'Additional allocated starting cash across two running budgets',unit:'money',columns:['$3k A','$3.5k A','$4k A','$4.5k A'],rows:[2000,2500,3000,3500].map(costB=>({label:'$'+costB/1000+'k B',values:[3000,3500,4000,4500].map(costA=>separationBudget({...input,costA,costB}).extra)})),note:'Rows replace B’s monthly costs; columns replace A’s. Incomes, the assumed signed transfer, transition outflows and separately available starting cash remain selected. Each cell sums the two individual additional starting-cash requirements; it does not pool existing funds, determine a support amount or authorize access to someone else’s assets.'}
    ]};
  }
  throw Error('Unknown protection or transition planning topic.');
}
