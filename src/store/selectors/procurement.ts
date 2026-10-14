import type { DomainState } from '@/domain/entities';
import { multiplyMoney, assertMoney } from '@/domain/value-objects/money';
import { roundQuantity } from '@/domain/value-objects/quantity';
export const purchaseSum = <T>(rows: readonly T[], f: (r: T) => number) => rows.reduce((n, r) => n + f(r), 0);
const values = Object.values;
/** Round proportional integer paisa once using canonical meter weights. */
export function proportionPaisa(total: number, partMeters: number, totalMeters: number) {
  assertMoney(total); if (totalMeters <= 0 || partMeters < 0 || partMeters > totalMeters) throw new Error('مقدار کا تناسب درست نہیں۔');
  const part = BigInt(Math.round(partMeters * 10000)), whole = BigInt(Math.round(totalMeters * 10000));
  const amount = Number((BigInt(total) * part + whole / 2n) / whole); assertMoney(amount); return amount;
}
export function orderLineTotal(data: DomainState, lineId: string) {
  const line = data.purchaseOrderLines[lineId], terms = values(data.procurement?.orderLines ?? {}).find((r) => r.purchaseOrderLineId === lineId);
  return multiplyMoney(line.unitPricePaisaPerMeter, line.quantityMeters) - (terms?.discountPaisa ?? 0);
}
export function receivedMeters(data: DomainState, lineId: string) {
  return roundQuantity(purchaseSum(values(data.goodsReceiptLines).filter((l) => l.purchaseOrderLineId === lineId && data.goodsReceipts[l.goodsReceiptId].status === 'POSTED'), (l) => l.quantityMeters));
}
/** Cumulative proportional discount allocation preserves the final PO-line paisa exactly. */
export function receiptLineValue(data: DomainState, id: string) {
  const line = data.goodsReceiptLines[id]; const poLine = data.purchaseOrderLines[line.purchaseOrderLineId]; const full = orderLineTotal(data, poLine.id);
  const candidates = values(data.goodsReceiptLines).filter((l) => l.purchaseOrderLineId === poLine.id && (data.goodsReceipts[l.goodsReceiptId].status === 'POSTED' || l.id === id)).sort((a, b) => data.goodsReceipts[a.goodsReceiptId].receivedOn.localeCompare(data.goodsReceipts[b.goodsReceiptId].receivedOn) || a.id.localeCompare(b.id));
  let previous = 0;
  for (const row of candidates) { const cumulative = roundQuantity(previous + row.quantityMeters); if (row.id === id) return proportionPaisa(full, cumulative, poLine.quantityMeters) - proportionPaisa(full, previous, poLine.quantityMeters); previous = cumulative; }
  return 0;
}
export function supplierProfile(data: DomainState, supplierId: string) {
  const current = values(data.procurement?.supplierProfiles ?? {}).find((r) => r.supplierId === supplierId);
  const historical = values(data.history?.supplierProfiles ?? {}).find((r) => r.supplierId === supplierId);
  return { code: current?.code ?? historical?.code ?? supplierId, contact: current?.contact ?? historical?.contact ?? 'درج نہیں', address: current?.address ?? historical?.address ?? data.suppliers[supplierId]?.city ?? '', category: current?.category ?? historical?.categories.join('، ') ?? 'کپڑا', termDays: current?.termDays ?? historical?.termDays ?? 0, email: current?.email ?? historical?.email ?? '', alternatePhone: current?.alternatePhone ?? '', notes: current?.notes ?? '', creditLimitPaisa: current?.creditLimitPaisa ?? historical?.creditLimitPaisa ?? 0 };
}
export function fabricProfile(data: DomainState, fabricId: string) {
  const current = values(data.procurement?.fabricProfiles ?? {}).find((r) => r.fabricId === fabricId), historical = values(data.history?.fabricProfiles ?? {}).find((r) => r.fabricId === fabricId);
  return { code: current?.code ?? historical?.code ?? fabricId, category: current?.category ?? historical?.category ?? data.fabrics[fabricId]?.composition ?? '', width: current?.width ?? data.fabrics[fabricId]?.widthInches ?? 60, widthUnit: current?.widthUnit ?? 'INCH' as const, gsm: current?.gsm ?? historical?.gsm ?? 100, defaultUnit: current?.defaultUnit ?? 'METER' as const, supplierId: current?.supplierId ?? historical?.supplierId ?? Object.keys(data.suppliers)[0] ?? '', ratePaisa: current?.ratePaisa ?? historical?.ratePaisa ?? 0, grade: current?.grade ?? historical?.grade ?? 'A', reorderMeters: current?.reorderMeters ?? historical?.reorderMeters ?? 100, description: current?.description ?? '' };
}
export function supplierBills(data: DomainState) {
  return [
    ...values(data.history?.supplierInvoices ?? {}).map((r) => ({ id: r.id, number: r.number, supplierId: r.supplierId, date: r.date, dueOn: r.dueOn, totalPaisa: r.totalPaisa, status: 'POSTED', receiptIds: [r.goodsReceiptId], historical: true })),
    ...values(data.procurement?.bills ?? {}).map((r) => ({ ...r, historical: false })),
  ].map((b) => {
    const allocated = purchaseSum(values(data.procurement?.payments ?? {}).filter((p) => p.status === 'POSTED'), (p) => purchaseSum(p.allocations.filter((a) => a.billId === b.id), (a) => a.amountPaisa));
    const credits = purchaseSum(values(data.procurement?.returns ?? {}).filter((r) => r.status === 'POSTED' && r.billId === b.id), (r) => r.creditPaisa);
    return { ...b, allocated, credits, balance: b.status==='POSTED'?b.totalPaisa-allocated-credits:0, outstanding: b.status==='POSTED'?Math.max(0,b.totalPaisa-allocated-credits):0, credit: b.status==='POSTED'?Math.max(0,allocated+credits-b.totalPaisa):0, paymentStatus: b.status!=='POSTED'?'PENDING':allocated+credits>=b.totalPaisa?'PAID':allocated+credits>0?'PARTIALLY_PAID':'UNPAID' };
  });
}
export function supplierLedger(data: DomainState, supplierId: string) {
  const supplier = data.suppliers[supplierId], bills = supplierBills(data).filter((b) => b.supplierId === supplierId && b.status === 'POSTED');
  const payments = values(data.procurement?.payments ?? {}).filter((p) => p.supplierId === supplierId && p.status === 'POSTED');
  const returns = values(data.procurement?.returns ?? {}).filter((r) => r.supplierId === supplierId && r.status === 'POSTED' && r.creditPaisa > 0);
  const rows = [
    ...(supplier?.openingBalancePaisa ? [{ id: supplier.id, date: supplier.createdAt.slice(0, 10), number: supplierProfile(data, supplierId).code, description: 'ابتدائی واجبات', debit: 0, credit: supplier.openingBalancePaisa, type: 'OPENING', status: 'POSTED' }] : []),
    ...bills.map((b) => ({ id: b.id, date: b.date, number: b.number, description: 'سپلائر کا پوسٹ شدہ بل', debit: 0, credit: b.totalPaisa, type: 'BILL', status: b.status })),
    ...payments.map((p) => ({ id: p.id, date: p.date, number: p.number, description: 'مختص سپلائر ادائیگی', debit: purchaseSum(p.allocations, (a) => a.amountPaisa), credit: 0, type: 'PAYMENT', status: p.status })),
    ...returns.map((r) => ({ id: r.id, date: r.date, number: r.number, description: 'منظور شدہ واپسی کا کریڈٹ', debit: r.creditPaisa, credit: 0, type: 'RETURN', status: r.status })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let running = 0;
  const entries = rows.map((r) => { running += r.credit - r.debit; assertMoney(running, true); return { ...r, balance: running }; });
  const paid = purchaseSum(payments, (p) => p.amountPaisa), allocated = purchaseSum(payments, (p) => purchaseSum(p.allocations, (a) => a.amountPaisa));
  return { entries, balance: running, outstanding: Math.max(0, running), supplierCredit: Math.max(0, -running), paid, allocated, advance: paid - allocated, billed: purchaseSum(bills, (b) => b.totalPaisa), credited: purchaseSum(returns, (r) => r.creditPaisa) };
}
export function purchaseSummary(data: DomainState, asOf: string) {
  const orders = values(data.purchaseOrders), postedReceipts = values(data.goodsReceipts).filter((r) => r.status === 'POSTED'), bills = supplierBills(data).filter((b) => b.status === 'POSTED');
  const ordered = purchaseSum(orders.filter((o) => o.status !== 'CANCELLED'), (o) => purchaseSum(o.lineIds, (id) => orderLineTotal(data, id)));
  const received = purchaseSum(postedReceipts, (r) => purchaseSum(r.lineIds, (id) => receiptLineValue(data, id)));
  return { ordered, received, pending: orders.filter((o) => ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status) && !values(data.procurement?.orderProfiles ?? {}).find((p) => p.purchaseOrderId === o.id)?.closedAt).length, partial: orders.filter((o) => o.status === 'PARTIALLY_RECEIVED').length, payable: purchaseSum(values(data.suppliers), (s) => supplierLedger(data, s.id).outstanding), paid: purchaseSum(values(data.procurement?.payments ?? {}).filter((p) => p.status === 'POSTED'), (p) => p.amountPaisa), overdue: bills.filter((b) => b.outstanding > 0 && b.dueOn < asOf).length };
}

export function returnCredit(data: DomainState, receiptLineId: string, billId: string, quantity: number, excludeId: string) {
  const bill = supplierBills(data).find((b) => b.id === billId && b.status === 'POSTED');
  if (!bill) throw new Error('بل نہیں ملا۔');
  const actual = data.procurement?.bills[billId];
  const lines = actual ? actual.lineIds.map((id) => { const row = data.procurement!.billLines[id]; return { id: row.goodsReceiptLineId, quantity: row.quantityMeters, value: row.amountPaisa }; })
    : bill.receiptIds.flatMap((id) => data.goodsReceipts[id].lineIds.map((id) => ({ id, quantity: data.goodsReceiptLines[id].quantityMeters, value: receiptLineValue(data, id) })));
  const line = lines.find((l) => l.id === receiptLineId); if (!line) throw new Error('بل کی اصل وصولی لائن نہیں ملی۔');
  const subtotal = purchaseSum(lines, (l) => l.value), goods = subtotal - (actual?.discountPaisa ?? 0);
  const share = (weight: number) => subtotal ? Number((BigInt(goods) * BigInt(weight) + BigInt(subtotal) / 2n) / BigInt(subtotal)) : 0;
  const index = lines.indexOf(line), previousWeight = purchaseSum(lines.slice(0, index), (l) => l.value);
  const lineNet = share(previousWeight + line.value) - share(previousWeight);
  const current = data.procurement?.returns[excludeId];
  const prior = roundQuantity(purchaseSum(Object.values(data.procurement?.returns ?? {}).filter((r) => r.id !== excludeId && r.status === 'POSTED' && r.billId === billId && r.goodsReceiptLineId === receiptLineId && (!current || current.status !== 'POSTED' || r.updatedAt < current.updatedAt || r.updatedAt === current.updatedAt && r.id < current.id)), (r) => r.quantityMeters));
  return proportionPaisa(lineNet, roundQuantity(prior + quantity), line.quantity) - proportionPaisa(lineNet, prior, line.quantity);
}

export function procurementReportingDate(data: DomainState) {
 return Object.values(data.procurement?.audits ?? {}).reduce((max,r)=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi'}).format(new Date(r.createdAt));return day>max?day:max;},data.history?.asOf ?? '1970-01-01');
}
