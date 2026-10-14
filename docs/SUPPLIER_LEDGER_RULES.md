# Supplier ledger rules

Amounts are integer paisa; forms accept at most two rupee decimals. Rates are PKR per canonical meter. Proportional discounts and return credits use deterministic cumulative rounding so split quantities reconcile with source document values.

The ledger uses the company's payable perspective: **credit increases payable; debit reduces payable**.

`balance = opening payable + posted bills − allocated posted payments − posted return credits`

Draft POs, accepted-but-unbilled receipts, draft bills/payments, and approved-but-unposted returns do not increase or reduce payable. Return approval authorizes the subsequent posting; its financial credit becomes effective with the posted compensating stock transaction.

Opening payable appears as a credit event. Posted bills are credits. Allocated portions of posted payments and posted goods returns are debits. Entries link to their source documents and include date, reference, status and running balance. Date filtering preserves the full-history running balance and displays the carried balance before the selected range. CSV and A4 statement use the same projected entries.

`outstanding payable = max(balance, 0)`

`recoverable supplier credit = max(−balance, 0)`

`unapplied advance = total posted payment cash − total posted allocations`

Advances remain explicit and separate from bill allocations. A paid bill subsequently returned may produce recoverable supplier credit; that amount is not silently erased by flooring outstanding to zero. Each bill separately reports outstanding and recoverable credit. No payment may be allocated beyond its bill's current outstanding, even when other bills have credit balances.

Example: 400 m × Rs.250 produces a Rs.100,000 posted bill. Rs.31,000 cash with Rs.30,000 allocated leaves Rs.70,000 payable and Rs.1,000 advance. A posted return of 50 m creates Rs.12,500 goods credit and Rs.57,500 remaining payable. PO accepted receipts remain 400 m; a return does not reopen the original PO.

Historical supplier invoice snapshots join operational posted bills without reposting. The original customer payment/receivable history remains separate. Charges are not credited as goods returns; zero tax is an explicit demo policy, not an inferred legal rate. These records are not a statutory general ledger or real payment gateway.
