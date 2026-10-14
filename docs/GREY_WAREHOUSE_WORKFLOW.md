# Grey warehouse workflow — Phase 5

The existing company, warehouses, locations, fabric lots, rolls, movements and reservations remain the shared source of truth. Optional `warehouse.version: 5` adds workflow evidence; it never persists independently editable balances.

## Locations and hierarchy

Create/edit locations with a warehouse, unique code, zone/rack/shelf/bin labels, storage/staging/quality purpose, optional capacity and optional fabric compatibility. Hierarchy levels are optional. Location profiles belong to the existing company and warehouse; no empty parallel hierarchy entities are created. An explicit optional action creates five empty example zones for lawn, cambric, khaddar, receiving and quarantine. This does not alter existing locations, seed stock or old movements and cannot run twice silently.

Existing locations without a hierarchy profile remain explicitly legacy/bin-unassigned. Locations containing stock cannot be deactivated or have warehouse/category changed. Historical movement category and warehouse references are protected even when the location is empty. Configured capacity and fabric compatibility are checked at posting and on whole-state validation.

## Receiving and putaway

Phase 4 GRNs may select any active GREY staging location. Draft receipts create no stock. Posting uses the original receipt transaction and then makes accepted measured stock available at staging. Putaway selects one or multiple actual roll portions and a storage destination. DRAFT → SUBMITTED → APPROVED → POSTED commits balanced source-out/destination-in movements; drafts can be edited and preposted documents cancelled. Putaway never creates another purchase receipt.

Internal transfers use the same workflow and may move part of a roll between GREY bins. They require exact source availability, active eligible destinations and capacity. Holds/quarantine/damage are resolved through quality actions rather than ordinary transfers. Known rolls must be selected explicitly. Aggregate transactions are permitted only where legacy custody is already unassigned; no new known roll identity is deliberately lost.

## Reservations

Reservations preserve physical quantity and subtract only from eligible GREY availability. Original, remaining, released and consumed quantities reconcile; partial release and cancellation are explicit. Expiry creates a review alert, not a silent automatic release. Known roll reservations protect that roll as well as aggregate lot availability.

Consumption uses a same-lot/location approved existing one-line challan with exact issued quantity. The transaction temporarily releases its own portion within the in-memory boundary, runs the existing processing issue reducer, then records consumption and one physical issue in the final single snapshot. Other reservations cannot be consumed. Full processing/challan creation screens remain Phase 6.

## Quality and custody

Owned accepted GREY material can be moved into inspection hold, quarantine, rejection or damage using paired quality movements. Physical company ownership is conserved; unavailable categories contribute zero availability. Releasing restores only remaining held quantity. Approved hold-linked adjustments record measurement gains or write-offs; written-off material is never recreated on release. Ambiguous shared-hold count differences require an explicit hold-linked adjustment.

Supplier-owned rejected GRN inspection evidence remains separate from owned warehouse stock. It is not made available by warehouse quality actions. Supplier returns reuse Phase 4 documents and credits, with an optional current GREY location after putaway/transfer. Held material must be released before a supplier return. Returning a known portion requires its roll identity.

Contractor custody comes from existing posted challans, receipts and approved processing losses. It is physically separate from warehouse on-hand and links to existing source records. No Phase 6 processing editor or fictitious contractor stock is introduced.

All actions use the existing pure-result/store-commit boundary. Failures preserve original state; successful operations write one validated snapshot and audit. Roles and audit are local demonstrations, not secure authorization or tamper-proof records.
