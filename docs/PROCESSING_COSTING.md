# Processing costing

Rate cards support METER, YARD, KILOGRAM, PIECE, SUIT, PANEL and BATCH. Length rates use an explicit ISSUED, ACCEPTED or RETURNED meter basis; yard charges convert those meters by 0.9144. Other units require SERVICE_QUANTITY and an explicit matching service quantity on the job. That count affects charges, not fabric inventory units.

A job snapshots the complete agreed rate card, including minimum charge, additions and validity. Editing the rate card does not reprice existing jobs. Job dates must be within the selected active rate's validity.

```text
Base = max(minimum charge, chargeable quantity × agreed unit rate)
Bill = base + rate-card additions + explicit bill additions − discount − credit
```

Money is integer paisa; multiplication rounds once using scaled quantity and BigInt. Unsafe or negative monetary results are rejected. For 500 m × PKR 35, base is PKR 17,500. Meter quantities cannot be multiplied by panel rates.

Billing uses one complete service settlement per job after all its planned issues and accountable custody are complete. A draft bill locks its charge quantity and rate. Post the bill explicitly; cancelled drafts can be replaced. Duplicate posted service billing is blocked. Progressive partial-job invoicing is not provided.

`processingOutputCost` derives source material cost and prior-stage cost recursively from parent/root lineage, then apportions the current stage's charge across physical output. Accounted returned material and recognized stage loss are absorbed by the physical outputs; a partial receipt does not absorb the material cost of fabric still held by the contractor. At full settlement this allocates the complete issued source cost. It uses a posted bill when present, otherwise the agreed calculated service estimate; those estimates are not posted payables. Rejected/held physical output remains part of allocation. Rounded per-output estimates are informational and can carry paisa rounding differences across output portions; no general accounting journal or finished-suit cost allocation is created.

Full cutting, panel embroidery consumption, finished-suit allocation and production costing remain the Phase 7–8 handoff.
