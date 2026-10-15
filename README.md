# نور ٹیکسٹائلز لاہور — Noor Textiles ERP

For one business guide explaining every module through Phase 5, its use and its connections, with workflow diagrams, see [Module guide through Phase 5](docs/MODULE_GUIDE_THROUGH_PHASE_5.md).

Frontend-only Urdu RTL textile ERP foundation. Phase 1 implements a connected local demo state, movement-based fabric inventory, three validated transactions and an operational architecture dashboard. It has no backend, real authentication or payment gateway.

Phase 2 adds the enterprise Urdu RTL design system: collapsible grouped sidebar, keyboard search, real notifications, responsive dashboard, reusable tables/forms/charts/dialogs, persistent light/dark/system preferences, and `/design-system` with A4 print preview. See [design system](docs/DESIGN_SYSTEM.md), [component library](docs/COMPONENT_LIBRARY.md), [RTL guidelines](docs/RTL_GUIDELINES.md) and [Phase 2 acceptance](docs/PHASE_2_ACCEPTANCE.md).

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use a current Node.js version compatible with the locked Vite/Vitest dependencies; this workspace uses Node 24. The interface is Urdu and RTL; technical document codes retain LTR direction. Demo data is saved in the browser under `noor-textiles-erp-demo-v1`.

## Working foundation pages

- `/dashboard`: company identity, live store-derived stock totals and golden traceability.
- `/diagnostics`: isolated resettable scenario for goods receipt, processing issue and partial receipt, with movement inspection and reconciliation.
- `/modules`: route catalogue showing planned modules and phases.
- `/settings`: explicit JSON export/import and reset of saved demo data.
- `/design-system`: interactive components, a validated UI-only form, actual record tables, real-data charts and an existing purchase-order print showcase.

Future module routes are labeled **زیرِ تعمیر** with their proposed phase number. A demo role switcher simulates purchasing command permissions; it is not secure authorization.

The golden history receives 1,000 m, issues 400 m to processing, receives 380 m and recognizes 10 m loss. Balances are **600 m grey + 380 m processed + 10 m contractor-held + 10 m loss = 1,000 m**. The example finished SKU is a catalogue record with zero suits in stock.

UI preferences use the separate key `noor-textiles-erp-ui-v1`; business JSON export/reset does not reset sidebar, theme, selected demo work profile or preferred table page size. Ctrl/Cmd+K opens global search. CSV exports are real local downloads with Urdu encoding. The showcase form is transient and cannot alter business inventory. Purchasing views separate order commitments, receipt valuation, posted liabilities, cash allocations and advances.

## Phase 4 purchasing

Operational routes include `/suppliers`, `/fabrics`, `/purchases`, `/purchases/requests`, `/purchases/receipts`, `/purchases/bills`, `/purchases/payments`, `/purchases/returns` and `/purchases/reports`, with create/edit/detail paths and `/suppliers/:id/ledger`. Use the owner demo role to exercise the entire lifecycle. Supplier/fabric creation creates no stock; approve a PO, enter measured rolls in a draft GRN, then post it. Bills, payments and approved returns each require explicit posting.

Meters are canonical, rates are per meter, money is integer paisa, receipt tolerance is zero and tax is explicitly zero. Existing historical records remain read-only and are never silently replaced or reposted. The additive procurement extension preserves the existing localStorage envelope and preferences. See [purchasing workflow](docs/PURCHASING_WORKFLOW.md), [supplier ledger](docs/SUPPLIER_LEDGER_RULES.md), [receiving rules](docs/GRN_AND_ROLL_RECEIVING.md), [route map](docs/ROUTE_MAP.md) and [Phase 4 acceptance](docs/PHASE_4_ACCEPTANCE.md) for actual verification and limits. Phase 5 now extends grey warehouse control; full processing editors remain Phase 6.

## Verification

Phase 5 adds `/inventory/grey` and warehouse routes for lots, rolls, locations, putaway, transfers, reservations, stocktakes, adjustments, quality holds, contractor custody, movements and reports. Use the owner demo role for approval workflows. Create a staging/bin hierarchy (or explicitly create the empty sample layout), receive through Phase 4, and put accepted measured rolls away. Stock moves only through posted events; reservations and saved counts do not create stock. Historical roll custody is honestly marked unknown where source history has no identities. See [Phase 5 acceptance](docs/PHASE_5_ACCEPTANCE.md), [warehouse workflow](docs/GREY_WAREHOUSE_WORKFLOW.md) and [roll model](docs/ROLL_TRACKING_MODEL.md). Full processing management remains Phase 6.

```sh
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

Actual executed results are tracked in the phase acceptance documents; the current purchasing evidence is in [Phase 4 acceptance](docs/PHASE_4_ACCEPTANCE.md). Do not infer that a command passed merely because it is listed here.

An optional real-browser smoke script covers reload persistence, all three isolated transactions, export/import/reset, mobile navigation and corrupt-data protection. It launches installed Microsoft Edge headlessly through Playwright, uses fresh temporary browser contexts and writes screenshots/export evidence under `artifacts/`. Start the development server first, then run:

```sh
npm run test:browser
```

The default target is `http://127.0.0.1:5173`. If Vite is running on a different port, set `NOOR_BASE_URL` to that URL. For example, in PowerShell:

```powershell
$env:NOOR_BASE_URL = 'http://127.0.0.1:5174'
npm run test:browser
```

## Project organization

```text
src/
  app/           application, router and providers
  components/    shared RTL layout, forms, feedback, shadcn/ui
  features/      working foundation pages; future feature boundaries
  domain/        entity contracts, enums, calculators and invariants
  services/      transactions, inventory, numbering and local persistence
  store/         central Zustand state and selectors
  data/          deterministic seed and scenario factory
  locales/ur/    shared Urdu labels
  lib/           shared formatting/utilities
  routes/        typed route registry
  styles/        theme and RTL styles
  tests/         unit and integration coverage
  types/         common aliases and metadata
docs/            architecture, business workflows and acceptance evidence
```

The project creates meaningful Phase 1 files, rather than empty stubs for every future module. See [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), [workflow catalogue](docs/BUSINESS_WORKFLOWS.md), [inventory rules](docs/INVENTORY_RULES.md), [route map](docs/ROUTE_MAP.md), and [demo data strategy](docs/DEMO_DATA_STRATEGY.md). The [implementation ledger](docs/IMPLEMENTATION_PROGRESS.md) lists all 14 phases and the Phase 6 handoff.

localStorage is a demonstration mechanism with browser quota, durability and concurrent-tab limits. Invalid saved data is surfaced without silently replacing it; explicit import/reset performs recovery. Keep an exported JSON copy if the demo data matters. Follow the permanent instructions in `AGENTS.md` for every subsequent phase.

## Phase 3 expanded business demonstration

Open Settings and choose **مکمل نمونہ ڈیٹا لوڈ کریں**. Export your current JSON if needed, then confirm replacement. The deterministic historical dataset includes 12 suppliers/fabrics, 8 contractors, 20 customers, 800 rolls, connected purchasing/processing/production/wholesale records, and linked invoices/payments. Existing saved data stays unchanged until confirmation; refresh restores the loaded snapshot and UI preferences remain intact.

The expanded dashboard offers real invoice/cash/receivable/inventory KPIs, eleven charts, scoped filters, source alerts and reconciliation. The original golden dashboard remains the default and can be restored explicitly. Future operational modules retain honest notices and read-only history previews. See [Phase 3 acceptance](docs/PHASE_3_ACCEPTANCE.md), [data and limits](docs/EXPANDED_DEMO_DATA.md), [analytics definitions](docs/DASHBOARD_ANALYTICS.md) and [reconciliation](docs/SEED_RECONCILIATION.md).

## Phase 6 processing

Phase 6 is complete and verified. Contractor management, service rates, jobs, issue challans, partial receipts, returned-output QC, color batches, multi-stage output lineage and contractor finances use the existing shared store and movement ledger. All 255 automated tests, TypeScript, lint, production build and six browser suites pass. Start at `/processing/dashboard` or `/contractors`. See [processing workflow](docs/PROCESSING_WORKFLOW.md), [costing](docs/PROCESSING_COSTING.md) and [acceptance evidence](docs/PHASE_6_ACCEPTANCE.md).

## Phase 7 Design Studio

Phase 7 is complete and verified: 293 tests, strict TypeScript, lint, production build and all seven browser suites passed. Open `/designs` and `/collections` for seasonal collections, two/three-piece product definitions, approved color variants, immutable BOM revisions, prototype sampling/reviews, editable estimated costs and live processed-fabric availability. Catalog cards, nine reports, CSV and six Urdu A4 sheets reuse the existing interface and store. Design planning never creates or reserves stock. Historical designs remain read-only and can be duplicated into controlled drafts.

See [workflow and diagram](docs/DESIGN_STUDIO_WORKFLOW.md), [BOM revision rules](docs/BOM_AND_REVISION_RULES.md), [costing and availability](docs/DESIGN_COSTING_AND_AVAILABILITY.md) and [actual Phase 7 verification](docs/PHASE_7_ACCEPTANCE.md). Phase 8 production execution is not included.

## Phase 8 production

Production plans, work orders, processed-fabric allocation/issue, cutting, component stock, embroidery, QC/rework and costing are implemented and verified in the central localStorage demo. TypeScript, lint,326 tests, the production build and all eight Edge browser suites pass. See [workflow](docs/PRODUCTION_PLANNING_WORKFLOW.md) and [acceptance](docs/PHASE_8_ACCEPTANCE.md). Phase 9 assembly/packaging is outside this phase.
