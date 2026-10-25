export const stagedDrawDefinitions={
 stagedDraw:{title:'Compare one immediate draw with three draws aligned to project bills',fields:[
  ['projectBudget','Total project bills, financed in full (CAD)',60000,0,300000,5000],
  ['drawSpacing','Equal months between project bills; first bill at this month',3,1,4,1],
  ['borrowingRate','Assumed annual borrowing rate; monthly rate is one twelfth (%)',8,0,18,0.25],
  ['parkingRate','Assumed annual rate paid on unused borrowed cash (%)',2,0,8,0.25],
  ['drawFee','Out-of-pocket fee for each positive draw (CAD)',50,0,500,10]
 ]}
};

export function stagedDrawLedger(d){
 const billMonths=[d.drawSpacing,2*d.drawSpacing,3*d.drawSpacing],rows=[{month:0,fullDebt:d.projectBudget,stagedDebt:0,projectCash:d.projectBudget,stagedUnused:d.projectBudget,paid:0,fullInterest:0,stagedInterest:0,cashInterest:0}];
 let count=0,fullInterest=0,stagedInterest=0,cashInterest=0;
 for(let month=1;month<=12;month++){
  if(billMonths.includes(month))count++;
  const paid=count===3?d.projectBudget:count*d.projectBudget/3,projectCash=Math.max(0,d.projectBudget-paid);
  fullInterest+=d.projectBudget*d.borrowingRate/1200;
  stagedInterest+=paid*d.borrowingRate/1200;
  cashInterest+=projectCash*d.parkingRate/1200;
  rows.push({month,fullDebt:d.projectBudget,stagedDebt:paid,projectCash,stagedUnused:projectCash,paid,fullInterest,stagedInterest,cashInterest});
 }
 const fullFees=d.projectBudget>0?d.drawFee:0,stagedFees=d.projectBudget>0?3*d.drawFee:0;
 const fullCost=fullInterest+fullFees-cashInterest,stagedCost=stagedInterest+stagedFees;
 return {billMonths,rows,fullInterest,stagedInterest,cashInterest,fullFees,stagedFees,fullCost,stagedCost,gap:stagedCost-fullCost};
}

export function stagedDrawResult(kind,d){
 if(kind!=='stagedDraw')throw Error('Unknown staged-draw scenario.');
 const p=stagedDrawLedger(d),snapshots=[...new Set([0,d.drawSpacing-1,...p.billMonths,12])].sort((a,b)=>a-b).map(m=>p.rows[m]);
 return {metrics:[['Immediate draw: 12-month net carrying cost',p.fullCost,'money'],['Staged draws: 12-month net carrying cost',p.stagedCost,'money'],['Staged cost less immediate-draw cost',p.gap,'money']],
 note:'Original hypothetical 12-month comparison of two draw schedules on an assumed approved facility. Both finance the same three equal bills, due at the start of months spacing, twice spacing and three times spacing. One draws the entire project amount at time zero. The other draws only the bill amount at each due date, with all later draws assumed available. Rates stay fixed and annual rates divided by 12 apply to the post-bill balance for each whole monthly period. This deliberately simplified convention is not a reproduction of daily contractual interest. Borrowing interest and fees are paid from separate household cash; they are not capitalized. Interest on unused borrowed cash is paid out separately, before tax, and is not reinvested in the project pot. Neither alternative repays principal during the modeled year. Net carrying cost means borrowing interest plus draw fees less cash interest, not total project cost or total future repayment. Negative net cost can occur under entered rates and is not an available borrowing/deposit arrangement.',charts:[
  {id:'staged-draw-principal-path',type:'line',title:'Drawing later reduces early debt but both schedules end with the project debt',unit:'money',xLabel:'Monthly checkpoint',series:[{name:'Entire project amount drawn at time zero',step:true,rows:p.rows.map(r=>({x:r.month,value:r.fullDebt}))},{name:'Draws when the three bills are due',step:true,dash:true,rows:p.rows.map(r=>({x:r.month,value:r.stagedDebt}))}],note:'Month zero is immediately after the full draw. Later checkpoints show the start-of-month draw and bill, then the monthly interest period. Principal never falls because interest is paid separately and no principal repayments are modeled. Financing the project does not establish its resale value or an increase in household net worth.'},
  {id:'staged-draw-cash-limit',type:'groupbar',title:'The same unused amount can be borrowed cash in one schedule and an undrawn limit in the other',unit:'money',unitLabel:'Different resources at selected checkpoints · CAD',seriesNames:['Immediate draw · borrowed project cash held','Staged draws · undrawn facility capacity'],rows:snapshots.map(r=>({label:'Month '+r.month,values:[r.projectCash,r.stagedUnused]})),note:'Equal bar heights do not make the resources interchangeable. The first is cash already borrowed, with matching debt. The second is assumed remaining credit capacity and is not an asset or cash received. Do not add these mutually exclusive alternatives together. All project bills are paid from their own schedule.'},
  {id:'staged-draw-cost-reconciliation',type:'waterfall',title:'Reconcile the net carrying-cost difference, including fees and cash interest',unit:'money',rows:[{label:'Staged borrowing interest',value:p.stagedInterest},{label:'Staged draw fees',value:p.stagedFees},{label:'Less immediate-draw interest',value:-p.fullInterest},{label:'Less immediate-draw fee',value:-p.fullFees},{label:'Immediate cash interest offset',value:p.cashInterest}],totalLabel:'Staged less immediate net cost',note:'The immediate schedule’s cash interest is subtracted in its own cost, so it enters with a positive sign when computing staged cost less immediate cost. Negative final values mean the staged schedule has a smaller modeled cost. Project principal is excluded from this difference because both schedules finance and still owe the same total.'},
  {id:'staged-draw-rate-spacing',type:'heatmap',signed:true,title:'How do borrowing rates and later project bills change the cost difference?',unit:'money',unitLabel:'Staged net cost less immediate-draw net cost over 12 months · CAD',columns:['4%','8%','12%','16%'],rows:[1,2,3,4].map(spacing=>({label:spacing+' mo gap',values:[4,8,12,16].map(rate=>stagedDrawLedger({...d,drawSpacing:spacing,borrowingRate:rate}).gap)})),note:'Each row places three equal bills at the stated spacing and its next two multiples. Columns replace the borrowing rate. Project size, cash-interest rate and fee per draw stay selected. The comparison assumes later credit remains available and project costs do not change. It does not model approval risk, rate changes, additional bills or principal repayment.'}
 ]};
}
