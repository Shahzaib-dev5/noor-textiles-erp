# Phase 5 acceptance — grey warehouse

Updated: 2026-10-14, Asia/Karachi. Branch: `phase-05-grey-warehouse`. Baseline commit: `3c9220b`.

Status: **Complete — verified.** Phase 5 warehouse scope and final checks passed; full processing management remains Phase 6.

## Implemented scope

Shared-ledger warehouse dashboard, lots/rolls/detail traceability, explicit location hierarchy/compatibility/capacity and optional empty sample layout, staging/putaway, partial-roll transfers, exclusive reservations and release/consumption, stocktakes with stale-snapshot protection, approved adjustments, owned quality hold/quarantine/rejection/damage and write-offs, Phase 4 returns from current locations, read-only contractor custody, movement register/drawer, fourteen reports, CSV, A4 roll labels/reports, search and derived alerts.

See [warehouse workflow](GREY_WAREHOUSE_WORKFLOW.md), [roll tracking](ROLL_TRACKING_MODEL.md), [movement rules](WAREHOUSE_MOVEMENT_RULES.md) and [count/adjustment rules](STOCKTAKING_AND_ADJUSTMENTS.md).

All 24 requested warehouse paths plus four supporting create/edit paths are operational. The complete registry has 93 paths, including 62 implemented paths. Existing purchasing paths remain intact. Putaway/quality/custody details use `?record=<id>`; location/draft transfer edits preserve source identities. Full processing/challan creation remains Phase 6.

## Baseline and inspection

Working tree was clean on the expected branch. Existing entities, invariants, movements, reducers, persistence, seeds, purchasing UI, design components, navigation and tests were inspected. Baseline TypeScript, lint, 190 tests and production build passed before code changes.

Documentation discrepancy: earlier proposed progress/route numbers placed grey inventory in Phase 4 and processing in Phase 5. The supplied brief authorizes warehouse operations in Phase 5 and defers full processing management to Phase 6; current handoff documentation reflects this.

Original golden and expanded seed definitions are unchanged. Original storage envelope schema 1, history version 3, procurement version 4 and separate UI preferences remain compatible through optional warehouse version 5; no initialization migration resets/reposts records. Old locations remain legacy/unassigned. Historical roll custody is unknown when original issues lack roll IDs; exact lot balances are retained instead of inventing assignments.

## Verification ledger

- Baseline: 190 tests passed; TypeScript, lint and build passed.
- `npm.cmd run typecheck`: passed (exit 0).
- `npm.cmd run lint`: passed (exit 0), no warnings.
- `npm.cmd run test -- --run`: 220 tests in 12 files passed (190 previous + 30 new warehouse/calculation/export tests), final run 97.88 seconds (exit 0).
- `npm.cmd run build`: passed (exit 0), 2,643 modules; entry 257.60 kB, React/router vendor 263.85 kB, no bundle-size warning after splitting.
- `$env:NOOR_BASE_URL='http://127.0.0.1:4175'; npm.cmd run test:browser`: passed (exit 0) against the final production preview. All five suites passed, including Phase 5 A–F and 375/768/1024/1440 px light/dark checks. Runtime/console error arrays were empty.

The production rerun passed the earlier four suites and all Phase 5 warehouse/responsive steps, then a new test incorrectly summed unposted planned challans into custody. The assertion was corrected to use posted issue/receipt statuses, matching the application projection and existing baseline equations. An earlier asset 404 during rebuilding was resolved by stopping/restarting the owned preview after building. No runtime/console error is suppressed. Signed numeric CSV quantities remain numeric; untrusted formula strings retain the existing protection.

The new browser covers A–F: create bins/staging, actual 65 m purchase receipt, putaway, 20 m partial transfer (45/20), reserve 40 m/block extra 6 m, count 20→17.5 m and approved −2.5 m adjustment, hold/release 10 m, contractor custody 37,400−31,404−495=5,501 m, 800 historical rolls, search, CSV, drawer, A4, refresh/preferences and four widths in light/dark mode. Its operational fixture expects 662.5 physical grey and 622.5 available after the reservation.

## Limits and next phase

LocalStorage is a single-browser demonstration, with existing write-failure/stale-tab protection rather than database-grade atomicity. Demo permissions and audits are not secure. Historical unknown roll custody remains explicitly unknown; individual operations require proven identities. New known lots require roll selection. Opening new physical lots requires a valid GRN; adjustments correct an existing source-backed lot rather than create phantom material. Expired reservations require explicit release. Valuation is receipt goods cost, not statutory costing or invented charges.

Phase 6 should add full processing editors, multi-line identified roll/segment custody and partial receipt allocation using existing transactions. Preserve historical events, warehouse documents, reservations, supplier-return accounting and all regression fixtures. No backend, database or real payment processing was added.

## Files and evidence

Added warehouse schema, pure transactions, validation, shared portion/cost/reconciliation helpers, warehouse screens/view models, alert selector, thirty unit cases, browser script and five workflow/acceptance documents. Extended route/navigation/localization, original movement and reservation projections, purchasing current-location returns, dashboard/search, shared filtered printing/numeric CSV, bundle splitting and both progress ledgers. Original seed files, package versions and previous assertions are preserved; the history-count test's type-only omitted-key annotation includes the new optional extension.

Local ignored artifacts under `artifacts/phase5` include the posted JSON snapshot, signed movement CSV, A4 roll-label PDF and eight responsive screenshots. The unchanged expanded fixture reconciles 52,920 purchased meters, 15,520 grey and 5,501 contractor-held; the independent golden fixture remains 600 grey + 380 processed + 10 held + 10 loss. New transfers conserve quantity and lot value; the browser's approved shortage produces 662.5 physical/622.5 available grey without duplicate effects.
