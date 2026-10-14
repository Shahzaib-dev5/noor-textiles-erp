# Phase 1 acceptance

Date: 2026-10-13 (Asia/Karachi).

**Current result: Phase 1 complete.** All required checks were executed successfully. The production build also passed a real Microsoft Edge browser smoke test at desktop and mobile viewport sizes. Later operational phases remain unimplemented.

## Required command results

| Command | Result | Evidence |
| --- | --- | --- |
| `npm install` | Passed | Final dependency installation completed, including optional browser-test tooling; 334 packages audited with zero vulnerabilities |
| `npm run dev -- --port 5174 --strictPort` | Passed | Vite 6.4.4 ready; `/dashboard` HTTP 200 with Urdu RTL HTML and React entry. Port 5173 was occupied and left untouched. |
| `npm run typecheck` | Passed | Strict TypeScript compilation, exit 0 |
| `npm run lint` | Passed | Final ESLint run, exit 0; no errors or warnings |
| `npm run test -- --run` | Passed | Vitest 4.1.11: 5 files, 85 tests passed, exit 0 |
| `npm run build` | Passed | TypeScript + Vite 6.4.4, 2,581 modules; production output in `dist/`, exit 0; no large-chunk warning after lazy route splitting |
| `npm run preview -- --port 4174 --strictPort` | Passed | Production `/dashboard` responded HTTP 200 |
| `npm run test:browser` | Passed | `NOOR_BASE_URL=http://127.0.0.1:4174`; real headless Microsoft Edge; all assertions passed and no browser console/runtime errors |

## Acceptance checklist

| Requirement | Evidence target | Result |
| --- | --- | --- |
| React application starts | Vite startup on 5174 and `/dashboard` HTTP 200 | Passed |
| Strict TypeScript | `tsconfig.json` strict mode and successful compilation | Passed |
| Urdu RTL direction and shell | HTML attributes, DOM test and desktop/mobile browser rendering | Passed |
| Main navigation | Dashboard, future detail route and mobile sidebar navigation | Passed |
| All planned routes | Reviewed typed registry with 42 entries; 4 working foundation routes, 38 phase-labeled future routes | Passed |
| Models and relationships | 83 documented entity/projection/state interfaces, 25 normalized active collections, strict validation | Passed |
| Goods receipt correct | Posting, multiple items, cumulative multiple GRNs and duplicate rejection | Passed |
| Processing issue correct | Paired transfer, multiple lots and combined same-lot demand validation | Passed |
| Partial receipt correct | Partial, subsequent full and loss-only settlement tests | Passed |
| Explicit approved loss | Separate loss record, reason/approval and movement tests | Passed |
| No negative stock | Over-issue and dishonest historical-balance tests; original state retained on failure | Passed |
| No duplicate effects | Reposting GRN/challan/receipt rejected | Passed |
| Live dashboard totals | Actual store-derived 600/380/10/10 values in DOM and browser tests | Passed |
| Persistence and refresh | Serialization, fresh store hydration and real browser reload | Passed |
| Deterministic reset | Unit/integration assertions and explicit browser reset restore original domain data | Passed |
| Corrupt/import safety | Malformed schema, orphan/missing/tampered movements, prototype-key IDs and unsupported versions rejected | Passed |
| Tests pass | 85 tests in 5 files plus production browser smoke | Passed |
| Lint/build pass | Final executed commands exit 0 | Passed |
| Architecture documents | Assessment, architecture, 20 workflows, data model, inventory, 42 routes, demo strategy, progress and acceptance | Complete |
| Implementation checklist | Root and canonical progress documents updated to verified completion | Complete |

## Required automated coverage

The executed suite covers meter/yard conversion; measured roll/thaan lengths; GRN posting and duplicate rejection; processing issue; negative stock; partial receipt; explicit loss; contractor reconciliation; inventory category separation; seed consistency; localStorage serialization/deserialization; reset; invalid imports; valid/invalid document transitions; monetary rounding; RTL shell rendering; and a navigable foundation dashboard.

Additional passing boundary cases include multi-line combined demand, cumulative receipt overage, invalid references, tampered movement history, stale browser snapshots, write failure, corruption recovery, isolated-scenario state independence, protected callback input, prototype-key references and arithmetic overflow. Future transaction contracts are documented boundaries, not claims of tested operational production/sales/accounting modules.

## Real browser evidence

The production build was tested in fresh isolated browser contexts; no existing user browser data was modified. Assertions covered:

- Desktop Urdu RTL dashboard and expected stock values.
- All three diagnostic transactions, duplicate-action disabling, scenario reset and unchanged main snapshot.
- Browser reload without duplicate seed insertion.
- JSON download, invalid import rejection, valid import surviving reload and explicit reset.
- Mobile 390 × 844 viewport: sidebar open/navigation/close, Escape focus restoration and no horizontal page overflow.
- Corrupt localStorage preservation with a visible recovery notice.
- No console errors or uncaught browser exceptions.

Desktop/dashboard, diagnostics and mobile screenshots were visually inspected and are generated under ignored `artifacts/`. The initial missing favicon was fixed before the successful final run. The browser command uses an installed Microsoft Edge; it does not install a browser or add an application backend.

## Golden acceptance equations

```text
purchase receipt = 1,000 meters
processing issue = 400 meters
processed output = 380 meters
approved loss = 10 meters
contractor held = 400 − 380 − 10 = 10 meters
grey warehouse = 1,000 − 400 = 600 meters
600 + 380 + 10 + 10 = 1,000 meters
finished suits = 0
```

## Manual verification limits

Desktop/mobile Edge behavior and screenshots were checked. Firefox, Safari, physical mobile devices and exhaustive assistive-technology testing were not performed. Browser/storage security and real concurrent inventory custody remain outside frontend-demo guarantees. There are no known blocking Phase 1 issues; future features and the full seed-data expansion remain deferred by design.
