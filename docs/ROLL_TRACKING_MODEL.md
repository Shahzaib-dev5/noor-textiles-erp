# Roll tracking model — Phase 5

Decision: quantity portions under the original stable roll ID. Original receipt measurements remain immutable. Posted movements with a roll ID derive each location/category portion; partial transfers and issues never move the entire roll. No independent mutable stock totals or duplicate ownership records are persisted.

Historical lot-level processing, returns or other stock-outs without roll identity cannot prove the remaining quantity of each individual roll. Incomplete original roll measurements also cannot prove full individual custody. Such lots retain their original measured rolls and explicit legacy/unassigned custody; their exact aggregate lot/location balances remain usable. The application will not invent historical bin movements or distribute historical consumption across arbitrary rolls. Known lots require roll selection in new operations; an aggregate operation cannot deliberately discard new known identities.

The existing movements, locations and reservations remain authoritative. Optional warehouse version 5 stores hierarchy profiles, workflow documents, stocktake snapshots and audit evidence; balances remain derived. Storage envelope version 1, historical version 3 and procurement version 4 remain compatible without silent initialization or replacement.

The UI distinguishes original measured length, current warehouse portions, reservations and availability. Identified contractor/processed material participates separately in roll conservation. Historical unknown quantities display an explicit unknown status rather than zero or an arbitrary allocation. Old unposted aggregate purchase-return drafts on newly controlled known lots must be cancelled/recreated with roll identity; saved records are never silently rewritten.

Processing editor remains Phase 6; typed integration consumes reservations through existing approved challans. Final verification evidence is in [Phase 5 acceptance](PHASE_5_ACCEPTANCE.md).
