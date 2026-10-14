import type { DomainState } from '@/domain/entities';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { multiplyMoney } from '@/domain/value-objects/money';

export interface ValidationIssue { code: string; recordId: string; message: string }
export function inspectHistory(state: DomainState): ValidationIssue[] {
  const h = state.history; if (!h) return [];
  const issues: ValidationIssue[] = [];
  const fail = (recordId: string, message: string, code = 'HISTORY_INVARIANT') => issues.push({ code, recordId, message });
  const ref = (value: unknown, recordId: string, name: string) => { if (!value) fail(recordId, 'Invalid reference: ' + name); return Boolean(value); };
  const eq = (a: number, b: number, recordId: string, name: string) => { if (!Number.isFinite(a) || Math.abs(a - b) > .00005) fail(recordId, name + ': ' + a + ' != ' + b); };
  const sum = <T>(list: T[], f: (r: T) => number) => list.reduce((n, r) => n + f(r), 0);
  const ids = new Set(Object.entries(state).filter(([key]) => key !== 'history').flatMap(([, records]) => Object.keys(records)));
  const numbers = new Set([...Object.values(state.purchaseOrders), ...Object.values(state.goodsReceipts), ...Object.values(state.challans), ...Object.values(state.processingReceipts)].map((r) => r.number));
  ref(state.companies[h.companyId], h.companyId, 'company');
  for (const [collection, entries] of Object.entries(h)) {
    if (typeof entries !== 'object') continue;
    for (const [key, raw] of Object.entries(entries)) {
      const r = raw as { id: string; companyId: string; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string; number?: string; date?: string };
      if (key !== r.id || ids.has(r.id)) fail(key, 'Duplicate or mismatched ID');
      ids.add(r.id);
      if (r.companyId !== h.companyId || !state.employees[r.createdBy] || !state.employees[r.updatedBy]) fail(key, 'Invalid company/audit ownership');
      if (r.createdAt > r.updatedAt) fail(key, 'Invalid audit chronology');
      if (r.number) { if (numbers.has(r.number)) fail(key, 'Duplicate document number'); numbers.add(r.number); }
      if (r.date && r.date > h.asOf) fail(key, 'Future posted history: ' + collection);
    }
  }
  Object.values(h.supplierProfiles).forEach((r) => ref(state.suppliers[r.supplierId], r.id, 'supplier'));
  Object.values(h.fabricProfiles).forEach((r) => { ref(state.fabrics[r.fabricId], r.id, 'fabric'); ref(state.suppliers[r.supplierId], r.id, 'supplier'); });
  Object.values(h.customerProfiles).forEach((r) => ref(state.customers[r.customerId], r.id, 'customer'));
  Object.values(h.contractorProfiles).forEach((r) => ref(state.contractors[r.contractorId], r.id, 'contractor'));
  Object.values(state.designs).forEach((r) => { if (r.collectionId) ref(h.collections[r.collectionId], r.id, 'collection'); if (r.bomId) ref(h.boms[r.bomId]?.designId === r.id, r.id, 'bom'); });
  Object.values(h.variants).forEach((r) => ref(state.designs[r.designId], r.id, 'design'));
  Object.values(h.designProfiles).forEach((r) => { ref(state.designs[r.designId], r.id, 'design target'); r.productionBatchIds.forEach((id) => ref(h.batches[id]?.designId === r.designId, r.id, 'design production batch')); });
  Object.values(state.finishedSKUs).forEach((r) => { if (r.colorVariantId) ref(h.variants[r.colorVariantId]?.designId === r.designId, r.id, 'variant'); if (!r.catalogueOnly && !Object.values(h.packaging).some((p) => p.skuId === r.id)) fail(r.id, 'Finished SKU lacks packaging provenance'); });
  Object.values(h.boms).forEach((r) => {
    const design = state.designs[r.designId]; ref(design?.bomId === r.id && design.pieceCount === r.pieceCount, r.id, 'design');
    const lines = r.lineIds.map((id) => h.bomLines[id]); lines.forEach((l) => ref(l?.bomId === r.id, r.id, 'bom line'));
    const components = new Set(lines.map((l) => l?.component));
    if (lines.length !== r.pieceCount || components.size !== r.pieceCount || !components.has('SHIRT') || !components.has('TROUSER') || (r.pieceCount === 3 && !components.has('DUPATTA'))) fail(r.id, 'Invalid suit components');
  });
  Object.values(h.bomLines).forEach((r) => { ref(h.boms[r.bomId]?.lineIds.includes(r.id), r.id, 'bom'); ref(state.fabrics[r.fabricId]?.widthInches === r.widthInches, r.id, 'fabric/width'); });
  Object.values(h.processingSchedules).forEach((r) => {
    const c = state.challans[r.challanId]; ref(c, r.id, 'challan');
    if (r.dueOn < r.issuedOn) fail(r.id, 'Processing chronology');
    if (c) c.lineIds.forEach((id) => { const lot = state.lots[state.challanLines[id].lotId]; const grn = state.goodsReceipts[state.goodsReceiptLines[lot.sourceGoodsReceiptLineId].goodsReceiptId]; if (r.issuedOn < grn.receivedOn) fail(r.id, 'Issue before receipt'); });
  });
  Object.values(h.processingCharges).forEach((r) => {
    const receipt = state.processingReceipts[r.receiptId];
    ref(receipt?.status === 'POSTED' && state.challans[receipt.challanId]?.contractorId === r.contractorId, r.id, 'posted receipt/contractor');
    if (receipt) eq(r.meters, sum(receipt.lineIds, (id) => state.processingReceiptLines[id].outputMeters), r.id, 'Charge meters');
    eq(r.totalPaisa, multiplyMoney(r.ratePaisaPerMeter, r.meters), r.id, 'Processing charge');
  });
  const allocations = Object.values(h.materialAllocations);
  Object.values(state.goodsReceipts).forEach((r) => { if (r.status === 'POSTED' && (r.receivedOn < state.purchaseOrders[r.purchaseOrderId].orderDate || r.receivedOn > h.asOf)) fail(r.id, 'Purchase chronology'); });
  Object.values(h.batches).forEach((r) => {
    ref(state.designs[r.designId]?.bomId === r.bomId, r.id, 'design/bom');
    eq(r.targetSuits, r.completedSuits + r.rejectedSuits + r.inProgressSuits + r.plannedSuits, r.id, 'Production quantity');
    if (r.dueOn < r.date || (r.status === 'COMPLETED' && (r.inProgressSuits || r.plannedSuits)) || (r.status === 'PLANNED' && (r.completedSuits || r.allocationIds.length))) fail(r.id, 'Batch status/chronology');
    eq(r.completedSuits, sum(Object.values(h.packaging).filter((p) => p.batchId === r.id), (p) => p.packedSuits), r.id, 'Packaged output');
    const bom = h.boms[r.bomId];
    r.allocationIds.forEach((id) => ref(h.materialAllocations[id]?.batchId === r.id, r.id, 'allocation'));
    if (bom && r.status !== 'PLANNED') bom.lineIds.forEach((id) => {
      const line = h.bomLines[id]; const used = allocations.filter((a) => a.batchId === r.id && a.bomLineId === id);
      const started = r.targetSuits - r.plannedSuits;
      eq(sum(used, (a) => a.quantityMeters), roundQuantity(started * line.consumptionMetersPerSuit * (1 + line.wastePercent / 100)), r.id, 'BOM allocation');
      eq(sum(used, (a) => a.embeddedMeters), roundQuantity((r.completedSuits + r.rejectedSuits) * line.consumptionMetersPerSuit), r.id, 'Embedded material');
      eq(sum(used, (a) => a.wipMeters), roundQuantity(r.inProgressSuits * line.consumptionMetersPerSuit), r.id, 'WIP material');
    });
  });
  const materialTimeline = [...Object.values(state.movements).map((r) => ({ at: r.occurredAt, lot: r.lotId, location: r.locationId, quantity: r.quantityMeters })), ...allocations.map((r) => ({ at: r.date + 'T23:00:00.000Z', lot: r.lotId, location: r.sourceLocationId, quantity: -r.quantityMeters }))].sort((a, b) => a.at.localeCompare(b.at));
  const running = new Map<string, number>();
  materialTimeline.forEach((r) => { const key = r.lot + '|' + r.location; const n = roundQuantity((running.get(key) ?? 0) + r.quantity); running.set(key, n); if (n < 0) fail(r.lot, 'Historical production overdraft'); });
  allocations.forEach((r) => {
    const b = h.batches[r.batchId]; const line = h.bomLines[r.bomLineId]; const lot = state.lots[r.lotId];
    ref(b?.allocationIds.includes(r.id) && b.bomId === line?.bomId, r.id, 'batch/line');
    ref(lot?.fabricId === line?.fabricId && state.locations[r.sourceLocationId]?.category === 'PROCESSED', r.id, 'lot/material/location');
    eq(r.quantityMeters, r.embeddedMeters + r.wasteMeters + r.wipMeters, r.id, 'Material conservation');
    if (lot) {
      const grnLine = state.goodsReceiptLines[lot.sourceGoodsReceiptLineId]; const poLine = state.purchaseOrderLines[grnLine.purchaseOrderLineId];
      const receipts = Object.values(state.processingReceiptLines).filter((pr) => state.challanLines[pr.challanLineId].lotId === lot.id && state.processingReceipts[pr.processingReceiptId].status === 'POSTED');
      const output = sum(receipts, (pr) => pr.outputMeters); const charges = Object.values(h.processingCharges).filter((c) => receipts.some((pr) => pr.processingReceiptId === c.receiptId));
      const serviceRate = output ? sum(charges, (c) => c.totalPaisa) / output : 0;
      eq(r.costPaisa, multiplyMoney(poLine.unitPricePaisaPerMeter + serviceRate, r.quantityMeters), r.id, 'Material cost source');
    }
    if (b && r.date < b.date) fail(r.id, 'Allocation before batch');
  });
  Object.values(h.componentOutputs).forEach((r) => {
    const b = h.batches[r.batchId]; ref(b?.bomId === h.bomLines[r.bomLineId]?.bomId, r.id, 'component/batch/BOM');
    if (b) { eq(r.acceptedPieces, b.completedSuits, r.id, 'Accepted component output'); eq(r.rejectedPieces, b.rejectedSuits, r.id, 'Rejected components'); eq(r.wipPieces, b.inProgressSuits, r.id, 'Component WIP'); }
  });
  Object.values(h.batches).filter((b) => b.status !== 'PLANNED').forEach((b) => h.boms[b.bomId].lineIds.forEach((id) => { if (Object.values(h.componentOutputs).filter((o) => o.batchId === b.id && o.bomLineId === id).length !== 1) fail(b.id, 'Missing/duplicate component history'); }));
  Object.values(h.packaging).forEach((r) => {
    const batch = h.batches[r.batchId]; const sku = state.finishedSKUs[r.skuId];
    ref(batch?.designId === sku?.designId && sku?.colorVariantId === r.variantId, r.id, 'batch/sku/variant');
    ref(state.locations[r.warehouseLocationId]?.category === 'FINISHED_GOODS', r.id, 'finished warehouse');
    if (r.packedSuits > r.inspectionPassedSuits || r.damagedSuits > r.packedSuits || (batch && r.date < batch.date)) fail(r.id, 'Invalid inspected packaging');
  });
  const expected = new Map<string, number>();
  const effect = (sourceId: string, type: string, skuId: string, location: string, quantity: number) => [sourceId, type, skuId, location, quantity].join('|');
  const expectEffect = (key: string) => expected.set(key, (expected.get(key) ?? 0) + 1);
  Object.values(h.packaging).forEach((r) => { if (r.packedSuits) expectEffect(effect(r.id, 'PACKAGING', r.skuId, r.warehouseLocationId, r.packedSuits)); if (r.damagedSuits) expectEffect(effect(r.id, 'DAMAGE', r.skuId, r.warehouseLocationId, -r.damagedSuits)); });
  Object.values(h.salesOrders).forEach((r) => {
    ref(state.customers[r.customerId], r.id, 'customer');
    r.lineIds.forEach((id) => ref(h.salesLines[id]?.salesOrderId === r.id, r.id, 'sales line'));
    if (!r.lineIds.length || r.requiredOn < r.date) fail(r.id, 'Invalid order');
    const ordered = sum(r.lineIds, (id) => h.salesLines[id]?.suits ?? 0);
    const shipped = sum(Object.values(h.dispatchLines).filter((l) => r.lineIds.includes(l.salesLineId)), (l) => l.suits);
    if (shipped > ordered || (shipped > 0 && ['DRAFT', 'CANCELLED'].includes(r.status)) || (r.status === 'COMPLETED' && shipped !== ordered) || (r.status === 'PARTIALLY_DISPATCHED' && !(shipped > 0 && shipped < ordered))) fail(r.id, 'Order status/dispatch mismatch');
  });
  Object.values(h.salesLines).forEach((r) => {
    ref(h.salesOrders[r.salesOrderId]?.lineIds.includes(r.id), r.id, 'order'); ref(state.finishedSKUs[r.skuId], r.id, 'sku');
    if (r.discountPaisa > r.suits * r.unitPricePaisa) fail(r.id, 'Discount exceeds price');
    const dispatched = sum(Object.values(h.dispatchLines).filter((d) => d.salesLineId === r.id), (d) => d.suits);
    const reserved = sum(Object.values(h.reservations).filter((a) => a.salesLineId === r.id && a.status === 'ACTIVE'), (a) => a.suits);
    if (dispatched + reserved > r.suits) fail(r.id, 'Reservation/order overflow');
  });
  Object.values(h.reservations).forEach((r) => {
    const l = h.salesLines[r.salesLineId]; ref(l?.skuId === r.skuId && state.locations[r.locationId]?.category === 'FINISHED_GOODS', r.id, 'reserved sku/location');
    if (r.status === 'ACTIVE' && l && ['DRAFT', 'CANCELLED'].includes(h.salesOrders[l.salesOrderId].status)) fail(r.id, 'Inactive order reserved');
    if (l && (r.reservedOn < h.salesOrders[l.salesOrderId].date || r.reservedOn > h.asOf)) fail(r.id, 'Reservation chronology');
    if (r.status !== 'CANCELLED') {
      const physical = sum(Object.values(h.finishedMovements).filter((m) => m.skuId === r.skuId && m.locationId === r.locationId && m.date <= r.reservedOn), (m) => m.quantitySuits);
      const other = sum(Object.values(h.reservations).filter((a) => a.id !== r.id && a.status === 'ACTIVE' && a.skuId === r.skuId && a.locationId === r.locationId && a.reservedOn <= r.reservedOn), (a) => a.suits);
      if (r.suits + other > physical) fail(r.id, 'Reservation exceeds dated physical stock');
    }
  });
  Object.values(h.dispatches).forEach((r) => {
    ref(h.salesOrders[r.salesOrderId]?.customerId === r.customerId, r.id, 'customer/order');
    r.lineIds.forEach((id) => ref(h.dispatchLines[id]?.dispatchId === r.id, r.id, 'dispatch line'));
    if (h.salesOrders[r.salesOrderId]?.date > r.date) fail(r.id, 'Dispatch before order');
  });
  Object.values(h.dispatchLines).forEach((r) => {
    const d = h.dispatches[r.dispatchId]; const l = h.salesLines[r.salesLineId]; const reservation = h.reservations[r.reservationId];
    ref(d?.lineIds.includes(r.id) && l?.salesOrderId === d.salesOrderId && l.skuId === r.skuId, r.id, 'order/dispatch');
    ref(reservation?.salesLineId === l?.id && reservation?.status === 'COMPLETED' && reservation.suits === r.suits, r.id, 'consumed reservation');
    if (reservation) expectEffect(effect(r.id, 'DISPATCH', r.skuId, reservation.locationId, -r.suits));
  });
  const finished = new Map<string, number>();
  Object.values(h.finishedMovements).sort((a, b) => a.date.localeCompare(b.date) || b.quantitySuits - a.quantitySuits || a.id.localeCompare(b.id)).forEach((r) => {
    const key = effect(r.sourceId, r.sourceType, r.skuId, r.locationId, r.quantitySuits); const n = expected.get(key) ?? 0;
    if (!n) fail(r.id, 'Unexpected/duplicate finished posting'); else expected.set(key, n - 1);
    const balanceKey = r.skuId + '|' + r.locationId; const quantity = (finished.get(balanceKey) ?? 0) + r.quantitySuits; finished.set(balanceKey, quantity); if (quantity < 0) fail(r.id, 'Finished stock overdraft');
    const source = r.sourceType === 'DISPATCH' ? h.dispatches[h.dispatchLines[r.sourceId]?.dispatchId] : h.packaging[r.sourceId];
    if (source?.date !== r.date) fail(r.id, 'Finished movement chronology');
  });
  if ([...expected.values()].some((n) => n !== 0)) fail('finished', 'Missing finished movement');
  Object.values(h.reservations).filter((r) => r.status === 'ACTIVE').forEach((r) => { const key = r.skuId + '|' + r.locationId; finished.set(key, (finished.get(key) ?? 0) - r.suits); });
  if ([...finished.values()].some((n) => n < 0)) fail('finished', 'Negative available suits');
  Object.values(h.invoices).forEach((r) => {
    ref(state.customers[r.customerId], r.id, 'customer'); r.dispatchIds.forEach((id) => { ref(h.dispatches[id]?.customerId === r.customerId, r.id, 'dispatch customer'); if (h.dispatches[id]?.date > r.date) fail(r.id, 'Invoice before dispatch'); });
    r.lineIds.forEach((id) => ref(h.invoiceLines[id]?.invoiceId === r.id, r.id, 'invoice line'));
    eq(r.totalPaisa, sum(r.lineIds, (id) => h.invoiceLines[id]?.totalPaisa ?? 0), r.id, 'Invoice total');
    if (!r.lineIds.length || r.dueOn < r.date) fail(r.id, 'Invoice chronology');
    const paid = sum(Object.values(h.paymentAllocations).filter((a) => a.invoiceId === r.id), (a) => a.amountPaisa); if (paid > r.totalPaisa) fail(r.id, 'Invoice overpayment');
  });
  Object.values(h.invoiceLines).forEach((r) => {
    const d = h.dispatchLines[r.dispatchLineId]; const inv = h.invoices[r.invoiceId]; const sales = d && h.salesLines[d.salesLineId];
    ref(inv?.lineIds.includes(r.id) && inv.dispatchIds.includes(d?.dispatchId), r.id, 'invoice/dispatch');
    if (sales) { eq(r.unitPricePaisa, sales.unitPricePaisa, r.id, 'Price provenance'); eq(r.discountPaisa, Math.round(sales.discountPaisa * r.suits / sales.suits), r.id, 'Discount provenance'); }
    eq(r.totalPaisa, r.suits * r.unitPricePaisa - r.discountPaisa, r.id, 'Invoice line');
    if (d && sum(Object.values(h.invoiceLines).filter((l) => l.dispatchLineId === d.id), (l) => l.suits) > d.suits) fail(r.id, 'Overbilling dispatch');
  });
  Object.values(h.payments).forEach((r) => {
    ref(state.customers[r.customerId], r.id, 'customer'); r.allocationIds.forEach((id) => ref(h.paymentAllocations[id]?.paymentId === r.id, r.id, 'payment allocation'));
    if (sum(r.allocationIds, (id) => h.paymentAllocations[id]?.amountPaisa ?? 0) > r.amountPaisa) fail(r.id, 'Payment overallocated');
  });
  Object.values(h.paymentAllocations).forEach((r) => {
    const p = h.payments[r.paymentId]; const i = h.invoices[r.invoiceId];
    ref(p?.allocationIds.includes(r.id) && p.customerId === i?.customerId, r.id, 'payment/invoice/customer');
    if (p && i && p.date < i.date) fail(r.id, 'Payment before invoice');
  });
  Object.values(h.supplierInvoices).forEach((r) => {
    const grn = state.goodsReceipts[r.goodsReceiptId]; ref(grn?.status === 'POSTED' && state.purchaseOrders[grn.purchaseOrderId]?.supplierId === r.supplierId, r.id, 'supplier/GRN');
    if (grn) { eq(r.totalPaisa, sum(grn.lineIds, (id) => { const l = state.goodsReceiptLines[id]; return multiplyMoney(state.purchaseOrderLines[l.purchaseOrderLineId].unitPricePaisaPerMeter, l.quantityMeters); }), r.id, 'Supplier bill'); if (r.date < grn.receivedOn) fail(r.id, 'Supplier invoice chronology'); }
    if (r.dueOn < r.date || Object.values(h.supplierInvoices).filter((i) => i.goodsReceiptId === r.goodsReceiptId).length !== 1) fail(r.id, 'Supplier bill duplicate/due date');
  });
  Object.values(h.expenses).forEach((r) => { if (r.batchId) { ref(h.batches[r.batchId], r.id, 'expense batch'); if (h.batches[r.batchId]?.date > r.date) fail(r.id, 'Expense before batch'); } });
  for (const [key, entries] of Object.entries(h)) {
    if (typeof entries !== 'object') continue;
    const rows = Object.values(entries) as Record<string, unknown>[];
    const moneyKeys = new Set(rows.flatMap((r) => Object.keys(r).filter((field) => field.endsWith('Paisa'))));
    for (const field of moneyKeys) if (!Number.isSafeInteger(sum(rows, (r) => Number(r[field] ?? 0)))) fail(key, 'Unsafe aggregate money: ' + field);
  }
  return issues;
}
