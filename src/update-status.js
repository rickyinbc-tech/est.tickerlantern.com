export function updateHealth(feed, now = new Date()) {
  const checks = [feed?.sourceCheckAt, feed?.growthCheckAt];
  const missed = checks.some(date => !date || now-new Date(date)>36*3600000);
  const failures = (feed?.sourceJobs || []).filter(job=>!['ok','browser-verified'].includes(job.status)).length + (feed?.growthRefresh?.failures || []).length;
  return {missed,failures,message:missed ? 'Publisher checks are overdue. The workflow may be paused, delayed or failing; retained observations keep their original dates.' : failures ? 'Some publisher checks failed. Affected observations are retained with their own dates and warnings.' : 'Recent publisher checks completed. Observation dates and publication cadences still differ.'};
}
export const checkTime = date => date ? new Date(date).toLocaleString('en-GB',{timeZone:'America/Vancouver',dateStyle:'medium',timeStyle:'short'})+' PT' : 'not yet evidenced';

export function metricHealth(row, key, now = new Date()) {
  const definition=row?.metricDefinitions?.[key], policy=definition?.freshnessPolicy || {};
  const forecast=key==='growthForecast'?row?.growthForecast:null;
  const source=forecast?.source || (key==='mean10YearForwardPE'?row?.meanSource:key==='dividendYield'?row?.yieldSource:null) || row?.source;
  const status=forecast?.sync || (key==='mean10YearForwardPE'?row?.meanSync:key==='dividendYield'?row?.yieldSync:row?.sync) || {};
  const observed=forecast?.asOf || (key==='mean10YearForwardPE'?row?.meanAsOf:key==='dividendYield'?row?.yieldAsOf:row?.asOf);
  const observationAgeDays=observed?(now-new Date(observed+'T00:00:00Z'))/86400000:null;
  const checked=status.lastSuccess || source?.checkedAt;
  const checkAgeHours=checked?(now-new Date(checked))/3600000:null;
  const referenceOnly=policy.referenceOnly===true || source?.syncMode==='dated-reference';
  const maxAge=Number.isFinite(policy.observationMaxAgeDays)?policy.observationMaxAgeDays:referenceOnly?Infinity:key==='growthForecast'?90:source?.publisher==='FactSet'?21:65;
  return {observationAgeDays,checkAgeHours,referenceOnly,
    observationStale:observationAgeDays!=null && observationAgeDays>maxAge,
    checkOverdue:checkAgeHours!=null && checkAgeHours>(policy.checkMaxAgeHours || 48),
    sourceFailure:['retained','unavailable'].includes(status.status),
    superseded:status.status==='superseded',
    definitionReview:definition?.evidenceStatus==='definition-review-required' || status.status==='definition-review-required'};
}
export function metricStatusText(row,key,now=new Date()) {
  const s=metricHealth(row,key,now);
  return [s.referenceOnly?'Dated reference':null,s.observationStale?'Observation older than its source cadence':null,s.checkOverdue?'Source check overdue':null,s.sourceFailure?'Source check failed; last verified retained':null,s.superseded?'Superseded reference':null,s.definitionReview?'Definition review required':null].filter(Boolean).join(' · ');
}
