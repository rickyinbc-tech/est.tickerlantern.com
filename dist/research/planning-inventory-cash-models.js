export const inventoryCashDefinitions={
 inventoryCash:{title:'Follow a cash inventory purchase, a credit sale and one proposed owner withdrawal',fields:[
  ['inventoryOpening','Opening business cash (CAD)',20000,0,200000,1000],
  ['inventoryBatch','Batch purchased for cash at start of month one (CAD)',12000,0,100000,500],
  ['inventoryInvoice','Invoice for half the batch sold in month two (CAD)',20000,0,200000,1000],
  ['inventoryOperating','Operating expense paid at start of month two (CAD)',2000,0,50000,100],
  ['inventoryOwnerDraw','One proposed owner withdrawal (CAD)',12000,0,100000,500],
  ['inventoryCollectMonth','Month the whole invoice is collected, after opening expenses',3,2,6,1],
  ['inventoryDrawMonth','Month the owner withdrawal follows any invoice collection',2,1,6,1]
 ]}
};

export function inventoryCashLedger(d){
 let cash=d.inventoryOpening,stock=0,receivable=0,profit=0,drawn=0,beforeDrawCash=0;
 const state=()=>({cash,stock,receivable,profit,drawn}),events=[],monthly=[{month:0,...state()}];
 const record=(month,label)=>events.push({checkpoint:events.length,month,label:'Month '+month+' · '+label,...state()});
 record(0,'opening');
 for(let month=1;month<=6;month++){
  if(month===1){cash-=d.inventoryBatch;stock=d.inventoryBatch;record(month,'buy inventory');}
  if(month===2){stock=d.inventoryBatch/2;receivable=d.inventoryInvoice;profit=d.inventoryInvoice-d.inventoryBatch/2-d.inventoryOperating;cash-=d.inventoryOperating;record(month,'invoice sale and pay operating cost');}
  if(month===d.inventoryCollectMonth){cash+=receivable;receivable=0;record(month,'collect customer invoice');}
  if(month===d.inventoryDrawMonth){beforeDrawCash=cash;cash-=d.inventoryOwnerDraw;drawn=d.inventoryOwnerDraw;record(month,'proposed owner withdrawal');}
  monthly.push({month,...state()});
 }
 record(6,'horizon end');
 const fundingNeed=Math.max(0,-Math.min(...events.map(r=>r.cash)));
 const funded=r=>({...r,fundedCash:r.cash+fundingNeed,fundedEquity:d.inventoryOpening+fundingNeed+r.profit-r.drawn});
 return {profit,costSold:d.inventoryBatch/2,endingCash:cash,endingInventory:stock,beforeDrawCash,fundingNeed,events:events.map(funded),monthly:monthly.map(funded)};
}

export function inventoryCashResult(kind,d){
 if(kind!=='inventoryCash')throw Error('Unknown inventory cash illustration.');
 const p=inventoryCashLedger(d),second=p.monthly[2],snapshots=[...new Set([0,1,2,d.inventoryCollectMonth,6])].sort((a,b)=>a-b).map(m=>p.monthly[m]);
 return {metrics:[['Modeled operating profit from the one sale',p.profit,'money'],['Projected cash just before the proposed withdrawal',p.beforeDrawCash,'money'],['Extra opening owner cash needed for the requested calendar',p.fundingNeed,'money']],
 note:'Original hypothetical six-month business cash plan, not financial statements or a salary/dividend/tax calculation. A batch is purchased for cash at the start of month one; half is delivered and invoiced at the start of month two. That half’s original cost is recognized once as cost of goods sold; the remaining half stays at original cost, without a market valuation or impairment assessment. One operating expense is recognized and paid alongside the sale. The whole customer invoice is assumed collected after opening expenses in its entered month. The one owner withdrawal follows any same-month collection and is a transfer, not an operating expense. Other months have no new sales or operating costs. Negative requested cash balances are unmet funding requirements, not approved overdrafts or completed unfunded payments. The separately shown opening top-up is the amount that would be needed from outside owner cash before events begin; its availability is not assumed proven. No supplier credit, loans, interest, bad debts, inventory resale, sales tax or income tax is modeled. End-of-month and ordered-event views retain different timing detail.',charts:[
  {id:'inventory-cash-sale-profit',type:'waterfall',title:'Recognize the cost of the goods sold, rather than deducting the whole batch from profit',unit:'money',rows:[{label:'One sale invoiced in month two',value:d.inventoryInvoice},{label:'Cost of the half batch sold',value:-p.costSold},{label:'Operating expense',value:-d.inventoryOperating}],totalLabel:'Modeled operating profit',note:'The full batch purchase is a cash outflow in month one. Only the half delivered to this customer becomes cost of goods sold in this illustration. The unsold half remains an asset at original cost. The owner withdrawal is excluded from operating profit.'},
  {id:'inventory-cash-ordered-calendar',type:'line',title:'A profitable sale can still leave an unfunded payment before collection',unit:'money',xLabel:'Ordered event checkpoint',series:[{name:'Requested calendar · cash before any new funding',step:true,rows:p.events.map(r=>({x:r.checkpoint,label:r.label,value:r.cash}))},{name:'Cash with the identified opening owner top-up',step:true,dash:true,rows:p.events.map(r=>({x:r.checkpoint,label:r.label,value:r.fundedCash}))}],note:'Checkpoints follow event order, with equal visual spacing; they do not represent equal lengths of calendar time. The data table names each month and event. Opening operating payments precede customer collection; owner withdrawal follows collection in the same month. The second line adds the computed outside owner contribution from checkpoint zero. It is new funding, not sale proceeds or extra profit.'},
  {id:'inventory-cash-funded-assets',type:'stackbar',title:'Even after funding the calendar, some business assets are not cash available to withdraw',unit:'money',unitLabel:'Assets after the assumed identified opening owner contribution · CAD',seriesNames:['Business cash after the required top-up','Uncollected customer invoice','Remaining inventory at original cost'],rows:snapshots.map(r=>({label:'Month '+r.month+' · close',values:[r.fundedCash,r.receivable,r.stock]})),note:'The top-up is included explicitly so every shown cash component is nonnegative. Each stack totals cash, receivables and stock under the hypothetical funded plan. It does not imply the owner can spend the whole stack: an invoice must be collected and inventory must be sold. The inventory value is a cost-carrying illustration, not an estimate of resale proceeds.'},
  {id:'inventory-cash-month-two-bridge',type:'waterfall',title:'Bridge month-two operating profit to the requested bank-cash balance',unit:'money',rows:[{label:'Opening cash',value:d.inventoryOpening},{label:'Add operating profit',value:second.profit},{label:'Less uncollected invoice',value:-second.receivable},{label:'Less remaining stock at cost',value:-second.stock},{label:'Less owner draws to month 2',value:-second.drawn}],totalLabel:'Requested month-two cash',note:'This bridge excludes the proposed new opening contribution. Operating profit already includes the cost of sold stock and the expense. Subtracting remaining inventory and unpaid sales reconciles the cash still tied up in assets, then the owner transfer reduces bank cash. Do not deduct the full purchase again after these adjustments. A negative endpoint is the requested plan’s funding shortfall.'},
  {id:'inventory-cash-collection-draw-matrix',type:'heatmap',title:'Changing collection and withdrawal dates changes the opening funding requirement',unit:'money',unitLabel:'Extra opening owner cash needed at the worst ordered-event checkpoint · CAD',columns:['Draw 1','Draw 2','Draw 3','Draw 6'],rows:[2,3,4,6].map(collection=>({label:'Collect '+collection,values:[1,2,3,6].map(draw=>inventoryCashLedger({...d,inventoryCollectMonth:collection,inventoryDrawMonth:draw}).fundingNeed)})),note:'Row labels give collection month and columns give withdrawal month. All amounts and the purchase/sale/expense dates remain selected. Same-month collection follows opening expenses and precedes the withdrawal. The minimum includes intermediate events, so a positive month-end balance does not hide an earlier deficit. There are no recurring expenses after month two in this simple plan; delaying collection can extend a gap without increasing its peak amount.'}
 ]};
}
