// Small attributed national extract; reproduce with the source-checking script.
export const income2024={
  publisher:'Statistics Canada',table:'11-10-0190-01',year:2024,
  released:'2026-04-29',reviewed:'2026-10-25',unit:'2024 constant dollars',
  url:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110019001',
  releaseUrl:'https://www150.statcan.gc.ca/n1/daily-quotidien/260429/dq260429a-eng.htm',
  concept:'Median after-tax income',geography:'Canada',
  units:[
    {key:'families',label:'Economic families',source:'Economic families',value:108900,vector:'v96412012',quality:'A'},
    {key:'combined',label:'All survey units combined',source:'Economic families and persons not in an economic family',value:75500,vector:'v96412011',quality:'A'},
    {key:'unattached',label:'Unattached individuals',source:'Persons not in an economic family',value:41000,vector:'v96412024',quality:'A'}
  ],
  ageGroups:[
    {key:'nonSeniorFamilies',label:'Non-senior families',source:'Non-senior families',value:118400,vector:'v96412016',quality:'A'},
    {key:'seniorFamilies',label:'Senior families',source:'Senior families',value:83200,vector:'v96412013',quality:'A'},
    {key:'nonSeniorUnattached',label:'Unattached non-seniors',source:'Non-seniors not in an economic family',value:42700,vector:'v96412028',quality:'A'},
    {key:'seniorUnattached',label:'Unattached seniors',source:'Seniors not in an economic family',value:38600,vector:'v96412025',quality:'A'}
  ]
};
