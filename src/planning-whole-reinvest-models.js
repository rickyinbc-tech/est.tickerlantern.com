export const wholeReinvestDefinitions={
  wholeReinvest:{title:'Trace whole-share purchases, fractional purchases and retained distribution cash',fields:[
    ['units','Starting whole shares of the fictional security',20,1,200,1],
    ['price','Starting price per share (CAD)',250,10,1000,10],
    ['annualReturn','Assumed effective annual total return before investor costs (%)',5,-10,10,.5],
    ['distributionRate','Annual distribution as a percentage of the starting share price (%)',4,0,8,.5],
    ['years','Whole years; four distributions and reinvestment dates each year',5,1,5,1]
  ]}
};
export function wholeReinvestmentPath(input,fractional=false){
  const growth=Math.pow(1+input.annualReturn/100,1/4),perShare=input.price*input.distributionRate/400;
  let price=input.price,units=input.units,cash=0;
  const rows=[{quarter:0,price,units,cash,security:units*price,total:units*price,dividend:0,bought:0}];
  for(let quarter=1;quarter<=input.years*4;quarter++){
    const openingUnits=units,openingCash=cash,beforePrice=price*growth;
    price=beforePrice-perShare;
    if(!(price>0))throw Error('The constructed distribution path exhausted its price.');
    const dividend=openingUnits*perShare;cash+=dividend;
    const beforePurchase=units*price+cash,bought=fractional?cash/price:Math.floor(cash/price);
    units+=bought;cash-=bought*price;
    if(Math.abs(cash)<1e-9)cash=0;
    const security=units*price;
    rows.push({quarter,price,units,cash,security,total:security+cash,dividend,bought,openingUnits,openingCash,beforePrice,beforePurchase});
  }
  return {rows,end:rows.at(-1),perShare,initial:input.units*input.price};
}
export function wholeReinvestResult(kind,input){
  if(kind!=='wholeReinvest')throw Error('Unknown whole-share reinvestment topic.');
  const whole=wholeReinvestmentPath(input),fraction=wholeReinvestmentPath(input,true),firstW=whole.rows[1],firstF=fraction.rows[1],rawGap=fraction.end.total-whole.end.total,gap=Math.abs(rawGap)<1e-8?0:rawGap;
  const series=(name,plan,key,extra={})=>({name,rows:plan.rows.map(r=>({x:r.quarter,value:r[key]})),...extra});
  return {metrics:[['Whole-share rule: final security value plus cash',whole.end.total,'money'],['Whole-share rule: final unspent distribution cash',whole.end.cash,'money'],['Final resources: fractional rule less whole-share rule',gap,'money']],note:'Original hypothetical comparison of two purchase rules for one fictional distribution-paying security. Both start with the same whole shares and no cash, add no outside money and consume nothing. Four equal periods per year share the same assumed total-return factor. Each period’s price first grows by that factor, then a fixed distribution per share is deducted: starting price × entered annual distribution percentage ÷ 4. This is a constructed valuation path, not an actual ex-dividend price prediction. Distributions depend on shares owned before that period’s purchase. Both rules pool old residual cash with the new distribution and purchase at the same post-distribution price. One buys the maximum whole shares; the other allows unlimited fractional precision. Remaining cash earns zero. Pooling old residual cash is an explicit purchase rule and may differ from a broker’s automatic plan. There are no fees, taxes, spreads, discounts, settlement delays, rounding to a broker’s precision, contribution-room calculations or guaranteed payments. All figures are nominal CAD. Fractional reinvestment maintains more exposure to the assumed security path; it does not ensure a better outcome in every return scenario.',charts:[
    {id:'whole-reinvest-first-transfer',type:'stackbar',title:'At the first purchase, moving cash into shares preserves total resources',unit:'money',unitLabel:'CAD immediately after the first distribution and reinvestment',seriesNames:['Security market value','Residual cash retained'],rows:[{label:'Whole-share purchase',values:[firstW.security,firstW.cash]},{label:'Fractional purchase',values:[firstF.security,firstF.cash]}],note:'Both totals are equal immediately after this first distribution and purchase. The fractional rule holds more of the same total inside the security; the whole-share rule can retain cash. The price deduction already transfers the distribution out of the security, so the cash must not be added again as a separate investment gain.'},
    {id:'whole-reinvest-account-path',type:'line',title:'Compare the complete account value, including residual cash',unit:'money',xLabel:'Completed quarterly periods',series:[series('Whole-share purchases plus cash',whole,'total'),series('Fractional purchases plus cash',fraction,'total',{dash:true})],note:'The paths begin with identical resources. Later differences arise because the rules leave different amounts exposed to the same assumed security returns. Cash is never spent and earns zero. Fractional reinvestment can lead in positive-return scenarios and lag when continued exposure loses value; this is not a forecast or a recommendation.'},
    {id:'whole-reinvest-cash-threshold',type:'line',title:'Unspent cash remains below the cost of one share after each whole-share purchase',unit:'money',unitLabel:'CAD: cash balance and purchase cost of one share',xLabel:'Completed quarterly periods',series:[series('Cash after whole-share purchases',whole,'cash'),series('Cost of one share at the common price',whole,'price',{dash:true})],note:'Each quarterly purchase uses all pooled cash that can buy whole shares. The remainder stays below that period’s one-share purchase cost. A fall in the residual cash line can mean that a share was purchased, not that money disappeared. The same post-distribution price applies to both rules, and the fractional rule leaves no material cash under its unlimited-precision assumption.'},
    {id:'whole-reinvest-exposure-grid',type:'heatmap',title:'The value of keeping more cash depends on the return path',unit:'percent',compactValues:false,signed:true,columns:['−8% return','0% return','4% return','8% return'],rows:[5,10,20,50].map(units=>({label:units+' shares',values:[-8,0,4,8].map(annualReturn=>{
      const scenario={...input,units,annualReturn},w=wholeReinvestmentPath(scenario),f=wholeReinvestmentPath(scenario,true),gap=(f.end.total-w.end.total)/w.initial;
      return Math.abs(gap)<1e-12?0:gap;
    })})),unitLabel:'Final fractional-rule less whole-share resources, divided by the same starting investment (%)',note:'Rows replace starting whole shares and columns replace the assumed annual total return; starting price, distribution schedule and years remain entered. Each cell compares two equally funded rules within that scenario and scales the gap by that scenario’s initial investment. Rows therefore have different initial amounts. These percentages are differences in terminal resources relative to starting capital, not annualised returns or probabilities. Positive values favour the fractional rule under the stated assumptions.'}
  ]};
}
