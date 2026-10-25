export const tradingEquityDefinitions={
 etfExecution:{title:'Reconcile one hypothetical ETF purchase and later sale',fields:[
  ['units','Total whole ETF units bought and sold',400,24,10000,1],['midPrice','Entry quote midpoint (CAD per unit)',25,1,500,.5],
  ['entrySpread','Full entry bid–ask spread (basis points of midpoint)',20,0,200,5],['exitSpread','Full exit bid–ask spread (basis points of midpoint)',20,0,200,5],
  ['commission','Flat commission per executed order (CAD)',5,0,25,.5],['orders','Executed orders on each side',1,1,24,1],['midMove','Change in quote midpoint before sale (%)',0,-30,30,1]
 ]},
 reverseEquity:{title:'Explore a hypothetical loan balance with capitalized interest',fields:[
  ['home','Opening home value (CAD)',750000,100000,3000000,10000],['upfront','Opening cash advance to borrower (CAD)',150000,0,500000,5000],
  ['capitalizedFees','Fees added to the opening loan (CAD)',5000,0,20000,500],['monthlyDraw','Additional advance at each month-end (CAD)',500,0,3000,50],
  ['loanRate','Assumed effective annual loan rate (%)',7,0,15,.5],['homeGrowth','Assumed annual home-value change (%)',2,-5,8,.5],
  ['years','Whole years before hypothetical sale',15,1,30,1],['saleCost','Hypothetical sale costs (% of sale value)',5,0,10,.5]
 ]}
};

export function etfTradeCost(d){
 const notional=d.units*d.midPrice,ask=d.midPrice*(1+d.entrySpread/20000),exitMid=d.midPrice*(1+d.midMove/100),bid=exitMid*(1-d.exitSpread/20000);
 const entryCommission=d.orders*d.commission,exitCommission=d.orders*d.commission,purchase=d.units*ask+entryCommission,sale=d.units*bid-exitCommission;
 const entrySpreadCost=d.units*(ask-d.midPrice),exitSpreadCost=d.units*(exitMid-bid),grossGain=d.units*(exitMid-d.midPrice),cost=entrySpreadCost+exitSpreadCost+entryCommission+exitCommission;
 const breakEven=(purchase+exitCommission)/(d.units*d.midPrice*(1-d.exitSpread/20000))-1;
 return {notional,ask,exitMid,bid,entryCommission,exitCommission,purchase,sale,entrySpreadCost,exitSpreadCost,grossGain,cost,gain:sale-purchase,netReturn:(sale-purchase)/purchase,breakEven};
}

export function reverseEquityPath(d){
 const q=(1+d.loanRate/100)**(1/12)-1;
 let balance=d.upfront+d.capitalizedFees,cash=d.upfront,interest=0;
 const point=x=>{const home=d.home*(1+d.homeGrowth/100)**(x/12),saleCosts=home*d.saleCost/100;return {x,balance,cash,interest,home,saleCosts,residual:home-saleCosts-balance};};
 const rows=[point(0)];
 for(let month=1;month<=12*d.years;month++){
  const charge=balance*q;interest+=charge;balance+=charge+d.monthlyDraw;cash+=d.monthlyDraw;rows.push(point(month));
 }
 return {rows,end:rows.at(-1),interest,cash,additionalCash:12*d.years*d.monthlyDraw};
}
const line=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function tradingEquityResult(kind,d){
 if(kind==='etfExecution'){
  const p=etfTradeCost(d);
  return {metrics:[['Purchase cash paid, including entry commissions',p.purchase,'money'],['Net gain or loss after assumed trading costs',p.gain,'money'],['Midpoint rise needed to break even on this round trip',p.breakEven,'percent']],note:'An invented ETF quote, not live market data or an execution prediction. Quotes are symmetric around their midpoint: half the full entered spread is paid on each respective side. All units are assumed bought at the entry ask and later sold at the exit bid; each side has the selected number of executed orders at the same respective quote, with sufficient depth and no price impact. Total units are unchanged when order count changes. No distributions, fund expenses, taxes, foreign exchange, partial fills, ticket-fee exceptions or time value of waiting are modeled. Quote midpoint is not NAV or verified fair value; a limit order does not guarantee a fill or eliminate the spread.',charts:[
   {id:'etf-execution-bridge',type:'waterfall',title:'Reconcile midpoint movement with the net trading result',unit:'money',rows:[{label:'Gain or loss from quote-midpoint movement',value:p.grossGain},{label:'Entry price above its midpoint',value:-p.entrySpreadCost},{label:'Exit price below its midpoint',value:-p.exitSpreadCost},{label:'Entry commissions',value:-p.entryCommission},{label:'Exit commissions',value:-p.exitCommission}],totalLabel:'Net gain or loss on the completed round trip',note:'Each spread cost is measured against its own date’s quote midpoint. These are price concessions in the assumed execution, not extra cash fees billed on top of the ask or deducted twice from the bid.'},
   {id:'etf-size-cost-share',type:'groupbar',title:'Fixed commissions and proportional spread costs scale differently',unit:'percent',unitLabel:'Cost as a share of entry midpoint notional, before commissions',seriesNames:['Entry plus exit spread concessions','Entry plus exit commissions'],rows:[24,100,400,1000,5000].map(units=>{const x=etfTradeCost({...d,units});return {label:units.toLocaleString('en-CA')+' units',values:[(x.entrySpreadCost+x.exitSpreadCost)/x.notional,(x.entryCommission+x.exitCommission)/x.notional]};}),note:'Each bar is a separate completed purchase-and-sale scenario with the same unit price, selected midpoint change, spreads and order count. Denominator is units × entry midpoint, not purchase cash. The minimum 24 units allows at least one whole unit in each of up to 24 orders.'},
   {id:'etf-spread-orders',type:'heatmap',title:'Round-trip net result across spreads and executed order counts',unit:'money',signed:true,unitLabel:'CAD net result · rows: full spread in bps on each side; columns: orders on each side',columns:[1,4,12,24].map(String),rows:[0,10,25,50,100,200].map(spread=>({label:spread+' bps',values:[1,4,12,24].map(orders=>etfTradeCost({...d,entrySpread:spread,exitSpread:spread,orders}).gain)})),note:'Cells hold the selected total units, commission, midpoint and midpoint change. Each row replaces both entry and exit full spreads with the same basis-point value. Orders divide the same units; this is not a calendar of purchases or additional invested capital.'},
   {id:'etf-midpoint-net-result',type:'line',title:'A rising quote midpoint can still leave a net trading loss',unit:'money',xLabel:'Midpoint change (%)',series:[{name:'Net round-trip gain or loss',rows:[-10,-5,0,5,10].map(midMove=>({x:midMove,value:etfTradeCost({...d,midMove}).gain}))},{name:'Zero net gain or loss',dash:true,rows:[-10,10].map(x=>({x,value:0}))}],note:'The selected full spreads and commissions remain in place. Break-even is solved from net sale proceeds equaling purchase cash. This is an execution-cost threshold under fixed quotes, not a required market return forecast or a recommendation to trade.'}
  ]};
 }
 if(kind==='reverseEquity'){
  const p=reverseEquityPath(d),e=p.end;
  return {metrics:[['Cumulative cash advances received by the borrower',p.cash,'money'],['Loan balance before hypothetical repayment',e.balance,'money'],['Sale-value residual after assumed costs and loan',e.residual,'money']],note:'A mathematical illustration, not a reverse-mortgage quote, qualification or credit-limit calculation. Interest uses an entered effective annual rate converted to monthly compounding; it accrues before each month-end advance. Opening capitalized fees also accrue interest. There are no repayments or later fees, and all entered advances are assumed available throughout; real draw limits, rates and contract conditions can differ. Cash advances are borrowed principal, not investment income. Their subsequent spending or retention is not tracked, so this is not whole-household net worth. Sale residual is signed arithmetic before other debts, taxes, penalties or estate costs; it does not determine legal shortfall liability, contractual guarantees or an estate entitlement.',charts:[
   {id:'reverse-cash-loan',type:'line',title:'Cash received and the amount owed follow different paths',unit:'money',xLabel:'Completed monthly periods',series:[line('Loan balance, including capitalized interest and fees',p.rows,'balance'),line('Cumulative cash advances to borrower',p.rows,'cash',{dash:true})],note:'The gap consists of the opening capitalized fees plus accrued interest. It is not extra cash delivered to the borrower. An absence of regular repayments in this scenario does not prevent the debt from compounding.'},
   {id:'reverse-home-residual',type:'line',title:'Track home value, loan balance and sale-value residual separately',unit:'money',xLabel:'Completed monthly periods',series:[line('Hypothetical gross home value',p.rows,'home'),line('Loan balance before repayment',p.rows,'balance',{dash:true}),line('Home less sale costs and modeled loan',p.rows,'residual')],note:'The residual already deducts sale costs and debt. It is neither an additional asset to add to the home nor cash automatically available while living there. A negative value signals a mathematical gap, not a calculation of the borrower’s legal obligation.'},
   {id:'reverse-sale-bridge',type:'waterfall',title:'Reconcile a hypothetical future sale with the loan components',unit:'money',rows:[{label:'Hypothetical home sale value',value:e.home},{label:'Assumed sale costs',value:-e.saleCosts},{label:'Opening cash borrowed',value:-d.upfront},{label:'Opening fees financed',value:-d.capitalizedFees},{label:'Later cash advances',value:-p.additionalCash},{label:'Accrued loan interest',value:-p.interest}],totalLabel:'Arithmetic sale-value residual',note:'The principal components, financed fees and interest sum to the modeled loan balance. This bridge does not add previously borrowed cash back as an unspent asset; the model has no evidence of what remains outside the home.'},
   {id:'reverse-rate-home-matrix',type:'heatmap',title:'Sale-value residual under different home growth and loan rates',unit:'money',signed:true,unitLabel:'CAD residual · rows: annual home change; columns: effective annual loan rate',columns:[0,5,7,12].map(n=>n+'%'),rows:[-5,0,2,5].map(homeGrowth=>({label:homeGrowth+'%',values:[0,5,7,12].map(loanRate=>reverseEquityPath({...d,homeGrowth,loanRate}).end.residual)})),note:'Each cell uses the same starting home, advances, fees, sale-cost percentage and selected horizon. Home-value paths and effective loan rates are independently assumed, not observed probabilities, approved offers or contractual stress tests. Negative residuals are retained visibly.'}
  ]};
 }
 throw Error('Unknown trading-and-equity planning topic.');
}
