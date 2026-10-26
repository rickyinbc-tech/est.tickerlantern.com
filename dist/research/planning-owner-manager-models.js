const issue=i=>i.ownerSalary>i.ownerProfit?{message:'Salary cannot exceed the selected pre-compensation profit pool in this simplified ledger.',fields:['ownerSalary']}:null;
export const ownerManagerDefinitions={ownerManagerCompensation:{title:'Trace a company-profit pool through salary, assumed corporate tax and dividend',inputIssue:issue,fields:[
 ['ownerProfit','Company profit before owner salary (CAD)',120000,0,5000000,5000],
 ['ownerSalary','Owner salary paid from this pool (CAD)',60000,0,5000000,5000],
 ['ownerCorpRate','Assumed corporate tax rate on the remaining profit (%)',15,0,40,0.5]
]}};
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
export function ownerManagerResult(kind,i){
 if(kind!=='ownerManagerCompensation')throw Error('Unknown owner-manager compensation illustration.');
 const profit=i.ownerProfit,salary=i.ownerSalary,rate=i.ownerCorpRate/100,remaining=Math.max(0,profit-salary),corpTax=money(remaining*rate),dividend=money(remaining-corpTax),grossReceipts=money(salary+dividend),rrspRoom=Math.min(money(salary*.18),35390);
 const parts=[0,.25,.5,.75,1].map(q=>{const s=money(profit*q),left=Math.max(0,profit-s),tax=money(left*rate),d=money(left-tax);return {label:`${Math.round(q*100)}% salary share`,values:[s,tax,d]}});
 const rateScenarios=[0,.10,.15,.20,.25,.30,.40];
 const rateRows=rateScenarios.map(r=>({label:`${Math.round(r*100)}% assumed rate`,values:[money(remaining*r),money(remaining*(1-r))]}));
 return {metrics:[
  ['Salary from selected company-profit pool',money(salary),'money'],
  ['Corporate-tax amount under selected assumption',corpTax,'money'],
  ['Residual dividend under selected assumption',dividend,'money'],
  ['Gross personal receipts before personal tax',grossReceipts,'money'],
  ['Illustrative new RRSP room attributable to this salary, before adjustments',rrspRoom,'money']
 ],note:'Original cash-flow illustration, not tax advice or a salary/dividend recommendation. It assumes the full salary is deductible from the selected profit pool, the remaining amount is taxed once at the user-entered illustrative corporate rate, and all after-tax residual profit is paid immediately as a dividend. The 15% default is an editable hypothetical assumption, not a quoted combined statutory rate. No personal tax, payroll withholding, employer payroll cost, refundable tax, retained earnings, dividend gross-up or credit cash effect, other income, CPP contribution amount, EI/QPP treatment or timing is calculated. RRSP room uses 18% of this illustrative salary only, capped at the official 2027 annual dollar limit of CAD 35,390, before pension adjustments and all other room factors; the taxpayer’s CRA notice of assessment controls.',charts:[
  {id:'owner-corporate-ledger',type:'stackbar',unit:'money',title:'Reconcile the selected profit pool',unitLabel:'Original hypothetical cash allocation · CAD',seriesNames:['Salary','Assumed corporate tax','Residual dividend'],rows:[{label:'Selected scenario',values:[money(salary),corpTax,dividend]}],note:'The three cash-allocation segments add back to the selected pre-compensation company profit. The assumed company tax is an editable scenario input, not a jurisdiction-specific rate. This company-level bridge does not add the personal tax on salary or dividend.'},
  {id:'owner-gross-receipts',type:'stackbar',unit:'money',title:'Gross personal receipts before personal income tax',unitLabel:'Cash received in the simplified example · CAD',seriesNames:['Salary','Dividend'],rows:[{label:'Selected scenario',values:[money(salary),dividend]}],note:'Gross receipts are not after-tax income. Salary withholding and personal tax on both types of income are outside the model. A dividend is not the same amount as taxable dividend income after the gross-up.'},
  {id:'owner-rrsp-earned-income',type:'bar',unit:'money',title:'Salary can create earned income for next-year RRSP-room calculations',unitLabel:'Illustrative room attributable to this salary only · CAD',rows:[{label:'Selected salary · 18%, capped at 2027 limit',value:rrspRoom},{label:'Dividend portion · earned-income addition in this illustration',value:0}],note:'CRA generally adds the lesser of 18% of previous-year earned income and the annual RRSP dollar limit, then applies pension adjustment and other terms. The official 2027 dollar limit is CAD 35,390. This figure is only the potential addition from the selected salary, before adjustments; it is not the full personal deduction limit or permission to contribute.'},
  {id:'owner-tax-rate-sensitivity',type:'stackbar',unit:'money',title:'A different tax assumption changes the residual dividend',unitLabel:'Remaining profit after salary · illustrative CAD',seriesNames:['Assumed corporation tax','Dividend if all residual cash is distributed'],rows:rateRows,note:`The salary and remaining pre-tax profit are held at CAD ${Math.round(salary).toLocaleString('en-CA')} and CAD ${Math.round(remaining).toLocaleString('en-CA')}; only the assumed corporate-tax rate changes. Every row adds back to the same remaining profit. This sensitivity is arithmetic, not a table of official rates or an estimate of combined corporate-personal tax.`}
 ]};
}
