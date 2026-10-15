# Contractor custody and financial ledger

Material and money answer different questions and remain separate.

## Material

`/processing/custody` and the existing `/inventory/contractor-custody` derive custody from posted core challan/receipt/loss records. Draft/cancelled documents contribute nothing. The unchanged expanded historical seed is 37,400 m issued − 31,404 m returned − 495 m loss = **5,501 m held**. New operational documents add to live totals without rewriting this history.

Each challan has its contractor, source lot, roll identity when known, issue, physical returns, loss and expected return. Processing reports filter by contractor/service/fabric/status/date and export or print. Date filters select document cohorts, not a reconstructed past closing stock.

## Money

`/contractors/:id/ledger` shows operational posted contractor bills and allocated payments. **Credit increases payable; debit reduces payable.** The running balance carries entries before a selected start date; service filtering gives that service's ledger subset.

```text
Payable = posted bill totals − allocated posted payments
Bill total = agreed service charge + additions − discount − explicit credit
Advance = posted payment cash − allocations
```

There is no invented operational opening payable: pre-Phase-6 historical processing charges remain snapshots, not newly posted bills. Bills have due dates and link to completed jobs/challans. Bills display POSTED, PARTIALLY_PAID or PAID from their actual allocations; the immutable posting state stays POSTED. Payments can allocate across several posted bills from the same contractor. Invalid allocations, duplicate bill IDs and overpayment allocations cannot post. Unallocated cash appears as an advance, separate from liability settlement.

Supplier purchase bills/payments remain in their original Phase 4 ledger. Contractor financial activity never changes supplier balances. Posted transactions are immutable; later advance allocation, payment reversal and standalone credit-note/refund workflows are outside this phase.
