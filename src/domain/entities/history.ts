import { z } from 'zod';
const id = z.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/).refine((v) => !Object.getOwnPropertyNames(Object.prototype).includes(v));
const text = z.string().min(1).max(500);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => { const d = new Date(v + 'T00:00:00Z'); return Number.isFinite(+d) && d.toISOString().startsWith(v); });
const money = z.number().int().nonnegative().safe();
const count = z.number().int().nonnegative().safe();
const meters = z.number().nonnegative().finite().refine((v) => Math.abs(v * 10000 - Math.round(v * 10000)) < 0.00001);
const base = z.object({ id, companyId: id, createdAt: z.string().datetime(), updatedAt: z.string().datetime(), createdBy: id, updatedBy: id, origin: z.enum(['SEED', 'USER']) });
const entity = base.extend({ status: z.literal('ACTIVE') });
const posted = base.extend({ status: z.literal('POSTED'), number: text, date: day });
const map = <T extends z.ZodRawShape>(s: z.ZodObject<T>) => z.record(id, s.strict());
const ids = z.array(id).refine((v) => new Set(v).size === v.length);
export const historySchema = z.object({
  version: z.literal(3), seedVersion: z.literal('noor-expanded-2026-v1'), companyId: id, asOf: day,
  supplierProfiles: map(entity.extend({ supplierId: id, code: text, nameEnglish: text, contact: text, email: z.string().email(), address: text, categories: z.array(text), termDays: count, creditLimitPaisa: money })),
  fabricProfiles: map(entity.extend({ fabricId: id, code: text, supplierId: id, category: text, gsm: z.number().positive(), ratePaisa: money, reorderMeters: meters, grade: text })),
  customerProfiles: map(entity.extend({ customerId: id, owner: text, address: text, termDays: count, creditLimitPaisa: money })),
  contractorProfiles: map(entity.extend({ contractorId: id, termDays: count, ratePaisaPerMeter: money })),
  collections: map(entity.extend({ name: text, season: text })),
  designProfiles: map(entity.extend({ designId: id, targetSuits: count, targetPricePaisaPerSuit: money, productionBatchIds: ids })),
  variants: map(entity.extend({ designId: id, name: text, colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })),
  boms: map(entity.extend({ designId: id, pieceCount: z.union([z.literal(2), z.literal(3)]), lineIds: ids })),
  bomLines: map(entity.extend({ bomId: id, component: z.enum(['SHIRT', 'TROUSER', 'DUPATTA']), fabricId: id, widthInches: z.number().positive(), consumptionMetersPerSuit: meters.refine((v) => v > 0), wastePercent: z.number().min(0).max(100) })),
  processingSchedules: map(entity.extend({ challanId: id, issuedOn: day, dueOn: day, workflow: z.enum(['A', 'B', 'C', 'D']) })),
  processingCharges: map(posted.extend({ receiptId: id, contractorId: id, meters, ratePaisaPerMeter: money, totalPaisa: money })),
  batches: map(base.extend({ number: text, designId: id, bomId: id, date: day, dueOn: day, status: z.enum(['PLANNED', 'CUTTING', 'PACKING', 'COMPLETED']), targetSuits: count, completedSuits: count, rejectedSuits: count, inProgressSuits: count, plannedSuits: count, allocationIds: ids, estimatedCostPaisa: money })),
  materialAllocations: map(posted.extend({ batchId: id, bomLineId: id, lotId: id, sourceLocationId: id, quantityMeters: meters, embeddedMeters: meters, wasteMeters: meters, wipMeters: meters, costPaisa: money })),
  componentOutputs: map(posted.extend({ batchId: id, bomLineId: id, acceptedPieces: count, rejectedPieces: count, wipPieces: count })),
  packaging: map(posted.extend({ batchId: id, skuId: id, variantId: id, warehouseLocationId: id, packedSuits: count, rejectedSuits: count, damagedSuits: count, inspectionPassedSuits: count })),
  finishedMovements: map(posted.extend({ skuId: id, locationId: id, sourceId: id, sourceType: z.enum(['PACKAGING', 'DISPATCH', 'DAMAGE']), quantitySuits: z.number().int().safe().refine((v) => v !== 0) })),
  salesOrders: map(base.extend({ number: text, customerId: id, date: day, requiredOn: day, status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_DISPATCHED', 'COMPLETED', 'CANCELLED']), lineIds: ids })),
  salesLines: map(entity.extend({ salesOrderId: id, skuId: id, suits: count.refine((v) => v > 0), unitPricePaisa: money, discountPaisa: money })),
  reservations: map(base.extend({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']), reservedOn: day, salesLineId: id, skuId: id, locationId: id, suits: count })),
  dispatches: map(posted.extend({ salesOrderId: id, customerId: id, lineIds: ids })),
  dispatchLines: map(entity.extend({ dispatchId: id, salesLineId: id, reservationId: id, skuId: id, suits: count.refine((v) => v > 0) })),
  invoices: map(posted.extend({ customerId: id, dispatchIds: ids, lineIds: ids, dueOn: day, totalPaisa: money })),
  invoiceLines: map(entity.extend({ invoiceId: id, dispatchLineId: id, suits: count, unitPricePaisa: money, discountPaisa: money, totalPaisa: money })),
  payments: map(posted.extend({ customerId: id, amountPaisa: money.refine((v) => v > 0), allocationIds: ids, method: z.enum(['CASH', 'BANK', 'CHEQUE']), reference: text })),
  paymentAllocations: map(entity.extend({ paymentId: id, invoiceId: id, amountPaisa: money.refine((v) => v > 0) })),
  supplierInvoices: map(posted.extend({ supplierId: id, goodsReceiptId: id, dueOn: day, totalPaisa: money })),
  expenses: map(posted.extend({ category: z.enum(['CUTTING', 'EMBROIDERY', 'PACKAGING', 'TRANSPORT', 'LABOR', 'RENT', 'OVERHEAD']), batchId: id.optional(), amountPaisa: money, description: text })),
}).strict();
export type HistoricalDataset = z.infer<typeof historySchema>;
