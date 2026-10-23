import { project, annualCSV } from './model.js';
import { scenarioInputs } from './scenario-state.js';
import { eligibleExitMean } from './valuation-policy.js';
import { metricProvenance } from './update-status.js';

export function baselineForecast(row, now = new Date()) {
  if (row.forwardPE == null) return null;
  try { return project(scenarioInputs(row, undefined, {}, true, now)); }
  catch { return null; }
}

// Export each benchmark's six valuation dates (entry + five year ends), using
// current loaded source data and the same default engine as the comparison.
export function fiveYearCSV(feed, now = new Date()) {
  const output = [];
  for (const row of feed.indices) {
    const model = baselineForecast(row, now);
    if (!model) continue;
    const csv = annualCSV(model, row.growthForecast, {
      benchmarkId:row.id, snapshotId:feed.snapshotId, snapshotVersion:feed.snapshotVersion,
      publishedAt:feed.publishedAt, sourceFollowing:true, healthEvaluatedAt:now.toISOString(),
      entryMetric:metricProvenance(row,'forwardPE',now),
      exitMetric:eligibleExitMean(row) ? metricProvenance(row,'mean10YearForwardPE',now) : {classification:'illustrative-constant-multiple',value:model.input.exitPE},
      yieldMetric:model.input.dividendMode === 'yield' ? metricProvenance(row,'dividendYield',now) : null,
      growthMetric:metricProvenance(row,'growthForecast',now), fieldOverrides:{}
    }).split('\n');
    output.push(...(output.length ? csv.slice(1) : csv));
  }
  return output.join('\n');
}
