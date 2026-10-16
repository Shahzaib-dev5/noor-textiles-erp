# Packaging workflow

Packaging orders reference a posted matching batch and a compatible stable SKU with the same frozen product specification. Approval reserves accepted unpackaged sets for that order. Drafts do not reserve or create finished stock. Order states are DRAFT, APPROVED, MATERIALS_ALLOCATED, IN_PROGRESS, PARTIALLY_PACKED, COMPLETED and CANCELLED.

Define a positive whole-count recipe: polybags, product cards, brand/barcode labels, packing paper, tape rolls or another counted material. Recipes are configurable and must be explicitly acknowledged. Counted material masters carry a unit, ASSEMBLY/PACKAGING purpose, supplier, default estimate, reorder threshold and active state. Creating a master creates no stock.

Initial stock and receipts are explicit documents with quantity, actual unit price, unique reference, owner approval and posting. Active allocations reduce free material availability without reducing physical stock. Approved waste may use only unallocated material. Material units never become fabric meters.

Completion is explicit per session. After approval, posting validates the order's remaining quantity, its own reserved accepted sets, active destination and all allocated recipe quantities. It then atomically:

1. Moves accepted sets to PACKAGED.
2. Consumes the exact allocated material quantities.
3. Records frozen inherited, material, labor and overhead costs.
4. Creates one finished lot and one posted receipt.
5. Appends one signed finished-stock receipt effect.

The partial policy is all-or-nothing for the entered session quantity. Insufficient material rejects the entire posting; the operator may explicitly enter a smaller session. No automatic quantity reduction or partial hidden posting occurs. Several sessions may complete one order while retaining one SKU identity and distinct traceable lots.

Unused allocations can be released. Cancellation is allowed only before any output and after pending completion drafts are resolved. Posted completions cannot be replayed. `/packaging/orders`, `/packaging/materials`, `/packaging/materials/receipts`, `/packaging/materials/allocations` and `/packaging/completions` expose the connected workflow.

Carton preparation happens after receipt and records membership in existing finished stock. Optional counted carton boxes are consumed once per carton identity; unpacking/repacking does not invent a new box or suit. Its warehouse handling cost is reported separately from the immutable manufacturing receipt valuation.
