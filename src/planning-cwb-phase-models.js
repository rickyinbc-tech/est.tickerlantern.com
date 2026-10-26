const issue=i=>!i.cwbFamily&&i.cwbWorkB>0?{message:'A single person with no spouse or child has no second earner; set the spouse’s working income to 0 or choose the family setting.',fields:['cwbWorkB','cwbFamily']}
 :!i.cwbFamily&&i.cwbDtc>1?{message:'Two disability supplements need a spouse or common-law partner; choose the family setting or enter 0 or 1.',fields:['cwbDtc','cwbFamily']}
 :i.cwbDeduct>i.cwbWorkA+i.cwbWorkB+i.cwbOther?{message:'Deductions cannot exceed the household income entered.',fields:['cwbDeduct']}:null;
export const cwbPhaseDefinitions={cwbPhaseWorkers:{title:'Test the 2026 Canada workers benefit phase-in, phase-out and advance payments',inputIssue:issue,fields:[
 ['cwbFamily','Household type (0 = single, no child · 1 = spouse or child)',0,0,1,1],
 ['cwbWorkA','Your 2026 working income (CAD)',30000,0,120000,250],
 ['cwbWorkB','Spouse’s 2026 working income (CAD; 0 if none)',0,0,120000,250],
 ['cwbOther','Other household net income, e.g. EI or interest (CAD)',0,0,100000,250],
 ['cwbDeduct','RRSP, FHSA or other net-income deductions (CAD)',0,0,50000,250],
 ['cwbDtc','People eligible for the disability tax credit (0–2)',0,0,2,1],
 ['cwbRaise','Pay rise to test for you (CAD)',2000,0,30000,250],
 ['cwbOtherRate','Other marginal rate you apply to the raise (%)',14,0,60,.5],
 ['cwbAdvance','ACWB advances received for the year (CAD)',816.5,0,2300,.5]
]}};
export const cwbPhaseWholeKeys=['cwbFamily','cwbDtc'];
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
// 2026 amounts: CRA indexation table (2.0%); 27%/15%/7.5% rates and the secondary earner exemption: Income Tax Act s. 122.7.
export const CWB_2026={workFloor:3000,maxSingle:1665,maxFamily:2869,outSingle:27392,outFamily:31251,secondary:16714,disFloor:1150,disMax:860,disOutSingle:38495,disOutFamily:50377,phaseIn:.27,phaseOut:.15};
const P=CWB_2026;
export function cwb(h,{exemption=true}={}){
 const family=!!h.family,workA=h.workA,workB=family?h.workB:0,work=workA+workB;
 const exempt=family&&exemption?Math.min(Math.min(workA,workB),P.secondary):0;
 const afni=Math.max(0,work+h.other-h.deduct-exempt);
 const max=family?P.maxFamily:P.maxSingle,out=family?P.outFamily:P.outSingle;
 const phaseIn=Math.min(max,P.phaseIn*Math.max(0,work-P.workFloor));
 const basic=Math.max(0,phaseIn-P.phaseOut*Math.max(0,afni-out));
 const both=family&&h.dtc>1,disOut=family?P.disOutFamily:P.disOutSingle,disRate=both?P.phaseOut/2:P.phaseOut;
 const supplement=w=>Math.max(0,Math.min(P.disMax,P.phaseIn*Math.max(0,w-P.disFloor))-disRate*Math.max(0,afni-disOut));
 const disability=(h.dtc>0?supplement(workA):0)+(both?supplement(workB):0);
 return {afni,exempt,phaseIn,basic,disability,total:basic+disability};
}
const base=i=>({family:i.cwbFamily,workA:i.cwbWorkA,workB:i.cwbWorkB,other:i.cwbOther,deduct:i.cwbDeduct,dtc:i.cwbDtc});
export function cwbPhaseResult(kind,i){
 if(kind!=='cwbPhaseWorkers')throw Error('Unknown Canada workers benefit illustration.');
 const h=base(i),now=cwb(h),raised=cwb({...h,workA:h.workA+i.cwbRaise});
 const lost=now.total-raised.total,otherCut=i.cwbRaise*i.cwbOtherRate/100,kept=i.cwbRaise-lost-otherCut,settle=now.total-i.cwbAdvance;
 const top=Math.max(60000,Math.ceil((h.workA+i.cwbRaise)/5000)*5000),step=top/120;
 const curve=Array.from({length:121},(_,k)=>{const x=k*step;return {x,r:cwb({...h,workA:x})};});
 const series=[{name:'Basic amount',rows:curve.map(c=>({x:c.x,value:money(c.r.basic)}))}];
 if(h.dtc>0)series.push({name:'Disability supplement',rows:curve.map(c=>({x:c.x,value:money(c.r.disability)}))});
 series.push({name:'Total CWB',rows:curve.map(c=>({x:c.x,value:money(c.r.total)})),dash:true});
 const dx=250,mtop=Math.max(60000,top),mrows=Array.from({length:Math.round(mtop/1000)+1},(_,k)=>{const x=k*1000,d=(cwb({...h,workA:x+dx}).total-cwb({...h,workA:x}).total)/dx;return {x,cwb:money(-d*1e4)/1e4,all:money((i.cwbOtherRate/100-d)*1e4)/1e4};});
 const fam={...h,family:1,dtc:Math.min(h.dtc,1)},srows=Array.from({length:81},(_,k)=>k*500);
 const kept$=v=>v.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
 return {metrics:[
  ['Adjusted (family) net income used for the 2026 CWB',money(now.afni),'money'],
  ['2026 CWB entitlement · basic + disability',money(now.total),'money',`Basic CAD ${kept$(money(now.basic))} · disability CAD ${kept$(money(now.disability))}`],
  ['CWB lost on the tested pay rise (negative = gained)',money(lost),'money',i.cwbRaise?`${(lost/i.cwbRaise*100).toFixed(1)}% of the raise`:'No raise entered'],
  ['Kept from the raise after CWB loss and your other rate',money(kept),'money'],
  ['Settled at filing after ACWB advances (negative = repay)',money(settle),'money']
 ],note:'Original illustration for the 2026 tax year outside Alberta, Quebec and Nunavut, using CRA’s indexed 2026 CWB amounts (basic maximum CAD 1,665 single / CAD 2,869 family; phase-out from CAD 27,392 / CAD 31,251; secondary earner exemption CAD 16,714; disability supplement CAD 860 phasing out from CAD 38,495 / CAD 50,377) and the Income Tax Act section 122.7 rates (27% phase-in above CAD 3,000 of working income, or CAD 1,150 for the supplement; 15% phase-out, 7.5% per supplement when both spouses qualify). Working income is treated as employment or business income that also counts in net income; “other income” and deductions change only net income. All eligibility conditions (age, full-year residence, students, incarceration) are assumed met. Income tax, payroll deductions and provincial benefits are not modelled except through the single rate you enter. The model is not a filing calculation.',charts:[
  {id:'cwb-income-curve',type:'line',unit:'money',title:'2026 CWB as your working income changes',unitLabel:'CAD per year',xLabel:'Your 2026 working income (CAD)',xUnit:'money',series,note:`Original calculation holding every other input fixed. The benefit rises by 27 cents per dollar of working income above CAD 3,000, stays at the maximum, then falls by 15 cents per dollar of adjusted ${h.family?'family ':''}net income above the threshold.${h.family?' With a spouse, the curve depends on both earnings and the secondary earner exemption.':''}`},
  {id:'cwb-raise-bridge',type:'waterfall',unit:'money',title:'What the tested pay rise leaves after the CWB phase-out',rows:[{label:'Pay rise',value:money(i.cwbRaise)},{label:'CWB reduction',value:money(-lost)},{label:`Other rate you entered (${i.cwbOtherRate}%)`,value:money(-otherCut)}],totalLabel:'Kept from the raise',note:'The CWB step is calculated by the model. The other-rate step is your own assumption; the default 14% is only the 2026 lowest federal bracket rate and leaves out provincial tax, CPP and EI contributions and other income-tested benefits.'},
  {id:'cwb-marginal-rate',type:'line',unit:'percent',title:'Share of the next dollar earned that the CWB adds or takes away',unitLabel:'Change per extra dollar of your working income',xLabel:'Your 2026 working income (CAD)',xUnit:'money',series:[{name:'CWB effect only',rows:mrows.map(r=>({x:r.x,value:r.cwb})),step:true},{name:'CWB effect + your other rate',rows:mrows.map(r=>({x:r.x,value:r.all})),step:true,dash:true}],note:'Negative values mean the CWB adds money as you earn more (the 27% phase-in). Positive values mean the CWB is being withdrawn (15%, or 7.5% per supplement when both spouses qualify). Measured over CAD 250 steps; the steps where the benefit kinks show partial rates.'},
  {id:'cwb-second-earner',type:'line',unit:'money',title:'Family CWB as a spouse’s earnings rise, with and without the secondary earner exemption',unitLabel:'CAD per year',xLabel:'Spouse’s 2026 working income (CAD)',xUnit:'money',series:[{name:'With CAD 16,714 exemption',rows:srows.map(x=>({x,value:money(cwb({...fam,workB:x}).total)}))},{name:'Without exemption (counterfactual)',rows:srows.map(x=>({x,value:money(cwb({...fam,workB:x},{exemption:false}).total)})),dash:true}],note:`Holds your working income at CAD ${h.workA.toLocaleString('en-CA')} and other inputs fixed, using the family rules${h.family?'':' (a hypothetical for a single filer)'}. The exemption removes the lower earner’s working income, up to CAD 16,714, from adjusted family net income, so a second job delays the phase-out instead of triggering it immediately.`},
  {id:'cwb-advance-settlement',type:'waterfall',unit:'money',title:'How the year’s advances reconcile with the 2026 entitlement',rows:[{label:'2026 CWB entitlement (line 45300)',value:money(now.total)},{label:'ACWB advances received (RC210, line 41500)',value:money(-i.cwbAdvance)}],totalLabel:settle>=0?'Still to receive through the return':'Advances to repay through the return',note:'The full credit is claimed on Schedule 6 and line 45300; advances shown on the RC210 slip are entered through Schedule 6 and line 41500, so only the difference changes the refund or balance owing. If income rose after the estimate the advance was based on, the difference can be negative.'},
  {id:'cwb-2026-thresholds',type:'groupbar',unit:'money',title:'Official CWB income thresholds, 2025 and 2026',seriesNames:['2025','2026'],rowLabel:'Threshold',rows:[{label:'Secondary earner exemption',values:[16386,16714]},{label:'Basic phase-out starts · single',values:[26855,27392]},{label:'Basic phase-out starts · family',values:[30639,31251]},{label:'Disability phase-out · single',values:[37740,38495]},{label:'Disability phase-out · family',values:[49389,50377]}],source:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html',sourceLabel:'CRA · indexation adjustment for personal income tax and benefit amounts',note:'Official CRA amounts after 2.7% indexation for 2025 and 2.0% for 2026. Alberta, Quebec and Nunavut use reconfigured amounts that are not shown.'}
 ]};
}
