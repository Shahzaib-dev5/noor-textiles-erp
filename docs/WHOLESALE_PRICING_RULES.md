# Wholesale pricing rules

`/sales/pricing` (preserved alias `/pricing`) manages draft, active and inactive price lists. Every list has PKR currency, a SKU/design/collection scope, optional customer group, effective dates and positive whole-suit quantity tiers. Activation requires the simulated owner. Active/inactive commercial terms are immutable; changing rates means creating a new draft and deactivating the earlier overlapping list, preserving historical references.

Tier boundaries are inclusive. Ranges cannot overlap or continue after an unlimited tier. Gaps have no price unless another eligible fallback list supplies one. Selection considers only active lists valid on the pricing date and matching the customer's group/product. Group-specific lists precede general lists; within that priority SKU precedes design, then collection, then latest effective date and stable ID. Two active lists with identical scope/target/group cannot have overlapping dates. Quantities are per SKU; duplicate SKU rows must be combined, and unrelated SKUs are never silently aggregated.

Example assumptions, entered explicitly in a price list: 1-11 suits at PKR2200, 12-49 at2100, 50-99 at2000, 100+ at1900. These are demonstration parameters, not current market recommendations.

Calculation order:

1. Quantity times captured unit rate, using safe integer paisa.
2. Captured tier percentage discount, rounded half up to paisa.
3. Exactly one commercial policy: none, captured customer discount, promotion/reference or manager-approved manual discount. A percentage and fixed discount cannot both occupy that policy. A manual rate needs an explicit reason and cannot simultaneously select a price list.
4. One document discount, percentage or fixed amount, allocated proportionally across eligible line nets using largest remainders with stable line-order ties.
5. Explicit commercial charges allocated proportionally across post-discount line amounts; if every amount is zero, quantity is the fallback weight.

No discount may exceed its eligible amount; all totals must remain safe nonnegative integer paisa. Promotions are represented once per SKU line; the same commercial policy is not applied twice. Group defaults do not stack a second customer discount. Approved prices, original pricing date/source list/tier, manual reasons and discount evidence are frozen. Later rate cards, profile discounts or display edits do not rewrite them.

Partial dispatch values use cumulative prefixes: `floor(lineNet * (alreadyDispatched + quantity) / orderedQuantity) - floor(lineNet * alreadyDispatched / orderedQuantity)`. Thus splitting ten paisa over three suits yields3,3,4 without losing or duplicating the remainder. Actual dispatch transport expense estimates remain separate from quoted commercial charges and do not silently become customer invoice charges.

Cancelled remaining quantities remove the tail of the original line allocation. Previously shipped prices are not retiered or rewritten after cancellation; the remaining commitment plus shipped value plus cancelled tail reconciles to the frozen line amount.
