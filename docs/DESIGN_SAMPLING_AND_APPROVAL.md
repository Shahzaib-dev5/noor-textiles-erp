# Sampling and approval

Use `/designs/:id/samples` or `/designs/samples/new`. Requests reference an operational design, color and currently approved BOM, along with type, requester, request/target dates, notes and material planning notes. They are **prototype/planning records only**. No sampling fabric is issued or consumed by this phase.

Optional PNG/JPEG/WebP preview metadata and a local data URL are saved with the request; the UI limits files to 128 KB and validates persisted data. This is a local demonstration attachment, not remote file storage. Exported JSON includes it; browser quota still applies.

Requested requests can be edited or started. Requested/In Progress/Revision Required samples can be submitted; Submitted may enter Under Review. A submitted/reviewed sample can receive Pass, Needs Revision or Fail. Cancellation applies before review or after a revision request. Approved and rejected reviews remain historical evidence; make a new request when another prototype is needed.

Every review records reviewer, simulated owner/production role, timestamp, comments, and all eight checks: color, print quality, fabric suitability, component matching, embroidery suitability, completeness, market suitability and production feasibility. Pass requires all eight Pass. Revision requires a revision item; Fail requires a failed item. Resubmission retains every previous review and its comments.

Design approval requires a passed sample for each current approved variant/BOM. A later approved BOM invalidates the earlier sample as readiness evidence for that variant; it does not rewrite or delete the old sample. Open design revision before further editing an approved/ready design. Readiness remains an explicit action after design approval.

Sample review A4 sheets include the revision, reviewer/time, checklist outcomes and comments. These are demo approvals, not secure identity verification or physical inspection certification.
