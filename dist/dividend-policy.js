import { metricProvenance } from './update-status.js';

export const DIVIDEND_POLICY_VERSION = 'benchmark-dividend-anchor-v1';

// E0=100/entryPE and D1=100*yield/100. Their ratio is a model
// equivalent, not an observed corporate/index payout on matched earnings.
export function calibratedPayout(row, entryPE) {
  const yieldPercent=row?.dividendYield;
  const definition=row?.metricDefinitions?.dividendYield;
  if (definition && !definition.permittedUse?.includes('first-payment-anchor')) return '';
  if (yieldPercent==null || !Number.isFinite(yieldPercent) || yieldPercent<0 || entryPE==='' || entryPE==null || !Number.isFinite(+entryPE) || +entryPE<=0) return '';
  return Math.round(yieldPercent * +entryPE * 1e8)/1e8;
}

export function payoutProvenance(row, input, locks={}, following=true, now=new Date()) {
  if (input.dividendMode !== 'payout') return {classification:'inactive-payout-input',policyVersion:DIVIDEND_POLICY_VERSION};
  if (!following || locks.payout || input.payout==='' || +input.payout!==calibratedPayout(row,input.entryPE)) return {classification:'user-assumption',value:input.payout,units:'percent',policyVersion:DIVIDEND_POLICY_VERSION};
  return {classification:'model-implied-payout',value:+input.payout,units:'percent',policyVersion:DIVIDEND_POLICY_VERSION,
    formula:'payout percent = source dividend-anchor percent * active entry PE',entryPE:+input.entryPE,
    initialDividendAnchorPercent:row.dividendYield,yieldEvidence:metricProvenance(row,'dividendYield',now),
    interpretation:'Ratio of the modeled first annual cash payment to the synthetic initial forward earnings anchor. Source dates and constructions can differ. Not a publisher-reported payout ratio or a matched-period D/E statistic.'};
}
