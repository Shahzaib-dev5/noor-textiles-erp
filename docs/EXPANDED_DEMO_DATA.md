# Phase 3 connected demo dataset

The opt-in builder is `src/data/seed/expanded-seed.ts`. Seed identity: `noor-expanded-2026-v1`; historical extension version: 3; reporting date: 2026-10-01. It uses fixed identities, dates, amounts and sequences. There is no random generation or render-time insertion.

## Actual generated counts

| Records | Count |
| --- | ---: |
| Company / employees | 1 / 6 |
| Suppliers / fabric masters / contractors / customers | 12 / 12 / 8 / 20 |
| Lots / measured rolls | 20 / 800 |
| Purchase orders / PO lines / goods receipts / receipt lines | 20 / 20 / 20 / 20 |
| Processing challans / lines / schedules | 18 / 18 / 18 |
| Processing receipts / losses / service charges | 15 / 15 / 15 |
| Collections / designs / color variants | 4 / 30 / 90 |
| BOMs / component definitions | 30 / 75 |
| Production batches / material allocations / component output snapshots | 10 / 23 / 23 |
| Packaging histories / finished suit movements | 24 / 52 |
| Finished SKUs | 30; 24 have accepted packaged output, 6 remain zero-stock catalogue entries |
| Wholesale orders / order lines | 30 / 30 |
| Reservations | 30: 20 consumed, 10 active |
| Dispatches / dispatch lines / invoices / invoice lines | 20 / 20 / 20 / 20 |
| Customer payments / allocations | 30 / 30 |
| Supplier invoice snapshots | 20 |
| Expense records | 33: 30 batch cost rows (three zero-cost planned rows) and 3 indirect expenses |

Profiles are normalized extension maps: 12 suppliers, 12 fabrics, 8 contractors, 20 customers and 30 design plans with target prices/quantities and real batch references. All have the same company ID. Existing master records remain in the original shared domain maps, never in a parallel Zustand store.

## Dependency graph and provenance

One company → people/locations → suppliers/fabrics → approved purchase orders → posted goods receipts → lots/rolls → issued processing challans → returned material and recognized loss → collection/design/variant/BOM → historical component/material output → inspected packaging → finished count movements → sales order/consumed reservation → dispatch → invoice → allocated payment.

Every historical reference resolves to an actual record. A material allocation names the lot, BOM line, batch and processed-stock location. Packaging names batch, SKU, variant and warehouse. A dispatch line names the order line and its consumed reservation. An invoice line names the dispatched line, and payment allocations name both receipt and invoice.

Purchase and processing history replay the unchanged public posting reducers before the historical extension is attached. The original `createSeedState()`, `createScenarioState()` and their golden IDs remain unchanged. Production and wholesale histories are validated snapshots for reporting, not new editing/posting screens.

## Reproducible assumptions

- All entities are fictional. Non-dialable phone placeholders and `example.test` emails avoid real personal contact information.
- Company location is Azam Cloth Market, Lahore. Currency is PKR; money is integer paisa, fabric is four-decimal canonical meters, suits/components are integer counts.
- Each lot has 40 measured rolls with varying 48.5/55/62.25/75/90 m lengths. Their 2,646 m sum is received legitimately; original measurements are not current available roll balances.
- Widths vary from 44 to 60 inches, GSM and fabric compositions differ. Purchase rates range from Rs 180 to Rs 378 per meter.
- There are 18 completed and 2 partially received purchase orders. All 20 GRNs are posted. Each order has one line; the existing engine continues to support multiple lines.
- Processing: 12 completed, 3 partially received, 2 issued/pending and 1 cancelled before issue. Rates are only paisa per physically returned meter; missing fabric is never called finished stock or guessed to be lost.
- Each design has a 2- or 3-component meter BOM, with component-specific fabric/width and 2% cutting allowance. Two-piece designs contain shirt/trouser only.
- Production batches: 6 completed, 2 packing, 1 cutting, 1 planned. Aggregate target is 1,200 suits: 900 accepted/packaged, 9 rejected, 171 in progress and 120 unstarted.
- 20 orders have dispatch/invoice histories (15 complete, 5 partial); 5 more are confirmed, 3 draft and 2 cancelled. Cancelled/draft orders produce neither revenue nor reservations.
- Ten invoices are fully paid, five partly paid and five unpaid. One receipt retains Rs 500 unapplied credit. The schema supports multiple allocations; this seed uses one invoice per customer and repeated partial receipts.
- No taxes, credit notes, saleable returns, supplier payments or fabricated accounting entries are added.

## Explicit loading and compatibility

Settings → **مکمل نمونہ ڈیٹا لوڈ کریں** opens a replacement dialog with export, cancel and confirm actions. Only confirmation generates, validates and saves one complete snapshot. A failed generation/write retains existing business data. Existing snapshots are hydrated without replacement, and refresh never appends seed records. UI preferences stay under their separate key.

The storage key and envelope remain `noor-textiles-erp-demo-v1` / `schemaVersion: 1`. An optional strictly validated `history` extension carries its own version and seed identity. This additive change needs no destructive envelope migration. The old version-1 shape round-trips unchanged; unsupported envelope/extension versions still fail closed. Explicit reset restores the original golden dataset.

## Historical-model limits and Phase 4 boundary

The three original meter transactions remain the only executable operational postings. Their processing path is GREY → contractor → PROCESSED. A/B/C schedule classifications identify optional planned routes; they do not falsely claim every bleaching/printing/embroidery/calender stage was executed. Purchased-processed workflow D and chained stage posting require a future deliberate engine extension.

Embroidery/finishing/cutting labor costs are batch-level historical assumptions, not newly implemented per-piece contractor operations. Packaging inspection and component output counts are historical evidence, not QC/assembly editing workflows. Production history must not be casually reposted by a later module. Accessories, carton stock, source-linked returns and double-entry accounting remain later scopes. Local illustration paths are generic sample artwork, not product photographs.

Phase 4 should add purchasing/master CRUD on these normalized records with validation, safe IDs and deliberate approval/reversal rules. Preserve the opt-in loading policy, golden fixtures and read-only historical balances.
