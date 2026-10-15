# Phase 6 acceptance — textile processing

Updated: 2026-10-15 (Asia/Karachi). Branch: `phase-06-processing`.

Status: complete and verified. Only executed checks below are recorded as passed.

## Implemented scope

Optional version-6 processing extension inside the existing central state; contractor profiles/deactivation; unit-aware service rates and immutable job snapshots; multi-input jobs/state machine; source roll issue challans and reservation protection; contractor custody; controlled colors, dye batch/shade decisions; printing/bleaching/finishing stage views; partial accepted/held/rejected receipts and explicit approved loss; distinct output lots and multi-stage lineage; returned-material QC; contractor bills/payments/ledger; dashboard, sixteen report choices, CSV/A4, search, alerts and activity history.

No backend, external API, production authentication, new stock ledger or silent data reset was added. The unchanged seed and persistence envelope are preserved; processing metadata is an optional validated additive extension. Historical records remain readable.

## Verification evidence

- Baseline: all 220 existing tests passed in 12 files (193.17 seconds).
- Final full Vitest suite: **255 tests passed in 13 files**, including all original 220 tests and 35 new processing tests; 108.34 seconds. The focused processing suite also passed all 35 tests, including fractional-meter settlement and QC movement endpoints.
- `npm run typecheck`: passed, strict TypeScript.
- `npm run lint`: passed, no lint errors or warnings.
- `npm run build`: passed, **2,651 modules**, 20.46 seconds; processing route chunk 63.02 kB, entry 293.05 kB, charts 434.74 kB, React/router vendor 263.85 kB. No chunk-size warning.
- `NOOR_BASE_URL=http://127.0.0.1:4176 npm run test:browser`: **all six browser suites passed**, exit 0, including Phase 6 A–G and all five existing suites. The theme-toggle assumption in the new script was corrected and persisted light/dark selection was asserted.
- Final Phase 6-only browser rerun on the final production build: **passed, exit 0**. It additionally verifies a 5 m QC hold/release, output inspection history, warehouse movement source links, and navigation hidden in print media while the selected A4 document remains visible.
- Early build attempts encountered native memory exhaustion and sandbox configuration access denial. The successful final build ran with competing workloads reduced and the approved build permission; neither failed attempt is counted as a pass.

## Deliberate boundaries

One source location per challan; multiple locations use separate challans. Phase 5 reservation consumption uses an exact one-line matching reservation with the job ID as reference. One final bill per completed job prevents duplicated service portions; progressive service billing, reversals, later advance allocation and standalone credit/refund documents are not provided. Historical charge snapshots are not invented opening contractor liabilities. Non-length service quantities are financial measurements; panel production inventory is deferred. Returned processed warehouse write-offs are not exposed through the grey warehouse adjustment editor. See the linked workflow/rules documents for these limits.

## Files and integration

- `src/domain/entities/processing-operations.ts`: strict additive document schemas; the existing service catalogue now includes washing, calendering and embroidery services.
- `src/services/transactions/processing.ts`: validated pure commands, role/state checks, single-commit posting and audit events.
- `src/services/inventory/processing.ts`: custody/job/finance selectors, independently reconstructed movement effects and cumulative output costing.
- `src/services/validation/processing.ts` and existing state/warehouse validators: imported-state relationships, exact effects, financial allocation and stock reconciliation.
- `src/features/processing/ProcessingPage.tsx`, `ProcessingEditor.tsx`, `ContractorLedger.tsx`: Urdu RTL operational forms, profiles, stages, dashboard, report/filter/detail/print workflows and dedicated financial ledger.
- `src/store/selectors/processing.ts`, shared search/notification selectors, route registry and router: integrated navigation, sixteen report choices and actual source alerts.
- Existing inventory/warehouse selectors: exclude returned processed quality stock from grey totals and reconcile original roll conversion without inventing output roll identities. QC movement details use the actual endpoints and source document, with links to output inspection history.
- `src/styles/print.css`: scoped A4 printing shows the selected report without surrounding application navigation.
- `src/tests/unit/processing.test.ts`, `scripts/browser-phase6.mjs`, browser suite: new business/acceptance coverage. Existing tests are preserved; the historical count test has a type-only exclusion for the new optional extension.
- README, architecture, data model, inventory/workflow/route/progress documentation updated; seven requested Phase 6 documents and a contract assessment added.

The route registry contains 124 unique paths, 97 implemented, including 35 processing/contractor paths. See [route map](ROUTE_MAP.md) for all paths. Existing links and historical challan previews remain supported. Distinct output lots are visible at `/processing/outputs` and feed eligible later-stage jobs; this does not implement finished-suit inventory. Older phase labels on deferred design/production routes are provisional and do not expand the supplied Phase 6 processing scope.

## Workflow evidence and reconciliation

Domain tests cover contractor creation/editing/deactivation, rate units and snapshots, job transitions, partial known-roll issue, reservations and quality exclusions, independent contractors, partial receipts, colors/shade, QC release, multi-stage lineage, costs, bills/payments/advances, validated JSON, dashboard/history and search uniqueness. The original 220 regression tests remain intact.

The browser suite exercises A (300 m issue), B (500 − 200 − 150 − 120 − 15 = 15 m held), C (200 m Black + 200 m Maroon), D (100 m bleaching → 95 m output; 60 m printed → 58 m output; source bleached balance 35 m), E (PKR 2,030 bill − PKR 100 allocation = PKR 1,930 payable), F (visible over-issue rejection with unchanged movements), and G (historical custody). Duplicate posting, over-receipt, quality-held issue and duplicate billing rejection are additionally verified by domain tests; those F guards are not all driven through browser controls.

Browser checks include QC hold/release and source navigation, localStorage refresh, numeric CSV, A4 processing and contractor-ledger PDFs, true persisted light/dark selection and 375/768/1024/1440 px RTL overflow/screenshots. Artifacts are written under `artifacts/phase6/`; the combined browser log is `artifacts/phase6-browser-suite.log`, and the final Phase 6 rerun log is `artifacts/phase6-browser.log`. These are local ignored verification artifacts, not application seed data.

## Handoff

Preserve all earlier phases. The supplied brief identifies Phase 7 design studio and later production as the next boundary; await that brief before beginning it. Design studio, cutting, panel embroidery and finished-suit production are not completed by Phase 6 service records. Existing future-route phase labels remain provisional until the next brief reconciles that roadmap.
