# GRN and measured-roll receiving

Meters are canonical, with four decimal places. One yard is exactly 0.9144 m. Each roll or thaan uses its individually measured length; no fixed container-length conversion exists. PO profiles preserve purchase unit, original quantity and measured container lengths while existing core PO lines retain canonical meters and per-meter paisa rates.

GRN inspection stores original measured length/unit, canonical meters, roll number, source PO line, width in inches, grade, packaging unit, storage location, remarks, result and resolution. Original lengths are retained; stock remaining after return is calculated from movements, not by overwriting the initial measurement.

**Tolerance is zero** after explicit per-roll conversion and four-decimal rounding. Accepted GRN quantity is the sum of accepted measured rolls grouped by PO line. Accepted receipts cannot exceed the approved line quantity less earlier posted accepted receipts. Rejected and quarantined lengths remain explicit inspection records, excluded from accepted receipt quantity, PO received balance and available stock. An all-rejected delivery can be posted as inspection evidence with zero receipt lines and no inventory movement.

Draft receiving creates no inventory movement. Posting validates eligible PO status, closed/cancelled state, company/foreign keys, measurements and location; the original Phase 1 goods-receipt reducer produces accepted stock effects. A second posting fails. A cancelled or closed PO cannot accept a draft receipt posted later.

For a 1,000 m order, posted accepted GRNs of 400 m and 350 m leave 250 m receivable and PARTIALLY_RECEIVED status. A 250.0001 m accepted next receipt fails. Rejected quantities do not consume the order's accepted remaining quantity.

Returns are compensating negative GREY movements linked to original GRN line, lot, location and optional known roll. They cannot exceed received quantity, original roll quantity less prior identified returns, or current available stock. Historical issues with unspecified roll custody and previous lot-level returns forbid later roll-specific returns; aggregate lot returns still respect available stock. This conservatively avoids inventing individual roll custody.

PO reconciliation: `ordered − posted accepted receipts = remaining receivable`.

Lot reconciliation: `posted accepted receipts + valid incoming events − valid issues − posted returns − valid outgoing events = physical stock`, with availability additionally excluding reservations. Existing processing/production losses retain their original movement/accounting rules. Global material conservation now includes supplier-returned meters as a separate outgoing quantity. Warehouse totals are never directly edited.

Grey warehouse transfers, adjustments and enhanced processing custody belong to Phase 5. Receipt draft locations and their lots are traceability records, not proof of posted stock.
