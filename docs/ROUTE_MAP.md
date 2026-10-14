# Route map

The typed registry is `src/routes/registry.ts`; Urdu labels come from `src/locales/ur/index.ts`. React Router renders routes inside the shared RTL application shell. `/` redirects to `/dashboard`; unknown paths render a meaningful not-found view. `:id` paths are reserved detail routes and remain placeholders until their phase.

All routes are accessible in this frontend demonstration. The role switcher selects a demo context; there is no secure authorization, sign-in or route guard. The responsible roles below describe intended business use, not implemented security. Four Phase 1 routes are operational; all other routes display **زیرِ تعمیر** and the proposed phase. Future phase numbering is a proposed sequence because only Phase 1 was specified/authorized.

| Path | Urdu title | Module owner | Intended roles | Phase / current state |
| --- | --- | --- | --- | --- |
| `/dashboard` | ڈیش بورڈ | dashboard | All demo roles | 1 — working live foundation totals |
| `/diagnostics` | انوینٹری جانچ | diagnostics | Manager, warehouse | 1 — working isolated scenario |
| `/modules` | تمام ماڈیولز | modules | All demo roles | 1 — working route/module catalogue |
| `/settings` | ترتیبات | settings | Manager | 1 — working local export/import/reset |
| `/company` | کمپنی | company | Manager | 2 — placeholder |
| `/suppliers` | سپلائرز | suppliers | Procurement, manager | 2 — placeholder |
| `/suppliers/:id` | سپلائرز | suppliers | Procurement, manager | 2 — placeholder |
| `/fabrics` | کپڑے کی اقسام | fabrics | Procurement, warehouse | 2 — placeholder |
| `/contractors` | پروسیسنگ ٹھیکیدار | contractors | Processing coordinator | 2 — placeholder |
| `/customers` | گاہک | customers | Sales, accounts | 2 — placeholder |
| `/staff` | عملہ | staff | Manager | 2 — placeholder |
| `/purchases` | خریداری | purchasing | Procurement, manager | 4 — placeholder |
| `/purchases/new` | خریداری | purchasing | Procurement | 4 — placeholder |
| `/purchases/:id` | خریداری | purchasing | Procurement, warehouse | 4 — placeholder |
| `/inventory/grey` | کورا کپڑا | grey-inventory | Warehouse | 4 — placeholder |
| `/inventory/grey/lots/:id` | کورا کپڑا | grey-inventory | Warehouse | 4 — placeholder |
| `/processing/challans` | پروسیسنگ | processing | Processing coordinator, warehouse | 5 — placeholder |
| `/processing/challans/:id` | پروسیسنگ | processing | Processing coordinator, warehouse | 5 — placeholder |
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
