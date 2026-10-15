# Embroidery and contractor custody

Embroidery jobs issue existing internal component lots of one work order, one BOM component and one count unit to an active contractor supporting EMBROIDERY. Multiple cutting lots may form one job. A posted issue moves counts from the specified QC_PENDING/ACCEPTED source to contractor EMBROIDERY_OUT custody.

Partial receipt lines reference the original issued lots. Accepted, held and rejected are physical returns; loss is a separately approved, reasoned disposition. No receipt can exceed its remaining issued quantity. Thus200 issued =170 accepted +5 rejected returned +25 still held. Rejected physical returns are not contractor loss. Receipt acceptance is an explicit quality inspection by an active inspector with owner/production permission.

The job completes only when all issued quantities are physically returned or explicitly disposed as approved loss. Contractors with remaining component custody cannot be deactivated. Source count/unit and remaining custody remain visible on job details.

Rate unit is explicit: PIECE, PANEL, SET, SUIT, METER, DESIGN or BATCH. Count-unit rates must match the component unit and total issued count. Other measurements require an explicit service basis; no automatic conversion of panels into fabric meters or suits occurs. The rate and charge quantity are frozen.

One completed service creates one actual shared `processing.bills` entry, linked by `productionJobId`. Phase 6 contractor ledger, payable balance, payment allocation and reports reuse this bill. There is no second payable subsystem. Unbilled service remains a costing estimate. For200 panels atPKR85, the service charge isPKR17,000 before explicit additions/discounts.
