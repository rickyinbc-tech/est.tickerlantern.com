import { project, annualCSV, ANNUAL_CSV_HEADER, validate, MODEL_CONVENTION_VERSION } from './model.js';
import { scenarioInputs } from './scenario-state.js';
import { eligibleExitMean } from './valuation-policy.js';
import { metricProvenance } from './update-status.js';
import { payoutProvenance } from './dividend-policy.js';

export function baselineAssessment(row, now = new Date()) {
  const input=scenarioInputs(row,undefined,{},true,now), errors=validate(input);
  if(row.forwardPE==null)errors.entryPE='Sourced entry valuation is unavailable.';
  if(input.payout==='')errors.payout='No eligible cash-dividend anchor; an explicit reader assumption is required.';
  if(Object.keys(errors).length)return {input,model:null,reason:Object.values(errors).join(' ')};
  try{return {input,model:project(input),reason:''};}
  catch(error){return {input,model:null,reason:error.message};}
}
export const baselineForecast = (row, now=new Date()) => baselineAssessment(row,now).model;

function unavailableRows(row,feed,assessment,now) {
  const columns=ANNUAL_CSV_HEADER.split(',');
  const cell=v=> /[,"\n\r]/.test(String(v??'')) ? '"'+String(v).replaceAll('"','""')+'"' : v??'';
  return Array.from({length:6},(_,year)=>{
    const fields={'Year':year,'Benchmark ID':row.id,'Snapshot ID':feed.snapshotId,'Snapshot version':feed.snapshotVersion,
      'Snapshot published at':feed.publishedAt,'Holding years':5,'Model convention version':MODEL_CONVENTION_VERSION,
      'Model status':'unavailable','Unavailable reason':assessment.reason,'Health evaluated at':now.toISOString(),
      'Entry PE assumption':assessment.input.entryPE,'Exit PE assumption':assessment.input.exitPE,
      'Growth mode':assessment.input.growthMode,'Dividend convention':assessment.input.dividendMode,
      'EPS growth percent':year ? assessment.input.annualGrowth[year-1] : '',
      'Growth basis':year ? assessment.input.growthPlan?.[year-1]?.basis : '',
      'Growth source provenance':year ? JSON.stringify(assessment.input.growthPlan?.[year-1] || {}) : '',
      'Yield metric provenance':JSON.stringify(metricProvenance(row,'dividendYield',now))};
    return columns.map(k=>cell(fields[k])).join(',');
  });
}

// Export each benchmark's six valuation dates (entry + five year ends), using
// current loaded source data and the same default engine as the comparison.
export function fiveYearCSV(feed, now = new Date()) {
  const output = [];
  for (const row of feed.indices) {
    const assessment=baselineAssessment(row,now), model=assessment.model;
    if (!model) { if(!output.length)output.push(ANNUAL_CSV_HEADER);output.push(...unavailableRows(row,feed,assessment,now));continue; }
    const csv = annualCSV(model, row.growthForecast, {
      benchmarkId:row.id, snapshotId:feed.snapshotId, snapshotVersion:feed.snapshotVersion,
      publishedAt:feed.publishedAt, sourceFollowing:true, healthEvaluatedAt:now.toISOString(),
      entryMetric:metricProvenance(row,'forwardPE',now),
      exitMetric:eligibleExitMean(row) ? metricProvenance(row,'mean10YearForwardPE',now) : {classification:'illustrative-constant-multiple',value:model.input.exitPE},
      yieldMetric:model.input.dividendMode === 'yield' ? metricProvenance(row,'dividendYield',now) : null,
      growthMetric:metricProvenance(row,'growthForecast',now), payoutMetric:payoutProvenance(row,model.input,{},true,now),fieldOverrides:{}
    }).split('\n');
    output.push(...(output.length ? csv.slice(1) : csv));
  }
  return output.join('\n');
}
