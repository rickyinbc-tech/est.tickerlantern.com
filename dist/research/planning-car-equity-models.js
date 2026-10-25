import { installmentPayment } from './planning-life-events-models.js';
export const carEquityDefinitions={
  carEquity:{title:'Reconcile the trade-in, then follow the replacement loan',fields:[
    ['carPrice','Replacement vehicle price, excluding tax (CAD)',40000,5000,150000,1000],
    ['carCharges','Other purchase charges, excluding tax (CAD)',2000,0,15000,100],
    ['oldPayout','Amount needed to settle the old vehicle loan (CAD)',28000,0,150000,1000],
    ['tradeOffer','Trade-in proceeds before the old loan is settled (CAD)',22000,0,150000,1000],
    ['tradeDown','Cash available to apply to this transaction (CAD)',5000,0,100000,500],
    ['tradeRate','Nominal annual replacement-loan rate (%)',7,0,20,.5],
    ['tradeMonths','Replacement-loan term in months',72,24,96,12],
    ['carValueLoss','Hypothetical annual replacement-vehicle value decline (%)',15,0,35,1]
  ]}
};
export function carEquityLoan(principal,rate,months){
  const payment=installmentPayment(principal,rate,months),r=rate/1200;
  let debt=principal,paid=0,interest=0;const rows=[{x:0,debt,paid,interest}];
  for(let month=1;month<=months;month++){
    const charge=debt*r,actual=Math.min(payment,debt+charge);paid+=actual;interest+=charge;debt=Math.max(0,debt+charge-actual);if(debt<1e-6)debt=0;
    rows.push({x:month,debt,paid,interest});
  }
  return {principal,payment,paid,interest,rows};
}
export function carTradePlan(input){
  const acquisition=input.carPrice+input.carCharges,tradeEquity=input.tradeOffer-input.oldPayout,beforeCash=acquisition-tradeEquity;
  const cashUsed=Math.min(input.tradeDown,Math.max(0,beforeCash)),netFinancing=beforeCash-cashUsed;
  const principal=Math.max(0,netFinancing),cashReleased=Math.max(0,-netFinancing),unusedCash=input.tradeDown-cashUsed;
  const oldShortfall=Math.max(0,-tradeEquity),shortfallFinanced=Math.min(principal,oldShortfall);
  const loan=carEquityLoan(principal,input.tradeRate,input.tradeMonths),shortfallLoan=carEquityLoan(shortfallFinanced,input.tradeRate,input.tradeMonths);
  return {acquisition,tradeEquity,beforeCash,cashUsed,netFinancing,principal,cashReleased,unusedCash,oldShortfall,shortfallFinanced,replacementFinanced:principal-shortfallFinanced,loan,shortfallLoan,rows:loan.rows.map(r=>({...r,value:input.carPrice*(1-input.carValueLoss/100)**(r.x/12)}))};
}
export function carEquityResult(kind,input){
  if(kind!=='carEquity')throw Error('Unknown vehicle trade-in topic.');
  const p=carTradePlan(input),terms=[36,48,60,72,96],alternatives=terms.map(months=>({months,...carEquityLoan(p.principal,input.tradeRate,months)}));
  return {metrics:[['Replacement-loan principal required',p.principal,'money'],['Scheduled monthly loan payment',p.loan.payment,'money'],['Interest attributed to financed prior-loan shortfall',p.shortfallLoan.interest,'money']],note:'Hypothetical tax-exclusive trade-in with full settlement of the old loan and one new fixed-rate amortizing loan. Net trade equity equals trade proceeds less the old payout. Available cash is used only up to the remaining transaction need; surplus trade proceeds and unused offered cash do not create negative debt. For the attribution, cash first funds replacement price and charges; any remaining loan can include the prior shortfall. The attributed interest uses the same new rate and term, not the old loan terms. Nominal annual rate is divided by 12, payments occur at month-end and no balloon applies. Vehicle value follows an assumed constant annual decline. Taxes, running costs, sale expenses, penalties, optional products and investment opportunity costs are excluded. No lender approval, actual trade value or future resale price is implied.',charts:[
    {id:'car-equity-closing-bridge',type:'waterfall',title:'The old loan is settled inside the replacement transaction',unit:'money',unitLabel:'CAD; tax-exclusive hypothetical closing reconciliation',rows:[{label:'Replacement vehicle price',value:input.carPrice},{label:'Other entered purchase charges',value:input.carCharges},{label:'Old loan payout required',value:input.oldPayout},{label:'Trade-in proceeds',value:-input.tradeOffer},{label:'Cash actually applied',value:-p.cashUsed}],totalLabel:'New loan / cash released',note:'A positive endpoint is the new loan principal. A negative endpoint is modeled cash released from excess trade proceeds; loan principal is then zero. Offered cash above the need stays unused. This reconciles gross trade proceeds and the old loan once each. Tax is entirely excluded; it is not calculated from the loan shortfall.'},
    {id:'car-equity-payment-terms',type:'bar',title:'Longer terms spread the same loan principal across more payments',unit:'money',unitLabel:'Scheduled CAD per month; same new principal and rate',rows:alternatives.map(r=>({label:r.months+'-month term',value:r.payment})),note:'These are independent fully amortizing loan terms with the same principal and annual rate. They are not available lender offers. A lower scheduled payment does not by itself identify the lowest total cost or fund fuel, insurance, maintenance and taxes.'},
    {id:'car-equity-total-terms',type:'stackbar',title:'Compare total scheduled repayments over each complete loan term',unit:'money',unitLabel:'CAD over the full stated term; principal plus interest',seriesNames:['Principal repaid','Loan interest'],rows:alternatives.map(r=>({label:r.months+'-month term',values:[p.principal,r.interest]})),note:'Each bar includes the same starting principal and its own full-term interest. With a positive fixed rate, extending this model’s term raises interest even when the monthly payment falls. The old lender is settled at closing; that does not erase any shortfall included in this new principal.'},
    {id:'car-equity-value-debt',type:'line',title:'Follow the replacement vehicle value beside the new debt',unit:'money',unitLabel:'CAD; assumed vehicle value and modeled outstanding principal',xLabel:'Months after the replacement purchase',series:[{name:'Hypothetical vehicle value',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Replacement-loan balance',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.debt}))}],note:'Vehicle value starts at its entered price, excluding the other charges and tax. Its assumed annual decline is converted to fractional years; it is not a market estimate. Debt above value indicates negative modeled equity. Selling would still require settling the real loan and any unlisted costs; the gap does not automatically become approved credit.'},
    {id:'car-equity-shortfall-interest-grid',type:'heatmap',title:'Interest on separately financed old-loan shortfalls',unit:'money',unitLabel:'Columns: new loan term. Rows: shortfall fully financed. Cells: interest alone (CAD)',columns:['36 mo','60 mo','72 mo','96 mo'],rows:[0,3000,6000,12000].map(shortfall=>({label:shortfall?'$'+shortfall/1000+'k gap':'No gap',values:[36,60,72,96].map(months=>carEquityLoan(shortfall,input.tradeRate,months).interest)})),note:'Every cell is a separate hypothetical fully financed shortfall at the entered new annual rate. It excludes repayment of the shortfall principal itself. The current deal’s available cash can reduce the shortfall actually financed; the matrix does not override that closing calculation. Zero interest does not make the old principal disappear.'}
  ]};
}
