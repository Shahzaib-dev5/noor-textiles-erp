# Business workflows

This document defines the whole business chain. **Only goods receipt posting, processing issue and partial processing receipt are implemented as Phase 1 transactions.** The role switcher is illustrative; responsible roles below are planned responsibilities, not enforced security. Other transitions are domain contracts for later phases and must be implemented and tested before their controls are offered as working operations. Future readable states describe intended business milestones; their document-specific code enums and posting rules must be refined in those phases. Phase 1 code uses `APPROVED → POSTED` for an issue/receipt and `PARTIALLY_RECEIVED`/`COMPLETED` for parent receipt progress; there is no separate `ISSUED` literal.

## 1. Supplier registration — future Phase 2

- **Trigger:** Procurement needs to buy from a new fabric vendor.
- **Responsible role:** Procurement clerk; manager reviews activation.
- **Inputs:** Supplier ID, Urdu trading name, phone, address, payment terms and supplier contacts.
- **Validations:** Required identity/contact fields, stable contact-to-supplier reference, single company ownership and review of possible duplicate name/phone. Never merge suppliers merely because their names match.
- **Status transitions:** Draft → Active → Inactive; referenced suppliers are retained rather than deleted.
- **Inventory effect:** None.
- **Financial effect:** None on registration; any later opening balance requires an explicit ledger transaction.
- **Output document:** Supplier master and linked contact records.
- **Possible errors:** Missing contact, invalid term values, duplicate ID or deleting a referenced supplier.
- **Related modules:** Suppliers, purchasing, supplier payments and accounting.

## 2. Fabric purchasing — future Phase 4

- **Trigger:** Approved demand or replenishment requires grey fabric.
- **Responsible role:** Procurement clerk drafts; manager approves.
- **Inputs:** Supplier, one or more fabric/specification lines, original units and quantities, canonical length conversions, delivery dates and paisa unit rates.
- **Validations:** Active supplier/fabric references, positive quantities, supported units, nonnegative costs and actual lengths for roll/thaan purchases. Approval freezes commercial terms for receiving; receipts cannot exceed the remaining approved quantity.
- **Status transitions:** Draft → Approved → Partially Received → Completed; unposted Draft/Approved → Cancelled subject to reference checks.
- **Inventory effect:** None until goods receipt is posted.
- **Financial effect:** Planned commitment only; supplier invoice records the actual payable in a later accounting transaction.
- **Output document:** Purchase order with separate line records and unique document number.
- **Possible errors:** Invalid supplier, missing roll measurement, invalid rate, receipt overage or editing a completed order.
- **Related modules:** Suppliers, fabrics, purchasing, grey inventory and accounting.

## 3. Goods receiving — Phase 1 transaction implemented

- **Trigger:** Approved purchase-order fabric reaches the warehouse.
- **Responsible role:** Warehouse clerk.
- **Inputs:** Stable goods-receipt ID/number, approved PO and line references, supplier, fabric lot, warehouse/location, measured canonical meters and source-unit information.
- **Validations:** Existing compatible parent records; receiving status; positive quantity; remaining PO allowance; stable unique receipt/movement identities; lot/fabric consistency; valid grey destination. The transaction rejects a duplicate source document and invalid current state.
- **Status transitions:** The Phase 1 action posts an already Approved receipt → Posted. Draft approval is a future screen workflow. The purchase order becomes Partially Received or Completed according to cumulative posted receipts.
- **Inventory effect:** A traceable GREY receipt movement increases warehouse stock. No independently editable balance is incremented.
- **Financial effect:** Inventory quantity only in Phase 1; supplier invoice/payable and payment are distinct future documents. Receiving must not pretend the supplier was paid.
- **Output document:** Posted goods receipt, its lines and associated movement records.
- **Possible errors:** Reposting, over-receipt, incompatible lot/fabric, nonexistent order/line/location, zero/negative quantity or invalid PO status.
- **Related modules:** Purchasing, suppliers, fabrics, grey inventory and audit.

## 4. Grey inventory storage — future Phase 4

- **Trigger:** Warehouse puts received fabric away, counts it or transfers it.
- **Responsible role:** Warehouse clerk; manager approves adjustments.
- **Inputs:** Lot/roll identities, actual measured lengths, source/destination locations, count evidence and adjustment reason.
- **Validations:** Valid warehouse/category, same-unit arithmetic, availability at source, no duplicate posting and explicit approval for a count discrepancy. Roll identity does not imply a fixed length.
- **Status transitions:** Transfer/adjustment Draft → Approved → Posted; posted history requires reversal rather than deletion.
- **Inventory effect:** Transfer pairs preserve total material; approved adjustments explain a gain/loss. Current balances remain derived from movements and reservations.
- **Financial effect:** Later costing assigns value effects to approved adjustments; none is fabricated in Phase 1.
- **Output document:** Stock transfer or stock adjustment and movement history.
- **Possible errors:** Wrong location, negative availability, missing explanation, mixing meters with suit counts or changing an already-posted movement.
- **Related modules:** Grey inventory, fabrics, purchasing, processing and costing.

## 5. Processing challan issue — Phase 1 transaction implemented

- **Trigger:** Approved grey fabric is sent to a processing contractor.
- **Responsible role:** Production/processing coordinator and warehouse clerk.
- **Inputs:** Stable challan identity, contractor, processing job/service, source lot/location and one or more positive meter quantities.
- **Validations:** Valid active contractor and matching document/lot references; issuable state; sufficient unreserved GREY stock; distinct source/destination categories; no existing posting. Validation considers the total demand of all lines.
- **Status transitions:** Approved challan → Posted (physically issued); receiving later changes it to Partially Received or Completed. Draft approval is a future screen workflow.
- **Inventory effect:** Equal GREY issue and PROCESSING_OUT receipt movements transfer custody. Company fabric total is unchanged by issue.
- **Financial effect:** A processing rate is a planned service charge; invoice/charge posting is deferred and never inferred from physical custody.
- **Output document:** Processing challan, lot-linked lines and paired movement records.
- **Possible errors:** Insufficient grey stock, wrong contractor/lot, duplicate issue, invalid quantity or issue from a completed/cancelled source.
- **Related modules:** Grey inventory, contractors, processing and costing.

## 6. Partial/full processing receipt — Phase 1 partial receipt implemented

- **Trigger:** Contractor returns some or all issued fabric.
- **Responsible role:** Warehouse clerk records actual output; manager approves explicit loss.
- **Inputs:** New receipt ID/number, issued challan/line, physically received output meters, separately approved loss meters and loss reason where applicable.
- **Validations:** Positive meaningful receipt quantities, issued/open challan, cumulative output plus approved loss ≤ issued quantity, explicit loss evidence, lot identity and duplicate prevention. Quantity still held is computed, never filled by guessing that unreturned material is lost.
- **Status transitions:** Approved receipt → Posted; Posted challan → Partially Received → Completed only when held balance reaches zero. Draft approval is a future screen workflow.
- **Inventory effect:** Output removes PROCESSING_OUT and adds PROCESSED; approved loss separately removes PROCESSING_OUT and creates a loss record. Golden receipt: 380 output + 10 loss from a 400 issue leaves 10 with the contractor.
- **Financial effect:** Service charges require their own processing charge/cost records; no real accounting posting in Phase 1.
- **Output document:** Processing receipt/lines, explicit processing-loss record and traceable movements.
- **Possible errors:** Over-receipt, loss without required reason/approval, reposting, wrong challan line, zero/negative inputs or receiving an unissued/cancelled challan.
- **Related modules:** Processing, processed inventory, contractors, quality control and costing.

## 7. Design approval — future Phase 6

- **Trigger:** A seasonal design and sample are ready for commercial production.
- **Responsible role:** Designer submits; authorized demo manager approves.
- **Inputs:** Season, collection, design, color variants, sample references and versioned BOM with shirt/trouser/dupatta components.
- **Validations:** Valid parent records, positive consumption, compatible fabric width, unique component definitions and correct two-piece/three-piece composition. A two-piece design cannot silently inherit a dupatta requirement.
- **Status transitions:** Draft → Submitted/Under Review → Approved or Rejected; revision creates a reviewable version.
- **Inventory effect:** None merely from approval; physical sampling consumption requires a separate inventory transaction.
- **Financial effect:** Establishes estimated consumption for costing; sample expenses remain explicit records.
- **Output document:** Approved design/sample and BOM version.
- **Possible errors:** Missing component, invalid width, unapproved sample or changing a BOM already used by an active work order.
- **Related modules:** Collections, designs, fabrics, production, pricing and costing.

## 8. Production planning — future Phase 7

- **Trigger:** Demand and approved design justify a planned suit batch.
- **Responsible role:** Production planner; warehouse clerk allocates material.
- **Inputs:** Approved design/BOM version, target suits, due date, compatible processed lots and work-order identity.
- **Validations:** Positive integer suit quantity, approved BOM, sufficient unreserved meters by component/width, explicit allowance and no duplicate material allocation.
- **Status transitions:** Plan Draft → Approved → In Progress → Completed; work order moves through allocation and production stages. Cancellation releases only unconsumed reservations and records compensations where posted stock has moved.
- **Inventory effect:** Allocation reserves or transfers PROCESSED into PRODUCTION_WIP exactly once. Allocated material cannot remain freely available in its source warehouse.
- **Financial effect:** Accumulates material and later labor/service costs by work order; no immediate sales revenue.
- **Output document:** Production plan, work order and material allocations.
- **Possible errors:** Insufficient component fabric, stale BOM, incompatible width, negative target or allocation from held/rejected stock.
- **Related modules:** Designs, processed inventory, production, cutting and costing.

## 9. Cutting — future Phase 7

- **Trigger:** Allocated material and approved patterns are available.
- **Responsible role:** Cutting supervisor.
- **Inputs:** Work order, allocated lots, component patterns, planned/actual meters, cutting outputs and explicit wastage.
- **Validations:** Consume only allocated WIP; component output cannot exceed physically supportable quantities; report losses separately; use piece counts separately from meter lengths.
- **Status transitions:** Draft cutting order → Approved → In Progress → Completed.
- **Inventory effect:** Consumes PRODUCTION_WIP meters and creates traceable CUT_COMPONENT pieces through a tested conversion transaction. Scrap/loss remains explained.
- **Financial effect:** Transfers material cost to component/WIP costing and records cutting charges once.
- **Output document:** Cutting order, cutting-output component records and wastage evidence.
- **Possible errors:** Wrong allocation, excessive consumption, duplicate completion, missing component or unexplained material difference.
- **Related modules:** Production, cutting, embroidery, suit assembly and costing.

## 10. Embroidery — future Phase 8

- **Trigger:** The approved design requires embroidery for selected cut components; otherwise this workflow is skipped.
- **Responsible role:** Embroidery coordinator and contractor.
- **Inputs:** Component IDs/counts, work order, approved pattern, contractor/rate and expected delivery date.
- **Validations:** Eligible components, active contractor, positive counts, outbound/returned custody reconciliation and explicit rejected/lost quantities.
- **Status transitions:** Draft → Issued → Partially Received → Completed; rejection/rework remains explicit.
- **Inventory effect:** Tracks component custody and usable return; does not invent extra suits or convert length to pieces without cutting records.
- **Financial effect:** Records service charges against the relevant batch after approval.
- **Output document:** Embroidery job and receipt/quality evidence.
- **Possible errors:** Duplicate issue/receipt, return exceeding issued count, wrong design or unrecognized contractor loss.
- **Related modules:** Designs, cutting, contractors, quality control, assembly and costing.

## 11. Quality control — future Phase 8

- **Trigger:** Processed fabric, embroidery, assembled suits or returned goods require inspection.
- **Responsible role:** Quality inspector.
- **Inputs:** Referenced lot/batch/document, inspection quantity, defect records, accepted/rework/rejected/damaged quantities and disposition.
- **Validations:** Inspected quantity cannot exceed available material; dispositions reconcile to inspected total; defects and decisions refer to the correct source; inspector cannot make pending material saleable by editing a balance.
- **Status transitions:** Pending → In Progress → Passed, Failed or Rework; subsequent reinspection has its own evidence.
- **Inventory effect:** Explicit movements separate accepted, held, REJECTED and DAMAGED material. Quality hold is represented by disposition/reservation controls within the appropriate category until its later transaction is implemented.
- **Financial effect:** Approved rejection/rework costs attach to the batch; no revenue is created.
- **Output document:** Quality inspection and linked quality-defect records.
- **Possible errors:** Unreconciled dispositions, inspection beyond source quantity, missing defects or packaging without a passing inspection.
- **Related modules:** Processing, embroidery, assembly, packaging, returns and costing.

## 12. Suit matching — future Phase 8

- **Trigger:** Compatible shirt/trouser/dupatta components have passed their required checks.
- **Responsible role:** Assembly supervisor.
- **Inputs:** Work order, approved design/color variant, component outputs and two-piece/three-piece assembly requirement.
- **Validations:** Matching design/color/size where relevant, correct BOM component count, sufficient unconsumed component stock and no component consumed twice.
- **Status transitions:** Draft → In Progress → Completed, subject to quality acceptance before packaging.
- **Inventory effect:** Consumes CUT_COMPONENT pieces into traceable assembled work in progress. Assembly alone does not add saleable FINISHED_GOODS.
- **Financial effect:** Material and assembly labor accumulate in batch cost.
- **Output document:** Suit assembly record linked to consumed component outputs.
- **Possible errors:** Missing dupatta for a three-piece suit, mismatched color, inadequate components or duplicate completion.
- **Related modules:** Designs/BOM, cutting, embroidery, quality control, packaging and costing.

## 13. Packaging — future Phase 9

- **Trigger:** Completed matched suits pass final inspection.
- **Responsible role:** Packaging supervisor and warehouse clerk.
- **Inputs:** Assembly and passing inspection IDs, finished SKU, accepted suit count, packaging materials and carton information.
- **Validations:** Approved assembly/inspection chain, integer suit count, count within accepted unconsumed assemblies, correct SKU/design/color and duplicate-completion prevention. Cartons retain their recorded contents rather than an assumed universal suit count.
- **Status transitions:** Draft → Approved/In Progress → Completed/Posted.
- **Inventory effect:** Only this validated production-completion boundary creates FINISHED_GOODS suits and consumes the source WIP; rejected output stays separate.
- **Financial effect:** Final batch cost includes approved material, processing, labor, loss and packaging allocation.
- **Output document:** Packaging batch and finished-stock movements.
- **Possible errors:** Missing passed inspection, mismatched SKU, excessive output, duplicate posting or negative cost allocation.
- **Related modules:** Production, assembly, quality control, packaging, finished inventory and costing.

## 14. Wholesale ordering — future Phase 10

- **Trigger:** Customer accepts a quotation or places a wholesale order.
- **Responsible role:** Sales clerk; manager reviews credit exceptions.
- **Inputs:** Customer/credit profile, price list or approved quotation, SKU lines, suit quantities, discounts, delivery date and terms.
- **Validations:** Active customer and SKUs, positive integer suit counts, deterministic money rounding, credit policy and stock availability before reservation. Quote does not itself reserve stock.
- **Status transitions:** Quotation Draft → Sent → Accepted/Rejected/Expired; order Draft → Approved → Partially Dispatched → Completed/Cancelled under release/reversal rules.
- **Inventory effect:** Order approval/reservation reduces available finished suits without changing physical stock. The same suits cannot be reserved for two orders.
- **Financial effect:** Commercial commitment only; actual receivable is a separate posted invoice.
- **Output document:** Sales order, order lines and linked stock reservations.
- **Possible errors:** Credit block, stock shortage, invalid discount, expired price/quote or duplicate reservation.
- **Related modules:** Customers, pricing, quotations, sales, finished inventory, dispatch and invoicing.

## 15. Dispatch — future Phase 11

- **Trigger:** Approved order is ready for shipment.
- **Responsible role:** Dispatch/warehouse clerk.
- **Inputs:** Sales-order lines, SKU/location, reserved or otherwise permitted order quantities, shipment details and dispatch number.
- **Validations:** Correct order/customer, posted availability, quantity ≤ outstanding order and authorized reservation, no prior posting and valid shipment state.
- **Status transitions:** Draft → Approved → Posted/Dispatched; order becomes Partially Dispatched or Completed when eligible quantities reconcile.
- **Inventory effect:** Decreases FINISHED_GOODS and consumes corresponding reservations atomically. Dispatch never uses another customer's reserved suits.
- **Financial effect:** Cost-of-goods allocation is planned; invoice remains distinct and must not be assumed paid.
- **Output document:** Dispatch challan and lines with source-order references.
- **Possible errors:** Overshipment, reservation conflict, duplicate dispatch, wrong SKU or cancelled order.
- **Related modules:** Sales, finished inventory, dispatch, invoices and costing.

## 16. Invoicing — future Phase 11

- **Trigger:** Posted dispatch or approved billing policy authorizes a sales invoice.
- **Responsible role:** Accounts clerk.
- **Inputs:** Customer, order/dispatch references, invoice lines, delivered quantities, approved rates/discounts and due date.
- **Validations:** Invoice quantities ≤ uninvoiced eligible dispatch quantities, correct customer, safe integer paisa arithmetic, no duplicate document and immutable posted terms.
- **Status transitions:** Draft → Posted → Partially Paid → Paid; corrections use credit notes/reversals rather than deleting posted invoices.
- **Inventory effect:** None; stock already moved at dispatch.
- **Financial effect:** Increases the customer receivable through explicit customer-ledger/account transactions once.
- **Output document:** Sales invoice and line/ledger records.
- **Possible errors:** Duplicate billing, unsupported shipment, money overflow/rounding mismatch or changing a paid invoice as draft.
- **Related modules:** Dispatch, invoicing, customers, payments and accounting.

## 17. Payment receipt — future Phase 12

- **Trigger:** Customer payment is received and entered manually in the demo.
- **Responsible role:** Cashier/accounts clerk.
- **Inputs:** Customer, receipt number/date, payment method/reference, positive integer paisa amount and optional invoice allocations.
- **Validations:** Valid customer/method, allocations refer only to that customer's invoices, allocation total ≤ receipt's unallocated balance and each invoice's outstanding amount, no duplicate posting.
- **Status transitions:** Receipt Draft → Posted; allocation changes invoice Posted → Partially Paid → Paid as appropriate.
- **Inventory effect:** None.
- **Financial effect:** Cash/bank demo record and customer credit reduce outstanding only through posted ledger and allocation records. Unallocated customer credit remains visible; there is no live gateway.
- **Output document:** Payment receipt, payment allocations and customer ledger entries.
- **Possible errors:** Cross-customer allocation, overpayment allocation, zero/negative amount, duplicate receipt or allocation to a cancelled invoice.
- **Related modules:** Payments, customers, invoices, accounting and reports.

## 18. Sales returns — future Phase 13

- **Trigger:** Customer sends back previously dispatched suits.
- **Responsible role:** Returns clerk, quality inspector and accounts approver.
- **Inputs:** Original invoice/dispatch line, SKU, returned quantity, reason, inspection and saleable/inspection-hold/rejected/damaged disposition.
- **Validations:** Customer/source match, cumulative returned quantity ≤ net dispatched quantity, integer counts, explicit disposition, inspection evidence and duplicate-posting protection.
- **Status transitions:** Draft → Received/Inspection Pending → Approved → Posted; rejected claims remain recorded.
- **Inventory effect:** Returns enter their approved disposition location/category. Pending/rejected/damaged suits must not become available saleable inventory automatically.
- **Financial effect:** An approved credit note references the original invoice and separate customer-ledger adjustment. A return does not imply a cash refund.
- **Output document:** Customer return, inspection, disposition movements and credit note where authorized.
- **Possible errors:** Return exceeds sale, wrong customer/SKU, missing inspection, duplicate credit or restocking damaged items as saleable.
- **Related modules:** Returns, quality control, finished inventory, invoices, accounting and costing.

## 19. Batch costing — future Phase 13

- **Trigger:** A production batch is planned for estimate or completed for actual costing.
- **Responsible role:** Cost accountant/manager.
- **Inputs:** Lot purchase costs, processing charges/losses, material allocations, cutting/embroidery/labor, packaging, expenses, allocation basis and good output suits.
- **Validations:** Costs are nonnegative safe integer paisa, source expenses are not double allocated, allocation totals reconcile, good output is positive before division and proposed rounding is deterministic.
- **Status transitions:** Draft estimate → Reviewed; actual costing Draft → Approved → Posted/Locked with explicit adjustment versions.
- **Inventory effect:** No unexplained physical quantity change; cost valuation references already-posted movement/output history.
- **Financial effect:** Allocates costs to batch/SKUs, records rounding remainder explicitly and derives unit cost/margin without pretending this is production financial accounting.
- **Output document:** Cost-allocation records and batch cost statement.
- **Possible errors:** Zero output division, duplicate expense allocation, missing source cost, negative rate or lost paisa remainder.
- **Related modules:** Purchasing, processing, production, expenses, costing, pricing and accounting.

## 20. Reporting — future Phase 14; foundation summaries available in Phase 1

- **Trigger:** User opens a summary or requests reconciliation over a date/module scope.
- **Responsible role:** Manager/accounts/warehouse role according to report purpose.
- **Inputs:** Current validated snapshot, date interval, source-document filters and report type.
- **Validations:** Valid date range and referentially valid data; derive totals from posted records only; apply the same unit/category and money conventions as transactions. Reports must identify historical demo records.
- **Status transitions:** Reports are read-only projections, with no posting transition. Export is a snapshot, not a live connection.
- **Inventory effect:** None. The Phase 1 dashboard/inspector derive grey, processed, contractor-held and explicit loss totals from the actual state.
- **Financial effect:** None. Later receivable/payable reports aggregate ledger entries and allocations without editing them.
- **Output document:** Rendered report or explicit export artifact; Phase 1 supplies reconciliation and JSON demo export.
- **Possible errors:** Invalid filter range, inconsistent imported references, combining incompatible units or counting both sides of a transfer as new stock.
- **Related modules:** All ERP modules, reports, dashboard and audit.

## Phase 6 outsourced processing

Maintain contractor and valid service rate, create a multi-input job with agreed rate snapshot, approve, issue eligible warehouse fabric, receive partial physical outputs/QC categories, approve explicit loss, and reconcile custody. Accepted output can feed a later processing stage while preserving original GRN lineage. Settle a completed job with an explicit contractor bill and allocated payment. See [workflow](PROCESSING_WORKFLOW.md), [color batches](DYEING_AND_COLOR_BATCHES.md), [custody and ledger](CONTRACTOR_CUSTODY_AND_LEDGER.md), [costing](PROCESSING_COSTING.md) and [actual acceptance evidence](PHASE_6_ACCEPTANCE.md).

## Phase 7 product definition and design planning

Create a seasonal collection and core design, approve color variants, draft/submit/approve a component BOM per variant, request a prototype, review its eight checks, revise/resubmit as needed, enter cost assumptions, inspect matching processed material, approve the design and explicitly mark it ready. Owners and production demo profiles execute validated commands. All changes pass the existing full-state and storage boundary.

Each approved revision is immutable; later revisions retain history and require new revision-specific sample approval. Design duplication creates new IDs/codes and draft BOMs without copied approvals or production. Availability reads current eligible inventory with independent component wastage and non-reused preview capacity. Costs and margins are estimates. Every action in this phase is stock-neutral and creates no actual financial posting. Historical design/production records remain unchanged. See [workflow diagram](DESIGN_STUDIO_WORKFLOW.md), [sampling](DESIGN_SAMPLING_AND_APPROVAL.md) and [costing/availability](DESIGN_COSTING_AND_AVAILABILITY.md).

## Phase 8: production execution

Approved design/BOM -> approved plan -> frozen work order -> explicit reservation -> material issue -> cutting -> components -> embroidery/partial receipts -> QC/rework -> accepted component readiness and closure. Every physical action posts once with source references. Actual contractor bills and payment allocation reuse existing accounts. See the [complete diagram](PRODUCTION_PLANNING_WORKFLOW.md).

## Phase 9 - accepted components to available wholesale stock

1. Open `/assembly/components` to inspect actual Phase 8 accepted component lots and compatibility. Create and approve a matching plan linked to the original work order and frozen BOM.
2. Reserve exact lots, approve/post issues, record shortages or mismatches and match only complete available requirements. Return unused WIP and release unused reservations explicitly.
3. Inspect matched sets into exclusive accepted/hold/rejected/rework states. Rework consumes actual replacements where needed, records costs and requires a fresh inspection without adding output sets.
4. Record counted material openings/receipts, configure the packaging recipe and create a compatible stable SKU. Approve an order against accepted sets and allocate its materials.
5. Post partial or final completion to consume sets/materials and create exactly one finished receipt/lot per session. Print actual SKU/batch Code128 labels and care/specification details.
6. Put away finished lots, pack itemized cartons, transfer loose stock or whole cartons, quarantine damaged stock and post approved stale-safe counts. Use warehouse, cost and seventeen report views for reconciliation, CSV and A4.

[Suit matching diagram](SUIT_MATCHING_WORKFLOW.md) connects the modules. [Packaging](PACKAGING_WORKFLOW.md), [set QC](FINAL_SUIT_QUALITY_CONTROL.md) and [finished ledger](FINISHED_GOODS_LEDGER.md) document states and exceptions. Wholesale customer orders, dispatch reservation ownership and invoicing remain Phase 10 handoff work.

## Phase 10 wholesale customer to invoice-ready dispatch

1. Create/review a shared customer, primary group and recorded credit/discount policy. Existing historical invoices and allocated payments remain authoritative.
2. Activate an effective SKU/design/collection price list with non-overlapping whole-suit tiers. Enter a multi-SKU quotation or direct draft order; manual rates/discounts require explicit evidence and later owner approval.
3. Submit/approve a quotation, mark presented/accepted and convert it once. Submit the draft order; owner approval freezes terms and checks exposure. Exceptions must be explicitly recorded, bounded, unexpired and selected.
4. Reserve actual eligible finished lots or a complete itemized carton for that order line. Allow partial booking only by recorded order policy; display shortages.
5. Assign/start picking and confirm actual partial/full quantities with unique references. Picking is stock-neutral. Create/ready/approve a dispatch against those owned confirmations.
6. Post dispatch once to consume reservations and physical suits together. Track manual logistics, cumulative receipt, discrepancy or sender-return evidence. No extra stock, invoice or cash event follows a delivery flag.
7. Carry immutable invoice-ready quantities/values to Phase11. Apply controlled cancellation/amendment to remaining order quantities rather than reversing posted shipment by editing status.

[Complete workflow diagram](QUOTATION_AND_SALES_ORDER_WORKFLOW.md), [credit policy](CUSTOMER_CREDIT_CONTROL.md), [dispatch/delivery](DISPATCH_AND_DELIVERY_WORKFLOW.md) and [equations/handoff](SALES_RECONCILIATION.md) supersede the earlier proposed wholesale/dispatch phase labels. Invoicing remains Phase11; actual receipts/returns remain their later authorized workflows.
