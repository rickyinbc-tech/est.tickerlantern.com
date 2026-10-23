// A published historical statistic is visible independently of its eligibility
// for a numerical comparison or an automatic mean-reversion scenario.
export function historicalAssessment(row) {
  const value = row?.historicalCompatibility;
  const outcome = ['compatible','qualified','incompatible','insufficient'].includes(value?.outcome) ? value.outcome : 'insufficient';
  const positive = Number.isFinite(row?.forwardPE) && row.forwardPE > 0 && Number.isFinite(row?.mean10YearForwardPE) && row.mean10YearForwardPE > 0;
  return {
    outcome,
    allowComparison: positive && outcome === 'compatible' && value?.allowComparison === true,
    allowExitDefault: positive && outcome === 'compatible' && value?.allowExitDefault === true,
    reasons: Array.isArray(value?.reasons) && value.reasons.every(s=>typeof s==='string') ? value.reasons : ['Definitions have not been assessed for direct comparison.']
  };
}
export const canCompareHistory = row => historicalAssessment(row).allowComparison;
export const eligibleExitMean = row => historicalAssessment(row).allowExitDefault;
export const sourceExitPE = (row, activeEntry) => eligibleExitMean(row) ? row.mean10YearForwardPE : activeEntry;

export function metricDisplay(row, key, unit = key === 'dividendYield' ? '%' : '×') {
  const value = row?.[key], definition = row?.metricDefinitions?.[key];
  if (value == null) return definition?.state === 'not-meaningful' ? 'N/M' : '—';
  const precision = definition?.precisionDecimals;
  const digits = Number.isInteger(precision) && precision >= 0 && precision <= 8 ? precision : undefined;
  return new Intl.NumberFormat('en-US',{minimumFractionDigits:digits??0,maximumFractionDigits:digits??8}).format(value) + unit;
}
export function metricDateBasis(row,key) {
  return row?.metricDefinitions?.[key]?.evidence?.dateBasis?.includes('publication') ? 'Published (separate observation date undisclosed)' : 'Observed';
}
