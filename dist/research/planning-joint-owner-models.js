export const jointOwnerCap=100000;
export const jointOwnerDefinitions={jointOwnerPools:{title:'Group eligible joint deposits by member institution and the same set of owners',fields:[
 ['jointXabOne','Member X · owners A+B · account X1 (CAD)',72000,0,300000,1000],
 ['jointXabTwo','Member X · owners B+A · account X2 (CAD)',46000,0,300000,1000],
 ['jointXac','Member X · owners A+C · account X3 (CAD)',51000,0,300000,1000],
 ['jointYab','Member Y · owners A+B · account Y1 (CAD)',123000,0,300000,1000]
]}};
const cents=v=>Math.round(v*100);
export function aggregateJointPools(accounts){
 const groups=new Map();
 for(const a of accounts){
  const member=typeof a.member==='string'?a.member.trim():'';
  if(!member||!Array.isArray(a.owners)||a.owners.some(x=>typeof x!=='string'||!x.trim())||!Number.isFinite(a.balance)||a.balance<0||!Number.isSafeInteger(cents(a.balance)))throw Error('Invalid joint deposit inventory');
  const owners=[...new Set(a.owners.map(x=>x.trim()))].sort();
  if(owners.length<2)throw Error('At least two distinct joint owners are required');
  const key=JSON.stringify([member,owners]);
  if(!groups.has(key))groups.set(key,{member,owners,balanceCents:0,accounts:0});
  const g=groups.get(key);g.balanceCents+=cents(a.balance);g.accounts++;
  if(!Number.isSafeInteger(g.balanceCents))throw Error('Joint deposit total is too large');
 }
 const pools=[...groups.values()].map(g=>{const withinCents=Math.min(cents(jointOwnerCap),g.balanceCents);return {...g,balance:g.balanceCents/100,within:withinCents/100,above:(g.balanceCents-withinCents)/100,unused:Math.max(0,cents(jointOwnerCap)-g.balanceCents)/100};});
 const sum=key=>pools.reduce((s,g)=>s+cents(g[key]),0)/100;
 return {pools,total:sum('balance'),within:sum('within'),above:sum('above'),unused:sum('unused')};
}
export function jointOwnerLedger(i){return aggregateJointPools([
 {member:'X',owners:['A','B'],balance:i.jointXabOne},
 {member:'X',owners:['B','A'],balance:i.jointXabTwo},
 {member:'X',owners:['A','C'],balance:i.jointXac},
 {member:'Y',owners:['A','B'],balance:i.jointYab}
]);}
export function jointOwnerResult(kind,i){
 if(kind!=='jointOwnerPools')throw Error('Unknown joint-owner pool view');
 const p=jointOwnerLedger(i),label=g=>'Member '+g.member+' · '+g.owners.join('+');
 return {metrics:[['Entered eligible joint deposits',p.total,'money'],['Within the three assumed pool limits',p.within,'money'],['Above individual pool limits',p.above,'money']],
 note:'Original hypothetical CAD snapshot applying CDIC public guidance reviewed 25 October 2026. X and Y are assumed genuinely distinct CDIC member institutions. A, B and C are abstract owner labels, not clients. Every entered balance is independently assumed an eligible non-registered joint deposit, including principal and accrued interest through one common observation date. Member records are assumed to state joint ownership and retain every owner’s name and address. The same owner set at the same member is combined before a CAD 100,000 limit is applied, regardless of account count or owner display order. Balances are rounded to cents before aggregation. This illustration verifies no real eligibility, legal ownership, member identity, records or actual reimbursement. Trust/nominee arrangements, other categories, provincial insurance, future interest, currency conversion, tax and estate consequences are excluded. An amount above a modeled limit is not a predicted loss; a within-limit amount is not cash available today. Editing amounts changes no assumed ownership or member identity.',
 charts:[
 {id:'joint-owner-combined-balances',type:'groupbar',unit:'money',unitLabel:'CAD · eligible balance including accrued interest at one snapshot date',title:'Four account rows become three member-and-owner-set pools',seriesNames:['Combined eligible balance','Assumed pool limit'],rows:p.pools.map(g=>({label:label(g),values:[g.balance,jointOwnerCap]})),note:'Accounts X1 (A+B) and X2 (B+A) have the same two assumed owners at the same member, so their amounts form one pool. X’s A+C pool and Y’s A+B pool remain separate. The repeated CAD 100,000 bar is a comparison threshold, not another deposit to add to the inventory.'},
 {id:'joint-owner-within-above',type:'stackbar',unit:'money',unitLabel:'CAD · each pool tested separately',title:'Apply the limit after combining each compatible group',seriesNames:['Within that pool’s limit','Above that pool’s limit'],rows:p.pools.map(g=>({label:label(g),values:[g.within,g.above]})),note:'Each bar reconciles min(pool balance, CAD 100,000) plus max(pool balance − CAD 100,000, zero). Owners do not each receive an extra limit inside the same set. Unused capacity in another pool is not subtracted from an above-limit amount. All coverage amounts remain conditional on the stated eligibility and record assumptions.'},
 {id:'joint-owner-total-reconciliation',type:'waterfall',unit:'money',unitLabel:'CAD · sum only after separate pool tests',title:'Reconcile the inventory with its within-limit and above-limit portions',rows:[{label:'All entered joint deposits',value:p.total},{label:'Within separate pool limits',value:-p.within}],totalLabel:'Above individual pool limits',note:'The endpoint is the entered total minus the sum of each pool’s within-limit amount. Adding three notional limits first and capping the entire inventory would produce a different answer when balances are uneven. No loss probability, recovery estimate or payment date is assigned to the endpoint.'},
 {id:'joint-owner-same-set-sensitivity',type:'heatmap',unit:'money',unitLabel:'CAD above limit · Member X, owners A+B only',rowLabel:'Account X1 multiple',columns:['X2 ×0','X2 ×1','X2 ×2'],rows:[0,1,2].map(a=>({label:'X1 ×'+a,values:[0,1,2].map(b=>Math.max(0,cents(i.jointXabOne*a)+cents(i.jointXabTwo*b)-cents(jointOwnerCap))/100)})),title:'Two accounts with the same owners still share one threshold',note:'Rows multiply entered account X1 and columns multiply entered account X2 by zero, one or two. Each stressed account balance is rounded to cents first. The centre cell reproduces only X’s A+B pool’s above-limit amount, not the full inventory’s excess. X’s A+C and Y’s A+B pools are excluded from every cell. Multipliers are arithmetic sensitivities, not suggested transfers or ownership changes.'}
 ]};
}
