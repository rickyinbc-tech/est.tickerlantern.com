import { emergencySurveyData as survey } from './planning-emergency-recovery-data.js';

export const emergencyRecoveryDefinitions={
  emergencySurveyCash:{title:'Check cash already committed before adding a new shock',fields:[
    ['bankCash','Accessible cash balance for this exercise (CAD)',9000,0,100000,500],
    ['committedCash','Known payments already assigned to that cash (CAD)',6000,0,100000,500],
    ['shockCost','Additional unexpected payment (CAD)',4000,0,50000,500]
  ]},
  drawdownRecovery:{title:'Separate a nominal recovery, purchasing power and new deposits',fields:[
    ['originalCapital','Portfolio immediately before the one-time loss (CAD)',100000,10000,500000,10000],
    ['initialLoss','One-time loss at the start (%)',30,0,90,5],
    ['recoveryReturn','Constant nominal annual total return after the loss (%)',5,-10,15,1],
    ['annualInflation','Constant annual price growth after the loss (%)',2,0,8,1],
    ['recoveryYears','Whole years after the loss',10,1,20,1],
    ['recoveryDeposit','New deposit at each year-end (CAD)',3000,0,30000,1000]
  ]}
};

export function emergencyCashCheck(input){
  const uncommitted=input.bankCash-input.committedCash,ending=uncommitted-input.shockCost;
  return {uncommitted,available:Math.max(0,uncommitted),ending,gap:Math.max(0,-ending)};
}

export function drawdownRecoveryLedger(input){
  const postLoss=input.originalCapital*(1-input.initialLoss/100),rate=input.recoveryReturn/100,inflation=input.annualInflation/100;
  let noDeposit=postLoss,withDeposits=postLoss,target=input.originalCapital;
  const rows=[{x:0,noDeposit,withDeposits,target}];
  for(let year=1;year<=input.recoveryYears;year++){
    noDeposit*=1+rate;withDeposits=withDeposits*(1+rate)+input.recoveryDeposit;target=input.originalCapital*(1+inflation)**year;
    rows.push({x:year,noDeposit,withDeposits,target});
  }
  const deposits=input.recoveryDeposit*input.recoveryYears;
  return {rows,postLoss,noDeposit,withDeposits,target,deposits,growth:withDeposits-postLoss-deposits,
    nominalGain:input.originalCapital/postLoss-1,realTotalGain:target/postLoss-1,
    requiredAnnual:(target/postLoss)**(1/input.recoveryYears)-1,
    firstNominal:rows.find(r=>r.noDeposit>=input.originalCapital*(1-1e-12))?.x??null,
    firstReal:rows.find(r=>r.noDeposit>=r.target*(1-1e-12))?.x??null};
}
const line=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function emergencyRecoveryResult(kind,input){
  if(kind==='emergencySurveyCash'){
    const p=emergencyCashCheck(input);
    return {metrics:[['Cash remaining after known commitments, floored at zero',p.available,'money'],['Additional funding required for commitments and the shock',p.gap,'money'],['Balance after both kinds of payment',p.ending,'money']],note:'The two survey charts are fixed U.S. 2025 observations, published in May 2026 and reviewed 25 October 2026. Their amounts are USD and their denominator is U.S. adults, not households or Canadians. The separate editable cash exercise uses hypothetical CAD, without converting the survey amounts. Known commitments and the additional shock must be non-overlapping payments due before another inflow; there are no new receipts, interest, asset sales, credit, fees or reimbursements in this short cash check. A negative balance is an unfunded requirement. Survey percentages do not choose a personal reserve, measure an individual probability or certify household preparedness.',charts:[
      {id:'emergency-survey-savings-bands',type:'bar',title:'The savings-only question reports six different capacity bands',unit:'percent',unitLabel:'Share of U.S. adults in 2025 (%) · emergency amounts in USD',source:survey.source,sourceLabel:'Federal Reserve · 2025 SHED, table 26',rows:survey.savingsOnly.map(r=>({label:r.label,value:r.percent/100})),note:'Largest unexpected expense respondents said they could handle immediately using savings alone. Bands are the six reported categories, including an open-ended top band. Values are weighted survey estimates, not account records. No average dollar balance or median amount is inferred from these bands.'},
      {id:'emergency-survey-different-questions',type:'bar',title:'A payment choice and a savings capacity answer different questions',unit:'percent',unitLabel:'Share of U.S. adults in 2025 (%) · two separate survey questions',source:survey.source,sourceLabel:'Federal Reserve · 2025 SHED, emergency-savings text and table 26',rows:[{label:'Would: $400 cash / equivalent',value:survey.wouldPay400CashEquivalent/100},{label:'Could: $500+ savings only',value:survey.couldPay500Savings/100}],note:'The first measure includes cash, savings or a credit card paid at the next statement. The second asks savings-only capacity at a different threshold; 70% also equals the sum of the four published bands starting at $500. These are separate marginals, not mutually exclusive slices, a change over time, or an identified overlap between people.'},
      {id:'emergency-survey-usable-cash',type:'waterfall',title:'An account balance can already have other jobs',unit:'money',rows:[{label:'Selected accessible cash',value:input.bankCash},{label:'Known commitments',value:-input.committedCash},{label:'Additional unexpected payment',value:-input.shockCost}],totalLabel:'Balance after both payments',note:'This is an original CAD household example, independent of the U.S. survey. Commitments and the shock are counted once each. An already committed dollar cannot also fund the additional bill. Negative values identify funding still needed, without assuming an overdraft appears.'},
      {id:'emergency-survey-cash-matrix',type:'heatmap',title:'Extra funding needed as commitments and the new bill change',unit:'money',columns:['$500','$1.5k','$3k','$5k'],rows:[0,2000,4000,6000].map(committedCash=>({label:'$'+committedCash/1000+'k due',values:[500,1500,3000,5000].map(shockCost=>emergencyCashCheck({...input,committedCash,shockCost}).gap)})),note:'Rows replace known CAD commitments; columns replace the additional CAD shock. Accessible cash stays selected. Zero means this arithmetic check is funded, not that every future emergency is covered. The matrix does not use the national percentages as personal probabilities.'}
    ]};
  }
  if(kind==='drawdownRecovery'){
    const p=drawdownRecoveryLedger(input);
    return {metrics:[['Total nominal gain required to regain the original capital without deposits',p.nominalGain,'percent'],['Constant annual return required to regain original purchasing power without deposits',p.requiredAnnual,'percent'],['Portfolio after the selected returns and year-end deposits',p.withDeposits,'money']],note:'Original deterministic illustration: an immediate one-time loss is followed by the selected number of whole years of a constant nominal annual total return. Each year’s return applies before that year-end deposit. The original purchasing-power target rises at the selected constant annual inflation rate from the instant after the loss. All distributions remain within total return. No fees, taxes, withdrawals, historical returns, probabilities or future-return forecasts are included. Required gains are arithmetic thresholds, not returns that an investment promises to deliver. Initial loss remains below 100%, so all recovery denominators are positive.',charts:[
      {id:'drawdown-recovery-required-gains',type:'bar',title:'The remaining capital must earn a larger percentage to close the loss',unit:'percent',unitLabel:'Cumulative gain required on the post-loss capital (%) · no deposits',rows:[{label:'Regain original dollar amount',value:p.nominalGain},{label:'Regain original purchasing power',value:p.realTotalGain}],note:'Both bars divide a target by the remaining post-loss capital, then subtract one. The second target includes all selected years of price growth. These are total gains over the horizon, while the headline annual requirement compounds over that horizon. New deposits are excluded from both required-return calculations.'},
      {id:'drawdown-recovery-capital-paths',type:'line',title:'A recovering statement balance and purchasing-power recovery can diverge',unit:'money',xLabel:'Year',series:[line('Portfolio without new deposits',p.rows,'noDeposit'),line('Portfolio with year-end deposits',p.rows,'withDeposits',{dash:true}),line('Original purchasing-power target',p.rows,'target')],note:'Year zero is immediately after the selected loss. The target begins at the original pre-loss capital. In the no-deposit path, the original nominal amount is first regained at '+(p.firstNominal===null?'no modeled year':'year '+p.firstNominal)+'; the moving purchasing-power target is first met at '+(p.firstReal===null?'no modeled year':'year '+p.firstReal)+'. Only whole-year checkpoints are tested; these are scenario results, not estimated waiting times.'},
      {id:'drawdown-recovery-deposit-reconciliation',type:'waterfall',title:'New saving can rebuild a balance without being investment earnings',unit:'money',rows:[{label:'Capital remaining after the initial loss',value:p.postLoss},{label:'New year-end deposits',value:p.deposits},{label:'Subsequent investment gain or loss',value:p.growth}],totalLabel:'Portfolio after the final deposit',note:'The initial loss is already reflected in the first row, so it is not subtracted again. Subsequent growth equals ending value less post-loss starting capital and new deposits. This is a dollar reconciliation, not an annual performance return, realized gain or tax cost basis.'},
      {id:'drawdown-recovery-inflation-matrix',type:'heatmap',title:'Surplus or shortfall against the purchasing-power target',unit:'money',signed:true,columns:['0% / yr','3%','6%','9%'],rows:[10,30,50,70].map(initialLoss=>({label:initialLoss+'% loss',values:[0,3,6,9].map(recoveryReturn=>{const q=drawdownRecoveryLedger({...input,initialLoss,recoveryReturn});return q.withDeposits-q.target;})})),note:'Rows replace the immediate loss; columns replace the subsequent nominal annual total return. Original capital, years, inflation and year-end deposits stay selected. Positive cells are modeled surpluses; negative cells are funding gaps against the inflation-adjusted original capital. Color does not represent likelihood, suitability or investment safety.'}
    ]};
  }
  throw Error('Unknown emergency-savings or recovery topic.');
}
