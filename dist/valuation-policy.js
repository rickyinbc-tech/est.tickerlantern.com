import {metricProvenance} from './update-status.js';
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
export const VALUATION_POLICY_VERSION = 'historical-earnings-reference-v2';
const positive = value => Number.isFinite(value) && value > 0;
const dated = value => {const date=new Date(value+'T00:00:00Z');return /^20\d{2}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(+date) && date.toISOString().slice(0,10)===value;};
const sourceURL = source => {try {const url=new URL(source.url);return !!source.publisher && url.protocol==='https:' && !!url.hostname && !url.username && !url.password;}catch{return false;}};

// A qualified mean remains an optional reader-selected scenario assumption.
// It cannot support an automatic exit or a current-versus-history value ratio.
export function qualifiedForwardReference(row) {
  const d=row?.metricDefinitions?.mean10YearForwardPE,c=row?.metricDefinitions?.forwardPE;
  return historicalAssessment(row).outcome==='qualified' && positive(row?.forwardPE) && positive(row?.mean10YearForwardPE)
    && c?.state==='numeric' && c.evidenceStatus==='published-transcription' && c.economic?.identity===row.id
    && ['rolling-12m','forward-unspecified'].includes(c.economic.horizon)
    && d?.state==='numeric' && d.evidenceStatus==='published-transcription' && d.economic?.identity===row.id
    && ['rolling-12m','forward-unspecified'].includes(d.economic.horizon)
    && d.history?.windowYears===10 && d.history?.statistic==='publisher-reported mean'
    && d.permittedUse?.includes('historical-reference') && dated(row.meanAsOf) && sourceURL(row.meanSource || row.source);
}
export const eligibleExitMean = row => historicalAssessment(row).allowExitDefault;

// A fallback must be an exact-index trailing series, not CAPE, a median, a
// trimmed ETF proxy or a current P/E mistakenly described as a ten-year mean.
export function eligibleTTMReference(row) {
  const t=row?.trailingValuation;
  return !!(t && t.indexId===row.id && t.verification==='verified-exact-index' && t.earningsBasis==='trailing-12m'
    && t.windowYears===10 && t.statistic==='arithmetic-mean' && t.outlierTreatment==='none'
    && positive(t.currentPE) && positive(t.mean10YearPE) && dated(t.currentAsOf) && dated(t.meanAsOf)
    && sourceURL(t.currentSource) && sourceURL(t.meanSource) && t.aggregationAligned===true);
}

export function valuationReference(row, input={}) {
  const entry=Number(input.entryPE ?? row?.forwardPE);
  if (eligibleExitMean(row)) {
    return {policyVersion:VALUATION_POLICY_VERSION,type:'matched-forward',earningsBasis:'forward',
      historicalPE:row.mean10YearForwardPE,exitPE:row.mean10YearForwardPE,asOf:row.meanAsOf,
      source:row.meanSource || row.source,currentAsOf:row.asOf,currentPE:row.forwardPE,
      normalizedCurrentEPS:positive(row.forwardPE)?100/row.forwardPE:null,
      normalizedReferenceValue:positive(row.forwardPE)?100*row.mean10YearForwardPE/row.forwardPE:null,
      formula:'Historical forward P/E × current normalized forward EPS; exit P/E × projected forward EPS at exit.',
      qualification:'Internally paired forward reference; normalized EPS is synthetic, not independently observed official index EPS.'};
  }
  if(eligibleTTMReference(row)) {
    const t=row.trailingValuation;
    const rates=input.annualGrowth,years=Number(input.years || 5);
    const terminalGrowth=Number(input.growthMode==='constant' ? input.growth : rates?.[years-1]);
    // F_n is next-period earnings at exit; trailing earnings at exit are F_(n-1).
    // Thus M_TTM * F_(n-1) = [M_TTM/(1+g_n)] * F_n. No direct TTM/Fwd mixing.
    const valid=Number.isFinite(terminalGrowth) && terminalGrowth>-100;
    return {policyVersion:VALUATION_POLICY_VERSION,type:'trailing-fallback',earningsBasis:'trailing-12m',
      historicalPE:t.mean10YearPE,exitPE:valid?t.mean10YearPE/(1+terminalGrowth/100):entry,
      asOf:t.meanAsOf,source:t.meanSource,currentAsOf:t.currentAsOf,currentPE:t.currentPE,currentSource:t.currentSource,
      normalizedCurrentEPS:100/t.currentPE,normalizedReferenceValue:100*t.mean10YearPE/t.currentPE,
      terminalGrowth:valid?terminalGrowth:null,
      formula:'Current reference = ten-year mean TTM P/E × current normalized TTM EPS. Exit = mean TTM P/E × projected terminal trailing EPS; equivalent forward exit P/E = mean TTM P/E/(1+final-year earnings growth).',
      qualification:'TTM fallback; earnings bases are matched separately at the current valuation and at exit.'};
  }
  return {policyVersion:VALUATION_POLICY_VERSION,type:'constant-multiple',earningsBasis:'forward',exitPE:entry,
    qualification:'No verified historical earnings-basis match. Constant P/E scenario until an explicit assumption is supplied.'};
}
export const sourceExitPE = (row, activeEntry, input={}) => valuationReference(row,{...input,entryPE:activeEntry}).exitPE;
export const valuationReferenceLabel = ref => ({'matched-forward':'Paired forward mean','trailing-fallback':'TTM fallback','constant-multiple':'Constant P/E scenario'}[ref.type]);
export function exitMetricProvenance(row,input,sourceFollowing=true,locks={}) {
  if(!sourceFollowing || locks.exitPE)return {classification:'user-assumption',value:input.exitPE,units:'times'};
  const reference=valuationReference(row,input);
  return {classification:reference.type==='constant-multiple'?'model-assumption':'historical-exit-scenario-assumption',value:input.exitPE,units:'times',reference,sourceMetric:eligibleExitMean(row)?metricProvenance(row,'mean10YearForwardPE'):null};
}

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
