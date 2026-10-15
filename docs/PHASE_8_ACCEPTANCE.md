# Phase 8 acceptance

Status: **complete and verified**. Branch `phase-08-production`, Phase 7 baseline `14cce2c`.

Implemented: approved-BOM plans/orders; frozen requirements/specifications; explicit shared reservations and partial issues; order WIP; cutting/returns/scrap; component lots/count movements; embroidery custody/partial receipts/shared bills; QC/rework/disposal; approved expenses/costing; dashboards, search, notifications, CSV and A4 documents. Source events and all operational maps persist in the existing snapshot.

The optional production extension preserves old snapshots without rewriting seed/history. Original production batches remain read-only. Finished SKUs and packed suits are never created by these operations. The shared inventory reconciliation includes operational WIP and scrap. Imports validate source references and expected meter/component effects.

## Executed verification

| Check | Actual result |
| --- | --- |
| `npm.cmd run typecheck` | Passed strict TypeScript |
| `npm.cmd run lint` | Passed, zero errors/warnings |
| `npm.cmd run test -- --run` | **326 passed in 17 files**, 261.43s; 293 preserved + 31 production domain + 2 integration |
| `npm.cmd run build` | Passed TypeScript and Vite production build, 15.34s Vite build |
| `npm.cmd run test:browser` | **All eight Edge suites passed** against the final production build on 127.0.0.1:4178 |
| Documentation links / `git diff --check` | Passed |

Phase 8 browser A-I: approved three-piece plan/order for 200 suits; explicit reservation/issue; 300 = 270 usable + 20 returned + 5 scrap + 5 WIP; 100/80/70 components imply 70 potential sets; 200 embroidery panels return 170 accepted and 5 rejected with 25 remaining held; QC 100 splits 85/5/4/6 and later reinspection raises acceptance to 91; premature readiness is visibly blocked. Completing the remaining 25 panels produces one actual PKR 17,000 shared contractor bill. Existing history and finished SKU objects remain unchanged. Refresh persistence, real CSV download and 375/768/1024/1440 RTL layouts in both themes passed with zero page errors.

Eight A4 PDFs were generated: work order, material issue, cutting, component lot, embroidery challan, embroidery receipt, quality inspection and rework. Print mode hides navigation. Screenshots, PDFs, CSV and source result evidence are under `artifacts/phase8/`; full command logs are `artifacts/phase8-all-tests.log`, `phase8-typecheck.log`, `phase8-lint.log`, `phase8-build.log` and `phase8-browser-suite.log`. The temporary preview server was stopped.

The additional BOM regression explicitly approves a newer revision and verifies the existing work order snapshot and 594m original requirement remain unchanged. Full closure of a reconciled two-piece order is tested without increasing finished goods. Shared contractor payment allocation and exact outstanding balance are covered by domain tests. Earlier browser suites retain their golden 1000m reconciliation, purchasing/warehouse/processing workflows, expanded 5501m custody and Phase 7 design/BOM assertions.

No known outstanding implementation failures remain within Phase 8 scope. The intentional limits below apply.

## Files and handoff

New production schemas, pure transactions, validation, material/cost services, selectors, UI and tests live under the existing `src/domain`, `src/services`, `src/store`, `src/features/production` and `src/tests` architecture. Router, warehouse reservation ownership, inventory reconciliation, shared contractor billing and global selectors were extended in place. [Workflow and module links](PRODUCTION_PLANNING_WORKFLOW.md) describe usage; [contract assessment](PRODUCTION_CONTRACT_ASSESSMENT.md) records compatibility choices.

Limits: localStorage frontend demo; accessories remain explicitly untracked; aggregate historical rolls remain unknown; rework contractor responsibility is not a custody transfer; no backend or real payment gateway. Phase 9 must explicitly consume approved components for assembly/packaging and create finished stock through its own validated documents. COMPONENTS_READY alone is not authorization to replay historical finished output.

## Screens and evidence map

| Area | Routes / actions | Business result |
| --- | --- | --- |
| Planning | `/production/plans`, `/new`, `/:id` | Approved design/color/BOM, submit/approve/reject/cancel, stock-neutral conversion |
| Orders | `/production/orders`, `/new`, `/:id`, `/:id/edit` | Frozen BOM, requirements, source costs, readiness/closure/cancellation |
| Materials | `/production/materials`, `/requirements`, `/allocations`, `/issues`, `/returns` | Eligible stock/shortage, shared reserves, partial issues, order WIP, recoverable returns |
| Cutting | `/production/cutting`, `/new`, `/:id` | Exclusive meter split, partial cutting, approved scrap, typed component output |
| Components | `/production/components`, `/:id` | Original lot/roll lineage, quality/custody balances and signed movement history |
| Embroidery | `/production/embroidery`, `/new`, `/:id`; `/production/receipts`, `/new` | Multi-lot count issues, partial returns, remaining contractor custody, completed service bills |
| Quality | `/production/quality-control`, `/new`, `/:id`; `/production/rework` | Exclusive outcomes, correction, fresh inspection, controlled disposal |
| Cost and reports | `/production/wastage`, `/costing`, `/expenses`, `/allowances`, `/reports` | Recorded/estimated cost separation, actual expenses, 15 report choices |
| Dashboards | `/production`, `/production/dashboard`, company dashboard | Live unit-separated metrics and charts; global search/source alerts |

`src/tests/unit/production.test.ts` covers conservation, reservation/issue ownership and capacity, no duplicate postings, partial issues/receipts, service units/payables/payments, QC/rework, component unit consistency, full closure, import/export and historical compatibility. `src/tests/integration/production-workflow.test.tsx` covers the actual Urdu planning form, atomic persisted production state and independent preferences. `scripts/browser-phase8.mjs` exercises the connected plan-to-QC workflow through real forms, negative readiness, shared contractor finance, printing/export, reload and responsive themes.

Main implementation files: `src/domain/entities/production-operations.ts`; `src/services/transactions/production.ts`; `src/services/production/materials.ts`; `src/services/production/costing.ts`; `src/services/validation/production.ts`; `src/store/selectors/production.ts`; `src/features/production/ProductionPage.tsx`, `ProductionEditor.tsx`, `ProductionMetrics.tsx`. Shared integrations extend existing schemas/validators, warehouse transactions/details, inventory/reconciliation, processing bills/ledger, router/registry, dashboard, global UI selectors and print CSS. Earlier phase test assertions remain preserved.
