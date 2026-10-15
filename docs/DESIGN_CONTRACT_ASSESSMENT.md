# Phase 7 contract assessment

Inspected clean branch `phase-07-design-studio` at `7453214`, the Phase 6 baseline. Existing core designs have stable IDs and basic suit configuration. Phase 3 owns immutable historical collections, variants, BOMs and production references; no operational approval or revision metadata exists. Phase 6 outputs have lot lineage, color/batch metadata and cumulative material cost. Shared inventory selectors already subtract reservations and historical production consumption.

Extend the existing domain snapshot with optional `studio.version: 7`. Reuse `data.designs` as the single design catalogue. New collection, variant, revision, sample, costing and approval records live in that validated extension; historical collections and variants remain readable through unified selectors. Historical designs are read-only and can be duplicated into a new controlled draft. Never fabricate historical approval events or replace original BOM references.

Planning is stock-neutral. Availability uses eligible processed balances with exact lot/color matching and shared demand allocation to prevent repeated BOM lines counting the same stock twice. Accessories remain explicitly untracked planning lines. Approved revisions retain immutable approval snapshots; new versions supersede the previous approval only when approved. Sample approval is bound to an exact BOM revision. Cost estimates remain separate from financial actuals.

Persistence retains envelope schema 1: absent studio metadata needs no rewrite. New optional records are validated on transactions, import and reload. UI preferences and existing deterministic seeds remain unchanged. Baseline and final verification results are recorded in Phase 7 acceptance when executed.
