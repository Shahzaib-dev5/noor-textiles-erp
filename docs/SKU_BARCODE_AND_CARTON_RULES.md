# SKU, barcode and carton rules

Operational SKUs extend the existing `finishedSKUs` catalogue through `finishing.skus`. A sellable identity uses collection/design/variant, suit type, component/fabric specifications, measured quantities/units and required embroidery. Administrative BOM version, lot IDs, rates and waste assumptions are excluded: a cost-only revision reuses the same SKU, while a changed cut specification has a different identity. The original full label specification remains frozen. Creating repeated identical properties or any duplicate company code fails. A new specification with a conflicting generated code requires an explicit distinct SKU code. Codes remain stable when display names change; history is not renumbered.

The SKU detail shows collection, design, color, suit type, frozen fabric widths/composition and actual BOM quantities with their own units. It also shows care instructions where configured, current stock/cost projections and batch/movement links. Unknown historical properties remain unknown rather than acquiring fixed invented cut lengths.

Barcode generation uses the locally bundled [JsBarcode library](https://github.com/lindell/JsBarcode) in Code 128 format. SVG bars encode the actual stable SKU or `NT-CTN-...` carton identifier. Human-readable identifiers are rendered separately. Quiet zones, black bars and a white background are retained for printing. Independent [ZXing](https://github.com/zxing-js/library) decoder tests verify encoded SKU/carton identifiers. Physical printer/scanner combinations still need deployment calibration; no GS1, official GTIN ownership or external barcode registration is claimed.

Carton records itemize actual finished lot/SKU quantities, type, optional measured gross weight, location and notes. Multiple SKUs require explicit mixed-carton permission. Packing checks loose unreserved accepted stock and creates membership only. Unpacking releases membership, not another stock receipt. Packed contents cannot exceed physical available stock.

An optional CARTON material reference consumes one existing counted box on first packing. Its saved consumption remains after unpack/repack, so a box cannot be consumed twice. A carton without that reference records an existing handling container without claiming counted box inventory. Its type and actual suit contents remain explicit.

Example: after packaging 30 suits, two cartons of 12 contain 24 and 6 remain loose. Physical stock remains 30. This preserves both the 30-suit packaging scenario and the 24 cartoned suits; no unexplained 6-suit loss is introduced.

Use `/finished-products/skus`, `/packaging/labels`, `/packaging/cartons` and their source detail/print actions. Product and carton A4 labels carry actual identifiers, source batches and itemized quantities.

SKU metadata editing changes display name, care, reorder level and target price without rewriting code, identity or finished lot costs. Deactivation is blocked while physical stock or open packaging depends on it. Product labels require selection of an actual packaging lot when more than one exists.
