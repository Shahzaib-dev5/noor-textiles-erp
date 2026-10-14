# Inventory rules

## Units and precision

Fabric stock uses canonical meters with four decimal places. One yard equals exactly 0.9144 meter; conversions round at the canonical precision boundary. For example, 500 yards = 457.2 meters. Commercial documents retain original quantity, unit and conversion factor. A roll or thaan is a package whose own actual measured length must be supplied; neither is a fixed-length conversion unit. PIECE, SUIT and CARTON cannot be converted to meters without an explicit domain transformation and its component/BOM evidence.

Monetary values are safe integer paisa (100 paisa = PKR 1). Rounding is deterministic, and invalid/unsafe numeric input must be rejected rather than accepted as `NaN`, infinity or a misleading formatted number. Display rounding is not permission to change stored inventory quantities.

## Stock categories

| Category | Meaning | Phase 1 behavior |
| --- | --- | --- |
| GREY | Received unprocessed fabric at warehouse | Purchase receipt increases; processing issue decreases |
| PROCESSING_OUT | Company fabric physically held by contractor | Issue increases; returned output and approved loss decrease |
| PROCESSED | Physically returned processed fabric at warehouse | Processing receipt increases |
| PRODUCTION_WIP | Material allocated/consumed within a production batch | Reserved contract; no Phase 1 posting |
| CUT_COMPONENT | Cut shirt/trouser/dupatta pieces | Reserved contract; no Phase 1 posting |
| FINISHED_GOODS | Validated packaged saleable suits | Reserved contract; golden SKU has zero stock |
| REJECTED | Explicitly rejected material/products | Reserved contract; no Phase 1 posting |
| DAMAGED | Explicitly damaged material/products | Reserved contract; no Phase 1 posting |

Processing loss is an explicit loss record and negative PROCESSING_OUT movement. It is not a positive saleable stock category. Inspection hold is a future disposition/location/reservation policy, not a ninth implicit category.

## Ledger and availability

An inventory movement is immutable posted evidence: source document, source line, lot, optional roll, location, category, signed canonical quantity and timestamp. Physical on-hand is the sum of posted signed movements for the same lot/location/category. Active reservations subtract from on-hand to produce availability:

```text
onHand(lot, location, category) = sum(posted movement.quantityMeters)
available = onHand - active reservations
contractorHeld = total issued - physical output received - approved loss
```

Transfers use one negative and one positive movement of equal magnitude. Summing only positive movements incorrectly counts transfers as newly purchased material. Balance selectors retain category/location separation; a total across all categories cannot substitute for available GREY at the issue source.

## Fifteen invariants and implementation boundaries

| # | Rule | Phase 1 enforcement / later requirement |
| --- | --- | --- |
| 1 | No negative available stock | Processing issue validates source availability and whole-state nonnegative balances. Future reservation/dispatch APIs remain unavailable until implemented. |
| 2 | No duplicate posting | Source document statuses and deterministic movement identities reject repeated GRN, processing issue or receipt. Future completions/dispatches must adopt the same boundary. |
| 3 | Traceability | Every foundation movement has valid source document/line, lot and location references; imported movements must match valid source evidence. |
| 4 | Contractor reconciliation | Custody equals issued − physical returned output − explicitly approved loss. Imported balances and transaction results are checked. |
| 5 | Explicit shrinkage/loss | Receipt output and loss are separate quantities. Positive loss creates its own record with approval/reason and movement. |
| 6 | Allocation exclusivity | Inventory reservations have typed representation and availability math. Actual production allocation is a future contract; no control can silently leave allocated material available. |
| 7 | Valid finished creation | There is no Phase 1 finished-stock posting. Cataloguing a SKU does not create suits; future completion requires assembly, inspection and packaging evidence. |
| 8 | Exclusive suit reservation | Future typed reservation contract requires whole suit quantities and availability. No working reservation button/API is presented yet. |
| 9 | Dispatch within order allocation | Future dispatch contract references sales order/reservation; implementation is deferred. |
| 10 | Return disposition | Return types require explicit saleable/inspection-hold/rejected/damaged disposition; future posting must validate inspection and original shipped quantity. |
| 11 | Monetary precision | Shared calculators use integer paisa and predictable rounding with boundary tests. No real accounting postings are fabricated. |
| 12 | Controlled cancellation | Posted documents/movements cannot be edited as drafts or silently deleted through supported transactions. Reversal is a reserved status and future transaction; direct operational cancellation is not implemented. |
| 13 | Warehouse/category separation | Categories and stock locations are explicit, validated and used in balance keys. Only supported Phase 1 fabric categories receive movements. |
| 14 | Permitted state transitions | Foundation transactions reject invalid document statuses; a shared transition helper is tested. Future document-specific states require their own phase validation. |
| 15 | Atomic client-side update | Pure transactions return one complete success snapshot or an explicit failure. The store serializes one validated versioned snapshot before adopting it in memory. Browser persistence still has documented concurrent-tab limitations. |

This table distinguishes implemented transaction protections from future architectural rules. A TypeScript interface alone is not an implemented stock operation.

## Foundation posting signatures

| Operation | Required evidence | Movements | Other state effects |
| --- | --- | --- | --- |
| Goods receipt | Approved receipt and approved/open PO, compatible line and lot, positive receipt within outstanding quantity, valid grey destination | `+received` at GREY | Receipt posted; PO receipt progress updated; activity recorded |
| Processing issue | Open approved challan, valid contractor/source/destination, available GREY by lot | `−issued` GREY; `+issued` PROCESSING_OUT | Challan posted; activity recorded |
| Processing receipt | Approved receipt and issued/partially received challan, matching line, output + approved loss within held quantity | `−output` PROCESSING_OUT; `+output` PROCESSED; separately `−loss` PROCESSING_OUT if positive | Receipt posted; loss evidence created; challan progress updated; activity recorded |

Transactions take `(state, documentId, { at, actorId })`. They return `{ ok: true, state }` or `{ ok: false, error }`. The timestamp and actor are explicit inputs so replay is deterministic. Failure preserves the caller's state. Multi-line inputs are validated as one transaction, including combined demand on the same source balance. Numeric overflow and malformed input are caught at the operation boundary and returned as failures; the validator also rejects reserved object-prototype names as IDs so inherited JavaScript properties cannot masquerade as related records.

## Golden reconciliation

```text
Purchased / GRN posted                         1,000 m
Transferred to contractor                        400 m
Grey left in warehouse                   1,000 − 400 = 600 m
Physically received processed output              380 m
Approved and recorded processing loss              10 m
Still held by contractor                  400 − 380 − 10 = 10 m

Conservation: 600 grey + 380 processed + 10 held + 10 loss = 1,000 m
Current physical material: 600 + 380 + 10 = 990 m
Finished suits: 0 (SKU catalogue record only)
```

The 10 meters held are not an automatic loss. The 380 processed meters are not 380 suits. Processing issue changes custody, not purchased total. Loss appears once in conservation, with the corresponding reduction of physical custody, and is never added back as stock.

## Changes and cancellation

No user can directly overwrite the authoritative balance through the Phase 1 UI. Reset/import are explicit demo-data management operations; they are not warehouse adjustment workflows. A future posted cancellation must create linked compensating entries, validate downstream use and preserve history. Later production transforms lengths to pieces/suits with explicit input/output/loss records instead of adding incompatible units together.

## Limits

These are deterministic local-demo safeguards. The store can detect a changed saved snapshot before writing and refuse a stale tab, but localStorage has no atomic compare-and-swap across tabs. A simultaneous read/check/write race is still possible. Data can also be manually modified outside the app. Production custody requires a transactional server and authorization, intentionally outside this project.
# Phase 4 receiving and purchase returns

Accepted USER GRNs use the existing goods-receipt posting architecture. Draft lots/rolls never contribute stock until posting. Rejected/quarantined inspection rolls contribute zero stock; zero accepted rolls may post inspection evidence only. Unit conversion, four-decimal rounding and zero receipt tolerance are described in [GRN and roll receiving](GRN_AND_ROLL_RECEIVING.md).

`PURCHASE_RETURN` is a negative GREY movement linked to the original receipt line, lot, location and optional known roll. It cannot exceed movement-derived availability or eligible received/identified roll quantities. Imported states require exact posted-return stock effects and roll references. Original GRNs and measured roll lengths remain intact. Global conservation subtracts supplier-returned meters as a separate outflow; PO received quantity is not reopened by returns. No warehouse total is manually edited.

## Phase 5 warehouse rules

Inspection hold and quarantine are now explicit meter categories. Physical grey warehouse ownership includes GREY plus owned hold/quarantine/rejected/damaged material; only active-location eligible GREY, less active reservations, is available. Processed and contractor-held material remain separate. Supplier-owned rejected GRN evidence remains unowned inspection data, not company inventory.

Putaway and internal GREY transfers post balanced source/destination pairs once. Quality classification/release uses paired movements and cannot recreate written-off material. Known lots require identified roll portions; unknown historical lots permit exact aggregate operations without fabricated assignments. Inactive occupied locations, wrong category/endpoints, excess reservations, capacity overruns, incompatible fabric, insufficient source stock and repeat posting are blocked.

Approved stocktake/manual adjustment net is added to global purchased-input conservation, with positive gains and negative warehouse shortages/write-offs visible separately. Stale scope fingerprints block count posting. Individual known-roll conservation includes identified contractor/processed quantities and recognized losses/returns; unknown legacy custody is explicitly excluded from individual claims while lot reconciliation remains exact.

Lot valuation rounds source goods cost by scaled meter weights at lot totals, preserving value through internal bin transfers; it excludes invented charges and selling prices. Unsupported unsafe aggregate monetary estimates fail validation. See [movement equations](WAREHOUSE_MOVEMENT_RULES.md), [workflow](GREY_WAREHOUSE_WORKFLOW.md) and [stocktaking](STOCKTAKING_AND_ADJUSTMENTS.md).
