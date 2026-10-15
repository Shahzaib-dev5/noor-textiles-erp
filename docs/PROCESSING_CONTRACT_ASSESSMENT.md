# Phase 6 contract assessment

Inspected the Phase 1–5 domain, validators, persistence, route registry, purchasing and warehouse transactions before extending them. The baseline branch is `phase-06-processing` at `a6caa48`; the working tree was clean. All 220 baseline tests passed.

Existing gaps: processing issues accept only grey sources; receipt output stays on the original purchase lot; job IDs are rejected; contractors have no operational contact profile; rates, jobs, output characteristics, returned-fabric QC and contractor finances lack persisted contracts. Historical custody already derives from posted challan/receipt lines and must remain authoritative.

Implementation direction: add an optional version-6 processing document extension, retaining the existing persistence envelope and shared movements, challans, receipt lines and loss records. Output lots retain original GRN lineage plus explicit parent/output provenance. New processing document effects are independently reconstructed during full-state validation. Existing records are not migrated, reposted or automatically replaced. Grey roll allocations continue to use Phase 5 availability; returned physical quantity includes accepted and unavailable returned portions exactly once. Non-length service charges require explicit matching service quantities; panel production inventory remains a later-phase responsibility.
