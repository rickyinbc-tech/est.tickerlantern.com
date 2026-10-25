// Original cash-flow and timing exercises; all rates and amounts are assumptions.
export const everydayCapitalDefinitions={
  condoAssessment:{title:'Prepare personal cash for an independently confirmed assessment calendar',fields:[
    ['assessmentTotal','Total special assessment allocated to this owner (CAD)',18000,0,100000,1000],
    ['assessmentFirstMonth','Month of the first instalment',6,1,24,1],['assessmentParts','Number of equal instalments',3,1,6,1],['assessmentSpacing','Months between instalments',3,1,12,1],
    ['assessmentCash','Personal cash already earmarked for the assessment (CAD)',5000,0,100000,1000],['assessmentSaving','Personal monthly saving after ordinary bills and strata fees (CAD)',400,0,5000,50],
    ['strataFee','Ordinary monthly strata fee, paid separately (CAD)',500,0,3000,50]
  ]},
  fixedDebtInflation:{title:'Compare a fixed loan payment with prices and take-home income',fields:[
    ['realDebtPrincipal','Starting loan principal (CAD)',25000,0,250000,1000],['realDebtApr','Fixed nominal annual loan interest assumption (%)',6,0,25,.5],
    ['realDebtYears','Loan repayment term (years)',5,1,15,1],['realDebtIncome','Starting monthly take-home income (CAD)',5000,500,20000,250],
    ['realDebtLiving','Starting monthly non-debt living costs (CAD)',3500,0,15000,250],['realDebtInflation','Assumed annual price increase (%)',4,0,10,.5],
    ['realDebtWage','Assumed annual take-home income increase (%)',1,-5,10,.5]
  ]},
  contributionBatch:{title:'Compare future weekly contributions and fixed purchase fees',fields:[
    ['batchWeekly','Contribution available at the beginning of each week (CAD)',100,0,2000,25],['batchInitial','Cash available before the first week (CAD)',0,0,100000,1000],
    ['batchFee','Fixed fee paid from available cash on each completed purchase (CAD)',5,0,25,1],['batchGap','Weeks between scheduled purchases',4,1,13,1],
    ['batchYears','Number of 52-week model years',10,1,20,1],['batchAssetReturn','Effective annual asset return assumption (%)',5,-20,20,.5],
    ['batchCashReturn','Effective annual return on waiting cash (%)',2,0,8,.5]
  ]}
};
export function assessmentEvents(input){return Array.from({length:input.assessmentParts},(_,i)=>({month:input.assessmentFirstMonth+i*input.assessmentSpacing,amount:input.assessmentTotal/input.assessmentParts}));}
export function assessmentSavingRequired(input){
  let cumulative=0,required=0;
  for(const event of assessmentEvents(input)){
    cumulative+=event.amount;
    if(event.month===1){if(cumulative>input.assessmentCash)return null;}
    else required=Math.max(required,(cumulative-input.assessmentCash)/(event.month-1));
  }
  return Math.max(0,required);
}
export function assessmentLedger(input){
  const events=assessmentEvents(input),horizon=Math.max(24,events.at(-1).month);
  let cash=input.assessmentCash,paid=0,unfunded=0,deposits=0;
  const rows=[{x:0,value:cash,before:cash}],bills=[];
  for(let month=1;month<=horizon;month++){
    const due=events.find(e=>e.month===month)?.amount??0,funded=Math.min(cash,due),gap=due-funded;
    cash-=funded;paid+=funded;unfunded+=gap;
    if(due>0)bills.push({label:'Month '+month,values:[funded,gap]});
    const before=cash;cash+=input.assessmentSaving;deposits+=input.assessmentSaving;
    rows.push({x:month,value:cash,before,due,funded,gap});
  }
  return {events,horizon,rows,bills,cash,paid,unfunded,deposits};
}
export function fixedDebtPath(input){
  const n=12*input.realDebtYears,r=input.realDebtApr/1200,principal=input.realDebtPrincipal;
  const payment=r===0?principal/n:principal*r/(-Math.expm1(-n*Math.log1p(r)));
  let balance=principal,totalInterest=0;
  const snapshot=(month,debt)=>{
    const prices=(1+input.realDebtInflation/100)**(month/12),income=input.realDebtIncome*(1+input.realDebtWage/100)**(month/12),living=input.realDebtLiving*prices;
    return {x:month,value:debt,realDebt:debt/prices,payment,realPayment:payment/prices,income,living,surplus:income-living-payment,withoutDebt:income-living};
  };
  const rows=[snapshot(0,balance)];
  for(let month=1;month<=n;month++){
    const interest=balance*r;totalInterest+=interest;
    const actual=Math.min(balance+interest,month===n?balance+interest:payment);balance=Math.max(0,balance+interest-actual);
    rows.push({...snapshot(month,balance),actualPayment:actual});
  }
  return {rows,payment,totalInterest,final:rows.at(-1)};
}
export function contributionBatchPath(input,gap=input.batchGap){
  const N=52*input.batchYears,assetFactor=(1+input.batchAssetReturn/100)**(1/52),cashFactor=(1+input.batchCashReturn/100)**(1/52);
  let cash=input.batchInitial,invested=0,fees=0,trades=0,contributions=input.batchInitial;
  const rows=[{x:0,value:cash,cash,invested,fees,trades,contributions}];
  for(let week=1;week<=N;week++){
    cash+=input.batchWeekly;contributions+=input.batchWeekly;
    if(week%gap===0&&cash>input.batchFee){invested+=cash-input.batchFee;cash=0;fees+=input.batchFee;trades++;}
    cash*=cashFactor;invested*=assetFactor;
    rows.push({x:week,value:cash+invested,cash,invested,fees,trades,contributions});
  }
  return {rows,cash,invested,total:cash+invested,fees,trades,contributions};
}
const line=(name,rows,key='value',extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function everydayCapitalResult(kind,input){
  if(kind==='condoAssessment'){
    const p=assessmentLedger(input),required=assessmentSavingRequired(input);
    return {metrics:[['Each scheduled assessment instalment',input.assessmentTotal/input.assessmentParts,'money'],['Assessment bills without cash funding on their due dates',p.unfunded,'money'],['Monthly saving needed before every due date',required,'money',required===null?'Opening cash is insufficient for a month-one bill':undefined]],note:'An independently entered owner-level assessment schedule, not a calculation of legal liability or of a building’s funding adequacy. Equal instalments are due at the start of their selected months, before that month’s personal saving arrives. Ordinary strata fees and all other household bills must already be paid outside this reserve. The strata corporation’s operating and reserve funds are not personal accessible cash and are not deducted from the entered owner assessment. Cash earns zero interest. Every bill can use only personal cash then available; unpaid amounts remain separate, without automatic borrowing or later retrospective payment. New saving continues through the full displayed horizon and is not capped after the final instalment. Provincial rules, voting, unit entitlement, sale adjustments, interest on arrears and actual assessment dates require independent confirmation.',charts:[
      {id:'assessment-bill-pattern',type:'stackbar',title:'An assessment adds cash commitments to the ordinary monthly fee',unit:'money',seriesNames:['Ordinary strata fee','Assessment instalment'],rows:[{label:'An ordinary month',values:[input.strataFee,0]},...p.events.map(e=>({label:'Assessment month '+e.month,values:[input.strataFee,e.amount]}))],note:'Selected month types, not a sum of all costs over the horizon. The ordinary fee is paid from the main budget; the assessment comes from the separate personal reserve below. Both may be due in the same month. A building reserve balance is not a credit to this owner’s bill.'},
      {id:'assessment-personal-reserve',type:'line',title:'Personal saving received after a bill cannot fund that earlier deadline',unit:'money',xLabel:'Months from the reserve starting date',series:[line('After the bill, before saving',p.rows,'before'),line('After month-end personal saving',p.rows,'value',{dash:true})],note:'The two lines show different points in the same account. Zero cash can coexist with an unpaid assessment. The separate unfunded-bill metric retains that amount. Later contributions remain cash for later uses and do not silently cure an earlier missed payment.'},
      {id:'assessment-instalment-funding',type:'stackbar',title:'Check each assessment deadline separately',unit:'money',seriesNames:['Funded from personal cash','Unfunded at the due date'],rows:p.bills.length?p.bills:[{label:'No positive assessment',values:[0,0]}],note:'All instalments share the entered total equally. Each bar totals the amount due at that date. A positive ending reserve does not establish that all earlier instalments were funded.'},
      {id:'assessment-required-saving',type:'heatmap',unavailableLabel:'N/A',title:'Monthly saving required to fund every assessment date',unit:'money',columns:['Month 1','Month 3','Month 6','Month 12'],rows:[9000,18000,30000,48000].map(assessmentTotal=>({label:'$'+assessmentTotal/1000+'k total',values:[1,3,6,12].map(assessmentFirstMonth=>assessmentSavingRequired({...input,assessmentTotal,assessmentFirstMonth}))})),note:'Rows replace the owner-level total assessment; columns replace the first instalment month. Opening personal reserve, number of instalments and spacing remain selected. Each cell checks every due date, using only deposits received before that date. N/A means a month-one bill exceeds opening cash: no later monthly contribution can fund it on time. No probability or expected assessment is implied.'}
    ]};
  }
  if(kind==='fixedDebtInflation'){
    const p=fixedDebtPath(input),years=input.realDebtYears;
    return {metrics:[['Fixed monthly loan payment',p.payment,'money'],['Last payment run rate in starting-date dollars',p.final.realPayment,'money'],['Monthly budget surplus at the final payment date',p.final.surplus,'money']],note:'Hypothetical fully amortizing fixed-rate loan; nominal annual interest ÷ 12, with a capped final payment. The annual price and take-home growth assumptions are converted through fractional-year compounding. Budget points are monthly run rates at each modeled date, not a salary-receipt ledger. Real values divide nominal amounts by the cumulative selected price factor and are expressed in starting-date dollars. Neither the contractual payment nor the interest rate changes with inflation. Household surplus equals take-home income less non-debt living costs and the contractual payment; a negative result is a funding gap, not automatic credit. The final-date budget still includes the last loan payment; the following month is outside the chart. No new debt, refinancing, fees, tax changes, job loss or account balance is modeled.',charts:[
      {id:'fixed-debt-payment-purchasing-power',type:'line',title:'The payment can fall in real terms while the same dollars remain due',unit:'money',unitLabel:'Monthly CAD payment · nominal versus starting-date purchasing power',xLabel:'Months from the loan start',series:[line('Nominal contractual payment',p.rows,'payment'),line('Payment in starting-date dollars',p.rows,'realPayment',{dash:true})],note:'Real payment = fixed nominal payment ÷ (1 + selected annual price increase)^(month ÷ 12). The real series is a unit conversion, not a reduction offered by the lender. Month zero is a reference payment amount before the modeled price increase.'},
      {id:'fixed-debt-balance-real',type:'line',title:'Separate principal repayment from a changing price-level denominator',unit:'money',xLabel:'Months from the loan start',series:[line('Nominal debt after payment',p.rows),line('Debt in starting-date dollars',p.rows,'realDebt',{dash:true})],note:'Both lines reach zero when the loan is repaid. Nominal debt falls through actual principal repayment. At positive inflation the same remaining nominal amount translates into fewer starting-date dollars. Do not add the gap between these lines to cash savings or count it as a payment already made.'},
      {id:'fixed-debt-household-surplus',type:'line',title:'Affordability still depends on income relative to living costs',unit:'money',xLabel:'Months from the loan start',series:[line('Monthly surplus after living costs and loan payment',p.rows,'surplus'),line('Same monthly budget before the loan payment',p.rows,'withoutDebt',{dash:true})],note:'These are nominal monthly budget amounts. Both use the same income and expense assumptions; their difference is the fixed payment. Inflation can reduce the real value of debt while rising living costs squeeze this cash budget. A negative value is not an assumed withdrawal or a funded overdraft.'},
      {id:'fixed-debt-price-pay-stress',type:'heatmap',title:'Monthly surplus at the final payment date across prices and pay growth',unit:'money',signed:true,columns:['0% pay','2% pay','4% pay','6% pay'],rows:[0,2,4,6].map(realDebtInflation=>({label:realDebtInflation+'% prices',values:[0,2,4,6].map(realDebtWage=>fixedDebtPath({...input,realDebtInflation,realDebtWage}).final.surplus)})),note:'Rows replace annual price growth and columns replace annual take-home growth. The selected loan, starting income, starting non-debt living costs and '+years+'-year term stay fixed. Higher inflation does not make the loan payment smaller in nominal dollars. Cells are deterministic budget cases, not inflation or wage forecasts.'}
    ]};
  }
  if(kind==='contributionBatch'){
    const selected=contributionBatchPath(input),weekly=contributionBatchPath(input,1),annual=p=>p.rows.filter(r=>r.x%52===0).map(r=>({...r,x:r.x/52}));
    return {metrics:[['Ending investments plus waiting cash, selected interval',selected.total,'money'],['Completed purchases at the selected interval',selected.trades,'integer'],['Selected interval minus weekly ending resources',selected.total-weekly.total,'money']],note:'Equal starting cash and equal new contributions available only at the beginning of each modeled week. One model year contains exactly 52 weeks; four-week purchases therefore mean 13 opportunities per year, not calendar-month purchases. A purchase is scheduled every selected number of weeks. It occurs only when available cash exceeds the fixed fee; the fee is paid from that cash and the rest is invested. Cash earns its weekly-equivalent effective return and assets earn their weekly-equivalent effective return after that week’s purchase. No contribution is borrowed from future weeks. All terminal comparisons include uninvested cash, even when the horizon ends between scheduled purchases. Fractional units, unchanged rates and costless deposits are assumed. No selling, spread, ongoing fund cost, tax, minimum lot, settlement delay or commission-free offer is modeled.',charts:[
      {id:'batch-contribution-total-resources',type:'line',title:'Compare the same contribution budget, including money still waiting',unit:'money',xLabel:'52-week model years from the start',series:[line('Buy every week',annual(weekly)),line('Buy every '+input.batchGap+' weeks',annual(selected),'value',{dash:true})],note:'Ending wealth is invested value plus waiting cash. Both strategies receive the same deposits on the same dates. Any difference comes from purchase timing, completed trade fees and returns earned in the two accounts, rather than extra saving effort.'},
      {id:'batch-contribution-fees',type:'line',title:'A fixed fee is paid once per completed purchase',unit:'money',xLabel:'52-week model years from the start',series:[line('Cumulative fees: weekly purchases',annual(weekly),'fees'),line('Cumulative fees: selected interval',annual(selected),'fees',{dash:true})],note:'Nominal fees paid, without adding foregone investment growth. A scheduled date does not trigger a fee if available cash does not exceed that fee. No fee is charged for a skipped purchase, and no loan is created to pay a fee.'},
      {id:'batch-contribution-waiting-cash',type:'line',title:'The first model year makes the waiting-money pattern visible',unit:'money',xLabel:'Weeks in the first 52-week model year',series:[line('Waiting cash: weekly purchases',weekly.rows.slice(0,53),'cash'),line('Waiting cash: selected interval',selected.rows.slice(0,53),'cash',{dash:true})],note:'Values are after that week’s contribution, any completed purchase and returns. Initial cash may wait until the first scheduled purchase. A regular sawtooth can reflect planned batching; it is not a missed transfer. An ending cash balance remains part of total resources.'},
      {id:'batch-contribution-fee-interval',type:'heatmap',title:'Ending resources minus a matching weekly-purchase baseline',unit:'money',signed:true,columns:['1 week','2 weeks','4 weeks','13 weeks'],rows:[0,2,5,10].map(batchFee=>({label:'$'+batchFee+' fee',values:[1,2,4,13].map(gap=>contributionBatchPath({...input,batchFee},gap).total-contributionBatchPath({...input,batchFee},1).total)})),note:'Rows replace the fee and columns replace the interval. Every cell subtracts a weekly strategy with that same row fee, starting cash, deposit budget, horizon and return assumptions. Positive favours that interval only in this case. Zero-fee batching can still change the result because contributions earn different returns while waiting. The matrix has no probabilities or recommended trading frequency.'}
    ]};
  }
  throw Error('Unknown everyday-capital planning topic.');
}
