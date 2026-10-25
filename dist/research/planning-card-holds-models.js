export const cardHoldDefinitions={
 cardHoldCapacity:{title:'Test a planned day-four purchase against two temporary authorization demands',fields:[
  ['cardLimit','Modeled card limit (CAD)',3000,500,20000,100],
  ['postedDebt','Opening posted balance (CAD)',900,0,20000,100],
  ['firstHold','First authorization demand, starting day one (CAD)',1200,0,10000,100],
  ['secondHold','Second authorization demand, days three through eleven (CAD)',900,0,10000,100],
  ['newPurchase','Separate purchase planned for day four (CAD)',600,0,10000,100],
  ['cardPayment','Payment toward the opening balance (CAD)',600,0,20000,100],
  ['paymentDay','Day the payment becomes usable credit',6,1,14,1],
  ['holdReleaseDay','First day the first hold is absent',8,4,14,1]
 ]}
};

export function cardHoldDay(d,day){
 const payment=day>=d.paymentDay?Math.min(d.cardPayment,d.postedDebt):0,posted=d.postedDebt-payment;
 const first=day>=1&&day<d.holdReleaseDay?d.firstHold:0,second=day>=3&&day<12?d.secondHold:0,demand=posted+first+second;
 return {day,payment,posted,first,second,demand,available:d.cardLimit-demand};
}

export function cardHoldCapacity(d){
 const rows=Array.from({length:15},(_,day)=>cardHoldDay(d,day)),planned=rows[4];
 const firstFit=d.newPurchase===0?null:rows.find(r=>r.day>=4&&r.available>=d.newPurchase)?.day??null;
 return {rows,planned,firstFit,extraCapacity:Math.max(0,d.newPurchase-planned.available),appliedPayment:Math.min(d.cardPayment,d.postedDebt)};
}

export function cardHoldResult(kind,d){
 if(kind!=='cardHoldCapacity')throw Error('Unknown card-hold comparison.');
 const p=cardHoldCapacity(d),snapshots=[...new Set([0,1,3,4,d.paymentDay,d.holdReleaseDay,12,14])].sort((a,b)=>a-b).map(day=>p.rows[day]);
 return {metrics:[['Day four: headroom before the planned purchase',p.planned.available,'money'],['Extra capacity for holds and the planned purchase',p.extraCapacity,'money'],['First modeled date the purchase fits',p.firstFit,'integer',d.newPurchase===0?'No purchase entered':p.firstFit===null?'No date within 14 days':'Day '+p.firstFit]],
 note:'Original hypothetical capacity test, not an issuer authorization engine. The first incidental/security hold is requested on day one and is absent from its selected release day onward. The second is requested on day three and absent from day twelve onward. Both are assumed released in full without converting into posted purchases; underlying booking costs are outside this example. Existing debt changes only by one payment, applied on the entered usable-credit day and capped at the opening balance; credit balances and excess payment cash are not modeled. Each day shows that payment and hold releases before testing capacity. A separate day-four purchase is tested but never posted to the balance, even when it fits. Aggregate demands above the entered limit identify an infeasible scenario, not a promise that the issuer accepts holds or over-limit transactions. No interest, fees, foreign exchange, rewards, bank cash ledger or credit score is calculated. Release and payment-processing dates are assumptions, not standard service times.',charts:[
  {id:'card-hold-demand-limit',type:'groupbar',title:'Posted debt and temporary authorization demands can use the same card limit',unit:'money',unitLabel:'Aggregate capacity demand before the new purchase versus modeled card limit · CAD',seriesNames:['Posted balance plus active authorization demands','Modeled card limit'],rows:snapshots.map(r=>({label:'Day '+r.day,values:[r.demand,d.cardLimit]})),note:'The demand bar combines existing posted debt with requested holds. A bar above the limit marks a capacity problem; it does not simulate successful approval. The planned new purchase is excluded here so it can be tested separately. A released authorization is removed from demand without being recorded as new income.'},
  {id:'card-hold-available-calendar',type:'line',title:'Compare the headroom calendar with the size of the separate planned purchase',unit:'money',xLabel:'Modeled day',series:[{name:'Headroom after existing debt and holds',step:true,rows:p.rows.map(r=>({x:r.day,value:r.available}))},{name:'Separate purchase amount to fit',step:true,dash:true,rows:p.rows.map(r=>({x:r.day,value:d.newPurchase}))}],note:'The purchase fits arithmetically at checkpoints where headroom is at least the dashed amount. Negative headroom means existing aggregate demands alone exceed the entered limit. Neither line is a bank-cash balance. Searching from day four onward does not schedule or authorize an actual transaction.'},
  {id:'card-hold-day-four-bridge',type:'waterfall',title:'Reconcile the day-four capacity margin before attempting the purchase',unit:'money',rows:[{label:'Modeled card limit',value:d.cardLimit},{label:'Less opening posted balance',value:-d.postedDebt},{label:'Payment credited by day four',value:p.planned.payment},{label:'Less first active hold',value:-p.planned.first},{label:'Less second active hold',value:-p.planned.second},{label:'Less planned new purchase',value:-d.newPurchase}],totalLabel:'Margin after planned purchase',note:'The endpoint is a capacity margin, not money spent or cash left. A negative amount is the additional capacity needed for the complete set of modeled demands. A payment restores borrowing headroom by reducing debt; a hold release restores headroom without a corresponding payment or cash refund.'},
  {id:'card-hold-overlap-matrix',type:'heatmap',title:'Overlapping authorization amounts change how much capacity is missing on day four',unit:'money',unitLabel:'Extra capacity required; rows are first-hold amounts and columns are second-hold amounts · CAD',columns:['$500','$1,000','$1,500','$2,000'],rows:[500,1000,1500,2000].map(first=>({label:'$'+first.toLocaleString('en-CA'),values:[500,1000,1500,2000].map(second=>cardHoldCapacity({...d,firstHold:first,secondHold:second}).extraCapacity)})),note:'Every cell replaces both hold amounts while keeping the selected limit, opening debt, purchase, payment and release dates. If the first hold has already been released by day four, its row amount no longer changes that day’s requirement. Zero means the entered demands fit this capacity test, not that the purchase is affordable or guaranteed to be authorized.'}
 ]};
}
