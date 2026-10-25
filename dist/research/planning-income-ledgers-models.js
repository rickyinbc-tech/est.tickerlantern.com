export const incomeLedgerDefinitions={
  rentalCash:{title:'Separate a one-year rental result from owner cash',fields:[
    ['rent','Rent collected for each occupied month (CAD)',3200,0,15000,100],['vacantMonths','Whole months with no rent collected',1,0,12,1],
    ['operatingMonthly','Operating cash costs paid in every month (CAD)',600,0,5000,50],['annualInterest','Independently entered annual loan interest (CAD)',10000,0,100000,500],
    ['annualPrincipal','Independently entered annual loan principal repayments (CAD)',8000,0,100000,500],['capitalCash','Separate capital-project cash paid in the year (CAD)',5000,0,100000,500],
    ['taxCash','Independently entered annual tax cash allowance (CAD)',3000,0,100000,500]
  ]},
  interestPayout:{title:'Explore annual interest payments, outside saving and compounding',fields:[
    ['principal','Opening fixed-rate certificate principal (CAD)',50000,0,500000,5000],['certificateRate','Hypothetical annual certificate rate (%)',4,0,10,.25],
    ['years','Whole years until maturity',5,1,10,1],['spentShare','Share of each annual interest payment spent (%)',50,0,100,5],
    ['outsideRate','Annual return on retained interest outside the certificate (%)',2,0,10,.25]
  ]},
  cardAllocation:{title:'Compare allocation of payments across two interest-rate buckets',fields:[
    ['balanceA','Opening balance in bucket A (CAD)',5000,0,50000,500],['rateA','Bucket A nominal annual interest (%)',18,0,36,.5],
    ['balanceB','Opening balance in bucket B (CAD)',2000,0,50000,500],['rateB','Bucket B nominal annual interest (%)',30,0,36,.5],
    ['payment','Fixed total monthly payment budget (CAD)',300,25,3000,25],['minimumPct','Illustrative minimum as % of interest-inclusive statement',3,1,5,.5]
  ]}
};

export function rentalCashYear(d){
  const rentCollected=d.rent*(12-d.vacantMonths),operating=d.operatingMonthly*12;
  const operatingLessInterest=rentCollected-operating-d.annualInterest;
  const cash=operatingLessInterest-d.annualPrincipal-d.capitalCash-d.taxCash;
  return {rentCollected,operating,operatingLessInterest,cash,ownerFunding:Math.max(0,-cash)};
}

export function interestPayoutPath(d){
  const r=d.certificateRate/100,q=d.outsideRate/100,coupon=d.principal*r;
  let outside=0,spent=0,outsideInterest=0;
  const rows=[{x:0,compound:d.principal,payoutRetained:d.principal,outside,spent:0,payoutReceipt:0,compoundReceipt:0}];
  for(let year=1;year<=d.years;year++){
    const earned=outside*q;outsideInterest+=earned;outside+=earned+coupon*(1-d.spentShare/100);spent+=coupon*d.spentShare/100;
    const compound=d.principal*(1+r)**year;
    rows.push({x:year,compound,payoutRetained:d.principal+outside,outside,spent,payoutReceipt:coupon+(year===d.years?d.principal:0),compoundReceipt:year===d.years?compound:0});
  }
  return {rows,coupon,paidInterest:coupon*d.years,spent,outsideInterest,outside,end:rows.at(-1)};
}

// Two hypothetical balance buckets with interest before month-end payment.
// The illustrative minimum is prorated identically in both paths. Only the
// allocation of payment above that amount changes. No actual agreement is read.
export function cardAllocationPath(d,method='highest',limit=120){
  let balances=[d.balanceA,d.balanceB],interestBy=[0,0],paid=0,firstMinimum=0;
  const rates=[d.rateA,d.rateB],rows=[{x:0,a:balances[0],b:balances[1],total:balances[0]+balances[1],interest:0,paid:0}];
  const result=(complete,months,blockedMonth=null)=>({rows,complete,months,blockedMonth,firstMinimum,interestBy,interest:interestBy[0]+interestBy[1],paid,remaining:balances[0]+balances[1]});
  if(balances[0]+balances[1]===0)return result(true,0);
  for(let month=1;month<=limit;month++){
    const charges=balances.map((b,i)=>b*rates[i]/1200),statement=balances.map((b,i)=>b+charges[i]),total=statement[0]+statement[1];
    const minimum=Math.min(total,Math.max(25,total*d.minimumPct/100));if(month===1)firstMinimum=minimum;
    if(d.payment+1e-8<minimum)return result(false,null,month);
    const actual=Math.min(d.payment,total),minimumPaid=Math.min(minimum,actual);
    let remaining=statement.map(b=>b*(1-minimumPaid/total)),excess=actual-minimumPaid;
    if(method==='proportional'){
      const left=remaining[0]+remaining[1];if(left>0)remaining=remaining.map(b=>b*(1-excess/left));
    }else{
      const order=rates[0]>=rates[1]?[0,1]:[1,0];
      for(const i of order){const allocated=Math.min(excess,remaining[i]);remaining[i]-=allocated;excess-=allocated;}
    }
    balances=remaining.map(b=>b<1e-7?0:Math.max(0,b));interestBy=interestBy.map((v,i)=>v+charges[i]);paid+=actual;
    rows.push({x:month,a:balances[0],b:balances[1],total:balances[0]+balances[1],interest:interestBy[0]+interestBy[1],paid});
    if(balances[0]+balances[1]===0)return result(true,month);
  }
  return result(false,null);
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function incomeLedgerResult(kind,d){
  if(kind==='rentalCash'){
    const p=rentalCashYear(d),months=Array.from({length:13},(_,occupied)=>({occupied,p:rentalCashYear({...d,vacantMonths:12-occupied})}));
    return {metrics:[['Rent actually collected in the year',p.rentCollected,'money'],['Cash after all entered payments and allowance',p.cash,'money'],['Annual owner funding gap',p.ownerFunding,'money']],note:'One invented rental-year cash ledger covering 100% of the hypothetical property’s receipts and payments, not a tax return or property valuation. Rent is collected only in occupied months; entered operating costs continue for all twelve months. Annual interest and principal are independent statement-style inputs, not a mortgage projection. Capital cash and tax allowance are additional, separate uses of cash. The operating-less-interest subtotal is not taxable income. No depreciation, deduction eligibility, arrears recovery, sale, appreciation, borrowing approval or payment-date funding is calculated.',charts:[
      {id:'rental-cash-bridge',type:'waterfall',title:'Follow collected rent through every entered cash use',unit:'money',rows:[{label:'Rent collected',value:p.rentCollected},{label:'Twelve months of operating cash costs',value:-p.operating},{label:'Annual loan interest paid',value:-d.annualInterest},{label:'Annual loan principal repaid',value:-d.annualPrincipal},{label:'Separate capital-project payment',value:-d.capitalCash},{label:'Independent tax cash allowance',value:-d.taxCash}],totalLabel:'Annual cash retained, or owner funding needed',note:'A negative endpoint is an annual funding gap. A positive endpoint does not prove that every earlier bill was funded; payment dates are outside this one-year total.'},
      {id:'rental-occupied-months',type:'line',title:'Operating subtotal and owner cash at different collection months',unit:'money',xLabel:'Whole months with rent collected',series:[{name:'Collected rent less operating costs and interest',rows:months.map(r=>({x:r.occupied,value:r.p.operatingLessInterest}))},{name:'Cash after principal, capital payment and tax allowance',dash:true,rows:months.map(r=>({x:r.occupied,value:r.p.cash}))}],note:'Only the number of rent-collection months changes. All annual payments and twelve months of operating costs stay selected. The operating subtotal is a teaching comparator, not assessed taxable rental income.'},
      {id:'rental-payment-components',type:'bar',title:'Cash uses have different economic and tax meanings',unit:'money',rows:[{label:'Operating cash costs',value:p.operating},{label:'Loan interest',value:d.annualInterest},{label:'Loan principal reduction',value:d.annualPrincipal},{label:'Capital-project cash',value:d.capitalCash},{label:'Tax cash allowance',value:d.taxCash}],note:'All bars are payments or cash earmarks in CAD. Principal reduces a liability; a capital project is kept outside operating cash costs. The chart determines neither deductions nor added market value.'},
      {id:'rental-vacancy-capital',type:'heatmap',title:'Annual owner cash across vacancy and capital-payment stresses',unit:'money',columns:['$0 capital cash','$2,500','$5,000','$10,000'],rows:[0,1,2,3].map(vacantMonths=>({label:vacantMonths+' no-rent months',values:[0,2500,5000,10000].map(capitalCash=>rentalCashYear({...d,vacantMonths,capitalCash}).cash)})),note:'Rows replace whole months without collected rent; columns replace the separate capital cash payment. Rent per occupied month, operating costs, interest, principal and the independent tax allowance stay fixed. No vacancy probabilities or tax refunds are assumed.'}
    ]};
  }
  if(kind==='interestPayout'){
    const p=interestPayoutPath(d);
    return {metrics:[['Compounding choice: resources at maturity',p.end.compound,'money'],['Annual-payout choice: resources retained at maturity',p.end.payoutRetained,'money'],['Annual-payout interest already spent',p.spent,'money']],note:'Hypothetical fixed-rate certificates with identical initial principal, annual rate and maturity. One compounds annually to maturity; the other pays simple annual interest at year-end. The payout choice spends the selected share and saves the remainder outside at a separate annual rate. Outside interest accrues before the next year-end deposit. Principal returns at maturity in both choices. All amounts are before taxes and fees; no actual issuer, deposit-insurance status, early access or guaranteed reinvestment rate is established. Spending is consumption, not investment underperformance.',charts:[
      {id:'payout-contract-receipts',type:'groupbar',title:'Cash paid by the certificate on each annual date',unit:'money',seriesNames:['Annual-payout certificate','Compounding certificate'],rows:p.rows.slice(1).map(r=>({label:'End of year '+r.x+(r.x===d.years?' · maturity':''),values:[r.payoutReceipt,r.compoundReceipt]})),note:'The maturity-year bars include return of principal. They are cash receipts, not annual yields. The compounding certificate supplies no earlier cash under this invented contract.'},
      {id:'payout-retained-path',type:'line',title:'Resources retained, with consumption kept separate',unit:'money',xLabel:'Completed certificate years',series:[series('Compounding choice: accrued resources',p.rows,'compound'),series('Payout choice: principal plus outside savings',p.rows,'payoutRetained',{dash:true})],note:'The compounding line is an accrued contract value, not an early-redemption quotation or immediately available cash. The payout line excludes interest already spent. At maturity, contract proceeds replace the corresponding contract asset; principal is not counted twice.'},
      {id:'payout-resource-bridge',type:'waterfall',title:'Reconcile the payout choice’s retained resources',unit:'money',rows:[{label:'Original principal',value:d.principal},{label:'Certificate interest paid over the term',value:p.paidInterest},{label:'Interest earned on outside savings',value:p.outsideInterest},{label:'Certificate interest used for spending',value:-p.spent}],totalLabel:'Principal plus outside savings at maturity',note:'This ledger distinguishes interest earned, spending and retained assets. Past spending is not added back to ending wealth or treated as an asset that can still fund another bill.'},
      {id:'payout-reinvestment-spending',type:'heatmap',title:'Payout resources minus compounding resources at maturity',unit:'money',columns:['0% interest spent','25%','50%','100%'],rows:[0,2,4,6].map(outsideRate=>({label:outsideRate+'% outside return',values:[0,25,50,100].map(spentShare=>{const q=interestPayoutPath({...d,outsideRate,spentShare});return q.end.payoutRetained-q.end.compound;})})),note:'Rows replace the outside reinvestment rate; columns replace consumption of each certificate interest payment. Principal, certificate rate and maturity stay selected. A negative difference can reflect both consumption and different reinvestment returns; it is not a like-for-like performance ranking.'}
    ]};
  }
  if(kind==='cardAllocation'){
    const h=cardAllocationPath(d),p=cardAllocationPath(d,'proportional');
    const stopped=[['Highest-first',h],['Proportional',p]].filter(([,q])=>q.blockedMonth).map(([name,q])=>name+' stops before cycle '+q.blockedMonth+' because the budget is below the assumed minimum.').join(' ');
    return {metrics:[['Illustrative first minimum payment',h.firstMinimum,'money'],['Highest-first: completed payoff months',h.months,'months'],['Interest saving versus proportional excess allocation',h.complete&&p.complete?p.interest-h.interest:null,'money']],note:'Two invented interest-rate buckets with no new purchases, fees, grace periods or rate changes. Interest is opening monthly balance × nominal annual rate ÷ 12 before payment. The illustrative minimum is the lower of the statement total and the higher of CAD 25 or the entered statement percentage. Its allocation is proportional in both paths. Only excess allocation changes: highest current rate first, or proportional across remaining balances. A projection stops before any cycle whose assumed minimum exceeds the payment budget, or after 120 cycles. Unfinished interest totals are partial; no payoff saving is reported. '+stopped,charts:[
      {id:'allocation-total-debt',type:'line',title:'Total balance under the same fixed payment budget',unit:'money',xLabel:'Completed monthly cycles',series:[series('Highest-rate-first excess',h.rows,'total'),series('Proportional excess',p.rows,'total',{dash:true})],note:'Only the allocation of payment above the same assumed minimum changes. A line ending above zero retains unpaid debt. A one-point line means no payment cycle could be projected under the entered minimum and budget.'},
      {id:'allocation-bucket-b',type:'line',title:'Follow bucket B separately from the combined debt',unit:'money',xLabel:'Completed monthly cycles',series:[series('Bucket B: highest-first excess',h.rows,'b'),series('Bucket B: proportional excess',p.rows,'b',{dash:true})],note:'Bucket B is not necessarily the higher-rate bucket after edits. Highest-first sorts the actual entered rates. At equal rates, the total interest comparison does not depend on which bucket receives excess first.'},
      {id:'allocation-interest-components',type:'stackbar',title:'Interest accrued during completed modeled cycles',unit:'money',seriesNames:['Bucket A interest','Bucket B interest'],rows:[{label:'Highest-first excess'+(h.complete?' · repaid':' · partial'),values:h.interestBy},{label:'Proportional excess'+(p.complete?' · repaid':' · partial'),values:p.interestBy}],note:'These are full payoff interest amounts only when the corresponding schedule finishes. If a projection is blocked or reaches the 120-cycle limit, do not compare partial bars as lifetime costs.'},
      {id:'allocation-rate-payment',type:'heatmap',title:'Completed-payoff interest saving from highest-first excess',unit:'money',columns:['$100 / month','$200','$300','$500'],rows:[10,20,30,36].map(rateB=>({label:'Bucket B '+rateB+'%',values:[100,200,300,500].map(payment=>{const input={...d,rateB,payment},high=cardAllocationPath(input),pro=cardAllocationPath(input,'proportional');return high.complete&&pro.complete?pro.interest-high.interest:null;})})),note:'Rows replace bucket B’s annual rate; columns replace the total monthly budget. Bucket A, opening balances and minimum formula remain selected. Unavailable means at least one path is blocked by its minimum or does not repay within 120 cycles, so a full-cost difference is not reported.'}
    ]};
  }
  throw Error('Unknown income-ledger planning topic.');
}
