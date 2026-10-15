# Phase 7 acceptance — Design Studio

Branch: `phase-07-design-studio`; baseline `7453214`. Updated: 2026-10-15, Asia/Karachi.

Status: **complete and verified**. Only executed results below are evidence of a pass.

## Implemented scope

Central optional version-7 studio metadata reuses the core design catalogue. Seasonal collections, controlled design states, two/three-piece configurations, color variants, revisioned BOMs, source-aware processed material planning, prototype requests/reviews, structured cost assumptions, readiness, duplication, catalog, dashboard, nine reports, search/alerts, CSV and six Urdu A4 sheets are interactive and persisted. Previous seeds and history stay unchanged; no Phase 8 work-order/cutting/stock transactions are added.

## Routes

All nineteen requested routes plus the activity detail route are implemented:

```text
/designs
/designs/new
/designs/:id
/designs/:id/edit
/designs/:id/duplicate
/designs/:id/colors
/designs/:id/bom
/designs/:id/samples
/designs/:id/costing
/designs/:id/availability
/designs/:id/activity
/collections
/collections/new
/collections/:id
/collections/:id/edit
/designs/samples
/designs/samples/new
/designs/approvals
/designs/material-planning
/designs/reports
```

Existing `/designs?record=<id>` links also remain readable. Historical design/BOM/collection/variant IDs are retained.

## Verification

- Baseline: **255 tests in 13 files passed**, 124.16 seconds.
- Final full tests: **293 tests in 15 files passed**, exit 0, 127.17 seconds. All original 255 tests remain; Phase 7 adds 34 domain tests and 4 UI integration tests, including BOM deep links and inactive-demand exclusion.
- Final focused rerun: **38 tests passed**, 29.14 seconds, including the final material metadata projection.
- Final production build: **passed**, exit 0, 2,662 modules, 11.33 seconds. Studio route chunk 68.24 kB, entry 323.36 kB, charts 434.74 kB, React/router 263.85 kB; no chunk-size warning.
- Combined `npm run test:browser`: **all seven suites passed**, exit 0. Phase 7 A–H includes real Phase 6 source-lot creation, collection/design relationship, three source-matched colors, V1/V2 immutability, shortages, sample revision/review, 1,500/2,000/25% estimates, ready designation, stock neutrality, six A4 PDFs, CSV, duplication, reload, four widths and both themes, and preserved expanded history.
- Phase 7-only rerun after color/deep-link refinements: **passed**, exit 0; explicitly rejects a Maroon lot on a Black variant without persisting the invalid record and opens the correct variant from a BOM search link. A subsequent display-only quality-grade refinement passed its targeted browser check on the final build: unknown grades stay explicit, expanded grades match source profiles, and 375px RTL has no root overflow.
- Strict TypeScript: **passed** with the final production build. Final ESLint: **passed**, no errors or warnings. `git diff --check`: passed.
- An intermediate full run had one cold purchasing-route UI timeout; its unchanged eleven-test suite passed separately and subsequent full 291- and 293-test suites passed. No prior assertion or timeout was weakened.

Verification artifacts are local ignored files under `artifacts/phase7*`; they are not application data. Failed intermediate checks are not counted as successful final verification.

Logs: `phase7-unit-tests.log`, `phase7-focused-tests.log`, `phase7-build.log`, `phase7-lint.log`, `phase7-browser-suite.log`, `phase7-browser.log` and `phase7-material-grade.log` under `artifacts/`. Screenshots, six A4 PDFs, CSV and browser results are in `artifacts/phase7/`.

The registry contains **142 unique routes, 117 implemented**, including all 20 studio routes. Documentation links and code fences passed across 44 Markdown files. No dependencies or deterministic seed definitions changed.

## Models, services and files

`domain/entities/design-operations.ts` defines strict additive collection/design-profile/variant/BOM/sample/review/cost/approval/event contracts. `services/transactions/designs.ts` validates typed commands before one central store commit. `services/validation/designs.ts` checks import/reload relationships and approval snapshots. `services/designs/planning.ts` supplies requirements, eligibility, shared preview allocation, source costing and readiness. The existing numbering utility adds design/BOM/sample prefixes.

`features/designs/DesignStudioPage.tsx`, `DesignEditor.tsx`, `StudioMetrics.tsx`, `print.ts` and `labels.ts` compose shared forms/tables/dialogs/charts and local pattern art. Router/registry, global search/alerts, company dashboard, processing collection picker and persistence validators integrate them. Existing fixture definitions and transactions are preserved. The historical count test changes only its extension-exclusion TypeScript type.

## Boundaries and handoff

Historical designs remain read-only; duplicate to make an operational draft. Seasons use a controlled vocabulary. Accessories are planning-only and availability-untracked. Samples consume no fabric. Each approved variant requires its own BOM/sample; stock shortages are shown but do not forbid a ready product definition when eligible material exists. No automatic reservation, production order, cutting, panel embroidery inventory, finished-suit creation, actual profit or financial posting occurs.

Submitted BOMs have no withdrawal action. Approved definitions require opening design revision before edits. Costs distinguish source evidence and editable assumptions; unpriced items require explicit acknowledgement. Local sample images are quota-limited. Multi-tab/localStorage and simulated permissions retain existing demo limitations.

Phase 8 must create explicit plans/work orders bound to immutable approved BOM IDs, then use validated reservation/issue/consumption transactions. Preserve past revisions/samples, source color/lot identity, historical production references, and unit/money separation. See [workflow](DESIGN_STUDIO_WORKFLOW.md), [collection rules](COLLECTION_MANAGEMENT.md), [BOM revisions](BOM_AND_REVISION_RULES.md), [sampling](DESIGN_SAMPLING_AND_APPROVAL.md) and [costing/availability](DESIGN_COSTING_AND_AVAILABILITY.md).
