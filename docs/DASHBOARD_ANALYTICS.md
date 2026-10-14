# Phase 3 dashboard analytics

The existing dashboard shell and design system are retained. Without the expanded extension, the Phase 2 golden dashboard remains available. With it, `BusinessDashboard.tsx` uses pure reports from `store/selectors/business.ts` and `reports.ts`. A bounded per-snapshot WeakMap cache avoids rebuilding the same filter projection. UI preference changes do not mutate domain records.

## Financial definitions

| Measure | Source / definition |
| --- | --- |
| PO commitment | Ordered meters × PO rate; a commitment, not purchase expense/payable |
| Recorded purchase | Posted GRN quantities × source PO rates |
| Supplier payable | Opening supplier balance + explicit supplier invoice snapshots; no supplier-payment model in this seed |
| Sales order value | Ordered suits × price − discount; draft/open orders are not revenue |
| Invoiced sales | Posted invoice line totals; excludes cancelled/draft orders |
| Cash collections | Posted customer payment amounts, including explicitly unapplied credit |
| Invoice outstanding | Invoice total − linked active allocations |
| Customer receivable | Opening receivable + invoice outstanding; unapplied customer credit remains separately visible |
| Current / overdue | Positive invoice balance classified against due date and fixed reporting date; due-on-reporting-day is current |
| Recorded expense | Explicit expenses + processing charges; excludes GRN purchase valuation to prevent double counting |
| Batch direct cost | Material allocation valuation + linked direct batch expenses; indirect expenses stay unallocated |
| Cost per accepted suit | Rounded batch direct cost / positive accepted output |
| Limited gross contribution | Invoice value less proportional recorded direct cost for fully completed batches only |
| Estimated cost | Seed planning value calculated from target BOM quantities, material/service rates and direct service budgets; never substituted for recorded expense/profit |

No historical net profit is claimed. Limited contribution excludes indirect overhead, full loss-cost absorption and invoices whose batch is still unfinished. Its covered sales amount is displayed. Material valuation is source PO rate plus the physically returned lot's recorded processing rate; processing loss absorption is excluded explicitly. Fabric with no production allocation remains inventory.

Opening balances are zero in the seed. Imported opening receivables have no invented due date: they are explicit opening values, excluded from current/overdue invoice buckets. Product-level outstanding is displayed proportionally to matching invoice line value, a presentation assumption rather than a payment allocation.

## Dashboard sections and charts

Financial KPIs separate invoices, cash, receivables, received purchases, recorded expenses and limited contribution. Inventory cards separate grey/processed/contractor meters from physical/reserved/available/damaged suits. Production displays target/completed/rejected/planned/in-progress suit counts and material WIP meters separately. Processing displays open/partial/late jobs, physical returns and recognized loss. Sales displays open/dispatched order counts, invoice count/average, customer sales and balances.

Charts: monthly posted purchases; monthly invoice sales; monthly cash collections; fabric-only inventory distribution; production batch states; open jobs by contractor; invoiced suits by top design; customer outstanding; collection available suits; expense categories; and an additional collection-completion chart. Existing responsive Recharts wrappers supply Urdu labels, PKR formatting, tooltip/legend and empty states. Meters and suits never share a numeric axis.

## Filter scope

| Filter | Applies to | Deliberately unaffected |
| --- | --- | --- |
| Date range | Received-purchase flows, invoice/payment flows, dated expenses, production batch cohort and activity | Current stock/WIP, fixed-date open/late job balances |
| Customer | Orders, invoiced sales, customer balances, cash | Fabric inventory, purchases, production |
| Collection / piece count | Design-linked sales, finished stock, batches; collection-linked direct expenses | Cash receipts without SKU attribution |
| Fabric | Purchase lines, fabric balances, relevant BOM/batches/SKU lines and processing | Unrelated cash receipts |
| Warehouse | Purchase destination and fabric/finished inventory | Customer cash/revenue |
| Contractor | Custody, processing jobs/returns and charges | Grey warehouse, customer receivables |

Filters are local presentation state. Apply, reset, invalid-date blocking and visible scope summary work. There is no hidden ledger write while filtering/navigation. Reconciliation and business-wide alerts explicitly remain independent of filters.

## Deterministic alerts and traceable activity

Rules: fabric grey stock below stored reorder level; issued/partial challan overdue; outstanding invoice past due; active production batch past due; recognized processing loss greater than 3% of issued meters; customer receivable at least 80% of credit limit; and any explicit unpaid supplier invoice balance. The seed has no unmatched component surplus and no invented alert is generated for it.

Alerts use actual record IDs and valid registered destinations with record preview queries. Recent GRN/issue/receipt/packaging/order/invoice/payment/completion events sort by actual business date. Unsupported operational routes retain honest module notices alongside read-only history previews. Notification drawer reuses the same alert selector.
