export const utilityEqualDefinitions={utilityEqualPayment:{title:'Track an equal payment plan against the charges it is smoothing',fields:[
 ['utilityPayment','Monthly equal installment actually paid in cash (CAD)',150,50,400,5],
 ['utilityChargeScale','Scenario multiplier on every fictional monthly total charge (%)',100,80,130,5],
 ['utilityAdjustMonth','Month after which the installment is recomputed',6,2,11,1],
 ['utilityRefund','Separate hypothetical refund of an ending credit (CAD)',0,0,500,25]
]}};
// Authored teaching pattern: twelve fictional total charges, not measured consumption,
// a weather forecast or any provider's annual billing cycle.
export const utilityEqualCharges=[90,90,110,150,190,240,270,240,220,170,130,100];
export function utilityEqualPlan(i){
 const charges=utilityEqualCharges.map(c=>c*i.utilityChargeScale/100),months=charges.length;
 const paid=Array(months).fill(i.utilityPayment);
 const difference=[];let running=0;
 for(let m=0;m<months;m++){running+=charges[m]-paid[m];difference.push(running);}
 const totalCharge=charges.reduce((a,b)=>a+b,0),totalPaid=paid.reduce((a,b)=>a+b,0),ending=totalCharge-totalPaid;
 const effectiveRefund=Math.min(i.utilityRefund,Math.max(0,-ending)),afterRefund=ending+effectiveRefund;
 const adjustIndex=Math.min(months-1,Math.max(0,i.utilityAdjustMonth-1));
 const openDifference=difference[adjustIndex];
 const remaining=months-adjustIndex-1;
 const remainingCharges=charges.slice(adjustIndex+1).reduce((a,b)=>a+b,0);
 const recomputed=(openDifference+remainingCharges)/remaining;
 const adjustedPaid=paid.slice(),adjusted=[],adjustedTotal=[];
 let adjustedRunning=0;
 for(let m=0;m<months;m++){
  adjustedPaid[m]=m<=adjustIndex?paid[m]:recomputed;
  adjustedRunning+=charges[m]-adjustedPaid[m];adjusted.push(adjustedRunning);
 }
 const rows=charges.map((charge,m)=>({month:m+1,charge,paid:paid[m],difference:difference[m],adjusted:adjusted[m],adjustedPaid:adjustedPaid[m]}));
 const cumulativeCharges=[{x:0,value:0}],cumulativePaid=[{x:0,value:0}];
 let c=0,p=0;
 for(let m=0;m<months;m++){c+=charges[m];p+=paid[m];cumulativeCharges.push({x:m+1,value:c});cumulativePaid.push({x:m+1,value:p});}
 return {charges,paid,rows,totalCharge,totalPaid,ending,effectiveRefund,afterRefund,difference,adjusted,openDifference,adjustIndex,recomputed,cumulativeCharges,cumulativePaid,peak:Math.min(...difference),peakOwing:Math.max(...difference),months};
}
const endpoint=(i,utilityPayment,utilityChargeScale)=>{
 const total=utilityEqualCharges.reduce((a,b)=>a+b,0)*utilityChargeScale/100;
 return total-utilityPayment*i.months;
};
export function utilityEqualResult(kind,i){
 if(kind!=='utilityEqualPayment')throw Error('Unknown equal-payment topic.');
 const p=utilityEqualPlan(i),m=p.months;
 return {metrics:[['Fictional total charges for the twelve periods',p.totalCharge,'money'],['Cash paid through the twelve installments',p.totalPaid,'money'],['Charges minus cash paid at the year end',p.ending,'money'],['Recomputed installment after the selected month',p.recomputed,'money']],note:'An original twelve-period teaching ledger with fictional monthly total charges and one paid installment per period. It is not a BC Hydro, FortisBC or any other provider invoice, tariff or annual reconciliation statement. Each entered charge is already the complete fictional cost assigned to that period, so no tax, rebate, deposit, late fee, interest or meter correction is added. The running difference is charges minus cash paid: a positive value means cumulative charges exceed cumulative cash paid and a negative value means a modeled credit. It is not the provider’s amount due, an arrears balance, approved borrowing, an available refund or spendable bank cash. The annuity-style recomputation divides the current signed difference plus forecast remaining charges by the remaining months and assumes those forecasts are realized exactly and every installment arrives on time. It is not a provider adjustment formula or a right to choose an installment. A separate hypothetical refund is capped at an existing modeled credit and returns previously paid cash; it is not income, and the same credit must not also be carried forward. No reduction in the underlying charges, coverage of a shortfall, payment arrangement or collection outcome is modeled, and no current tariff, actual account or usage recommendation is supplied.',charts:[
  {id:'equal-pay-seasonal-charges',type:'groupbar',title:'Constant cash installments sit beside charges that move by period',unit:'money',unitLabel:'CAD · authored fictional monthly totals',seriesNames:['Fictional total charge for the period','Cash installment paid'],rows:p.rows.map(r=>({label:'Month '+r.month,values:[r.charge,r.paid]})),note:'The charge bars are an authored seasonal pattern, not measured consumption or a weather forecast. The installment bars are the same amount in every period because the selected plan holds them constant. A level installment does not make the underlying charge level, and the gap between the two bars is timing rather than a discount.'},
  {id:'equal-pay-cumulative-lines',type:'line',title:'The vertical gap between cumulative charges and cumulative cash paid is the running difference',unit:'money',unitLabel:'Cumulative CAD since the start of the plan year',xLabel:'Installments completed',series:[{name:'Cumulative fictional charges',rows:p.cumulativeCharges},{name:'Cumulative cash paid',dash:true,rows:p.cumulativePaid}],note:'Both lines begin at zero and end at their twelve-period totals. Where paid cash is above charges, the household has advanced money to the provider. Where charges are above paid cash, the household has consumed service it has not yet paid for in this ledger. Crossing points are timing events, not billing notices.'},
  {id:'equal-pay-signed-difference',type:'signedbar',title:'A signed monthly balance separates a modeled credit from an amount owing',unit:'money',unitLabel:'CAD · charges minus cash paid · negative is a modeled credit',rows:p.rows.map(r=>({label:'Month '+r.month,value:r.difference})),note:'The same running difference is drawn around an explicit zero line. Negative bars are cash advanced beyond the charges recognized so far. Positive bars are charges not yet covered by cash within this example. Neither sign establishes that a payment was missed, that a refund is due or that a provider will accept a different installment.'},
  {id:'equal-pay-year-end-waterfall',type:'waterfall',title:'Reconcile the year-end difference from charges, cash and any separate refund',unit:'money',unitLabel:'CAD · charges minus cash paid, then a capped separate refund',rows:[{label:'Fictional charges for twelve periods',value:p.totalCharge},{label:'Cash installments paid',value:-p.totalPaid},...(p.effectiveRefund>0?[{label:'Separate hypothetical refund',value:p.effectiveRefund}]:[])],totalLabel:'Charges minus cash after refund',note:'A positive endpoint is an amount still owing in this ledger; a negative endpoint is a modeled credit, not a bank balance. The refund step appears only when the entered refund is covered by an existing credit and is capped at that credit, so the same cash is not both refunded and carried forward. Adding the total charges and the total installments again would double count the same service.'},
  {id:'equal-pay-adjusted-path',type:'line',title:'Recomputing the installment changes the cash path, not the charges',unit:'money',unitLabel:'Cumulative CAD difference · constant plan versus recomputed plan',xLabel:'Installments completed',series:[{name:'Constant selected installment',rows:[{x:0,value:0},...p.rows.map(r=>({x:r.month,value:r.difference}))]},{name:'Recomputed after month '+(p.adjustIndex+1),dash:true,rows:[{x:0,value:0},...p.rows.map(r=>({x:r.month,value:r.adjusted}))]}],note:'The recomputed path keeps the same charges and the same installments already paid, then spreads the current difference plus the forecast remaining charges over the remaining months. Its endpoint returns to zero only because the forecast is assumed exact and every payment arrives. A negative computed installment would be a credit to resolve separately, not an automatic negative transfer.'},
  {id:'equal-pay-endpoint-matrix',type:'heatmap',signed:true,title:'Year-end differences across installments and total-charge scenarios',unit:'money',unitLabel:'CAD · charges minus twelve cash installments · negative is a modeled credit',columns:['Charges −10%','Charges unchanged','Charges +10%'],rows:[125,150,175,200].map(payment=>({label:'$'+payment+' installment',values:[90,100,110].map(scale=>endpoint({...i,months:12},payment,scale))})),note:'Rows replace the constant installment; columns replace a multiplier applied to every fictional charge. The endpoint is charges minus twelve installments and excludes any refund. A lower installment raises the difference dollar for dollar and does not reduce charges. A higher one reduces the difference but uses more current household cash. These cells are not savings, arrears predictions or evidence about any provider’s actual reconciliation.'}
 ]};
}
