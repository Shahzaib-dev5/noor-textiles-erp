# Collection management

`/collections` lists historical and operational collections once, with search, season/status filters, sorting and pagination. Create through `/collections/new`; detail and edit use `/collections/:id` and `/collections/:id/edit`.

Operational records store stable ID, unique case-insensitive code, Urdu/English titles, season, year, description, launch date, status and notes. Seasons use the controlled Spring, Summer, Festive, Autumn, Winter and All Season vocabulary; there is no disconnected season inventory or auto-generated season dataset. Statuses are Draft, Planning, Active, Completed and Archived.

Save edits through a validated transaction. Archival is refused while an operational design remains active. Delete is available only for an unreferenced operational collection; referenced collections must be retained. Historical collections cannot be edited/deleted by studio commands. Existing Phase 3 IDs and records remain unchanged.

Details show related designs, approved/draft/ready counts, variant count, target suits and estimated target wholesale value. These are planning values, not work orders, confirmed commitments or realized revenue. Historical counts are explicitly historical. Creation changes neither stock nor accounts.

New designs may reference an operational Draft/Planning/Active collection or a preserved historical collection. Approval/readiness requires Planning/Active or preserved historical status. Launch alerts derive from actual stored dates within the next fourteen days.
