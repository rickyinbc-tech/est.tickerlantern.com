export const wealthChoiceDefinitions = {
  employerRisk:{title:'Stress employer shares and take-home income together',fields:[
    ['cash','Starting accessible cash (CAD)',12000,0,100000,1000],['shares','Vested, saleable employer shares before the shock (CAD)',60000,0,500000,5000],
    ['otherAssets','Other financial investments kept outside this cash ledger (CAD)',140000,0,2000000,10000],['shareFall','Immediate employer-share price fall (%)',40,0,100,5],
    ['essentials','Essential monthly cash bills (CAD)',4000,500,15000,250],['normalIncome','Normal monthly take-home income after work resumes (CAD)',6000,0,20000,500],
    ['replacement','Monthly net cash receipts during the interruption (CAD)',1000,0,15000,250],['interruptionMonths','Months of interrupted earnings from month one',6,0,12,1],
    ['netSalePct','Gross post-shock share value usable as net sale cash (%)',90,0,100,5]
  ]},
  purchaseFinance:{title:'Compare one purchase, one starting balance and one monthly budget',fields:[
    ['price','Full purchase price including applicable sales tax (CAD)',10000,500,100000,500],['discount','Discount available only for paying now (%)',3,0,20,.5],
    ['fee','Financing setup fee paid from cash immediately (CAD)',150,0,5000,50],['apr','Nominal annual loan interest assumption (%)',5,0,30,.5],
    ['financeMonths','Number of monthly loan payments',24,3,60,1],['cash','Starting accessible cash (CAD)',15000,0,250000,1000],
    ['budget','Monthly amount available after ordinary expenses (CAD)',500,0,5000,50],['cashRate','Effective annual interest on positive cash (%)',3,0,8,.5],
    ['reserve','Selected cash floor to retain (CAD)',5000,0,100000,500]
  ]}
};
const monthlyRate = annual => Math.expm1(Math.log1p(annual/100)/12);
export function employerCash(input,sell=false) {
  const shareValue=input.shares*(1-input.shareFall/100),saleCash=sell?shareValue*input.netSalePct/100:0;
  let cash=input.cash+saleCash,unfunded=0,paid=0,income=0;
  const rows=[{x:0,value:cash,before:cash}];
  for(let month=1;month<=12;month++) {
    const funded=Math.min(cash,input.essentials),gap=input.essentials-funded;
    cash-=funded;paid+=funded;unfunded+=gap;
    const before=cash,receipt=month<=input.interruptionMonths?input.replacement:input.normalIncome;
    cash+=receipt;income+=receipt;rows.push({x:month,value:cash,before,gap,receipt});
  }
  return {rows,shareValue,saleCash,cash,unfunded,paid,income};
}
export function purchasePath(input,financed=false) {
  const rate=input.apr/1200,n=input.financeMonths;
  const payment=rate===0?input.price/n:input.price*rate/(-Math.expm1(-n*Math.log1p(rate)));
  let debt=financed?input.price:0,cash=input.cash-(financed?input.fee:input.price*(1-input.discount/100));
  let minCash=cash,interest=0,cashInterest=0,paid=0;
  const rows=[{x:0,value:cash,debt,before:cash}];
  for(let month=1;month<=n;month++) {
    const charge=debt*rate,due=debt+charge;
    const actual=financed?Math.min(due,month===n?due:payment):0;
    debt=Math.max(0,due-actual);interest+=charge;paid+=actual;
    const earned=Math.max(0,cash)*monthlyRate(input.cashRate);cash+=earned;cashInterest+=earned;
    cash-=actual;const before=cash;minCash=Math.min(minCash,before);
    cash+=input.budget;rows.push({x:month,value:cash,debt,before,payment:actual});
  }
  return {rows,cash,debt,payment:financed?payment:0,interest,cashInterest,paid,minCash,fundingGap:Math.max(0,-minCash),reserveGap:Math.max(0,input.reserve-minCash)};
}
export function wealthChoiceResult(kind,input) {
  if(kind==='employerRisk') {
    const hold=employerCash(input),sell=employerCash(input,true);
    return {metrics:[['Immediate loss on employer shares',input.shares-hold.shareValue,'money'],['Unfunded bills while keeping the shares',hold.unfunded,'money'],['Unfunded bills after the assumed net-cash sale',sell.unfunded,'money']],note:'Hypothetical joint stress, not a prediction of a company’s shares, employment or benefit eligibility. The employer-share shock occurs immediately before month one; other investment values stay fixed as a control. Both paths receive the same household income schedule and essential bills over twelve months. The hold path sells nothing. The sale path assumes all entered shares are vested, saleable and sold immediately after the shock; only the independently entered usable percentage of gross value enters cash. The remainder is excluded from spending, without calculating tax, gains, withholding or fees. Any real tax shortfall must be funded separately. Unvested awards, options, blackout restrictions and future awards are outside this model. Bills arrive at the start of each month; net income arrives at month-end. Bills can use only accessible cash then available. Unfunded amounts remain recorded separately, without automatic debt or retroactive payment from later income. Cash earns no interest. The comparison neither sells other investments nor values the long-term benefits of continuing to hold shares.',charts:[
      {id:'employer-assets-shock',type:'stackbar',title:'A single-company loss changes one part of the balance sheet',unit:'money',seriesNames:['Accessible cash','Employer shares','Other financial investments'],rows:[{label:'Before the joint stress',values:[input.cash,input.shares,input.otherAssets]},{label:'After the share-price shock, before any sale',values:[input.cash,hold.shareValue,input.otherAssets]}],note:'Other assets are deliberately held unchanged to isolate the employer-share loss. They could also fall in a real downturn. This is a financial-asset view, excluding property, debts and any capital value assigned to future wages.'},
      {id:'employer-cash-runway',type:'line',title:'Follow cash after each bill, before that month’s income arrives',unit:'money',xLabel:'Months from the joint stress',series:[{name:'Keep employer shares',rows:hold.rows.map(r=>({x:r.x,value:r.before}))},{name:'Assume an immediate net-cash sale',rows:sell.rows.map(r=>({x:r.x,value:r.before})),dash:true}],note:'Month zero includes any assumed sale cash. Later points show cash after the bill but before month-end income. Zero cash can coexist with unpaid bills, which are retained in the separate funding metric and next chart. Month-end balances can be higher and do not erase earlier gaps.'},
      {id:'employer-bills-funding',type:'stackbar',title:'Available cash and unpaid bills tell different stories',unit:'money',seriesNames:['Bills paid on time','Bills without cash funding at their due dates'],rows:[{label:'Keep employer shares',values:[hold.paid,hold.unfunded]},{label:'Assumed net-cash sale',values:[sell.paid,sell.unfunded]}],note:'Both bars total twelve times monthly essential bills. An unpaid amount is a financing problem requiring a separate solution. It is not forgiven, funded with automatic credit or counted as a negative savings account.'},
      {id:'employer-joint-stress',type:'heatmap',title:'Unfunded bills after the assumed sale under combined stresses',unit:'money',columns:['0 months','3 months','6 months','12 months'],rows:[0,20,40,80].map(shareFall=>({label:shareFall+'% share fall',values:[0,3,6,12].map(interruptionMonths=>employerCash({...input,shareFall,interruptionMonths},true).unfunded)})),note:'Rows replace the immediate share-price loss; columns replace the income-interruption duration. The net usable sale percentage, starting cash, income amounts and expenses remain selected. Both stresses occur in the same case but have no assigned relationship or probability. Even zero interrupted months requires opening cash for the first bill before normal month-end pay.'}
    ]};
  }
  if(kind==='purchaseFinance') {
    const cash=purchasePath(input),loan=purchasePath(input,true),feasible=cash.fundingGap===0&&loan.fundingGap===0;
    return {metrics:[['Required monthly loan payment',loan.payment,'money'],['Extra purchase outlay from financing, before cash interest',input.price*input.discount/100+input.fee+loan.interest,'money'],['Financed minus cash ending position',feasible?loan.cash-cash.cash:null,'money',feasible?undefined:'Funding needed; compare only after fixing the cash gaps']],note:'Hypothetical fixed-rate purchase loan and cash purchase of the same item, compared through the final payment. Both begin with identical cash and receive the same monthly budget after ordinary living expenses. Paying now uses the discounted full price; financing borrows the full undiscounted price and pays the setup fee from cash immediately. Interest on the loan is nominal annual rate ÷ 12, followed by a capped monthly payment; the final payment clears the balance. Positive opening cash earns an effective annual cash return converted monthly. Loan payments occur before the month-end budget arrives. Both that intermediate position and month-end positions are checked. A negative position is an unmet cash-funding requirement, not an approved overdraft or a savings account. Negative positions earn no interest and incur no modeled borrowing cost; any case with a negative position must be funded before interpreting an economic comparison. The reserve floor is selected, not a recommendation. No missed-payment penalty, add-on insurance, tax on savings interest, balloon, deferred interest or change in purchase value is modeled.',charts:[
      {id:'purchase-cash-calendar',type:'line',title:'Check the cash position before the monthly budget arrives',unit:'money',xLabel:'Months from purchase',series:[{name:'Pay now: before budget arrives',rows:cash.rows.map(r=>({x:r.x,value:r.before}))},{name:'Finance: before budget arrives',rows:loan.rows.map(r=>({x:r.x,value:r.before})),dash:true},{name:'Selected reserve floor',rows:[{x:0,value:input.reserve},{x:input.financeMonths,value:input.reserve}]}],note:'Month zero includes the purchase or cash-paid financing fee. A negative point exposes funding that the monthly budget has not yet supplied. The full month-end ledger is distinct from this payment-date view. Borrowing keeps more cash initially while creating required future payments.'},
      {id:'purchase-debt-path',type:'line',title:'Retained cash has a matching loan obligation',unit:'money',xLabel:'Months from purchase',series:[{name:'Debt after each payment',rows:loan.rows.map(r=>({x:r.x,value:r.debt}))},{name:'Pay-now purchase debt',rows:[{x:0,value:0},{x:input.financeMonths,value:0}],dash:true}],note:'The loan begins at the undiscounted full price. Its fee is paid from cash rather than financed. Identical ownership of the purchased item is omitted from both cash comparisons; no resale or depreciation estimate is needed to compare these two payment methods.'},
      {id:'purchase-cost-premium',type:'waterfall',title:'A financing rate does not capture the cash discount you give up',unit:'money',rows:[{label:'Cash discount forgone',value:input.price*input.discount/100},{label:'Setup fee paid from cash',value:input.fee},{label:'Interest over the full loan term',value:loan.interest}],totalLabel:'Extra purchase outlay from financing',note:'The discounted purchase price is the baseline. This nominal premium excludes interest earned on retained cash and ignores payment timing. Even a zero-interest loan can have a positive premium when a discount or fee applies. The entered nominal loan rate is not an all-in statutory APR disclosure.'},
      {id:'purchase-reserve-stress',type:'heatmap',title:'Financing: the additional starting cash needed to retain your floor',unit:'money',columns:['$100/mo','$300/mo','$500/mo','$1,000/mo'],rows:[0,5,10,20].map(apr=>({label:apr+'% loan rate',values:[100,300,500,1000].map(budget=>purchasePath({...input,apr,budget},true).reserveGap)})),note:'Rows replace the nominal loan rate and columns replace the available monthly budget. Selected price, fee, term, starting cash, cash interest and reserve floor remain fixed. Cells show the largest reserve-floor gap over all modeled payment dates, not a forecast of default. They are a conservative cash top-up measure; interest earned on an actual top-up would require rerunning the ledger with higher starting cash.'}
    ]};
  }
  throw Error('Unknown wealth and purchase-choice topic.');
}
