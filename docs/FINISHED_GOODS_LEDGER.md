# Finished goods ledger and warehouse

Historical `history.finishedMovements` and new `finishing.finishedMovements` feed one finished-balance projection. Historical movement/reservation documents remain untouched. Operational finished counts never enter the fabric meter ledger. Balances are keyed by finished lot, SKU, actual core location and ACCEPTED/HOLD/DAMAGED quality.

Legacy stock has an explicit `historical:<sku>` aggregate portion because old dispatches/reservations do not identify individual package lots. Actual historical SKU, packaging and batch references remain accessible; bin/carton/material identities are not invented. The unchanged expanded baseline is 900 packaged - 180 dispatched - 8 disposed damage = 712 physical, with 70 reserved and 642 available. The historic 8 disposed suits are not recreated as physical quarantined goods.

```text
Historical opening physical + new packaging receipts
    + approved net counted adjustments = closing physical

Eligible accepted physical - active historical reservations = available

Available loose stock = available - packed carton membership
```

Cartoned suits remain physically and commercially available, but loose-item transfers, counts and quality changes cannot silently extract carton contents. Unpack or transfer the complete carton. Carton counts are never added to contained suit quantities.

Finished locations reuse core location IDs, warehouse ownership and hierarchy concepts, with version-9 zone/rack/shelf/bin/staging/storage/quality metadata and optional suit capacity. This is separate from meter capacity. Posted putaway/transfers use equal negative/positive effects and preserve total physical stock. Whole-carton transfer updates both location balances and membership location. Inactive/over-capacity occupied destinations are rejected by validation.

Physical counts create immutable system/count/delta evidence, source notes, approval and a scope fingerprint. Posting rejects stale stock/reservation/carton snapshots. Negative adjustments protect reservations and packed contents. Positive excess needs a real original lot plus explicit counted provenance; it does not fabricate a production receipt. Quality reclassification transfers existing counts between accepted, held and damaged states. Nonaccepted physical stock is excluded from availability.

Shared historical reservations are read once and protected across all negative operations. Phase 9 exposes a typed reservation projection and stock-availability functions for Phase 10; it does not create a second sales reservation ledger or customer order workflow.

Independent import validation reconstructs receipt, transfer, adjustment and quality effects and checks exact multiplicity, source/lot/SKU references, nonnegative balances, carton capacity, location capacity and reconciliation. Source document status prevents duplicate posting.
