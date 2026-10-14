# Purchasing workflow — Phase 4

The single-company frontend uses the existing normalized Zustand business state. Supplier and fabric creation creates no physical inventory. All mutations enter `executeProcurement` through the existing store transaction commit; views never maintain disconnected business arrays.

## Document lifecycle

- Request: DRAFT → SUBMITTED → APPROVED or REJECTED. Approved requests convert once to a linked PO. Draft requests may be edited; draft/submitted/approved requests may be cancelled.
- PO: DRAFT → APPROVED → PARTIALLY_RECEIVED → COMPLETED. Only USER drafts may be edited. Unreceived USER orders may be cancelled. Partial or complete USER orders may be explicitly closed; closing prevents further receipt. Supplier confirmation is an audit event. Approved quantities and prices are immutable; create a separate order for additional requirements.
- GRN: DRAFT → POSTED or CANCELLED. Only operational drafts are editable. Accepted measured rolls produce lots, roll references and receipt lines in the draft, but no stock movements. Posting revalidates the approved PO and remaining quantity, then commits receipt, inventory movements, PO status and audit together. Rejected/quarantined rolls remain inspection evidence; resolving their physical return never creates owned inventory.
- Bill: DRAFT → POSTED or CANCELLED. Bill one or several posted, same-supplier GRNs at their retained unbilled accepted quantity. A receipt already covered by a noncancelled bill is excluded. This phase does not support partial quantity billing. Header discounts and additional charges are explicit; tax is explicitly zero in this demo.
- Payment: DRAFT → POSTED or CANCELLED. Positive cash/bank/cheque payments may allocate across posted same-supplier bills. Allocation cannot exceed the current outstanding or payment amount. Excess cash remains an unapplied supplier advance. Posted payments are immutable; advance reallocation/refund and payment reversal are not implemented.
- Return: DRAFT → APPROVED → POSTED, or CANCELLED before posting. Posting removes only available grey material and creates a source-linked compensating movement; it never deletes the GRN. Source-bill goods credit excludes additional charges and honors discounts. Unbilled returns create no invented credit and reduce the quantity subsequently billed.

## Masters and history

Supplier codes and fabric codes are unique. Deactivation preserves referenced records. Used fabric name, composition and width are protected; purchase rates and descriptive defaults may change without rewriting prior PO prices. Opening supplier payable cannot change once financial history exists. Inactive suppliers may still have existing bills settled.

Historical records are selected by `origin: SEED`, never document prefixes. Seed POs, receipts and supplier invoice snapshots remain read-only. Eligible remaining historical PO quantities may receive a new USER GRN. Historical available grey lots may be returned only within their movement-derived remaining quantity; unspecified historical processing/return roll custody prevents individual-roll claims.

## Persistence and permissions

The schema-1 storage envelope and original history version 3 remain valid. Optional `procurement.version: 4` adds normalized profiles, requests, terms, inspection, bills, allocations, returns and audits only when a command creates them. No initialization migration rewrites or re-posts historical records; existing preferences remain in their separate key.

Commands validate input and the resulting state, copy the current state, and persist one complete snapshot. The existing write-failure and stale-tab guards preserve the previous snapshot on failure. This is a single-browser demonstration, not database-grade concurrency, secure permissions or tamper-proof accounting. The UI role restricts commands for demonstration only; the actor is the current active demo employee.

The main dashboard, purchasing dashboard, reports, notifications and global search derive from the same source records. PO commitments, receipt valuation, posted liabilities, allocated cash and advances remain distinct metrics. Phase 5 may extend processing operations and grey warehouse custody without rewriting these posting events.
