import { housingSource } from './planning-banking-housing-data.js';
export const bankingHousingDefinitions={
  savingsPromotion:{title:'Explore interest before and after a savings promotion ends',fields:[
    ['initial','Initial savings balance (CAD)',10000,0,500000,1000],['monthly','Equal month-end deposits in both accounts (CAD)',500,0,5000,100],
    ['introRate','Hypothetical introductory nominal annual rate (%)',5,0,10,.25],['introMonths','Number of introductory months, starting immediately',3,0,12,1],
    ['ongoingRate','Nominal annual rate after the introduction (%)',1.5,0,10,.25],['comparisonRate','Constant comparison nominal annual rate (%)',3,0,10,.25],
    ['horizonMonths','Comparison horizon in whole months',12,6,36,1]
  ]},
  overdraftCalendar:{title:'Explore thirty days of borrowing, transaction fees and daily interest',fields:[
    ['opening','Opening cash in the account (CAD)',500,0,10000,100],['pay','Net amount of each of two pay deposits (CAD)',2200,0,10000,100],
    ['firstSalaryDay','First pay day; second deposit arrives fifteen days later',5,1,15,1],['housing','Housing bill on day one (CAD)',1800,0,6000,100],
    ['weekly','One spending debit on each of days 7, 14, 21 and 28 (CAD)',400,0,2000,50],['other','Other bill paid on day twelve (CAD)',500,0,5000,100],
    ['apr','Hypothetical nominal annual overdraft interest (%)',21,0,35,.5],['monthlyFee','Flat fee charged on day thirty, even without overdraft (CAD)',5,0,20,1],
    ['debitFee','Pay-per-use fee for each debit that leaves a negative balance (CAD)',5,0,20,1]
  ]},
  shelterBudget:{title:'Separate official housing statistics from an editable household budget',fields:[
    ['grossAnnual','Annual before-tax household income for the ratio (CAD)',80000,6000,300000,1000],['netMonthly','Monthly net household income actually received (CAD)',5000,0,20000,100],
    ['shelter','Monthly shelter cash cost in your budget (CAD)',2000,0,10000,100],['otherNeeds','Other monthly living costs, excluding debt and saving (CAD)',2000,0,10000,100],
    ['debt','Other required monthly debt payments (CAD)',300,0,5000,50],['saving','Monthly amount assigned to other saving goals (CAD)',500,0,5000,50]
  ]}
};

export function promotionPath(input,constant=false){
  let balance=input.initial,contributions=input.initial,interest=0;
  const rows=[{x:0,balance,contributions,interest,rate:constant?input.comparisonRate:input.introMonths>0?input.introRate:input.ongoingRate}];
  for(let month=1;month<=input.horizonMonths;month++){
    const rate=constant?input.comparisonRate:month<=input.introMonths?input.introRate:input.ongoingRate;
    const earned=balance*rate/1200;interest+=earned;balance+=earned+input.monthly;contributions+=input.monthly;
    rows.push({x:month,balance,contributions,interest,rate});
  }
  return {rows,balance,contributions,interest};
}

export function overdraftPath(input,perUse=false){
  let balance=input.opening,fees=0,interest=0,chargedDebits=0,negativeDays=0,peak=0;
  const rows=[{x:0,balance,interest:0,fees:0,deposit:0,debits:0}];
  for(let day=1;day<=30;day++){
    const deposit=day===input.firstSalaryDay||day===input.firstSalaryDay+15?input.pay:0;
    balance+=deposit;
    const debits=[...(day===1?[input.housing]:[]),...([7,14,21,28].includes(day)?[input.weekly]:[]),...(day===12?[input.other]:[])];
    for(const amount of debits){
      balance-=amount;
      if(perUse&&amount>0&&balance<0){balance-=input.debitFee;fees+=input.debitFee;chargedDebits++;}
    }
    if(!perUse&&day===30){balance-=input.monthlyFee;fees+=input.monthlyFee;}
    if(balance<0)negativeDays++;
    peak=Math.max(peak,-balance);
    interest+=Math.max(0,-balance)*input.apr/36500;
    if(day===30){balance-=interest;peak=Math.max(peak,-balance);}
    rows.push({x:day,balance,interest,fees,deposit,debits:debits.reduce((a,b)=>a+b,0)});
  }
  return {rows,balance,fees,interest,chargedDebits,negativeDays,peak,cost:fees+interest};
}

export function shelterCash(input){
  return {grossShare:input.shelter*12/input.grossAnnual,netShare:input.netMonthly>0?input.shelter/input.netMonthly:null,remaining:input.netMonthly-input.shelter-input.otherNeeds-input.debt-input.saving};
}
const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function bankingHousingResult(kind,input){
  if(kind==='savingsPromotion'){
    const p=promotionPath(input),c=promotionPath(input,true);
    return {metrics:[['Interest over the selected horizon · introductory account',p.interest,'money'],['Interest over the same horizon · constant-rate account',c.interest,'money'],['Introductory account minus constant-rate account',p.interest-c.interest,'money']],note:'Hypothetical savings accounts using nominal annual rates divided by twelve, with monthly crediting. At each month-end, interest is credited on the opening balance, then the equal deposit arrives. The introduction begins in month one and ends after the selected whole-month count; zero months means the ongoing rate applies immediately. The comparison uses its constant rate throughout. Rates apply to every modeled dollar with no cap or qualifying condition. No actual offer, daily accrual, transfer gap, fee, withdrawal, tax, bonus eligibility, deposit-insurance assessment or future change in the entered ongoing/comparison rate is modeled. These are nominal rate assumptions, not effective annual yields. All interest is retained and compounds.',charts:[
      {id:'savings-promo-rate-calendar',type:'line',title:'Annualized rates applied in each modeled month',unit:'percent',unitLabel:'Nominal annual rate applied for that month (%)',xMin:1,xLabel:'Interest-crediting month',series:[{name:'Introductory then ongoing rate',rows:p.rows.slice(1).map(r=>({x:r.x,value:r.rate/100})),step:true},{name:'Constant comparison rate',rows:c.rows.slice(1).map(r=>({x:r.x,value:r.rate/100})),dash:true}],note:'Each point identifies the rate used for that whole month. The higher opening rate is not earned for an entire year unless the selected introductory period actually lasts twelve months. Monthly earned interest uses rate divided by twelve.'},
      {id:'savings-promo-interest-path',type:'line',title:'Cumulative interest separates account earnings from your own deposits',unit:'money',xLabel:'Months after the initial deposit',series:[series('Introductory account · interest only',p.rows,'interest'),series('Constant account · interest only',c.rows,'interest',{dash:true})],note:'Both accounts receive identical principal and month-end contributions. These curves exclude all deposits. An early interest lead can disappear after the rate switches; there is no automatic account switch or repeat promotion.'},
      {id:'savings-promo-ending-balances',type:'stackbar',title:'Ending savings contain contributions as well as interest',unit:'money',seriesNames:['Initial balance plus new deposits','Interest retained'],rows:[{label:'Introductory then ongoing account',values:[p.contributions,p.interest]},{label:'Constant comparison account',values:[c.contributions,c.interest]}],note:'The principal contribution total is identical. Adding the annualized headline rate times the entire ending balance would count money before it was deposited and apply the introductory rate outside its selected period.'},
      {id:'savings-promo-rate-matrix',type:'heatmap',title:'Interest advantage across introductory durations and later rates',unit:'money',signed:true,columns:['0% later','1%','2%','3%'],rows:[0,3,6,12].map(introMonths=>({label:introMonths+' intro mo',values:[0,1,2,3].map(ongoingRate=>promotionPath({...input,introMonths,ongoingRate}).interest-c.interest)})),note:'Rows replace introductory duration and columns replace the later nominal rate. Initial balance, deposits, introductory rate, comparison rate and total horizon stay selected. If a duration exceeds the horizon, only months inside the horizon count. Signed cells show introductory-account interest minus constant-account interest, without probabilities or product recommendations.'}
    ]};
  }
  if(kind==='overdraftCalendar'){
    const fixed=overdraftPath(input),use=overdraftPath(input,true);
    return {metrics:[['Flat-fee arrangement · fees plus interest',fixed.cost,'money'],['Per-debit arrangement · fees plus interest',use.cost,'money'],['Per-debit arrangement · fee-triggering debits',use.chargedDebits,'integer']],note:'Hypothetical thirty-day account ledger. Two net pay deposits arrive on the selected first day and fifteen days later; deposits precede all debits on the same day. Separate spending debits occur on the fixed days in the input labels. A zero-dollar debit never triggers a fee. The flat arrangement charges its monthly fee on day 30 even if overdraft was never used. The per-use arrangement charges after every positive debit leaving a negative balance, including a debit that increases an existing overdraft. Fees reduce the account immediately. Daily simple interest is end-of-day debt after transactions and fees times nominal annual rate divided by 365; accrued interest is debited once at the end of day 30. No daily interest-on-interest occurs before that debit. All listed transactions and charges are assumed authorized and funded; the modeled peak debt is not an approved limit. No declined transaction, NSF charge, fee waiver, grace amount, linked-product transfer, actual institution tariff or next-month repayment is calculated.',charts:[
      {id:'overdraft-daily-cash',type:'line',title:'Daily account balances can turn negative despite a positive monthly surplus',unit:'money',xLabel:'Day in the hypothetical thirty-day month',series:[series('Flat monthly fee',fixed.rows,'balance'),series('Fee per qualifying debit',use.rows,'balance',{dash:true})],note:'Time zero is before any scheduled transaction. Negative account balances are borrowed money under the assumed authorized facility. The last point includes the accrued interest debit. Do not interpret it as an unused savings balance or an approved credit amount.'},
      {id:'overdraft-fee-interest-split',type:'stackbar',title:'Separate transaction or monthly fees from daily interest',unit:'money',seriesNames:['Fees debited','Interest charged after day 30'],rows:[{label:'Flat monthly arrangement',values:[fixed.fees,fixed.interest]},{label:'Per-qualifying-debit arrangement',values:[use.fees,use.interest]}],note:'The fee rules change balances and can therefore also change interest. No common-balance assumption is imposed. The flat charge remains due in this model even in a month without borrowing; a real agreement may waive or define fees differently.'},
      {id:'overdraft-peak-borrowing',type:'bar',title:'Peak debt measures the cash bridge, not the borrowing cost',unit:'money',rows:[{label:'Flat arrangement · largest negative balance',value:fixed.peak},{label:'Per-debit arrangement · largest negative balance',value:use.peak}],note:'Peak debt includes charged fees and the final interest debit where relevant. Before that last debit, end-of-day negative balances occurred on '+fixed.negativeDays+' days for the flat arrangement and '+use.negativeDays+' days for per-debit fees. Paying interest does not reduce the underlying cash requirement.'},
      {id:'overdraft-buffer-payday-matrix',type:'heatmap',title:'Per-debit arrangement charges across starting cash and first pay dates',unit:'money',columns:['Day 1','Day 5','Day 10','Day 15'],rows:[0,500,1000,1500].map(opening=>({label:'$'+opening+' start',values:[1,5,10,15].map(firstSalaryDay=>overdraftPath({...input,opening,firstSalaryDay},true).cost)})),note:'Rows replace opening cash and columns replace the first pay date; the second follows fifteen days later. Pay amounts, spending, APR and per-debit fee stay selected. Cells show one modeled month of fees plus interest, not the additional cash needed to avoid borrowing or the annual cost of the arrangement.'}
    ]};
  }
  if(kind==='shelterBudget'){
    const p=shelterCash(input),all=housingSource.rows.find(r=>r.label==='All households');
    return {metrics:[['Shelter cost divided by before-tax income',p.grossShare,'percent'],['Shelter cost divided by net income received',p.netShare,'percent',p.netShare===null?'No net income entered':undefined],['Monthly cash after the entered costs and saving',p.remaining,'money']],note:'The first two charts are fixed official Canadian Housing Survey observations for the stated cycles; the population is households in the provinces. Each tenure percentage has its own household-group denominator. The remaining charts and all headline metrics use an independent hypothetical budget. The before-tax and net income entries are separate assumptions; no payroll deduction or tax calculation reconciles them. This simple budget ratio does not reproduce the survey’s full measurement process or establish lender eligibility. Monthly cash equals net income minus shelter, other living costs, other debt payments and assigned saving. Shelter costs must include the cash expenses relevant to the household; mortgage principal is still cash leaving the budget. No regional quote, investment return, tax benefit, debt approval or official core-housing-need assessment is calculated. Negative cash is a monthly funding shortfall.',charts:[
      {id:'housing-official-four-cycles',type:'bar',title:'Households spending at least 30% of before-tax income on shelter',unit:'percent',unitLabel:'Share of all households in each survey cycle (%)',source:housingSource.url,sourceLabel:'Statistics Canada · Table 1 · published 21 September 2026',rows:housingSource.periods.map((year,i)=>({label:String(year)+' survey cycle',value:all.values[i]/100})),note:'Published observations for 2018, 2021, 2022 and 2024, provinces only. These are shares of households above a threshold, not average household spending shares. The 2020 cycle was delayed to 2021. Sparse survey cycles are shown as separate bars; no annual path is inferred. No uncertainty intervals are supplied in this release table.'},
      {id:'housing-official-tenure',type:'bar',title:'The 2024 threshold share differs across tenure groups',unit:'percent',unitLabel:'Share within each household tenure group (%)',source:housingSource.url,sourceLabel:'Statistics Canada · Canadian Housing Survey · 2024 observations',rows:['Without a mortgage','With a mortgage','Renter'].map(label=>({label:label==='Renter'?'Renters':label==='Without a mortgage'?'Owners without a mortgage':'Owners with a mortgage',value:housingSource.rows.find(r=>r.label===label).values[3]/100})),note:'Each bar uses only households in its own named group as the denominator. The three percentages do not add to 100% and are not each group’s share of all households. These descriptive estimates do not isolate the effect of tenure, explain individual circumstances or establish statistical significance.'},
      {id:'housing-monthly-cash-waterfall',type:'waterfall',title:'A household cash budget has more obligations than shelter alone',unit:'money',rows:[{label:'Monthly net income received',value:input.netMonthly},{label:'Shelter cash costs',value:-input.shelter},{label:'Other living costs',value:-input.otherNeeds},{label:'Other required debt payments',value:-input.debt},{label:'Amount assigned to saving',value:-input.saving}],totalLabel:'Monthly cash not yet assigned',note:'This authored example is unrelated to the surveyed households. Assigned saving is a cash allocation, not a consumption expense. A positive residual must still cover any omitted irregular bill; a negative residual means the entered budget requires a change or another funding source.'},
      {id:'housing-budget-cost-matrix',type:'heatmap',title:'Unassigned monthly cash across shelter and other living costs',unit:'money',signed:true,columns:['$1.5k other','$2k','$2.5k','$3k'],rows:[1500,2000,2500,3000].map(shelter=>({label:'$'+shelter/1000+'k home',values:[1500,2000,2500,3000].map(otherNeeds=>shelterCash({...input,shelter,otherNeeds}).remaining)})),note:'Rows replace shelter cash costs; columns replace other living costs. Net income, debt payments and assigned saving stay selected. The before-tax income entry does not change this cash ledger. Cells are hypothetical residual dollars, not official affordability classifications or forecasts of a local housing market.'}
    ]};
  }
  throw Error('Unknown banking-and-housing topic.');
}
