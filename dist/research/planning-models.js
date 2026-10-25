import { bondReinvestmentDefinitions, bondReinvestmentResult } from './planning-bond-reinvestment-models.js';
import { adviceCostDefinitions, adviceCostResult } from './planning-advice-cost-models.js';
import { rppStatisticsDefinitions, rppCountsResult } from './planning-rpp-statistics-models.js';
import { renewalSupplementTimeDefinitions, renewalSupplementTimeResult } from './planning-renewal-supplement-time-models.js';
import { callableBondDefinitions, callableBondResult } from './planning-callable-bond-models.js';
import { vacationCommitmentDefinitions, vacationCommitmentResult } from './planning-vacation-commitment-models.js';
import { constructionQuoteDefinitions, constructionQuoteResult } from './planning-construction-quote-models.js';
import { etfTrackingDefinitions, etfTrackingResult } from './planning-etf-tracking-models.js';
import { rdspRepaymentDefinitions, rdspRepaymentResult } from './planning-rdsp-repayment-models.js';
import { salesTaxDefinitions, salesTaxResult } from './planning-sales-tax-models.js';
import { renewalAccessDefinitions, renewalAccessResult } from './planning-renewal-access-models.js';
import { diversificationDefinitions, diversificationResult } from './planning-diversification-models.js';
import { timingConventionDefinitions, timingConventionResult } from './planning-timing-conventions-models.js';
import { accessBridgeCoverDefinitions, accessBridgeCoverResult } from './planning-access-bridge-cover-models.js';
import { pensionWithdrawalProtectionDefinitions, pensionWithdrawalProtectionResult } from './planning-pension-withdrawal-protection-models.js';
import { debtDenominatorDefinitions, debtDenominatorResult } from './planning-debt-denominators-models.js';
import { currencyTranslationDefinitions, currencyTranslationResult } from './planning-currency-translation-models.js';
import { optionalCoverDefinitions, optionalCoverResult } from './planning-optional-cover-models.js';
import { currencyReturnDefinitions, currencyReturnResult } from './planning-currency-return-models.js';
import { fundingBoundaryDefinitions, fundingBoundaryResult } from './planning-funding-boundaries-models.js';
import { everydayCapitalDefinitions, everydayCapitalResult } from './planning-everyday-capital-models.js';
import { accessRentDefinitions, accessRentResult } from './planning-access-rent-models.js';
import { lookthroughDefinitions, lookthroughResult } from './planning-lookthrough-models.js';
import { distributionDefinitions, distributionResult } from './planning-distribution-models.js';
import { cardGraceDefinitions, cardGraceResult } from './planning-card-grace-models.js';
import { packagePriceDefinitions, packagePriceResult } from './planning-package-price-models.js';
import { glideExposureDefinitions, glideExposureResult } from './planning-glide-exposure-models.js';
import { investmentBorrowingDefinitions, investmentBorrowingResult } from './planning-investment-borrowing-models.js';
import { cpiLevelDefinitions, cpiLevelResult } from './planning-cpi-level-models.js';
import { rentalDailyDefinitions, rentalDailyResult } from './planning-rental-daily-models.js';
import { loanFamilyDefinitions, loanFamilyResult } from './planning-loan-family-models.js';
import { accruedInterestDefinitions, accruedInterestResult } from './planning-accrued-interest-models.js';
import { rrspDeductionDefinitions, rrspDeductionResult } from './planning-rrsp-deduction-models.js';
import { rentalMoveDefinitions, rentalMoveResult } from './planning-rental-move-models.js';
import { premiumFinancingDefinitions, premiumFinancingResult } from './planning-premium-financing-models.js';
import { reverseEquityDefinitions, reverseEquityResult } from './planning-reverse-equity-models.js';
import { tradingEquityDefinitions, tradingEquityResult } from './planning-trading-equity-models.js';
import { taxableRealDefinitions, taxableRealResult } from './planning-taxable-real-models.js';
import { spousalCalendarDefinitions, spousalCalendarResult } from './planning-spousal-calendar-models.js';
import { spendingUtilityDefinitions, spendingUtilityResult } from './planning-spending-utility-models.js';
import { returnReadingDefinitions, returnReadingResult } from './planning-return-reading-models.js';
import { carEquityDefinitions, carEquityResult } from './planning-car-equity-models.js';
import { emergencyRecoveryDefinitions, emergencyRecoveryResult } from './planning-emergency-recovery-models.js';
import { mortgageChargeDefinitions, mortgageChargeResult } from './planning-mortgage-charge-models.js';
import { rateBenchmarkDefinitions, rateBenchmarkResult } from './planning-rate-benchmarks-models.js';
import { debtIncomeDefinitions, debtIncomeResult } from './planning-debt-income-models.js';
import { taxContributionDefinitions, taxContributionResult } from './planning-tax-contribution-models.js';
import { jointLongevityDefinitions, jointLongevityResult } from './planning-joint-longevity-models.js';
import { creditUseDefinitions, creditUseResult } from './planning-credit-use-models.js';
import { benefitsCreditGrowthDefinitions, benefitsCreditGrowthResult } from './planning-benefits-credit-growth-models.js';
import { variablePaymentDefinitions, variablePaymentResult } from './planning-variable-payment-models.js';
import { incomeLedgerDefinitions, incomeLedgerResult } from './planning-income-ledgers-models.js';
import { mortgageBudgetDefinitions, mortgageBudgetResult } from './planning-mortgage-budget-models.js';
import { savingRateDefinitions, savingRateResult } from './planning-saving-rate-models.js';
import { bankingHousingDefinitions, bankingHousingResult } from './planning-banking-housing-models.js';
import { marketResilienceDefinitions, marketResilienceResult } from './planning-market-resilience-models.js';
import { paymentOptionDefinitions, paymentOptionResult } from './planning-payment-options-models.js';
import { cashMechanicsDefinitions, cashMechanicsResult } from './planning-cash-mechanics-models.js';
import { wealthChoiceDefinitions, wealthChoiceResult } from './planning-wealth-choice-models.js';
import { wealthFlexDefinitions, wealthFlexResult } from './planning-wealth-flex-models.js';
import { calendarRiskDefinitions, calendarRiskResult } from './planning-calendar-risk-models.js';
import { savingsProjectDefinitions, savingsProjectResult } from './planning-savings-projects-models.js';
import { budgetExposureDefinitions, budgetExposureResult } from './planning-budget-exposure-models.js';
import { commitmentDefinitions, commitmentResult } from './planning-commitments-models.js';
import { wealthCareerDefinitions, wealthCareerResult } from './planning-wealth-career-models.js';
import { runwaySpendingDefinitions, runwaySpendingResult } from './planning-runway-spending-models.js';
import { incomeTimingDefinitions, incomeTimingResult } from './planning-income-timing-models.js';
import { habitsRecoveryDefinitions, habitsRecoveryResult } from './planning-habits-recovery-models.js';
import { savingObligationDefinitions, savingObligationResult } from './planning-saving-obligations-models.js';
import { choicesCashDefinitions, choicesCashResult } from './planning-choices-cash-models.js';
import { homeCarSurvivorDefinitions, homeCarSurvivorResult } from './planning-home-car-survivor-models.js';
import { protectionTransitionDefinitions, protectionTransitionResult } from './planning-protection-transition-models.js';
import { paymentWorkDefinitions, paymentWorkResult } from './planning-payments-work-models.js';
import { longerBudgetDefinitions, longerBudgetResult } from './planning-longer-budgets-models.js';
import { householdStepDefinitions, householdStepResult } from './planning-household-steps-models.js';
import { additionalDefinitions, additionalResult } from './planning-more-models.js';
import { decisionDefinitions, decisionResult } from './planning-decisions-models.js';
import { resilienceDefinitions, resilienceResult } from './planning-resilience-models.js';
import { lifeEventDefinitions, lifeEventResult } from './planning-life-events-models.js';
import { incomeCreditDefinitions, incomeCreditResult } from './planning-income-credit-models.js';
import { taxHomeDefinitions, taxHomeResult } from './planning-tax-home-models.js';
import { transitionDefinitions, transitionResult } from './planning-transitions-models.js';
import { fundingChoiceDefinitions, fundingChoiceResult } from './planning-funding-choices-models.js';
import { priorityDefinitions, priorityResult } from './planning-priorities-models.js';
import { accountUseDefinitions, accountUseResult } from './planning-account-use-models.js';
import { costTimingDefinitions, costTimingResult } from './planning-cost-timing-models.js';
// Educational scenarios, not forecasts. CAD throughout. Source observations are kept separate.
export const spendingSource = {
  publisher: 'Statistics Canada', period: '2021 and 2023', released: '2025-05-21', reviewed: '2026-10-25',
  url: 'https://www150.statcan.gc.ca/n1/pub/11-627-m/11-627-m2025026-eng.htm',
  scope: 'Survey of Household Spending; average annual household goods-and-services spending; provinces only. Nominal CAD. Not a recommended budget or a share of income.',
  rows: [
    {label:'Shelter', before:21106, after:24671}, {label:'Transportation', before:10099, after:12090},
    {label:'Food', before:10305, after:12046}, {label:'Household operations, furnishings and equipment', before:9158, after:9404},
    {label:'Other goods and services', before:8029, after:8361}, {label:'Recreation', before:4223, after:5231},
    {label:'Health care and personal care', before:4205, after:4947}
  ]
};
const coreDefinitions = {
  savings: {title:'Explore your savings path', fields:[
    ['monthly','Monthly contribution (CAD)',500,0,5000,50],['initial','Starting savings (CAD)',10000,0,1000000,1000],
    ['rate','Assumed annual return (%)',5,-5,12,.5],['years','Years of saving',30,5,40,1]
  ]},
  inflation: {title:'Explore purchasing power', fields:[
    ['cost','Monthly cost today (CAD)',3000,100,20000,100],['inflation','Annual inflation assumption (%)',3,0,8,.5],
    ['years','Planning horizon (years)',25,5,40,1],['return','Nominal annual return assumption (%)',5,0,12,.5]
  ]},
  emergency: {title:'Explore an emergency reserve', fields:[
    ['expenses','Monthly essential expenses (CAD)',3000,500,10000,100],['months','Months of expenses to cover',6,1,12,1],
    ['saved','Current reserve (CAD)',3000,0,100000,500],['monthly','Monthly amount saved (CAD)',500,50,3000,50]
  ]},
  debt: {title:'Explore a repayment schedule', fields:[
    ['balance','Starting debt (CAD)',10000,0,100000,500],['apr','Nominal annual interest rate (%)',18,0,36,.5],
    ['payment','Monthly payment (CAD)',300,50,5000,50],['extra','Extra monthly payment (CAD)',100,0,1000,50]
  ]},
  retirement: {title:'Explore return order and withdrawals', fields:[
    ['initial','Starting portfolio (CAD)',500000,100000,2000000,10000],['withdrawal','First annual withdrawal (CAD)',25000,0,100000,1000],
    ['inflation','Annual withdrawal increase (%)',2,0,5,.5]
  ]}
};
export const definitions = {...bondReinvestmentDefinitions,...adviceCostDefinitions,...rppStatisticsDefinitions,...renewalSupplementTimeDefinitions,...callableBondDefinitions,...vacationCommitmentDefinitions,...constructionQuoteDefinitions,...etfTrackingDefinitions,...rdspRepaymentDefinitions,...salesTaxDefinitions,...renewalAccessDefinitions,...diversificationDefinitions,...timingConventionDefinitions,...accessBridgeCoverDefinitions,...pensionWithdrawalProtectionDefinitions,...debtDenominatorDefinitions,...currencyTranslationDefinitions,...optionalCoverDefinitions,...currencyReturnDefinitions,...fundingBoundaryDefinitions,...everydayCapitalDefinitions,...accessRentDefinitions,...lookthroughDefinitions,...distributionDefinitions,...cardGraceDefinitions,...packagePriceDefinitions,...glideExposureDefinitions,...investmentBorrowingDefinitions,...cpiLevelDefinitions,...rentalDailyDefinitions,...loanFamilyDefinitions,...accruedInterestDefinitions,...rrspDeductionDefinitions,...rentalMoveDefinitions,...premiumFinancingDefinitions,...reverseEquityDefinitions,...tradingEquityDefinitions,...taxableRealDefinitions,...spousalCalendarDefinitions,...spendingUtilityDefinitions,...returnReadingDefinitions,...carEquityDefinitions,...emergencyRecoveryDefinitions,...mortgageChargeDefinitions,...rateBenchmarkDefinitions,...debtIncomeDefinitions,...taxContributionDefinitions,...jointLongevityDefinitions,...creditUseDefinitions,...benefitsCreditGrowthDefinitions,...variablePaymentDefinitions,...incomeLedgerDefinitions,...mortgageBudgetDefinitions,...savingRateDefinitions,...bankingHousingDefinitions,...marketResilienceDefinitions,...paymentOptionDefinitions,...cashMechanicsDefinitions,...wealthChoiceDefinitions,...calendarRiskDefinitions,...savingsProjectDefinitions,...budgetExposureDefinitions,...coreDefinitions,...wealthFlexDefinitions,...commitmentDefinitions,...wealthCareerDefinitions,...runwaySpendingDefinitions,...incomeTimingDefinitions,...habitsRecoveryDefinitions,...additionalDefinitions,...decisionDefinitions,...resilienceDefinitions,...lifeEventDefinitions,...incomeCreditDefinitions,...taxHomeDefinitions,...transitionDefinitions,...fundingChoiceDefinitions,...priorityDefinitions,...accountUseDefinitions,...costTimingDefinitions,...householdStepDefinitions,...longerBudgetDefinitions,...paymentWorkDefinitions,...protectionTransitionDefinitions,...homeCarSurvivorDefinitions,...choicesCashDefinitions,...savingObligationDefinitions};
export const wholeInputKeys=['maturity','horizon','adviceYears','adviceReviewEvery','rppEndYear','bridgeEnd','laterStart','callYear','assessmentYear','usedNights','trackingYears','premiumPeriodYears','accessBillDay','quoteLoanYears','quoteCompounds','inflationBlockYears','pensionStartAge','bridgeStopAge','laterStartAge','pensionYears','lossYear','cppStart','coverYears','holders','taxDue','tripDue','batchYears','batchGap','realDebtYears','assessmentSpacing','assessmentParts','assessmentFirstMonth','accessDay','postedDay','graceDays','monthlyGrams','newGrams','oldGrams','glideYears','refundArrival','advanceMonths','ccbLagDays','refundMonth','reverseYears','units','orders','interestYears','withdrawYear','contributionMonth','withdrawMonth','depositMonth','tradeMonths','recoveryYears','chargeMonths','days','balloonMonths','contributionDelay','oneYear','snapshotDay','payDay','receiptLag','paymentDay','reportDay','cycles','vacantMonths','firstSalaryDay','bondYears','cashYear','financeMonths','transferCount','horizonMonths','financeMonths','interruptionMonths','shockMonth','workDaysA','workDaysB','workWeeks','phaseMonths','takeoverMonth','useMonths','paymentYears','settlementMonth','supportDelay','supportMonths','jobMonth','careYear','guests','eventMonth','changeAfter','firstPayday','billDay','years','months','study','age','loanYears','claims','paidMonths','prepareMonths','currentYears','newYears','lowMonths','wait','startYear','workYears','dueMonth','receiptMonth','sickMonths','benefitMonths','deadlineA','deadlineB','deadlineC','amortYears','promoMonths','claimMonths','delay','repayMonths','collectionDelay','roofCycle','heatCycle','applianceCycle','savingMonth','loanMonths','gapWeeks','standardWeeks','extendedWeeks','startAge','previousYears','delayYears','remainingYears','firstYear','giftYear','shockMonthA','shockMonthB','firstPayDay','savingDay'];
export function defaults(kind) { return Object.fromEntries(definitions[kind].fields.map(([key,,value])=>[key,value])); }
export function validInputs(kind, input) {
  return definitions[kind].fields.every(([key,,,min,max])=> Number.isFinite(input[key]) && input[key]>=min && input[key]<=max && (!wholeInputKeys.includes(key)||Number.isInteger(input[key])));
}
export function savingsPath({initial,monthly,rate,years}, delay=0) {
  const monthlyRate=Math.expm1(Math.log1p(rate/100)/12);
  let balance=initial, contributions=initial;
  const rows=[{x:0,value:balance,contributions}];
  for(let month=1;month<=years*12;month++) {
    const deposit=month>delay*12?monthly:0;
    balance=balance*(1+monthlyRate)+deposit; contributions+=deposit;
    if(month%12===0)rows.push({x:month/12,value:balance,contributions});
  }
  return rows;
}
export function debtSchedule(balance, apr, payment, limit=600) {
  const monthlyRate=apr/1200;
  let outstanding=balance, interest=0, paid=0;
  const rows=[{x:0,value:outstanding}];
  if(balance===0)return {rows,months:0,interest,paid,complete:true};
  const amortizing=payment>balance*monthlyRate;
  for(let month=1;month<=(amortizing?limit:12);month++) {
    const charge=outstanding*monthlyRate;
    const actual=Math.min(payment,outstanding+charge);
    interest+=charge;paid+=actual;outstanding=Math.max(0,outstanding+charge-actual);
    if(outstanding<1e-8)outstanding=0;
    rows.push({x:month,value:outstanding});
    if(!outstanding)return {rows,months:month,interest,paid,complete:true};
  }
  return {rows,months:null,interest,paid,complete:false};
}
export const earlyLossReturns=[-.20,-.10,.06,.08,.10,.12,.07,.05,.09,.04];
export function retirementPath(initial, withdrawal, inflation, returns) {
  let balance=initial, paid=0, shortfall=0;
  const rows=[{x:0,value:balance}];
  returns.forEach((rate,index)=>{
    const requested=withdrawal*(1+inflation/100)**index;
    const actual=Math.min(balance,requested);
    paid+=actual;shortfall+=requested-actual;
    balance=(balance-actual)*(1+rate);
    rows.push({x:index+1,value:balance});
  });
  return {rows,paid,shortfall};
}
const series = (name, rows, extra={}) => ({name,rows,...extra});
export function planningResult(kind,input=defaults(kind)) {
  if(!validInputs(kind,input))throw Error('Inputs are outside the supported scenario range.');
  if(bondReinvestmentDefinitions[kind])return bondReinvestmentResult(kind,input);
  if(adviceCostDefinitions[kind])return adviceCostResult(kind,input);
  if(rppStatisticsDefinitions[kind])return rppCountsResult(kind,input);
  if(renewalSupplementTimeDefinitions[kind])return renewalSupplementTimeResult(kind,input);
  if(callableBondDefinitions[kind])return callableBondResult(kind,input);
  if(vacationCommitmentDefinitions[kind])return vacationCommitmentResult(kind,input);
  if(constructionQuoteDefinitions[kind])return constructionQuoteResult(kind,input);
  if(etfTrackingDefinitions[kind])return etfTrackingResult(kind,input);
  if(rdspRepaymentDefinitions[kind])return rdspRepaymentResult(kind,input);
  if(salesTaxDefinitions[kind])return salesTaxResult(kind,input);
  if(renewalAccessDefinitions[kind])return renewalAccessResult(kind,input);
  if(diversificationDefinitions[kind])return diversificationResult(kind,input);
  if(timingConventionDefinitions[kind])return timingConventionResult(kind,input);
  if(accessBridgeCoverDefinitions[kind])return accessBridgeCoverResult(kind,input);
  if(debtDenominatorDefinitions[kind])return debtDenominatorResult(kind,input);
  if(currencyTranslationDefinitions[kind])return currencyTranslationResult(kind,input);
  if(optionalCoverDefinitions[kind])return optionalCoverResult(kind,input);
  if(currencyReturnDefinitions[kind])return currencyReturnResult(kind,input);
  if(everydayCapitalDefinitions[kind])return everydayCapitalResult(kind,input);
  if(accessRentDefinitions[kind])return accessRentResult(kind,input);
  if(lookthroughDefinitions[kind])return lookthroughResult(kind,input);
  if(distributionDefinitions[kind])return distributionResult(kind,input);
  if(cardGraceDefinitions[kind])return cardGraceResult(kind,input);
  if(packagePriceDefinitions[kind])return packagePriceResult(kind,input);
  if(glideExposureDefinitions[kind])return glideExposureResult(kind,input);
  if(pensionWithdrawalProtectionDefinitions[kind])return pensionWithdrawalProtectionResult(kind,input);
  if(investmentBorrowingDefinitions[kind])return investmentBorrowingResult(kind,input);
  if(cpiLevelDefinitions[kind])return cpiLevelResult(kind,input);
  if(rentalDailyDefinitions[kind])return rentalDailyResult(kind,input);
  if(fundingBoundaryDefinitions[kind])return fundingBoundaryResult(kind,input);
  if(loanFamilyDefinitions[kind])return loanFamilyResult(kind,input);
  if(accruedInterestDefinitions[kind])return accruedInterestResult(kind,input);
  if(rrspDeductionDefinitions[kind])return rrspDeductionResult(kind,input);
  if(rentalMoveDefinitions[kind])return rentalMoveResult(kind,input);
  if(premiumFinancingDefinitions[kind])return premiumFinancingResult(kind,input);
  if(reverseEquityDefinitions[kind])return reverseEquityResult(kind,input);
  if(tradingEquityDefinitions[kind])return tradingEquityResult(kind,input);
  if(taxableRealDefinitions[kind])return taxableRealResult(kind,input);
  if(spousalCalendarDefinitions[kind])return spousalCalendarResult(kind,input);
  if(spendingUtilityDefinitions[kind])return spendingUtilityResult(kind,input);
  if(returnReadingDefinitions[kind])return returnReadingResult(kind,input);
  if(carEquityDefinitions[kind])return carEquityResult(kind,input);
  if(emergencyRecoveryDefinitions[kind])return emergencyRecoveryResult(kind,input);
  if(mortgageChargeDefinitions[kind])return mortgageChargeResult(kind,input);
  if(rateBenchmarkDefinitions[kind])return rateBenchmarkResult(kind,input);
  if(debtIncomeDefinitions[kind])return debtIncomeResult(kind,input);
  if(taxContributionDefinitions[kind])return taxContributionResult(kind,input);
  if(jointLongevityDefinitions[kind])return jointLongevityResult(kind,input);
  if(creditUseDefinitions[kind])return creditUseResult(kind,input);
  if(benefitsCreditGrowthDefinitions[kind])return benefitsCreditGrowthResult(kind,input);
  if(variablePaymentDefinitions[kind])return variablePaymentResult(kind,input);
  if(incomeLedgerDefinitions[kind])return incomeLedgerResult(kind,input);
  if(mortgageBudgetDefinitions[kind])return mortgageBudgetResult(kind,input);
  if(savingRateDefinitions[kind])return savingRateResult(kind,input);
  if(bankingHousingDefinitions[kind])return bankingHousingResult(kind,input);
  if(marketResilienceDefinitions[kind])return marketResilienceResult(kind,input);
  if(paymentOptionDefinitions[kind])return paymentOptionResult(kind,input);
  if(cashMechanicsDefinitions[kind])return cashMechanicsResult(kind,input);
  if(wealthChoiceDefinitions[kind])return wealthChoiceResult(kind,input);
  if(budgetExposureDefinitions[kind])return budgetExposureResult(kind,input);
  if(runwaySpendingDefinitions[kind])return runwaySpendingResult(kind,input);
  if(incomeTimingDefinitions[kind])return incomeTimingResult(kind,input);
  if(commitmentDefinitions[kind])return commitmentResult(kind,input);
  if(calendarRiskDefinitions[kind])return calendarRiskResult(kind,input);
  if(habitsRecoveryDefinitions[kind])return habitsRecoveryResult(kind,input);
  if(wealthFlexDefinitions[kind])return wealthFlexResult(kind,input);
  if(additionalDefinitions[kind])return additionalResult(kind,input);
  if(decisionDefinitions[kind])return decisionResult(kind,input);
  if(resilienceDefinitions[kind])return resilienceResult(kind,input);
  if(lifeEventDefinitions[kind])return lifeEventResult(kind,input);
  if(incomeCreditDefinitions[kind])return incomeCreditResult(kind,input);
  if(taxHomeDefinitions[kind])return taxHomeResult(kind,input);
  if(transitionDefinitions[kind])return transitionResult(kind,input);
  if(fundingChoiceDefinitions[kind])return fundingChoiceResult(kind,input);
  if(priorityDefinitions[kind])return priorityResult(kind,input);
  if(accountUseDefinitions[kind])return accountUseResult(kind,input);
  if(costTimingDefinitions[kind])return costTimingResult(kind,input);
  if(householdStepDefinitions[kind])return householdStepResult(kind,input);
  if(longerBudgetDefinitions[kind])return longerBudgetResult(kind,input);
  if(paymentWorkDefinitions[kind])return paymentWorkResult(kind,input);
  if(protectionTransitionDefinitions[kind])return protectionTransitionResult(kind,input);
  if(homeCarSurvivorDefinitions[kind])return homeCarSurvivorResult(kind,input);
  if(choicesCashDefinitions[kind])return choicesCashResult(kind,input);
  if(wealthCareerDefinitions[kind])return wealthCareerResult(kind,input);
  if(savingsProjectDefinitions[kind])return savingsProjectResult(kind,input);
  if(savingObligationDefinitions[kind])return savingObligationResult(kind,input);
  if(kind==='savings') {
    const path=savingsPath(input), end=path.at(-1);
    return {metrics:[['Ending savings',end.value,'money'],['Contributed',end.contributions,'money'],['Modeled growth',end.value-end.contributions,'money']], note:'Hypothetical constant effective annual return, converted to an equivalent monthly rate. Contributions arrive at month-end; starting savings are invested immediately. Nominal CAD before fees, tax and inflation. No probabilities are assigned.', charts:[
      {id:'savings-path',type:'line',title:'How savings build over time',unit:'money',xLabel:'Years from today',series:[series('Portfolio value',path),series('Money contributed',path.map(p=>({x:p.x,value:p.contributions})),{dash:true})]},
      {id:'savings-delay',type:'bar',title:'What changes if contributions start later?',unit:'money',rows:[0,5,10].map(delay=>({label:delay?'Start contributions in '+delay+' years':'Start contributions now',value:savingsPath(input,delay).at(-1).value})),note:'The same starting savings remain invested in every case. Delayed contributions are skipped, not caught up. Compare at the same ending year.'},
      {id:'savings-grid',type:'heatmap',title:'Time and return assumptions, compared',unit:'money',columns:[10,20,30,40].map(y=>y+' years'),rows:[0,3,6,9].map(r=>({label:r+'% return',values:[10,20,30,40].map(y=>savingsPath({...input,rate:r,years:y}).at(-1).value)})),note:'Separate scenario grid: selected starting savings and monthly contribution, with the displayed horizons and annual returns. These are assumptions, not confidence intervals.'}
    ]};
  }
  if(kind==='inflation') {
    const factor=(1+input.inflation/100)**input.years;
    const real=(1+input.return/100)/(1+input.inflation/100)-1;
    return {metrics:[['Future monthly cost',input.cost*factor,'money'],['Today’s CAD 10,000 buys',10000/factor,'money'],['Real annual return',real,'percent']], note:'Constant inflation and return assumptions; annual compounding. The CAD 10,000 illustration earns zero nominal interest. The return comparison is before tax and fees. This is not a forecast of CPI or your personal inflation rate.', charts:[
      {id:'inflation-cost',type:'line',title:'The future cost of the same monthly budget',unit:'money',xLabel:'Years from today',series:[series('Monthly cost',Array.from({length:input.years+1},(_,x)=>({x,value:input.cost*(1+input.inflation/100)**x}))),series('Cost today',Array.from({length:input.years+1},(_,x)=>({x,value:input.cost})),{dash:true})]},
      {id:'inflation-cash',type:'bar',title:'Purchasing power of unchanged CAD 10,000',unit:'money',rows:[0,10,20,30].map(y=>({label:y?'After '+y+' years':'Today',value:10000/(1+input.inflation/100)**y})),note:'Zero nominal return. Values are expressed in today’s dollars. This chart uses fixed 10-, 20- and 30-year comparisons.'},
      {id:'inflation-real',type:'heatmap',title:'Nominal returns translated into real returns',unit:'percent',signed:true,columns:[2,4,6,8].map(r=>r+'%'),rows:[1,2,3,4].map(i=>({label:i+'% inflation',values:[2,4,6,8].map(r=>(1+r/100)/(1+i/100)-1)})),note:'Real return = (1 + nominal return) ÷ (1 + inflation) − 1. Columns show nominal annual returns; rows show annual inflation. Fixed comparison grid, before tax and fees. Signed labels distinguish gains from losses in purchasing power.'}
    ]};
  }
  if(kind==='emergency') {
    const target=input.expenses*input.months, needed=Math.max(0,Math.ceil((target-input.saved)/input.monthly));
    const horizon=Math.min(120,Math.max(12,needed+3));
    return {metrics:[['Reserve target',target,'money'],['Months already covered',input.saved/input.expenses,'decimal'],['Months to target',needed,'integer']],note:'Your reserve model is a hypothetical scenario in CAD. It assumes no interest, no withdrawals and unchanged essential expenses. New deposits stop at the target; an existing reserve above target is retained. The spending survey chart is separate observed evidence.', charts:[
      {id:'household-spending',type:'groupbar',title:'How Canadian household spending changed',unit:'money',seriesNames:['2021','2023'],rows:spendingSource.rows.map(r=>({label:r.label,values:[r.before,r.after]})),source:spendingSource.url,note:spendingSource.scope+' Released 21 May 2025; reviewed 25 October 2026. These are annual spending amounts, not inflation-adjusted changes. Reported uncertainty intervals are not supplied on the cited infographic.'},
      {id:'reserve-progress',type:'line',title:'Building your own reserve',unit:'money',xLabel:'Months from today',series:[series('Reserve balance',Array.from({length:horizon+1},(_,x)=>({x,value:Math.max(input.saved,Math.min(target,input.saved+input.monthly*x))}))),series('Your target',Array.from({length:horizon+1},(_,x)=>({x,value:target})),{dash:true})],note:needed>120?'Only the first 120 months are shown. The estimated target date is later.':'Deposits stop when the target is reached. This is a cash-flow scenario, not a savings-account quote.'},
      {id:'reserve-stress',type:'bar',title:'If essential expenses are higher',unit:'money',rows:[0,.1,.2].map(r=>({label:r?'Expenses +'+r*100+'%':'Selected expenses',value:input.expenses*(1+r)*input.months})),note:'The selected number of coverage months stays fixed. These are expense stresses, not statistical forecasts.'}
    ]};
  }
  if(kind==='debt') {
    const base=debtSchedule(input.balance,input.apr,input.payment), extra=debtSchedule(input.balance,input.apr,input.payment+input.extra);
    return {metrics:[['Base payoff time',base.months, 'months'],['With extra payment',extra.months,'months'],['Interest saved',base.complete&&extra.complete?base.interest-extra.interest:null,'money']],note:'Simplified monthly model: interest = opening balance × nominal annual rate ÷ 12, then a month-end payment capped at the amount owed. No fees, new charges, daily accrual or rate changes. Unpaid schedules are capped at 600 months; non-reducing schedules show 12 months. This is not a lender quote.', charts:[
      {id:'debt-path',type:'line',title:'Two repayment paths for the same debt',unit:'money',xLabel:'Months from today',series:[series('Selected payment',base.rows),series('Selected + extra',extra.rows,{dash:true})]},
      {id:'debt-cost',type:'stackbar',title:'Principal and lifetime interest paid',unit:'money',seriesNames:['Principal','Interest'],rows:[{label:'Selected payment',values:base.complete?[input.balance,base.interest]:null},{label:'With extra payment',values:extra.complete?[input.balance,extra.interest]:null}],note:'Totals appear only for a completed payoff schedule. “Not repaid” is not zero interest. The final payment is reduced to the amount owed.'},
      {id:'debt-grid',type:'heatmap',title:'Payoff months across rates and payments',unit:'months',columns:[200,300,400,500].map(p=>'$'+p),rows:[6,12,18,24].map(r=>({label:r+'% rate',values:[200,300,400,500].map(p=>debtSchedule(input.balance,r,p).months)})),note:'Separate grid using your starting balance: columns show fixed monthly payments in CAD; rows show nominal annual rates. NR means not repaid within the 600-month model limit, including payments that do not reduce principal.'}
    ]};
  }
  if(kind==='retirement') {
    const late=[...earlyLossReturns].reverse(), a=retirementPath(input.initial,input.withdrawal,input.inflation,earlyLossReturns), b=retirementPath(input.initial,input.withdrawal,input.inflation,late);
    const noA=retirementPath(input.initial,0,0,earlyLossReturns), noB=retirementPath(input.initial,0,0,late);
    return {metrics:[['Early-loss ending balance',a.rows.at(-1).value,'money'],['Late-loss ending balance',b.rows.at(-1).value,'money'],['Unfunded withdrawals: early / late',null,'custom',Math.round(a.shortfall).toLocaleString('en-CA')+' / '+Math.round(b.shortfall).toLocaleString('en-CA')+' CAD']],note:'Ten invented annual returns, with their order reversed. Withdrawals occur at the start of each year and rise by the selected annual rate. Return applies to the remaining balance; assets cannot fall below zero. Any unfunded spending is reported separately. No pensions, tax or fees. This is not a safe-withdrawal-rate estimate or a probability of success.',charts:[
      {id:'retirement-path',type:'line',title:'Same returns, different retirement paths',unit:'money',xLabel:'Year of retirement',series:[series('Losses early',a.rows),series('Losses later',b.rows,{dash:true})]},
      {id:'retirement-returns',type:'returns',title:'The same ten returns, in reverse order',unit:'percent',seriesNames:['Losses early','Losses later'],rows:earlyLossReturns.map((r,i)=>({label:'Y'+(i+1),values:[r,late[i]]})),note:'Hand-picked annual total-return assumptions: no historical market series is used. Both sequences contain exactly the same returns and have the same no-withdrawal compound return.'},
      {id:'retirement-control',type:'bar',title:'Isolating the effect of withdrawals',unit:'money',rows:[{label:'No withdrawals · losses early',value:noA.rows.at(-1).value},{label:'No withdrawals · losses later',value:noB.rows.at(-1).value},{label:'Withdrawals · losses early',value:a.rows.at(-1).value},{label:'Withdrawals · losses later',value:b.rows.at(-1).value}],note:'The two no-withdrawal endpoints match up to rounding. When spending exceeds available assets, funded withdrawals differ; inspect the separate unfunded-spending metric.'}
    ]};
  }
  throw Error('Unknown planning topic.');
}
