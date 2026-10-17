# Phase 10 acceptance

Status: **complete and verified - 2026-10-17 (Asia/Karachi)**. Expected branch `phase-10-wholesale-sales`, committed Phase 9 baseline `8844401`. Existing uncommitted user-manual PDF/script and its README/progress additions are preserved.

Implemented shared customer profiles/groups and statements, credit policy/exposure/explicit exceptions, scoped effective price tiers and safe discounts, quotations/conversion, frozen multi-SKU orders/amendments/cancellations, existing-ledger lot/carton reservations, picking/partial confirmations, atomic dispatches, transport/manual delivery, invoice-ready references, dashboards/eight charts/sixteen reports, source search/alerts, CSV and Urdu A4 documents. No backend, live courier, invoice/payment posting or automatic stock return was added.

Automated verification on 2026-10-17:

| Check | Actual result | Evidence |
| --- | --- | --- |
| Unmodified Phase 9 baseline | 374 tests / 19 files passed, 383.78s | `artifacts/phase10-baseline-tests.log` |
| Complete automated suite | 424 tests / 21 files passed, 565.53s | `artifacts/phase10-all-tests.log` |
| Final Phase 10 regressions after last guards/display changes | 44 domain + 6 UI/persistence tests passed, 147.29s | `artifacts/phase10-final-focused.log` |
| Final credit-held-order aggregation regression | Passed,1 selected test (43 intentionally not selected) | `artifacts/phase10-credit-metric-test.log` |
| TypeScript | Passed, strict configuration retained | `artifacts/phase10-typecheck.log` |
| ESLint | Passed | `artifacts/phase10-lint.log` |
| Production build | Passed, final Vite build15.95s | `artifacts/phase10-build.log` |
| All ten production browser suites | Passed, exit0 | `artifacts/phase10-browser-suite.log` |

No earlier tests were removed or weakened. The historical-extension test type was extended to permit the new optional wholesale extension. New tests cover tier boundaries/discount rounding, price snapshots, customer ownership, quotation expiry/conversion, credit/holds/explicit exceptions, partial reservations/picking, competing claims,40+35 shipments, full/partial carton rules, delivery discrepancies, source validation, duplicate posting, JSON/reload and non-mutating printing.

Phase 10 browser scenarios use real Phase7/8/9 forms to produce100 finished suits rather than injecting stock. They exercise customer/group/tier pricing, multi-SKU quotation conversion, competing60/50 reservations, order100/reserve70/pick40/dispatch40, subsequent35, the500000/350000/200000 credit case, explicit owner exception, full-carton handling, damage exclusion, delivery/return boundaries, unchanged history, eight A4 sheets, CSV, JSON/preferences/reload and four RTL widths in both themes. All scenarios passed on the production preview with zero page errors. Results are recorded in `artifacts/phase10/results.json`, with eight A4 PDFs, eight responsive screenshots, CSV and the actual operational JSON export. After the final credit-held-order KPI refinement, TypeScript/lint/build and its selected domain regression passed. A production browser check imported the actual operational export and verified8 affected orders,375px dark/1440px light dashboard layouts and zero page errors (`artifacts/phase10-dashboard-browser.log`, `artifacts/phase10/dashboard-results.json`). Desktop/mobile screenshots were visually reviewed.

See [contract assessment](WHOLESALE_CONTRACT_ASSESSMENT.md), [customers](WHOLESALE_CUSTOMER_MANAGEMENT.md), [pricing](WHOLESALE_PRICING_RULES.md), [workflow and diagram](QUOTATION_AND_SALES_ORDER_WORKFLOW.md), [credit](CUSTOMER_CREDIT_CONTROL.md), [reservation/picking](SALES_RESERVATION_AND_PICKING.md), [dispatch/delivery](DISPATCH_AND_DELIVERY_WORKFLOW.md) and [reconciliation/handoff](SALES_RECONCILIATION.md).

Intentional boundaries: frontend/localStorage and simulated roles; no live shipment/financial integrations; quantity tiers aggregate only the same SKU; partial cartons require controlled release/unpack; historical missing logistics/individual package detail remains unknown; COD is conservatively exposed and external ADVANCE evidence is an owner exception, not a receipt; posted dispatch returns require a separate inspected receipt. Phase11 owns invoicing from immutable dispatch references and must prevent duplicate billing/exposure or stock deduction.


## Implemented modules and handoff

| Area | Implemented behavior |
| --- | --- |
| Customers | Shared stable IDs, unique codes, Urdu/English shop/contact/address, groups, profile edits/deactivation and source-backed statements |
| Credit | Original invoice/payment balances plus separate remaining commitments/unbilled shipments; limit/hold checks at order and dispatch approval; bounded audited owner exceptions |
| Pricing | Effective SKU/design/collection/group scope, inclusive quantity tiers, immutable active lists, captured rates, exclusive commercial discounts and exact paisa allocation |
| Quotations | Draft/submit/approve/present/accept, explicit expiry/rejection/cancellation, one-time linked draft-order conversion |
| Orders | Multiple SKU lines, original quantities and frozen approvals, derived fulfillment states, controlled cancellation/amendment and explicit partial permission |
| Reservations | Existing accepted finished lots/location/carton sources, historical claims included once, competing stock protection and explicit release/replacement |
| Picking | Order-owned sources, assignments, partial confirmations with unique references, shortage evidence and protected pending claims |
| Dispatch | Prepare/ready/owner-approve/post, source and credit revalidation, one finished-ledger outflow, exact reservation consumption, partial shipments and full-carton custody |
| Delivery | Manual transport/consignment/proof, cumulative good/short/damaged counts and terminal statuses; sender return never automatically restocks |
| Reconciliation | Original history retained, source-derived physical/reserved/available balances, exact shipment-value allocation and independently reconstructed ledger effects |
| Finance | Existing20 historical invoices/30 payments remain authoritative and unmodified; shipment creates a stable invoice-ready source, no receivable/receipt |
| Dashboard/reports | Live metrics, eight charts, actual shipped-design quantities, sixteen reports including customer/design ranking, filters, alerts, search, CSV and A4 |
| Persistence | Optional strict version10 inside schema1; old absence remains lossless, no silent resets, invalid imports fail without replacing data; preferences separate |
| Phase 11 | Consume immutable dispatch portions once, allocate partial billing by cumulative prefixes, move exposure from unbilled to invoice, never deduct stock again |

## Main routes and files

Start at `/sales/dashboard`, `/customers` or `/sales/orders`. Working registers include `/sales/customer-groups`, `/sales/credit`, `/sales/pricing`, `/sales/quotations`, `/sales/reservations`, `/sales/availability`, `/sales/fulfillment`, `/sales/picking`, `/dispatch`, `/dispatch/transport`, `/dispatch/deliveries`, `/sales/returns-preview`, `/sales/invoice-ready` and `/sales/reports`. New/edit/detail/statement child routes and preserved `/sales`, `/pricing`, `/quotations` aliases are listed in [route map](ROUTE_MAP.md).

Main additions: `src/domain/entities/wholesale-operations.ts`; `src/services/pricing/wholesale.ts`; `src/services/wholesale/{credit,fulfillment}.ts`; `src/services/{transactions,validation}/wholesale.ts`; `src/store/selectors/wholesale.ts`; `src/features/sales/{WholesalePage,WholesaleEditor,WholesaleMetrics,CustomerDetails,documents}`; Phase 10 fixture/domain/UI tests and `scripts/browser-phase10.mjs`. Shared changes integrate routing, Urdu labels, search/alerts/company dashboard, optional domain validation, finished reservation/ledger/carton effects and scoped printing. The existing PDF/manual generator is preserved.


## Acceptance criteria

All required criteria are satisfied within the documented frontend demonstration scope. No known outstanding Phase 10 verification failures remain. The initial delivery-form reason omission was fixed and covered by a sixth UI test before the passing production workflow. Existing user-manual work remains untouched.

- [x] Phases 1–9 remain operational.
- [x] Historical customers and invoices remain valid.
- [x] Customer management works.
- [x] Customer groups work.
- [x] Credit profiles are accurate.
- [x] Credit limits are enforced.
- [x] Wholesale price lists work.
- [x] Quantity-tier pricing works.
- [x] Discounts are validated.
- [x] Quotation workflow works.
- [x] Quotation conversion works.
- [x] Multi-SKU sales orders work.
- [x] Order status transitions are valid.
- [x] Approved price snapshots remain stable.
- [x] Finished-goods availability is accurate.
- [x] Reservations cannot exceed available stock.
- [x] Reservations do not reduce physical stock.
- [x] Partial reservation works.
- [x] Picking works.
- [x] Multiple dispatches work.
- [x] Dispatch reduces physical stock exactly once.
- [x] Carton dispatch does not double-count stock.
- [x] Delivery tracking works.
- [x] Invoice-ready dispatches are correctly referenced.
- [x] No duplicate financial receivable is created.
- [x] Historical expanded seed balances remain correct.
- [x] Dashboard uses live data.
- [x] Reports, filters and alerts work.
- [x] Global search works.
- [x] CSV export works.
- [x] Urdu A4 printouts work.
- [x] localStorage persistence works.
- [x] JSON import/export remains valid.
- [x] Urdu RTL works.
- [x] Responsive layouts work.
- [x] Light/dark mode works.
- [x] All existing tests pass.
- [x] New tests pass.
- [x] Browser suites pass.
- [x] TypeScript passes.
- [x] Lint passes.
- [x] Production build passes.
- [x] Documentation is updated.
