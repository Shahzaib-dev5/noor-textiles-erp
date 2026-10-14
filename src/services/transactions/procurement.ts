import { z } from 'zod';
import type { DomainState } from '@/domain/entities';
import { emptyProcurement, supplierFields, fabricFields, procurementId as id, procurementDate as day, procurementMoney as money, procurementQuantity as qty, purchaseUnit } from '@/domain/entities/procurement';
import { validateDomainState } from '@/domain/validators/state';
import { postGoodsReceipt } from '@/services/transactions';
import type { TransactionContext, TransactionResult } from '@/services/transactions';
import { roundQuantity, toMeters } from '@/domain/value-objects/quantity';
import { receivedMeters, supplierBills, supplierProfile, fabricProfile, receiptLineValue, purchaseSum, proportionPaisa, returnCredit } from '@/store/selectors/procurement';
import { getAvailableMeters } from '@/services/inventory';
import { availableRollMeters,hasKnownRollCustody } from '@/services/inventory/warehouse';
import { nextDocumentNumber } from '@/services/document-numbering';
const text = z.string().min(1).max(500).refine((v)=>Boolean(v.trim())), notes = z.string().max(1000), optionalId = id.optional();
export const orderInputLine = z.object({ fabricId: id, quantity: qty.refine((v) => v > 0), unit: purchaseUnit, measuredLengths: z.array(qty.refine((v) => v > 0)), ratePaisaPerMeter: money, discountPaisa: money, specification: notes }).strict();
export const measuredRollInput = z.object({ purchaseOrderLineId: id, label: text, measuredLength: qty.refine((v) => v > 0), measurementUnit: z.enum(['METER', 'YARD']), packagingUnit: z.enum(['ROLL', 'THAAN']), widthInches: z.number().positive(), grade: text, result: z.enum(['ACCEPTED', 'REJECTED', 'QUARANTINED']), remarks: notes }).strict();
export const procurementCommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saveSupplier'), id: optionalId, ...supplierFields }).strict(),
  z.object({ kind: z.literal('saveFabric'), id: optionalId, ...fabricFields }).strict(),
  z.object({ kind: z.literal('deactivateSupplier'), id }).strict(),
  z.object({ kind: z.literal('deactivateFabric'), id }).strict(),
  z.object({ kind: z.literal('saveRequest'), id: optionalId, date: day, requestedById: id, department: text, fabricId: id, quantity: qty.refine((v) => v > 0), unit: purchaseUnit, measuredLengths: z.array(qty.refine((v) => v > 0)), requiredOn: day, reason: text, priority: z.enum(['NORMAL', 'URGENT']) }).strict(),
  z.object({ kind: z.literal('requestAction'), id, action: z.enum(['SUBMIT', 'APPROVE', 'REJECT', 'CANCEL']) }).strict(),
  z.object({ kind: z.literal('savePO'), id: optionalId, supplierId: id, date: day, expectedOn: day, warehouseLocationId: id, termDays: z.number().int().min(0).max(365), notes, requestId: optionalId, lines: z.array(orderInputLine).min(1).max(100) }).strict(),
  z.object({ kind: z.literal('poAction'), id, action: z.enum(['APPROVE', 'CANCEL', 'CONFIRM', 'CLOSE']) }).strict(),
  z.object({ kind: z.literal('saveGRN'), id: optionalId, purchaseOrderId: id, date: day, warehouseLocationId: id, receivedById: id, transport: notes, supplierChallan: text, notes, rolls: z.array(measuredRollInput).min(1).max(500) }).strict(),
  z.object({ kind: z.literal('postGRN'), id }).strict(),
  z.object({ kind: z.literal('cancelGRN'), id }).strict(),
  z.object({ kind: z.literal('resolveRejectedRoll'), id }).strict(),
  z.object({ kind: z.literal('createBill'), supplierId: id, receiptIds: z.array(id).min(1), reference: text, date: day, dueOn: day, discountPaisa: money, chargesPaisa: money }).strict(),
  z.object({ kind: z.literal('postBill'), id }).strict(),
  z.object({ kind: z.literal('cancelBill'), id }).strict(),
  z.object({ kind: z.literal('createPayment'), supplierId: id, date: day, amountPaisa: money.refine((v) => v > 0), method: z.enum(['CASH', 'BANK', 'CHEQUE']), reference: text, notes, allocations: z.array(z.object({ billId: id, amountPaisa: money.refine((v) => v > 0) }).strict()) }).strict(),
  z.object({ kind: z.literal('postPayment'), id }).strict(),
  z.object({ kind: z.literal('cancelPayment'), id }).strict(),
  z.object({ kind: z.literal('createReturn'), goodsReceiptLineId: id, rollId: optionalId, locationId:optionalId, quantityMeters: qty.refine((v) => v > 0), date: day, reason: text, condition: text, billId: optionalId }).strict(),
  z.object({ kind: z.literal('returnAction'), id, action: z.enum(['APPROVE', 'POST', 'CANCEL']) }).strict(),
]);
export type ProcurementCommand = z.infer<typeof procurementCommandSchema>;
export type ProcurementContext = TransactionContext & { role: 'owner' | 'purchase' | 'warehouse' | 'production' | 'sales' | 'accounts' };
export function canProcure(role: ProcurementContext['role'], kind: ProcurementCommand['kind'], action?: string) {
  if (role === 'owner') return true;
  if (['createBill', 'postBill', 'cancelBill', 'createPayment', 'postPayment', 'cancelPayment'].includes(kind)) return role === 'accounts';
  if (['saveGRN', 'postGRN', 'cancelGRN', 'resolveRejectedRoll', 'createReturn', 'returnAction'].includes(kind)) return role === 'warehouse' || role === 'purchase';
  if (kind === 'requestAction' && action === 'SUBMIT') return true;
  if (kind === 'saveRequest') return true;
  return role === 'purchase';
}
function rejection(message: string): TransactionResult { return { ok: false, error: { code: 'PROCUREMENT_REJECTED', message } }; }
class RuleFailure extends Error {}
function requireRule(value: unknown, message: string): asserts value { if (!value) throw new RuleFailure(message); }
function applyProcurement(input: DomainState, raw: ProcurementCommand, context: ProcurementContext): TransactionResult {
  const prepared = validateDomainState(input); if (!prepared.ok) return prepared;
  const parsed = procurementCommandSchema.safeParse(raw); if (!parsed.success) return rejection('فارم کی معلومات، اکائیاں، رقم یا پیمائش درست نہیں۔ لازمی خانوں کی جانچ کریں۔');
  const command = parsed.data; const state = prepared.state;
  requireRule(z.string().datetime().safeParse(context.at).success && state.employees[context.actorId]?.status === 'ACTIVE', 'فعال ملازم اور درست وقت ضروری ہیں۔');
  requireRule(canProcure(context.role, command.kind, 'action' in command ? command.action : undefined), 'منتخب نمائشی کردار اس کارروائی کی اجازت نہیں دیتا۔');
  const companyId = Object.keys(state.companies)[0];
  state.procurement ??= emptyProcurement(companyId); const p = state.procurement;
  const meta = <S extends string>(id: string, status: S) => ({ id, status, companyId, origin: 'USER' as const, createdAt: context.at, updatedAt: context.at, createdBy: context.actorId, updatedBy: context.actorId });
  const baseMeta = <S extends 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'APPROVED' | 'POSTED'>(id: string, status: S) => { const { companyId: _, ...record } = meta(id, status); void _; return record; };
  const touch = <T extends { updatedAt: string; updatedBy: string }>(r: T) => { r.updatedAt = context.at; r.updatedBy = context.actorId; };
  const allNumbers = () => [...Object.values(state.purchaseOrders), ...Object.values(state.goodsReceipts), ...Object.values(state.challans), ...Object.values(state.processingReceipts), ...Object.values(p.requests), ...Object.values(p.bills), ...Object.values(p.payments), ...Object.values(p.returns), ...Object.values(state.history?.supplierInvoices ?? {})].map((r) => r.number);
  const number = (prefix: Parameters<typeof nextDocumentNumber>[0], date: string) => nextDocumentNumber(prefix, Number(date.slice(0, 4)), allNumbers());
  const audit = (documentId: string, action: string, previousStatus: string, newStatus: string, summary: string) => {
    let counter = Object.keys(p.audits).length + 1; while (p.audits['proc-audit:' + counter]) counter++;
    const id = 'proc-audit:' + counter;
    p.audits[id] = { ...meta(id, 'ACTIVE'), actorId: context.actorId, role: context.role, action, documentType: command.kind, documentId, previousStatus, newStatus, summary };
    const log = 'activity:' + id;
    state.activityLogs[log] = { ...baseMeta(log, 'ACTIVE'), actorId: context.actorId, action, documentId, detail: summary };
  };
  const activeSupplier = (id: string) => requireRule(state.suppliers[id]?.status === 'ACTIVE', 'فعال سپلائر منتخب کریں۔');
  const activeFabric = (id: string) => requireRule(state.fabrics[id]?.status === 'ACTIVE', 'فعال کپڑے کی قسم منتخب کریں۔');
  const ensureDate = (date: string) => requireRule(date <= new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi'}).format(new Date(context.at)), 'تاریخ موجودہ دن کے بعد نہیں ہو سکتی۔');
  const profileId = (kind: string, id: string) => 'proc-' + kind + ':' + id;
  let actedId = '', oldStatus = '', newStatus = '', summary = 'خریداری کا ریکارڈ محفوظ کیا گیا۔';
  switch (command.kind) {
    case 'saveSupplier': {
      const existing = command.id ? state.suppliers[command.id] : undefined;
      requireRule(!command.id || existing, 'سپلائر نہیں ملا۔');
      requireRule(!Object.values(state.suppliers).some((s) => s.id !== command.id && supplierProfile(state, s.id).code.toUpperCase() === command.code.trim().toUpperCase()), 'سپلائر کوڈ پہلے سے موجود ہے۔');
      if (existing) requireRule(existing.openingBalancePaisa === command.openingBalancePaisa || !supplierBills(state).some((b) => b.supplierId === existing.id) && !Object.values(state.purchaseOrders).some((o) => o.supplierId === existing.id), 'لین دین والے سپلائر کا ابتدائی بقایا تبدیل نہیں ہو سکتا۔');
      const id = command.id ?? 'supplier:user:' + command.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '-');
      requireRule(command.id || !state.suppliers[id], 'سپلائر شناخت پہلے سے موجود ہے۔');
      state.suppliers[id] = { ...(existing ?? baseMeta(id, command.status)), name: command.name, city: command.city, phone: command.phone, openingBalancePaisa: command.openingBalancePaisa, status: command.status }; touch(state.suppliers[id]);
      const pi = profileId('supplier', id);
      p.supplierProfiles[pi] = { ...(p.supplierProfiles[pi] ?? meta(pi, 'ACTIVE')), supplierId: id, code: command.code.trim(), contact: command.contact, address: command.address, category: command.category, termDays: command.termDays, email: command.email, alternatePhone: command.alternatePhone, notes: command.notes, creditLimitPaisa: command.creditLimitPaisa }; touch(p.supplierProfiles[pi]);
      actedId = id; oldStatus = existing?.status ?? ''; newStatus = command.status; break;
    }
    case 'saveFabric': {
      activeSupplier(command.supplierId); const existing = command.id ? state.fabrics[command.id] : undefined;
      requireRule(!command.id || existing, 'کپڑے کی قسم نہیں ملی۔');
      requireRule(!Object.values(state.fabrics).some((f) => f.id !== command.id && fabricProfile(state, f.id).code.toUpperCase() === command.code.trim().toUpperCase()), 'کپڑے کا کوڈ پہلے سے موجود ہے۔');
      const widthInches = command.widthUnit === 'CM' ? roundQuantity(command.width / 2.54) : command.width;
      requireRule(widthInches <= 200, 'چوڑائی ۲۰۰ انچ سے زیادہ نہیں ہو سکتی۔');
      if (existing && (Object.values(state.purchaseOrderLines).some((l) => l.fabricId === existing.id) || Object.values(state.history?.bomLines ?? {}).some((l) => l.fabricId === existing.id))) requireRule(existing.widthInches === widthInches && existing.composition === command.composition && existing.name === command.name, 'استعمال شدہ کپڑے کا نام، ترکیب یا چوڑائی تبدیل نہیں ہو سکتی۔ نئی قسم بنائیں۔');
      const id = command.id ?? 'fabric:user:' + command.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '-');
      requireRule(command.id || !state.fabrics[id], 'کپڑے کی شناخت پہلے سے موجود ہے۔');
      state.fabrics[id] = { ...(existing ?? baseMeta(id, command.status)), name: command.name, composition: command.composition, widthInches, inventoryUnit: 'METER', status: command.status }; touch(state.fabrics[id]);
      const pi = profileId('fabric', id);
      p.fabricProfiles[pi] = { ...(p.fabricProfiles[pi] ?? meta(pi, 'ACTIVE')), fabricId: id, code: command.code.trim(), category: command.category, width: command.width, widthUnit: command.widthUnit, gsm: command.gsm, defaultUnit: command.defaultUnit, supplierId: command.supplierId, ratePaisa: command.ratePaisa, grade: command.grade, reorderMeters: command.reorderMeters, description: command.description }; touch(p.fabricProfiles[pi]);
      actedId = id; oldStatus = existing?.status ?? ''; newStatus = command.status; break;
    }
    case 'deactivateSupplier':
    case 'deactivateFabric': {
      const record = command.kind === 'deactivateSupplier' ? state.suppliers[command.id] : state.fabrics[command.id]; requireRule(record?.status === 'ACTIVE', 'فعال ریکارڈ نہیں ملا۔');
      oldStatus = record.status; record.status = 'INACTIVE'; touch(record); actedId = record.id; newStatus = record.status; summary = 'ریکارڈ غیر فعال ہوا؛ سابقہ حوالے برقرار ہیں۔'; break;
    }
    case 'saveRequest': {
      activeFabric(command.fabricId); requireRule(state.employees[command.requestedById]?.status === 'ACTIVE', 'درخواست کنندہ فعال ہونا چاہیے۔'); ensureDate(command.date);
      requireRule(command.requiredOn >= command.date, 'ضرورت کی تاریخ درخواست سے پہلے نہیں ہو سکتی۔');
      const existing = command.id ? p.requests[command.id] : undefined; requireRule(!command.id || existing?.status === 'DRAFT', 'صرف مسودہ درخواست میں ترمیم ہو سکتی ہے۔');
      const num = existing?.number ?? number('PRQ', command.date), id = command.id ?? 'request:user:' + num;
      const { kind: _, id: __, ...fields } = command; void _; void __;
      p.requests[id] = { ...(existing ?? meta(id, 'DRAFT')), ...fields, number: num, quantityMeters: toMeters(command.quantity, command.unit, command.measuredLengths) }; touch(p.requests[id]);
      actedId = id; oldStatus = existing?.status ?? ''; newStatus = 'DRAFT'; break;
    }
    case 'requestAction': {
      const r = p.requests[command.id]; requireRule(r, 'درخواست نہیں ملی۔');
      const allowed = { SUBMIT: ['DRAFT'], APPROVE: ['SUBMITTED'], REJECT: ['SUBMITTED'], CANCEL: ['DRAFT', 'SUBMITTED', 'APPROVED'] };
      requireRule(allowed[command.action].includes(r.status), 'درخواست کی موجودہ حالت اس کارروائی کی اجازت نہیں دیتی۔');
      oldStatus = r.status; r.status = ({ SUBMIT: 'SUBMITTED', APPROVE: 'APPROVED', REJECT: 'REJECTED', CANCEL: 'CANCELLED' } as const)[command.action]; touch(r); actedId = r.id; newStatus = r.status; break;
    }
    case 'savePO': {
      activeSupplier(command.supplierId); ensureDate(command.date); requireRule(command.expectedOn >= command.date && state.locations[command.warehouseLocationId]?.category === 'GREY', 'متوقع تاریخ یا کورا گودام درست نہیں۔');
      const existing = command.id ? state.purchaseOrders[command.id] : undefined;
      requireRule(!command.id || existing?.status === 'DRAFT' && existing.origin === 'USER' && Object.values(p.orderProfiles).some((o) => o.purchaseOrderId === command.id), 'صرف نیا عملی مسودہ آرڈر قابلِ ترمیم ہے۔');
      const num = existing?.number ?? number('PO', command.date), id = command.id ?? 'po:user:' + num;
      if (command.requestId && !existing) { const r = p.requests[command.requestId]; requireRule(r?.status === 'APPROVED', 'صرف منظور شدہ غیر تبدیل شدہ درخواست آرڈر بن سکتی ہے۔'); requireRule(command.lines.some((l) => l.fabricId === r.fabricId && toMeters(l.quantity, l.unit, l.measuredLengths) >= r.quantityMeters), 'درخواست کی مکمل مقدار آرڈر میں شامل کریں۔'); r.status = 'CONVERTED'; r.poId = id; touch(r); }
      if (existing) for (const lineId of existing.lineIds) { delete state.purchaseOrderLines[lineId]; const terms = Object.values(p.orderLines).find((l) => l.purchaseOrderLineId === lineId); if (terms) delete p.orderLines[terms.id]; }
      const lineIds: string[] = [];
      command.lines.forEach((line, i) => {
        activeFabric(line.fabricId); const lineId = id + ':line-' + (i + 1), meters = toMeters(line.quantity, line.unit, line.measuredLengths), pi = profileId('po-line', lineId);
        state.purchaseOrderLines[lineId] = { ...baseMeta(lineId, 'ACTIVE'), purchaseOrderId: id, fabricId: line.fabricId, quantityMeters: meters, originalQuantity: meters, originalUnit: 'METER', conversionMetersPerUnit: 1, unitPricePaisaPerMeter: line.ratePaisaPerMeter };
        p.orderLines[pi] = { ...meta(pi, 'ACTIVE'), purchaseOrderLineId: lineId, unit: line.unit, originalQuantity: line.quantity, measuredLengths: line.measuredLengths, specification: line.specification, discountPaisa: line.discountPaisa };
        lineIds.push(lineId);
      });
      state.purchaseOrders[id] = { ...(existing ?? baseMeta(id, 'DRAFT')), number: num, supplierId: command.supplierId, lineIds, orderDate: command.date }; touch(state.purchaseOrders[id]);
      const pi = profileId('order', id), previous = p.orderProfiles[pi]; p.orderProfiles[pi] = { ...(previous ?? meta(pi, 'ACTIVE')), purchaseOrderId: id, expectedOn: command.expectedOn, warehouseLocationId: command.warehouseLocationId, termDays: command.termDays, notes: command.notes, ...(command.requestId || previous?.requestId ? { requestId: command.requestId ?? previous?.requestId } : {}) }; touch(p.orderProfiles[pi]);
      actedId = id; oldStatus = existing?.status ?? ''; newStatus = 'DRAFT'; break;
    }
    case 'poAction': {
      const po = state.purchaseOrders[command.id], terms = Object.values(p.orderProfiles).find((o) => o.purchaseOrderId === command.id);
      requireRule(po?.origin === 'USER' && terms && !terms.closedAt, 'تاریخی یا بند آرڈر میں عملی تبدیلی دستیاب نہیں۔');
      oldStatus = po.status;
      if (command.action === 'APPROVE') { requireRule(po.status === 'DRAFT', 'صرف مسودہ منظور ہوتا ہے۔'); activeSupplier(po.supplierId); po.lineIds.forEach((id) => activeFabric(state.purchaseOrderLines[id].fabricId)); po.status = 'APPROVED'; }
      if (command.action === 'CANCEL') { requireRule(['DRAFT', 'APPROVED'].includes(po.status), 'وصول شدہ آرڈر منسوخ نہیں ہو سکتا۔'); po.status = 'CANCELLED'; }
      if (command.action === 'CLOSE') { requireRule(['PARTIALLY_RECEIVED', 'COMPLETED'].includes(po.status), 'صرف وصولی والا آرڈر بند ہو سکتا ہے۔'); terms.closedAt = context.at; touch(terms); }
      if (command.action === 'CONFIRM') { requireRule(po.status === 'APPROVED', 'صرف منظور شدہ آرڈر کی سپلائر تصدیق درج ہوتی ہے۔'); summary = 'سپلائر کی تصدیق درج ہوئی۔'; }
      touch(po); actedId = po.id; newStatus = terms.closedAt ? 'CLOSED' : po.status; break;
    }
    case 'saveGRN': {
      const po = state.purchaseOrders[command.purchaseOrderId]; requireRule(po && ['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status), 'وصولی کے لیے کھلا منظور شدہ آرڈر منتخب کریں۔'); activeSupplier(po.supplierId);
      requireRule(!Object.values(p.orderProfiles).find((o) => o.purchaseOrderId === po.id)?.closedAt, 'بند آرڈر پر وصولی نہیں ہو سکتی۔');
      ensureDate(command.date); requireRule(command.date >= po.orderDate && state.locations[command.warehouseLocationId]?.category === 'GREY' && state.employees[command.receivedById]?.status === 'ACTIVE', 'وصولی کی تاریخ، گودام یا وصول کنندہ درست نہیں۔');
      const old = command.id ? state.goodsReceipts[command.id] : undefined; requireRule(!command.id || old?.status === 'DRAFT' && Object.values(p.receiptProfiles).some((r) => r.goodsReceiptId === old.id), 'صرف عملی مسودہ وصولی قابلِ ترمیم ہے۔');
      const num = old?.number ?? number('GRN', command.date), id = command.id ?? 'grn:user:' + num;
      if (old) {
        for (const lid of old.lineIds) { const lot = state.goodsReceiptLines[lid].lotId; for (const roll of Object.values(state.rolls).filter((r) => r.lotId === lot)) delete state.rolls[roll.id]; delete state.lots[lot]; delete state.goodsReceiptLines[lid]; }
        for (const row of Object.values(p.inspectionRolls).filter((r) => r.goodsReceiptId === id)) delete p.inspectionRolls[row.id];
      }
      requireRule(new Set(command.rolls.map((r) => r.label)).size === command.rolls.length, 'رول نمبر ایک وصولی میں منفرد ہوں۔');
      const lineIds: string[] = [];
      for (const pol of po.lineIds) {
        const rows = command.rolls.filter((r) => r.purchaseOrderLineId === pol && r.result === 'ACCEPTED'), total = roundQuantity(purchaseSum(rows, (r) => toMeters(r.measuredLength, r.measurementUnit)));
        if (!total) continue;
        const poLine = state.purchaseOrderLines[pol]; activeFabric(poLine.fabricId); requireRule(total <= roundQuantity(poLine.quantityMeters - receivedMeters(state, pol)), 'منظور شدہ رولز باقی آرڈر مقدار سے زیادہ ہیں۔');
        const index = po.lineIds.indexOf(pol) + 1, lineId = id + ':line-' + index, lot = 'lot:user:' + num + '-' + index;
        state.lots[lot] = { ...baseMeta(lot, 'ACTIVE'), code: 'LOT-' + num + '-' + index, fabricId: poLine.fabricId, supplierId: po.supplierId, sourceGoodsReceiptLineId: lineId };
        state.goodsReceiptLines[lineId] = { ...baseMeta(lineId, 'ACTIVE'), goodsReceiptId: id, purchaseOrderLineId: pol, lotId: lot, quantityMeters: total, originalQuantity: total, originalUnit: 'METER', conversionMetersPerUnit: 1 }; lineIds.push(lineId);
      }
      state.goodsReceipts[id] = { ...(old ?? baseMeta(id, 'DRAFT')), number: num, purchaseOrderId: po.id, warehouseLocationId: command.warehouseLocationId, lineIds, receivedOn: command.date }; touch(state.goodsReceipts[id]);
      command.rolls.forEach((r, i) => {
        requireRule(po.lineIds.includes(r.purchaseOrderLineId), 'رول اسی آرڈر کی لائن سے ہونا چاہیے۔'); const poLine = state.purchaseOrderLines[r.purchaseOrderLineId], fabric = state.fabrics[poLine.fabricId];
        requireRule(r.widthInches === fabric.widthInches, 'رول کی چوڑائی منتخب کپڑے سے ملنی چاہیے۔');
        const pi = id + ':inspection-' + (i + 1), receiptLine = r.result === 'ACCEPTED' ? lineIds.find((lid) => state.goodsReceiptLines[lid].purchaseOrderLineId === r.purchaseOrderLineId) : undefined, rollId = r.result === 'ACCEPTED' ? id + ':roll-' + (i + 1) : undefined;
        const canonicalMeters = toMeters(r.measuredLength, r.measurementUnit);
        if (rollId && receiptLine) state.rolls[rollId] = { ...baseMeta(rollId, 'ACTIVE'), lotId: state.goodsReceiptLines[receiptLine].lotId, label: r.label, packagingUnit: r.packagingUnit, actualLengthMeters: canonicalMeters, originalUnit: r.measurementUnit, originalLength: r.measuredLength };
        p.inspectionRolls[pi] = { ...meta(pi, 'ACTIVE'), ...r, goodsReceiptId: id, canonicalMeters, locationId: command.warehouseLocationId, resolution: r.result === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING', ...(rollId && receiptLine ? { rollId, receiptLineId: receiptLine } : {}) };
      });
      const pi = profileId('receipt', id); p.receiptProfiles[pi] = { ...(p.receiptProfiles[pi] ?? meta(pi, 'ACTIVE')), goodsReceiptId: id, receivedById: command.receivedById, transport: command.transport, supplierChallan: command.supplierChallan, notes: command.notes }; touch(p.receiptProfiles[pi]);
      actedId = id; oldStatus = old?.status ?? ''; newStatus = 'DRAFT'; break;
    }
    case 'postGRN': {
      const grn = state.goodsReceipts[command.id]; requireRule(grn?.status === 'DRAFT' && Object.values(p.receiptProfiles).some((r) => r.goodsReceiptId === grn.id), 'یہ وصولی مسودہ نہیں یا پہلے پوسٹ ہو چکی ہے۔');
      requireRule(!Object.values(p.orderProfiles).find((r)=>r.purchaseOrderId===grn.purchaseOrderId)?.closedAt, 'بند آرڈر پر پوسٹنگ نہیں ہو سکتی۔');
      if (!grn.lineIds.length) {
        requireRule(['APPROVED','PARTIALLY_RECEIVED'].includes(state.purchaseOrders[grn.purchaseOrderId].status), 'آرڈر وصولی کے لیے کھلا نہیں۔');
        grn.status = 'POSTED'; touch(grn);
        return validateDomainState(executeProcurementAudit(state, context, command, grn.id, 'DRAFT', 'POSTED', 'صرف مسترد / قرنطینہ آمد درج ہوئی؛ قبول شدہ اسٹاک اور واجبات نہیں بڑھے۔'));
      }
      grn.status = 'APPROVED'; touch(grn); const result = postGoodsReceipt(state, grn.id, context); if (!result.ok) return result;
      const next = result.state; next.procurement!.audits = p.audits;
      const outcome = executeProcurementAudit(next, context, command, grn.id, 'DRAFT', 'POSTED', 'منظور شدہ پیمائشی رولز کورا گودام میں پوسٹ ہوئے۔');
      return validateDomainState(outcome);
    }
    case 'cancelGRN': {
      const r = state.goodsReceipts[command.id]; requireRule(r?.status === 'DRAFT' && Object.values(p.receiptProfiles).some((a) => a.goodsReceiptId === r.id), 'صرف عملی مسودہ وصولی منسوخ ہو سکتی ہے۔');
      oldStatus = r.status; r.status = 'CANCELLED'; touch(r); actedId = r.id; newStatus = r.status; break;
    }
    case 'resolveRejectedRoll': {
      const r = p.inspectionRolls[command.id]; requireRule(r && r.result !== 'ACCEPTED' && r.resolution === 'PENDING', 'زیر التوا مسترد یا قرنطینہ رول منتخب کریں۔');
      requireRule(state.goodsReceipts[r.goodsReceiptId].status === 'POSTED', 'پہلے وصولی پوسٹ کریں۔'); r.resolution = 'RETURNED_TO_SUPPLIER'; touch(r); actedId = r.goodsReceiptId; oldStatus = 'PENDING'; newStatus = 'RETURNED_TO_SUPPLIER'; summary = 'ناقابلِ قبول رول سپلائر کو واپس ہوا؛ دستیاب اسٹاک میں شامل نہیں تھا۔'; break;
    }
    case 'createBill': {
      requireRule(state.suppliers[command.supplierId], 'سپلائر نہیں ملا۔'); ensureDate(command.date); requireRule(command.dueOn >= command.date && new Set(command.receiptIds).size === command.receiptIds.length, 'بل کی تاریخ یا وصولی فہرست درست نہیں۔');
      requireRule(!Object.values(p.bills).some((b)=>b.status!=='CANCELLED'&&b.supplierId===command.supplierId&&b.reference.toUpperCase()===command.reference.toUpperCase()), 'سپلائر بل کا حوالہ پہلے سے موجود ہے۔');
      const num = number('BILL', command.date), id = 'bill:user:' + num, lineIds: string[] = [];
      for (const grnId of command.receiptIds) {
        const grn = state.goodsReceipts[grnId]; requireRule(grn?.status === 'POSTED' && state.purchaseOrders[grn.purchaseOrderId].supplierId === command.supplierId && command.date >= grn.receivedOn, 'اسی سپلائر کی پوسٹ شدہ وصولی منتخب کریں۔');
        requireRule(!supplierBills(state).some((b) => b.status !== 'CANCELLED' && b.receiptIds.includes(grnId)), 'یہ وصولی پہلے ہی کسی بل میں شامل ہے۔');
        for (const source of grn.lineIds) {
          const line = state.goodsReceiptLines[source], unbilledReturns = purchaseSum(Object.values(p.returns).filter((r) => r.status === 'POSTED' && r.goodsReceiptLineId === source && !r.billId), (r) => r.quantityMeters), quantityMeters = roundQuantity(line.quantityMeters - unbilledReturns);
          if (!quantityMeters) continue;
          const lid = id + ':line-' + (lineIds.length + 1);
          p.billLines[lid] = { ...meta(lid, 'ACTIVE'), billId: id, goodsReceiptLineId: source, quantityMeters, amountPaisa: proportionPaisa(receiptLineValue(state, source), quantityMeters, line.quantityMeters) }; lineIds.push(lid);
        }
      }
      const subtotal = purchaseSum(lineIds, (id) => p.billLines[id].amountPaisa); requireRule(lineIds.length && command.discountPaisa <= subtotal, 'بل کی مقدار یا رعایت درست نہیں۔');
      p.bills[id] = { ...meta(id, 'DRAFT'), number: num, date: command.date, supplierId: command.supplierId, receiptIds: command.receiptIds, lineIds, reference: command.reference, dueOn: command.dueOn, discountPaisa: command.discountPaisa, chargesPaisa: command.chargesPaisa, taxPaisa: 0, totalPaisa: subtotal - command.discountPaisa + command.chargesPaisa };
      actedId = id; newStatus = 'DRAFT'; break;
    }
    case 'postBill':
    case 'cancelBill': {
      const r = p.bills[command.id]; requireRule(r?.status === 'DRAFT', 'صرف مسودہ بل پوسٹ یا منسوخ ہو سکتا ہے۔'); oldStatus = r.status; r.status = command.kind === 'postBill' ? 'POSTED' : 'CANCELLED'; touch(r); actedId = r.id; newStatus = r.status; break;
    }
    case 'createPayment': {
      requireRule(state.suppliers[command.supplierId], 'سپلائر نہیں ملا۔'); ensureDate(command.date); const num = number('SPAY', command.date), id = 'supplier-payment:user:' + num;
      requireRule(!Object.values(p.payments).some((r)=>r.status!=='CANCELLED'&&r.supplierId===command.supplierId&&r.method===command.method&&r.reference.toUpperCase()===command.reference.toUpperCase()), 'ادائیگی کا حوالہ پہلے سے موجود ہے۔');
      for (const a of command.allocations) { const bill = supplierBills(state).find((b) => b.id === a.billId); requireRule(bill?.supplierId === command.supplierId && bill.status === 'POSTED' && a.amountPaisa <= bill.outstanding, 'منتخب بل اسی سپلائر کا ہو اور تخصیص باقی رقم سے زیادہ نہ ہو۔'); }
      p.payments[id] = { ...meta(id, 'DRAFT'), number: num, date: command.date, supplierId: command.supplierId, amountPaisa: command.amountPaisa, method: command.method, reference: command.reference, notes: command.notes, allocations: command.allocations };
      actedId = id; newStatus = 'DRAFT'; break;
    }
    case 'postPayment': {
      const r = p.payments[command.id]; requireRule(r?.status === 'DRAFT', 'یہ ادائیگی پہلے پوسٹ ہو چکی ہے یا موجود نہیں۔');
      for (const a of r.allocations) { const bill = supplierBills(state).find((b) => b.id === a.billId); requireRule(bill && a.amountPaisa <= bill.outstanding, 'بل کی باقی رقم سے زیادہ ادائیگی مختص نہیں ہو سکتی۔'); }
      oldStatus = r.status; r.status = 'POSTED'; touch(r); actedId = r.id; newStatus = r.status; break;
    }
    case 'cancelPayment': {
      const r=p.payments[command.id]; requireRule(r?.status==='DRAFT','صرف مسودہ ادائیگی منسوخ ہو سکتی ہے۔');
      oldStatus=r.status; r.status='CANCELLED'; touch(r); actedId=r.id; newStatus=r.status; break;
    }
    case 'createReturn': {
      ensureDate(command.date); const line = state.goodsReceiptLines[command.goodsReceiptLineId], grn = line && state.goodsReceipts[line.goodsReceiptId]; requireRule(grn?.status === 'POSTED', 'پوسٹ شدہ اصل وصولی منتخب کریں۔');
      const locationId=command.locationId??grn.warehouseLocationId;
      if(state.warehouse&&hasKnownRollCustody(state,line.lotId))requireRule(command.rollId,'معلوم تحویل والی لاٹ کے لیے واپسی کا تھان منتخب کریں۔');
      requireRule(state.locations[locationId]?.status==='ACTIVE'&&state.locations[locationId].category==='GREY','فعال کورا مقام منتخب کریں۔');
      requireRule(command.quantityMeters <= getAvailableMeters(state, line.lotId, locationId, 'GREY'), 'واپسی کے لیے دستیاب کورا کپڑا ناکافی ہے۔');
      if(state.warehouse&&command.rollId)requireRule(command.quantityMeters<=availableRollMeters(state,command.rollId,locationId),'اس مقام پر رول کی دستیاب مقدار ناکافی ہے۔');
      const num = number('PRET', command.date), id = 'purchase-return:user:' + num, supplierId = state.purchaseOrders[grn.purchaseOrderId].supplierId;
      const bill = command.billId ?? supplierBills(state).find((b) => b.status === 'POSTED' && b.receiptIds.includes(grn.id))?.id;
      p.returns[id] = { ...meta(id, 'DRAFT'), number: num, date: command.date, supplierId, goodsReceiptLineId: line.id, lotId: line.lotId, locationId, quantityMeters: command.quantityMeters, reason: command.reason, condition: command.condition, ...(command.rollId ? { rollId: command.rollId } : {}), ...(bill ? { billId: bill } : {}), creditPaisa: bill ? returnCredit(state, line.id, bill, command.quantityMeters, id) : 0 };
      actedId = id; newStatus = 'DRAFT'; break;
    }
    case 'returnAction': {
      const r = p.returns[command.id]; requireRule(r, 'واپسی کا ریکارڈ نہیں ملا۔'); oldStatus = r.status;
      if (command.action === 'APPROVE') { requireRule(r.status === 'DRAFT', 'صرف مسودہ واپسی منظور ہوتی ہے۔'); r.status = 'APPROVED'; }
      if (command.action === 'CANCEL') { requireRule(['DRAFT', 'APPROVED'].includes(r.status), 'پوسٹ شدہ واپسی منسوخ نہیں ہو سکتی۔'); r.status = 'CANCELLED'; }
      if (command.action === 'POST') {
        if(state.warehouse&&hasKnownRollCustody(state,r.lotId))requireRule(r.rollId,'معلوم تحویل کی واپسی میں تھان ضروری ہے؛ پرانا مجموعی مسودہ منسوخ کر کے شناخت شدہ واپسی بنائیں۔');
        if(state.warehouse&&r.rollId)requireRule(r.quantityMeters<=availableRollMeters(state,r.rollId,r.locationId),'اس مقام پر رول کی دستیاب مقدار ناکافی ہے۔');
        requireRule(r.status === 'APPROVED', 'صرف منظور شدہ واپسی پوسٹ ہوتی ہے۔'); requireRule(r.quantityMeters <= getAvailableMeters(state, r.lotId, r.locationId, 'GREY'), 'دستیاب کورا اسٹاک ناکافی ہے۔');
        requireRule(context.at >= Object.values(state.movements).reduce((max, m) => m.occurredAt > max ? m.occurredAt : max, ''), 'پوسٹنگ پچھلے لین دین سے پہلے نہیں ہو سکتی۔');
        r.creditPaisa = r.billId ? returnCredit(state, r.goodsReceiptLineId, r.billId, r.quantityMeters, r.id) : 0; r.status = 'POSTED';
        const mid = 'movement:PURCHASE_RETURN:' + r.id;
        state.movements[mid] = { ...baseMeta(mid, 'POSTED'), sourceType: 'PURCHASE_RETURN', sourceDocumentId: r.id, sourceLineId: r.goodsReceiptLineId, lotId: r.lotId, locationId: r.locationId, category: 'GREY', quantityMeters: -r.quantityMeters, occurredAt: context.at, ...(r.rollId ? { rollId: r.rollId } : {}) };
          if(state.warehouse)Object.assign(state.movements[mid],{companyId:state.warehouse.companyId,fabricId:state.lots[r.lotId].fabricId,fromLocationId:r.locationId,toLocationId:'supplier:'+r.supplierId,role:context.role,reason:r.reason});
      }
      touch(r); actedId = r.id; newStatus = r.status; break;
    }
  }
  audit(actedId, command.kind, oldStatus, newStatus, summary);
  return validateDomainState(state);
}
function executeProcurementAudit(state: DomainState, context: ProcurementContext, command: ProcurementCommand, documentId: string, previousStatus: string, newStatus: string, summary: string) {
  const p = state.procurement!; let count = Object.keys(p.audits).length + 1; while (p.audits['proc-audit:' + count]) count++;
  const id = 'proc-audit:' + count;
  p.audits[id] = { id, status: 'ACTIVE', companyId: p.companyId, createdAt: context.at, updatedAt: context.at, createdBy: context.actorId, updatedBy: context.actorId, origin: 'USER', actorId: context.actorId, role: context.role, action: command.kind, documentType: 'GRN', documentId, previousStatus, newStatus, summary };
  return state;
}
/** Pure validated result; storage commits once through the existing applyTransaction action. */
export function executeProcurement(state: DomainState, command: ProcurementCommand, context: ProcurementContext): TransactionResult {
  try { return applyProcurement(state, command, context); }
  catch (error) { return rejection(error instanceof RuleFailure ? error.message : 'مقدار، رقم یا متعلقہ ریکارڈ کی جانچ ناکام ہوئی؛ موجودہ ڈیٹا برقرار ہے۔'); }
}
