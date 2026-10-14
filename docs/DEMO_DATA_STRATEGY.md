# Demo data strategy

## Single connected source

The central `DomainState` is the only persistent source used by the dashboard, selectors and future module screens. `createScenarioState()` constructs deterministic related master records and unposted foundation documents. `createSeedState()` replays the implemented goods-receipt, processing-issue and partial-receipt transactions to produce the historical golden state. Seed creation is not independent random generation of totals.

Stable fixture IDs and source references connect supplier → purchase order/line → goods receipt/line → grey fabric lot/rolls → processing challan/line → partial receipt/line → loss record. The customer, design and finished SKU are connected catalogue examples; they do not imply a wholesale transaction or manufactured stock. Record `origin` distinguishes SEED history from USER actions. The isolated inspector scenario uses USER origin while the saved golden history uses SEED.

## Golden scenario

| Record / quantity | Value |
| --- | --- |
| Company | نور ٹیکسٹائلز لاہور; اعظم کلاتھ مارکیٹ، لاہور; PKR; Urdu |
| Supplier | لاہور فیبرک سپلائرز |
| Fabric | Cotton Lawn, width 60 inches, inventory in meters |
| Measured rolls | 10 separately identified rolls, each measured at 100 m (the equality is fixture data, not a universal conversion rule) |
| Demo people | 2 employees and 2 domain role records; display role selection is transient and illustrative |
| Purchase order | PO-2026-0001; 1,000 meters |
| Goods receipt | GRN-2026-0001; 1,000 meters posted |
| Contractor | لاہور ٹیکسٹائل پروسیسنگ |
| Processing challan | PC-2026-0001; 400 meters issued |
| Partial receipt | PR-2026-0001; 380 meters physically returned |
| Approved loss | 10 meters, separate loss evidence |
| Grey available | 600 meters |
| Processed available | 380 meters |
| Contractor held | 10 meters |
| Physical fabric total | 990 meters |
| Conserved input | 990 physical + 10 loss = 1,000 meters |
| Finished stock | Zero suits; finished SKU is a catalogue example |
| Customer/supplier accounting | No fake invoice or payment; opening balances zero |

The separate diagnostics scenario starts before posting. The user posts each supported operation in sequence, inspects movements and reconciliation, then resets that scenario. It cannot repost source documents from the persisted golden history or mutate the main snapshot accidentally. Scenario reset is separate from explicit persistent-demo reset in Settings.

The historical timeline is deterministic: purchase order dated 2026-01-01, goods receipt posted 2026-01-02, processing issue posted 2026-01-03 and partial receipt posted 2026-01-05. The ledger contains six quantity movements (one GRN, two issue, two physical-return and one loss movement), plus one explicit loss record and three activity entries. The 10 roll records preserve original measurements; they are not independently summed as current stock after processing issues. Current stock is derived from lot/location movements.

## Persistence envelope and lifecycle

Storage key: `noor-textiles-erp-demo-v1`.

```ts
type StoredEnvelope = {
  schemaVersion: 1;
  revision: number;
  data: DomainState;
};
```

- **No saved value:** Build the deterministic golden state; initialization does not append records on refresh.
- **Valid saved value:** Validate the envelope/domain and hydrate exactly those records. Do not reseed over user actions.
- **Malformed, invalid or unsupported saved value:** Preserve the original raw storage, show a warning and provide a safe seed view until the user explicitly resets/imports. A fallback display is not a silent saved-data reset.
- **Normal update:** Compute and validate one next state; compare with the previously loaded serialized snapshot to detect stale-tab writes; persist the complete next envelope, then adopt the state. A failed write does not pretend to have saved the update.
- **Reset:** An explicit confirmed demo action restores the same golden IDs, references and quantities. It is not a business cancellation transaction.
- **Export:** Download a versioned JSON snapshot of the current validated domain state. Images remain paths/local assets, not unnecessary base64 blobs.
- **Import:** Parse and validate JSON/envelope, supported schema version, entity maps, references, statuses, movement/source consistency and conservation before replacing current data. Invalid import leaves current memory/storage intact. Valid import is an explicit replacement action.

Schema version is independent of the storage-key spelling. The migration boundary rejects unknown versions; it must not guess how an unsupported future schema should be interpreted. Any later migration must be explicit, deterministic, tested, and preserve source identities/history. Version 1 needs no historical migration because there was no earlier application state.

`revision` helps identify updates but is not a server lock. A stale snapshot guard detects sequential changes by another tab; simultaneous tab writes can still race between comparison and `setItem`. localStorage also has quota, browser-policy, device-loss and durability limits. This remains demonstration-only persistence.

## Planned Phase 3 expansion

The following is a target volume, **not the Phase 1 seed**:

| Entity group | Planned count |
| --- | ---: |
| Company | 1 |
| Employees | 6 |
| Fabric suppliers | 12 |
| Processing contractors | 8 |
| Wholesale customers | 20 |
| Fabric masters | 12 |
| Fabric rolls | 40+ |
| Seasonal collections | 4 |
| Textile designs | 30 |
| Purchase orders | 20 |
| Goods receipts | 20 |
| Processing challans | 18 |
| Production batches | 10 |
| Finished SKUs | 25+ |
| Wholesale sales orders | 30 |
| Invoices | 20 |
| Payments | 30 |

Generate master records first, then dependent documents with stable IDs and deterministic dates. Replay supported transactions in dependency order. Later production/sales/payment history must not be marked posted until corresponding tested transaction engines exist; the Phase 3 expansion may stage future documents as drafts or add those historical scenarios only when their module phase is implemented. Do not bypass business invariants merely to hit a count.

Every seed revision must test: no orphan foreign keys; bidirectional line/header consistency; approved receipt quantities within orders; contractor custody reconciliation; distinct inventory categories; no negative availability; valid production input/output/loss relationships when supported; invoice/payment allocation and ledger consistency when supported; and reproducible totals after reset. The absence of future invoices/payments in Phase 1 is deliberate, not a missing financial balance that should be guessed.
