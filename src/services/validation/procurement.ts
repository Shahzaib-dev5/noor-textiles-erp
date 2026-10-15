import type { DomainState } from '@/domain/entities';
import { toMeters, roundQuantity } from '@/domain/value-objects/quantity';
import { multiplyMoney } from '@/domain/value-objects/money';
import { supplierProfile, fabricProfile, orderLineTotal, receiptLineValue, supplierBills, purchaseSum, proportionPaisa, returnCredit } from '@/store/selectors/procurement';
export function inspectProcurement(state: DomainState): string[] {
  const p = state.procurement; if (!p) return [];
  const problems: string[] = [], fail = (id: string, message: string) => problems.push(id + ': ' + message);
  const ref = (exists: unknown, id: string) => { if (!exists) fail(id, 'متعلقہ ریکارڈ درست نہیں۔'); };
  const allIds = new Set(Object.entries(state).filter(([k]) => !['history', 'procurement','warehouse','processing','studio'].includes(k)).flatMap(([, rows]) => Object.keys(rows)));
  const numbers = new Set([...Object.values(state.purchaseOrders), ...Object.values(state.goodsReceipts), ...Object.values(state.challans), ...Object.values(state.processingReceipts)].map((r) => r.number));
  for (const rows of Object.values(state.history ?? {})) if (typeof rows === 'object') for (const r of Object.values(rows) as { id: string; number?: string }[]) { allIds.add(r.id); if (r.number) numbers.add(r.number); }
  ref(state.companies[p.companyId], p.companyId);
  for (const rows of Object.values(p)) if (typeof rows === 'object') for (const [key, raw] of Object.entries(rows)) {
    const r = raw as { id: string; companyId: string; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string; number?: string };
    if (key !== r.id || allIds.has(r.id)) fail(key, 'شناخت دہرائی گئی ہے۔'); allIds.add(r.id);
    if (r.companyId !== p.companyId || !state.employees[r.createdBy] || !state.employees[r.updatedBy] || r.createdAt > r.updatedAt) fail(key, 'کمپنی یا آڈٹ معلومات درست نہیں۔');
    if (r.number) { if (numbers.has(r.number)) fail(key, 'دستاویز نمبر دہرایا گیا ہے۔'); numbers.add(r.number); }
  }
  for (const [records, profiles, field] of [[state.suppliers, p.supplierProfiles, 'supplierId'], [state.fabrics, p.fabricProfiles, 'fabricId']] as const) {
    const keys = new Set<string>();
    for (const r of Object.values(profiles)) {
      const reference = 'fabricId' in r ? r.fabricId : r.supplierId;
      ref(reference in records, r.id);
      if (keys.has(reference)) fail(r.id, 'ماسٹر پروفائل دہرایا گیا ہے۔'); keys.add(reference);
    }
    const codes = new Set<string>();
    for (const recordId of Object.keys(records)) {
      const code = (field === 'supplierId' ? supplierProfile(state, recordId).code : fabricProfile(state, recordId).code).trim().toUpperCase();
      if (codes.has(code)) fail(recordId, 'ماسٹر کوڈ دہرایا گیا ہے۔'); codes.add(code);
    }
  }
  Object.values(p.fabricProfiles).forEach((r) => {
    ref(state.suppliers[r.supplierId], r.id); const fabric = state.fabrics[r.fabricId];
    if (fabric && Math.abs(fabric.widthInches - (r.widthUnit === 'CM' ? roundQuantity(r.width / 2.54) : r.width)) > .00005) fail(r.id, 'چوڑائی کا حساب درست نہیں۔');
  });
  Object.values(p.requests).forEach((r) => {
    ref(state.fabrics[r.fabricId] && state.employees[r.requestedById], r.id);
    if (toMeters(r.quantity, r.unit, r.measuredLengths) !== r.quantityMeters || r.requiredOn < r.date) fail(r.id, 'درخواست کی مقدار یا تاریخ درست نہیں۔');
    if (r.status === 'CONVERTED') {
      const po = r.poId && state.purchaseOrders[r.poId]; ref(po, r.id);
      const terms = Object.values(p.orderProfiles).find((o) => o.requestId === r.id);
      ref(terms?.purchaseOrderId === r.poId, r.id);
      if (po && !po.lineIds.some((id) => state.purchaseOrderLines[id].fabricId === r.fabricId && state.purchaseOrderLines[id].quantityMeters >= r.quantityMeters)) fail(r.id, 'درخواست کا کپڑا یا مقدار آرڈر میں موجود نہیں۔');
    } else if (r.poId) fail(r.id, 'غیر تبدیل شدہ درخواست کا آرڈر حوالہ موجود ہے۔');
  });
  Object.values(p.orderProfiles).forEach((r) => {
    const po = state.purchaseOrders[r.purchaseOrderId]; ref(po?.origin === 'USER', r.id); ref(state.locations[r.warehouseLocationId]?.category === 'GREY', r.id);
    if (po && r.expectedOn < po.orderDate) fail(r.id, 'متوقع تاریخ آرڈر سے پہلے ہے۔');
    if (r.requestId) ref(p.requests[r.requestId]?.poId === r.purchaseOrderId, r.id);
    if (r.closedAt && po && !['PARTIALLY_RECEIVED', 'COMPLETED'].includes(po.status)) fail(r.id, 'غلط حالت میں آرڈر بند ہے۔');
  });
  Object.values(p.orderLines).forEach((r) => {
    const line = state.purchaseOrderLines[r.purchaseOrderLineId]; ref(line, r.id);
    if (line && (toMeters(r.originalQuantity, r.unit, r.measuredLengths) !== line.quantityMeters || r.discountPaisa > multiplyMoney(line.unitPricePaisaPerMeter, line.quantityMeters))) fail(r.id, 'آرڈر لائن کی مقدار یا رعایت درست نہیں۔');
    if (line && !Object.values(p.orderProfiles).some((o) => o.purchaseOrderId === line.purchaseOrderId)) fail(r.id, 'آرڈر لائن کے شرائط نہیں۔');
  });
  Object.values(p.receiptProfiles).forEach((r) => {
    const grn = state.goodsReceipts[r.goodsReceiptId]; ref(grn?.origin === 'USER' && state.employees[r.receivedById], r.id);
    if (!grn) return;
    if (grn.receivedOn < state.purchaseOrders[grn.purchaseOrderId].orderDate) fail(r.id, 'وصولی آرڈر سے پہلے ہے۔');
    const terms = Object.values(p.orderProfiles).find((o) => o.purchaseOrderId === grn.purchaseOrderId);
    if (terms?.closedAt && grn.status === 'POSTED' && grn.updatedAt > terms.closedAt) fail(r.id, 'بند آرڈر پر نئی وصولی۔');
    const rolls = Object.values(p.inspectionRolls).filter((l) => l.goodsReceiptId === grn.id);
    if (!rolls.length) fail(r.id, 'رول کی پیمائشیں درکار ہیں۔');
    for (const id of grn.lineIds) {
      const line = state.goodsReceiptLines[id]; const accepted = rolls.filter((l) => l.receiptLineId === id && l.result === 'ACCEPTED');
      if (roundQuantity(purchaseSum(accepted, (a) => a.canonicalMeters)) !== line.quantityMeters) fail(id, 'منظور شدہ رولز اور وصولی کا مجموعہ مختلف ہے۔');
    }
  });
  Object.values(p.inspectionRolls).forEach((r) => {
    const grn = state.goodsReceipts[r.goodsReceiptId], line = state.purchaseOrderLines[r.purchaseOrderLineId]; ref(grn && line?.purchaseOrderId === grn.purchaseOrderId, r.id);
    ref(state.locations[r.locationId]?.category === 'GREY', r.id);
    if (toMeters(r.measuredLength, r.measurementUnit) !== r.canonicalMeters || state.fabrics[line?.fabricId]?.widthInches !== r.widthInches) fail(r.id, 'رول کی پیمائش یا چوڑائی مختلف ہے۔');
    if (r.result === 'ACCEPTED') {
      const roll = r.rollId && state.rolls[r.rollId], receiptLine = r.receiptLineId && state.goodsReceiptLines[r.receiptLineId];
      ref(roll && receiptLine && roll.lotId === receiptLine.lotId && receiptLine.goodsReceiptId === r.goodsReceiptId && receiptLine.purchaseOrderLineId === r.purchaseOrderLineId && roll.actualLengthMeters === r.canonicalMeters && roll.label === r.label && r.resolution === 'ACCEPTED', r.id);
    } else if (r.rollId || r.receiptLineId || r.resolution === 'ACCEPTED') fail(r.id, 'مسترد یا قرنطینہ رول دستیاب اسٹاک میں نہیں جا سکتا۔');
  });
  const postedBillLines = Object.values(p.billLines).filter((l) => p.bills[l.billId]?.status === 'POSTED');
  Object.values(p.bills).forEach((r) => {
    ref(state.suppliers[r.supplierId], r.id);
    if (!r.lineIds.length || !r.receiptIds.length || r.dueOn < r.date) fail(r.id, 'بل کی معلومات یا تاریخ درست نہیں۔');
    r.receiptIds.forEach((id) => { const grn = state.goodsReceipts[id]; ref(grn?.status === 'POSTED' && state.purchaseOrders[grn.purchaseOrderId]?.supplierId === r.supplierId, r.id); if (grn && r.date < grn.receivedOn) fail(r.id, 'بل وصولی سے پہلے ہے۔'); });
    const subtotal = purchaseSum(r.lineIds, (id) => p.billLines[id]?.amountPaisa ?? 0);
    if (r.discountPaisa > subtotal || subtotal - r.discountPaisa + r.chargesPaisa !== r.totalPaisa) fail(r.id, 'بل کا حساب درست نہیں۔');
    r.lineIds.forEach((id) => ref(p.billLines[id]?.billId === r.id, id));
  });
  Object.values(p.billLines).forEach((r) => {
    const bill = p.bills[r.billId], grnLine = state.goodsReceiptLines[r.goodsReceiptLineId]; ref(bill?.lineIds.includes(r.id) && grnLine && bill.receiptIds.includes(grnLine.goodsReceiptId), r.id);
    if (!grnLine) return;
    const unbilledReturns = purchaseSum(Object.values(p.returns).filter((a) => a.status === 'POSTED' && a.goodsReceiptLineId === grnLine.id && !a.billId), (a) => a.quantityMeters);
    if (bill?.status === 'POSTED' && (r.quantityMeters > roundQuantity(grnLine.quantityMeters - unbilledReturns) || Object.values(state.history?.supplierInvoices ?? {}).some((i) => i.goodsReceiptId === grnLine.goodsReceiptId) || postedBillLines.filter((l) => l.goodsReceiptLineId === grnLine.id).length > 1)) fail(r.id, 'وصولی دوبارہ یا واپس شدہ مقدار بل میں شامل ہے۔');
    if (r.amountPaisa !== proportionPaisa(receiptLineValue(state, grnLine.id), r.quantityMeters, grnLine.quantityMeters)) fail(r.id, 'بل لائن کی قدر اصل وصولی سے مختلف ہے۔');
  });
  const bills = supplierBills(state);
  Object.values(p.payments).forEach((r) => {
    ref(state.suppliers[r.supplierId], r.id);
    const ids = new Set(r.allocations.map((a) => a.billId));
    if (ids.size !== r.allocations.length || purchaseSum(r.allocations, (a) => a.amountPaisa) > r.amountPaisa) fail(r.id, 'ادائیگی کی تخصیص درست نہیں۔');
    r.allocations.forEach((a) => { const bill = bills.find((b) => b.id === a.billId); ref(bill?.supplierId === r.supplierId && bill.status === 'POSTED', r.id); if (bill && r.date < bill.date) fail(r.id, 'ادائیگی بل سے پہلے ہے۔'); });
  });
  bills.forEach((b) => {
    if (b.allocated > b.totalPaisa) fail(b.id, 'بل سے زیادہ ادائیگی مختص ہے۔');
    const events = [
      ...Object.values(p.payments).filter((r) => r.status === 'POSTED' && r.allocations.some((a) => a.billId === b.id)).map((r) => ({ at: r.updatedAt, value: purchaseSum(r.allocations.filter((a) => a.billId === b.id), (a) => a.amountPaisa), payment: true })),
      ...Object.values(p.returns).filter((r) => r.status === 'POSTED' && r.billId === b.id).map((r) => ({ at: r.updatedAt, value: r.creditPaisa, payment: false })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    let due = b.totalPaisa; events.forEach((e) => { if (e.payment && e.value > Math.max(0, due)) fail(b.id, 'باقی بل سے زیادہ ادائیگی۔'); due -= e.value; });
  });
  Object.values(p.returns).forEach((r) => {
    if (r.status === 'POSTED' && Object.values(state.movements).some((m) => m.sourceType === 'PURCHASE_RETURN' && m.sourceDocumentId === r.id && m.rollId !== r.rollId)) fail(r.id, 'واپسی کی حرکت کا رول حوالہ اصل دستاویز سے مختلف ہے۔');
    const line = state.goodsReceiptLines[r.goodsReceiptLineId], grn = line && state.goodsReceipts[line.goodsReceiptId];
    ref(line?.lotId === r.lotId && grn?.status === 'POSTED' && state.purchaseOrders[grn.purchaseOrderId].supplierId === r.supplierId && state.locations[r.locationId]?.category==='GREY', r.id);
    if (grn && r.date < grn.receivedOn) fail(r.id, 'واپسی وصولی سے پہلے ہے۔');
    if (r.rollId) { const roll = state.rolls[r.rollId]; ref(roll?.lotId === r.lotId, r.id); if (Object.values(state.movements).some((m) => m.lotId === r.lotId && m.sourceType === 'PROCESSING_ISSUE' && m.quantityMeters < 0 && !m.rollId) || Object.values(p.returns).some((a) => a.id !== r.id && a.lotId === r.lotId && a.status === 'POSTED' && !a.rollId)) fail(r.id, 'بغیر رول حوالہ تاریخی اجرا / واپسی کے بعد مخصوص رول کی واپسی ناممکن ہے۔'); if (roll && purchaseSum(Object.values(p.returns).filter((a) => a.status === 'POSTED' && a.rollId === r.rollId), (a) => a.quantityMeters) > roll.actualLengthMeters) fail(r.id, 'رول سے زیادہ واپسی۔'); }
    if (line && purchaseSum(Object.values(p.returns).filter((a) => a.status === 'POSTED' && a.goodsReceiptLineId === line.id), (a) => a.quantityMeters) > line.quantityMeters) fail(r.id, 'وصولی سے زیادہ واپسی۔');
    if (r.billId) { const bill = bills.find((b) => b.id === r.billId); ref(bill?.supplierId === r.supplierId && bill.status === 'POSTED' && bill.receiptIds.includes(grn?.id ?? ''), r.id); if (bill && r.date < bill.date) fail(r.id, 'کریڈٹ بل سے پہلے ہے۔'); }
    else if (r.creditPaisa !== 0) fail(r.id, 'بغیر بل کے واجبات کا کریڈٹ نہیں۔');
    if (r.billId && r.status === 'POSTED' && r.creditPaisa !== returnCredit(state, r.goodsReceiptLineId, r.billId, r.quantityMeters, r.id)) fail(r.id, 'واپسی کا کریڈٹ اصل بل سے مختلف ہے۔');
  });
  Object.values(p.audits).forEach((r) => { ref(state.employees[r.actorId], r.id); ref(allIds.has(r.documentId), r.id); });
  for (const rows of Object.values(p)) if (typeof rows === 'object') {
    const entries = Object.values(rows) as Record<string, unknown>[];
    for (const field of new Set(entries.flatMap((r) => Object.keys(r).filter((k) => k.endsWith('Paisa'))))) if (!Number.isSafeInteger(purchaseSum(entries, (r) => Number(r[field] ?? 0)))) fail('procurement', 'مالی مجموعہ محفوظ حد سے زیادہ ہے۔');
  }
  // A posted return has its exact compensating stock effect checked by the core movement validator.
  Object.values(p.orderLines).forEach((r) => { if (orderLineTotal(state, r.purchaseOrderLineId) < 0) fail(r.id, 'منفی آرڈر قیمت۔'); });
  return problems;
}
