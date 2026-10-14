# Routing review

Scope: deployed source dataset only. Browser-only and unsaved team edits are not available in this workspace. Use Review routes on the live canvas or export its current JSON for a complete review.

Known working routes: Q004 Help me decide → Q070; Q090 Yes → Q090A, No → Q091; Q090A Flat fee → Q090B, Percentage → Q090C, Unknown → Q091; Q090B/C → Q091; Q096 → Q096A → Q097; Q117 Yes/Unknown → G011 → G012, No → Q118.

Missing decisions: Q130 Yes, No and optional-assignment destinations. Other unassigned answers currently use question order, which may be intentional. All 286 such answers are listed in routing-review.json.

45 condition entries across 18 fields have no executable source mapping. Each needs the actual source question and any value conversion; inferred purple lines are not canonical assignments.

| Field needing a mapping | Questions using it |
| --- | --- |
| property.type | Q011 |
| property.hasMud | G006, G007 |
| property.addendums.has.section1031Exchange | G017 |
| property.addendums.has.thirdPartyFinancingAddendum | Q032 |
| seller.maritalHomesteadStatus | G002 |
| mortgage.first.exists | Q044, Q045, Q046, Q047, Q048, Q049, Q052, Q053, Q054, Q057, Q058, Q060 |
| mortgage.first.status | G008, G009, G010 |
| seller.openToSellerFinance | Q055, Q056, Q058, Q059 |
| seller.openToSubjectTo | Q058, Q059 |
| seller.openToWrap | Q058, Q059 |
| property.hasHOA | Q087 |
| property.occupied | Q118, G013, G014, G015 |
| property.hasLease | Q118, G013, G014, G015 |
| deal.refinanceAvailable | Q156 |
| creativeFinance.isWrap | Q167 |
| property.waterRights | Q181 |
| contract.fullyExecuted | Q183, Q184, Q185 |
| property.addendums.has.backUpContract | Q186 |

Other gaps: strategy selection is manual in preview; typed-input connections currently provide one unconditional continuation, not numeric threshold branches; target visibility can prevent a jump even when a connection points to that question; unknown visibility can be shown for review rather than reliably skipped; numeric answers are collected but do not automatically calculate loan amounts, annual debt service, cash flow or DSCR; Q011's new-home visibility values do not match Q010's available options; deleting an explicit route falls back to question order rather than automatically ending the questionnaire; cycles are caught during preview but are not yet exhaustively checked across the entire graph; the downloaded original package is a source snapshot while project JSON contains current answer destinations and continuations; local browser changes require an explicit team save.
