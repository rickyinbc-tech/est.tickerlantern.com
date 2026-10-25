export const discountBasisDefinitions={discountBasis:{title:'Match the cash-flow price basis to the discount-rate price basis',fields:[
 ['basisCost','Annual planned cost in starting-date purchasing-power dollars (CAD)',12000,0,50000,1000],
 ['basisInflation','Assumed annual increase in the price level (%)',3,0,8,.5],
 ['basisNominal','Nominal discount assumption, effective annual (%)',6,0,12,.5],
 ['basisYears','Number of year-end payments',20,1,30,1]
]}};
export function discountBasisLedger(i){
 const priceGrowth=1+i.basisInflation/100,nominalGrowth=1+i.basisNominal/100,realGrowth=nominalGrowth/priceGrowth;
 let matchedNominal=0,matchedReal=0,mixedFixed=0,mixedIndexed=0;
 const rows=[];
 for(let year=1;year<=i.basisYears;year++){
  const realCash=i.basisCost,nominalCash=realCash*priceGrowth**year;
  const correctNominal=nominalCash/nominalGrowth**year,correctReal=realCash/realGrowth**year;
  const wrongFixedNominal=realCash/nominalGrowth**year,wrongIndexedReal=nominalCash/realGrowth**year;
  rows.push({x:year,realCash,nominalCash,correctNominal,correctReal,wrongFixedNominal,wrongIndexedReal});
  matchedNominal+=correctNominal;matchedReal+=correctReal;mixedFixed+=wrongFixedNominal;mixedIndexed+=wrongIndexedReal;
 }
 return {realRate:realGrowth-1,rows,matchedNominal,matchedReal,mixedFixed,mixedIndexed};
}
export function discountBasisResult(kind,i){
 if(kind!=='discountBasis')throw Error('Unknown discount-basis topic.');
 const p=discountBasisLedger(i),series=(name,key,dash=false)=>({name,dash,rows:p.rows.map(r=>({x:r.x,value:r[key]}))});
 const rates=[0,3,6,9],inflations=[0,2,4,6];
 return {metrics:[['Equivalent effective annual real discount assumption',p.realRate,'percent'],['Present cost with a consistently matched basis',p.matchedNominal,'money'],['Present cost omitted by mixing real cash with the nominal rate',p.matchedNominal-p.mixedFixed,'money']],note:'Original deterministic annual-cost illustration. The entered cost has constant starting-date purchasing power. The first payment is at the END of year one, so its nominal amount already includes one year of the selected price growth; the final payment is at the selected year-end. All rates are effective annual. “Nominal” here means a money/price basis that includes the assumed inflation effect, not a nominal compounding-frequency quote. Equivalent real discount growth equals nominal discount growth divided by price growth; the real rate can be negative and is not clamped to zero. Correct nominal-cash/nominal-rate and real-cash/real-rate valuations describe the same payment plan at time zero. Two deliberately mismatched calculations illustrate basis errors, not alternative legitimate cost forecasts. No account balance, saving contribution, portfolio return, tax, fee, household risk model or funding adequacy is calculated. Constant inflation and discount assumptions are independently entered scenarios, not official forecasts or recommended personal rates. Full-precision rates are used in calculations even when the displayed real rate is rounded.',charts:[
  {id:'discount-basis-payment-dollars',type:'line',title:'The same planned purchasing power has rising nominal payment amounts',unit:'money',unitLabel:'CAD per payment · series identify two different price bases',xMin:1,xLabel:'Year-end payment number',series:[series('Payment-date nominal CAD','nominalCash'),series('Starting-date purchasing-power CAD','realCash',true)],note:'These lines describe the same constant-real-cost plan in two price bases. Their vertical difference is not additional consumption or a second bill. General price growth is applied once per complete year before each year-end payment.'},
  {id:'discount-basis-pv-methods',type:'bar',axisRight:36,title:'Matching either basis gives the same present cost; mixing them changes the answer',unit:'money',unitLabel:'Time-zero CAD · row labels show cash basis / rate basis',rows:[
   {label:'Matched: nominal / nominal',value:p.matchedNominal},
   {label:'Matched: real / real',value:p.matchedReal},
   {label:'Mixed: real / nominal',value:p.mixedFixed},
   {label:'Mixed: nominal / real',value:p.mixedIndexed}
  ],note:'All four rows are presented as time-zero valuation results. Only the first two consistently describe the stated price-indexed payment plan. The mixed rows deliberately use the wrong basis pairing, while keeping the same entered assumptions, to expose the arithmetic distortion.'},
  {id:'discount-basis-annual-pv',type:'line',title:'The basis mismatch changes the present-cost contribution of later payments',unit:'money',xMin:1,xLabel:'Year-end payment number',series:[series('Matched basis · PV per payment','correctNominal'),series('Mixed: real / nominal','wrongFixedNominal',true),series('Mixed: nominal / real','wrongIndexedReal')],note:'Each point values one payment at time zero; it is neither cumulative spending nor a bank balance. The separate real-cash/real-rate calculation equals the matched nominal calculation year by year and is not drawn as an obscuring duplicate line.'},
  {id:'discount-basis-error-grid',type:'heatmap',title:'A real-cash/nominal-rate mismatch understates this positive inflation-linked cost',unit:'percent',signed:true,unavailableLabel:'N/A',columns:rates.map(r=>r+'%'),rows:inflations.map(inflation=>({label:inflation+'% prices',values:rates.map(nominal=>{const v=discountBasisLedger({...i,basisInflation:inflation,basisNominal:nominal});return v.matchedNominal===0?null:v.mixedFixed/v.matchedNominal-1;})})),note:'Columns replace the effective annual nominal discount assumption; rows replace assumed price growth. Each cell is the mixed present cost divided by the correctly matched present cost, minus one, at the selected annual cost and payment count. Negative means understated. Zero inflation removes this price-basis mismatch. N/A preserves an undefined percentage when the entered cost is zero.'}
 ]};
}
