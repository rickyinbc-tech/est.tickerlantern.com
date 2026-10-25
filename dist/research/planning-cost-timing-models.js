import { tuitionSource } from './planning-tuition-data.js';
import { installmentPayment } from './planning-life-events-models.js';
export const costTimingDefinitions={
  tuitionBudget:{title:'Explore a full student budget beside tuition statistics',fields:[
    ['tuition','Tuition for the budget: enter the actual quote (CAD)',8021,0,60000,500],['fees','Additional compulsory fees (CAD)',1000,0,10000,100],
    ['living','Monthly living and local transport budget (CAD)',1400,0,4000,100],['months','Months of living costs to fund',8,1,12,1],
    ['books','Books, supplies and equipment (CAD)',1000,0,10000,100],['setup','Travel and one-time setup costs (CAD)',1000,0,10000,100],
    ['funding','Confirmed funding available for this budget (CAD)',12000,0,100000,1000]
  ]},
  promoTransfer:{title:'Explore a promotional balance-transfer schedule',fields:[
    ['balance','Original card balance (CAD)',10000,0,100000,500],['currentRate','Current nominal annual rate (%)',20,0,36,.5],
    ['feePercent','Transfer fee / original balance (%)',3,0,10,.5],['promoRate','Promotional nominal annual rate (%)',0,0,20,.5],
    ['promoMonths','Monthly cycles at the promotional rate',12,0,24,1],['followRate','Nominal annual rate after promotion (%)',22,0,36,.5],
    ['payment','Fixed month-end payment (CAD)',400,0,3000,50]
  ]},
  reimbursement:{title:'Explore expenses before insurance reimbursements arrive',fields:[
    ['bill','Invoice at the start of each claim month (CAD)',600,0,5000,100],['eligible','Recognized eligible amount per invoice (CAD)',500,0,5000,100],
    ['deductible','Remaining deductible before the first claim (CAD)',100,0,2000,50],['coverage','Insurer share after the deductible (%)',80,0,100,5],
    ['maximum','Remaining insurer-payment maximum for the benefit year (CAD)',1500,0,10000,250],['claimMonths','Consecutive monthly invoices in one benefit year',6,1,12,1],
    ['delay','Full-month receipt delay after each claim month',2,0,6,1],['surplus','Other month-end budget surplus available (CAD)',150,0,2000,50],
    ['cash','Starting cash allocated to this schedule (CAD)',1500,0,30000,500]
  ]}
};
export function studentBudget(input){
  const living=input.living*input.months,total=input.tuition+input.fees+living+input.books+input.setup;
  return {living,total,gap:Math.max(0,total-input.funding),signedGap:total-input.funding,tuitionShare:total>0?input.tuition/total:null};
}
export function promotionalDebt(input,transfer){
  const fee=transfer&&input.balance>0?input.balance*input.feePercent/100:0;let value=input.balance+fee,interest=0,paid=0;
  const rows=[{x:0,value}];
  if(value===0)return {rows,fee,interest,paid,months:0,complete:true,promoEnd:0};
  for(let month=1;month<=120;month++){
    const rate=transfer?(month<=input.promoMonths?input.promoRate:input.followRate):input.currentRate;
    const charge=value*rate/1200,actual=Math.min(input.payment,value+charge);interest+=charge;paid+=actual;value=Math.max(0,value+charge-actual);if(value<1e-7)value=0;
    rows.push({x:month,value});if(value===0)break;
  }
  const complete=value===0;
  return {rows,fee,interest,paid,months:complete?rows.length-1:null,complete,promoEnd:rows[Math.min(input.promoMonths,rows.length-1)].value};
}
export function promoPaymentNeeded(input){
  if(input.promoMonths===0)return null;
  const exact=installmentPayment(input.balance*(1+input.feePercent/100),input.promoRate,input.promoMonths);
  return Math.ceil(exact*100-1e-7)/100;
}
export function reimbursementPlan(input){
  let deductible=input.deductible,maximum=input.maximum;const claims=[],receipts={};
  for(let month=1;month<=input.claimMonths;month++){
    const eligible=Math.min(input.bill,input.eligible),used=Math.min(deductible,eligible);deductible-=used;
    const reimbursement=Math.min(maximum,(eligible-used)*input.coverage/100);maximum-=reimbursement;
    const receiptMonth=month+input.delay;receipts[receiptMonth]=(receipts[receiptMonth]??0)+reimbursement;
    claims.push({month,bill:input.bill,eligible,deductible:used,reimbursement,receiptMonth});
  }
  let position=0,lowest=0;const rows=[{x:0,after:input.cash,end:input.cash}];
  for(let month=1;month<=input.claimMonths+input.delay;month++){
    const bill=month<=input.claimMonths?input.bill:0;position-=bill;lowest=Math.min(lowest,position);const after=position+input.cash;
    position+=input.surplus+(receipts[month]??0);rows.push({x:month,after,end:position+input.cash});
  }
  const reimbursement=claims.reduce((s,c)=>s+c.reimbursement,0),gross=input.bill*input.claimMonths,required=Math.max(0,-lowest);
  return {claims,rows,reimbursement,gross,netCost:gross-reimbursement,required,extra:Math.max(0,required-input.cash),ending:position+input.cash,deductibleLeft:deductible,maximumLeft:maximum};
}
export function costTimingResult(kind,input){
  if(kind==='tuitionBudget'){
    const p=studentBudget(input),observation={source:tuitionSource.url,sourceLabel:'Statistics Canada · Table 37-10-0045-01',evidence:'Official statistics · preliminary 2026/2027'};
    return {metrics:[['Total modeled student budget',p.total,'money'],['Tuition share of the modeled budget',p.tuitionShare,'percent',p.tuitionShare===null?'No modeled costs':undefined],['Additional funding needed',p.gap,'money']],note:'Two fixed official-data graphics are separate from the editable budget. The tuition input begins at the published Canadian undergraduate national average, but a personal budget needs the actual institution/program quote. All other defaults are hypothetical. Tuition is entered once and is not prorated when living-cost months change. No grants, tax credits, loan approval, fee forecast or investment return is calculated; confirmed funding is entered separately. Source weighted tuition is not a full cost-of-attendance estimate or a promise about any student’s bill.',charts:[
      {id:'tuition-national',type:'bar',...observation,title:'National undergraduate tuition averages differ by student status',unit:'money',rows:tuitionSource.national.map(r=>({label:r.label,value:r.value})),note:'Full-time undergraduate tuition, current CAD, public degree-granting institutions. Groups can differ in program and institution mix; the bars do not quote the same program for two people. Tuition excludes the additional fees and living costs modeled below.'},
      {id:'tuition-provinces',type:'bar',...observation,title:'Canadian undergraduate tuition averages across ten provinces',unit:'money',rows:[...tuitionSource.provinces].sort((a,b)=>a.value-b.value).map(r=>({label:r.label,value:r.value})),note:'Ten provincial weighted averages for Canadian undergraduates, not institution prices or rankings of quality. No territory is shown. The national estimate uses enrolment weights and is not the simple average of these bars. Residency and program mix affect comparisons.'},
      {id:'tuition-budget',type:'waterfall',title:'Tuition is one part of the funding requirement',unit:'money',rows:[{label:'Tuition entered for this budget',value:input.tuition},{label:'Additional compulsory fees',value:input.fees},{label:'Living and local transport',value:p.living},{label:'Books and equipment',value:input.books},{label:'Travel and setup',value:input.setup},{label:'Confirmed funding',value:-input.funding}],totalLabel:'Cost less confirmed funding',note:'Only the starting tuition input is taken from the published national observation; once edited it is a scenario value. Other costs are hypothetical budget lines. Positive endpoint is additional funding needed; negative means entered funding exceeds this budget. No statistical estimate of living costs is inferred.'},
      {id:'tuition-matrix',type:'heatmap',title:'Funding gaps across living costs and months to cover',unit:'money',columns:['4 mo','8 mo','10 mo','12 mo'],rows:[800,1200,1600,2000].map(living=>({label:'$'+living+'/mo',values:[4,8,10,12].map(months=>studentBudget({...input,living,months}).gap)})),note:'Rows replace the monthly living/local-transport allowance; columns replace its duration. Tuition, fees, books, setup and confirmed funding remain selected. Cells are hypothetical shortfalls, not source-reported accommodation costs or an estimate of eligibility for student assistance.'}
    ]};
  }
  if(kind==='promoTransfer'){
    const current=promotionalDebt(input,false),transfer=promotionalDebt(input,true),horizon=Math.max(current.rows.length,transfer.rows.length)-1;
    const path=p=>Array.from({length:horizon+1},(_,x)=>({x,value:p.rows[Math.min(x,p.rows.length-1)].value}));
    const required=promoPaymentNeeded(input);
    return {metrics:[['Transfer balance when promotional cycles end',transfer.promoEnd,'money'],['Monthly amount to clear within the promotion',required,'money',required===null?'No promotional months':undefined],['Months to repay the transferred balance',transfer.months,'months']],note:'Hypothetical single transferred balance with no new purchases or other rate buckets. Fee is financed into the balance and receives the same modeled rate. Rates are nominal annual divided by 12; interest is charged before each fixed month-end payment. The within-promotion payment is rounded up to cents, with the final payment capped at debt owed. Promotional rate applies to the first selected monthly cycles, then the follow-on rate applies prospectively to remaining debt. No retroactive interest, late payment, promotion cancellation, annual fee, contractual minimum formula or actual issuer allocation rule is calculated. Both alternatives stop at payoff or 120 months; incomplete interest is partial. These are assumptions, not available card offers.',charts:[
      {id:'promo-rates',type:'bar',title:'The promotional rate covers only part of the schedule',unit:'percent',unitLabel:'Hypothetical nominal annual rates (%)',rows:[{label:'Current card',value:input.currentRate/100},{label:'Promotion · '+input.promoMonths+' monthly cycles',value:input.promoRate/100},{label:'After promotional cycles',value:input.followRate/100}],note:'A zero rate does not remove the transfer fee. Zero promotional cycles means the new balance starts at the follow-on rate; the displayed promotional rate is then unused. Actual agreements can use different fee and payment-allocation rules.'},
      {id:'promo-balances',type:'line',title:'Compare the remaining debt after the promotion expires',unit:'money',xLabel:'Months since the comparison starts',series:[{name:'Keep current card balance',rows:path(current)},{name:'Transfer with financed fee',rows:path(transfer),dash:true}],note:'Both alternatives use the same fixed payment while debt remains. The transferred balance starts above original principal when a fee is financed. After payoff its line stays zero; freed payments are not assumed to be invested. Not repaid means not cleared within 120 months.'},
      {id:'promo-costs',type:'stackbar',title:'Separate interest from the financed transfer fee',unit:'money',seriesNames:['Interest charged','Transfer fee'],rows:[{label:'Current card'+(current.complete?' · repaid':' · 120 months only'),values:[current.interest,0]},{label:'Transfer'+(transfer.complete?' · repaid':' · 120 months only'),values:[transfer.interest,transfer.fee]}],note:'Original debt principal is excluded. Interest on the financed fee is already included in interest, while the fee itself appears once. Incomplete schedules show only charges within the 120-month limit, so their totals are not full repayment costs.'},
      {id:'promo-matrix',type:'heatmap',title:'Transfer borrowing costs across promotion length and payment',unit:'money',columns:['$200','$400','$600','$1k'],rows:[3,6,12,18].map(promoMonths=>({label:promoMonths+' mo',values:[200,400,600,1000].map(payment=>{const p=promotionalDebt({...input,promoMonths,payment},true);return p.complete?p.interest+p.fee:null;})})),note:'Rows change promotional cycles; columns replace the monthly payment in CAD. Original balance, rates and fee percentage remain selected. Cells show full interest plus fee only when repaid inside 120 months; NR means no full-life cost is reported. These are deterministic comparisons, not offers or approval outcomes.'}
    ]};
  }
  if(kind==='reimbursement'){
    const p=reimbursementPlan(input);
    return {metrics:[['Eventual reimbursement under the assumptions',p.reimbursement,'money'],['Starting cash needed for the schedule',p.required,'money'],['Additional starting cash needed',p.extra,'money']],note:'Hypothetical private-benefit claims, not a public dental/health-program or insurer quote. Identical invoices arrive at the start of consecutive months in one benefit year. Recognized amount is capped at invoice value; remaining deductible is applied first, then the coverage percentage, then the remaining insurer-payment maximum. No maximum reset occurs. Claim m pays at the end of month m + delay, even at zero delay. Other budget surplus arrives at month-end. The model runs through claim months + delay and measures shortages immediately after bills, before receipts. All claims are assumed eligible and approved; no clinical need, adjudication, coordination, tax credit, premium, direct billing or borrowing cost is calculated.',charts:[
      {id:'claims-split',type:'stackbar',title:'The reimbursement maximum can change later claims',unit:'money',seriesNames:['Eventual insurer reimbursement','Unreimbursed part of invoice'],rows:p.claims.map(c=>({label:'Claim month '+c.month,values:[c.reimbursement,c.bill-c.reimbursement]})),note:'Each bar totals the gross invoice. The unreimbursed part can reflect ineligible charges, the deductible, the unpaid percentage or the exhausted maximum. Coverage is applied only to the entered recognized amount after the remaining deductible.'},
      {id:'claims-cash',type:'line',title:'Month-end cash can hide a shortage earlier in the month',unit:'money',xLabel:'Month of the expense and receipt schedule',series:[{name:'Cash after start-of-month bill',rows:p.rows.map(r=>({x:r.x,value:r.after}))},{name:'Cash after month-end resources',rows:p.rows.map(r=>({x:r.x,value:r.end})),dash:true}],note:'Both series show the same cash ledger at different points in each month, not two alternative insurance policies. Negative values are unfunded needs. A reimbursement expected later cannot pay an earlier invoice without another source. The chart is monthly, not a full daily bank ledger.'},
      {id:'claims-delay',type:'bar',title:'Later receipts can increase the cash needed before reimbursement',unit:'money',rows:[0,1,2,4,6].map(delay=>({label:delay+' full-month receipt delay',value:reimbursementPlan({...input,delay}).required})),note:'The bills and modeled eventual reimbursement are identical. Each case runs until its claim-month count plus receipt delay, with the same monthly budget surplus. The measure is the deepest earlier shortage before starting cash, so later resources do not erase a past funding need.'},
      {id:'claims-matrix',type:'heatmap',title:'Additional starting cash across coverage and receipt delays',unit:'money',columns:['0 mo','1 mo','3 mo','6 mo'],rows:[50,70,80,100].map(coverage=>({label:coverage+'%',values:[0,1,3,6].map(delay=>reimbursementPlan({...input,coverage,delay}).extra)})),note:'Rows change insurer share; columns change receipt delay. Invoices, recognized amounts, remaining deductible, payment maximum, claim months, surplus and starting cash remain selected. The maximum can make different coverage percentages produce the same total reimbursement. No particular plan design or settlement time is implied.'}
    ]};
  }
  throw Error('Unknown cost or timing topic.');
}
