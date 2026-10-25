export const unitCostDefinitions={unitCost:{title:'Follow the dollars and units through four equal-cash purchases',fields:[
 ['unitBudget','Cash invested at each of four purchase dates (CAD)',1000,50,10000,50],
 ['unitPriceOne','Price per unit at purchase one (CAD)',20,1,100,1],
 ['unitPriceTwo','Price per unit at purchase two (CAD)',10,1,100,1],
 ['unitPriceThree','Price per unit at purchase three (CAD)',25,1,100,1],
 ['unitPriceFour','Price per unit at purchase four and final valuation (CAD)',20,1,100,1]
]}};
export function unitPurchaseLedger(i){
 const prices=[i.unitPriceOne,i.unitPriceTwo,i.unitPriceThree,i.unitPriceFour];
 let units=0,paid=0;
 const rows=[{x:0,units:0,paid:0,value:0}];
 const purchases=prices.map((price,j)=>{
  const bought=i.unitBudget/price;units+=bought;paid+=i.unitBudget;
  const r={x:j+1,price,bought,units,paid,value:units*price};rows.push(r);return r;
 });
 return {prices,purchases,rows,totalUnits:units,totalPaid:paid,averageCost:paid/units,meanPrice:prices.reduce((s,p)=>s+p,0)/4,endingValue:rows.at(-1).value,gain:rows.at(-1).value-paid};
}
export function unitCostResult(kind,i){
 if(kind!=='unitCost')throw Error('Unknown unit-cost topic.');
 const p=unitPurchaseLedger(i),series=(name,key,dash=false)=>({name,dash,rows:p.rows.map(r=>({x:r.x,value:r[key]}))});
 return {metrics:[['Total units after four purchases',p.totalUnits,'decimal'],['Purchase cost per unit · total cash / total units',p.averageCost,'money'],['Final market value minus total contributed cash',p.gain,'money']],note:'Original four-purchase bookkeeping illustration. The same positive CAD amount becomes available and is invested at each stated purchase date in one hypothetical unit class. Units are bought at the entered price, fractional units are allowed without limit, and none are sold. There is no starting investment, no initial lump sum waiting beside the schedule, and no claim that future contributions exist today. No fees, bid/ask spread, taxes, distributions, currency conversion, stock split, minimum lot or execution delay is modeled. Full precision is retained in calculations; displayed quantities and currency are rounded. Average purchase cost is total cash invested divided by units acquired, not the simple mean of the four price observations. Final value is calculated immediately after purchase four at that fourth price. Its difference from contributions is a dollar gain or loss, not an annualized return, a money-weighted rate, a strategy ranking or a tax adjusted-cost-base calculation. The path is an entered scenario, not historical performance or a forecast.',charts:[
  {id:'unit-cost-quantities',type:'bar',axisRight:36,title:'Equal dollar purchases can acquire different numbers of units',unit:'decimal',unitLabel:'Units acquired on each purchase date · quantities displayed to one decimal',rows:p.purchases.map(r=>({label:'Purchase '+r.x+' · CAD '+r.price.toFixed(2)+' / unit',value:r.bought})),note:'Each bar equals the same selected cash purchase divided by that date’s price. Lower price means more units for the same cash in this frictionless illustration. Fractional dealing is an assumption, not a feature established for an actual product or broker.'},
  {id:'unit-cost-denominators',type:'groupbar',title:'Each purchase supplies one-quarter of the cash, but a different share of the units',unit:'percent',unitLabel:'Share of the four-purchase cohort · distinct cash and unit denominators',seriesNames:['Share of contributed cash','Share of acquired units'],rows:p.purchases.map(r=>({label:'Purchase '+r.x,values:[.25,r.bought/p.totalUnits]})),note:'Cash shares use total contributed CAD as their denominator; unit shares use all units acquired. Each series separately sums to 100% before display rounding. These are purchase-cohort shares, not asset-allocation weights or a measure of investment risk.'},
  {id:'unit-cost-price-measures',type:'bar',title:'The average of the quoted prices is a different statistic from cost per unit',unit:'money',unitLabel:'CAD per unit · no fees or tax adjustments',rows:[
   {label:'Simple mean of the four prices',value:p.meanPrice},
   {label:'Purchase cash / units acquired',value:p.averageCost},
   {label:'Fourth price · final valuation',value:i.unitPriceFour}
  ],note:'The first row gives each date’s price equal weight. The second weights price by units bought, equivalently dividing total purchase cash by total units. With positive prices and equal cash purchases, it is the harmonic mean of prices. This compares accounting statistics rather than two alternative trading strategies.'},
  {id:'unit-cost-portfolio-path',type:'line',title:'More units do not guarantee that market value exceeds contributed cash',unit:'money',xLabel:'After purchase number',series:[series('Cumulative cash invested','paid',true),series('Units held × current entered price','value')],note:'At each purchase date, all earlier units are marked at that date’s entered price and the new purchase is then included. Lines join four observed scenario positions; they do not establish the price or account value between purchases. The final gap is a dollar result across dated contributions, not an annual performance rate.'}
 ]};
}
