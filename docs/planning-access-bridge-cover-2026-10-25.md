# RDSP access, pension bridge endings and rebuilding cash

This batch adds three English articles with twelve figures and data tables.
All account, benefit and property dollar amounts are original hypothetical inputs.
No private account, policy, client or archived message is used.

## Scope and sources

Official CRA RDSP payment and RC4460 guidance and ESDC issuer AHA guidance were
read on 25 October 2026. The calculator isolates an ordinary proportional
repayment for continuing DTC eligibility and a beneficiary under 60. It accepts
issuer-confirmed AHA and remaining annual payment capacity; it does not calculate
DAP/LDAP limits, taxable composition, benefit effects, special cases or history.
Payment is capped at assets above opening AHA and the entered capacity; government
repayment is separately capped at the AHA. AHA exceeding plan value yields no
modeled payment, with the inconsistency retained rather than repaired silently.

The current Treasury Board public-service income page supplies a specific
lifetime/temporary example and bridge-ending context. OSFI's dated January 2016
member guide supports checking actual plan terms; no dated legal limit is used.
The tool uses independent net amounts and whole-year age bands, with annual
receipts before spending. It does not reproduce birthday-month proration or
reprice CPP/OAS benefits. Additional starting cash covers the deepest annual
cash deficit; later surpluses do not retroactively fund earlier bills.

Intact's Canadian article of 2 July 2026 and FCAC's home-insurance page support
rebuilding/market-value distinctions and coverage scope. The payout is explicitly
an invented contract: max(0, min(covered rebuilding cost, limit) - deductible).
No actual insurer formula, coinsurance clause or replacement guarantee is used.
Market value never enters the payout. The deductible is not counted twice.

Five public HTML source copies and hashes remain ignored and owner-restricted
under qa/access-bridge-cover-sources. The Intact page was readable through a
public web fetch; its direct archive request returned HTTP 405, so no retained
complete HTML copy is claimed. Source links and review dates are in the articles.

## Verification

Seventeen focused tests check independent arithmetic, conservation of cash,
AHA/cap constraints, transition ages, out-of-window events, negative positions,
zero cases, deductibles/limits and narrow accessible rendering at each boundary.
A negative-zero required-reserve result was corrected to an exact nonnegative
zero. Full JavaScript suite: 725 passed. Python suite: 122 passed.

Browser verification uses tests/browser_access_bridge_cover.py at 1440, 390
and 320 pixels, checking twelve figures and tables, dynamic edits, reset and
invalid input behavior. All three widths passed for all three pages, including dynamic edits, reset,
invalid-input retention and table disclosure. Mobile figure screenshots were
visually inspected. Actual results and screenshots stay under qa/.
