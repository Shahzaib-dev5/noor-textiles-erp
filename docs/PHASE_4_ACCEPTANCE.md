# Phase 4 acceptance — purchasing

Updated 2026-10-14 (Asia/Karachi). Branch: `phase-04-purchasing`.

Status: **Complete — verified.** All required Phase 4 workflows and final checks passed. Phase 5 has not started.

## Implemented scope

Supplier and fabric persistent CRUD/deactivation, linked supplier profiles/history, purchase request lifecycle and conversion, multiple-line PO approval/cancel/confirm/close, measured draft/edit/post GRNs with partial/rejected/quarantined receiving, full retained-receipt supplier bills, multi-bill allocated payments and explicit advances, supplier ledger, approved stock-limited returns, purchasing dashboard, eleven reports, CSV, source-linked A4 printing, global search, notifications and audit.

All 28 required paths are registered and operational, plus `/purchases/dashboard`; the complete registry has 67 paths. Payments use `/purchases/payments?record=<id>` for detail. Existing future modules remain identified as pending. Company CRUD, processing changes, grey transfers/adjustments and backend work are outside this phase.

## Inspection and compatibility

The clean baseline on the expected branch passed 156 tests before changes. Existing storage, reducers, seed factories, design components and history projections were inspected and reused. Earlier architecture/progress documents proposed a broader Phase 4 including company and grey warehouse changes; the supplied Phase 4 brief narrows this to purchasing, leaving warehouse enhancements for Phase 5.

Original golden and expanded seed data are unchanged. Historical SEED POs/GRNs/bills remain immutable and are not reposted. Storage schema 1 accepts an additive optional procurement version 4 without automatic replacement; history version 3 and separate UI preferences remain intact. Original golden regression remains 600 m grey, 380 m processed, 10 m contractor-held and 10 m recognized loss; expanded purchasing remains 52,920 m, with downstream production/sales regressions preserved.

## Verification evidence

- Baseline: 156 tests passed.
- Initial extended suite: 185 tests passed.
- Purchasing unit coverage: 34 tests, including all-rejected receiving, multiple-GRN billing, multiple-bill allocation, draft payment cancellation, recoverable credit after paid returns, search, due alerts and fabric report filtering.
- `npm.cmd run typecheck`: passed (exit 0).
- `npm.cmd run lint`: passed (exit 0).
- `npm.cmd run test -- --run`: 190 tests in 11 files passed; final run 83.65 seconds (exit 0).
- `npm.cmd run build`: passed, 2,633 modules transformed (exit 0).
- `NOOR_BASE_URL=http://127.0.0.1:4174 npm.cmd run test:browser`: all four suites passed against the final production preview (exit 0), including corrected CSV rupee amounts and final shortcut/status labels.

Browser Phase 4 executes actual forms and actions in fresh contexts: new supplier/fabric, approved 1,000 m PO, draft/post 400 and 350 m receipts, 250 m remaining, over-receipt and stale duplicate rejection, Rs.100,000 bill, Rs.31,000 cash/Rs.30,000 allocation/Rs.1,000 advance, 50 m return/Rs.12,500 credit/Rs.57,500 payable, ledger CSV, global search, A4 PDF, refresh/preferences and 375/768/1024/1440 px light/dark layouts. Artifacts are local ignored files under `artifacts/phase4`.

Earlier failed attempts were investigated: a Phase 2 placeholder expectation was corrected to verify the implemented PO form; browser label matching was scoped to required field labels/dialogs; a dev-server Edge resource-loading failure was resolved by running browsers separately against production preview. Final artifact review found that procurement CSV amounts needed conversion from internal paisa to the rupee heading; this was fixed through an optional shared-table export projection and the browser now asserts Rs.100,000.00 and Rs.57,500.00 values. No failure was suppressed and browser runtime/console errors are asserted empty.

Old tests were preserved; two previous placeholder UI expectations were updated to assert the now implemented purchasing page while retaining navigation, accessibility and mobile closure checks. The existing history entity-count helper excludes the new optional extension; baseline quantities/counts remain asserted.

## Rules and limits

See [workflow](PURCHASING_WORKFLOW.md), [ledger rules](SUPPLIER_LEDGER_RULES.md) and [receiving](GRN_AND_ROLL_RECEIVING.md). Rates are per meter; tolerance zero; tax explicitly zero; bills cover full eligible retained GRN quantities. Posted documents are immutable. Advances cannot yet be reallocated/refunded and posted payments have no reversal action. Unknown historical individual-roll custody permits only stock-limited aggregate returns. Roles, local audit, localStorage commit and stale guards are demonstration mechanisms, not financial security or database guarantees.

Phase 5 handoff: extend processing/grey warehouse operations using these source references and movement-derived balances; preserve procurement events, historical data, UI preferences and regression fixtures.
