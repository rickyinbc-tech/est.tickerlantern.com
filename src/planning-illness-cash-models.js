// Two independent, already-approved net-receipt scenarios; no claim or tax engine.
export const illnessCashDefinitions={illnessReceiptShape:{title:'Compare two independently confirmed payment calendars',fields:[
 ['illnessMonths','Whole months shown',18,6,36,1],['illnessSpend','Recurring monthly cash spending (CAD)',4500,0,30000,100],
 ['illnessOther','Other monthly net receipts in either scenario (CAD)',1500,0,30000,100],['illnessInitialCost','Extra cost in month 1 (CAD)',6000,0,100000,500],
 ['illnessCash','Accessible starting cash (CAD)',10000,0,200000,1000],['illnessLump','Net one-time payment in scenario A (CAD)',50000,0,300000,1000],
 ['illnessLumpMonth','Month that one-time payment is received',2,1,36,1],['illnessMonthly','Net monthly benefit in scenario B (CAD)',4500,0,20000,100],
 ['illnessFirstMonth','First month of monthly-benefit receipts',4,1,36,1],['illnessPaymentMonths','Maximum number of monthly receipts',12,1,36,1]
 ]}};
export function illnessLedger(i,shape,overrides={}){
 if(!['lump','monthly'].includes(shape))throw Error('Unknown receipt shape');
 const input={...i,...overrides};let net=0,minimum=0,totalBenefits=0;
 const rows=[{x:0,value:input.illnessCash,net:0,benefit:0,other:0,spend:0}];
 for(let m=1;m<=input.illnessMonths;m++){
  const benefit=shape==='lump'?(m===input.illnessLumpMonth?input.illnessLump:0):(m>=input.illnessFirstMonth&&m<input.illnessFirstMonth+input.illnessPaymentMonths?input.illnessMonthly:0);
  const other=input.illnessOther,spend=input.illnessSpend+(m===1?input.illnessInitialCost:0);
  net+=benefit+other-spend;minimum=Math.min(minimum,net);totalBenefits+=benefit;
  rows.push({x:m,value:input.illnessCash+net,net,benefit,other,spend});
 }
 const required=Math.max(0,-minimum);
 return {rows,totalBenefits,required,extra:Math.max(0,required-input.illnessCash),ending:rows.at(-1).value};
}
export function illnessCashResult(kind,input){
 if(kind!=='illnessReceiptShape')throw Error('Unknown illness-cash scenario');
 const lump=illnessLedger(input,'lump'),monthly=illnessLedger(input,'monthly');
 const eventMonths=[...new Set([1,2,input.illnessLumpMonth-1,input.illnessLumpMonth,input.illnessFirstMonth-1,input.illnessFirstMonth,input.illnessFirstMonth+input.illnessPaymentMonths-1,input.illnessFirstMonth+input.illnessPaymentMonths,input.illnessMonths])].filter(m=>m>=1&&m<=input.illnessMonths).sort((a,b)=>a-b);
 const lags=[1,3,6,9,12],amounts=[...new Set([0,input.illnessLump/2,input.illnessLump,input.illnessLump*1.5])];
 return {metrics:[['Additional starting cash · one-time scenario',lump.extra,'money'],['Additional starting cash · monthly scenario',monthly.extra,'money'],['Benefits received · one-time / monthly',lump.totalBenefits,'money',`$${lump.totalBenefits.toLocaleString('en-CA',{maximumFractionDigits:2})} / $${monthly.totalBenefits.toLocaleString('en-CA',{maximumFractionDigits:2})}`]],
 note:'Original hypothetical CAD cash calendars. A and B are independent alternatives with entered net receipts, not premiums or claim quotations. Do not add them: the model makes no finding that both claims qualify or can be paid together. Supply amounts and receipt dates confirmed after tax and any offsets. Every month adds receipts before paying recurring spending and the month-1 extra cost. Month 0 is opening cash. No within-month payment delay, interest, borrowing, inflation, policy eligibility, medical diagnosis, premium cost or recovery income is calculated. A negative cash point is an unfunded position. Receipts beyond the selected horizon are excluded, without a future settlement credit.',
 charts:[
  {id:'illness-receipt-events',type:'groupbar',title:'Locate the payments around the selected calendar changes',unit:'money',unitLabel:'CAD received in each listed month; benefit payments only',seriesNames:['A · One-time receipt','B · Monthly receipts'],rows:eventMonths.map(m=>({label:'Month '+m,values:[lump.rows[m].benefit,monthly.rows[m].benefit]})),note:'Selected event months are shown, rather than a complete monthly benefit table. Other income and spending are excluded from these bars. A first receipt in month 4 is a chosen cash date, not a calculation of a contractual waiting period or an approval promise.'},
  {id:'illness-cash-paths',type:'line',title:'Follow the cash left after that month’s receipts and costs',unit:'money',unitLabel:'CAD cash position; negative values remain unfunded',xMin:0,xLabel:'Whole month completed',series:[{name:'A · One-time receipt',rows:lump.rows},{name:'B · Monthly receipts',dash:true,rows:monthly.rows}],note:'The two paths start with identical cash, other income and costs. Only benefit receipt schedules differ. Straight connecting segments link discrete month-end observations; the tool does not model the timing of bills inside a month. Future receipts cannot repair an earlier missed payment.'},
  {id:'illness-starting-reserve',type:'bar',title:'Find the total opening cash that funds each complete calendar',unit:'money',unitLabel:'CAD required at month 0, before applying selected starting cash',rows:[{label:'A · One-time receipt',value:lump.required},{label:'B · Monthly receipts',value:monthly.required}],note:'Required opening cash equals the largest cumulative shortfall, including month 0. The headline additional amount subtracts the selected accessible cash, with a floor of zero. End-of-horizon cash alone can miss a deeper earlier deficit. A lower result is conditional on the entered calendars, not a ranking of insurance products.'},
  {id:'illness-lump-delay-matrix',type:'heatmap',title:'Stress the one-time scenario’s amount and receipt month',unit:'money',unitLabel:'Additional opening CAD after selected cash; M = receipt month',columns:lags.map(m=>'M'+m),rows:amounts.map(amount=>({label:'Net $'+amount.toLocaleString('en-CA',{maximumFractionDigits:2}),values:lags.map(month=>illnessLedger(input,'lump',{illnessLump:amount,illnessLumpMonth:month}).extra)})),note:'Columns replace the one-time receipt month; rows replace its net amount. Every other assumption stays fixed. A column beyond the horizon receives nothing in the modeled window. Timing is a stress input, not an available insurance option. No likelihood of illness, acceptance, payment or delay is attached to a cell.'}
 ]};
}
