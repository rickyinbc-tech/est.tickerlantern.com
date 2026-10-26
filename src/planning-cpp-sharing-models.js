import {personTax} from './planning-pension-split-models.js';
const issue=i=>i.csTogether>i.csJcp?{message:'Months living together cannot exceed the joint contributory period.',fields:['csTogether','csJcp']}
 :i.csBaseA+i.csEnhA+i.csBaseB+i.csEnhB<=0?{message:'At least one spouse needs a CPP retirement pension to share.',fields:['csBaseA','csBaseB']}
 :i.csOasA+i.csPenA>i.csOtherA?{message:'OAS and eligible pension included for you cannot exceed your other income.',fields:['csOasA','csPenA']}
 :i.csOasB+i.csPenB>i.csOtherB?{message:'OAS and eligible pension included for your spouse cannot exceed their other income.',fields:['csOasB','csPenB']}:null;
export const cppSharingDefinitions={cppSharingMonths:{title:'Test CPP pension sharing by months lived together in the joint contributory period',inputIssue:issue,fields:[
 ['csBaseA','Your CPP retirement pension · base part (CAD per month)',1100,0,1600,5],
 ['csEnhA','Your CPP enhancement part, 2019 onward (CAD per month)',150,0,800,5],
 ['csBaseB','Spouse’s CPP retirement pension · base part (CAD per month)',400,0,1600,5],
 ['csEnhB','Spouse’s CPP enhancement part (CAD per month)',40,0,800,5],
 ['csJcp','Joint contributory period (months)',576,12,624,1],
 ['csTogether','Months living together during that period',420,0,624,1],
 ['csEnhTogether','Share of the enhancement periods spent together (%)',100,0,100,1],
 ['csOtherA','Your other 2026 income incl. OAS and pensions (CAD)',45000,0,300000,500],
 ['csOasA','OAS included in your other income (CAD)',9150,0,12000,50],
 ['csPenA','Eligible pension income included for you (CAD)',30000,0,300000,500],
 ['csOtherB','Spouse’s other 2026 income incl. OAS and pensions (CAD)',12000,0,300000,500],
 ['csOasB','OAS included in spouse’s other income (CAD)',9150,0,12000,50],
 ['csPenB','Eligible pension income included for spouse (CAD)',0,0,300000,500]
]}};
export const cppSharingWholeKeys=['csJcp','csTogether','csEnhTogether'];
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
// CPP Act s. 65.1(9): each pension component is assigned at 50% x (cohabitation months / joint contributory period months);
// enhancement components use the additional joint contributory periods that start 1 January 2019 and 1 January 2024.
export function cppShare(p){
 const r=p.jcp>0?Math.min(1,p.together/p.jcp):0,re=p.enhShare;
 const shareA=r*p.baseA+re*p.enhA,shareB=r*p.baseB+re*p.enhB;
 const ownA=p.baseA+p.enhA,ownB=p.baseB+p.enhB,net=(shareA-shareB)/2;
 return {r,shareA,shareB,ownA,ownB,net,afterA:ownA-net,afterB:ownB+net,combined:ownA+ownB};
}
const fed=(cppA,cppB,i)=>{
 const a=personTax(i.csOtherA+12*cppA,i.csPenA,i.csOasA),b=personTax(i.csOtherB+12*cppB,i.csPenB,i.csOasB);
 return {a,b,total:a.total+b.total};
};
const params=i=>({baseA:i.csBaseA,enhA:i.csEnhA,baseB:i.csBaseB,enhB:i.csEnhB,jcp:i.csJcp,together:i.csTogether,enhShare:i.csEnhTogether/100});
export function cppSharingResult(kind,i){
 if(kind!=='cppSharingMonths')throw Error('Unknown CPP pension sharing illustration.');
 const p=params(i),s=cppShare(p),none=fed(s.ownA,s.ownB,i),shared=fed(s.afterA,s.afterB,i),saving=none.total-shared.total;
 const steps=48,months=Array.from({length:steps+1},(_,k)=>Math.round(k*i.csJcp/steps));
 const curve=months.map(m=>{const c=cppShare({...p,together:m});return {m,c,save:none.total-fed(c.afterA,c.afterB,i).total};});
 const afterTax=(h,cpp,other)=>money(other+12*cpp-h.total);
 const signed=v=>`${v<0?'−':''}CAD ${Math.abs(v).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
 return {metrics:[
  ['Share of base pensions open to sharing (months together ÷ period)',money(s.r*100),'percent'],
  ['Net monthly amount moving from you to your spouse (negative = toward you)',money(s.net),'money'],
  ['Your monthly CPP after sharing',money(s.afterA),'money',`Before ${signed(money(s.ownA))}`],
  ['Spouse’s monthly CPP after sharing',money(s.afterB),'money',`Before ${signed(money(s.ownB))}`],
  ['Illustrative 2026 federal tax change for the couple (positive = saving)',money(saving),'money',`Combined CPP unchanged at ${signed(money(s.combined))} a month`]
 ],note:'Original illustration of the Canada Pension Plan Act section 65.1(9) assignment formula with 12 months of sharing in 2026. Each spouse’s base pension is shareable in the ratio of months living together to months in the joint contributory period; the enhancement part uses the share you enter for the additional joint contributory periods that begin in 2019 and 2024. Half of each shareable amount goes to the other spouse, so the couple’s combined CPP is unchanged. The post-retirement benefit is excluded, as Service Canada states. Federal tax uses the 2026 brackets, basic personal amount, age amount, CAD 2,000 pension income amount and CAD 95,323 OAS recovery threshold from the site’s pension-splitting model; CPP is not eligible pension income. Both spouses are assumed 65 or older, resident in Canada, living together and not making a T1032 election. No provincial tax, survivor benefit or QPP rules. Not a Service Canada calculation.',charts:[
  {id:'cpp-share-before-after',type:'groupbar',unit:'money',title:'Monthly CPP retirement pension before and after sharing',seriesNames:['Own pension','After sharing'],rowLabel:'Person',rows:[{label:'You',values:[money(s.ownA),money(s.afterA)]},{label:'Spouse',values:[money(s.ownB),money(s.afterB)]},{label:'Combined',values:[money(s.combined),money(s.afterA+s.afterB)]}],note:'Sharing moves real monthly payments between the two pension accounts; the combined total does not change. Each person then receives and reports their own adjusted amount.'},
  {id:'cpp-share-net-transfer',type:'waterfall',unit:'money',title:'How the net monthly transfer is built from both pensions',rows:[{label:'Half of your shareable base',value:money(s.r*p.baseA/2)},{label:'Half of your shareable enhancement',value:money(p.enhShare*p.enhA/2)},{label:'Less half of spouse’s shareable base',value:money(-s.r*p.baseB/2)},{label:'Less half of spouse’s shareable enhancement',value:money(-p.enhShare*p.enhB/2)}],totalLabel:'Net moving from you to your spouse',note:`The base ratio is ${i.csTogether} ÷ ${i.csJcp} months = ${(s.r*100).toFixed(2)}%. Each spouse gives half of their shareable amount and receives half of the other’s, so only the difference changes hands.`},
  {id:'cpp-share-months-transfer',type:'line',unit:'money',title:'Net monthly transfer as months together change',unitLabel:'CAD per month, from you to your spouse',xLabel:'Months living together during the joint contributory period',series:[{name:'Net transfer',rows:curve.map(c=>({x:c.m,value:money(c.c.net)}))}],note:'Holds both pensions fixed. The base part scales in a straight line with months together; the enhancement part stays at the share you entered because it uses its own later-starting periods.'},
  {id:'cpp-share-months-tax',type:'line',unit:'money',title:'Illustrative 2026 federal tax change as months together change',unitLabel:'CAD per year · positive = household saving',xLabel:'Months living together during the joint contributory period',series:[{name:'Federal tax + OAS recovery saving',rows:curve.map(c=>({x:c.m,value:money(c.save)}))}],note:'Original federal-only calculation. The curve can flatten where the receiving spouse’s unused non-refundable credits are used up, and can fall below zero when sharing moves income toward the spouse with the higher marginal rate.'},
  {id:'cpp-share-after-tax',type:'groupbar',unit:'money',title:'Annual income after federal tax, with and without sharing',seriesNames:['Without sharing','With sharing'],rowLabel:'Person',rows:[{label:'You',values:[afterTax(none.a,s.ownA,i.csOtherA),afterTax(shared.a,s.afterA,i.csOtherA)]},{label:'Spouse',values:[afterTax(none.b,s.ownB,i.csOtherB),afterTax(shared.b,s.afterB,i.csOtherB)]}],note:'Other income plus 12 months of CPP, less modelled 2026 federal tax and OAS recovery. Provincial tax, payroll and other benefits are excluded.'}
 ]};
}
