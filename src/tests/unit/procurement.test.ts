import { describe, expect, it, beforeAll } from 'vitest';
import { createSeedState, DEMO_IDS } from '@/data/seed';
import { createExpandedSeed } from '@/data/seed/expanded-seed';
import type { DomainState } from '@/domain/entities';
import { executeProcurement, type ProcurementCommand, type ProcurementContext } from '@/services/transactions/procurement';
import { getAvailableMeters, getReconciliation } from '@/services/inventory';
import { validateDomainState } from '@/domain/validators/state';
import { receivedMeters, orderLineTotal, supplierLedger, receiptLineValue, purchaseSummary } from '@/store/selectors/procurement';
import { createERPStore } from '@/store';
import { MemoryStorage } from '@/tests/fixtures/memory-storage';
import { encodeSnapshot, decodeSnapshot, STORAGE_KEY } from '@/services/storage';
import { selectGlobalSearch } from '@/store/selectors/ui';
import { selectProcurementAlerts } from '@/store/selectors/procurement-alerts';
import { purchaseReportRows } from '@/features/purchasing/report-rows';
const context: ProcurementContext = { actorId: DEMO_IDS.actor, at: '2026-10-14T08:00:00.000Z', role: 'owner' };
const supplier: ProcurementCommand = { kind: 'saveSupplier', name: 'نمونہ سپلائر', code: 'SUP-TEST', city: 'لاہور', contact: 'نمونہ رابطہ', phone: '03000000000', address: 'نمونہ مارکیٹ', category: 'کاٹن', termDays: 30, status: 'ACTIVE', email: 'demo@example.test', alternatePhone: '', notes: '', openingBalancePaisa: 0, creditLimitPaisa: 10000000 };
function act(state: DomainState, command: ProcurementCommand, ctx = context) { const result = executeProcurement(state, command, ctx); if (!result.ok) throw new Error(result.error.message); return result.state; }
function foundation(state = createSeedState()) {
  let next = act(state, supplier); const supplierId = 'supplier:user:SUP-TEST';
  const fabric: ProcurementCommand = { kind: 'saveFabric', name: 'ٹیسٹ لان', code: 'FAB-TEST', composition: 'کاٹن لان', category: 'لان', width: 58, widthUnit: 'INCH', gsm: 90, inventoryUnit: 'METER', defaultUnit: 'METER', supplierId, ratePaisa: 25000, grade: 'A', reorderMeters: 100, description: '', status: 'ACTIVE' };
  next = act(next, fabric); return { state: next, supplierId, fabricId: 'fabric:user:FAB-TEST', fabric };
}
function purchase(base = createSeedState(), quantity = 1000) {
  const f = foundation(base);
  let state = act(f.state, { kind: 'savePO', supplierId: f.supplierId, date: '2026-10-14', expectedOn: '2026-10-20', warehouseLocationId: DEMO_IDS.greyLocation, termDays: 30, notes: '', lines: [{ fabricId: f.fabricId, quantity, unit: 'METER', measuredLengths: [], ratePaisaPerMeter: 25000, discountPaisa: 0, specification: '۵۸ انچ' }] });
  const po = Object.values(state.purchaseOrders).find((r) => r.origin === 'USER')!;
  state = act(state, { kind: 'poAction', id: po.id, action: 'APPROVE' });
  return { ...f, state, poId: po.id, poLineId: po.lineIds[0] };
}
function receive(input: ReturnType<typeof purchase>, meters: number, extraRejected = 0) {
  let state = act(input.state, { kind: 'saveGRN', purchaseOrderId: input.poId, date: '2026-10-14', warehouseLocationId: DEMO_IDS.greyLocation, receivedById: DEMO_IDS.actor, transport: '', supplierChallan: 'TEST-CHALLAN', notes: '', rolls: [
    { purchaseOrderLineId: input.poLineId, label: 'ROLL-A', measuredLength: meters, measurementUnit: 'METER', packagingUnit: 'ROLL', widthInches: 58, grade: 'A', result: 'ACCEPTED', remarks: '' },
    ...(extraRejected ? [{ purchaseOrderLineId: input.poLineId, label: 'ROLL-R', measuredLength: extraRejected, measurementUnit: 'METER' as const, packagingUnit: 'ROLL' as const, widthInches: 58, grade: 'C', result: 'REJECTED' as const, remarks: 'معیار ناقص' }] : []),
  ] });
  const grn = Object.values(state.goodsReceipts).filter((r) => r.status === 'DRAFT').at(-1)!;
  state = act(state, { kind: 'postGRN', id: grn.id });
  return { ...input, state, grnId: grn.id, receiptLineId: grn.lineIds[0], lotId: state.goodsReceiptLines[grn.lineIds[0]].lotId };
}
function billed() {
  const r = receive(purchase(), 1000);
  let state = act(r.state, { kind: 'createBill', supplierId: r.supplierId, receiptIds: [r.grnId], reference: 'INV-TEST', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 });
  const bill = Object.values(state.procurement!.bills)[0];
  state = act(state, { kind: 'postBill', id: bill.id }); return { ...r, state, billId: bill.id };
}
describe('procurement masters and requests', () => {
  it('creates linked suppliers/fabrics without creating inventory', () => { const f = foundation(); expect(Object.keys(f.state.suppliers)).toHaveLength(2); expect(Object.keys(f.state.fabrics)).toHaveLength(2); expect(getReconciliation(f.state)).toMatchObject({ grey: 600, processed: 380, difference: 0 }); });
  it('rejects duplicate supplier/fabric codes without mutating input', () => { const f = foundation(), before = JSON.stringify(f.state); expect(executeProcurement(f.state, supplier, context).ok).toBe(false); expect(executeProcurement(f.state, f.fabric, context).ok).toBe(false); expect(JSON.stringify(f.state)).toBe(before); });
  it('retains references when deactivating suppliers and fabrics', () => { const f = purchase(); let state = act(f.state, { kind: 'deactivateSupplier', id: f.supplierId }); state = act(state, { kind: 'deactivateFabric', id: f.fabricId }); expect(state.purchaseOrders[f.poId].supplierId).toBe(f.supplierId); expect(state.suppliers[f.supplierId].status).toBe('INACTIVE'); expect(validateDomainState(state).ok).toBe(true); });
  it('locks used fabric identity but allows changing future rates', () => { const f = purchase(); expect(executeProcurement(f.state, { ...f.fabric, id: f.fabricId, width: 60 }, context).ok).toBe(false); const state = act(f.state, { ...f.fabric, id: f.fabricId, ratePaisa: 27000 }); expect(state.purchaseOrderLines[f.poLineId].unitPricePaisaPerMeter).toBe(25000); });
  it.each([0, -1, 201])('rejects invalid width %s', (width) => { const f = foundation(); expect(executeProcurement(f.state, { ...f.fabric, code: 'OTHER', width }, context).ok).toBe(false); });
  it('rejects unsupported fabric units and fractional paisa rates', () => { const f = foundation(); expect(executeProcurement(f.state, { ...f.fabric, inventoryUnit: 'SUIT' } as unknown as ProcurementCommand, context).ok).toBe(false); expect(executeProcurement(f.state, { ...f.fabric, code: 'OTHER', ratePaisa: 25000.5 }, context).ok).toBe(false); });
  it('supports requests, rejects conversion after rejection and converts approved requests once', () => {
    const f = foundation(); const command: ProcurementCommand = { kind: 'saveRequest', date: '2026-10-14', requestedById: DEMO_IDS.actor, department: 'گودام', fabricId: f.fabricId, quantity: 1000, unit: 'METER', measuredLengths: [], requiredOn: '2026-10-20', reason: 'اسٹاک کی ضرورت', priority: 'NORMAL' };
    let state = act(f.state, command); const request = Object.values(state.procurement!.requests)[0];
    state = act(state, { kind: 'requestAction', id: request.id, action: 'SUBMIT' }); const rejected = act(state, { kind: 'requestAction', id: request.id, action: 'REJECT' });
    const po: ProcurementCommand = { kind: 'savePO', supplierId: f.supplierId, date: '2026-10-14', expectedOn: '2026-10-20', warehouseLocationId: DEMO_IDS.greyLocation, termDays: 30, notes: '', requestId: request.id, lines: [{ fabricId: f.fabricId, quantity: 1000, unit: 'METER', measuredLengths: [], ratePaisaPerMeter: 25000, discountPaisa: 0, specification: '' }] };
    expect(executeProcurement(rejected, po, context).ok).toBe(false);
    state = act(state, { kind: 'requestAction', id: request.id, action: 'APPROVE' }); state = act(state, po);
    expect(state.procurement!.requests[request.id].status).toBe('CONVERTED'); expect(executeProcurement(state, po, context).ok).toBe(false);
  });
  it('enforces simulated approval roles', () => { const f = purchase(); expect(executeProcurement(f.state, { kind: 'savePO', supplierId: f.supplierId, date: '2026-10-14', expectedOn: '2026-10-20', warehouseLocationId: DEMO_IDS.greyLocation, termDays: 30, notes: '', lines: [{ fabricId: f.fabricId, quantity: 1, unit: 'METER', measuredLengths: [], ratePaisaPerMeter: 25000, discountPaisa: 0, specification: '' }] }, { ...context, role: 'sales' }).ok).toBe(false); });
});
describe('PO and measured GRN lifecycle', () => {
  it('creates a draft PO with no stock and explicit line discount', () => { const f = foundation(); const state = act(f.state, { kind: 'savePO', supplierId: f.supplierId, date: '2026-10-14', expectedOn: '2026-10-20', warehouseLocationId: DEMO_IDS.greyLocation, termDays: 30, notes: '', lines: [{ fabricId: f.fabricId, quantity: 1000, unit: 'METER', measuredLengths: [], ratePaisaPerMeter: 25000, discountPaisa: 500000, specification: '' }] }); const po = Object.values(state.purchaseOrders).find((p) => p.origin === 'USER')!; expect(po.status).toBe('DRAFT'); expect(orderLineTotal(state, po.lineIds[0])).toBe(24500000); expect(getReconciliation(state).grey).toBe(600); });
  it('allows cancelling unreceived POs and blocks posting after cancellation', () => { const f = purchase(); const state = act(f.state, { kind: 'poAction', id: f.poId, action: 'CANCEL' }); expect(state.purchaseOrders[f.poId].status).toBe('CANCELLED'); expect(() => receive({ ...f, state }, 10)).toThrow(); });
  it('receives 400 + 350 meters and leaves exactly 250 meters', () => { const f = purchase(); const first = receive(f, 400); const second = receive(first, 350); expect(receivedMeters(second.state, f.poLineId)).toBe(750); expect(second.state.purchaseOrderLines[f.poLineId].quantityMeters - receivedMeters(second.state, f.poLineId)).toBe(250); expect(second.state.purchaseOrders[f.poId].status).toBe('PARTIALLY_RECEIVED'); expect(getReconciliation(second.state).grey).toBe(1350); expect(() => receive(second, 250.0001)).toThrow(); });
  it('rejects duplicate posting and keeps exact movement counts', () => { const r = receive(purchase(), 100); const before = JSON.stringify(r.state), count = Object.keys(r.state.movements).length; expect(executeProcurement(r.state, { kind: 'postGRN', id: r.grnId }, context).ok).toBe(false); expect(Object.keys(r.state.movements)).toHaveLength(count); expect(JSON.stringify(r.state)).toBe(before); });
  it('quarantines/rejects measured material without admitting it to available stock', () => { const r = receive(purchase(), 100, 20); expect(getAvailableMeters(r.state, r.lotId, DEMO_IDS.greyLocation, 'GREY')).toBe(100); expect(Object.values(r.state.procurement!.inspectionRolls).find((r) => r.result === 'REJECTED')?.canonicalMeters).toBe(20); const row = Object.values(r.state.procurement!.inspectionRolls).find((r) => r.result === 'REJECTED')!; const state = act(r.state, { kind: 'resolveRejectedRoll', id: row.id }); expect(state.procurement!.inspectionRolls[row.id].resolution).toBe('RETURNED_TO_SUPPLIER'); });
  it('preserves actual meter/yard measurements and roll/thaan PO totals', () => { const f = foundation(); let state = act(f.state, { kind: 'savePO', supplierId: f.supplierId, date: '2026-10-14', expectedOn: '2026-10-20', warehouseLocationId: DEMO_IDS.greyLocation, termDays: 0, notes: '', lines: [{ fabricId: f.fabricId, quantity: 3, unit: 'ROLL', measuredLengths: [54.5, 62, 48.75], ratePaisaPerMeter: 25000, discountPaisa: 0, specification: '' }] }); const po = Object.values(state.purchaseOrders).find((r) => r.origin === 'USER')!; expect(state.purchaseOrderLines[po.lineIds[0]].quantityMeters).toBe(165.25); state = act(state, { kind: 'poAction', id: po.id, action: 'APPROVE' }); state = act(state, { kind: 'saveGRN', purchaseOrderId: po.id, date: '2026-10-14', warehouseLocationId: DEMO_IDS.greyLocation, receivedById: DEMO_IDS.actor, transport: '', supplierChallan: 'YARD', notes: '', rolls: [{ purchaseOrderLineId: po.lineIds[0], label: 'YARD-ROLL', measuredLength: 10, measurementUnit: 'YARD', packagingUnit: 'THAAN', widthInches: 58, grade: 'A', result: 'ACCEPTED', remarks: '' }] }); const grn = Object.values(state.goodsReceipts).find((r) => r.status === 'DRAFT')!; state = act(state, { kind: 'postGRN', id: grn.id }); expect(state.goodsReceiptLines[grn.lineIds[0]].quantityMeters).toBe(9.144); });
  it('rejects tampered measured-roll totals during import validation', () => { const r = receive(purchase(), 100); const row = Object.values(r.state.procurement!.inspectionRolls)[0]; row.canonicalMeters += 1; expect(validateDomainState(r.state).ok).toBe(false); });
});
describe('bills, payments, ledger and compensating returns', () => {
  it('does not count a draft bill or PO as a posted supplier liability', () => { const f = receive(purchase(), 100); expect(supplierLedger(f.state, f.supplierId).outstanding).toBe(0); const state = act(f.state, { kind: 'createBill', supplierId: f.supplierId, receiptIds: [f.grnId], reference: 'REF', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 }); expect(supplierLedger(state, f.supplierId).outstanding).toBe(0); });
  it('posts bills once and prevents billing the same receipt again', () => { const f = billed(); expect(supplierLedger(f.state, f.supplierId).outstanding).toBe(25000000); expect(executeProcurement(f.state, { kind: 'postBill', id: f.billId }, context).ok).toBe(false); expect(executeProcurement(f.state, { kind: 'createBill', supplierId: f.supplierId, receiptIds: [f.grnId], reference: 'DUP', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 }, context).ok).toBe(false); });
  it('posts partial payments, reconciles ledger and retains unapplied advance', () => { const f = billed(); let state = act(f.state, { kind: 'createPayment', supplierId: f.supplierId, date: '2026-10-14', amountPaisa: 10500000, method: 'BANK', reference: 'BANK-REF', notes: '', allocations: [{ billId: f.billId, amountPaisa: 10000000 }] }); const payment = Object.values(state.procurement!.payments)[0]; expect(supplierLedger(state, f.supplierId).outstanding).toBe(25000000); state = act(state, { kind: 'postPayment', id: payment.id }); expect(supplierLedger(state, f.supplierId)).toMatchObject({ outstanding: 15000000, paid: 10500000, advance: 500000 }); expect(executeProcurement(state, { kind: 'postPayment', id: payment.id }, context).ok).toBe(false); });
  it('rejects over-allocation and cross-supplier bill allocations', () => { const f = billed(); expect(executeProcurement(f.state, { kind: 'createPayment', supplierId: f.supplierId, date: '2026-10-14', amountPaisa: 1, method: 'CASH', reference: 'BAD', notes: '', allocations: [{ billId: f.billId, amountPaisa: 2 }] }, context).ok).toBe(false); const state = act(f.state, { ...supplier, code: 'OTHER' }); expect(executeProcurement(state, { kind: 'createPayment', supplierId: 'supplier:user:OTHER', date: '2026-10-14', amountPaisa: 1, method: 'CASH', reference: 'BAD', notes: '', allocations: [{ billId: f.billId, amountPaisa: 1 }] }, context).ok).toBe(false); });
  it('returns available partial roll quantity with stock-out and bill credit, retaining original history', () => { const f = billed(), roll = Object.values(f.state.rolls).find((r) => r.lotId === f.lotId)!; let state = act(f.state, { kind: 'createReturn', goodsReceiptLineId: f.receiptLineId, rollId: roll.id, quantityMeters: 100, date: '2026-10-14', reason: 'معیار', condition: 'بغیر استعمال' }); const r = Object.values(state.procurement!.returns)[0]; state = act(state, { kind: 'returnAction', id: r.id, action: 'APPROVE' }); state = act(state, { kind: 'returnAction', id: r.id, action: 'POST' }); expect(getAvailableMeters(state, f.lotId, DEMO_IDS.greyLocation, 'GREY')).toBe(900); expect(supplierLedger(state, f.supplierId).outstanding).toBe(22500000); expect(state.goodsReceipts[f.grnId].status).toBe('POSTED'); expect(state.rolls[roll.id].actualLengthMeters).toBe(1000); expect(getReconciliation(state).balanced).toBe(true); expect(executeProcurement(state, { kind: 'returnAction', id: r.id, action: 'POST' }, context).ok).toBe(false); });
  it('rejects insufficient stock and disallows returning material held by processing', () => { const f = billed(); expect(executeProcurement(f.state, { kind: 'createReturn', goodsReceiptLineId: f.receiptLineId, quantityMeters: 1001, date: '2026-10-14', reason: 'معیار', condition: 'بغیر استعمال' }, context).ok).toBe(false); expect(executeProcurement(createSeedState(), { kind: 'createReturn', goodsReceiptLineId: DEMO_IDS.goodsReceiptLine, quantityMeters: 601, date: '2026-10-14', reason: 'معیار', condition: 'بغیر استعمال' }, context).ok).toBe(false); });
  it('returns unbilled material without invented credit and bills only retained quantity', () => { const f = receive(purchase(), 1000); let state = act(f.state, { kind: 'createReturn', goodsReceiptLineId: f.receiptLineId, quantityMeters: 100, date: '2026-10-14', reason: 'معیار', condition: 'نیا' }); const r = Object.values(state.procurement!.returns)[0]; state = act(state, { kind: 'returnAction', id: r.id, action: 'APPROVE' }); state = act(state, { kind: 'returnAction', id: r.id, action: 'POST' }); expect(state.procurement!.returns[r.id].creditPaisa).toBe(0); state = act(state, { kind: 'createBill', supplierId: f.supplierId, receiptIds: [f.grnId], reference: 'NET', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 }); const bill = Object.values(state.procurement!.bills)[0]; state = act(state, { kind: 'postBill', id: bill.id }); expect(supplierLedger(state, f.supplierId).outstanding).toBe(22500000); });
  it('keeps bills/payment totals separate from receipt valuation in reporting', () => { const f = billed(); const report = purchaseSummary(f.state, '2026-11-15'); expect(report.payable).toBe(25000000); expect(report.received).toBe(50000000); expect(report.overdue).toBe(1); expect(receiptLineValue(f.state, f.receiptLineId)).toBe(25000000); });
});
describe('additional posting boundaries', () => {
  it('searches source documents, derives real due alerts, and filters receipt reports by fabric', () => {
    const f = billed();
    for (const doc of [f.state.purchaseOrders[f.poId], f.state.goodsReceipts[f.grnId], f.state.procurement!.bills[f.billId]]) {
      const result = selectGlobalSearch(f.state, doc.number).find((r) => r.id === doc.id);
      expect(result?.path).toContain(encodeURIComponent(doc.id));
      expect(result?.path).not.toContain(':id');
    }
    expect(selectProcurementAlerts(f.state, '2026-11-15').some((r) => r.path.endsWith(encodeURIComponent(f.billId)))).toBe(true);
    const rows = purchaseReportRows(f.state, 'grn', { from: '', to: '', supplierId: '', fabricId: f.fabricId });
    expect(rows.map((r) => r.id)).toEqual([f.grnId]);
  });
  it('posts an entirely rejected delivery as inspection evidence without stock or PO receipt', () => {
    const f = purchase();
    let state = act(f.state, { kind: 'saveGRN', purchaseOrderId: f.poId, date: '2026-10-14', warehouseLocationId: DEMO_IDS.greyLocation, receivedById: DEMO_IDS.actor, transport: '', supplierChallan: 'REJECTED', notes: '', rolls: [{ purchaseOrderLineId: f.poLineId, label: 'BAD', measuredLength: 50, measurementUnit: 'METER', packagingUnit: 'ROLL', widthInches: 58, grade: 'C', result: 'REJECTED', remarks: 'خراب' }] });
    const grn = Object.values(state.goodsReceipts).find((r) => r.origin === 'USER')!;
    const movementCount = Object.keys(state.movements).length;
    state = act(state, { kind: 'postGRN', id: grn.id });
    expect(state.goodsReceipts[grn.id]).toMatchObject({ status: 'POSTED', lineIds: [] });
    expect(receivedMeters(state, f.poLineId)).toBe(0);
    expect(Object.keys(state.movements)).toHaveLength(movementCount);
    expect(getReconciliation(state).grey).toBe(600);
    expect(validateDomainState(state).ok).toBe(true);
  });
  it('bills multiple partial GRNs once and allocates one payment to multiple bills', () => {
    const first = receive(purchase(), 400), second = receive(first, 350), third = receive(second, 250);
    let state = act(third.state, { kind: 'createBill', supplierId: first.supplierId, receiptIds: [first.grnId, second.grnId], reference: 'MULTI', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 });
    const bill1 = Object.values(state.procurement!.bills)[0];
    state = act(state, { kind: 'postBill', id: bill1.id });
    state = act(state, { kind: 'createBill', supplierId: first.supplierId, receiptIds: [third.grnId], reference: 'LAST', date: '2026-10-14', dueOn: '2026-11-14', discountPaisa: 0, chargesPaisa: 0 });
    const bill2 = Object.values(state.procurement!.bills).at(-1)!;
    state = act(state, { kind: 'postBill', id: bill2.id });
    expect(bill1.totalPaisa).toBe(18750000);
    state = act(state, { kind: 'createPayment', supplierId: first.supplierId, date: '2026-10-14', amountPaisa: 15000000, method: 'CHEQUE', reference: 'MULTI-PAY', notes: '', allocations: [{ billId: bill1.id, amountPaisa: 10000000 }, { billId: bill2.id, amountPaisa: 5000000 }] });
    state = act(state, { kind: 'postPayment', id: Object.values(state.procurement!.payments)[0].id });
    expect(supplierLedger(state, first.supplierId)).toMatchObject({ outstanding: 10000000, paid: 15000000, advance: 0 });
  });
  it('cancels draft payments without financial effects and prevents their posting', () => {
    const f = billed();
    let state = act(f.state, { kind: 'createPayment', supplierId: f.supplierId, date: '2026-10-14', amountPaisa: 100, method: 'CASH', reference: 'CANCEL', notes: '', allocations: [] });
    const id = Object.keys(state.procurement!.payments)[0];
    state = act(state, { kind: 'cancelPayment', id });
    expect(supplierLedger(state, f.supplierId)).toMatchObject({ paid: 0, outstanding: 25000000 });
    expect(executeProcurement(state, { kind: 'postPayment', id }, context).ok).toBe(false);
  });
  it('preserves a recoverable supplier credit when paid goods are returned', () => {
    const f = billed();
    let state = act(f.state, { kind: 'createPayment', supplierId: f.supplierId, date: '2026-10-14', amountPaisa: 25000000, method: 'CASH', reference: 'FULL', notes: '', allocations: [{ billId: f.billId, amountPaisa: 25000000 }] });
    state = act(state, { kind: 'postPayment', id: Object.keys(state.procurement!.payments)[0] });
    state = act(state, { kind: 'createReturn', goodsReceiptLineId: f.receiptLineId, quantityMeters: 100, date: '2026-10-14', reason: 'واپسی', condition: 'نیا' });
    const id = Object.keys(state.procurement!.returns)[0];
    state = act(state, { kind: 'returnAction', id, action: 'APPROVE' });
    state = act(state, { kind: 'returnAction', id, action: 'POST' });
    expect(supplierLedger(state, f.supplierId)).toMatchObject({ outstanding: 0, supplierCredit: 2500000 });
    expect(getReconciliation(state).balanced).toBe(true);
  });
});

describe('saved-state and historical compatibility', () => {
  let expanded: DomainState;
  beforeAll(() => { expanded = createExpandedSeed(); });
  it('creates new operations without altering historical seed maps or baseline figures', () => { const before = JSON.stringify(expanded.history); const f = purchase(expanded); expect(JSON.stringify(f.state.history)).toBe(before); expect(f.state.purchaseOrders[f.poId].number).toBe('PO-2026-0021'); expect(getReconciliation(f.state)).toMatchObject({ purchased: 52920, grey: 15520, contractor: 5501, finished: 712 }); });
  it('keeps historical POs read-only and supports only available aggregate historical returns', () => { expect(executeProcurement(expanded, { kind: 'poAction', id: Object.keys(expanded.purchaseOrders)[0], action: 'CANCEL' }, context).ok).toBe(false); const line = Object.values(expanded.goodsReceiptLines)[0]; let state = act(expanded, { kind: 'createReturn', goodsReceiptLineId: line.id, quantityMeters: 10, date: '2026-10-14', reason: 'واپسی', condition: 'غیر استعمال' }); const r = Object.values(state.procurement!.returns)[0]; state = act(state, { kind: 'returnAction', id: r.id, action: 'APPROVE' }); state = act(state, { kind: 'returnAction', id: r.id, action: 'POST' }); expect(getReconciliation(state).balanced).toBe(true); expect(JSON.stringify(state.history)).toBe(JSON.stringify(expanded.history)); });
  it('commits one operational snapshot, restores on refresh, and preserves data on failed writes', () => { const storage = new MemoryStorage(), store = createERPStore(storage), before = storage.writes; expect(store.getState().applyTransaction((data) => executeProcurement(data, supplier, context)).ok).toBe(true); expect(storage.writes).toBe(before + 1); expect(createERPStore(storage).getState().data).toEqual(store.getState().data); const raw = storage.getItem(STORAGE_KEY), data = store.getState().data; storage.failWrites = true; expect(store.getState().applyTransaction((s) => executeProcurement(s, { ...supplier, code: 'NEW' }, context)).ok).toBe(false); expect(store.getState().data).toBe(data); expect(storage.getItem(STORAGE_KEY)).toBe(raw); });
  it('round-trips additive schema-1 procurement data and rejects tampered movements', () => { const f = billed(), encoded = encodeSnapshot(f.state); expect(encoded.ok).toBe(true); if (encoded.ok) { const decoded = decodeSnapshot(encoded.value); expect(decoded.ok).toBe(true); if (decoded.ok) expect(decoded.value.data).toEqual(f.state); } const m = Object.values(f.state.movements).find((r) => r.sourceDocumentId === f.grnId)!; m.quantityMeters++; expect(validateDomainState(f.state).ok).toBe(false); });
});
