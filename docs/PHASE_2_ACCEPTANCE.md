# Phase 2 acceptance

Date: 2026-10-14 (Asia/Karachi). Branch: `phase-02-urdu-ui`.

Status: complete and verified.

## Baseline and preservation

Before editing, strict TypeScript and all 85 Phase 1 tests passed. Existing domain models, seed, validation/inventory engine and business persistence format were inspected and preserved. The Phase 2 form record, notifications, UI preferences and visuals do not seed or alter business transactions. Only live role/theme compatibility fields are mirrored from the new separate preference store.

## Command evidence

| Command | Result |
| --- | --- |
| `npm run dev -- --port 5174 --strictPort` | Vite started; production preview at `http://127.0.0.1:4174` served browser checks |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test -- --run` | 112 tests in 7 files passed; includes all 85 Phase 1 tests |
| `npm run build` | Passed; 2,613 modules, largest application chunks 457 kB and 447 kB |
| `npm run test:browser` | Both suites passed: preserved Phase 1 workflows and Phase 2 interactions at 375/768/1024/1440 px |

The production browser pass verified RTL rendering, reload-safe UI settings, search focus and navigation, notifications, real-row table operations and CSV, UI-only form validation/save/delete/discard, all chart variants, keyboard focus in the mobile drawer, no horizontal overflow at all four viewport widths, and A4 print. Screenshots and generated print/CSV examples are in the ignored `artifacts/phase2/` folder. Dashboard and form screenshots were reviewed at mobile and desktop sizes.

A workstation-memory failure occurred when compiler/build and multiple Vitest workers ran together. The test configuration now uses one worker without removing tests or weakening strict types. The complete suite passed after that resource adjustment. Later verification runs are sequenced to avoid unnecessary memory pressure.

## Checklist

- [x] Phase 1 calculation, transaction and persistence tests preserved.
- [x] Urdu RTL document and shared component rendering.
- [x] Right sidebar grouping/collapse and separate preference persistence.
- [x] Functional header/global search and result destinations.
- [x] Store-derived dashboard values and explicitly unavailable financial metrics.
- [x] Real-record search, sort, filters, pagination, visibility, selection and CSV controls.
- [x] RHF/Zod form example with working validation and transient UI record.
- [x] Native dialogs/drawers, feedback and explicit reset confirmation.
- [x] Six demo work profiles with existing staff/role metadata.
- [x] Local light/dark/system preference persistence.
- [x] `/design-system` reference, five chart styles, tabs/accordion and print preview.
- [x] Browser verification at 375/768/1024/1440, keyboard modal behavior and visual review.
- [x] Production build and final lint.
- [x] Final documentation/progress completion.

## Data guarantees and limits

Golden balances remain 600 m grey, 380 m processed, 10 m contractor custody and 10 m loss. Purchase receipt valuation is 25,000,000 paisa for the golden fixture. Dashboard values are recomputed for the active snapshot, not hardcoded to these values. Finished suit stock remains zero; sales/profit/receivables remain unavailable.

Browser tests use fresh isolated contexts and compare the serialized business snapshot before/after UI interactions. They exercise reload preferences, real CSV, form validation/save/discard/delete, charts and A4 print. Native focus behavior and responsive visuals are verified in Edge; exhaustive browser/assistive-technology coverage is outside this phase.

Future operational CRUD, document generation/accounting, production transactions and large seed expansion remain deferred. No new runtime API or backend exists.
