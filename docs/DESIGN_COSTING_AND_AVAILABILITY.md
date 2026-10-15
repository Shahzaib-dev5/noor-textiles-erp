# Costing and material availability

## Requirements and eligible material

`requiredQuantity`, `checkMaterialAvailability` and `materialCatalog` in `src/services/designs/planning.ts` use the existing canonical four-decimal meter precision and shared inventory balances.

```text
Requirement = quantity per suit × planned suits × (1 + wastage / 100)
Shortage = max(0, requirement − eligible remaining availability)
Surplus = max(0, eligible remaining availability − requirement)
```

For 3 m × 200 suits and 5% waste, requirement is 630 m. Different components calculate independently. Different fabrics, pinned lots and color/shade requirements are never pooled indiscriminately. Pinned-lot lines allocate preview capacity first; each matching balance is decremented in a temporary planner map so repeated lines cannot reuse the same stock. No persistent reservation or issue is created. Different design/variant previews are independent scenarios, not a globally allocated production schedule.

Eligible means active fabric/lot/location with positive available PROCESSED stock. Shared balances already subtract active reservations and historical production allocations. Grey, quality-held, quarantined, rejected, damaged and contractor-held quantities remain visible in the read-only catalog with an unavailable reason. They do not supply ready material. Historical color-unknown material cannot satisfy MATCH_VARIANT; an explicit ANY component can use it. Black lots cannot supply a Maroon MATCH_VARIANT line. Raw/bleached/printed/dyed stages are identified from locations and Phase 6 output provenance where known.

Phase 5 currently commits grey reservations only; Phase 7 adds no processed reservation command. The planner respects shared reservation deductions, with selector-level future processed-reservation coverage, while Phase 8 must implement actual production reservation/issue evidence.

Reports and dashboard use each approved active variant's current BOM at its design's target suit quantity as an independent planning scenario; inactive/archived designs contribute no current demand. Demand therefore sums variant scenarios; it is not a confirmed total production order. Collection target quantity/value instead sums design-level targets once. The detail availability input is a transient per-variant what-if quantity.

## Estimated costs

Each BOM rate is an optional integer-paisa rate per stated unit. Wastage applies to its quantity. Multiplication uses the existing scaled-quantity money helper. Additional structured per-suit assumptions carry category (material, processing, accessories, production, overhead), source, optional contractor rate-card reference, amount and notes. Do not add processing twice when it is already included in a selected processed lot's cost.

```text
Estimated unit cost = material + processing + accessories + production + overhead
Estimated contribution = target wholesale price − estimated unit cost
Estimated margin % = estimated contribution / target wholesale price × 100
```

Zero target price has an undefined margin. Missing amounts remain visibly unpriced; they are not silently treated as confirmed zero costs. Explicit acknowledgement permits readiness with those incomplete assumptions, which remain flagged. The displayed sum includes priced portions only. Unit/planned monetary overflow is rejected.

Sources distinguish recorded material cost, current rate estimate, contractor rate-card estimate and manual planning estimate. Phase 6 output costing includes prior stages and uses posted bills where available; an unbilled stage remains an estimate. Historical processed material cost is available only when historical return/charge evidence exists. Unknown cost stays unpriced. Selecting recorded material cost captures the displayed source rate; supported saves verify the selected lot and source. Approval freezes BOM rates; later source changes do not reprice approved revisions. Additional contractor estimates are explicitly entered per suit with their unit/conversion basis in notes; selecting a rate card does not multiply meters by panel rates.

The illustrative 420 + 300 + 260 + 120 + 180 + 45 + 35 + 60 + 80 = PKR 1,500 and target PKR 2,000 produces PKR 500 expected contribution and 25% estimated margin. Tests/browser enter these values; dashboards do not seed or hardcode them. No actual revenue, profit, payable or journal is created.
