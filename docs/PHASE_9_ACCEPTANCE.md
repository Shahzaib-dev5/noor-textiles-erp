# Phase 9 acceptance - matching, packaging and finished goods

Status: **complete and verified** (2026-10-16, Asia/Karachi). Branch `phase-09-finished-goods`, baseline `1e6ba3f` (committed Phase 8). No backend, database, authentication service, paid service or payment gateway was added.

## Prerequisites and preservation

Phase 8 acceptance, production entities, frozen BOMs, component custody, QC/rework, costing and transaction code were inspected before implementation. Actual Phase 8 accepted stock feeds assembly; historical production batches are never turned into invented components. Baseline tests ran before edits: 323 of 326 passed initially with three timing failures; all 47 tests in the affected three files passed with a longer timeout. Assertions were retained. Test/async limits accommodate the observed workstation timings.

The optional strict version-9 finishing extension retains the schema-1 storage envelope. Old snapshots without it remain losslessly valid and incur no view-time write. Explicit commands initialize it. Existing seed definitions, historical source records, financial documents and separate UI preferences remain unchanged. Import validates complete source effects and conservation before replacing state.

## Implemented screens and operations

| Area | Entry points | Implemented behavior |
| --- | --- | --- |
| Assembly | `/assembly`, `/assembly/dashboard`, `/suit-assembly` | Actual metrics, six charts, shortages and source navigation |
| Plans/components | `/assembly/plans`, `/assembly/components`, `/assembly/reservations`, `/assembly/issues`, `/assembly/returns` | Draft editing, submit/approve/start/complete/cancel, exact accepted-lot reservation, release, approved issue and controlled WIP return |
| Matching | `/assembly/matching`, `/assembly/incomplete` | BOM-derived mandatory requirements, partial matching, actual input consumption, mismatch evidence and valid correction |
| Final quality | `/assembly/quality-control`, `/assembly/rework` | Exclusive set states, reinspection, correction costs and real replacement return/scrap disposition |
| Packaging | `/packaging`, `/packaging/orders`, `/packaging/completions` | Accepted-set reservation, configurable recipe, explicit partial completion and atomic receipt posting |
| Materials | `/packaging/materials`, `/packaging/materials/receipts`, `/packaging/materials/allocations` | Counted masters, explained openings/receipts, approval/posting, allocation/release and controlled waste |
| Product identity | `/finished-products`, `/finished-products/skus`, `/packaging/labels` | Stable sellable identities, metadata edits, frozen actual BOM labels, batch selection and offline Code128 |
| Cartons | `/packaging/cartons` | Itemized lots, explicit mixed-SKU permission, pack/unpack and whole-carton transfer; optional counted box consumed once |
| Finished warehouse | `/inventory/finished`, `/lots`, `/locations`, `/transfers`, `/adjustments`, `/quality-holds`, `/movements` | Source lots/receipts, putaway, balanced transfers, approved stale-safe counts, quality isolation and signed history |
| Cost/reports | `/finished-goods/costing`, `/finished-goods/reports` | Frozen recorded/estimated costs, exact-paisa valuation, seventeen report choices, filters, pagination, CSV and A4 |

The warehouse suffixes in the table are relative to `/inventory/finished`. [Route map](ROUTE_MAP.md) lists every actual create/edit/detail path. Shared dialogs provide remaining document actions. Dashboard, global search, notifications and source links read the same persisted state. Every actionable control has a transaction, navigation, export, print or form action.

## Quantity and transaction evidence

- A: genuine 100/80/70 accepted components preview 70 three-piece sets. Reserving changes availability only. Matching 50 consumes exactly 50 counts of every mandatory BOM component; incomplete components remain assembly WIP.
- B: a separate actual two-piece design/production source matches shirt and trouser only. Missing mandatory lines and incorrect units are rejected in domain tests. Compatibility preserves design, variant, frozen source BOM, specification, accepted quality and configured embroidery requirements. Different fabric lines may originate in different lots.
- C: final QC partitions 50 into 45 accepted + 3 held + 1 rejected + 1 rework. Fresh reinspection of the corrected set releases it without adding matched output. Replacements consume actual WIP and explicitly return or scrap the removed component.
- D/G: packaging 31 against a 30-set order and posting without allocated materials fail visibly without changed balances. Posting 30 consumes 30 of each configured material and creates one 30-suit finished lot/receipt. Duplicate posting is rejected. Partial sessions are explicit and atomic for the entered quantity.
- E: two cartons of 12 contain 24 of the 30 packaged suits, leaving 6 loose. Physical stock stays 30. The brief's 24-cartoned example is a subset of its 30-suit completion, without an unexplained six-suit loss. Unpack/repack cannot duplicate either suits or a counted box.
- F: transferring 10 changes source/destination bins while total new finished physical stock stays 30. Over-transfers, stale counts, historical reservation consumption, invalid source lineage and duplicate effects are rejected. Two damaged suits remain physical but unavailable.
- H: explicit original expanded reset restores 900 packaged - 180 dispatched - 8 historically disposed damage = 712 physical; 70 reserved and 642 available. Original 5501m contractor custody and 800 rolls remain unchanged. No finishing extension or additional posting is fabricated by reset.

Before quality quarantine, the combined demonstration has 712 historical + 30 new = 742 physical, 70 reserved and 672 available. After quarantining two new suits, physical remains 742 and available becomes 670. Cartons are a membership subset, not a second quantity. Unit tests additionally verify downstream handoff from a closed production order without changing its frozen snapshot.

## Costing and identifiers

Source cost freezes at issue, matching and completion; counted materials use exact moving-average consumption. Rework cost is carried once, reusable removal returns attributable value and scrap remains absorbed. Material/dyeing/printing/finishing amounts inherited upstream are not added again. Recorded, estimated and incomplete-source evidence remain separate. Later rates and SKU display edits do not recost posted lots. Largest-remainder allocation conserves every paisa across location/quality splits. Historical batch estimates are apportioned once across packaged SKU quantities. Counted carton handling cost remains separate from manufacturing receipt value.

SKU identity includes actual sellable specifications, quantities, units and embroidery requirements; cost-only BOM revisions and lot/rate changes reuse the SKU. Codes and original label specification stay stable during metadata edits. Changed product specifications require a distinct identity/code. JsBarcode is bundled locally; independent ZXing Code128 decoding tests check real SKU/carton payloads. Product labels use actual cut lengths, optional care instructions and a selected actual packaging batch. No GS1 registration or GTIN ownership is claimed.

## Verification evidence

- Strict TypeScript and lint have passed; final logs are `artifacts/phase9-typecheck.log` and `artifacts/phase9-lint.log`.
- Production build has passed; `artifacts/phase9-build.log` records the final rebuild.
- Final automated run: **374/374 tests in 19 files passed** in 390.89s (`npm run test -- --run`, `artifacts/phase9-final-tests.log`): all 326 previous tests plus 44 Phase 9 domain tests and 4 integration tests. This includes explicit start-state preservation, closed-production handoff, exact-paisa valuation, stable SKU identity, Urdu rendering, persistence and independent barcode decoding. The earlier full extended run also passed 373/373 before the last regression was added.
- **All nine Edge browser suites passed** (`npm run test:browser`, `artifacts/phase9-browser-suite.log`). Phase 9 A-H, invalid operations, CSV, JSON round trip/preferences, refresh, eight A4 PDFs and 375/768/1024/1440px light/dark RTL checks passed with no page errors.
- Final Phase 9 rerun after the Urdu status/unit label correction **passed** (`node scripts/browser-phase9.mjs`, `artifacts/phase9-browser-final.log`). It explicitly checks Urdu stock cells and regenerated all eight PDFs, eight screenshots and exports. `artifacts/phase9/results.json` reports `passed: true` and zero page errors.
- Mobile dark and desktop light screenshots were visually inspected. Seventeen updated/new documentation files have valid local links; whitespace checks pass.

Generated evidence is under `artifacts/phase9/`: `results.json`, operational JSON export, numeric CSV, eight A4 PDFs and eight viewport/theme screenshots. Independent barcode decoding establishes digital payload correctness; physical printer/scanner calibration remains deployment work.

## Files and documentation

The implementation adds `domain/entities/finishing.ts`; `services/transactions/finishing.ts`; `services/validation/finishing.ts`; `services/finished-goods/{effects,inventory,costing,sku,barcode}.ts`; `store/selectors/finishing.ts`; `features/finishing/{FinishingPage,FinishingEditor,FinishingMetrics,Barcode}.tsx`; fixture/unit/integration tests and `scripts/browser-phase9.mjs`. Shared schemas/validators, existing component effects, finished inventory selectors, router/registry, dashboards/search/alerts, print CSS, packages and browser-suite registration are extended in place. Earlier assertions remain intact.

Business documentation: [matching workflow and diagram](SUIT_MATCHING_WORKFLOW.md), [component rules](ASSEMBLY_COMPONENT_RULES.md), [set QC/rework](FINAL_SUIT_QUALITY_CONTROL.md), [packaging](PACKAGING_WORKFLOW.md), [finished ledger](FINISHED_GOODS_LEDGER.md), [SKU/barcodes/cartons](SKU_BARCODE_AND_CARTON_RULES.md), [costing](FINISHED_GOODS_COSTING.md) and [contract assessment](FINISHED_GOODS_CONTRACT_ASSESSMENT.md). README, architecture, data model, inventory rules, workflows, route map and both progress documents are updated.

## Intentional limits and Phase 10 handoff

Frontend/localStorage demonstration only. A matching plan uses one original production order; it can consume different fabric-component source lots within that order. Configured embroidery proof conservatively requires a whole identified lot issued to the service and physical returns, rather than inventing identities for partly embroidered mixed portions. Historical aggregate stock has no fabricated individual carton/material/bin lineage; historical or unresolved cost estimates remain qualified. Counted recipes use whole quantities in their configured units.

No complete customer sales-order workflow, new sales reservation ledger, dispatch lifecycle, invoicing, backend or accounting server is introduced. Phase 10 should use the unified source-aware finished availability and typed reservation projection, preserve existing historical reservations, exclude held/damaged stock and carry lot/SKU/carton identity and qualified costs forward. Await its authorized brief.
