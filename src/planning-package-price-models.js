export const packagePriceDefinitions={
  packagePrice:{title:'Compare two hypothetical packages of the same usable product',fields:[
    ['oldPrice','Reference package price (CAD)',6,.1,100,.1],
    ['oldGrams','Reference package contents (whole grams)',750,50,5000,50],
    ['newPrice','Comparison package price (CAD)',6,.1,100,.1],
    ['newGrams','Comparison package contents (whole grams)',650,50,5000,50],
    ['monthlyGrams','Quantity consumed each month (whole grams)',6000,0,30000,100],
    ['months','Months of purchases and consumption',12,1,24,1]
  ]}
};
export function packagePurchasePath(price,grams,monthlyGrams,months){
  let inventory=0,cash=0,packages=0;
  const rows=[{x:0,value:0,inventory:0,purchased:0,consumedCost:0}];
  for(let month=1;month<=months;month++){
    const purchased=Math.ceil(Math.max(0,monthlyGrams-inventory)/grams);
    inventory+=purchased*grams-monthlyGrams;cash+=purchased*price;packages+=purchased;
    rows.push({x:month,value:cash,inventory,purchased,consumedCost:month*monthlyGrams*price/grams});
  }
  return {rows,cash,packages,inventory,consumedCost:months*monthlyGrams*price/grams,stockCost:inventory*price/grams};
}
export function packagePriceResult(kind,input){
  if(kind!=='packagePrice')throw Error('Unknown package-price topic.');
  const old=packagePurchasePath(input.oldPrice,input.oldGrams,input.monthlyGrams,input.months),next=packagePurchasePath(input.newPrice,input.newGrams,input.monthlyGrams,input.months),oldUnit=input.oldPrice/input.oldGrams*1000,newUnit=input.newPrice/input.newGrams*1000;
  return {metrics:[['Comparison minus reference price per kilogram',newUnit/oldUnit-1,'percent'],['Comparison minus reference checkout cash in month 1',next.rows[1].value-old.rows[1].value,'money'],['Difference in total checkout cash over the selected months',next.cash-old.cash,'money']],note:'Original hypothetical comparison in nominal CAD of the same usable product, quality and monthly quantity. All package prices and sizes are assumptions, not live offers or survey observations. Both alternatives start with no stock. At each month’s start, buy the fewest whole packages needed to cover that month’s consumption after using stock carried forward. Any unused quantity remains usable for the next month without spoilage, loss or storage cost. Prices and package sizes stay constant throughout the selected horizon. The purchase cost assigned to unused stock reconciles prior cash paid; it is not cash in the bank, a resale quote or a guaranteed recoverable value. No sales tax, coupons, delivery fees, interest, membership cost, nutrition comparison or change in consumption is calculated. A unit-price comparison should use the same measurement unit and genuinely comparable contents.',charts:[
    {id:'package-price-unit-cost',type:'bar',title:'Compare the same quantity rather than the sticker price alone',unit:'money',unitLabel:'Hypothetical price per kilogram of comparable usable product (CAD/kg)',rows:[{label:'Reference package',value:oldUnit},{label:'Comparison package',value:newUnit}],note:'Unit price equals package price divided by package grams, multiplied by 1,000. A smaller package at an unchanged price has a higher price per kilogram. The percentage metric compares the two unit prices; it does not measure the percentage reduction in package weight.'},
    {id:'package-price-checkout',type:'line',title:'Whole packages and carried stock shape the checkout calendar',unit:'money',xLabel:'Completed model months',series:[{name:'Reference: cumulative cash paid',rows:old.rows.map(r=>({x:r.x,value:r.value}))},{name:'Comparison: cumulative cash paid',rows:next.rows.map(r=>({x:r.x,value:r.value})),dash:true}],note:'Purchases occur at each month’s start; points show cumulative cash paid by that month’s end. Connected points are monthly totals, not daily purchase dates or fractional-package purchases. The next month uses carried stock before adding whole packages. The cash gap can differ from the gap in the purchase cost of the quantity consumed.'},
    {id:'package-price-consumed-stock',type:'stackbar',title:'Reconcile the cash paid with quantity consumed and stock still held',unit:'money',unitLabel:'Purchase cost allocated between consumed quantity and unused stock (CAD)',seriesNames:['Purchase cost of quantity consumed','Purchase cost of unused stock'],rows:[{label:'Reference over '+input.months+' months',values:[old.consumedCost,old.stockCost]},{label:'Comparison over '+input.months+' months',values:[next.consumedCost,next.stockCost]}],note:'Each stacked bar equals that alternative’s cumulative checkout cash. All units use its constant purchase price per gram. Stock is neither consumed nor discarded at the endpoint, and its assigned cost is not an extra expense added to the checkout total. Starting stock is zero and no stock is sold.'},
    {id:'package-price-size-grid',type:'heatmap',signed:true,title:'Test the cash difference across package sizes and prices',unit:'money',unitLabel:'Comparison minus reference total checkout cash over selected months (CAD)',columns:['CAD 4','CAD 5','CAD 6','CAD 7'],rows:[500,650,750,1000].map(grams=>({label:grams.toLocaleString('en-CA')+' g',values:[4,5,6,7].map(price=>packagePurchasePath(price,grams,input.monthlyGrams,input.months).cash-old.cash)})),note:'Rows replace the comparison package size; columns replace its price. The reference package, monthly quantity and horizon remain entered. Positive cells require more cumulative checkout cash than the reference; negative cells require less. Each cell uses whole packages and retains its own leftover stock, so it does not compare perfectly equal ending inventories or imply all products have equal quality.'}
  ]};
}
