# Processing receipts, QC and losses

Create a draft receipt against a posted operational challan. Enter each source line once, inspector, destination processed warehouse, date, accepted/held/rejected meters, defect, loss meters/reason and applicable color/batch. Posting is explicit; cancellation is allowed only before posting.

```text
Physical returned = accepted + held + rejected
Accounted settlement = physical returned + recognized loss
Still with contractor = issued − all posted physical returns − all recognized loss
```

One challan can have many partial receipts. For 500 m issued, receipts of 200, 150 and 120 m plus 15 m recognized loss leave 15 m held. Rejected returned stock is already part of physical return and is not subtracted a second time.

Every nonzero returned quality portion creates its own traceable output lot and appropriate inventory credit. Held and rejected quantities go to warehouse quality categories and remain unavailable. Source contractor custody is debited exactly once for all physical returns. No measurement gain or material conversion is assumed.

Loss-only receipts are supported: enter zero returned quantities and the documented loss. Owner posting supplies approval and creates the existing explicit processing loss record. The receipt profile classifies SHRINKAGE, SHORTAGE, DAMAGE, DISPOSAL or CLAIM. All reduce accountable custody once; a recoverable claim does not automatically create a financial credit. A permitted credit can be recorded explicitly on the contractor bill. Missing material is never silently converted into shrinkage.

QC actions on returned output record inspector, defect, quantity, source location, date and decision. Accepted moves to PROCESSED; quality hold/rework moves to INSPECTION_HOLD; rejected/damaged moves to its unavailable category. QC uses paired shared movements and validates source quantity. Clear held material through a documented QC release before reissuing it for rework. The output's initial category stays immutable; current stock state is derived from all movements.

Current limits: historical receipts remain readable but are not reopened as new operational jobs. Warehouse-side write-off of newly returned processed output is not the Phase 5 grey hold editor; contractor-side approved disposal is recorded through the loss workflow. No panel/piece production inventory is created in this phase.
