import {taxRoom} from './planning-metc-claim-models.js';
import {DTC_STATS} from './planning-dtc-transfer-models.js';
const issue=i=>i.spPaid>money(i.spArrears+i.spChildDue+i.spSpousalDue)?{message:'Payments above what the order or agreement requires (child support owed, including arrears, plus spousal support) are not support payments; enter at most the amount owed.',fields:['spPaid','spChildDue','spSpousalDue','spArrears']}:i.spPayerEarn>i.spPayerNet+30000||i.spRecipEarn>i.spRecipNet+30000?{message:'Employment income should not exceed net income by more than the deductions it could plausibly carry.',fields:['spPayerEarn','spPayerNet','spRecipEarn','spRecipNet']}:null;
export const supportPaymentsDefinitions={supportPayments:{title:'Split a year’s support payments into child and spousal support and see the 2026 federal tax on each side',inputIssue:issue,fields:[
 ['spPayerNet','Payer’s 2026 net income before the support deduction (CAD)',110000,0,400000,100],
 ['spPayerEarn','Employment income in it (CAD; drives the payer’s CPP, EI and Canada employment amount credits)',110000,0,400000,100],
 ['spRecipNet','Recipient’s 2026 net income before taxable support (CAD)',35000,0,400000,100],
 ['spRecipEarn','Employment income in it (CAD)',35000,0,400000,100],
 ['spChildDue','Child support payable for 2026 under the order or agreement (CAD)',12000,0,120000,100],
 ['spSpousalDue','Spousal support payable for 2026, stated separately in the order (CAD)',18000,0,240000,100],
 ['spArrears','Child support still unpaid from earlier years (CAD)',0,0,120000,100],
 ['spPaid','Total actually paid to the recipient in 2026 under the order (CAD)',30000,0,480000,100],
 ['spSepYear','2026 is the year of separation and the payer could claim line 30400 for the child instead (1 = yes · 0 = no)',0,0,1,1]
]}};
export const supportPaymentsWholeKeys=['spSepYear'];
const r6=n=>Math.round(n*1e6)/1e6;
const money=n=>Math.round(r6(n)*100+1e-7)/100;
// 2026 federal amount for an eligible dependant with no dependant income (CRA indexation table), credited at 14%.
export const SP_2026={rate:.14,edAmount:16452,rrspRate:.18};
// Paragraph 60(b) / 56(1)(b) priority: payments go first to child support owed (earlier years, then this year); only the balance is spousal support.
export function allocate({paid,arrears,childDue,spousalDue}){
 const toArrears=Math.min(paid,arrears),toChild=Math.min(paid-toArrears,childDue),toSpousal=Math.min(Math.max(0,money(paid-toArrears-toChild)),spousalDue);
 return {toArrears:money(toArrears),toChild:money(toChild),toSpousal:money(toSpousal),childUnpaid:money(arrears+childDue-toArrears-toChild),spousalUnpaid:money(spousalDue-toSpousal),deductible:money(toSpousal)};
}
const fedTax=(net,earn)=>taxRoom(Math.max(0,net),earn).room;
export function taxEffect(i,deductible=allocate(args(i)).deductible){
 const payerBefore=fedTax(i.spPayerNet,i.spPayerEarn),payerAfter=fedTax(money(i.spPayerNet-deductible),i.spPayerEarn);
 const recipBefore=fedTax(i.spRecipNet,i.spRecipEarn),recipAfter=fedTax(money(i.spRecipNet+deductible),i.spRecipEarn);
 const saved=money(payerBefore-payerAfter),added=money(recipAfter-recipBefore);
 return {saved,added,net:money(saved-added)};
}
const args=i=>({paid:i.spPaid,arrears:i.spArrears,childDue:i.spChildDue,spousalDue:i.spSpousalDue});
// Year of separation: line 22000 deduction or the line 30400 credit for the child (child with no income), whichever saves more federal tax.
export function separationChoice(i,deductible=allocate(args(i)).deductible){
 const room=fedTax(i.spPayerNet,i.spPayerEarn),credit=money(Math.min(SP_2026.rate*SP_2026.edAmount,room));
 const deduction=taxEffect(i,deductible).saved;
 return {credit,deduction,better:deduction>=credit?'deduction':'credit'};
}
// Spousal support at which the line 22000 deduction saves as much as the line 30400 credit.
export function breakEvenSpousal(i){
 const target=separationChoice(i,0).credit,at=d=>taxEffect(i,d).saved;
 if(at(Math.min(i.spPayerNet,240000))<target)return null;
 let lo=0,hi=Math.min(i.spPayerNet,240000);for(let k=0;k<60;k++){const m=(lo+hi)/2;at(m)<target?lo=m:hi=m;}return Math.round(hi);
}
export function supportYear(i){
 const a=allocate(args(i)),t=taxEffect(i,a.deductible),sep=i.spSepYear===1?separationChoice(i,a.deductible):null;
 // Choosing the credit (subsection 118(5.1)) only changes the payer's return; the recipient still includes the spousal support.
 const useCredit=!!sep&&sep.better==='credit',deductible=useCredit?0:a.deductible,credit=useCredit?sep.credit:0,saved=useCredit?0:t.saved;
 return {...a,claimed:deductible,line21999:money(i.spPaid),saved,added:t.added,net:money(saved+credit-t.added),credit,sep,
  payerCost:money(i.spPaid-saved-credit),recipKept:money(i.spPaid-t.added),
  rrspPayer:-money(SP_2026.rrspRate*deductible),rrspRecip:money(SP_2026.rrspRate*a.toSpousal)};
}
export const SP_STATS={year:2024,asOf:'30 November 2025',url:DTC_STATS.url,
 // [range, returns deducting support payments made (item 37), amount in CAD thousands], grouped from CRA Table 2's 19 ranges like DTC_STATS.
 rows:[['Under 10k',440,2476],['10k–20k',570,2476],['20k–30k',1010,4346],['30k–40k',1500,7857],['40k–50k',2160,13904],['50k–60k',2520,17113],['60k–80k',5440,41771],['80k–100k',5700,50550],['100k–150k',12550,151019],['150k–250k',10650,223073],['250k+',8850,609366]],
 total:[51360,1123949]};
const cad=v=>'CAD '+v.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2});
export function supportPaymentsResult(kind,i){
 if(kind!=='supportPayments')throw Error('Unknown support payments illustration.');
 const H=supportYear(i),be=breakEvenSpousal(i);
 const xs=Array.from({length:61},(_,k)=>k*1000);
 const sweep=d=>taxEffect(i,d);
 const shares=[1,.9,.75,.6,.4,.2];
 const due=money(i.spArrears+i.spChildDue+i.spSpousalDue);
 const payers=[70000,90000,110000,150000,200000,260000],recips=[0,20000,35000,50000,70000,100000];
 const statRows=SP_STATS.rows.map(([label,n],k)=>({label,value:Math.round(n/DTC_STATS.rows[k][1]*100000)/100}));
 return {metrics:[
  ['Deductible spousal support, line 22000',H.claimed,'money',undefined,`${cad(H.line21999)} paid on line 21999; child support ${cad(money(H.toArrears+H.toChild))} counts first${H.sep&&H.sep.better==='credit'?' · line 30400 chosen instead':''}`],
  ['Payer’s federal tax saved',money(H.saved+H.credit),'money',undefined,H.credit?`Line 30400 credit ${cad(H.credit)} beats the deduction’s ${cad(H.sep.deduction)}`:'From deducting the spousal support on line 22000'],
  ['Recipient’s federal tax on line 12800',H.added,'money',undefined,H.toSpousal?`On ${cad(H.toSpousal)} of taxable spousal support; child support is not taxable`:'Nothing taxable: all payments count as child support'],
  ['Net federal tax change for the two returns',H.net,'money',undefined,H.net>=0?'Positive: the payer saves more than the recipient pays':'Negative: the recipient pays more than the payer saves'],
  ['Unpaid child support carried forward',H.childUnpaid,'money',undefined,H.childUnpaid?'Must be paid before any later spousal support is deductible':'Child support fully paid for this and earlier years']
 ],note:`Original illustration of the 2026 federal tax treatment of support paid under a court order or written agreement made after April 1997. Child support is neither deductible by the payer nor taxable to the recipient. Spousal support stated separately in the order is deducted by the payer on line 22000 and included by the recipient on line 12800, but only once all child support owed for the year and earlier years is paid, because each year’s payments count first as child support. Federal tax uses the 2026 brackets and the 14% basic personal amount, Canada employment amount and base CPP and EI credits on the employment income entered; provincial tax, other credits and income-tested benefits are not included. The year-of-separation option compares the deduction with a line 30400 claim for a child with no income. The model assumes the payments are periodic, the recipient can use them as they see fit and the order is registered where required; it does not model pre-May 1997 orders, lump sums, third-party payments or the T1157 election.`,charts:[
  {id:'sp-tax-by-spousal',type:'line',unit:'money',title:'Federal tax saved and paid as deductible spousal support rises',unitLabel:'CAD of 2026 federal tax',xLabel:'Deductible spousal support (CAD)',xUnit:'money',series:[{name:'Payer’s tax saved',rows:xs.map(x=>({x,value:sweep(x).saved}))},{name:'Recipient’s tax added',dash:true,rows:xs.map(x=>({x,value:sweep(x).added}))},{name:'Net change for the two returns',dash:true,rows:xs.map(x=>({x,value:sweep(x).net}))}],note:`The payer deducts at their own marginal federal rate and the recipient pays at theirs, so the net change depends on the gap between the two brackets. With the payer at ${cad(i.spPayerNet)} and the recipient at ${cad(i.spRecipNet)} of net income before support, each dollar moves between the two returns until it pushes the recipient into a higher bracket or the payer into a lower one. Child support never appears here.`},
  {id:'sp-priority-rule',type:'stackbar',unit:'money',title:'How short payments are split between child and spousal support',seriesNames:['Child support paid (earlier years and 2026)','Spousal support paid, deductible','Child support unpaid, carried forward','Spousal support unpaid'],rows:shares.map(s=>{const a=allocate({...args(i),paid:money(due*s)});return {label:`${Math.round(s*100)}% paid · ${cad(money(due*s))}`,values:[money(a.toArrears+a.toChild),a.toSpousal,a.childUnpaid,a.spousalUnpaid]};}),note:`Each bar is the ${cad(due)} owed under this order for 2026 including child support arrears. Whatever is paid fills child support first, so a payer who falls short loses the spousal deduction dollar for dollar until child support is caught up, and the unpaid child support is added to next year’s amount owed before spousal support can be deducted again.`},
  {id:'sp-where-it-goes',type:'stackbar',unit:'money',title:'Where this year’s payments end up after federal tax',seriesNames:['Cost to the payer, or kept by the recipient','Federal tax saved by the payer','Federal tax paid by the recipient'],rows:[{label:'Payer',values:[H.payerCost,money(H.saved+H.credit),0]},{label:'Recipient',values:[H.recipKept,0,H.added]}],note:'Both bars equal the total paid on line 21999 (payer) and received on line 12799 (recipient). Only the deductible spousal part changes either person’s tax; child support is paid out of the payer’s after-tax income and arrives tax-free.'},
  {id:'sp-net-grid',type:'heatmap',unit:'money',title:'Net federal tax change by the two incomes',rowLabel:'Payer’s net income before support',columns:recips.map(c=>`Recipient ${Math.round(c/1000)}k`),rows:payers.map(p=>({label:`Payer ${Math.round(p/1000)}k`,values:recips.map(c=>taxEffect({...i,spPayerNet:p,spPayerEarn:p,spRecipNet:c,spRecipEarn:c},H.toSpousal||i.spSpousalDue).net)})),note:`Payer’s federal tax saved minus recipient’s federal tax added on ${cad(H.toSpousal||i.spSpousalDue)} of deductible spousal support, with all income as employment income. A recipient with little other income has unused basic personal amount and other credits, so the first dollars of support are taxed at nothing; where the recipient is in a higher bracket than the payer, the cell turns negative.`},
  {id:'sp-separation-choice',type:'line',unit:'money',title:'Year of separation: deduction or eligible dependant credit',unitLabel:'CAD of payer’s 2026 federal tax saved',xLabel:'Spousal support paid and deductible (CAD)',xUnit:'money',series:[{name:'Line 22000 deduction',rows:xs.map(x=>({x,value:sweep(x).saved}))},{name:'Line 30400 credit for the child',dash:true,rows:xs.map(x=>({x,value:separationChoice(i,x).credit}))}],note:be===null?'At this income the deduction never reaches the value of the line 30400 credit within the range shown.':`In the year a couple separates, a payer who meets the line 30400 conditions for the child can claim either the line 30400 credit (and lines 30425 and 31800 for that child) or the support deduction, not both. Here the deduction is worth more once spousal support passes about ${cad(be)}. The credit uses CAD 16,452 at 14% for a child with no income and is capped by the payer’s federal tax.`},
  {id:'sp-cra-claims',type:'bar',evidence:'Official tax statistics',title:'Returns deducting support payments made, 2024',unit:'decimal',unitLabel:'Returns with a line 22000 deduction per 1,000 returns in the income range · 2024 tax year',rows:statRows,source:SP_STATS.url,sourceLabel:'CRA · Individual Income Tax Return Statistics, 2024 tax year, Table 2',note:'Data as of 30 November 2025; counts rounded to the nearest ten. Ranges are the claimant’s total income assessed, grouped from CRA’s 19 ranges. 51,360 returns deducted CAD 1.12 billion of support payments, about CAD 21,884 each; returns with CAD 250,000 or more of income deducted 54% of the dollars. The table counts only deductible (mostly spousal) support, not child support paid, and does not show support received.'}
 ]};
}
