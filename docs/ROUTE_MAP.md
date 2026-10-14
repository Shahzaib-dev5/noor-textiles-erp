# Route map

The typed registry is `src/routes/registry.ts`; Urdu labels come from `src/locales/ur/index.ts`. React Router renders routes inside the shared RTL application shell. `/` redirects to `/dashboard`; unknown paths render a meaningful not-found view. Purchasing/master detail paths are operational; future module details remain placeholders.

All routes are accessible in this frontend demonstration. The role switcher simulates purchasing command permissions; there is no secure authorization, sign-in or route guard. There are 67 registered paths, including 34 implemented purchasing/foundation paths. The table below records earlier phases; the Phase 4 matrix supersedes its supplier/fabric/purchase placeholder entries. Contractor and downstream modules retain historical read-only previews and future operational notices.

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
| `/inventory/grey` | کورا کپڑا | grey-inventory | Warehouse | 4 — placeholder |
| `/inventory/grey/lots/:id` | کورا کپڑا | grey-inventory | Warehouse | 4 — placeholder |
| `/processing/challans` | پروسیسنگ | processing | Processing coordinator, warehouse | 5 — placeholder |
| `/processing/challans/:id` | پروسیسنگ | processing | Processing coordinator, warehouse | 5 — placeholder |
| `/processing/jobs` | رنگائی اور پرنٹنگ | processing | Processing coordinator | 5 — placeholder |
| `/designs` | ڈیزائنز | designs | Designer, manager | 6 — placeholder |
| `/collections` | کلیکشنز | designs | Designer, manager | 6 — placeholder |
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
