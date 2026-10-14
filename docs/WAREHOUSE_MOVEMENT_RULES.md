# Warehouse movement rules

The original `DomainState.movements` is the only meter ledger. New `WAREHOUSE_TRANSFER`, `QUALITY_CHANGE` and `WAREHOUSE_ADJUSTMENT` effects are checked against their normalized source documents. Missing, unexpected, modified or duplicate effects invalidate an imported snapshot.

New warehouse effects carry company, fabric, lot, optional roll, source document/line, exact location/category, signed meters, actor, demo role, reason and timestamp. Paired operations carry explicit source and destination references. Old records are projected from their original GRN/challan/receipt semantics; endpoints are not guessed from a sign alone and old events are never rewritten to manufacture bins.

- Transfer/putaway: equal negative source and positive destination; same GREY category; company total unchanged.
- Quality: equal negative source and positive quality destination; quantity is conserved but eligible availability changes. Release reverses only the remaining accountable held portion.
- Adjustment: approved signed physical variance/correction, with provenance and optional stocktake/quality-hold reference. It is neither a purchase nor a transfer.
- Supplier return: the existing Phase 4 source-linked negative GREY movement and bill credit; current location may differ from the original GRN after a valid transfer.
- Processing: existing custody issue/receipt/loss reducers remain authoritative. Optional challan-line roll references preserve new identified portions; old unassigned historical issues remain unchanged.

## Independent reconciliation

For each lot: posted accepted receipts + signed approved warehouse adjustments − processing issues − supplier returns + net internal/quality transfers = physical GREY/hold/quarantine/rejected/damaged closing stock. Warehouse-wide internal/quality transfer net must be zero.

Eligible physical GREY − active reservations = available GREY. Holds, quarantine, rejection and damage contribute physical ownership but zero availability. Processed cloth and contractor custody are excluded from grey warehouse on-hand.

Contractor issued − returned output − recognized processing loss = held quantity.

For identified rolls: original receipt measurement + approved measurement adjustments = remaining grey portions + identified processed material + identified contractor custody + recognized processing loss + supplier returns. Unassigned historical rolls have no fabricated individual reconciliation; their lot equation remains exact and the unknown roll count is shown separately.

Global material conservation adds signed warehouse adjustment net to purchased input, then reconciles supplier returns, warehouse grey/quality stock, processed stock, contractor holdings, processing loss and production consumption. Positive adjustments and recognized warehouse shortages/write-offs are separately reportable. No posted history is deleted.

Meters retain four decimals using existing scaled rounding; quantities above safe bounds fail. Money remains integer paisa. Demonstration valuation uses original source receipt goods cost per meter, with PO discounts, excluding unrecorded landed charges and retail prices. Scaled integer meter weights and BigInt proportional rounding at the lot total preserve valuation through bin transfers. Physical and available valuations are distinct; measurement gains use the same documented lot-cost assumption. Unsafe aggregate monetary estimates fail validation. CSV retains signed numeric meters and protects formula-like text.
