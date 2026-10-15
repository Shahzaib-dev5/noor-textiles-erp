# Work orders and frozen BOMs

A plan requires an approved operational design, approved color variant, approved BOM, collection, positive integer suit target, dates, priority and active production manager. Historical designs do not acquire operational approvals automatically.

Plans move DRAFT → SUBMITTED → APPROVED → CONVERTED. Rejection and cancellation are explicit actions. A plan converts once. The plan stores the BOM content and fabric width/composition snapshot; the order copies that exact snapshot. Future revisions leave existing orders on their approved version. Editing is limited to drafts.

Order progression is derived from actual reservations, material issues, cutting, embroidery custody and QC. Partial reservations are supported. COMPONENTS_READY requires enough internally accepted components for every mandatory fabric line, no remaining meter WIP, no unused reservations, no open rework, no pending component custody/quality, and no open transaction drafts. CLOSED follows reconciliation and COMPONENTS_READY.

Cancellation releases unused reservations but cannot erase issued fabric or components. WIP must be explicitly returned or consumed. Components require explicit, permitted disposition. Posted source documents cannot be posted twice or edited to replay movements. Invalid operations leave the previous persisted snapshot intact.

Two-piece orders require shirt (or its defined front/back/sleeve components) and trouser; three-piece orders also require dupatta. Complete component sets use the minimum accepted quantity across mandatory fabric lines, capped at the order target. This is readiness information, not finished-suit stock.

Owner and production roles handle production workflows. Warehouse handles linked reservations and material operations; QC acceptance on embroidery receipts requires owner/production. Owner approves extra consumption, scrap and disposal. Accounts/owner post actual service bills and expenses. These are demonstration UI permissions, not server authentication.

Phase 9 should consume eligible accepted component balances through new explicit source documents, extend expected count effects in the same validated snapshot, and post finished suit quantities only after assembly/packaging inspection. It must preserve closed order snapshots and historical finished production; a readiness total is a calculated limit, not a posting document.
