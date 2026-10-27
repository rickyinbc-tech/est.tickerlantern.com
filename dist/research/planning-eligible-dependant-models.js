import {taxRoom,bpa} from './planning-metc-claim-models.js';
import {DTC_STATS} from './planning-dtc-transfer-models.js';
const issue=i=>i.edType===2&&!i.edInfirm?{message:'A child, grandchild, brother or sister 18 or older qualifies only if they depend on you because of a mental or physical infirmity.',fields:['edType','edInfirm']}:i.edEarnA>i.edNetA+30000?{message:'The claimant’s employment income should not exceed net income by more than the deductions it could plausibly carry.',fields:['edEarnA','edNetA']}:null;
export const eligibleDependantDefinitions={eligibleDependant:{title:'Work out the 2026 eligible dependant amount, the caregiver top-up and the credit a single claimant can use',inputIssue:issue,fields:[
 ['edNetA','Claimant’s 2026 net income, taken as taxable income (CAD)',52000,0,300000,100],
 ['edEarnA','Employment income in it (CAD; drives the CPP, EI and Canada employment amount credits)',52000,0,300000,100],
 ['edType','Dependant: 1 = child, grandchild, brother or sister under 18 · 2 = one of those 18 or older · 3 = parent or grandparent',1,1,3,1],
 ['edInfirm','Dependant depends on you because of a mental or physical infirmity (1 = yes · 0 = no)',0,0,1,1],
 ['edOwnChild','Under 18 only: your or your spouse’s child, so the infirmity amount goes on line 30500 (1 = yes · 0 = no)',1,0,1,1],
 ['edNetD','Dependant’s 2026 net income, line 23600 (CAD)',0,0,60000,100]
]}};
export const eligibleDependantWholeKeys=['edType','edInfirm','edOwnChild'];
const r6=n=>Math.round(n*1e6)/1e6;
const money=n=>Math.round(r6(n)*100+1e-7)/100;
// CRA 2026 indexed amounts (indexation 2.0%); line structure from the 2025 Schedule 5 (5000-S5).
export const ED_2026={rate:.14,infirmAdd:2740,ccaMax:8773,ccaFrom:20601,bpaMax:16452,bpaMin:14829};
export const ED_2025={rate:.145,infirmAdd:2687,ccaMax:8601,ccaFrom:20197,ccaTo:28798,lowBound:8624,bpaMax:16129,bpaMin:14538};
const E=ED_2026;
export const ccaTo=money(E.ccaMax+E.ccaFrom);
// Schedule 5: line 30400, then the line 30425 top-up for a dependant 18 or older, or line 30500 for an infirm own child under 18.
export function schedule5({netA,type,infirm,ownChild,netD}){
 const child=type===1,base=bpa(netA),add=infirm&&!(child&&ownChild)?E.infirmAdd:0;
 const l30400=Math.max(0,money(base+add-netD));
 const l30425=infirm&&!child?Math.max(0,money(Math.min(E.ccaMax,Math.max(0,ccaTo-netD))-l30400)):0;
 const l30500=infirm&&child&&ownChild?E.infirmAdd:0;
 return {base,add,l30400,l30425,l30500,claimed:money(l30400+l30425+l30500)};
}
const args=i=>({netA:i.edNetA,type:i.edType,infirm:i.edInfirm===1,ownChild:i.edOwnChild===1,netD:i.edNetD});
export function claim(i){
 const s=schedule5(args(i)),t=taxRoom(i.edNetA,i.edEarnA),credit=money(E.rate*s.claimed),used=Math.min(credit,t.room);
 return {...s,credit,room:t.room,gross:t.gross,used:money(used),lost:money(credit-used)};
}
// Dependant net income at which nothing is left to claim on lines 30400 and 30425 (line 30500 does not depend on it).
export function zeroIncome(i){const s=schedule5({...args(i),netD:0});return i.edInfirm===1&&i.edType!==1?Math.max(ccaTo,money(s.base+s.add)):money(s.base+s.add);}
// Claimant income below which part of the credit is wasted for lack of federal tax (all employment income).
export function fullUseIncome(i){const at=x=>claim({...i,edNetA:x,edEarnA:x}).lost;if(at(300000)>0)return 300000;let lo=0,hi=300000;for(let k=0;k<60;k++){const m=(lo+hi)/2;at(m)>0?lo=m:hi=m;}return Math.round(hi);}
export const ED_STATS={year:2024,asOf:'30 November 2025',url:DTC_STATS.url,
 // [range, returns with line 30400 (item 64), amount in CAD thousands], grouped from CRA Table 2's 19 ranges like DTC_STATS.
 rows:[['Under 10k',122950,1864659],['10k–20k',126470,1935792],['20k–30k',106940,1622851],['30k–40k',93390,1406182],['40k–50k',96340,1444049],['50k–60k',91970,1369285],['60k–80k',133300,1970987],['80k–100k',83990,1234872],['100k–150k',102310,1495043],['150k–250k',34060,488402],['250k+',10520,138301]],
 total:[1002220,14970423],caregiver:[344670,2248484],childInfirm:[187990,552322]};
const cad=v=>'CAD '+v.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2});
const typeName=['','child or sibling under 18','child or sibling 18 or older','parent or grandparent'];
export function eligibleDependantResult(kind,i){
 if(kind!=='eligibleDependant')throw Error('Unknown eligible dependant illustration.');
 const H=claim(i),zero=zeroIncome(i),full=fullUseIncome(i);
 const xs=Array.from({length:71},(_,k)=>k*500),ax=Array.from({length:61},(_,k)=>k*2000);
 const profiles=[['Child under 18',{edType:1,edInfirm:0,edOwnChild:1}],['Infirm own child under 18',{edType:1,edInfirm:1,edOwnChild:1}],['Infirm adult child or sibling',{edType:2,edInfirm:1,edOwnChild:0}],['Parent, not infirm',{edType:3,edInfirm:0,edOwnChild:0}],['Infirm parent',{edType:3,edInfirm:1,edOwnChild:0}]];
 const lines=[['Child under 18, not infirm',profiles[0][1]],['Infirm adult child or parent',profiles[4][1]],['Parent, not infirm',profiles[3][1]]];
 const cols=[15000,20000,25000,30000,40000,60000,100000];
 const deps=[['Child under 18 with no income',{edType:1,edInfirm:0,edOwnChild:1,edNetD:0}],['Teenager earning CAD 6,000',{edType:1,edInfirm:0,edOwnChild:1,edNetD:6000}],['Infirm adult child, CAD 12,000 of benefits',{edType:2,edInfirm:1,edOwnChild:0,edNetD:12000}],['Parent with CAD 15,000 of CPP and OAS',{edType:3,edInfirm:0,edOwnChild:0,edNetD:15000}],['Infirm parent with CAD 18,000',{edType:3,edInfirm:1,edOwnChild:0,edNetD:18000}]];
 const stackCases=[['This claimant',i],['Child, no income',{...i,...deps[0][1]}],['Teen earning 6k',{...i,...deps[1][1]}],['Infirm parent, 18k',{...i,...deps[4][1]}],['Parent, 15k, not infirm',{...i,...deps[3][1]}]];
 const statRows=ED_STATS.rows.map(([label,n],k)=>({label,value:Math.round(n/DTC_STATS.rows[k][1]*10000)/10}));
 return {metrics:[
  ['Amount for an eligible dependant, line 30400',H.l30400,'money',undefined,`Basic personal amount ${cad(H.base)}${H.add?` + infirmity ${cad(H.add)}`:''} − dependant’s net income ${cad(i.edNetD)}`],
  ['Caregiver top-up, line 30425 or line 30500',money(H.l30425+H.l30500),'money',undefined,H.l30500?'CAD 2,740 on line 30500 for an infirm child under 18':H.l30425?`Up to ${cad(E.ccaMax)}, less the line 30400 claim`:i.edInfirm?'Nothing left once line 30400 exceeds the caregiver amount':'Only for a dependant who depends on you because of an infirmity'],
  ['Federal credit the claimant can use',H.used,'money',undefined,`${cad(H.claimed)} × 14% = ${cad(H.credit)}${H.lost?` · ${cad(H.lost)} wasted for lack of tax`:''}`],
  ['Claimant’s federal tax left after own basic credits',H.room,'money',undefined,H.room>=H.credit?'Enough to use the whole credit':`Full use needs about ${cad(full)} of employment income`],
  ['Dependant income at which lines 30400 and 30425 reach zero',zero,'money',undefined,`For a ${typeName[i.edType]}${i.edInfirm?' with an infirmity':''}`]
 ],note:`Original illustration of the 2026 federal amount for an eligible dependant (line 30400) for a claimant with no spouse or common-law partner, or one they did not live with or support, using the 2025 Schedule 5 line structure with CRA’s 2026 indexed amounts. Line 30400 is the claimant’s basic personal amount (CAD 16,452 up to CAD 181,440 of net income, falling to CAD 14,829) plus CAD 2,740 if the dependant depends on the claimant because of an infirmity, less the dependant’s net income. For an infirm dependant 18 or older, line 30425 adds the amount by which the lesser of CAD 8,773 and CAD 29,374 minus the dependant’s income exceeds the line 30400 claim; for an infirm child of the claimant under 18 the CAD 2,740 goes on line 30500 instead. Credits are 14% and only reduce federal tax left after the claimant’s basic personal amount and the CPP, EI and Canada employment credits on employment income entered. The model assumes the eligibility tests are met and nobody else in the household claims; it does not model support payments, provincial amounts, the disability amount transfer or the Canada child benefit.`,charts:[
  {id:'ed-amount-by-dependant-income',type:'line',unit:'money',title:'Amount claimed as the dependant’s income rises',unitLabel:'CAD claimed on lines 30400 and 30425 (before the 14% rate)',xLabel:'Dependant’s net income (CAD)',xUnit:'money',series:lines.map(([name,p],k)=>({name,dash:k>0,rows:xs.map(x=>({x,value:money(schedule5({...args({...i,...p}),netD:x}).l30400+schedule5({...args({...i,...p}),netD:x}).l30425)}))})),note:`Every dollar of a dependant’s net income reduces line 30400 by a dollar. For an infirm dependant 18 or older the line 30425 top-up keeps the total at CAD 8,773 until their income reaches CAD 20,601, then it falls to zero at ${cad(ccaTo)}, well past the point where line 30400 alone would end. The claimant’s net income of ${cad(i.edNetA)} sets the basic personal amount used.`},
  {id:'ed-waterfall',type:'waterfall',unit:'money',title:'From the basic personal amount to the credit used',rows:[{label:'Claimant’s basic personal amount',value:H.base},{label:'Infirmity addition',value:H.add},{label:'Less the dependant’s net income',value:-money(H.base+H.add-H.l30400)||0},{label:'Caregiver top-up, line 30425',value:H.l30425},{label:'Infirm child amount, line 30500',value:H.l30500},{label:'Less the 86% that is not credited',value:-money(H.claimed-H.credit)},{label:'Less credit with no tax to absorb it',value:H.lost?-H.lost:0}],totalLabel:'Claimant’s federal credit',note:'The deduction for the dependant’s income cannot take line 30400 below zero. Each CAD 1 claimed is worth 14 cents of federal tax, and only against federal tax the claimant still owes after their own basic personal amount and payroll credits.'},
  {id:'ed-claimant-income',type:'line',unit:'money',title:'Credit the claimant can use by the claimant’s own income',unitLabel:'CAD of federal credit',xLabel:'Claimant’s net income, all employment income (CAD)',xUnit:'money',series:[{name:'Credit used',rows:ax.map(x=>({x,value:claim({...i,edNetA:x,edEarnA:x}).used}))},{name:'Credit available',dash:true,rows:ax.map(x=>({x,value:claim({...i,edNetA:x,edEarnA:x}).credit}))}],note:`A single parent earning little owes little federal tax after their own basic personal amount, Canada employment amount and CPP and EI credits, so most of the credit is lost: here it is fully usable from about ${cad(full)} of employment income. The credit is non-refundable and unused amounts cannot be carried forward or moved to another person.`},
  {id:'ed-profile-grid',type:'heatmap',unit:'money',title:'Federal credit used by dependant and claimant income',rowLabel:'Dependant',columns:cols.map(c=>`Claimant ${Math.round(c/1000)}k`),rows:deps.map(([label,p])=>({label,values:cols.map(c=>claim({...i,...p,edNetA:c,edEarnA:c}).used)})),note:'All claimant income is employment income. The low-income columns show the credit cut off by the claimant’s own tax; the rows show it cut by the dependant’s income. A parent with CAD 15,000 of income and no infirmity leaves only CAD 1,452 of line 30400; with an infirmity and CAD 18,000 the caregiver top-up restores CAD 8,773 in total.'},
  {id:'ed-where-it-goes',type:'stackbar',unit:'money',title:'What happens to the basic personal amount in each case',seriesNames:['Credited and used (in amount terms)','Claimed but no tax to absorb it','Cancelled by the dependant’s income'],rows:stackCases.map(([label,x])=>{const h=claim(x),cap=schedule5({...args(x),netD:0}).claimed,lostAmt=h.credit?money(h.lost/E.rate):0;return {label,values:[money(h.claimed-lostAmt),lostAmt,Math.max(0,money(cap-h.claimed))]};}),note:'Each bar is in CAD of amount before the 14% rate. The full bar is the most that could be claimed for that dependant if they had no income: the claimant’s basic personal amount, plus CAD 2,740 for an infirm dependant. Lost credit is converted back to an amount at 14%.'},
  {id:'ed-cra-claims',type:'bar',evidence:'Official tax statistics',title:'Returns claiming the amount for an eligible dependant, 2024',unit:'decimal',unitLabel:'Returns with line 30400 per 1,000 returns in the income range · 2024 tax year',rows:statRows,source:ED_STATS.url,sourceLabel:'CRA · Individual Income Tax Return Statistics, 2024 tax year, Table 2',note:'Data as of 30 November 2025; counts rounded to the nearest ten. Ranges are the claimant’s total income assessed, grouped from CRA’s 19 ranges. 1,002,220 returns claimed CAD 14.97 billion on line 30400, about CAD 14,937 each. 122,950 claims came from returns with under CAD 10,000 of income, where a non-refundable credit can reduce little or no federal tax; the table does not show how much of the credit was used, the dependants’ ages or the claimants’ family type.'}
 ]};
}
