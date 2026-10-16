# Final suit quality control

Only posted matching batches can be inspected. Each inspection identifies the original batch, current set state, inspector, date, quantity, defect and remarks. The exclusive split is:

`inspected = accepted + held + rejected + rework`.

Posting transfers existing set quantities between states; it never adds matching output. Nonaccepted results require defect details. QC_PENDING, ACCEPTED, HOLD, REJECTED, REWORK and PACKAGED together account for the original batch quantity. Accepted sets reserved by approved packaging orders cannot be reinspected or consumed by another order. Rejected or held sets cannot be packaged.

Example: inspect 50, accept 45, hold 3, reject 1, rework 1. All 50 remain accounted for. Correcting the rework set and passing a fresh inspection changes accepted 45 to 46 without changing matched output 50.

Rework requests record quantity, assigned team, defect, correction, due date and additional actual cost. OPEN -> IN_PROGRESS -> AWAITING_INSPECTION -> COMPLETED requires fresh inspection of the unsettled request quantity. A repeated failed correction returns to IN_PROGRESS and requires resubmission. A submission alone creates no acceptance. Nonzero correction cost requires owner approval and is carried once after completion.

Replacement documents reference the original and replacement component batches. They consume actual assembly WIP, remove an existing matched component, and either return a reusable original to production or classify it as scrap. Replacement from the same cutting lot is permitted when distinct physical counts exist in the required custodies. Request/line budgets prevent replacing the same requested quantity twice. No rework command creates an extra suit.

Use `/assembly/quality-control` and `/assembly/rework`. Source details expose original matching plans, consumed component lots, inspector outcomes and activity. Inspection and rework documents support Urdu A4 output.
