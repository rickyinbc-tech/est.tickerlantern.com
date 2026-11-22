// The one published fund figure the toolkit uses, at Ricky's instruction
// (2026-11-22): the fund's own 10-year trailing return as published by RBC
// Global Asset Management. It is copied, not calculated. It seeds the GIC
// comparison's fund-return slider as an illustrative, editable assumption.
// Verified on the official fund page (Series A selected), Trailing returns %
// table, 10 yr column. Update all fields together when the page changes.
export const FUND_SAMPLE = {
  name: 'RBC Select Balanced Portfolio',
  series: 'A',
  code: 'RBF460',
  tenYearPct: 6.6,
  asOf: '2026-10-31',
  publisher: 'RBC Global Asset Management',
  url: 'https://www.rbcgam.com/en/ca/products/mutual-funds/RBF460/detail',
  retrieved: '2026-11-22'
};
