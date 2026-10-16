# Assembly component rules

A plan references one valid operational production order and its frozen collection/design/variant/BOM specification. Every frozen fabric BOM line is mandatory. This includes separately defined shirt-front/back/sleeves, panels or borders; there is no global three-field assembly shortcut.

Phase 8 output counts represent one completed fabric BOM-line component per PIECE/PANEL/SET. Consequently each fabric requirement consumes one such count per suit. Meter consumption is already embodied in cutting; 2.7 shirt meters must not be interpreted as 2.7 shirt panels. Two-piece BOMs omit dupatta; three-piece BOMs require it. Additional mandatory fabric lines are included automatically.

Counted accessory BOM lines require an explicit ASSEMBLY material mapping with the same unit and BOM quantity per set. Valid opening/receipt documents establish accessory stock. Phase 8's untracked-accessory acknowledgment is not inventory evidence. Matching consumes the aggregated actual accessory recipe, with no repeated material capacity.

Compatibility requires the same production source, design, variant, approved frozen BOM and count unit. Different components may come from different original fabric lots. Neck-embroidery fabric components require embroidery proof; other requirements can explicitly require it. For an embroidery-qualified lot, a posted job must have issued the whole identified component lot and have physical returns. Mixed partly embroidered/partly raw portions without separate identities are conservatively ineligible for that requirement; create distinct cutting lots for separate service portions. Held, rejected, scrap and contractor-held counts never count as free accepted stock.

Reservations reduce availability without changing physical counts. An issue consumes only its own plan's reservation, then moves accepted counts from `production:<order>` to `assembly:<plan>`. Actual matching moves counts into `ASSEMBLY_CONSUMED` at `matched:<batch>`, retaining original component IDs. This extends the existing Phase 8 component ledger; no parallel component total is maintained.

Returns move unconsumed assembly WIP back to its original production custody. Rework replacement uses explicitly issued compatible components and a controlled return or scrap disposition for the removed component. An optional rework-linked reservation allows replacement quantities after the original matching target is exhausted, bounded by the correction quantity per BOM line. It cannot authorize additional assembled output.

```text
Issued components = original matching consumption
                  + replacement inputs
                  + unconsumed assembly WIP
                  + explicit returns

For each matched batch and mandatory fabric line:
current consumed component count = matched sets x per-set requirement
```

Shared movement effects are reconstructed from source documents. Component totals remain conserved per original lot, unit, quality and custody. Closed production snapshots remain unchanged when approved components are handed downstream.
