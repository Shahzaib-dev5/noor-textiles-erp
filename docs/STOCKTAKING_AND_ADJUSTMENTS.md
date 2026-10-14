# Stocktaking and adjustments

Stocktake workflow: DRAFT → IN_PROGRESS → SUBMITTED → REVIEWED → APPROVED → POSTED. Preposted documents may be cancelled. Count records never directly edit inventory.

The source location and optional fabric/lot/roll scope create system-quantity snapshots. Known rolls become individual count lines; historical unassigned lots use exact aggregate count lines. Counted meters, inspector notes and variance remain separate from the original measurement. Missing counts prevent submission.

The scope fingerprint includes immutable movement IDs/quantities and reservation IDs/statuses/remaining quantities. Any intervening posting or reservation change in the scoped location invalidates posting, even when a balanced transfer would later restore an equal quantity. Cancel and create a new count; there is no silent recount or overwrite. This is a conservative scope policy, including other affected lots within the same location/fabric scope.

Posting an approved count creates one linked approved adjustment per nonzero variance and corresponding source-checked ledger effects in one commit. No variance creates no stock effect. Repeat posting fails. A count of 97.5 m against 100 m creates exactly −2.5 m after approval/posting. Positive counted excess requires approved count provenance. Negative differences must still respect reservations and exact eligible stock.

Manual adjustment workflow: DRAFT → APPROVED → POSTED, or CANCELLED before posting. Quantity is an explicit signed delta, with reason and provenance; original system quantity and expected quantity are displayed. Posting rechecks current source availability, roll identity, active location, compatibility/capacity and approval. The manual delta applies to posting-time physical stock; use a stocktake when an absolute physical-count reconciliation is required.

Quality-location adjustments require a specific active hold. Gains or write-offs remain attributed to that hold; releasing it restores only its adjusted remainder. Quality stocktakes can attribute variance only when one unambiguous matching hold exists; otherwise create a separate explicit hold-linked adjustment. Ordinary transfers cannot bypass quality controls.

Owner is the simulated approving/reviewing role. Warehouse staff can manage receiving/transfer/count/hold operations; purchase can create reservations. Command permissions are validated, but no real authentication, financial security or backend locking exists.
