import { z } from 'zod';
import { isQuantity } from '@/domain/value-objects/quantity';
export const procurementId = z.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/).refine((v) => !Object.getOwnPropertyNames(Object.prototype).includes(v));
export const procurementDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => { const d = new Date(v + 'T00:00:00Z'); return Number.isFinite(+d) && d.toISOString().startsWith(v); });
export const procurementMoney = z.number().int().nonnegative().safe();
export const procurementQuantity = z.number().refine((v) => isQuantity(v));
const text = z.string().min(1).max(500), optionalText = z.string().max(1000);
const ids = z.array(procurementId).refine((v) => new Set(v).size === v.length);
const meta = z.object({ id: procurementId, companyId: procurementId, createdAt: z.string().datetime(), updatedAt: z.string().datetime(), createdBy: procurementId, updatedBy: procurementId, origin: z.literal('USER') });
const active = meta.extend({ status: z.literal('ACTIVE') });
const document = meta.extend({ number: text, date: procurementDate });
const posting = document.extend({ status: z.enum(['DRAFT', 'APPROVED', 'POSTED', 'CANCELLED']) });
const map = <T extends z.ZodRawShape>(s: z.ZodObject<T>) => z.record(procurementId, s.strict());
export const purchaseUnit = z.enum(['METER', 'YARD', 'ROLL', 'THAAN']);
export const supplierFields = {
  name: text, code: text, city: text, contact: text, phone: text.refine((v) => /^\+?[0-9][0-9 ()-]{6,20}$/.test(v)),
  address: text, category: text, termDays: z.number().int().min(0).max(365), status: z.enum(['ACTIVE', 'INACTIVE']),
  email: z.union([z.literal(''), z.string().email()]), alternatePhone: optionalText, notes: optionalText,
  openingBalancePaisa: procurementMoney, creditLimitPaisa: procurementMoney,
};
export const fabricFields = {
  name: text, code: text, composition: text, category: text, width: z.number().positive().max(500), widthUnit: z.enum(['INCH', 'CM']),
  gsm: z.number().positive().max(1500), inventoryUnit: z.literal('METER'), defaultUnit: purchaseUnit,
  supplierId: procurementId, ratePaisa: procurementMoney, grade: text, reorderMeters: procurementQuantity,
  description: optionalText, status: z.enum(['ACTIVE', 'INACTIVE']),
};
export const procurementSchema = z.object({
  version: z.literal(4), companyId: procurementId,
  supplierProfiles: map(active.extend({ supplierId: procurementId, code: text, contact: text, address: text, category: text, termDays: z.number().int().min(0).max(365), email: z.union([z.literal(''), z.string().email()]), alternatePhone: optionalText, notes: optionalText, creditLimitPaisa: procurementMoney })),
  fabricProfiles: map(active.extend({ fabricId: procurementId, code: text, category: text, width: z.number().positive(), widthUnit: z.enum(['INCH', 'CM']), gsm: z.number().positive(), defaultUnit: purchaseUnit, supplierId: procurementId, ratePaisa: procurementMoney, grade: text, reorderMeters: procurementQuantity, description: optionalText })),
  requests: map(document.extend({ status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED']), requestedById: procurementId, department: text, fabricId: procurementId, quantity: procurementQuantity.refine((v) => v > 0), unit: purchaseUnit, measuredLengths: z.array(procurementQuantity.refine((v) => v > 0)), quantityMeters: procurementQuantity.refine((v) => v > 0), requiredOn: procurementDate, reason: text, priority: z.enum(['NORMAL', 'URGENT']), poId: procurementId.optional() })),
  orderProfiles: map(active.extend({ purchaseOrderId: procurementId, expectedOn: procurementDate, warehouseLocationId: procurementId, termDays: z.number().int().min(0).max(365), notes: optionalText, requestId: procurementId.optional(), closedAt: z.string().datetime().optional() })),
  orderLines: map(active.extend({ purchaseOrderLineId: procurementId, unit: purchaseUnit, originalQuantity: procurementQuantity.refine((v) => v > 0), measuredLengths: z.array(procurementQuantity.refine((v) => v > 0)), specification: optionalText, discountPaisa: procurementMoney })),
  receiptProfiles: map(active.extend({ goodsReceiptId: procurementId, receivedById: procurementId, transport: optionalText, supplierChallan: text, notes: optionalText })),
  inspectionRolls: map(active.extend({ goodsReceiptId: procurementId, purchaseOrderLineId: procurementId, receiptLineId: procurementId.optional(), rollId: procurementId.optional(), label: text, measuredLength: procurementQuantity.refine((v) => v > 0), measurementUnit: z.enum(['METER', 'YARD']), canonicalMeters: procurementQuantity.refine((v) => v > 0), packagingUnit: z.enum(['ROLL', 'THAAN']), widthInches: z.number().positive(), grade: text, result: z.enum(['ACCEPTED', 'REJECTED', 'QUARANTINED']), locationId: procurementId, remarks: optionalText, resolution: z.enum(['PENDING', 'ACCEPTED', 'RETURNED_TO_SUPPLIER']) })),
  bills: map(posting.extend({ supplierId: procurementId, receiptIds: ids, lineIds: ids, reference: text, dueOn: procurementDate, discountPaisa: procurementMoney, chargesPaisa: procurementMoney, taxPaisa: z.literal(0), totalPaisa: procurementMoney })),
  billLines: map(active.extend({ billId: procurementId, goodsReceiptLineId: procurementId, quantityMeters: procurementQuantity.refine((v) => v > 0), amountPaisa: procurementMoney })),
  payments: map(posting.extend({ supplierId: procurementId, amountPaisa: procurementMoney.refine((v) => v > 0), method: z.enum(['CASH', 'BANK', 'CHEQUE']), reference: text, notes: optionalText, allocations: z.array(z.object({ billId: procurementId, amountPaisa: procurementMoney.refine((v) => v > 0) }).strict()) })),
  returns: map(posting.extend({ supplierId: procurementId, goodsReceiptLineId: procurementId, lotId: procurementId, rollId: procurementId.optional(), locationId: procurementId, quantityMeters: procurementQuantity.refine((v) => v > 0), reason: text, condition: text, billId: procurementId.optional(), creditPaisa: procurementMoney })),
  audits: map(active.extend({ actorId: procurementId, role: text, action: text, documentType: text, documentId: procurementId, previousStatus: optionalText, newStatus: text, summary: text })),
}).strict();
export type ProcurementState = z.infer<typeof procurementSchema>;
export function emptyProcurement(companyId: string): ProcurementState {
  return { version: 4, companyId, supplierProfiles: {}, fabricProfiles: {}, requests: {}, orderProfiles: {}, orderLines: {}, receiptProfiles: {}, inspectionRolls: {}, bills: {}, billLines: {}, payments: {}, returns: {}, audits: {} };
}
