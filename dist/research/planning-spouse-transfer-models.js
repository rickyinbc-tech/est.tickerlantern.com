import {taxRoom,federalTax,bpa} from './planning-metc-claim-models.js';
import {DTC_STATS} from './planning-dtc-transfer-models.js';
const issue=i=>i.sctPensionB+i.sctEarnB>i.sctNetB?{message:'The spouse’s eligible pension income and employment income together cannot exceed their net income in this model.',fields:['sctPensionB','sctEarnB','sctNetB']}:i.sctPensionA+i.sctEarnA>i.sctNetA+60000?{message:'The claimant’s pension and employment income should not exceed net income by more than the deductions it could plausibly carry.',fields:['sctPensionA','sctEarnA']}:!i.sctAgeB&&!i.sctDtcB&&!i.sctTuitionB&&!i.sctPensionB?{message:'Give the lower-income spouse at least one transferable amount: age 65 or older, eligible pension income, an approved disability amount or current-year tuition.',fields:['sctAgeB','sctPensionB','sctDtcB','sctTuitionB']}:null;
export const spouseTransferDefinitions={spouseTransfer:{title:'Transfer a spouse’s unused 2026 age, pension, disability and tuition amounts on Schedule 2',inputIssue:issue,fields:[
 ['sctAgeB','Lower-income spouse 65 or older at 31 December 2026, born 1961 or earlier (1 = yes · 0 = no)',1,0,1,1],
 ['sctNetB','Lower-income spouse’s 2026 net income, taken as taxable income (CAD)',20000,0,150000,100],
 ['sctPensionB','Eligible pension income in it: RRIF, annuity or registered pension, not CPP, OAS or GIS (CAD)',4000,0,150000,100],
 ['sctEarnB','Spouse’s employment income in it (CAD; drives their CPP, EI and employment-amount credits)',0,0,150000,100],
 ['sctDtcB','Spouse approved for the disability tax credit on Form T2201 (1 = yes · 0 = no)',0,0,1,1],
 ['sctTuitionB','Spouse’s 2026 eligible tuition fees (CAD; carried-forward amounts cannot be transferred)',0,0,40000,50],
 ['sctAgeA','Claimant 65 or older at 31 December 2026 (1 = yes · 0 = no)',1,0,1,1],
 ['sctNetA','Claimant’s 2026 net income (CAD)',85000,0,300000,100],
 ['sctPensionA','Claimant’s eligible pension income in it (CAD)',40000,0,300000,100],
 ['sctEarnA','Claimant’s employment income in it (CAD)',0,0,300000,100]
]}};
export const spouseTransferWholeKeys=['sctAgeB','sctDtcB','sctAgeA'];
const r6=n=>Math.round(n*1e6)/1e6;
const money=n=>Math.round(r6(n)*100+1e-7)/100;
// CRA 2026 indexed amounts (indexation 2.0%); line structure from the 2025 Schedule 2 (5000-S2), Schedule 11 and T1 return.
export const SCT_2026={rate:.14,firstTop:58523,ageMax:9208,ageFrom:46432,agePct:.15,pensionMax:2000,dtc:10341,tuitionMax:5000,cea:1501};
export const SCT_2025={rate:.145,firstTop:57375,ageMax:9028,ageFrom:45522,bpaMax:16129,dtc:10138};
const S=SCT_2026;
export const ageAmount=net=>Math.max(0,money(S.ageMax-S.agePct*Math.max(0,net-S.ageFrom)));
export const pensionAmount=p=>Math.min(S.pensionMax,Math.max(0,p));
// Schedule 2 line 7: taxable income, or above the first bracket the tax on it divided by the lowest rate.
export const line7=net=>net<=S.firstTop?net:money(federalTax(net)/S.rate);
// The spouse's own basic personal amount (line 30000) plus line 96 (CPP, EI and Canada employment amount here).
export function ownBase(net,earn){const t=taxRoom(net,earn);return money(bpa(net)+t.cpp+t.ei+Math.min(S.cea,earn));}
export function schedule2({age,net,pension,earn=0,dtc,tuition=0}){
 const amtAge=age?ageAmount(net):0,amtPen=pensionAmount(pension),amtDtc=dtc?S.dtc:0;
 const eq=line7(net),base=ownBase(net,earn);
 // Schedule 11: current-year tuition is used on the spouse's own return only after line 101 (the other credits) is exhausted.
 const tuitionUsed=Math.min(tuition,Math.max(0,money(eq-base-amtAge-amtPen-amtDtc)));
 const tuitionOut=Math.max(0,money(Math.min(S.tuitionMax,tuition)-tuitionUsed));
 const line6=money(amtAge+amtPen+amtDtc+tuitionOut),adjusted=Math.max(0,money(eq-base-tuitionUsed));
 const transfer=Math.max(0,money(line6-adjusted));
 return {age:amtAge,pension:amtPen,dtc:amtDtc,tuitionUsed,tuitionOut,tuitionCarry:Math.max(0,money(tuition-tuitionUsed-tuitionOut)),line6,eq,base,adjusted,transfer,own:money(line6-transfer)};
}
// Schedule 5 line 30300 for a claimant whose spouse is not infirm: claimant's basic personal amount less the spouse's net income.
export const spouseAmount=(netA,netB)=>Math.max(0,money(bpa(netA)-netB));
export function claimantRoom({ageA,netA,pensionA,earnA}){
 const t=taxRoom(netA,earnA),own=money(S.rate*((ageA?ageAmount(netA):0)+pensionAmount(pensionA)));
 return Math.max(0,money(t.room-own));
}
const spouseArgs=i=>({age:i.sctAgeB===1,net:i.sctNetB,pension:i.sctPensionB,earn:i.sctEarnB,dtc:i.sctDtcB===1,tuition:i.sctTuitionB});
const claimantArgs=i=>({ageA:i.sctAgeA===1,netA:i.sctNetA,pensionA:i.sctPensionA,earnA:i.sctEarnA});
export function household(i){
 const B=schedule2(spouseArgs(i)),sa=spouseAmount(i.sctNetA,i.sctNetB),claimed=money(B.transfer+sa),credit=money(S.rate*claimed),room=claimantRoom(claimantArgs(i)),used=Math.min(credit,room);
 return {...B,spouseAmt:sa,claimed,credit,transferCredit:money(S.rate*B.transfer),room,used:money(used),lost:money(credit-used)};
}
// Spouse income at which nothing is left to transfer, scaling pension and employment income down with it.
export function zeroPoint(i){const at=x=>schedule2({...spouseArgs(i),net:x,pension:Math.min(i.sctPensionB,x),earn:Math.min(i.sctEarnB,Math.max(0,x-Math.min(i.sctPensionB,x)))}).transfer;if(at(0)<=0)return 0;let lo=0,hi=400000;for(let k=0;k<60;k++){const m=(lo+hi)/2;at(m)>0?lo=m:hi=m;}return Math.round(hi);}
export const SCT_STATS={year:2024,asOf:'30 November 2025',url:DTC_STATS.url,
 // [range, returns with line 32600, line 32600 amount in CAD thousands]; all-return counts reuse the grouped DTC table.
 rows:[['Under 10k',112660,880105],['10k–20k',299680,2273273],['20k–30k',359090,2652778],['30k–40k',206490,1449692],['40k–50k',142840,943780],['50k–60k',95430,632243],['60k–80k',107920,731874],['80k–100k',61700,403229],['100k–150k',68570,431496],['150k–250k',30580,188648],['250k+',12640,78193]],
 total:[1497600,10665312],age:[7268130,55469117],pension:[6024730,11593669],spouse:[2382380,26107868]};
const cad=v=>'CAD '+v.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2});
export function spouseTransferResult(kind,i){
 if(kind!=='spouseTransfer')throw Error('Unknown spouse transfer illustration.');
 const H=household(i),zero=zeroPoint(i);
 const scaled=x=>{const p=Math.min(i.sctPensionB,x);return {...i,sctNetB:x,sctPensionB:p,sctEarnB:Math.min(i.sctEarnB,Math.max(0,x-p))};};
 const xs=Array.from({length:81},(_,k)=>k*1000),ax=Array.from({length:76},(_,k)=>k*2000);
 const cases=[['This household',i],['Spouse with no income',scaled(0)],['Spouse with CAD 30,000',scaled(30000)],['Spouse with CAD 45,000',scaled(45000)]];
 const profiles=[['Age amount only',{sctAgeB:1,sctPensionB:0,sctDtcB:0,sctTuitionB:0}],['Age and pension amounts',{sctAgeB:1,sctPensionB:2000,sctDtcB:0,sctTuitionB:0}],['Age, pension and disability',{sctAgeB:1,sctPensionB:2000,sctDtcB:1,sctTuitionB:0}],['Disability amount, under 65',{sctAgeB:0,sctPensionB:0,sctDtcB:1,sctTuitionB:0}],['Tuition CAD 8,000, under 65',{sctAgeB:0,sctPensionB:0,sctDtcB:0,sctTuitionB:8000}]];
 const cols=[0,10000,20000,30000,40000,50000,60000];
 const statRows=SCT_STATS.rows.map(([label,n],k)=>({label,value:Math.round(n/DTC_STATS.rows[k][1]*10000)/10}));
 return {metrics:[
  ['Amount transferred from the spouse, line 32600',H.transfer,'money',undefined,`Of ${cad(H.line6)} the spouse qualifies to transfer; they need ${cad(H.own)} themselves`],
  ['Claimant’s federal credit used from line 32600 and line 30300',H.used,'money',undefined,`${cad(H.claimed)} of amounts × 14%${H.lost?` · ${cad(H.lost)} wasted for lack of tax`:''}`],
  ['Spouse or common-law partner amount, line 30300',H.spouseAmt,'money',undefined,H.spouseAmt?'The claimant’s basic personal amount less the spouse’s net income':`Zero once the spouse’s net income reaches ${cad(bpa(i.sctNetA))}`],
  ['Spouse’s adjusted taxable income, Schedule 2 line 12',H.adjusted,'money',undefined,`Line 7 ${cad(H.eq)} less basic amount and line 96 ${cad(H.base)}${H.tuitionUsed?` and tuition used ${cad(H.tuitionUsed)}`:''}`],
  ['Spouse income at which nothing is left to transfer',zero,'money',undefined,H.tuitionCarry?`${cad(H.tuitionCarry)} of tuition stays with the spouse to carry forward`:'Pension and employment income scaled down with the spouse’s income']
 ],note:`Original illustration of the 2026 federal transfer of unused amounts from a spouse or common-law partner (Schedule 2, line 32600), using the 2025 schedule’s line structure with CRA’s 2026 indexed amounts. Transferable amounts are the spouse’s age amount (CAD 9,208, less 15% of net income above CAD 46,432), pension income amount (up to CAD 2,000 of eligible pension income), disability amount (CAD 10,341) and up to CAD 5,000 of current-year tuition less what they use. The spouse first uses them to bring their own federal tax to zero after the basic personal amount and the CPP, EI and Canada employment credits on employment income entered. The claimant’s credit is limited to federal tax left after their own basic, age, pension, CPP and EI credits. Net income is taken as taxable income for both people; provincial and territorial Schedule 2 amounts, the caregiver amount for infirm children (line 30500), the infirm-spouse addition to line 30300, medical expenses, donations, dividend credits and pension income splitting are left out.`,charts:[
  {id:'sct-transfer-by-income',type:'line',unit:'money',title:'Amounts the claimant gets as the spouse’s income rises',unitLabel:'CAD of amount claimed (before the 14% credit rate)',xLabel:'Lower-income spouse’s net income (CAD)',xUnit:'money',series:[{name:'Transferred from the spouse, line 32600',rows:xs.map(x=>({x,value:household(scaled(x)).transfer}))},{name:'Spouse amount, line 30300',dash:true,rows:xs.map(x=>({x,value:spouseAmount(i.sctNetA,x)}))},{name:'Amounts the spouse uses themselves',dash:true,rows:xs.map(x=>({x,value:household(scaled(x)).own}))}],note:`Eligible pension income is held at the lesser of ${cad(i.sctPensionB)} and the spouse’s income, and employment income at the lesser of ${cad(i.sctEarnB)} and what remains. The spouse amount ends when the spouse’s income reaches the claimant’s basic personal amount; the transfer runs further, because the spouse keeps only enough of the amounts to clear their own tax, and here reaches zero near ${cad(zero)}.`},
  {id:'sct-waterfall',type:'waterfall',unit:'money',title:'From the spouse’s unused amounts to the claimant’s credit',rows:[{label:'Age amount',value:H.age},{label:'Pension income amount',value:H.pension},{label:'Disability amount',value:H.dtc},{label:'Tuition designated (maximum CAD 5,000)',value:H.tuitionOut},{label:'Less the part the spouse needs (line 12)',value:H.own?-H.own:0},{label:'Plus spouse amount, line 30300',value:H.spouseAmt},{label:'Less the 86% that is not credited',value:-money(H.claimed-H.credit)},{label:'Less credit with no tax to absorb it',value:H.lost?-H.lost:0}],totalLabel:'Claimant’s federal credit',note:'Each CAD 1 transferred is worth 14 cents of federal tax to the claimant, if the claimant owes that much. The part the spouse needs is the smaller of their adjusted taxable income and the total they qualify to transfer.'},
  {id:'sct-who-uses',type:'stackbar',unit:'money',title:'Where the spouse’s eligible amounts end up',seriesNames:['Used on the spouse’s own return','Transferred and used by the claimant','Transferred but no tax to absorb it','Tuition kept to carry forward'],rows:cases.map(([label,x])=>{const h=household(x),share=h.claimed?h.lost*h.transfer/h.claimed/S.rate:0;return {label,values:[h.own,money(h.transfer-share),money(share),h.tuitionCarry]};}),note:'Each bar is the spouse’s age, pension, disability and tuition amounts in CAD before the credit rate. A lost transfer is shown in proportion to the claimant’s unused credit across lines 30300 and 32600. Amounts other than tuition that neither spouse uses disappear: they cannot be carried forward.'},
  {id:'sct-claimant-income',type:'line',unit:'money',title:'Claimant’s usable credit by the claimant’s own income',unitLabel:'CAD of federal credit used',xLabel:'Claimant’s net income, all eligible pension income (CAD)',xUnit:'money',series:[{name:'Credit used',rows:ax.map(x=>({x,value:household({...i,sctNetA:x,sctPensionA:x,sctEarnA:0}).used}))},{name:'Credit available',dash:true,rows:ax.map(x=>({x,value:household({...i,sctNetA:x,sctPensionA:x,sctEarnA:0}).credit}))}],note:`The claimant must still have federal tax after their own basic, age and pension credits to use the transfer. A low-income claimant gains little; the available credit also falls a little above CAD 181,440, where the claimant’s basic personal amount, and with it any spouse amount, begins to shrink.`},
  {id:'sct-profile-grid',type:'heatmap',unit:'money',title:'Amount transferred on line 32600 by what the spouse qualifies for and their income',rowLabel:'Spouse qualifies for',columns:cols.map(c=>c?`Income ${Math.round(c/1000)}k`:'No income'),rows:profiles.map(([label,p])=>({label,values:cols.map(c=>schedule2({age:p.sctAgeB===1,net:c,pension:Math.min(p.sctPensionB,c),earn:0,dtc:p.sctDtcB===1,tuition:p.sctTuitionB}).transfer)})),note:'All income is treated as pension or other non-employment income, so only the basic personal amount offsets it. The age amount falls by 15% of income above CAD 46,432. The tuition row assumes CAD 8,000 of 2026 fees: at most CAD 5,000 can move and the rest stays with the student spouse.'},
  {id:'sct-cra-claims',type:'bar',evidence:'Official tax statistics',title:'Returns claiming amounts transferred from a spouse, 2024',unit:'decimal',unitLabel:'Returns with line 32600 per 1,000 returns in the income range · 2024 tax year',rows:statRows,source:SCT_STATS.url,sourceLabel:'CRA · Individual Income Tax Return Statistics, 2024 tax year, Table 2',note:'Data as of 30 November 2025; counts rounded to the nearest ten. Ranges are the claimant’s total income assessed, grouped from CRA’s 19 ranges. 1,497,600 returns claimed CAD 10.67 billion on line 32600, an average of about CAD 7,122. Claims are most common among claimants with CAD 10,000 to 30,000 of income, which is consistent with older couples moving age and pension amounts, but the table does not record the claimants’ ages or which amounts moved.'}
 ]};
}
