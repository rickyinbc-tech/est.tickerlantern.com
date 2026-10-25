export const timingConventionDefinitions={
  inflationOrder:{title:'Reverse two inflation blocks while preserving the same ten-year price increase',fields:[
    ['inflationOrderCapital','Starting retirement capital (CAD)',500000,0,2000000,10000],['inflationOrderSpending','First annual spending request, paid immediately (CAD)',25000,0,100000,1000],
    ['inflationBlockA','Annual inflation in block A (%)',8,0,12,.5],['inflationBlockB','Annual inflation in block B (%)',2,0,12,.5],
    ['inflationBlockYears','Years in block A; block B fills the remaining ten years',3,1,9,1],['inflationOrderReturn','Constant effective annual nominal portfolio return (%)',5,-5,10,.5]
  ]},
  rateConvention:{title:'Translate the annual quote before calculating the monthly payment',fields:[
    ['quotePrincipal','Loan principal (CAD)',300000,0,2000000,10000],['quoteRate','Annual rate number used in all interpretations (%)',5,0,20,.25],
    ['quoteCompounds','Compounding periods per year for the selected nominal quote',2,1,365,1],['quoteLoanYears','Complete repayment horizon (years)',25,1,30,1]
  ]}
};
export function inflationOrderPath(input,reversed=false){
  const normal=Array.from({length:10},(_,i)=>i<input.inflationBlockYears?input.inflationBlockA:input.inflationBlockB),rates=reversed?[...normal].reverse():normal;
  const factor=1+input.inflationOrderReturn/100;
  let capital=input.inflationOrderCapital,prices=1,requested=0,paid=0,unfunded=0,requiredCapital=0;
  const rows=[{x:0,value:capital,priceIndex:100}],spending=[];
  for(let year=1;year<=10;year++){
    const request=input.inflationOrderSpending*prices,funded=Math.min(capital,request),gap=request-funded;
    requiredCapital+=request/factor**(year-1);requested+=request;paid+=funded;unfunded+=gap;
    capital=(capital-funded)*factor;prices*=1+rates[year-1]/100;
    spending.push({x:year,value:request,funded,gap});
    rows.push({x:year,value:capital,priceIndex:prices*100});
  }
  return {rates,rows,spending,capital,prices,requested,paid,unfunded,requiredCapital};
}
export function annualQuoteRates(rate,compounds,alreadyEffective=false){
  const annualLog=alreadyEffective?Math.log1p(rate/100):compounds*Math.log1p(rate/100/compounds);
  return {effectiveAnnual:Math.expm1(annualLog),monthly:Math.expm1(annualLog/12)};
}
export function quotedLoanPath(input,compounds=input.quoteCompounds,alreadyEffective=false){
  const rates=annualQuoteRates(input.quoteRate,compounds,alreadyEffective),r=rates.monthly,n=12*input.quoteLoanYears;
  const payment=r===0?input.quotePrincipal/n:input.quotePrincipal*r/(-Math.expm1(-n*Math.log1p(r)));
  let debt=input.quotePrincipal,interest=0,paid=0;
  const rows=[{x:0,value:debt,interest:0}];
  for(let month=1;month<=n;month++){
    const charge=debt*r,amount=Math.min(debt+charge,month===n?debt+charge:payment);
    interest+=charge;paid+=amount;debt=Math.max(0,debt+charge-amount);
    rows.push({x:month,value:debt,interest});
  }
  return {...rates,payment,interest,paid,rows};
}
const line=(name,rows,key='value',extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function timingConventionResult(kind,input){
  if(kind==='inflationOrder'){
    const a=inflationOrderPath(input),b=inflationOrderPath(input,true),noInflation=inflationOrderPath({...input,inflationBlockA:0,inflationBlockB:0});
    const noSpending=Array.from({length:11},(_,x)=>({x,value:input.inflationOrderCapital*(1+input.inflationOrderReturn/100)**x}));
    const amount=v=>v.toLocaleString('en-CA',{maximumFractionDigits:2});
    return {metrics:[['Additional opening capital: A-first minus B-first',a.requiredCapital-b.requiredCapital,'money'],['Remaining capital at year ten, block A first',a.capital,'money'],['Unfunded spending requests: A-first / B-first',null,'custom',amount(a.unfunded)+' / '+amount(b.unfunded)+' CAD']],note:'Two invented ten-year inflation sequences contain exactly the same annual rates in opposite order. Block A is '+input.inflationBlockA+'% for '+input.inflationBlockYears+' years; block B is '+input.inflationBlockB+'% for '+(10-input.inflationBlockYears)+' years. The first spending request is made immediately at the start of year one, before any price increase or investment return. Later requests reflect the previous year-end price index. Each requested amount can use only available capital; any gap stays unfunded and is never borrowed automatically. The constant nominal return then applies to remaining capital, followed by that year’s inflation update for the next year. Thus the tenth inflation update affects closing purchasing power but no eleventh spending request is included. Opening-capital requirements discount all ten requested start-of-year withdrawals at the selected constant nominal return. They are deterministic funding identities, not safe-withdrawal recommendations or probabilities. No tax, fees, pensions, consumption substitution or additional income is modeled.',charts:[
      {id:'inflation-order-price-path',type:'line',title:'The same closing price level can be reached through different paths',unit:'decimal',unitLabel:'Invented price index · starts at 100',xLabel:'Year-end observations from the start',series:[line('Block A first',a.rows,'priceIndex'),line('Block B first',b.rows,'priceIndex',{dash:true})],note:'Each path contains the same ten inflation multipliers. Their product and year-ten index match, apart from rounding. These are hypothetical price paths, not observed CPI values, forecasts or an estimate of the likelihood of high inflation.'},
      {id:'inflation-order-spending-requests',type:'line',title:'Earlier price increases change more of the spending requests',unit:'money',unitLabel:'Requested nominal annual spending (CAD)',xMin:1,xLabel:'Spending year · each request is made at its start',series:[line('Requested spending: A first',a.spending),line('Requested spending: B first',b.spending,'value',{dash:true})],note:'Year one has the same initial request in both cases. Year two uses prices after the first inflation factor. The year-ten request uses the first nine inflation factors; the final year-end inflation factor affects the closing price index rather than a request outside the horizon. Requested amounts are not necessarily fully funded.'},
      {id:'inflation-order-portfolio-path',type:'line',title:'Keep investment returns identical to isolate the spending-price sequence',unit:'money',xLabel:'Years from the starting withdrawal',series:[line('Remaining capital: A first',a.rows),line('Remaining capital: B first',b.rows,'value',{dash:true}),line('Control: no spending requests',noSpending)],note:'Both spending paths have the same initial capital and constant annual nominal return. The third line removes all spending as a mathematical control, not a household alternative. Balances stop at zero; a zero balance does not mean the spending request was fully met. Read the separate unfunded amounts.'},
      {id:'inflation-order-opening-requirement',type:'bar',title:'Calculate the opening capital required for the ten requested withdrawals',unit:'money',rows:[{label:'Inflation block A first',value:a.requiredCapital},{label:'Inflation block B first',value:b.requiredCapital},{label:'Control: no price increases',value:noInflation.requiredCapital}],note:'Each amount equals the sum of the ten requested withdrawals discounted from their start-of-year dates. The first request is undiscounted. The nominal return and first spending request stay selected. This is a ten-year, zero-terminal-capital arithmetic requirement; it does not fund spending after year ten or allow for uncertain returns.'},
      {id:'inflation-order-funded-unfunded',type:'stackbar',title:'Preserve the requests that the selected capital cannot actually fund',unit:'money',seriesNames:['Nominal spending funded','Requested spending left unfunded'],rows:[{label:'Block A first',values:[a.paid,a.unfunded]},{label:'Block B first',values:[b.paid,b.unfunded]}],note:'Each bar sums the requests within its own price sequence; the totals can differ despite the same closing price level. A smaller funded amount is not automatically better performance, because it can represent unmet spending. Later inflation or returns do not retroactively fund earlier requests.'}
    ]};
  }
  if(kind==='rateConvention'){
    const selected=quotedLoanPath(input),monthly=quotedLoanPath(input,12),effective=quotedLoanPath(input,1,true);
    const cases=[['Selected nominal quote · '+input.quoteCompounds+'/yr',selected],['Same nominal number · monthly',monthly],['Same number · effective annual',effective]];
    const first=p=>({principal:p.payment-input.quotePrincipal*p.monthly,interest:input.quotePrincipal*p.monthly});
    return {metrics:[['Effective annual interest from the selected nominal quote',selected.effectiveAnnual,'percent'],['Monthly payment under the selected convention',selected.payment,'money'],['Payment difference versus nominal monthly compounding',selected.payment-monthly.payment,'money']],note:'Three interpretations of the same entered annual rate number, not three current offers. A nominal quote j with m compounding periods has annual growth factor (1 + j/m)^m. Its equivalent monthly rate is that factor raised to 1/12, minus one. An already-effective annual quote uses (1 + j)^(1/12) − 1 instead. Each loan has the same principal and full repayment horizon, constant converted monthly interest, no fees and a capped final payment. The rate is assumed unchanged for the entire displayed horizon; an actual mortgage term can be much shorter than its amortization. Compounding frequency and monthly payment frequency are separate. The numerical effective annual rate here is an interest-conversion measure, not an all-in APR disclosure or a loan-eligibility result. Day-count rules, leap years, dated accrual, renewals, penalties and other charges are excluded.',charts:[
      {id:'quote-convention-annual-growth',type:'bar',title:'The same annual rate number can imply different annual growth factors',unit:'percent',unitLabel:'Effective annual interest rate (%) · hypothetical interpretations',rows:cases.map(([label,p])=>({label,value:p.effectiveAnnual})),note:'The selected nominal quote uses its entered compounding count; the second case uses nominal monthly compounding; the third treats the entered number as already effective for a year. This does not compare published products. Equal effective annual factors would produce equal equivalent monthly rates under this model.'},
      {id:'quote-convention-interest-path',type:'line',title:'Additional interest versus treating the quote as effective annual',unit:'money',xLabel:'Monthly payments over the complete repayment horizon',series:[{name:'Selected nominal convention minus effective-annual case',rows:selected.rows.map((r,i)=>({x:r.x,value:r.interest-effective.rows[i].interest}))},{name:'Nominal monthly convention minus effective-annual case',rows:monthly.rows.map((r,i)=>({x:r.x,value:r.interest-effective.rows[i].interest})),dash:true}],note:'Each line subtracts the cumulative interest in the already-effective annual interpretation at the same month. Every loan repays the same principal over the same horizon using its own solved payment. Zero means equal interest cost to that baseline, not an interest-free loan. This difference view makes small convention effects visible; no renewal path or fees are included.'},
      {id:'quote-convention-first-payment',type:'stackbar',title:'The first payment separates interest from principal repaid',unit:'money',seriesNames:['Principal repaid in payment one','Interest charged in payment one'],rows:cases.map(([label,p])=>{const f=first(p);return {label,values:[Math.max(0,f.principal),f.interest]};}),note:'First-month interest equals opening principal times the converted monthly rate. The payment is then split into that charge and principal repayment. There is no fee segment. Do not divide a nominal semiannual rate directly by twelve and label the result an equivalent monthly rate.'},
      {id:'quote-convention-rate-matrix',type:'heatmap',compactValues:false,title:'Convert nominal quotes to effective annual interest on a common basis',unit:'percent',unitLabel:'Effective annual interest (%) · columns show nominal quotes',columns:['2%','4%','6%','8%'],rows:[1,2,12,365].map(compounds=>({label:compounds+'/year',values:[2,4,6,8].map(rate=>annualQuoteRates(rate,compounds).effectiveAnnual)})),note:'Rows show compounding counts per year; columns show nominal annual rate numbers. These fixed conversions do not use the selected loan principal or repayment horizon. Displayed percentages are rounded to two decimal places; the underlying payment calculation uses unrounded rates. The daily case is a 365-period mathematical convention, not a dated contractual accrual calculation.'}
    ]};
  }
  throw Error('Unknown timing or rate-convention topic.');
}
