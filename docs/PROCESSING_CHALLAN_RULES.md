# Processing challan rules

- A new operational challan references an approved open job, contractor, service, expected date, transport reference and one or more source lot/roll portions.
- All lines on a challan share a source location. A job may have inputs from several locations, issued through separate challans.
- Draft/cancelled challans create no movements. POST validates active source, contractor, lot/roll identity, job allocation and actual available quantity; a posted challan cannot post again.
- Eligible input is GREY or accepted PROCESSED. Held, quarantined, rejected and damaged source categories cannot be issued.
- Known grey roll portions must retain their original roll IDs. Imported historical unassigned custody is not fabricated into individual roll movements.
- Posting appends a warehouse debit and matching PROCESSING_OUT credit on the same source lot. No independent mutable processing stock total exists.
- Other documents' reservations remain protected. To consume a Phase 5 reservation, its reference must equal the job ID; issue an exact matching reservation/lot/roll/location quantity on its own one-line challan. This deliberately reuses the Phase 5 consumption evidence convention; arbitrary partial/multiple-reservation consumption on a challan is not supported.
- Several contractors can receive portions of one lot through independent jobs/challans. Remaining custody is calculated per challan line, never from a shared contractor pool alone.
- State validation reconstructs expected operational movements from documents, verifies history and rejects missing/duplicate/changed effects and negative timeline stock. Posting commits one validated shared snapshot.
