const issue=i=>i.prDesignatedYears>i.prOwnedYears?{message:'Qualifying designated years cannot exceed ownership years.',fields:['prDesignatedYears']}:null;
export const principalResidenceDefinitions={principalResidenceYears:{title:'Illustrate the designation-year fraction for one property',inputIssue:issue,fields:[
 ['prGain','Hypothetical gain before principal-residence exemption (CAD)',300000,0,5000000,10000],
 ['prOwnedYears','Tax years owned after the acquisition date',20,5,60,1],
 ['prDesignatedYears','Qualifying designated tax years counted before the addition',15,0,60,1],
 ['prAcquisitionResident','Resident in Canada in the acquisition year? (1 = yes; 0 = no)',1,0,1,1]
]}};
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
export function principalResidenceResult(kind,i){
 if(kind!=='principalResidenceYears')throw Error('Unknown principal-residence illustration.');
 const bonus=i.prAcquisitionResident, b=i.prDesignatedYears+bonus, fraction=Math.min(1,b/i.prOwnedYears), exempt=money(i.prGain*fraction), remaining=money(i.prGain-exempt);
 const curve=Array.from({length:i.prOwnedYears+1},(_,years)=>({x:years,value:Math.min(1,(years+bonus)/i.prOwnedYears)}));
 const portions=[0,.25,.5,.75,1],designated=portions.map(q=>Math.round(i.prOwnedYears*q));
 const ownership=[i.prOwnedYears-15,i.prOwnedYears-10,i.prOwnedYears-5,i.prOwnedYears,i.prOwnedYears+5].map(n=>Math.max(5,Math.min(60,n)));
 const owns=[...new Set(ownership)].sort((a,b)=>a-b);
 const cols=['0% of years','25% of years','50% of years','75% of years','100% of years'];
 return {metrics:[
  ['Formula years in numerator · B',b,'integer'],
  ['Illustrative gain shielded by formula',exempt,'money'],
  ['Gain remaining before any inclusion rate or income tax',remaining,'money'],
  ['Share of hypothetical gain shielded',fraction,'percent'],
  ['Additional years needed for full formula coverage',Math.max(0,i.prOwnedYears-b),'integer']
 ],note:'Simplified original illustration of the CRA principal-residence exemption fraction: A × (B ÷ C). The scenario uses a hypothetical gain, assumes the selected designated years meet all legal conditions, and includes the one-year amount in B only when the resident-at-acquisition control is yes. The formula fraction is capped at 100% of the hypothetical gain so it never creates a deductible loss. It does not determine tax owing.',charts:[
  {id:'pr-exemption-curve',type:'line',unit:'percent',title:'How designated years change the formula fraction',unitLabel:'Illustrative share of gain covered by the formula · percent',xLabel:'Qualifying designated tax years counted before the addition',series:[{name:'Share shielded by formula',rows:curve}],xUnit:'integer',note:'The curve applies the CRA formula to the selected years owned and acquisition-year residence assumption. It is a mathematical sensitivity, not an automatic exemption: a designation must meet the legal conditions, and the family-unit rule can constrain which property uses each year.'},
  {id:'pr-gain-split',type:'stackbar',unit:'money',title:'Separate formula-shielded gain from the remaining gain',unitLabel:'Hypothetical gross gain before income-tax treatment · CAD',seriesNames:['Formula-shielded amount','Gain remaining'],rows:[{label:'Selected scenario',values:[exempt,remaining]}],note:'The two segments add back to the selected hypothetical gain. The remaining gain is not the tax payable or the taxable capital gain; income-tax inclusion and personal tax are outside this illustration.'},
  {id:'pr-designation-sensitivity',type:'bar',unit:'percent',title:'More eligible designated years raise the covered share',unitLabel:'Illustrative share of gain covered · percent',rows:designated.map(n=>({label:`${n} of ${i.prOwnedYears} years`,value:Math.min(1,(n+bonus)/i.prOwnedYears)})),note:`Ownership period and the acquisition-year residence assumption are held at the selected settings. The one-year addition can bring the formula fraction to 100% before all ownership years appear as designations. This does not allow two homes to be designated for the same family-unit year.`},
  {id:'pr-ownership-grid',type:'heatmap',unit:'percent',title:'The same designation share means something different over time',unitLabel:'Formula-covered share of hypothetical gain · percent',columns:cols,rows:owns.map(years=>({label:`${years} ownership years`,values:portions.map(q=>Math.min(1,(Math.round(years*q)+bonus)/years))})),note:'Each cell changes both the ownership period and its own designated-year count, so columns show a share of each row’s ownership years. The resident-at-acquisition setting remains as selected. Values are formula sensitivities, not official statistics or a personal tax calculation.'}
 ]};
}
