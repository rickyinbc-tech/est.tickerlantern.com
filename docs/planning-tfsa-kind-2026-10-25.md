# TFSA in-kind contribution: value, cost and room

One detailed English guide adds four interactive figures with data tables:
gross account-location stacks, a contribution-room waterfall, gain/denied-loss
price cases and a contribution-versus-room price stress. All holdings and
amounts are original hypothetical inputs. No private account or client data,
private research or email archive is used.

## Public sources and boundary

Three official CRA HTML pages were checked on 25 October 2026. Before you
contribute and How to contribute were modified on 20 February 2026. Calculating
and reporting your capital gains and losses was modified on 5 February 2026
and contains 2025-return examples. Original public bytes, source URLs,
retrieval dates, metadata dates and SHA-256 hashes remain ignored and
owner-restricted under qa/tfsa-kind-sources.

The first page directly supports FMV for the qualified in-kind contribution,
the deemed disposition, reportable gains and the inability to claim a
resulting capital loss. The second supports reconciling holder records across
all TFSAs and the delayed CRA account update. The third supports the general
proceeds-minus-ACB-and-expenses framework and records. No current tax rate,
inclusion rate, annual contribution limit or official worked case is copied.

Assume eligible Canadian residency, permitted qualified capital property,
verified allocated ACB per proposed unit and independently reconciled room.
This is a new contribution from non-registered property, not a transfer
between TFSAs or a withdrawal from another registered plan. Fees, foreign
currency, income-account treatment, special property rules, other transactions,
personal tax, excess tax and future returns are outside the model.

## Independent ledgers

Let n be units proposed, h other units retained, p contribution-date unit FMV,
c verified allocated unit ACB and R available room. Contribution=np; allocated
cost=nc; positive gain=max(0,np-nc); denied-loss magnitude=max(0,nc-np).
Claimable loss from this in-kind contribution is zero. No sale cash arrives.

Room arithmetic is R-np without clipping. A negative result identifies a
proposal shortfall; it does not authorize the contribution or calculate legal
excess tax. The before market value (n+h)p equals hp+np after the unchanged-price
movement, before tax and fees. Room is capacity, not another household asset.

Defaults n=400, h=200, p=CAD 30, c=CAD 20, R=CAD 15,000 give a CAD 12,000
contribution, CAD 8,000 cost, CAD 4,000 gain before inclusion and CAD 3,000
capacity remainder. Gross selected wealth stays CAD 18,000. At p=15, the
contribution is CAD 6,000 and the denied-loss magnitude is CAD 2,000. At p=40,
the proposal is CAD 16,000 and the room shortfall is CAD 1,000. The default
price/room crossing is R/n=CAD 37.50. Zero units never create a finite crossing.

## Verification

Ten focused tests check the independent default identities, gain/loss cases,
FMV room use, failed-proposal retention, cost/room independence, retained-unit
independence, zero cases, wealth conservation, exact in-range crossing and
finite accessible rendering at all supported field extrema. Invalid fractional
units, out-of-range amounts and NaN are rejected.

Full JavaScript suite: 1224 passed. Python suite: 122 passed.
Browser checks at 1440, 390 and 320 pixels verify four figures/data tables,
no page overflow, the denied-loss label, negative room remainder, zero proposed
units, invalid fractional-unit retention, reset and table disclosure. All four
default mobile chart screenshots are visually inspected before publication.
