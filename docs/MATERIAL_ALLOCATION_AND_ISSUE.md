# Material allocation and issue

Required meters = frozen BOM meters per component × target suits × (1 + waste percentage / 100) + owner-approved extra meters. Quantities use the shared four-decimal convention. A 2.7m shirt line for200 suits with10% allowance requires594m.

Availability uses real processed-fabric stock, active fabrics/lots/locations, frozen width/composition, pinned lots and variant color/shade policy. Other reservations reduce availability. Held, grey, rejected, contractor-held and production-WIP fabric are not eligible. Shared preview capacity is consumed once across lines, with pinned lots first; a preview does not reserve anything. Existing order reservations are displayed separately. Accessories are explicitly untracked; order approval requires acknowledgment.

Reservations reuse Phase 5 reservation profiles with `workOrderId`, `bomLineKey` and consumed issue references. Physical stock stays unchanged; available stock decreases. Partial reservations and releases are explicit. Production reservations cannot be consumed by a fabric processing challan.

An issue draft references the same order's active reservation and cannot exceed remaining reservation capacity, including other issue drafts. Posting moves processed meters to the order's WIP location and consumes the reservation once. It snapshots source unit cost and cost provenance. It checks physical/available stock, material specifications, color and ownership again at posting.

Recoverable leftovers and explicit WIP returns move meters back to the original lot/location. They reduce net issued requirements; no automatic re-reservation occurs. Scrap and actual cutting consumption are separate effects. Every signed meter effect references its real source document and issue. Full-state validation independently reconstructs expected effects.

Individual roll references are optional and accepted only where actual processed-location roll movements establish identity and capacity. Historical aggregate output remains lot-traceable with roll identity explicitly unknown; no roll measurements are invented.
