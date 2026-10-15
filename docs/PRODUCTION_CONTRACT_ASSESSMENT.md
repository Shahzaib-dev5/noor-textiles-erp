# Phase 8 contract assessment

Verified clean `phase-08-production` at `14cce2c` (committed Phase 7). All 293 baseline tests passed in 15 files, 139.60 seconds. Phase 7 operational designs, immutable BOM snapshots and samples exist; historical production remains a separate read-only snapshot.

Gaps: Phase 5 reservations permit grey fabric only, and their consumption evidence is challan-specific. Core meter movements have no operational production source types. Component count contracts are not persisted or posted. Phase 6 contractor finance supports meter jobs only, although bill/payment storage and payables can be reused.

Implementation: optional `production.version: 8`, immutable order BOM snapshots, existing warehouse reservation profiles extended for linked processed-fabric production allocations, core meter movements extended for WIP/returns/cutting consumption/scrap, and one typed component movement map for piece/panel/set custody. No count is added to a meter balance. Component balances are derived, never editable totals. Existing seed/historical movements are not replayed or migrated.

Partial allocation is explicit per order/BOM line/lot/location; total reservation plus net issue cannot exceed the frozen requirement plus an owner-approved allowance. Known supplied roll references are retained; unknown processed roll identity is not fabricated. Meter posting effects and component effects are reconstructed independently from source documents during validation.

Embroidery bills reuse `processing.bills` and existing payments/contractor ledger with explicit production-job provenance. No second payable ledger. Cutting costs follow measured consumption; recoverable fabric retains its source-rate value. Components remain work-order-specific and never create packaged suits. Cancellation requires return of all recoverable WIP and explicit component dispositions. Phase 9 assembly/packaging remains deferred.
