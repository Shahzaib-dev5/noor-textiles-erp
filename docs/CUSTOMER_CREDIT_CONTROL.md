# Customer credit control

Credit uses existing `selectInvoiceBalances` and original payment allocations; it creates no second customer ledger. Shared invoice balances are cached per immutable snapshot before customer projections. Opening balance is the original core customer field, not another copied debit.

```text
Exposure = posted outstanding receivable
         + uninvoiced posted dispatch value
         + remaining approved order commitment

Headroom = credit limit - exposure
Displayed available credit = max(0, headroom)
Displayed excess = max(0, -headroom)
```

Historical orders/dispatches/invoice lines are included once from their original sources. Operational drafts/submissions do not commit credit. Approval adds the order commitment. Dispatch shifts that same quantity's frozen net amount from remaining commitment to unbilled exposure; it does not add the full order value again. Cancellation removes only the undispatched cancelled value. Dispatch remains unbilled in Phase 10: no invoice or payment operation is exposed.

Example: limitPKR500000, posted outstanding200000, uninvoiced dispatch50000, remaining approved commitment100000 gives headroom150000. A customer with eligible existing exposure350000 cannot approve an additional200000 under the same500000 limit without a valid explicit exception.

The simulated owner approves orders. Credit holds and insufficient headroom block ordinary approval. Exceptions have one order, ORDER or DISPATCH scope, reason, maximum total exposure, expiry, approving actor and audit event. They are not automatically selected; the operator explicitly chooses the recorded exception. Approval evidence freezes the policy/exposure/actor/time. Dispatch approval and posting recheck the current profile, exposure and exception validity, so a later hold or expired exception cannot silently authorize shipment.

COD remains conservatively exposed until a real later invoice/settlement workflow resolves it; selecting COD is not proof of collection. ADVANCE additionally requires an explicit owner exception with external-evidence reference. That reference is a simulated policy decision, not a payment receipt, account credit or assertion that cash was collected. Phase 11/12 should replace this demonstration boundary with genuine billing/receipt allocation contracts.

Profile pages separate overdue invoice balance, allocated payments and unallocated original cash receipts. A sender-return or delivery discrepancy alone neither reduces receivables/unbilled exposure nor restores saleable goods. Reviewed returns and credit notes belong to their later authorized workflows. Role selection is a frontend simulation, not database-grade authorization.
