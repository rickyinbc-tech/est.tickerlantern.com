import { installmentPayment } from './planning-life-events-models.js';

export const householdStepDefinitions={
  homeCash:{title:'Explore the cash needed around a home purchase',fields:[
    ['price','Home purchase price (CAD)',700000,100000,2000000,25000],['downPercent','Requested down payment / price (%)',10,0,100,1],
    ['deposit','Deposit already paid and credited toward the price (CAD)',20000,0,200000,5000],['closingPercent','Percentage-based closing-cost allowance (%)',3,0,10,.5],
    ['fixedCosts','Additional fixed closing costs, excluding the allowance (CAD)',2000,0,50000,500],['setup','Moving and setup cash (CAD)',5000,0,50000,500],
    ['reserve','Cash to retain after closing (CAD)',10000,0,100000,1000],['cash','Cash available now, after paying the deposit (CAD)',80000,0,1000000,5000]
  ]},
  sharedBills:{title:'Compare two ways to assign shared household commitments',fields:[
    ['incomeA','Person A: monthly take-home income (CAD)',5000,0,30000,100],['incomeB','Person B: monthly take-home income (CAD)',3000,0,30000,100],
    ['personalA','Person A: separate monthly commitments (CAD)',500,0,10000,100],['personalB','Person B: separate monthly commitments (CAD)',300,0,10000,100],
    ['bills','Shared monthly bills (CAD)',4000,0,20000,100],['goalTransfer','Shared monthly savings transfer (CAD)',800,0,10000,100]
  ]},
  studentLoans:{title:'Explore repayment with an interest-free federal component',fields:[
    ['federalBalance','Canada Student Loan: opening amount owed (CAD)',20000,0,100000,1000],['otherBalance','Other education debt: opening amount owed (CAD)',10000,0,100000,1000],
    ['otherRate','Other debt: hypothetical nominal annual rate (%)',6,0,18,.5],['repayMonths','Illustrative monthly repayment periods',120,12,180,12],
    ['budget','Monthly amount available for these payments (CAD)',300,0,3000,25]
  ]}
};

// Basic price-based rule only; not a lender/insurer qualification decision.
export function basicDownPayment(price){
  const exact=price>=1500000?price*.2:price<=500000?price*.05:25000+(price-500000)*.1;
  return Math.ceil(exact*100-1e-7)/100;
}
export function homePurchaseCash(input){
  const minimum=basicDownPayment(input.price),deposit=Math.min(input.deposit,input.price);
  const down=Math.min(input.price,Math.max(minimum,input.price*input.downPercent/100,deposit));
  const closing=input.price*input.closingPercent/100,downDue=down-deposit;
  const total=down+closing+input.fixedCosts+input.setup+input.reserve,remaining=total-deposit,signedGap=remaining-input.cash;
  return {minimum,deposit,down,closing,downDue,total,remaining,signedGap,gap:Math.max(0,signedGap)};
}
export function sharedHousehold(input){
  const income=input.incomeA+input.incomeB,commitment=input.bills+input.goalTransfer;
  const rules=[{label:'Equal shares',a:commitment/2,b:commitment/2}];
  if(income>0)rules.push({label:'Income shares',a:commitment*input.incomeA/income,b:commitment*input.incomeB/income});
  return {income,commitment,rules,afterPersonal:income-input.personalA-input.personalB,unassigned:income-input.personalA-input.personalB-commitment};
}
export function educationLoanSchedule(balance,annualRate,months){
  const exact=installmentPayment(balance,annualRate,months),payment=Math.max(0,Math.ceil(exact*100-1e-7)/100);
  let outstanding=balance,interest=0,paid=0;const rows=[{x:0,value:outstanding,payment:0,interest:0}];
  for(let month=1;month<=months;month++){
    const charge=outstanding*annualRate/1200,actual=Math.min(payment,outstanding+charge);
    interest+=charge;paid+=actual;outstanding=Math.max(0,outstanding+charge-actual);if(outstanding<1e-7)outstanding=0;
    rows.push({x:month,value:outstanding,payment:actual,interest:charge});
  }
  return {payment,interest,paid,rows};
}
export function studentLoanPlan(input){
  const federal=educationLoanSchedule(input.federalBalance,0,input.repayMonths),other=educationLoanSchedule(input.otherBalance,input.otherRate,input.repayMonths);
  const payment=federal.payment+other.payment;
  return {federal,other,payment,gap:Math.max(0,payment-input.budget)};
}

export function householdStepResult(kind,input){
  if(kind==='homeCash'){
    const p=homePurchaseCash(input);
    return {metrics:[['Modeled down payment',p.down,'money'],['Remaining cash requirement',p.remaining,'money'],['Additional cash to arrange',p.gap,'money']],note:'Basic Canadian price-based down-payment rule reviewed 25 October 2026, combined with hypothetical cash allowances. This is an ordinary owner-occupied illustration, not mortgage approval. Modeled down payment is the greater of the requested percentage, the basic minimum and the credited deposit, capped at price. Credited deposit is capped at price and assumed fully applied without a refund. Cash available now excludes that already-paid deposit. Closing percentages are editable allowances, not calculated transfer taxes. Fixed costs must exclude items already in the percentage allowance. Reserve is retained cash, not a fee. No mortgage-insurance premium, premium tax, rebate, lender qualification, monthly affordability or financing cost is calculated; include separately confirmed cash charges once in the appropriate allowance.',charts:[
      {id:'home-minimum',type:'bar',title:'The basic minimum changes at price thresholds',unit:'money',source:'https://www.canada.ca/en/financial-consumer-agency/services/mortgages/down-payment.html',sourceLabel:'FCAC · price-based down-payment table',evidence:'Rule-based illustration · hypothetical prices',rows:[500000,700000,1000000,1499999,1500000,2000000].map(price=>({label:'Price CAD '+price.toLocaleString('en-CA'),value:basicDownPayment(price)})),note:'These are separate selected prices, not a smooth forecast. Basic minimum is 5% up to CAD 500,000; below CAD 1.5 million, add 10% of the portion above CAD 500,000. At CAD 1.5 million or more the basic minimum is 20% of the entire price. Individual requirements can be higher.'},
      {id:'home-cash-ledger',type:'waterfall',title:'Count the credited deposit once in the cash ledger',unit:'money',rows:[{label:'Modeled down payment',value:p.down},{label:'Closing-cost allowance',value:p.closing},{label:'Additional fixed closing costs',value:input.fixedCosts},{label:'Moving and setup',value:input.setup},{label:'Cash retained after closing',value:input.reserve},{label:'Deposit already credited',value:-p.deposit},{label:'Cash available after deposit',value:-input.cash}],totalLabel:'Cash still to arrange / excess',note:'A positive endpoint is additional cash to arrange. A negative endpoint is cash above the entered requirement. The reserve is deliberately included as a funding requirement even though it remains your asset. The model does not establish when each closing charge is payable.'},
      {id:'home-remaining',type:'bar',title:'What the remaining cash requirement needs to cover',unit:'money',rows:[{label:'Down payment still due',value:p.downDue},{label:'Closing-cost allowance',value:p.closing},{label:'Additional fixed closing costs',value:input.fixedCosts},{label:'Moving and setup',value:input.setup},{label:'Retained cash reserve',value:input.reserve}],note:'The deposit has already reduced the down-payment line. These bars sum to the remaining cash requirement before subtracting cash available now. A quoted charge belongs either in the percentage allowance or in fixed costs, never both.'},
      {id:'home-cash-matrix',type:'heatmap',title:'Additional cash across price and requested down-payment choices',unit:'money',columns:['−10%','Selected','+10%','+20%'],rows:[5,10,15,20].map(downPercent=>({label:downPercent+'% down',values:[.9,1,1.1,1.2].map(scale=>homePurchaseCash({...input,price:input.price*scale,downPercent}).gap)})),note:'Columns scale the selected purchase price; rows replace the requested down-payment percentage. The basic minimum and deposit floor still apply. The closing allowance scales with price; credited deposit, fixed costs, setup, reserve and available cash stay selected. Zero shortfall does not establish mortgage eligibility or monthly affordability.'}
    ]};
  }
  if(kind==='sharedBills'){
    const p=sharedHousehold(input);
    return {metrics:[['Shared monthly commitment',p.commitment,'money'],['Income after separate commitments',p.afterPersonal,'money'],['Unassigned cash / unmet household need',p.unassigned,'money']],note:'Hypothetical monthly household budget in CAD. Two rules assign the same bills plus savings transfer: equal halves, or shares of combined take-home income before separate commitments. Personal commitments are deducted only in the household cash ledger, not when determining income weights. When both incomes are zero, income shares are undefined and that comparison is omitted; the equal assignment remains visible as unfunded. A negative household remainder is an unmet need, not borrowing approval. Savings transfers remain assets but are committed for this cash budget. No rule is ranked as universally fair. No ownership, account structure, income-tax treatment, benefit entitlement or legal responsibility is determined.',charts:[
      {id:'shared-assignments',type:'groupbar',title:'The same shared total can produce different assignments',unit:'money',seriesNames:['Person A','Person B'],rows:p.rules.map(r=>({label:r.label,values:[r.a,r.b]})),note:'Each rule assigns the full shared bills plus shared savings transfer. Income shares use A income divided by combined income, and the corresponding B share. If combined income is zero, no income percentage is invented. Assigned amounts do not establish that either person can afford them.'},
      {id:'shared-cash-ledger',type:'waterfall',title:'Changing the split does not change household resources',unit:'money',rows:[{label:'Person A take-home income',value:input.incomeA},{label:'Person B take-home income',value:input.incomeB},{label:'Person A separate commitments',value:-input.personalA},{label:'Person B separate commitments',value:-input.personalB},{label:'Shared bills',value:-input.bills},{label:'Shared savings transfer',value:-input.goalTransfer}],totalLabel:'Unassigned cash / unmet need',note:'Positive endpoint is income left after all entered commitments; negative is an unfunded requirement. This household total is identical under either assignment rule. An individual shortage may still exist when the household total is positive.'},
      {id:'shared-income-check',type:'groupbar',title:'Compare assigned shared amounts with each person’s income',unit:'money',seriesNames:['Take-home income','Assigned shared amount'],rows:p.rules.flatMap(r=>[{label:'A · '+r.label,values:[input.incomeA,r.a]},{label:'B · '+r.label,values:[input.incomeB,r.b]}]),note:'Income bars are before each person’s separate commitments. Subtract those commitments as well when checking personal affordability. A shared assignment above the income bar is visibly unfunded even before separate costs. These are amounts, not percentages with a zero-income denominator.'},
      {id:'shared-split-matrix',type:'heatmap',signed:true,title:'How much more or less A is assigned than an equal half',unit:'money',columns:['$2k','$4k','$6k','$8k'],rows:[.5,1,1.25,1.5].map(scale=>({label:(scale*100)+'% total',values:[2000,4000,6000,8000].map(incomeA=>{const total=p.commitment*scale;return total*incomeA/(incomeA+input.incomeB)-total/2;})})),note:'Columns replace A’s monthly take-home income; B’s income stays selected. Rows scale the entire selected shared commitment. Positive cells assign A more than half under income shares; negative cells assign less. Separate commitments stay outside the weighting formula. These are allocation differences, not savings or a measure of fairness.'}
    ]};
  }
  if(kind==='studentLoans'){
    const p=studentLoanPlan(input);
    return {metrics:[['Combined scheduled monthly payment',p.payment,'money'],['Monthly budget shortfall',p.gap,'money'],['New modeled interest on other debt',p.other.interest,'money']],note:'Repayment starts now, after any non-repayment period. Canada Student Loan future interest is held at 0% under the rule reviewed 25 October 2026. Other education debt uses the selected hypothetical constant nominal annual rate divided by 12; it is not a provincial or lender rate quote. Each balance is amortized over the selected illustrative term, with interest before month-end payments. Separate scheduled payments are rounded up to cents and final payments capped at amounts owed. Budget is a comparison only and does not change the payment schedule. Enter current amounts owed, including any earlier accrued amounts still payable. No repayment assistance, forgiveness, tax credit, daily-interest convention, rate change, missed payment or contractual allocation across integrated loan portions is calculated.',charts:[
      {id:'student-repayment-cost',type:'stackbar',title:'An interest-free balance still has an amount to repay',unit:'money',seriesNames:['Opening amount owed','New modeled interest'],rows:[{label:'Canada Student Loan',values:[input.federalBalance,p.federal.interest]},{label:'Other education debt',values:[input.otherBalance,p.other.interest]}],note:'The federal component incurs no new modeled interest but its opening balance is repaid. Other debt adds interest under the hypothetical rate. Opening amounts may include earlier accrued amounts already owed; the chart does not erase those or calculate their contractual payment priority.'},
      {id:'student-monthly-payment',type:'bar',title:'Check the combined payment against the monthly budget',unit:'money',rows:[{label:'Canada Student Loan payment',value:p.federal.payment},{label:'Other education debt payment',value:p.other.payment},{label:'Combined scheduled payment',value:p.payment},{label:'Monthly budget entered',value:input.budget}],note:'The combined payment is the sum of two separately rounded scheduled amounts. The last actual payment can be smaller. Entered budget neither approves a lower payment nor changes these schedules; a shortfall identifies a cash-planning question to resolve with the relevant servicer.'},
      {id:'student-balance-path',type:'line',title:'Follow both outstanding balances through the same term',unit:'money',xLabel:'Monthly periods since repayment starts',series:[{name:'Canada Student Loan · 0% new interest',rows:p.federal.rows.map(r=>({x:r.x,value:r.value}))},{name:'Other education debt',rows:p.other.rows.map(r=>({x:r.x,value:r.value})),dash:true}],note:'Both components use the selected term but different rates and payments. The zero-rate balance falls evenly apart from the capped final payment. The interest-bearing balance repays more slowly at first relative to its own opening amount. No new borrowing or extra payment is assumed.'},
      {id:'student-payment-matrix',type:'heatmap',title:'Combined monthly payments across term and other-debt rate',unit:'money',columns:['60 mo','84 mo','120 mo','180 mo'],rows:[0,3,6,9].map(otherRate=>({label:otherRate+'%',values:[60,84,120,180].map(repayMonths=>studentLoanPlan({...input,otherRate,repayMonths}).payment)})),note:'Rows replace only the other-debt rate; columns replace the illustrative term for both balances. Canada Student Loan future interest remains zero. Longer terms lower scheduled payments but can increase total interest on interest-bearing debt. These terms and rates are scenario assumptions, not approved repayment options.'}
    ]};
  }
  throw Error('Unknown household planning topic.');
}
