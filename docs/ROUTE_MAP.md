# Route map

The typed registry is `src/routes/registry.ts`; Urdu labels come from `src/locales/ur/index.ts`. React Router renders routes inside the shared RTL application shell. `/` redirects to `/dashboard`; unknown paths render a meaningful not-found view. Purchasing/master detail paths are operational; future module details remain placeholders.

All routes are accessible in this frontend demonstration. The role switcher simulates purchasing/warehouse command permissions; there is no secure authorization, sign-in or route guard. There are 93 registered paths, including 62 implemented purchasing/warehouse/foundation paths. The matrices below supersede earlier placeholder descriptions. Contractor and downstream modules retain historical read-only previews and future operational notices.

## Phase 5 operational paths

| Paths | Function |
| --- | --- |
| `/inventory/grey` | Physical/eligible/reserved/quality/custody dashboard and valuation |
| `/inventory/grey/lots`, `/inventory/grey/lots/:id` | Lot register, source receipt/supplier/rolls/movement detail |
| `/inventory/grey/rolls`, `/inventory/grey/rolls/:id` | Original measurements/current portions, search/quality filters, detail and roll label |
| `/inventory/locations`, `/inventory/locations/new`, `/inventory/locations/:id`, `/inventory/locations/:id/edit` | Hierarchy/capacity/compatibility and protected deactivation |
| `/inventory/putaway`, `/inventory/putaway/new` | Multi-roll staging-to-storage; detail/draft edit via `?record=<id>` / `&edit=1` |
| `/inventory/transfers`, `/inventory/transfers/new`, `/inventory/transfers/:id` | Draft/submit/approve/post/cancel; draft edit via `?record=<id>&edit=1` |
| `/inventory/reservations`, `/inventory/reservations/new`, `/inventory/reservations/:id` | Reservation creation, partial release/cancel/existing-challan consumption |
| `/inventory/stocktakes`, `/inventory/stocktakes/new`, `/inventory/stocktakes/:id` | Snapshot, counts/notes, variance, review/approval/posting |
| `/inventory/adjustments`, `/inventory/adjustments/new`, `/inventory/adjustments/:id` | Provenance-backed signed corrections and hold-linked write-offs |
| `/inventory/quality-holds`, `/inventory/quality-holds/new` | Owned hold/quarantine/rejection/damage; detail/release via `?record=<id>` |
| `/inventory/contractor-custody` | Existing source custody overview and `?record=<challan-line-id>` drill-down |
| `/inventory/movements` | Unified signed fabric ledger, exact event filters, drawer, CSV/A4 |
| `/inventory/reports` | Fourteen stock/ageing/low-stock/variance/custody reports and reconciliation |

Full processing screens remain deferred to Phase 6; the existing diagnostic reducers and historical read-only source links remain available.

## Phase 4 operational paths

| Paths | Function |
| --- | --- |
| `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/suppliers/:id/edit`, `/suppliers/:id/ledger` | Register, create, profile/history, edit/deactivate, ledger |
| `/fabrics`, `/fabrics/new`, `/fabrics/:id`, `/fabrics/:id/edit` | Master register, create, specification detail, protected edit/deactivate |
| `/purchases`, `/purchases/dashboard` | Purchasing dashboard and live order register |
| `/purchases/requests`, `/purchases/requests/new`, `/purchases/requests/:id` | Request register/create/workflow; draft editing via `?edit=1` |
| `/purchases/new`, `/purchases/:id`, `/purchases/:id/edit` | Multi-line PO, detail/approval/cancel/confirm/close, draft editing |
| `/purchases/receipts`, `/purchases/receipts/new`, `/purchases/receipts/:id` | GRN register, measured receiving, inspection/post/cancel; draft editing via `?edit=1` |
| `/purchases/bills`, `/purchases/bills/new`, `/purchases/bills/:id` | Supplier bills, multiple-GRN source selection, posting/detail |
| `/purchases/returns`, `/purchases/returns/new`, `/purchases/returns/:id` | Return register, available stock selection, approval/post/detail |
| `/purchases/payments`, `/purchases/payments/new` | Payment register/create; details via `?record=<id>` |
| `/purchases/reports` | Eleven reports, filters, reconciliation, CSV and A4 |

Owner can perform all purchasing actions. Purchase demo role manages masters/requests/POs/receipts/returns; warehouse manages receiving/returns; accounts manages bills/payments; other roles can request materials. Commands enforce these simulated permissions as well as business rules. No Phase 5 processing or grey warehouse enhancement is implemented.

| Path | Urdu title | Module owner | Intended roles | Phase / current state |
| --- | --- | --- | --- | --- |
| `/dashboard` | ڈیش بورڈ | dashboard | All demo roles | 1 — working live foundation totals |
| `/diagnostics` | انوینٹری جانچ | diagnostics | Manager, warehouse | 1 — working isolated scenario |
| `/modules` | تمام ماڈیولز | modules | All demo roles | 1 — working route/module catalogue |
| `/settings` | ترتیبات | settings | Manager | 1 — working local export/import/reset |
| `/design-system` | ڈیزائن سسٹم | design-system | All demo roles | 2 — working components/tables/charts/print |
| `/company` | کمپنی | company | Manager | 4 — placeholder |
| `/suppliers` | سپلائرز | suppliers | Procurement, manager | 4 — operational |
| `/suppliers/:id` | سپلائرز | suppliers | Procurement, manager | 4 — operational |
| `/fabrics` | کپڑے کی اقسام | fabrics | Procurement, warehouse | 4 — operational |
| `/contractors` | پروسیسنگ ٹھیکیدار | contractors | Processing coordinator | 5 — placeholder |
| `/customers` | گاہک | customers | Sales, accounts | 10 — placeholder |
| `/staff` | عملہ | staff | Manager | 14 — placeholder |
| `/purchases` | خریداری | purchasing | Procurement, manager | 4 — operational |
| `/purchases/new` | خریداری | purchasing | Procurement | 4 — operational |
| `/purchases/:id` | خریداری | purchasing | Procurement, warehouse | 4 — operational |
| `/inventory/grey` | کورا کپڑا | grey-inventory | Warehouse | 5 — operational |
| `/inventory/grey/lots/:id` | کورا کپڑا | grey-inventory | Warehouse | 5 — operational |
| `/processing/challans` | پروسیسنگ | processing | Processing coordinator, warehouse | 6 — placeholder |
| `/processing/challans/:id` | پروسیسنگ | processing | Processing coordinator, warehouse | 6 — placeholder |
| `/processing/jobs` | رنگائی اور پرنٹنگ | processing | Processing coordinator | 6 — placeholder |
| `/designs` | ڈیزائن اسٹوڈیو | designs | All read; owner/production writes | 7 — implemented |
| `/collections` | کلیکشنز | designs | All read; owner/production writes | 7 — implemented |
| `/production` | پیداوار | production | Production planner | 7 — placeholder |
| `/production/orders/:id` | پیداوار | production | Production planner, warehouse | 7 — placeholder |
| `/cutting` | کٹنگ | cutting | Cutting supervisor | 7 — placeholder |
| `/embroidery` | کڑھائی | embroidery | Production coordinator | 8 — placeholder |
| `/quality-control` | معیار کی جانچ | quality-control | Quality inspector | 8 — placeholder |
| `/suit-assembly` | سوٹ میچنگ | suit-assembly | Assembly supervisor | 8 — placeholder |
| `/packaging` | پیکنگ | packaging | Packaging supervisor | 9 — placeholder |
| `/inventory/finished` | تیار مال | finished-inventory | Warehouse, sales | 9 — placeholder |
| `/pricing` | قیمت نامے | pricing | Sales manager | 10 — placeholder |
| `/quotations` | کوٹیشنز | quotations | Sales | 10 — placeholder |
| `/sales/orders` | تھوک فروخت | sales | Sales, manager | 10 — placeholder |
| `/sales/orders/:id` | تھوک فروخت | sales | Sales, warehouse | 10 — placeholder |
| `/dispatch` | ڈسپیچ | dispatch | Dispatch clerk, warehouse | 11 — placeholder |
| `/invoices` | انوائسز | invoicing | Accounts | 11 — placeholder |
| `/payments` | وصولیاں | payments | Cashier, accounts | 12 — placeholder |
| `/expenses` | اخراجات | expenses | Accounts, manager | 12 — placeholder |
| `/accounting` | حسابات | accounting | Accounts, manager | 12 — placeholder |
| `/returns` | واپسی | returns | Returns clerk, quality, accounts | 13 — placeholder |
| `/costing` | لاگت | costing | Cost accountant, manager | 13 — placeholder |
| `/reports` | رپورٹس | reports | Manager, accounts, warehouse | 14 — placeholder |
| `/notifications` | اطلاعات | notifications | All demo roles | 14 — placeholder |
| `/audit` | آڈٹ لاگ | audit | Manager | 14 — placeholder |

Phase 3 expands deterministic demonstration data and has no dedicated operational route. The Phase 1 `/settings` page provides only data-management controls, not a completed future company/security configuration module. Likewise `/modules` is navigation documentation, not implementation of every listed module.

## Phase 6 routes

Contractors: `/contractors`, `/contractors/new`, `/contractors/:id`, `/contractors/:id/edit`, `/contractors/:id/ledger`. Processing: `/processing`, `/processing/dashboard`, `/processing/services`, `/processing/rates`, `/processing/jobs`, `/processing/jobs/new`, `/processing/jobs/:id`, `/processing/jobs/:id/edit`, `/processing/challans`, `/processing/challans/new`, `/processing/challans/:id`, `/processing/receipts`, `/processing/receipts/new`, `/processing/receipts/:id`, `/processing/dyeing`, `/processing/printing`, `/processing/bleaching`, `/processing/calendering`, `/processing/finishing`, `/processing/color-batches`, `/processing/quality-control`, `/processing/losses`, `/processing/custody`, `/processing/bills`, `/processing/bills/new`, `/processing/bills/:id`, `/processing/payments`, `/processing/payments/new`, `/processing/reports`, `/processing/outputs`. Additional detail views use `?record=<id>`; rates and controlled colors edit/create through the shared forms. Existing historical challan URLs remain readable.

## Phase 7 routes

`/designs` now opens the Design Studio. Implemented detail paths are `/designs/new`, `/designs/:id`, `/designs/:id/edit`, `/designs/:id/duplicate`, `/designs/:id/colors`, `/designs/:id/bom`, `/designs/:id/samples`, `/designs/:id/costing`, `/designs/:id/availability` and `/designs/:id/activity`. Existing `?record=<id>` previews remain readable; BOM deep links additionally accept `?bom=<revisionId>`.

Collections: `/collections`, `/collections/new`, `/collections/:id`, `/collections/:id/edit`. Cross-design pages: `/designs/samples`, `/designs/samples/new`, `/designs/approvals`, `/designs/material-planning`, `/designs/reports`. Static routes retain precedence over `:id`. All twenty paths are implemented, with Urdu RTL screens and state-derived actions. Earlier table phase labels are historical; these design routes now belong to Phase 7. Future production routes remain deferred.

## Phase 8 production

Implemented `/production` and `/production/dashboard`; plans list/new/detail; orders list/new/detail/edit; materials requirements/allocations/issues/returns; cutting list/new/detail; components list/detail; embroidery list/new/detail; receipts list/new; quality-control list/new/detail; rework/wastage/costing/expenses/allowances/reports. Existing `/cutting`, `/embroidery`, `/quality-control` open the connected production screens. Remaining create/update source actions use shared dialogs, including reserve release, WIP returns, rework/disposal/expenses and service billing. See `src/routes/registry.ts` and the [workflow](PRODUCTION_PLANNING_WORKFLOW.md).

## Phase 9 finishing routes

The existing `/suit-assembly`, `/packaging` and `/inventory/finished` routes now open operational Phase 9 screens. Added paths:

- `/assembly`
- `/assembly/dashboard`
- `/assembly/plans`
- `/assembly/plans/new`
- `/assembly/plans/:id`
- `/assembly/plans/:id/edit`
- `/assembly/matching`
- `/assembly/matching/new`
- `/assembly/matching/:id`
- `/assembly/components`
- `/assembly/reservations`
- `/assembly/issues`
- `/assembly/returns`
- `/assembly/incomplete`
- `/assembly/quality-control`
- `/assembly/rework`
- `/packaging/orders`
- `/packaging/orders/new`
- `/packaging/orders/:id`
- `/packaging/orders/:id/edit`
- `/packaging/materials`
- `/packaging/materials/receipts`
- `/packaging/materials/allocations`
- `/packaging/labels`
- `/packaging/cartons`
- `/packaging/completions`
- `/finished-products`
- `/finished-products/skus`
- `/finished-products/skus/:id`
- `/inventory/finished/lots`
- `/inventory/finished/lots/:id`
- `/inventory/finished/locations`
- `/inventory/finished/transfers`
- `/inventory/finished/adjustments`
- `/inventory/finished/quality-holds`
- `/inventory/finished/movements`
- `/finished-goods/costing`
- `/finished-goods/reports`

Registers open source details with `?record=<id>` where a dedicated detail route is not listed. Shared dialogs implement receipt/issue/QC posting, rework, replacement, material allocation, completion, location, carton and quality actions. SKU details include metadata editing, real stock/movement/batch tables and labels with a selected actual packaging batch. [Workflow](SUIT_MATCHING_WORKFLOW.md).
