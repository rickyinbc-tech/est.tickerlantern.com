export const warrantyRiskDefinitions={warrantyRisk:{title:'Compare average repair costs with the reserve needed in each outcome',fields:[
 ['warrantyFee','One upfront service-contract fee (CAD)',180,0,2000,20],
 ['warrantyRepair','Cost of the one modeled eligible repair (CAD)',800,0,5000,100],
 ['warrantyDeductible','Out-of-pocket amount per modeled repair (CAD)',100,0,1000,25],
 ['warrantyProbability','Assumed chance of that repair over the whole comparison period (%)',20,0,100,5],
 ['warrantyReserve','Cash reserve available before paying any contract fee (CAD)',500,0,10000,100]
]}};
export function warrantyComparison(i){
 const p=i.warrantyProbability/100,outOfPocket=Math.min(i.warrantyRepair,i.warrantyDeductible),covered=i.warrantyRepair-outOfPocket;
 const selfExpected=p*i.warrantyRepair,contractExpected=i.warrantyFee+p*outOfPocket;
 const equality=covered>0&&i.warrantyFee<=covered?i.warrantyFee/covered:null;
 return {p,outOfPocket,covered,selfExpected,contractExpected,equality,allEqual:covered===0&&i.warrantyFee===0,
  selfRepairPosition:i.warrantyReserve-i.warrantyRepair,contractNoRepairPosition:i.warrantyReserve-i.warrantyFee,
  contractRepairPosition:i.warrantyReserve-i.warrantyFee-outOfPocket};
}
export function warrantyRiskResult(kind,i){
 if(kind!=='warrantyRisk')throw Error('Unknown warranty-risk topic.');
 const p=warrantyComparison(i),probabilities=Array.from({length:21},(_,j)=>j*5);
 return {metrics:[['Expected cost: contract minus paying directly',p.contractExpected-p.selfExpected,'money'],['Equality probability in the two-outcome model',p.equality,'percent',p.allEqual?'Equal for all probabilities':p.equality==null?'No equality within 0–100%':undefined],['Reserve shortfall if the repair is paid directly',Math.max(0,-p.selfRepairPosition),'money']],note:'Original two-outcome illustration for one fixed comparison period: no repair, or exactly one eligible repair at the entered cost. The probability is an assumption for that WHOLE period, not an annual rate, observed failure statistic or confidence interval. The service-contract fee is paid once upfront in both outcomes; the modeled repair is fully accepted and the provider directly pays costs above the out-of-pocket amount, which is capped at the repair cost. No extra repair, exclusion, claim limit, reimbursement delay, provider default, shipping, maintenance, tax, financing, cancellation refund or residual product value is modeled. Original product purchase cost is common to both choices and omitted. All costs are undiscounted nominal CAD. The reserve begins before paying the fee, receives no later deposits or interest, and is independent of the cost-probability calculation. Negative reserve positions mean funding still needed, not available credit or an actual negative bank asset. These two states do not define the maximum loss of a real contract.',charts:[
  {id:'warranty-outcome-costs',type:'groupbar',title:'The contract fee is paid even when no modeled repair occurs',unit:'money',seriesNames:['Pay repair directly','Buy the hypothetical contract'],rows:[
   {label:'No eligible repair',values:[0,i.warrantyFee]},
   {label:'One eligible repair',values:[i.warrantyRepair,i.warrantyFee+p.outOfPocket]}
  ],note:'The second state assumes the claim is accepted and the provider settles covered costs directly. It is not a promise that an actual failure qualifies. An out-of-pocket entry above the repair cost is capped at that cost, so the contract cannot create a negative covered amount.'},
  {id:'warranty-expected-cost',type:'line',title:'Expected cost weights the two outcomes; it is not a bill you will receive',unit:'money',xLabel:'Assumed repair chance (%)',xTicks:[{value:0,label:'0%'},{value:50,label:'50%'},{value:100,label:'100%'}],series:[
   {name:'Pay directly · expected outlay',rows:probabilities.map(x=>({x,value:x/100*i.warrantyRepair}))},
   {name:'Contract · expected outlay',dash:true,rows:probabilities.map(x=>({x,value:i.warrantyFee+x/100*p.outOfPocket}))}
  ],note:'Horizontal values are alternative assumed probabilities over the same whole period. The lines are exact linear expectations, not fitted observations. For a single item, the realized outcome is one of the two state costs above; an expected CAD amount need never be an actual payment.'},
  {id:'warranty-cost-matrix',type:'heatmap',title:'Expected cost differences depend on repair severity as well as its chance',unit:'money',signed:true,columns:['$300','$600','$900','$1,200'],rows:[10,25,50,75].map(chance=>({label:chance+'% chance',values:[300,600,900,1200].map(repair=>i.warrantyFee+chance/100*Math.min(repair,i.warrantyDeductible)-chance/100*repair)})),note:'Each cell is contract expected cost minus direct-repair expected cost. Negative cells mean the contract has a lower mathematical expectation under those assumptions. Fee and deductible retain the selected values; row probabilities and column repair amounts replace their respective controls. No scenario is assigned empirical credibility.'},
  {id:'warranty-reserve-positions',type:'signedbar',title:'A modest expected cost can still leave a large repair-day funding gap',unit:'money',unitLabel:'Reserve less total modeled outlay (CAD) · negative = funding gap',rows:[
   {label:'Direct payment · no repair',value:i.warrantyReserve},
   {label:'Contract · no repair',value:p.contractNoRepairPosition},
   {label:'Direct payment · one repair',value:p.selfRepairPosition},
   {label:'Contract · one repair',value:p.contractRepairPosition}
  ],note:'The same opening reserve is used for each independent case. Contract positions subtract the fee once before any repair out-of-pocket amount. Negative values show unresolved financing needs. Changing probability does not change the cash required in a specified state. This optimistic coverage model does not include a delay during which the household pays the full repair bill.'}
 ]};
}
