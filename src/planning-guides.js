import { unpaidTimeGuides } from './planning-unpaid-time-guides.js';
import { capitalLossGuides } from './planning-capital-loss-guides.js';
import { maturityAverageGuides } from './planning-maturity-average-guides.js';
import { repeatedRiskGuides } from './planning-repeated-risk-guides.js';
import { wholeReinvestGuides } from './planning-whole-reinvest-guides.js';
import { repeatRiskGuides } from './planning-repeat-risk-guides.js';
import { balancedTimingGuides } from './planning-balanced-timing-guides.js';
import { rewardRedemptionGuides } from './planning-reward-redemption-guides.js';
import { shareSplitGuides } from './planning-share-split-guides.js';
import { flatLoanGuides } from './planning-flat-loan-guides.js';
import { cppAmountsGuides } from './planning-cpp-amounts-guides.js';
import { disabilityOffsetGuides } from './planning-disability-offset-guides.js';
import { inventoryCashGuides } from './planning-inventory-cash-guides.js';
import { promoConditionGuides } from './planning-promo-condition-guides.js';
import { forwardRateGuides } from './planning-forward-rate-guides.js';
import { repairConditionGuides } from './planning-repair-condition-guides.js';
import { paymentPauseGuides } from './planning-payment-pause-guides.js';
import { inventoryCycleGuides } from './planning-inventory-cycle-guides.js';
import { feeSlicesGuides } from './planning-fee-slices-guides.js';
import { tfsaKindGuides } from './planning-tfsa-kind-guides.js';
import { bondAccrualGuides } from './planning-bond-accrual-guides.js';
import { expectationsGuides } from './planning-expectations-guides.js';
import { bankWaiverGuides } from './planning-bank-waiver-guides.js';
import { feeWaiverGuides } from './planning-fee-waiver-guides.js';
import { adjustedIncomeGuides } from './planning-adjusted-income-guides.js';
import { foodCashGuides } from './planning-food-cash-guides.js';
import { familyReceivableGuides } from './planning-family-receivable-guides.js';
import { performanceFeeGuides } from './planning-performance-fee-guides.js';
import { priceBasisGuides } from './planning-price-basis-guides.js';
import { taxIndexationGuides } from './planning-tax-indexation-guides.js';
import { leaseDistanceGuides } from './planning-lease-distance-guides.js';
import { rrspRoomGuides } from './planning-rrsp-room-guides.js';
import { premiumBondGuides } from './planning-premium-bond-guides.js';
import { discountBasisGuides } from './planning-discount-basis-guides.js';
import { retirementAgeGuides } from './planning-retirement-age-guides.js';
import { unemploymentDurationGuides } from './planning-unemployment-duration-guides.js';
import { annuityGuaranteeGuides } from './planning-annuity-guarantee-guides.js';
import { lifeTableGuides } from './planning-life-table-guides.js';
import { depositMapGuides } from './planning-deposit-map-guides.js';
import { benefitCoordinationGuides } from './planning-benefit-coordination-guides.js';
import { homeownershipAgeGuides } from './planning-homeownership-age-guides.js';
import { collateralGuides } from './planning-collateral-guides.js';
import { collateralRepairGuides } from './planning-collateral-repair-guides.js';
import { buybackDilutionGuides } from './planning-buyback-dilution-guides.js';
import { unitCostGuides } from './planning-unit-cost-guides.js';
import { wealthSharesGuides } from './planning-wealth-shares-guides.js';
import { averageCostGuides } from './planning-average-cost-guides.js';
import { rrifKindGuides } from './planning-rrif-kind-guides.js';
import { employeeOptionGuides } from './planning-employee-option-guides.js';
import { shareVestingGuides } from './planning-share-vesting-guides.js';
import { creditSettlementGuides } from './planning-credit-settlement-guides.js';
import { cardHoldGuides } from './planning-card-holds-guides.js';
import { labourBudgetGuides } from './planning-labour-budget-guides.js';
import { sensitivityGuides } from './planning-sensitivity-guides.js';
import { tuitionCreditCapacityGuides } from './planning-tuition-credit-capacity-guides.js';
import { tailShapeGuides } from './planning-tail-shape-guides.js';
import { ageIncomeGuides } from './planning-age-income-guides.js';
import { earningsCashflowGuides } from './planning-earnings-cashflow-guides.js';
import { multipleIrrGuides } from './planning-multiple-irr-guides.js';
import { repairReplaceGuides } from './planning-repair-replace-guides.js';
import { stagedDrawGuides } from './planning-staged-draw-guides.js';
import { indexedBondGuides } from './planning-indexed-bond-guides.js';
import { fraudGuides } from './planning-fraud-guides.js';
import { savingDistributionGuides } from './planning-saving-distribution-guides.js';
import { disabilityPrevalenceGuides } from './planning-disability-prevalence-guides.js';
import { gainTimingGuides } from './planning-gain-timing-guides.js';
import { settlementCashGuides } from './planning-settlement-cash-guides.js';
import { paymentValueGuides } from './planning-payment-value-guides.js';
import { billableCapacityGuides } from './planning-billable-capacity-guides.js';
import { warrantyRiskGuides } from './planning-warranty-risk-guides.js';
import { deferredCashGuides } from './planning-deferred-cash-guides.js';
import { tfsaLossGuides } from './planning-tfsa-loss-guides.js';
import { warrantyGuides } from './planning-warranty-guides.js';
import { ladderRenewalGuides } from './planning-ladder-renewal-guides.js';
import { bookingRefundGuides } from './planning-booking-refund-guides.js';
import { adviceFeeCashGuides } from './planning-advice-fee-cash-guides.js';
import { illnessCashGuides } from './planning-illness-cash-guides.js';
import { cardLedgerGuides } from './planning-card-ledger-guides.js';
import { assetResilienceGuides } from './planning-asset-resilience-guides.js';
import { jointIncomeGuides } from './planning-joint-income-guides.js';
import { fundCostBaseGuides } from './planning-fund-cost-base-guides.js';
import { charitableGuides } from './planning-charitable-guides.js';
import { bondPricingGuides } from './planning-bond-pricing-guides.js';
import { bondReinvestmentGuides } from './planning-bond-reinvestment-guides.js';
import { adviceCostGuides } from './planning-advice-cost-guides.js';
import { rppStatisticsGuides } from './planning-rpp-statistics-guides.js';
import { renewalSupplementTimeGuides } from './planning-renewal-supplement-time-guides.js';
import { callableBondGuides } from './planning-callable-bond-guides.js';
import { vacationCommitmentGuides } from './planning-vacation-commitment-guides.js';
import { constructionQuoteGuides } from './planning-construction-quote-guides.js';
import { etfTrackingGuides } from './planning-etf-tracking-guides.js';
import { rdspRepaymentGuides } from './planning-rdsp-repayment-guides.js';
import { salesTaxGuides } from './planning-sales-tax-guides.js';
import { renewalAccessGuides } from './planning-renewal-access-guides.js';
import { diversificationGuides } from './planning-diversification-guides.js';
import { timingConventionGuides } from './planning-timing-conventions-guides.js';
import { accessBridgeCoverGuides } from './planning-access-bridge-cover-guides.js';
import { pensionWithdrawalProtectionGuides } from './planning-pension-withdrawal-protection-guides.js';
import { debtDenominatorGuides } from './planning-debt-denominators-guides.js';
import { currencyTranslationGuides } from './planning-currency-translation-guides.js';
import { optionalCoverGuides } from './planning-optional-cover-guides.js';
import { currencyReturnGuides } from './planning-currency-return-guides.js';
import { fundingBoundaryGuides } from './planning-funding-boundaries-guides.js';
import { everydayCapitalGuides } from './planning-everyday-capital-guides.js';
import { accessRentGuides } from './planning-access-rent-guides.js';
import { lookthroughGuides } from './planning-lookthrough-guides.js';
import { distributionGuides } from './planning-distribution-guides.js';
import { cardGraceGuides } from './planning-card-grace-guides.js';
import { packagePriceGuides } from './planning-package-price-guides.js';
import { glideExposureGuides } from './planning-glide-exposure-guides.js';
import { investmentBorrowingGuides } from './planning-investment-borrowing-guides.js';
import { cpiLevelGuides } from './planning-cpi-level-guides.js';
import { rentalDailyGuides } from './planning-rental-daily-guides.js';
import { loanFamilyGuides } from './planning-loan-family-guides.js';
import { accruedInterestGuides } from './planning-accrued-interest-guides.js';
import { rrspDeductionGuides } from './planning-rrsp-deduction-guides.js';
import { rentalMoveGuides } from './planning-rental-move-guides.js';
import { premiumFinancingGuides } from './planning-premium-financing-guides.js';
import { reverseEquityGuides } from './planning-reverse-equity-guides.js';
import { tradingEquityGuides } from './planning-trading-equity-guides.js';
import { taxableRealGuides } from './planning-taxable-real-guides.js';
import { spousalCalendarGuides } from './planning-spousal-calendar-guides.js';
import { spendingUtilityGuides } from './planning-spending-utility-guides.js';
import { returnReadingGuides } from './planning-return-reading-guides.js';
import { carEquityGuides } from './planning-car-equity-guides.js';
import { emergencyRecoveryGuides } from './planning-emergency-recovery-guides.js';
import { mortgageChargeGuides } from './planning-mortgage-charge-guides.js';
import { rateBenchmarkGuides } from './planning-rate-benchmarks-guides.js';
import { debtIncomeGuides } from './planning-debt-income-guides.js';
import { taxContributionGuides } from './planning-tax-contribution-guides.js';
import { jointLongevityGuides } from './planning-joint-longevity-guides.js';
import { creditUseGuides } from './planning-credit-use-guides.js';
import { benefitsCreditGrowthGuides } from './planning-benefits-credit-growth-guides.js';
import { variablePaymentGuides } from './planning-variable-payment-guides.js';
import { incomeLedgerGuides } from './planning-income-ledgers-guides.js';
import { mortgageBudgetGuides } from './planning-mortgage-budget-guides.js';
import { savingRateGuides } from './planning-saving-rate-guides.js';
import { bankingHousingGuides } from './planning-banking-housing-guides.js';
import { marketResilienceGuides } from './planning-market-resilience-guides.js';
import { paymentOptionGuides } from './planning-payment-options-guides.js';
import { cashMechanicsGuides } from './planning-cash-mechanics-guides.js';
import { wealthChoiceGuides } from './planning-wealth-choice-guides.js';
import { wealthFlexGuides } from './planning-wealth-flex-guides.js';
import { calendarRiskGuides } from './planning-calendar-risk-guides.js';
import { savingsProjectGuides } from './planning-savings-projects-guides.js';
import { budgetExposureGuides } from './planning-budget-exposure-guides.js';
import { commitmentGuides } from './planning-commitments-guides.js';
import { wealthCareerGuides } from './planning-wealth-career-guides.js';
import { runwaySpendingGuides } from './planning-runway-spending-guides.js';
import { incomeTimingGuides } from './planning-income-timing-guides.js';
import { habitsRecoveryGuides } from './planning-habits-recovery-guides.js';
import { savingObligationGuides } from './planning-saving-obligations-guides.js';
import { choicesCashGuides } from './planning-choices-cash-guides.js';
import { homeCarSurvivorGuides } from './planning-home-car-survivor-guides.js';
import { protectionTransitionGuides } from './planning-protection-transition-guides.js';
import { paymentWorkGuides } from './planning-payments-work-guides.js';
import { longerBudgetGuides } from './planning-longer-budgets-guides.js';
import { householdStepGuides } from './planning-household-steps-guides.js';
import { additionalPlanningGuides } from './planning-more-guides.js';
import { decisionGuides } from './planning-decisions-guides.js';
import { resilienceGuides } from './planning-resilience-guides.js';
import { lifeEventGuides } from './planning-life-events-guides.js';
import { incomeCreditGuides } from './planning-income-credit-guides.js';
import { taxHomeGuides } from './planning-tax-home-guides.js';
import { transitionGuides } from './planning-transitions-guides.js';
import { fundingChoiceGuides } from './planning-funding-choices-guides.js';
import { priorityGuides } from './planning-priorities-guides.js';
import { accountUseGuides } from './planning-account-use-guides.js';
import { costTimingGuides } from './planning-cost-timing-guides.js';
export const planningGuides = [
  ...unpaidTimeGuides,
  ...capitalLossGuides,
  ...maturityAverageGuides,
  ...repeatedRiskGuides,
  ...wholeReinvestGuides,
  ...repeatRiskGuides,
  ...balancedTimingGuides,
  ...rewardRedemptionGuides,
  ...shareSplitGuides,
  ...flatLoanGuides,
  ...cppAmountsGuides,
  ...disabilityOffsetGuides,
  ...inventoryCashGuides,
  ...promoConditionGuides,
  ...forwardRateGuides,
  ...repairConditionGuides,
  ...paymentPauseGuides,
  ...inventoryCycleGuides,
  ...feeSlicesGuides,
  ...tfsaKindGuides,
  ...bondAccrualGuides,
  ...expectationsGuides,
  ...bankWaiverGuides,
  ...feeWaiverGuides,
  ...adjustedIncomeGuides,
  ...foodCashGuides,
  ...familyReceivableGuides,
  ...performanceFeeGuides,
  ...priceBasisGuides,
  ...taxIndexationGuides,
  ...leaseDistanceGuides,
  ...rrspRoomGuides,
  ...premiumBondGuides,
  ...discountBasisGuides,
  ...retirementAgeGuides,
  ...unemploymentDurationGuides,
  ...annuityGuaranteeGuides,
  ...lifeTableGuides,
  ...depositMapGuides,
  ...benefitCoordinationGuides,
  ...homeownershipAgeGuides,
  ...collateralGuides,
  ...collateralRepairGuides,
  ...buybackDilutionGuides,
  ...unitCostGuides,
  ...wealthSharesGuides,
  ...averageCostGuides,
  ...rrifKindGuides,
  ...employeeOptionGuides,
  ...shareVestingGuides,
  ...creditSettlementGuides,
  ...cardHoldGuides,
  ...labourBudgetGuides,
  ...sensitivityGuides,
  ...tuitionCreditCapacityGuides,
  ...tailShapeGuides,
  ...ageIncomeGuides,
  ...earningsCashflowGuides,
  ...multipleIrrGuides,
  ...repairReplaceGuides,
  ...stagedDrawGuides,
  ...indexedBondGuides,
  ...fraudGuides,
  ...savingDistributionGuides,
  ...disabilityPrevalenceGuides,
  ...gainTimingGuides,
  ...settlementCashGuides,
  ...paymentValueGuides,
  ...billableCapacityGuides,
  ...warrantyRiskGuides,
  ...deferredCashGuides,
  ...tfsaLossGuides,
  ...warrantyGuides,
  ...ladderRenewalGuides,
  ...bookingRefundGuides,
  ...adviceFeeCashGuides,
  ...illnessCashGuides,
  ...cardLedgerGuides,
  ...assetResilienceGuides,
  ...jointIncomeGuides,
  ...fundCostBaseGuides,
  ...charitableGuides,
  ...bondPricingGuides,
  ...bondReinvestmentGuides,
  ...adviceCostGuides,
  ...rppStatisticsGuides,
  ...renewalSupplementTimeGuides,
  ...callableBondGuides,
  ...vacationCommitmentGuides,
  ...constructionQuoteGuides,
  ...etfTrackingGuides,
  ...rdspRepaymentGuides,
  ...salesTaxGuides,
  ...renewalAccessGuides,
  ...diversificationGuides,
  ...timingConventionGuides,
  ...accessBridgeCoverGuides,
  ...pensionWithdrawalProtectionGuides,
  ...debtDenominatorGuides,
  ...currencyTranslationGuides,
  ...optionalCoverGuides,
  ...currencyReturnGuides,
  ...fundingBoundaryGuides,
  ...everydayCapitalGuides,
  ...accessRentGuides,
  ...lookthroughGuides,
  ...distributionGuides,
  ...cardGraceGuides,
  ...packagePriceGuides,
  ...glideExposureGuides,
  ...investmentBorrowingGuides,
  ...cpiLevelGuides,
  ...rentalDailyGuides,
  ...loanFamilyGuides,
  ...accruedInterestGuides,
  ...rrspDeductionGuides,
  ...rentalMoveGuides,
  ...premiumFinancingGuides,
  ...reverseEquityGuides,
  ...tradingEquityGuides,
  ...taxableRealGuides,
  ...spousalCalendarGuides,
  ...spendingUtilityGuides,
  ...returnReadingGuides,
  ...carEquityGuides,
  ...emergencyRecoveryGuides,
  ...mortgageChargeGuides,
  ...rateBenchmarkGuides,
  ...debtIncomeGuides,
  ...taxContributionGuides,
  ...jointLongevityGuides,
  ...creditUseGuides,
  ...benefitsCreditGrowthGuides,
  ...variablePaymentGuides,
  ...incomeLedgerGuides,
  ...mortgageBudgetGuides,
  ...savingRateGuides,
  ...bankingHousingGuides,
  ...marketResilienceGuides,
  ...paymentOptionGuides,
  ...cashMechanicsGuides,
  ...wealthChoiceGuides,
  ...wealthFlexGuides,
  ...calendarRiskGuides,
  ...savingsProjectGuides,
  ...budgetExposureGuides,
  ...commitmentGuides,
  ...wealthCareerGuides,
  ...runwaySpendingGuides,
  ...incomeTimingGuides,
  ...habitsRecoveryGuides,
  ...savingObligationGuides,
  ...choicesCashGuides,
  ...homeCarSurvivorGuides,
  ...protectionTransitionGuides,
  ...paymentWorkGuides,
  ...longerBudgetGuides,
  ...householdStepGuides,
  ...costTimingGuides,
  ...accountUseGuides,
  ...priorityGuides,
  ...fundingChoiceGuides,
  ...transitionGuides,
  ...taxHomeGuides,
  ...incomeCreditGuides,
  ...lifeEventGuides,
  ...resilienceGuides,
  ...decisionGuides,
  ...additionalPlanningGuides,
  {
    slug:'savings-compounding', category:'Financial planning · Saving', planning:'savings',
    title:'The savings plan you can see: time, contributions and compounding',
    description:'Use three charts and editable scenarios to see how regular saving, the starting date and return assumptions change a long-term goal.',
    takeaway:'A savings plan has several adjustable parts. Begin with the contribution and time horizon you can sustain, then test a range of returns.',
    related:['inflation-purchasing-power','emergency-fund-budget'],
    sections:[
      {id:'read-curves',title:'Read the gap between saving and growth',html:`<p>The first chart separates money contributed from the portfolio’s modeled value. The contribution line includes your initial savings and each monthly deposit. The difference between the lines is growth under the selected return assumption. With a negative return, that difference can be a loss.</p><p>The curve is a mathematical illustration. It does not show the path of a real investment. Markets do not supply a smooth annual return, and an account can lose value even while you continue contributing. The <a href="https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator">Investor.gov compound-interest calculator</a> also treats initial capital, contributions, time and the estimated rate as distinct inputs.</p><p>Try setting the return to zero. The two lines should coincide. This is a useful baseline: the plan’s progress then comes entirely from your own deposits, making the required saving effort visible.</p>`},
      {id:'timing',title:'Compare the same finish date',html:`<p>The second chart compares starting monthly contributions now with delaying them by five or ten years. All cases share the selected finish date, contribution amount and return. Existing starting savings remain invested in every case. The delayed cases skip deposits rather than making larger catch-up payments later.</p><p>This comparison changes both the amount contributed and the time each deposit has to grow. It should not be interpreted as a pure investment-performance comparison. Starting sooner can improve the modeled endpoint at a positive return, but it also requires setting money aside sooner.</p><p>A practical follow-up is to ask what would make an earlier start feasible: a smaller initial transfer, redirecting an expense, or a gradual increase as income changes. A larger assumed return can make a spreadsheet balance without making the required outcome reliable.</p>`},
      {id:'sensitivity',title:'Use the matrix as a stress test',html:`<p>The matrix varies the horizon and return while preserving your selected initial savings and monthly contribution. Each cell is an alternative scenario. Darker shading means a larger ending amount; it does not mean the outcome is more likely.</p><p>For a goal with a firm deadline, read down one time column and compare several rates. For a flexible goal, compare what additional time might accomplish. Keep the return convention consistent: these are nominal returns before tax, fees and inflation.</p><p>If only the most optimistic cell meets the goal, identify the funding gap. Possible changes include increasing contributions, changing the goal, delaying the deadline or finding other resources. Taking more risk creates a wider range of possible results; it does not guarantee the higher cell.</p>`},
      {id:'formula',title:'Know exactly how the example compounds',html:`<p>The annual return is an effective rate. The equivalent monthly rate is <strong>(1 + annual return)<sup>1/12</sup> − 1</strong>. Each month, the existing balance grows by that rate and a deposit arrives at month-end. Using annual return divided by 12 would represent a different rate convention.</p><p>For an initial amount B, monthly deposit C, monthly rate m and N months, the ending value is <strong>B(1 + m)<sup>N</sup> + C[(1 + m)<sup>N</sup> − 1] ÷ m</strong>. When m is zero, use B + CN. The tool uses a month-by-month recurrence, which also handles delayed deposits explicitly.</p><p>Real account results depend on actual deposit dates, changing returns, costs and tax treatment. This calculator does not impose contribution limits or determine account eligibility. Use the relevant current account rules when turning an illustration into an implemented plan.</p>`},
      {id:'plan',title:'Translate the chart into a monthly decision',html:`<ol><li>Describe the goal in today’s dollars and give it a date.</li><li>Separate near-term cash needs from money that can remain invested.</li><li>Choose a contribution that fits actual cash flow.</li><li>Test a lower-return scenario and an interruption in deposits.</li><li>Review progress as income, prices and the goal change.</li></ol><p>The ending balance is only one planning measure. Also record how much money you must contribute, whether the schedule leaves a cash reserve, and how flexible the goal is. Read the inflation guide next to translate a future balance into purchasing power.</p>`}
    ],
    sources:[{title:'Investor.gov · Compound Interest Calculator',url:'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator',note:'Public calculator identifying principal, contribution, horizon, estimated rate and compounding frequency. TickerLantern’s scenarios and formulas are independently implemented.'}]
  },
  {
    slug:'inflation-purchasing-power',category:'Financial planning · Inflation',planning:'inflation',
    title:'Inflation in pictures: what your future budget needs to buy',
    description:'Use charts and editable scenarios to explore future living costs, the purchasing power of unchanged cash and the difference between nominal and real returns.',
    takeaway:'A future dollar amount needs a price-level assumption. Compare what the money can buy as well as the number printed on the account statement.',
    related:['savings-compounding','retirement-sequence-risk'],
    sections:[
      {id:'cost',title:'Start with the cost of a familiar budget',html:`<p>The first chart grows today’s monthly cost at the selected annual inflation rate. It holds the quantity and quality of the spending basket constant. If your family, housing or lifestyle changes, that is a separate planning adjustment rather than an inflation effect.</p><p>A monthly budget of CAD 3,000 at a constant 3% inflation assumption becomes about CAD 6,281 after 25 years. This is an original calculation, not a forecast of Canadian prices. The increase compounds: applying 3% to the original budget every year without increasing the base would understate it.</p><p>The <a href="https://www.bankofcanada.ca/core-functions/monetary-policy/inflation/">Bank of Canada’s inflation overview</a> describes CPI and its inflation-target framework. A policy target is not a promise that prices or your personal expenses will grow at that rate every year. Use more than one assumption for a long horizon.</p>`},
      {id:'cash',title:'See the difference between stable dollars and stable purchasing power',html:`<p>The second chart holds a cash amount at CAD 10,000 with no nominal interest. Its purchasing power is shown in today’s dollars after fixed comparison periods. The nominal balance remains unchanged, while positive inflation reduces the goods and services it can purchase.</p><p>This is not an argument that every dollar should be invested in risky assets. Money needed for an imminent bill has a different role from long-term retirement capital. Liquidity and the ability to make a payment on time can justify holding cash even when its real return is low.</p><p>Compare the emergency-fund guide for that distinction. An emergency reserve is designed to absorb a cash-flow shock. A growth portfolio is exposed to market risk and may be down precisely when the money is needed.</p>`},
      {id:'real',title:'Translate nominal return into a real return',html:`<p>The matrix compares assumed nominal returns with inflation rates. A positive account return can still mean a loss of purchasing power. The exact relationship is <strong>real return = (1 + nominal return) ÷ (1 + inflation) − 1</strong>.</p><p>For example, a 5% nominal return with 3% inflation gives a real return of about 1.94%, before tax and fees. Subtracting 3% from 5% is a useful approximation at modest rates, but it is not the exact compounding relationship.</p><p>These cells are sensitivity calculations, not estimates of investment success. The matrix does not assign probabilities, and it does not allow you to choose a return simply because it is needed to meet a goal.</p>`},
      {id:'personal',title:'Your spending basket can differ from the average',html:`<p>A household that rents, a household with a fixed mortgage payment, and a household facing large care expenses may experience different pressures. An aggregate price index is useful context but cannot reconstruct every household’s cost changes.</p><p>Build your own starting basket from actual recurring spending. Separate price changes from changes in quantity, such as moving to a larger home or adding a family member. For a detailed plan, examine major categories separately rather than hiding every uncertainty in one average rate.</p><p>Do not combine a real return with a second inflation deduction. If both future cash flows and portfolio returns are expressed in today’s dollars, maintain that basis throughout the model. If the model is nominal, inflate the expenses and use nominal returns consistently.</p>`},
      {id:'review',title:'Put an inflation review into the plan',html:`<ol><li>Write the goal in today’s dollars and retain that baseline.</li><li>Test at least a lower and higher inflation assumption.</li><li>Identify expenses whose prices or quantities could change differently.</li><li>Check whether income sources adjust with prices, and under what terms.</li><li>Update the budget from observed spending rather than only changing the forecast rate.</li></ol><p>A spending plan becomes easier to review when nominal amounts, real amounts, dates and assumptions are clearly labelled. The charts are designed to make those relationships visible before a more detailed tax, benefit or investment model is added.</p>`}
    ],
    sources:[{title:'Bank of Canada · Inflation',url:'https://www.bankofcanada.ca/core-functions/monetary-policy/inflation/',note:'Definition of CPI, inflation measures and the policy framework. The constant rates in these charts are assumptions, not current CPI readings or official forecasts.'}]
  },
  {
    slug:'emergency-fund-budget',category:'Financial planning · Cash flow',planning:'emergency',
    title:'Build a financial buffer: household spending and emergency reserves',
    description:'Compare official Canadian household-spending statistics, then build a reserve target from your own essential expenses and cash flow.',
    takeaway:'Use household statistics for context. Build the emergency reserve from the expenses and risks your own household needs to cover.',
    related:['debt-payoff-interest','savings-compounding'],
    sections:[
      {id:'statistics',title:'Read the official spending comparison carefully',html:`<p>The first chart uses Statistics Canada’s Survey of Household Spending for 2021 and 2023, published on 21 May 2025. It shows average annual spending on goods and services among households in the provinces. It is a dated survey comparison, not a current monthly cost-of-living reading.</p><p>The seven displayed categories sum to CAD 67,125 in 2021 and CAD 76,750 in 2023. Shelter is the largest displayed category. These are nominal dollar amounts. Changes can reflect prices, quantities, household circumstances and spending choices; they are not category inflation rates.</p><p>The chart’s denominator is household consumption, not after-tax income. Savings, income taxes and other items outside this consumption definition are not an “unspent” residual. These averages are not a recommended allocation, a median budget, or an assessment of what a particular family should spend.</p>`},
      {id:'essentials',title:'Build your own essential-expense baseline',html:`<p>List the spending you would need to maintain during an interruption in earnings: housing, basic food, utilities, transport, insurance and required payments. Identify which amounts could fall and which would remain due. Add a provision for predictable irregular costs in a separate budget.</p><p>The <a href="https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/setting-up-emergency-funds.html">Financial Consumer Agency of Canada</a> distinguishes unexpected expenses from occasional expenses that can be planned. Its emergency-fund guidance describes three to six months of regular expenses or income as possible starting points.</p><p>The tool uses expenses rather than income so the coverage calculation stays explicit. Its six-month default is an example, not an assessment of your needs. Job stability, insurance, dependants, access to other resources and the ability to reduce spending can all affect an appropriate reserve.</p>`},
      {id:'progress',title:'Read the reserve-building curve',html:`<p>The second chart starts with your current cash reserve and adds the selected monthly saving. It stops new deposits once the target is reached. If the current reserve already exceeds the target, it retains the existing amount instead of pretending money has been withdrawn.</p><p>At CAD 3,000 of monthly essential expenses and six months of coverage, the target is CAD 18,000. Starting with CAD 3,000 and adding CAD 500 per month takes 30 months to close the CAD 15,000 gap, assuming no interest, withdrawals or expense changes.</p><p>Try a smaller first milestone if the full target feels distant. For example, the initial objective might be one month of essential expenses, followed by successive additions. The important point is to make the funding schedule fit the cash available after required bills.</p>`},
      {id:'stress',title:'Test the cost of an expense shock',html:`<p>The third chart raises essential expenses by 10% and 20% while keeping the selected number of coverage months fixed. This shows how a reserve can become inadequate even when its dollar balance does not fall.</p><p>These increases are hypothetical stresses, not statistical confidence bounds. You could instead test a specific event such as a rent change, a car replacement or additional care needs. Keep the cost of a known upcoming purchase separate from the reserve for genuinely uncertain events.</p><p>Also examine accessibility. A reserve intended for urgent payments needs to be available on the relevant timeline. Check withdrawal terms, settlement timing and possible penalties rather than treating every account balance as equally usable cash.</p>`},
      {id:'routine',title:'Create a reserve routine',html:`<ol><li>Reconcile the essential-expense figure with recent bills.</li><li>Choose an initial coverage target and a realistic monthly transfer.</li><li>Keep predictable annual expenses in the regular budget.</li><li>Review coverage after a housing, family or employment change.</li><li>After using the reserve, write a replenishment schedule.</li></ol><p>The reserve is part of the overall plan. Balance its funding with required debt payments and other commitments. The debt guide shows the interest effect of repayment choices; it does not assume that eliminating every cash buffer is the right way to accelerate repayment.</p>`}
    ],
    sources:[{title:'Statistics Canada · How Canadian households spent their money in 2023',url:'https://www150.statcan.gc.ca/n1/pub/11-627-m/11-627-m2025026-eng.htm',note:'Survey of Household Spending; 2021 and 2023 annual category estimates. Published 21 May 2025. National-level estimates cover provinces only. The chart reproduces seven reported categories without mixing in household income.'},{title:'FCAC · Setting up an emergency fund',url:'https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/setting-up-emergency-funds.html',note:'Unexpected versus occasional expenses, reserve accessibility and starting coverage guidance. Page dated 20 October 2025.'}]
  },
  {
    slug:'debt-payoff-interest',category:'Financial planning · Debt',planning:'debt',
    title:'Debt repayment, visualized: the payment, the timeline and the interest',
    description:'Compare repayment paths, inspect principal and interest, and see how the rate and monthly payment change a debt-free date.',
    takeaway:'A payment decision changes both the time in debt and the interest paid. Check that the payment reduces principal before relying on a payoff date.',
    related:['emergency-fund-budget','savings-compounding'],
    sections:[
      {id:'curve',title:'Follow the remaining balance',html:`<p>The first chart compares your selected monthly payment with the same payment plus an extra amount. The interest rate and starting balance stay fixed. The final payment is reduced to the amount owed rather than collecting a full payment after the debt is cleared.</p><p>At the start of the default example, CAD 10,000 at an assumed nominal annual rate of 18% incurs CAD 150 of interest over one simplified month. A CAD 300 payment therefore reduces principal by CAD 150 in that first month. Later interest falls as the balance declines.</p><p>The chart is not a reconstruction of a credit-card statement. Actual products may use daily accrual, different transaction rates, grace periods, fees and changing minimum payments. Read the agreement and statement before treating any modeled date as a contractual payoff quote.</p>`},
      {id:'interest',title:'Separate the amount borrowed from the financing cost',html:`<p>The stacked bars divide a completed repayment schedule into original principal and cumulative interest. Both paths repay the same starting principal. Any reduction in total paid comes from a change in financing cost under the selected assumptions.</p><p>Do not compare only the monthly payment. A lower payment can make the current budget easier while extending the repayment period and increasing interest. Conversely, a larger payment needs to be affordable; a plan that repeatedly forces new borrowing may fail to deliver the modeled saving.</p><p>If the selected payment is no larger than the first month’s interest, it does not reduce principal in this simplified model. The tool reports “Not repaid” instead of inventing a payoff date. It also withholds a lifetime-interest total when the schedule is not completed within the model limit.</p>`},
      {id:'matrix',title:'Read the rate-and-payment matrix',html:`<p>The matrix uses your starting balance with a fixed set of rates and payments. Each cell shows months to repay, including a partial final payment. NR means the debt is not repaid within the 600-month limit, including cases where the payment fails to reduce the balance.</p><p>This is a sensitivity map. A lower rate is not assumed to be available, and a larger payment is not assumed to fit your budget. If a refinancing offer exists, compare fees, term, variable-rate risk and any collateral implications separately.</p><p>A rate cut and an extra payment affect the model through different channels. The former reduces the charge on the outstanding balance; the latter reduces the balance more quickly. A genuine comparison needs both the repayment schedule and the total cost.</p>`},
      {id:'priorities',title:'Place the debt inside the whole budget',html:`<p>Make a list of all obligations, interest rates, due dates and minimum payments. The Government of Canada’s <a href="https://ised-isde.canada.ca/site/office-consumer-affairs/en/money-debt-and-giving/six-steps-get-out-debt">Six Steps to Get Out of Debt</a> discusses directing extra repayment toward high-rate debt and, alternatively, small balances for motivation, while maintaining required payments.</p><p>The chart models one balance and cannot decide the entire order of repayment. Arrears, essential living costs, secured obligations, promotional terms and restrictions may change priorities. It also does not value employer matching contributions, tax effects or access to emergency cash.</p><p>Keep the avoided borrowing cost distinct from a risky investment’s expected return. Repaying a fixed-rate balance changes an interest obligation under its terms; an investment forecast does not guarantee that it will outperform that cost.</p>`},
      {id:'method',title:'Check the recurrence and the implementation',html:`<p>The monthly recurrence is <strong>new balance = old balance × (1 + annual nominal rate ÷ 12) − actual payment</strong>, with payment capped at the amount owed. No new purchases or fees are added. A completed schedule satisfies total payments approximately equal to principal plus modeled interest, subject to rounding.</p><ol><li>Use the statement’s actual rate and identify any separate balances.</li><li>Keep required payments current.</li><li>Choose an extra payment that leaves a workable cash-flow margin.</li><li>Confirm any prepayment restrictions or charges.</li><li>Reconcile the next statement with the planned progress.</li></ol><p>If the plan cannot cover essential costs and required payments, that is a cash-flow problem to address directly. A longer chart does not create the capacity to pay.</p>`}
    ],
    sources:[{title:'Government of Canada · Six Steps to Get Out of Debt',url:'https://ised-isde.canada.ca/site/office-consumer-affairs/en/money-debt-and-giving/six-steps-get-out-debt',note:'Office of Consumer Affairs guidance on inventorying debt, budgeting and repayment strategies. The rates, schedules and scenario matrix here are original hypothetical calculations.'}]
  },
  {
    slug:'retirement-sequence-risk',category:'Financial planning · Retirement',planning:'retirement',
    title:'Retirement withdrawals: why the order of returns changes the plan',
    description:'Compare two portfolios with the same ten returns in reverse order, then isolate what changes when retirement spending is withdrawn.',
    takeaway:'Once a portfolio funds spending, the order of returns matters. A long-run average alone cannot describe the path of available retirement capital.',
    related:['inflation-purchasing-power','portfolio-concentration-overlap'],
    sections:[
      {id:'paths',title:'Compare two paths with the same ingredients',html:`<p>The first chart uses ten invented annual returns. One sequence begins with losses of 20% and 10%; the other reverses the entire sequence. Starting capital and the withdrawal rule are identical. Both sequences contain exactly the same returns.</p><p>Withdrawals occur at the start of each year, before that year’s return applies. This convention is deliberately explicit because moving the payment date changes the result. The selected annual increase raises requested spending each year; it does not change the return series.</p><p><a href="https://www.schwab.com/learn/story/timing-matters-understanding-sequence-returns-risk">Schwab’s sequence-risk explanation</a> describes how early losses can be particularly damaging when a portfolio is funding withdrawals. Our chart uses its own invented return series and assumptions, rather than copying Schwab’s example or estimating a historical retirement outcome.</p>`},
      {id:'returns',title:'Read the return bars before interpreting the balance',html:`<p>The grouped bars show the annual return in each sequence. Negative values fall below zero. Their order differs, but their arithmetic average and no-withdrawal compounded return are the same.</p><p>With no deposits or withdrawals, the ending balance is the starting amount multiplied by all ten return factors. Reordering multiplication does not change that product. Intermediate balances still differ, which can matter for liquidity and behaviour even in the no-withdrawal case.</p><p>Set the withdrawal to zero and inspect the final balances. They should match up to rounding. That comparison acts as a control: it helps isolate the role of cash flows instead of attributing every difference to a change in average investment performance.</p>`},
      {id:'cash-flow',title:'Why the withdrawal changes the arithmetic',html:`<p>When money is withdrawn, it no longer participates in subsequent gains or losses. A poor early return can leave a smaller balance supporting later withdrawals. The same dollar spending can then consume a greater fraction of the remaining portfolio.</p><p>The recurrence used here is <strong>ending balance = (opening balance − funded withdrawal) × (1 + annual return)</strong>. Funded withdrawal cannot exceed available assets. If requested spending is larger, the remaining balance is zero and the unmet amount is recorded separately.</p><p>The tool reports unfunded withdrawals because a zero balance must not look like a successfully financed spending plan. In a depleted path, actual funded spending can differ between the two sequences even though the requested rule is identical.</p>`},
      {id:'limits',title:'Keep a teaching comparison separate from a retirement forecast',html:`<p>Ten hand-picked returns cannot establish a sustainable withdrawal rate or a probability of success. There is no statistical confidence interval here, no simulation distribution and no claim that either sequence is likely to occur.</p><p>A full plan also needs a longer horizon, longevity assumptions, pension and benefit cash flows, taxes, investment costs, asset allocation, inflation and spending flexibility. Currency and household obligations can add further constraints. Those items are outside this demonstration.</p><p>Do not treat the first withdrawal as a recommended percentage of savings. It is an input that exposes the relationship. A plan that works under one invented sequence may fail under a different drawdown, a longer life or a larger spending need.</p>`},
      {id:'decisions',title:'Use the charts to ask better planning questions',html:`<ol><li>Which essential expenses are covered by reliable income outside the portfolio?</li><li>How much spending could be delayed or reduced after a market decline?</li><li>What liquid resources are available without selling volatile assets?</li><li>How would a longer retirement or a higher cost level change the funding gap?</li><li>When will the withdrawal plan be reviewed and adjusted?</li></ol><p>Flexibility can change the required cash flows, while asset allocation changes the range of investment paths. Neither can be assessed from a single average return. Use this visual explanation as a starting point for a plan with explicit obligations, documented assumptions and a review process.</p>`}
    ],
    sources:[{title:'Charles Schwab · What Is Sequence-of-Returns Risk?',url:'https://www.schwab.com/learn/story/timing-matters-understanding-sequence-returns-risk',note:'General explanation of early losses and withdrawals. Article dated 30 January 2026. The chart here is an independently authored ten-year scenario; US tax and benefit provisions are not imported.'}]
  }
];
