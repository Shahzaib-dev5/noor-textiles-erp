# Sales reconciliation and Phase 11 handoff

```text
Order remaining = ordered - explicitly cancelled - posted dispatched
Active reservation = original reserved - posted consumed - explicit releases
Current picked available = confirmed - posted dispatch (unless unused allocation cancelled)

Finished physical = historical net physical + new packaged receipts
                  + approved adjustment net - new posted dispatches
Available = eligible accepted physical - active historical/operational reservations
Cartons are memberships in that physical quantity, never additional goods.
```

The unchanged expanded snapshot remains900 packaged -180 dispatched -8 historically disposed damage =712 physical;70 reserved and642 available. These original events/reservations are not replayed when wholesale metadata is initialized. New operations append real source effects. Finished lots, valuation, warehouse controls, global availability and sales use the same projection. Fully dispatched operational lots remain accessible for source history even at zero physical balance.

With100 additional real packaged suits, combined physical is812 and available742 before new reservations. Reserving70 yields140 total reserved and672 available. Dispatch40 yields772 physical,100 total reserved and the same672 available: the consumed reservation and physical decrease happen together. A later35 produces737 physical,70 historical reserved and667 available, with25 remaining on the100-suit order. Holds/damage stay physical but unavailable.

Independent validation reconstructs dispatch effects alongside Phase 9 receipts/transfers/adjustments/quality. It checks exact multiplicity, source ownership, nonnegative balances, carton/reservation overlap, picking claims, dispatch amount prefixes, commercial totals, immutable approvals, delivery quantities and audit references. JSON import/reload uses the same strict validation. Failure returns an Urdu error and retains the original persisted state. This is localStorage consistency, not transactional server security.

Financial stages remain separate: approved order commitment, uninvoiced posted dispatch, posted invoice, allocated receipt and outstanding receivable. Original historical invoice/payment selectors remain authoritative. Operational dispatches expose `invoiceReadyDispatch`, including stable handoff/dispatch-line IDs, order/customer/line, SKU, original lot, quantity, captured rate/net amount, terms and pricing evidence. No new invoice is generated in Phase 10.

Phase 11 must consume each eligible dispatch portion at most once. Partial billing should allocate the already-frozen dispatch-line net by cumulative prefixes, enforce cumulative invoiced quantity/value bounds, and transfer exposure from unbilled shipment to posted invoice without counting both. No current rate lookup or additional stock deduction belongs in invoicing. Billing exclusions, credit notes, actual returns and cash receipts require their own explicit approved source documents; none is inferred from a delivery flag or external advance note.

Persistence keeps schema envelope1 with optional strict `wholesale.version:10`. Absence is a lossless no-write path, not a reset. Golden/expanded deterministic resets remain explicit; existing purchasing, processing, production, packaging, historical finance and separate UI preferences survive ordinary operational saves. Unknown extension versions/import corruption fail closed.
