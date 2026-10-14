import { beforeAll, describe, expect, it } from 'vitest';
import type { DomainState } from '@/domain/entities';
import { createExpandedSeed } from '@/data/seed/expanded-seed';
import { createERPStore } from '@/store';
import { MemoryStorage } from '@/tests/fixtures/memory-storage';
import { decodeSnapshot, encodeSnapshot, STORAGE_KEY } from '@/services/storage';
import { validateDomainState } from '@/domain/validators/state';
import { getInventoryBalances } from '@/services/inventory';
import { emptyFilters, selectBusinessDashboard, selectBusinessAlerts, selectFinishedStock, selectInvoiceBalances, selectReconciliationReport } from '@/store/selectors/business';
import { useUIStore } from '@/store/ui-preferences';
import { createSeedState } from '@/data/seed';
import { validateSeed } from '@/services/validation/seed-validator';
import { selectSupplierPurchases, selectContractorBalances, selectCustomerLedger, selectCollectionContribution } from '@/store/selectors/reports';
let seed: DomainState;
beforeAll(() => { seed = createExpandedSeed(); });
describe('independent business reconciliation and reporting', () => {
  it('keeps imported opening receivables explicit rather than assigning an invented due date', () => {
    const data = structuredClone(seed); Object.values(data.customers)[0].openingBalancePaisa = 100000;
    const v = selectBusinessDashboard(data)!;
    expect(v.financial.openingReceivable).toBe(100000);
    expect(v.financial.outstanding).toBe(selectBusinessDashboard(seed)!.financial.outstanding + 100000);
    expect(v.financial.current + v.financial.overdue + v.financial.openingReceivable).toBe(v.financial.outstanding);
  });
  it('produces a structured validation report and source-linked supplier/customer reports', () => {
    const report = validateSeed(seed); expect(report.ok).toBe(true);
    if (report.ok) { expect(report.counts['history.invoices']).toBe(20); expect(report.reconciliation.fabric.balanced).toBe(true); }
    expect(validateSeed({ ...seed, suppliers: {} }).ok).toBe(false);
    expect(selectSupplierPurchases(seed).reduce((n, r) => n + r.postedValuePaisa, 0)).toBe(selectBusinessDashboard(seed)!.financial.purchases);
    expect(selectContractorBalances(seed).reduce((n, r) => n + r.held, 0)).toBe(5501);
    expect(selectCollectionContribution(seed).reduce((n, r) => n + r.grossContributionPaisa, 0)).toBe(selectBusinessDashboard(seed)!.financial.contribution);
    expect(Object.keys(seed.customers).reduce((n, id) => n + selectCustomerLedger(seed, id)!.outstandingPaisa, 0)).toBe(selectReconciliationReport(seed).financial.outstanding);
  });
  it('preserves varied roll measurements and exact lot receipts', () => {
    expect(new Set(Object.values(seed.rolls).map((r) => r.actualLengthMeters)).size).toBe(5);
    for (const lot of Object.values(seed.lots)) expect(Object.values(seed.rolls).filter((r) => r.lotId === lot.id).reduce((n, r) => n + r.actualLengthMeters, 0)).toBe(seed.goodsReceiptLines[lot.sourceGoodsReceiptLineId].quantityMeters);
  });
  it('checks unique IDs and single-company ownership across the extension', () => {
    const ids = Object.entries(seed).filter(([k]) => k !== 'history').flatMap(([, rows]) => Object.keys(rows));
    for (const rows of Object.values(seed.history!)) if (typeof rows === 'object') for (const r of Object.values(rows) as { id: string; companyId: string }[]) { expect(r.companyId).toBe('company:noor'); ids.push(r.id); }
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('posts partial purchasing and reconciles contractor-held material independently', () => {
    expect(Object.values(seed.purchaseOrders).filter((r) => r.status === 'PARTIALLY_RECEIVED')).toHaveLength(2);
    const report = selectReconciliationReport(seed);
    expect(report.fabric).toMatchObject({ purchased: 52920, grey: 15520, issued: 37400, contractor: 5501, loss: 495, balanced: true });
    expect(selectBusinessDashboard(seed)!.processing).toMatchObject({ open: 5, partial: 3, late: 5, returned: 31404, loss: 495 });
    expect(getInventoryBalances(seed).every((r) => r.availableMeters >= 0)).toBe(true);
  });
  it('keeps two-piece BOMs free of dupatta and uses exact fabric widths', () => {
    const h = seed.history!;
    for (const b of Object.values(h.boms)) {
      expect(b.lineIds).toHaveLength(b.pieceCount);
      expect(b.lineIds.some((id) => h.bomLines[id].component === 'DUPATTA')).toBe(b.pieceCount === 3);
      for (const id of b.lineIds) expect(h.bomLines[id].widthInches).toBe(seed.fabrics[h.bomLines[id].fabricId].widthInches);
    }
  });
  it('records design selling targets and derives completed-batch estimates from the same BOM inputs', () => {
    const h = seed.history!;
    expect(Object.keys(h.designProfiles)).toHaveLength(30);
    expect(Object.values(h.designProfiles).every((p) => p.targetSuits === 120 && p.targetPricePaisaPerSuit > 0)).toBe(true);
    for (const b of Object.values(h.batches).filter((b) => b.status === 'COMPLETED')) {
      const material = b.allocationIds.reduce((n, id) => n + h.materialAllocations[id].costPaisa, 0);
      expect(b.estimatedCostPaisa).toBe(material + 360000);
    }
    expect(new Set(Object.values(h.batches).map((b) => b.estimatedCostPaisa)).size).toBeGreaterThan(1);
  });
  it('separates material WIP from finished suit counts and planned stock', () => {
    const r = selectReconciliationReport(seed);
    expect(r.production.consumed).toBeCloseTo(r.production.embedded + r.production.waste + r.production.wip, 4);
    expect(r.finished).toEqual({ produced: 900, dispatched: 180, damaged: 8, physical: 712, reserved: 70, available: 642, difference: 0 });
    expect(selectFinishedStock(seed).filter((s) => s.sku.catalogueOnly).every((s) => s.produced === 0)).toBe(true);
    expect(selectBusinessDashboard(seed)!.production).toMatchObject({ completed: 900, rejected: 9, inProgress: 171, planned: 120, target: 1200, completion: 75, active: 3 });
  });
  it('derives outstanding only from linked allocations and keeps unapplied cash', () => {
    const invoices = selectInvoiceBalances(seed), r = selectReconciliationReport(seed).financial;
    expect(invoices.filter((i) => i.paymentStatus === 'PAID')).toHaveLength(10);
    expect(invoices.filter((i) => i.paymentStatus === 'PARTIALLY_PAID')).toHaveLength(5);
    expect(invoices.filter((i) => i.paymentStatus === 'UNPAID')).toHaveLength(5);
    expect(invoices.filter((i) => i.overdue)).toHaveLength(5);
    expect(r.invoiced).toBe(r.allocated + r.outstanding);
    expect(r.collections).toBe(r.allocated + 50000);
    expect(r.unappliedCredit).toBe(50000);
  });
  it('aggregates correct monthly source documents', () => {
    const v = selectBusinessDashboard(seed)!;
    expect(v.charts.purchases).toHaveLength(4); expect(v.charts.sales).toHaveLength(1); expect(v.charts.collections).toHaveLength(1);
    expect(v.charts.sales.reduce((n, r) => n + r.value, 0)).toBe(v.financial.invoiced);
    expect(v.charts.collections.reduce((n, r) => n + r.value, 0)).toBe(v.financial.collections);
    expect(v.charts.expenses.reduce((n, r) => n + r.value, 0)).toBe(v.financial.expenses);
  });
  it('scopes customer filtering to sales/cash while retaining unrelated inventory and purchases', () => {
    const full = selectBusinessDashboard(seed)!, filtered = selectBusinessDashboard(seed, { ...emptyFilters, customerId: Object.keys(seed.customers)[0] })!;
    expect(filtered.financial.invoiced).toBeLessThan(full.financial.invoiced);
    expect(filtered.financial.purchases).toBe(full.financial.purchases);
    expect(filtered.inventory).toEqual(full.inventory);
  });
  it('uses date filters for financial flows, not historical stock balances', () => {
    const full = selectBusinessDashboard(seed)!, v = selectBusinessDashboard(seed, { ...emptyFilters, from: '2026-09-01', to: '2026-09-30' })!;
    expect(v.financial.invoiced).toBe(0); expect(v.financial.purchases).toBe(0);
    expect(v.financial.collections).toBe(full.financial.collections);
    expect(v.inventory).toEqual(full.inventory);
  });
  it('filters collections, fabrics and product categories without allocating cash to SKUs', () => {
    const full = selectBusinessDashboard(seed)!;
    const v = selectBusinessDashboard(seed, { ...emptyFilters, collectionId: Object.keys(seed.history!.collections)[0], pieceCount: '3' })!;
    expect(v.inventory.finished).toBeLessThan(full.inventory.finished);
    expect(v.financial.collections).toBe(full.financial.collections);
    expect(v.batches.every((b) => seed.designs[b.designId].pieceCount === 3)).toBe(true);
    const fabric = selectBusinessDashboard(seed, { ...emptyFilters, fabricId: Object.keys(seed.fabrics)[0] })!;
    expect(fabric.inventory.grey).toBeLessThan(full.inventory.grey);
  });
  it('scopes contractor quantities and keeps independent customer receivables', () => {
    const full = selectBusinessDashboard(seed)!, v = selectBusinessDashboard(seed, { ...emptyFilters, contractorId: Object.keys(seed.contractors)[0] })!;
    expect(v.inventory.contractor).toBeLessThan(full.inventory.contractor);
    expect(v.financial.outstanding).toBe(full.financial.outstanding);
    expect(v.inventory.grey).toBe(full.inventory.grey);
  });
  it('derives alerts with valid source IDs and sorted activity without state mutations', () => {
    const before = JSON.stringify(seed), alerts = selectBusinessAlerts(seed), v = selectBusinessDashboard(seed)!;
    expect(alerts.some((a) => a.title.includes('کم اسٹاک'))).toBe(true);
    expect(alerts.some((a) => a.id in seed.history!.invoices)).toBe(true);
    expect(alerts.every((a) => a.path.includes('?record='))).toBe(true);
    for (let i = 1; i < v.activity.length; i++) expect(v.activity[i - 1].date >= v.activity[i].date).toBe(true);
    expect(JSON.stringify(seed)).toBe(before);
    expect(selectBusinessDashboard(seed)).toBe(v);
  });
});
describe('history validation rejects corrupted imports', () => {
  const corruptions: [string, (data: DomainState) => void][] = [
    ['company ownership', (d) => { Object.values(d.history!.payments)[0].companyId = 'company:missing'; }],
    ['orphan customer', (d) => { Object.values(d.history!.invoices)[0].customerId = 'customer:missing'; }],
    ['mismatched key', (d) => { Object.values(d.history!.batches)[0].id = 'batch:duplicate'; }],
    ['material overdraft', (d) => { Object.values(d.history!.materialAllocations)[0].quantityMeters += 100000; }],
    ['fabric mismatch', (d) => { Object.values(d.history!.materialAllocations)[0].lotId = Object.keys(d.lots)[5]; }],
    ['fabric valuation', (d) => { Object.values(d.history!.materialAllocations)[0].costPaisa += 1; }],
    ['invalid BOM width', (d) => { Object.values(d.history!.bomLines)[0].widthInches = 10; }],
    ['production mismatch', (d) => { Object.values(d.history!.batches)[0].completedSuits++; }],
    ['uninspected packaging', (d) => { Object.values(d.history!.packaging)[0].inspectionPassedSuits = 0; }],
    ['duplicate finished posting', (d) => { const r = Object.values(d.history!.finishedMovements)[0]; d.history!.finishedMovements['movement:duplicate'] = { ...r, id: 'movement:duplicate', number: 'DUPLICATE' }; }],
    ['missing component output', (d) => { delete d.history!.componentOutputs[Object.keys(d.history!.componentOutputs)[0]]; }],
    ['over-dispatch', (d) => { Object.values(d.history!.dispatchLines)[0].suits = 1000; }],
    ['invoice total', (d) => { Object.values(d.history!.invoices)[0].totalPaisa++; }],
    ['invoice price provenance', (d) => { Object.values(d.history!.invoiceLines)[0].unitPricePaisa++; }],
    ['payment overallocation', (d) => { Object.values(d.history!.paymentAllocations)[0].amountPaisa = 1000000000; }],
    ['cross-customer payment', (d) => { Object.values(d.history!.payments)[0].customerId = Object.keys(d.customers)[1]; }],
    ['chronological payment', (d) => { Object.values(d.history!.payments)[0].date = '2026-01-01'; }],
    ['duplicate supplier billing', (d) => { const r = Object.values(d.history!.supplierInvoices)[0]; d.history!.supplierInvoices['bill:duplicate'] = { ...r, id: 'bill:duplicate', number: 'DUPLICATE' }; }],
    ['unsupported extension version', (d) => { Object.assign(d.history!, { version: 99 }); }],
  ];
  it.each(corruptions)('rejects %s without repairing data', (_, change) => {
    const data = structuredClone(seed); change(data); const before = JSON.stringify(data);
    expect(validateDomainState(data).ok).toBe(false); expect(JSON.stringify(data)).toBe(before);
  });
});
describe('compatible explicit demo replacement', () => {
  it('imports a validated expanded snapshot and rejects a corrupt replacement atomically', () => {
    const storage = new MemoryStorage(), store = createERPStore(storage), encoded = encodeSnapshot(seed);
    if (!encoded.ok) throw new Error(encoded.message);
    expect(store.getState().importDemo(encoded.value).ok).toBe(true);
    const before = store.getState().data, raw = storage.getItem(STORAGE_KEY), bad = JSON.parse(encoded.value);
    Object.values(bad.data.history.payments as Record<string, { amountPaisa: number }>)[0].amountPaisa = 0;
    expect(store.getState().importDemo(JSON.stringify(bad)).ok).toBe(false);
    expect(store.getState().data).toBe(before); expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it('keeps existing schema-1 snapshots unchanged and round-trips the optional versioned extension', () => {
    const storage = new MemoryStorage(), store = createERPStore(storage), raw = storage.getItem(STORAGE_KEY);
    expect(store.getState().data.history).toBeUndefined(); expect(createERPStore(storage).getState().data).toEqual(createSeedState()); expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    const encoded = encodeSnapshot(seed); expect(encoded.ok).toBe(true);
    if (encoded.ok) { const decoded = decodeSnapshot(encoded.value); expect(decoded.ok).toBe(true); if (decoded.ok) expect(decoded.value.data).toEqual(seed); }
  });
  it('loads with one validated commit, preserves preferences, survives refresh and resets to golden', async () => {
    const storage = new MemoryStorage(), store = createERPStore(storage), writes = storage.writes, preferences = structuredClone(useUIStore.getState().preferences);
    expect((await store.getState().loadExpandedDemo()).ok).toBe(true);
    expect(storage.writes).toBe(writes + 1);
    expect(createERPStore(storage).getState().data).toEqual(seed); expect(storage.writes).toBe(writes + 1);
    expect(useUIStore.getState().preferences).toEqual(preferences);
    expect(store.getState().resetDemo().ok).toBe(true); expect(store.getState().data).toEqual(createSeedState());
  });
  it('keeps saved data intact if an expanded-data write fails', async () => {
    const storage = new MemoryStorage(), store = createERPStore(storage), data = store.getState().data, raw = storage.getItem(STORAGE_KEY);
    storage.failWrites = true; expect((await store.getState().loadExpandedDemo()).ok).toBe(false);
    expect(store.getState().data).toBe(data); expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });
});
