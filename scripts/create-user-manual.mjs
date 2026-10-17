import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.NOOR_BASE_URL ?? 'http://127.0.0.1:5173';
const outputPath = 'docs\\Noor_Textiles_ERP_User_Manual.pdf';
const viewport = { width: 1600, height: 900 };

const groupNames = {
  'مرکزی نظام': 'Central workspace',
  'خریداری اور کپڑا': 'Purchasing & fabric',
  پروسیسنگ: 'Processing',
  پیداوار: 'Manufacturing',
  'ہول سیل': 'Wholesale',
  حسابات: 'Accounts',
  انتظام: 'Administration',
};

const workflowChapters = [
  {
    title: 'One connected journey: supplier to finished goods',
    subtitle: 'Follow source documents in order. Each arrow means the next step uses the previous step’s approved source record.',
    sections: [
      ['1 · Set up', 'Create/select the supplier and fabric master. These identify who sells the cloth and what material is being purchased; neither creates stock.'],
      ['2 · Request & order', 'An internal purchase request is optional. Create a purchase order (PO) with supplier, fabric lines, units, quantities, rates, delivery date and terms. Submit/approve it before receiving.'],
      ['3 · Receive & inspect', 'At delivery, create a goods receipt (GRN) against the approved PO. Enter actual roll measurements and inspection results. Post accepted quantities to create traceable lots and rolls.'],
      ['4 · Record supplier finance', 'Create a supplier bill from posted GRNs, then allocate a supplier payment to posted bills. Physical receiving and supplier liability are separate postings.'],
      ['5 · Store & process', 'Put accepted fabric away into a storage bin. Reserve/issue eligible quantities to an approved processing or production job; record actual service return, inspection and cost.'],
      ['6 · Manufacture & sell', 'Approved design/BOM → production work order → cutting/components → embroidery/QC → matching → packaging → finished-goods lot. Wholesale order, dispatch, invoice and customer receipt are planned screens, not operational sales transactions yet.'],
    ],
  },
  {
    title: 'Purchase forms: prepare supplier, request and PO',
    subtitle: 'The purchase-order form is the central buying commitment. Complete its header and each fabric line before approval.',
    sections: [
      ['Supplier master', 'Use the supplier form for the supplier’s code/name, contact details, city, payment terms, opening payable and credit limit where those fields are shown. Confirm the supplier is active before selecting it.'],
      ['Fabric master', 'Use the fabric form for a stable code/name, composition, category, width, GSM/grade and purchasing defaults. Check that the unit and fabric specification match the material being ordered.'],
      ['Purchase request (optional)', 'Fill request date, requester, department, fabric, requested quantity/unit, needed date, reason and priority. Submit for review. An approved request can be converted to a linked order; it does not add inventory.'],
      ['Purchase order header', 'Select supplier, order date, expected receipt date, receiving grey warehouse and payment-term days. Add notes only when they explain the commitment.'],
      ['Purchase order lines', 'For each fabric line select the fabric; enter ordered quantity and unit, per-meter rate and explicit line discount. For roll/thaan packaging, enter the individual expected measurements when requested. Arithmetic example only: 1,000 m × PKR 250/m = PKR 250,000 before discount. Use the supplier’s agreed quantity and rate, not this example.'],
      ['Approve the order', 'Save the draft, inspect supplier and quantities, then submit/approve using the available actions. An approved quantity or rate is not casually edited; create a separate order for a changed commitment. A PO alone is neither stock nor a bill.'],
    ],
  },
  {
    title: 'Receiving and supplier settlement forms',
    subtitle: 'Record what physically arrived first; use the supplier invoice and payment forms only for their separate financial events.',
    sections: [
      ['Goods receipt (GRN)', 'Select the approved purchase order, receipt date, receiving warehouse, receiver and supplier challan reference. Add the delivered rolls against PO lines: roll number, actual measurement, measurement/packing unit, width, grade and inspection decision. Record transport reference or notes if relevant.'],
      ['Check before posting', 'Compare each actual roll measurement with the delivery and remaining PO allowance. Keep rejected/quarantined goods as inspection evidence; they must not be counted as accepted owned stock. Post the GRN only after review. Accepted posted measurements create the traceable lot/roll stock.'],
      ['Supplier bill', 'Select the supplier and eligible posted GRNs. Fill the supplier invoice reference, bill date, payment due date, explicit discount and additional charges. Confirm the receipt sources and amount; tax is explicitly zero in this demo. Post once to recognize the supplier payable.'],
      ['Supplier payment', 'Select the supplier, enter payment date, positive amount, cash/bank/cheque method, reference and notes. Allocate only to posted bills for that supplier and within the outstanding balance. Post the payment. Any eligible excess is an unapplied advance; no money is transmitted by this demo.'],
      ['Purchase return (when needed)', 'Select eligible available stock, enter the return quantity/reason and link the source evidence. Complete approval and posting. A return reduces owned stock; only an eligible return linked to billed goods creates a supplier credit.'],
    ],
  },
  {
    title: 'From warehouse fabric to a production job',
    subtitle: 'Trace the material identity and measurement through every handoff. A reservation is not a physical movement.',
    sections: [
      ['Putaway & location', 'Select accepted source roll portions, the receiving/staging location and a compatible destination bin. Posting putaway changes location, not total owned meters.'],
      ['Reserve & issue', 'Choose the exact eligible lot/roll, source location, quantity, purpose and linked job/order. Reservations protect availability. Post the supported issue to move material into processing/production custody. Never issue more than the available unreserved balance.'],
      ['Processing job form', 'Choose the contractor, service/process, service rate and basis, issue quantity, expected return/date, color/design specifications and notes requested by the form. Record challan issues and returned quantities separately; partial returns and approved loss require source-linked evidence.'],
      ['Design & BOM', 'Create a collection and design, select suit type/season and colors, then prepare a revisioned BOM. Enter each component fabric, source/specification, per-suit requirement, waste allowance and rate. Submit the sample/BOM for required approval before production planning.'],
      ['Production plan & work order', 'Select the approved design, collection, variant/color and approved BOM revision; enter target suits, plan dates, priority and responsible planner. Approve the plan and create/approve its work order. Reserve then issue materials against the work order.'],
    ],
  },
  {
    title: 'From production to packaged finished stock',
    subtitle: 'Meters become individually counted components and suits only through the explicit manufacturing records.',
    sections: [
      ['Cutting & embroidery', 'For a cutting result, select the source work order/material issue, enter input and consumed meters, output component count and component unit. Issue specific lots to embroidery when required; record partial physical returns, inspection results and only explicitly approved loss.'],
      ['Production quality', 'Select the source component lot and record inspected, accepted, held, rejected and rework quantities so the totals reconcile. Record corrections and reinspect through the supported QC/rework actions.'],
      ['Matching & assembly', 'Create a plan from the production work order and target sets. Reserve compatible accepted component lots, then record the actual matched set count. Missing pieces remain incomplete WIP; do not claim a complete suit from partial pieces. Complete final inspection and rework as needed.'],
      ['Packaging materials', 'Maintain packaging-material masters, record counted receipts and allocate actual required quantities to the packaging order. Verify available material before completion; packaging inputs are counted units, not fabric meters.'],
      ['Packaging order & finished lot', 'Select the matched batch, compatible sellable SKU/product identity and approved set quantity. Enter packaging method/team/dates and actual labor/overhead; confirm the recipe and allocated materials. Complete/post the accepted quantity to create the finished-goods receipt/lot.'],
      ['Stock identity', 'Review the stable SKU/barcode, actual packaging batch, carton membership, finished lot, location, reservations and quality status. Cartons are containers for already packaged suits, not additional inventory.'],
    ],
  },
  {
    title: 'Selling handoff: what happens next, and what is not live',
    subtitle: 'Finished stock is real in the current demo; the wholesale transaction chain is not yet implemented.',
    sections: [
      ['Current final operational step', 'Finished-goods inventory can show packaged lots, SKU/barcode, locations, availability, quality holds and movements. Confirm the required quantity is available and not damaged, held or already reserved.'],
      ['Planned customer & pricing setup', 'The customer, wholesale price-list and quotation destinations are roadmap placeholders. In a future sales form the user would choose customer, ship/bill details, items/SKU, unit price, discount, terms and expiry, then issue a quotation. No live quotation is recorded today.'],
      ['Planned sales order', 'A future order should reference an accepted quotation/customer, requested finished SKUs and quantities, agreed prices, delivery date and credit checks. The intended workflow would reserve eligible finished lots against that order. The current sales route is under construction: it creates no order or reservation.'],
      ['Planned dispatch & invoice', 'A future dispatch form should select the order, reserved source lots, picked quantity, delivery/carrier details and handover evidence. Invoicing should use the source order/dispatch and approved price/charges. Current dispatch and invoice pages are placeholders and move no stock or create no receivable.'],
      ['Planned customer receipt & returns', 'A future receipt form should identify the customer, date, amount/method/reference and invoice allocations; a future return should cite the original dispatch/invoice and inspection disposition. Current customer-payment and return routes do not post these transactions.'],
      ['End-to-end truth', 'The demo currently supports purchasing → warehouse → processing/design/production → packaging → finished inventory. It stops before operational wholesale selling. Do not represent the planned sales screens as a completed purchase-to-cash system.'],
    ],
  },
];

const moduleInfo = {
  '/dashboard': ['Dashboard', 'A company overview of current stock, activity, alerts and available business analytics.', 'Start here to review the overall picture. Open a relevant card, alert or source record to investigate the underlying activity.', 'Figures are projections of the records in this browser’s demo dataset; they are not a separate accounting ledger.'],
  '/company': ['Company profile', 'The planned home for the company’s identity and operating details.', 'Use it to review or maintain company profile information when this module is implemented.', 'This screen is a roadmap placeholder; company-profile editing is not currently available.'],
  '/suppliers': ['Suppliers', 'A directory of fabric vendors and their business terms.', 'Maintain supplier contact and status details, then use a supplier on purchase orders and review the supplier ledger.', 'Creating or editing a supplier master does not receive stock or post a bill.'],
  '/fabrics': ['Fabric catalogue', 'The master catalogue describing the fabrics Noor Textiles buys and uses.', 'Maintain a fabric’s identity and specifications before selecting it on a request, order or receipt.', 'A fabric master is not a received lot and does not create inventory.'],
  '/purchases': ['Purchase orders', 'The order register and purchasing overview for supplier commitments.', 'Create a draft order with supplier, fabric, quantity and rate; review and approve it before receiving goods.', 'An order is a commitment, not stock or a supplier payable. The detailed purchase lifecycle is implemented.'],
  '/purchases/requests': ['Purchase requests', 'Internal requests that record the need for fabric before an order is made.', 'Enter the requested material, quantity, need date and reason; submit it for the available review/approval workflow.', 'A request records demand; it does not increase inventory.'],
  '/purchases/receipts': ['Goods receipts (GRN)', 'The receiving register for fabric physically delivered against purchase orders.', 'Record actual rolls and measured quantities, complete receiving checks and post accepted goods.', 'A posted accepted receipt creates lot/roll inventory. Drafts do not change stock.'],
  '/purchases/bills': ['Supplier bills', 'The register of supplier invoices that become posted liabilities.', 'Select the supporting receipt records, enter the supplier’s invoice details and post the bill.', 'A bill is separate from a goods receipt; receipt alone does not post a payable.'],
  '/purchases/payments': ['Supplier payments', 'The register for recording demonstration payments to suppliers.', 'Create a payment, allocate it to the relevant supplier liability and post it.', 'Payments are local demonstration records only; no money is transmitted.'],
  '/purchases/returns': ['Purchase returns', 'The workflow for returning eligible received fabric to a supplier.', 'Choose eligible stock, record the return and complete the required review and posting steps.', 'Posting reduces eligible inventory; a return linked to billed goods can affect the supplier balance.'],
  '/purchases/reports': ['Purchasing reports', 'A read-only view of purchasing activity, supplier balances and reconciliations.', 'Choose the report and available filters, then inspect or export the resulting records.', 'Reports summarize source documents; correct a discrepancy in its originating transaction.'],
  '/inventory/grey': ['Grey-fabric warehouse', 'A live overview of owned grey fabric, availability, quality, custody and valuation.', 'Use the overview to identify stock and drill into lots, rolls, locations and warehouse actions.', 'Physical stock, reserved stock and quality-held stock are different quantities.'],
  '/inventory/locations': ['Warehouse locations', 'The location hierarchy for receiving, staging, storage and quality areas.', 'Create and maintain active locations, then select them on receiving, putaway and transfer documents.', 'Creating or changing a location does not create or move stock.'],
  '/inventory/transfers': ['Internal transfers', 'Controlled movement of eligible material between warehouse locations.', 'Choose the exact source stock and destination, then submit, approve and post the transfer.', 'A posted transfer moves stock between locations; it does not change total company quantity.'],
  '/inventory/reservations': ['Stock reservations', 'Reservations protect eligible fabric for a named operational requirement.', 'Select the source lot/location, quantity and purpose; later release or consume it through a supported linked issue.', 'A reservation reduces availability but does not move physical stock.'],
  '/inventory/stocktakes': ['Stocktakes', 'Physical counts compared with a saved warehouse-stock snapshot.', 'Record the physical count and notes, submit for review and post approved variances.', 'Saving a count alone does not change inventory; posting an approved variance does.'],
  '/contractors': ['Processing contractors', 'Contractor directory and custody-related information for external manufacturing partners.', 'Review active contractors and their supported service/custody information; follow linked jobs or ledger records where shown.', 'Contractor, job, challan, receipt and ledger operations are implemented in the processing area.'],
  '/processing/challans': ['Processing challans', 'The route for material issued to or received back from external processing.', 'Track source material, contractor and the linked issue/return document where available.', 'Use processing jobs for the operational service workflow; inventory changes only on valid posted movements.'],
  '/processing/jobs': ['Processing jobs', 'Jobs describing textile services such as dyeing, printing or embroidery work.', 'Review a job’s service, contractor, status and linked material/cost records.', 'Service estimates are distinct from posted processing bills and stock movements.'],
  '/designs': ['Design studio', 'The catalogue and workflow for approved textile suit designs and their production definition.', 'Open a design to review colors, bill of materials (BOM), sampling, approval and readiness information.', 'An approved design/BOM supplies controlled production inputs; it is not finished stock.'],
  '/embroidery': ['Embroidery', 'The production route for embroidery jobs and contractor-held component lots.', 'Review issued lots, partial physical returns, inspection outcomes and any approved loss disposition.', 'Physical rejected returns are not contractor loss; custody clears only when returned or explicitly disposed.'],
  '/quality-control': ['Quality control', 'Inspection and disposition of production or returned items.', 'Review the source lot, inspection counts and accepted, held, rejected or rework quantities before posting a decision.', 'Inspection outcomes must reconcile to the inspected quantity and authorized workflow.'],
  '/production': ['Production planning & work orders', 'Plans and work orders that translate an approved design and BOM into factory work.', 'Create a plan from approved inputs, obtain the required approvals and follow its resulting work order.', 'Material reservations and issues are source-linked; a plan alone does not consume stock.'],
  '/cutting': ['Cutting & components', 'The process that converts issued fabric into count-based component lots.', 'Record the source work order/issue, material use and produced component count; route results through inspection.', 'Meters and component counts are separate units and must not be converted implicitly.'],
  '/suit-assembly': ['Suit matching & assembly', 'The matching workflow that combines accepted components into suit sets.', 'Select compatible, accepted component lots for the production order and record assembly/QC outcomes.', 'A complete set requires the correct pieces and accepted quantities; it is not yet packaged inventory.'],
  '/packaging': ['Packaging', 'The process that packs accepted, matched finished suits into tracked finished-goods lots/cartons.', 'Select eligible completed suits, record counted packaging materials and create the supported package/carton records.', 'Packaging is a counted, source-linked transaction; carton membership itself does not create stock.'],
  '/inventory/finished': ['Finished-goods inventory', 'The stock view for finished, packaged suits, lots, locations and identifiers.', 'Review eligible quantities, SKU/barcode and carton/location details before downstream wholesale activity.', 'Availability excludes held, damaged and reserved stock; sales and dispatch modules are planned.'],
  '/customers': ['Wholesale customers', 'The planned customer master for the wholesale lifecycle.', 'When available, maintain customer identity and commercial terms before preparing quotations or orders.', 'This is currently a roadmap placeholder; customer maintenance is not available.'],
  '/pricing': ['Wholesale pricing', 'The planned price-list and customer pricing area.', 'Use it to define approved wholesale prices before quoting or accepting orders once implemented.', 'This screen is a roadmap placeholder; it does not set live selling prices.'],
  '/sales/orders': ['Wholesale sales orders', 'The planned order register for customer demand and finished-goods reservations.', 'Once implemented, create an order from an approved customer/pricing context and review reserved availability.', 'This screen is a roadmap placeholder; orders do not currently reserve stock.'],
  '/dispatch': ['Dispatch', 'The planned workflow for picking and shipping goods against approved wholesale orders.', 'When implemented, dispatch should consume the order’s reserved, eligible finished lots.', 'This screen is a roadmap placeholder; no stock is dispatched here.'],
  '/invoices': ['Customer invoices', 'The planned customer billing register linked to wholesale sales and dispatch.', 'When implemented, create and review invoices from supported sales documents.', 'This screen is a roadmap placeholder; it does not create a receivable.'],
  '/payments': ['Customer receipts', 'The planned workflow for recording and allocating customer receipts.', 'When implemented, apply a receipt to the correct customer invoice or balance.', 'This screen is a roadmap placeholder; no cash receipt is posted here.'],
  '/expenses': ['Expenses', 'The planned register for operating and production expenses.', 'When implemented, record source, date, amount and category for review and costing.', 'This screen is a roadmap placeholder; it does not post accounting entries.'],
  '/costing': ['Batch costing', 'The planned view for connecting material and service costs to manufactured batches.', 'Use it to understand product cost only after supported source cost records are connected.', 'This screen is a roadmap placeholder; estimates and actual costs must not be confused.'],
  '/accounting': ['Accounts', 'The planned accounting overview for financial records and balances.', 'When implemented, use it to review posted supplier/customer balances and supported cash activity.', 'This screen is a roadmap placeholder, not a general ledger or production accounting system.'],
  '/returns': ['Wholesale returns', 'The planned inspection and disposition workflow for goods returned by customers.', 'When implemented, link each return to its original dispatch/invoice and record an approved disposition.', 'This screen is a roadmap placeholder; customer returns do not currently affect stock.'],
  '/reports': ['Business reports', 'The planned cross-module reporting and reconciliation area.', 'When available, select a report, scope and period, then trace any exception to its source record.', 'This screen is a roadmap placeholder; available purchasing/warehouse/production reports remain in their own modules.'],
  '/notifications': ['Notifications', 'A central area for reminders and records that need attention.', 'Review each alert and follow its source link to the responsible transaction.', 'Notifications should guide review, not replace validation or approval.'],
  '/audit': ['Activity history', 'The planned cross-module activity and audit-history view.', 'When implemented, filter events and open the linked record to understand who did what and when.', 'This screen is a roadmap placeholder; do not treat it as a secure compliance audit log.'],
  '/staff': ['Staff', 'The planned directory for company staff and operational assignments.', 'When available, maintain staff details and role assignments used in business processes.', 'This screen is a roadmap placeholder; demo role selection is not authentication.'],
  '/settings': ['Settings & saved data', 'Controls for this browser’s local demonstration data and interface preferences.', 'Export a JSON backup before importing or resetting; confirm any replacement or reset deliberately.', 'Business data is stored locally in the browser. This is not a backend or cloud backup.'],
  '/diagnostics': ['Inventory diagnostics', 'An isolated, resettable scenario for demonstrating and reconciling basic inventory transactions.', 'Run the sample receipt/issue/receipt chain and inspect its movements and balance reconciliation.', 'The isolated scenario does not alter the main saved business records.'],
  '/design-system': ['Interface & print showcase', 'Examples of shared interface components, tables, charts, themes and print layouts.', 'Explore the sample controls and print preview to understand the application’s common visual patterns.', 'The demonstration form is UI-only and does not create business transactions.'],
  '/modules': ['Module catalogue', 'An index of application modules, current status and planned delivery areas.', 'Use it to understand what is operational and which future workflows are still planned.', 'A listed module is not automatically an implemented workflow.'],
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const routePathLabel = (path) => path.split('/').filter(Boolean).join(' › ');
const navigationGroupForPath = (path) => {
  if (/^\/(dashboard|company|diagnostics|modules|settings|design-system)$/.test(path)) return 'مرکزی نظام';
  if (path.startsWith('/processing/') || path === '/processing' || path.startsWith('/contractors')) return 'پروسیسنگ';
  if (path.startsWith('/designs') || path.startsWith('/collections') || path.startsWith('/production') || path.startsWith('/assembly') || path.startsWith('/packaging') || path.startsWith('/finished-products') || path.startsWith('/finished-goods') || path.startsWith('/inventory/finished')) return 'پیداوار';
  if (path.startsWith('/customers') || path.startsWith('/pricing') || path.startsWith('/quotations') || path.startsWith('/sales') || path.startsWith('/dispatch') || path.startsWith('/invoices') || path === '/payments' || path === '/returns') return 'ہول سیل';
  if (path.startsWith('/expenses') || path.startsWith('/accounting') || path === '/reports' || path === '/costing') return 'حسابات';
  if (path.startsWith('/staff') || path.startsWith('/notifications') || path.startsWith('/audit')) return 'انتظام';
  return 'خریداری اور کپڑا';
};

const submoduleTitles = {
  '/purchases/new': 'New purchase order form',
  '/purchases/requests/new': 'New purchase request form',
  '/purchases/receipts/new': 'New goods receipt form',
  '/purchases/bills/new': 'New supplier bill form',
  '/purchases/payments/new': 'New supplier payment form',
  '/purchases/returns/new': 'New purchase return form',
  '/suppliers/new': 'New supplier form',
  '/fabrics/new': 'New fabric form',
  '/inventory/locations/new': 'New warehouse location form',
  '/inventory/putaway/new': 'New putaway form',
  '/inventory/transfers/new': 'New warehouse transfer form',
  '/inventory/reservations/new': 'New fabric reservation form',
  '/inventory/stocktakes/new': 'New stocktake form',
  '/inventory/adjustments/new': 'New stock adjustment form',
  '/inventory/quality-holds/new': 'New quality hold form',
  '/contractors/new': 'New contractor form',
  '/processing/jobs/new': 'New processing job form',
  '/processing/challans/new': 'New processing challan form',
  '/processing/receipts/new': 'New processing receipt form',
  '/processing/bills/new': 'New processing bill form',
  '/processing/payments/new': 'New processing payment form',
  '/designs/new': 'New design form',
  '/collections/new': 'New collection form',
  '/designs/samples/new': 'New sample request form',
  '/production/plans/new': 'New production plan form',
  '/production/orders/new': 'New production work order form',
  '/production/cutting/new': 'New cutting output form',
  '/production/embroidery/new': 'New embroidery job form',
  '/production/receipts/new': 'New production receipt form',
  '/production/quality-control/new': 'New production inspection form',
  '/assembly/plans/new': 'New suit-matching plan form',
  '/assembly/matching/new': 'New suit matching record form',
  '/packaging/orders/new': 'New packaging order form',
};

const submoduleTitlesByLeaf = {
  dashboard: 'Dashboard',
  lots: 'Lot register',
  rolls: 'Roll register',
  locations: 'Warehouse locations',
  putaway: 'Putaway',
  transfers: 'Transfers',
  reservations: 'Reservations',
  stocktakes: 'Stocktakes',
  adjustments: 'Stock adjustments',
  'quality-holds': 'Quality holds',
  'contractor-custody': 'Contractor custody',
  movements: 'Movement ledger',
  reports: 'Reports',
  challans: 'Processing challans',
  jobs: 'Processing jobs',
  services: 'Processing services',
  rates: 'Contractor service rates',
  receipts: 'Processing receipts',
  dyeing: 'Dyeing',
  printing: 'Printing',
  bleaching: 'Bleaching',
  calendering: 'Calendering',
  finishing: 'Finishing',
  'color-batches': 'Color batches',
  'quality-control': 'Quality control',
  losses: 'Loss disposition',
  custody: 'Contractor custody',
  bills: 'Processing bills',
  payments: 'Processing payments',
  outputs: 'Processing outputs',
  collections: 'Design collections',
  designs: 'Design catalogue',
  samples: 'Design samples',
  approvals: 'Design approvals',
  'material-planning': 'Design material planning',
  plans: 'Production plans',
  orders: 'Production work orders',
  materials: 'Production materials',
  requirements: 'Material requirements',
  allocations: 'Material allocations',
  issues: 'Material issues',
  returns: 'Material returns',
  cutting: 'Cutting',
  components: 'Component lots',
  embroidery: 'Embroidery',
  rework: 'Rework',
  wastage: 'Wastage',
  costing: 'Costing',
  expenses: 'Production expenses',
  allowances: 'Production allowances',
  matching: 'Suit matching',
  incomplete: 'Incomplete sets',
  cartons: 'Cartons',
  completions: 'Packaging completions',
  'finished-products': 'Finished products',
  skus: 'Sellable SKUs',
  'finished-goods': 'Finished goods',
};

const submoduleTitle = (path) => submoduleTitles[path]
  ?? path.split('/').filter(Boolean).map((segment) => submoduleTitlesByLeaf[segment] ?? segment.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())).join(' · ');

function submodulePurpose(path, fields) {
  if (path.endsWith('/new')) return 'Create a new source-linked record. Fill the visible required fields (*) and the additional fields listed below; review the source, quantities, units and dates before saving.';
  if (/\/dashboard$/.test(path)) return 'Review the live indicators and follow their links to the source records that need attention.';
  if (/\/reports$/.test(path)) return 'Choose a report and available filters, then trace an exception back to the source transaction.';
  if (/\/movements$/.test(path)) return 'Inspect source-linked quantity changes and trace each movement to its originating posted document.';
  if (/\/approvals$/.test(path)) return 'Review records awaiting a decision. Approve only after checking their source information and required evidence.';
  if (/\/(plans|orders|jobs|challans|receipts|bills|payments|returns|reservations|issues|allocations|stocktakes|transfers|adjustments|holds|lots|rolls|components|cartons|skus)$/.test(path)) return 'Use this register to search and review the records for this business step, then open a source/detail record or start a supported action.';
  if (/\/(dyeing|printing|bleaching|calendering|finishing|quality-control|rework|wastage)$/.test(path)) return 'Review the records and controls specific to this processing or production activity. Any quantity or quality change must follow its linked source and posting workflow.';
  if (path.startsWith('/inventory/finished')) return 'Review finished-goods quantity, location, quality and movement records. Only eligible available stock can be handed to a future sale.';
  if (path.startsWith('/inventory/')) return 'Review warehouse stock, location or document records. Physical quantities change only when an eligible source-linked transaction is posted.';
  if (path.startsWith('/processing/')) return 'Review the contractor service workflow, source challans, material custody, return inspection and any posted service-cost records.';
  if (path.startsWith('/designs/') || path.startsWith('/collections/')) return 'Review design/collection definition, samples, colors, BOM revision and production-readiness information.';
  if (path.startsWith('/production/')) return 'Review the work order and its source-linked material, cutting, component, inspection, cost and reporting records.';
  if (path.startsWith('/assembly/')) return 'Review matched component custody, reservations, issues, partial sets, inspection and rework. Counts must remain tied to the originating work order and BOM.';
  if (path.startsWith('/packaging/')) return 'Review packaging orders, counted materials, label/SKU, carton and completion records. A posted completion creates the finished-goods receipt.';
  if (path.startsWith('/finished-products/') || path.startsWith('/finished-goods/')) return 'Review finished SKU identity, lot traceability, valuation or reporting. Catalogues and views do not independently create stock.';
  if (path.startsWith('/purchases/')) return 'Review this purchasing submodule and follow its supplier, purchase-order, goods-receipt or financial source links.';
  return fields.length ? 'Enter the business information shown on the form, validate it against its linked source, then use the available save/review/post actions.' : 'Open the relevant record and use its visible status, filters and source links to review this submodule.';
}

function submoduleConnection(path) {
  if (path.startsWith('/purchases/')) return 'Source links join supplier, purchase request/order, measured GRN, lot/roll stock, bill, payment and return. Each posting has a distinct effect.';
  if (path.startsWith('/inventory/')) return 'Warehouse records conserve stock identity across lots, rolls, locations, quality states and signed movements.';
  if (path.startsWith('/processing/')) return 'Processing uses contractor/service/rate records and links issued material to physical returns, QC, losses and shared processing costs.';
  if (path.startsWith('/designs/') || path.startsWith('/collections/')) return 'Approved collection, design, color and frozen BOM revisions are inputs to production plans and downstream suit costing.';
  if (path.startsWith('/production/')) return 'The approved work order links frozen design/BOM inputs to reservations, fabric issues, component lots, inspection and costing.';
  if (path.startsWith('/assembly/')) return 'Matched sets consume compatible accepted component quantities from their source work order; incomplete sets remain visible WIP.';
  if (path.startsWith('/packaging/')) return 'Packaging consumes counted materials and accepted matched suits, producing traceable finished SKU lots/cartons.';
  if (path.startsWith('/finished-products/') || path.startsWith('/finished-goods/')) return 'Finished identities and warehouse records are source-linked to packaging. Wholesale sales and dispatch are future phases.';
  return 'Follow the linked source document and its status; a draft, report or reservation is not the same as a posted physical movement.';
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await page.locator('main h1').waitFor();

  const routes = await page.locator('aside[aria-label="مرکزی سائیڈبار"] a[href]').evaluateAll((links) => {
    const seen = new Set();
    return links.flatMap((link) => {
      const url = new URL(link.href);
      if (seen.has(url.pathname)) return [];
      seen.add(url.pathname);
      const section = link.closest('section');
      const label = link.innerText.trim();
      return [{
        path: url.pathname,
        label,
        group: section?.querySelector('button')?.innerText.trim() || 'مرکزی نظام',
        underConstruction: (link.getAttribute('aria-label') ?? '').includes('زیرِ تعمیر'),
      }];
    });
  });
  if (!routes.length) throw new Error('Could not find any sidebar destinations to document.');
  const knownPaths = new Set(routes.map((route) => route.path));
  const registryText = await readFile('src/routes/registry.ts', 'utf8');
  const registeredSubmodules = [...registryText.matchAll(/\{[^{}]*\bpath:\s*'([^']+)'[^{}]*\}/g)]
    .map(([entry, path]) => ({
      path,
      group: entry.match(/\bgroup:\s*'([^']+)'/)?.[1] ?? 'foundation',
      implemented: /\bimplemented\s*:\s*true\b/.test(entry),
    }))
    .filter((route) => !route.path.includes(':') && !knownPaths.has(route.path));
  for (const route of registeredSubmodules) {
    knownPaths.add(route.path);
    routes.push({
      ...route,
      label: '',
      group: navigationGroupForPath(route.path),
      underConstruction: !route.implemented,
      submodule: true,
    });
  }
  await page.close();

  const captures = [];
  for (const route of routes) {
    console.log(`Opening ${route.path}`);
    const routePage = await context.newPage();
    routePage.setDefaultTimeout(60000);
    routePage.on('pageerror', (error) => pageErrors.push(error.message));
    await routePage.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
    const heading = routePage.locator('main h1').first();
    await heading.waitFor();
    await routePage.evaluate(() => document.fonts.ready);
    let active = routePage.locator('aside a[aria-current="page"]').first();
    if (!(await active.count())) {
      const parentPath = route.path.startsWith('/processing/')
        ? '/processing/challans'
        : route.path.startsWith('/production/')
          ? '/production'
          : route.path.startsWith('/assembly/')
            ? '/suit-assembly'
            : route.path.startsWith('/packaging/')
              ? '/packaging'
              : route.path.startsWith('/designs/') || route.path.startsWith('/collections/')
                ? '/designs'
                : route.path.startsWith('/inventory/finished/')
                  ? '/finished-inventory'
                  : route.path.startsWith('/inventory/')
                    ? '/grey-inventory'
                    : null;
      if (parentPath) active = routePage.locator(`aside a[href="${parentPath}"]`).first();
    }
    const formFields = await routePage.locator('main form label').evaluateAll((labels) => labels.map((label) => {
      const copy = label.cloneNode(true);
      copy.querySelectorAll('input,select,textarea,button,svg').forEach((control) => control.remove());
      return copy.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\*\s*$/, '');
    }).filter(Boolean));
    if (!route.label) route.label = await heading.innerText();
    if (await active.count()) await active.scrollIntoViewIfNeeded();

    const [headingText, headingBox, activeBox, sidebarBox, screenshot] = await Promise.all([
      heading.innerText(),
      heading.boundingBox(),
      active.count().then((count) => count ? active.boundingBox() : null),
      routePage.locator('aside[aria-label="مرکزی سائیڈبار"]').boundingBox(),
      routePage.screenshot({ type: 'jpeg', quality: 78, fullPage: false }),
    ]);
    if (!headingBox) throw new Error(`No visible page heading found for ${route.path}.`);
    const [title, purpose, usage, connection] = moduleInfo[route.path] ?? [
      submoduleTitle(route.path),
      submodulePurpose(route.path, formFields),
      formFields.length
        ? `Complete the visible fields below. Required labels carry an asterisk (*); select the correct linked source and unit, review quantities, then use the on-screen save and approval/posting actions.`
        : 'Use the register, filters, tabs and source links shown on the screen. Open the relevant record before using an edit, approval or posting action.',
      submoduleConnection(route.path),
    ];
    captures.push({
      ...route,
      title,
      purpose,
      usage,
      connection,
      formFields,
      headingText,
      screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
      headingTarget: { x: Math.max(35, headingBox.x + Math.min(headingBox.width / 2, 180)), y: headingBox.y + headingBox.height / 2 },
      activeTarget: activeBox ? { x: activeBox.x + activeBox.width / 2, y: activeBox.y + activeBox.height / 2 } : null,
      sidebarBox,
    });
    console.log(`Captured ${route.path} — ${route.label}`);
    await routePage.close();
  }

  if (pageErrors.length) throw new Error(`Browser errors while capturing: ${pageErrors.join(' | ')}`);
  const groups = [...new Set(captures.map((capture) => capture.group))];
  const operationalCount = captures.filter((capture) => !capture.underConstruction).length;
  const plannedCount = captures.length - operationalCount;
  const sidebarCount = captures.filter((capture) => !capture.submodule).length;
  const submoduleCount = captures.length - sidebarCount;

  const workflowPages = workflowChapters.map((chapter, chapterIndex) => {
    const sectionCards = chapter.sections.map(([title, body], index) => `
      <article class="workflow-card">
        <h2><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
      </article>`).join('');
    const flow = chapterIndex === 0 ? `
      <div class="flow-track">${[
        'Supplier & fabric', 'Request (optional)', 'Purchase order', 'Measured GRN',
        'Grey warehouse', 'Processing & design', 'Production & QC', 'Matching',
        'Packaging', 'Finished stock', 'Wholesale · planned',
      ].map((step, index) => `<div class="flow-step"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(step)}</span></div>`).join('')}</div>` : '';
    return `
      <section class="workflow-page">
        <header class="workflow-header"><span class="workflow-kicker">Purchase → production → sale</span><span>WORKFLOW ${chapterIndex + 1} / ${workflowChapters.length}</span></header>
        <h1>${escapeHtml(chapter.title)}</h1>
        <p class="workflow-subtitle">${escapeHtml(chapter.subtitle)}</p>
        ${flow}
        <div class="workflow-cards">${sectionCards}</div>
        <footer><span>Noor Textiles Lahore · Client user manual</span><span>Illustrative process guide · refer to the linked source screen</span></footer>
      </section>`;
  }).join('');

  const pages = captures.map((capture, index) => {
    const headingArrow = capture.headingTarget;
    const activeArrow = capture.activeTarget;
    const headingStart = {
      x: Math.max(50, Math.min(viewport.width - 50, headingArrow.x - 130)),
      y: Math.max(50, Math.min(viewport.height - 50, headingArrow.y + 80)),
    };
    const menuIsRight = activeArrow && activeArrow.x > viewport.width / 2;
    const activeStart = activeArrow ? {
      x: Math.max(40, Math.min(viewport.width - 40, activeArrow.x + (menuIsRight ? -95 : 95))),
      y: activeArrow.y,
    } : null;
    const arrow = (start, end, number) => start && end ? `
      <path d="M ${start.x} ${start.y} L ${end.x} ${end.y}" fill="none" stroke="#bd6f24" stroke-width="5" marker-end="url(#arrowhead)" />
      <circle cx="${start.x}" cy="${start.y}" r="17" fill="#bd6f24" stroke="#fff" stroke-width="3" />
      <text x="${start.x}" y="${start.y + 6}" text-anchor="middle" fill="#fff" font-size="17" font-weight="700">${number}</text>` : '';
    const status = capture.underConstruction ? 'PLANNED — NOT OPERATIONAL' : 'AVAILABLE IN THIS DEMO';
    const fieldsText = capture.formFields.length
      ? `${capture.formFields.slice(0, 14).join(' · ')}${capture.formFields.length > 14 ? ` · +${capture.formFields.length - 14} more fields` : ''}`
      : capture.underConstruction
        ? 'No active data-entry form: this route is a planned placeholder.'
        : 'No direct form on this screen. Use its linked child form or open a source record to continue.';
    return `
      <section class="screen-page">
        <header class="screen-header">
          <div><span class="screen-number">${String(index + 1).padStart(2, '0')}</span><h1>${escapeHtml(capture.title)}</h1><span class="urdu-label" dir="rtl">${escapeHtml(capture.label)}</span></div>
          <div class="group-status"><span>${escapeHtml(groupNames[capture.group] ?? capture.group)}</span><b class="${capture.underConstruction ? 'planned' : 'available'}">${status}</b></div>
        </header>
        <div class="capture">
          <img src="${capture.screenshot}" alt="Application screen for ${escapeHtml(capture.title)}" />
          <svg viewBox="0 0 ${viewport.width} ${viewport.height}" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z" fill="#bd6f24" /></marker></defs>
            ${arrow(headingStart, headingArrow, 1)}
            ${arrow(activeStart, activeArrow, 2)}
          </svg>
        </div>
        <div class="explanations">
          <p><strong><i>1</i> Screen purpose</strong>${escapeHtml(capture.purpose)}</p>
          <p><strong><i>2</i> Navigation & use</strong>${escapeHtml(capture.usage)}</p>
          <p><strong>Business connection</strong>${escapeHtml(capture.connection)}</p>
          <p><strong>${capture.formFields.length ? 'Form fields shown' : 'Form / next step'}</strong>${escapeHtml(fieldsText)}</p>
        </div>
        <footer><span>Noor Textiles Lahore · Client user manual · ${capture.submodule ? `Child screen ${escapeHtml(routePathLabel(capture.path))}` : 'Main module'}</span><span>${index + 1} / ${captures.length} · ${escapeHtml(capture.headingText)}</span></footer>
      </section>`;
  }).join('');

  const summaryRows = groups.map((group) => {
    const groupPages = captures.filter((capture) => capture.group === group);
    const firstPage = captures.findIndex((capture) => capture.group === group) + workflowChapters.length + 2;
    return `<tr><td>${escapeHtml(groupNames[group] ?? group)}</td><td>${groupPages.length}</td><td>${groupPages.filter((capture) => capture.submodule).length}</td><td>${groupPages.filter((capture) => !capture.underConstruction).length} ready · ${groupPages.filter((capture) => capture.underConstruction).length} planned</td><td>${firstPage}</td></tr>`;
  }).join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Noor Textiles ERP — Client User Manual</title>
    <style>
      @page { size: A4 landscape; margin: 6mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #1e293b; font: 9pt/1.32 Arial, sans-serif; }
      .cover { page-break-after: always; height: 197mm; padding: 5mm 7mm; background: linear-gradient(135deg,#f6f8f6,#fff 60%,#edf3f0); border: 1px solid #d9e3dd; overflow: hidden; }
      .brand { color: #54715e; letter-spacing: 2px; text-transform: uppercase; font-size: 10pt; font-weight: 700; }
      .cover h1 { max-width: 210mm; margin: 4mm 0 1mm; color: #19392d; font-size: 25pt; line-height: 1.04; }
      .cover .subtitle { margin: 0 0 4mm; color: #52615a; font-size: 11pt; }
      .cover-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
      .panel { margin: 0 0 2.5mm; padding: 2.5mm 3mm; border: 1px solid #d9e3dd; border-radius: 2mm; background: white; }
      .panel h2 { margin: 0 0 1mm; color: #315b45; font-size: 10.5pt; }
      .panel p { margin: .7mm 0; }
      .panel ul { margin: .7mm 0 0; padding-left: 5mm; }
      table { width: 100%; border-collapse: collapse; font-size: 7.7pt; }
      th,td { padding: .9mm 1.5mm; border-bottom: 1px solid #e6ece8; text-align: left; }
      th { color: #315b45; }
      .notice { padding: 3mm; border-left: 3px solid #bc792c; background: #fff8eb; }
      .workflow-page { page-break-after: always; height: 197mm; display: flex; flex-direction: column; overflow: hidden; }
      .workflow-header { display: flex; justify-content: space-between; border-bottom: 1px solid #dce5df; padding-bottom: 2mm; color: #728078; font-size: 7.5pt; letter-spacing: .7px; }
      .workflow-kicker { color: #315b45; font-weight: 700; }
      .workflow-page > h1 { margin: 4mm 0 1mm; color: #203b2f; font-size: 22pt; }
      .workflow-subtitle { margin: 0 0 3mm; color: #52615a; font-size: 10pt; }
      .flow-track { display: grid; grid-template-columns: repeat(4,1fr); gap: 2mm; margin-bottom: 3mm; }
      .flow-step { display: flex; align-items: center; gap: 2mm; min-height: 9mm; padding: 1.5mm 2mm; border: 1px solid #d9e3dd; border-radius: 2mm; background: #fff; color: #375047; font-size: 8pt; font-weight: 600; }
      .flow-step b { display: grid; width: 5mm; height: 5mm; flex: 0 0 5mm; place-items: center; border-radius: 50%; background: #244d39; color: #fff; font-size: 6.5pt; }
      .workflow-cards { display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(2,1fr); gap: 3mm; flex: 1; min-height: 0; }
      .workflow-card { padding: 3mm 3.5mm; border: 1px solid #d9e3dd; border-top: 2px solid #7d9a86; border-radius: 2mm; background: #fff; }
      .workflow-card h2 { display: flex; align-items: center; gap: 2mm; margin: 0 0 2mm; color: #315b45; font-size: 10pt; }
      .workflow-card h2 span { display: grid; width: 6mm; height: 6mm; place-items: center; border-radius: 50%; background: #e8f1eb; font-size: 7pt; }
      .workflow-card p { margin: 0; color: #405149; font-size: 8.6pt; line-height: 1.45; }
      .workflow-page footer { margin-top: 2mm; }
      .screen-page { page-break-after: always; height: 197mm; display: flex; flex-direction: column; overflow: hidden; }
      .screen-page:last-child { page-break-after: auto; }
      .screen-header { height: 12mm; flex: 0 0 12mm; display: flex; align-items: center; justify-content: space-between; gap: 5mm; }
      .screen-header > div:first-child { display: flex; align-items: center; gap: 2.4mm; min-width: 0; }
      .screen-number { display: inline-grid; width: 8mm; height: 8mm; place-items: center; border-radius: 50%; background: #244d39; color: white; font-weight: 700; }
      .screen-header h1 { margin: 0; color: #203b2f; font-size: 12pt; white-space: nowrap; }
      .urdu-label { padding: 1mm 2mm; border-radius: 2mm; background: #eff4f0; color: #375d47; font-size: 9pt; white-space: nowrap; }
      .group-status { display: flex; align-items: center; gap: 3mm; color: #52615a; font-size: 8pt; }
      .group-status b { padding: 1.3mm 2mm; border-radius: 2mm; font-size: 7pt; letter-spacing: .2px; white-space: nowrap; }
      .available { background: #e5f3e9; color: #24603c; }
      .planned { background: #fff1d7; color: #85520d; }
      .capture { position: relative; width: 100%; height: 160mm; flex: 0 0 160mm; overflow: hidden; border: 1px solid #cbd5d0; background: #f4f6f5; }
      .capture img { display: block; width: 100%; height: 100%; object-fit: fill; }
      .capture svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .explanations { flex: 1; min-height: 0; display: grid; grid-template-columns: .9fr 1fr .9fr 1.35fr; gap: 2mm; padding-top: 1.5mm; }
      .explanations p { margin: 0; padding: 1.3mm 1.5mm; border-top: 1.5px solid #dce5df; color: #405149; font-size: 7pt; line-height: 1.25; overflow-wrap: anywhere; }
      .explanations strong { display: block; margin-bottom: .6mm; color: #315b45; font-size: 7.4pt; }
      .explanations i { display: inline-grid; width: 4mm; height: 4mm; margin-right: 1mm; place-items: center; border-radius: 50%; background: #bd6f24; color: white; font-style: normal; font-size: 7pt; }
      footer { height: 4mm; flex: 0 0 4mm; display: flex; justify-content: space-between; align-items: center; color: #758078; font-size: 6.5pt; border-top: 1px solid #e3e8e4; }
    </style></head><body>
      <section class="cover">
        <div class="brand">Noor Textiles Lahore · Client guide</div>
        <h1>ERP Screen-by-Screen User Manual</h1>
        <p class="subtitle">A visual guide to every main module and child screen in the Urdu RTL textile ERP.</p>
        <div class="cover-grid">
          <div>
            <div class="panel"><h2>Read the screen arrows</h2><p>This guide documents <strong>${sidebarCount} main menu screens and ${submoduleCount} child screens/forms</strong>. <strong>1</strong> points to the screen title; <strong>2</strong> points to the matching menu item when available. Below every screenshot, read the purpose, how to use it, related records and the actual visible form fields.</p></div>
            <div class="panel"><h2>Using a module</h2><p>The right-side menu is grouped by business area. Select a child item to open its screen. Use global search when available and follow source links to review underlying documents. For transactions, prepare the record, complete required review/approval, then post it. Draft or approved-but-unposted records are not completed stock or financial postings.</p></div>
            <div class="panel notice"><strong>Availability</strong><p><strong>${operationalCount} screens are available</strong> in this demo. ${plannedCount} screens are marked under construction and are included only to explain the planned workflow; they do not record transactions.</p></div>
          </div>
          <div>
            <div class="panel"><h2>Module index</h2><table><thead><tr><th>Business area</th><th>Screens</th><th>Child</th><th>Status</th><th>Starts p.</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
            <div class="panel"><h2>Textile workflow</h2><p><strong>Supplier & fabric → purchase/order → receipt → grey warehouse → processing → design/BOM → production/cutting → embroidery/QC → suit matching → packaging → finished goods → wholesale.</strong></p><p>Dedicated workflow pages explain the forms and handoffs. Wholesale selling, dispatch and invoices are planned, not operational.</p></div>
            <div class="panel"><h2>Demonstration limits</h2><p>Frontend-only and single-company: records are local to a browser, payments do not transfer money and demo roles are not authentication. Reports are not production accounting. Export a backup before replacing/resetting data. Screens use an isolated session; existing user data was not changed. The UI is Urdu RTL; this guide is in English.</p></div>
          </div>
        </div>
      </section>
      ${workflowPages}
      ${pages}
    </body></html>`;

  await mkdir('docs', { recursive: true });
  const pdfPage = await context.newPage({ viewport: { width: 1200, height: 850 } });
  await pdfPage.setContent(html, { waitUntil: 'load' });
  await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  console.log(`Created ${outputPath}: ${sidebarCount} main menu screens, ${submoduleCount} child screens/forms, and ${workflowChapters.length} workflow chapters (${operationalCount} screens available, ${plannedCount} planned).`);
  await context.close();
} finally {
  await browser.close();
}
