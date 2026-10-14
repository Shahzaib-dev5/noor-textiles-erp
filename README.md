# نور ٹیکسٹائلز لاہور — Noor Textiles ERP

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

Future module routes are labeled **زیرِ تعمیر** with their proposed phase number. A demo role switcher is available for context; it does not enforce authorization.

The golden history receives 1,000 m, issues 400 m to processing, receives 380 m and recognizes 10 m loss. Balances are **600 m grey + 380 m processed + 10 m contractor-held + 10 m loss = 1,000 m**. The example finished SKU is a catalogue record with zero suits in stock.

UI preferences use the separate key `noor-textiles-erp-ui-v1`; business JSON export/reset does not reset sidebar, theme, selected demo work profile or preferred table page size. Ctrl/Cmd+K opens global search. CSV exports are real local downloads with Urdu encoding. The showcase form is transient and cannot alter business inventory. Purchase dashboard amounts are receipt valuations, with sales/profit/receivable values honestly marked upcoming.

## Verification

```sh
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

Actual executed results are tracked in [Phase 1 acceptance](docs/PHASE_1_ACCEPTANCE.md). Do not infer that a command passed merely because it is listed here.

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

The project creates meaningful Phase 1 files, rather than empty stubs for every future module. See [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), [workflow catalogue](docs/BUSINESS_WORKFLOWS.md), [inventory rules](docs/INVENTORY_RULES.md), [route map](docs/ROUTE_MAP.md), and [demo data strategy](docs/DEMO_DATA_STRATEGY.md). The [implementation ledger](docs/IMPLEMENTATION_PROGRESS.md) lists all 14 phases and the Phase 4 handoff.

localStorage is a demonstration mechanism with browser quota, durability and concurrent-tab limits. Invalid saved data is surfaced without silently replacing it; explicit import/reset performs recovery. Keep an exported JSON copy if the demo data matters. Follow the permanent instructions in `AGENTS.md` for every subsequent phase.

## Phase 3 expanded business demonstration

Open Settings and choose **مکمل نمونہ ڈیٹا لوڈ کریں**. Export your current JSON if needed, then confirm replacement. The deterministic historical dataset includes 12 suppliers/fabrics, 8 contractors, 20 customers, 800 rolls, connected purchasing/processing/production/wholesale records, and linked invoices/payments. Existing saved data stays unchanged until confirmation; refresh restores the loaded snapshot and UI preferences remain intact.

The expanded dashboard offers real invoice/cash/receivable/inventory KPIs, eleven charts, scoped filters, source alerts and reconciliation. The original golden dashboard remains the default and can be restored explicitly. Future operational modules retain honest notices and read-only history previews. See [Phase 3 acceptance](docs/PHASE_3_ACCEPTANCE.md), [data and limits](docs/EXPANDED_DEMO_DATA.md), [analytics definitions](docs/DASHBOARD_ANALYTICS.md) and [reconciliation](docs/SEED_RECONCILIATION.md).
