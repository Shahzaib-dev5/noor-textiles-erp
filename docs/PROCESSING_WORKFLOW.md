# Phase 6 — Processing workflow

Noor Textiles outsources selected stages; fabric does not have to visit every service. Services include bleaching, dyeing, digital/rotary/screen printing, washing, calendering, finishing and embroidery service charging.

```mermaid
flowchart LR
  Warehouse[Eligible grey or processed fabric] --> Job[Draft job and agreed rate snapshot]
  Job --> Approval[Approve job]
  Approval --> Issue[Post measured issue challan]
  Issue --> Custody[Contractor material custody]
  Custody --> Receipt[Partial physical receipt and approved loss]
  Receipt --> Accepted[Accepted processed output lot]
  Receipt --> Hold[Returned held or rejected output lot]
  Hold --> QC[Inspect and release or reclassify]
  QC --> Accepted
  Accepted --> Next[Optional next processing job]
  Receipt --> Complete[Complete accountable job]
  Complete --> Bill[Post contractor bill]
  Bill --> Payment[Post allocated contractor payment]
```

Open `/contractors` to maintain companies. Configure `/processing/rates`, create `/processing/jobs/new`, approve the job, then create and post `/processing/challans/new`. A job can contain multiple lot/roll inputs. Each challan uses one source location; create separate challans for different locations. Draft challans reserve job allocation capacity but create no stock effects.

Job transitions: DRAFT → APPROVED → PARTIALLY_ISSUED / ISSUED → optional IN_PROCESS → PARTIALLY_RECEIVED → COMPLETED → CLOSED. Receipts can occur without manually marking work started. Completed requires all planned input issued and all issued material accounted for. Cancel is restricted to unissued jobs after cancelling pending challans. Draft jobs alone are editable.

Grey stock uses Phase 5 known-roll availability. Historical unassigned lots remain explicitly unassigned. Accepted processed outputs can become the next job's source; source eligibility and the existing ledger prevent double use. Each output has a new lot ID, parent lot, root lot, original GRN and stage/job/receipt references.

Stage pages (`/processing/dyeing`, `/printing`, `/bleaching`, `/calendering`, `/finishing`) are filtered views of the same jobs. Use the job form for stage-specific design, collection, technique, local artwork reference and colorway. These references do not implement a design studio or panel production system.

The processing dashboard and sixteen reports read persisted records. Filters select related source-document cohorts, including job-linked fabrics on bills/receipts; multi-line document amounts and quantities remain whole-document values. Shared tables support search, sorting, pagination and CSV; print previews use the existing Urdu A4 styling. Historical stock and custody are included without reposting. Operational contractor finances remain separate from historical charge snapshots and supplier purchasing ledgers.

Permissions are simulated work profiles. Owner has the complete workflow. Accounts handles bills/payments; warehouse or production handles issues/receipts/QC; purchase or production maintains planning and masters. Receipt loss posting requires owner confirmation. No backend or real payment processing exists.
