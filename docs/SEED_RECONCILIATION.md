# Expanded seed reconciliation

Seed `noor-expanded-2026-v1`; as of 2026-10-01. Values below are reproduced by tests and production browser snapshots, never stored dashboard totals.

## Fabric — meters

| Measure | Value |
| --- | ---: |
| Posted purchased input | 52,920 |
| Issued to contractors | 37,400 |
| Physically returned processed material | 31,404 |
| Recognized processing loss | 495 |
| Still with contractors | 5,501 |
| Grey warehouse | 15,520 |
| Processed warehouse after production allocations | 24,035.52 |
| Allocated production material | 7,368.48 |
| Embedded in accepted / rejected component output | 5,948.70 |
| Production WIP material | 1,275.30 |
| Cutting allowance recorded as waste | 144.48 |

Contractor: 37,400 − 31,404 − 495 = 5,501.

Fabric: 15,520 + 24,035.52 + 5,501 + 495 + 7,368.48 = 52,920.

Production allocation: 5,948.70 + 1,275.30 + 144.48 = 7,368.48.

Current lot/location balances deduct historical material allocations. The original meter movements remain immutable and source-checked. Date-ordered validation prevents allocations exceeding then-available processed fabric. Roll length is a receipt measurement, not a second ledger posting.

## Production and finished suits

1,200 targets = 900 packaged + 9 rejected + 171 in progress + 120 unstarted.

Finished saleable category: 900 packaged − 180 dispatched − 8 damaged transfers = 712 physically held.

Available: 712 − 70 active reservations = 642 suits. Damaged stock remains separately visible as 8; rejected components never enter packaged saleable stock. Reservations do not create/subtract physical movements. The 6 zero-stock catalogue SKUs contribute no finished inventory.

Each finished movement must have one exact packaging/dispatch/damage source effect; duplicate or missing effects fail validation. Reservations require then-existing packaged stock and an eligible order. Dispatch cannot exceed ordered/reserved stock. Invoice quantities cannot exceed the associated dispatch.

## Financial — PKR

| Measure | Rupees |
| --- | ---: |
| Received purchase valuation / explicit supplier bills | 14,002,632.00 |
| Invoice sales | 677,800.00 |
| Allocated customer receipts | 417,100.00 |
| Outstanding invoices | 260,700.00 |
| Cash collected | 417,600.00 |
| Unapplied credit | 500.00 |
| Explicit expenses plus processing charges | 928,175.00 |
| Sales covered by completed-batch direct costing | 596,800.00 |
| Limited gross contribution on covered sales | 289,740.45 |

Invoice: 677,800 − 417,100 = 260,700.

Cash: 417,100 + 500 = 417,600.

Opening customer and supplier balances are zero. Supplier payments, tax, credit notes and returns are absent; none is silently inferred. Payment allocations are checked both per payment and per invoice. Integer paisa calculations and safe aggregate checks prevent monetary overflow.

## Validation evidence

`validateSeed(input)` returns structured issues on invalid input, or collection counts and independently derived reconciliation on valid input. It does not repair or mutate records. Strict history schemas, base-state relationship/movement validation and history invariant inspection are also used by import/export and every persisted commit.

Checks cover ID uniqueness, audit/company ownership, real foreign keys, BOM widths/components, receipt/status consistency, chronological stock, explicit losses, component output, packaging inspection, reservations/dispatch, source prices/discounts, supplier bill provenance, invoice arithmetic, payment ownership/allocations and safe aggregate money.

The Phase 1 fixture remains independent: 1,000 purchased = 600 grey + 380 processed + 10 contractor-held + 10 recognized loss; zero suits.
