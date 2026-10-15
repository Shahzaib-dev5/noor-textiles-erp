# Cutting and component stock

A cutting draft references a posted material issue. Input meters must equal usable consumption + recoverable leftover return + approved scrap + remaining WIP. The source issue must have enough WIP. For example300 =270 consumed +20 returned +5 scrap +5 remaining. Posting consumes275 net meters from WIP, returns20 and retains5.

Output counts require enough usable fabric under the frozen BOM conversion. A100-panel output at2.7m needs270m. Output cannot exceed the target plus explicitly approved replacement components. Scrap needs an owner approval and reason. The first posted output fixes the component unit for that order/BOM line; later cuts cannot change it.

Each positive posted cutting output creates one stable component lot referencing order, design, variant, BOM line, issue, cutting and source lot/known roll. Its count starts in QC_PENDING. Component movements use integers and the explicit unit PIECE, PANEL or SET. Meter movements and count movements never share balances.

The count ledger tracks QC_PENDING, EMBROIDERY_OUT, QC_HOLD, REWORK, ACCEPTED, REJECTED and SCRAP by component lot and custody. Embroidery and QC transfer existing counts with paired negative/positive effects. Disposal moves existing eligible counts to SCRAP. Full validation checks exact document effects, no negative balances/history and total component conservation.

100 shirt components,80 trousers and70 dupattas imply70 potential complete component sets. Shirts alone imply zero. Quality acceptance is calculated separately. No cutting output, readiness action or order closure creates packaged suits or finished SKUs.
