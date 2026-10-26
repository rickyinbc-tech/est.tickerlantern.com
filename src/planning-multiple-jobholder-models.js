import { multipleJobholderAnnualSource, multipleJobholderMonthlySource } from './planning-multiple-jobholder-data.js';

export const multipleJobholderDefinitions={
  multipleJobholders:{title:'Count people, jobs and denominators separately',fields:[
    ['mjbJobsA','Fictional person A: simultaneously assigned jobs',2,0,3,1],
    ['mjbJobsB','Fictional person B: simultaneously assigned jobs',1,0,3,1],
    ['mjbJobsC','Fictional person C: simultaneously assigned jobs',3,0,3,1],
    ['mjbJobsD','Fictional person D: simultaneously assigned jobs',0,0,3,1]
  ]}
};
const letters=['A','B','C','D'];
function tally(jobs){
  const people=jobs.length;
  const jobholding=jobs.filter(j=>j>0).length;
  const multiple=jobs.filter(j=>j>=2).length;
  const one=jobs.filter(j=>j===1).length;
  const none=jobs.filter(j=>j===0).length;
  const positions=jobs.reduce((total,j)=>total+j,0);
  return {people,jobholding,multiple,one,none,positions,shareJobholders:jobholding?multiple/jobholding:null,shareAll:multiple/people};
}
export function multipleJobholderTally(input){
  const jobs=[input.mjbJobsA,input.mjbJobsB,input.mjbJobsC,input.mjbJobsD];
  const selected=tally(jobs);
  const plusA=tally(jobs.map((j,i)=>i===0?Math.min(3,j+1):j));
  const plusD=tally(jobs.map((j,i)=>i===3?Math.min(3,j+1):j));
  return {...selected,jobs,scenarios:[selected,plusA,plusD]};
}
const shareText=(numerator,denominator)=>denominator?`${numerator} of ${denominator} = ${(numerator/denominator*100).toFixed(1)}%`:'Undefined — the denominator is zero';
export function multipleJobholderResult(kind,input){
  if(kind!=='multipleJobholders')throw Error('Unknown multiple-jobholder topic.');
  const p=multipleJobholderTally(input),annual=multipleJobholderAnnualSource,monthly=multipleJobholderMonthlySource;
  const shareColumns=['Selected','A + one job','D + one job'];
  return {
    metrics:[
      ['Fictional people in the tally',p.people,'integer'],
      ['People with at least one assigned job',p.jobholding,'integer'],
      ['People with two or more assigned jobs',p.multiple,'integer'],
      ['Assigned job positions in total',p.positions,'integer'],
      [`Multiple-jobholding share of the ${p.jobholding} jobholding ${p.jobholding===1?'person':'people'}`,p.shareJobholders,'percent',shareText(p.multiple,p.jobholding)],
      [`Multiple-jobholding share of all ${p.people} people`,p.shareAll,'percent',shareText(p.multiple,p.people)]
    ],
    note:'An original four-person teaching tally plus two fixed official series. The assignments are invented and are not Labour Force Survey responses, an employment-status classifier, a household roster or evidence about any real person. An assigned zero does not establish unemployment, and a person with two jobs is still one person. The official values count people in thousands while the tally counts invented assignments; neither supplies a number of jobs per person, hours, wages, household income or a job total. No chart combines the official levels with the invented assignments.',
    charts:[
      {id:'mjb-annual-persons',type:'line',title:'Annual average multiple-jobholding persons, 2016 to 2025',unit:'count',unitLabel:'Persons · annual average, published in thousands to one decimal',xLabel:'Reference year',xMin:2015.5,xMax:2025.5,yMin:0,yMax:1300000,
        series:[{name:'Multiple-jobholding persons, annual average',rows:annual.rows.map(r=>({x:r.year,label:String(r.year),value:r.persons*1000}))}],
        xTicks:[2016,2018,2020,2022,2024,2025].map(year=>({value:year,label:String(year)})),
        source:annual.url,sourceLabel:'Statistics Canada · Table 14-10-0044-01, released 9 January 2026',evidence:'Statistics Canada · official annual table',
        note:'An annual average of people employed in two or more jobs simultaneously during the reference week. The published 2025 value is 1,178.6 thousand, or about 1,178,600 persons. The series is not a count of unique people who held a second job at any time in the year, and summing monthly counts would not recreate it. The 2020 dip is retained as published; no cause is assigned here.'},
      {id:'mjb-monthly-persons',type:'line',title:'Twelve unadjusted monthly estimates ending September 2026',unit:'count',unitLabel:'Persons · unadjusted monthly estimate, published in thousands to one decimal',xLabel:'Reference month',xMin:0.5,xMax:12.5,yMin:0,yMax:1400000,
        series:[{name:'Multiple-jobholding persons, unadjusted',rows:monthly.rows.map((r,i)=>({x:i+1,label:r.period,value:r.persons*1000}))}],
        xTicks:[1,3,6,9,12].map((month,i)=>({value:month,label:['Oct 25','Dec 25','Mar 26','Jun 26','Sep 26'][i]})),
        source:monthly.url,sourceLabel:'Statistics Canada · Table 14-10-0045-01, released 9 October 2026',evidence:'Statistics Canada · official monthly table',
        note:'These are unadjusted estimates for the reference week, generally the week containing the fifteenth of the month. Month-to-month movement mixes seasonal patterns, sampling variation and revision. It is not a seasonally adjusted trend, a count of new second jobs or a transition count for the same people, and it cannot establish why any individual’s status changed.'},
      {id:'mjb-assigned-jobs',type:'bar',title:'Four fictional people hold six assigned job positions between them',unit:'integer',unitLabel:'Assigned simultaneous jobs per person',rows:p.jobs.map((jobs,index)=>({label:'Person '+letters[index],value:jobs})),
        note:'Each bar is an authored assignment of zero to three simultaneous jobs, not a survey answer. Person C’s three jobs are one person holding three positions. A zero bar means no job in this tally alone; it does not establish unemployment, job search, hours, pay or Labour Force Survey eligibility. The four values sum to the position total, which is not the number of people.'},
      {id:'mjb-person-groups',type:'donut',title:'The four people fall into three mutually exclusive groups',unit:'integer',centerLabel:'4 fictional people',rows:[
        {label:'No assigned job',value:p.none},
        {label:'Exactly one assigned job',value:p.one},
        {label:'Two or more assigned jobs',value:p.multiple}
      ],
        note:'The groups partition the same four people, so the three counts sum to four. A person appears once regardless of how many jobs that person holds. If every assignment is changed to zero, the “two or more” slice disappears and the no-job slice becomes all four people; that is still not a statement about real employment.'},
      {id:'mjb-scenario-counts',type:'groupbar',title:'Adding one job to person A can add a position without adding a person',unit:'integer',unitLabel:'Counts under the same tally rules',rowLabel:'Assignment scenario',seriesNames:['People with at least one job','People with two or more jobs','Assigned job positions'],rows:[
        {label:'Selected assignments',values:[p.jobholding,p.multiple,p.positions]},
        {label:'Person A with one more job',values:[p.scenarios[1].jobholding,p.scenarios[1].multiple,p.scenarios[1].positions]}
      ],
        note:'The second row adds one assigned job to person A, capped at the three-job input limit. At the default assignments, positions rise from six to seven while the number of jobholding people stays at three and the number with multiple jobs stays at two. If person A had no job, the same change could also raise the jobholding count. People and positions answer different questions, and a rising position total is not a larger workforce.'},
      {id:'mjb-share-denominators',type:'heatmap',title:'The same numerator produces different shares under different denominators',unit:'percent',unitLabel:'Multiple-jobholding people as a share of the denominator named in each row',rowLabel:'Denominator',columns:shareColumns,unavailableLabel:'Undefined',rows:[
        {label:'Jobholding',values:[p.scenarios[0].shareJobholders,p.scenarios[1].shareJobholders,p.scenarios[2].shareJobholders]},
        {label:'All four',values:[p.scenarios[0].shareAll,p.scenarios[1].shareAll,p.scenarios[2].shareAll]}
      ],
        note:'The three columns are the selected assignments, one more job assigned to person A, and one more job assigned to person D, each capped at the three-job input limit. The top row divides by the number of jobholding people, so its denominator changes between cells; the bottom row always divides by all four people. At the default assignments the same two multiple-jobholding people are 2 of 3 jobholding people (66.7%) but 2 of 4 people overall (50%). If nobody has an assigned job, the top row is undefined rather than zero percent. These invented fractions do not estimate any official rate, and official counts would need a compatible total-employment denominator before a share could be calculated.'}
    ]
  };
}
