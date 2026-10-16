import { z } from 'zod';
import { finishingSchema } from '@/domain/entities/finishing';
import { inspectFinishing } from '@/services/validation/finishing';
import type { DomainState, InventoryMovement } from '@/domain/entities';
import { PROCESSING_SERVICE } from '@/domain/enums';
import { isQuantity, roundQuantity, toMeters } from '@/domain/value-objects/quantity';
import { inspectInventoryInvariants } from '@/domain/invariants';
import type { DomainError, EntityMeta } from '@/types/common';
import { historySchema } from '@/domain/entities/history';
import { inspectHistory } from '@/services/validation/history';
import { procurementSchema } from '@/domain/entities/procurement';
import { inspectProcurement } from '@/services/validation/procurement';
import { warehouseSchema } from '@/domain/entities/warehouse';
import { inspectWarehouse } from '@/services/validation/warehouse';
import { processingOperationsSchema } from '@/domain/entities/processing-operations';
import { inspectProcessing } from '@/services/validation/processing';
import { designOperationsSchema } from '@/domain/entities/design-operations';
import { inspectDesigns } from '@/services/validation/designs';
import { productionOperationsSchema } from '@/domain/entities/production-operations';
import { productionMeterEffects } from '@/services/production/materials';
import { inspectProduction } from '@/services/validation/production';
import { processingMovementEffects } from '@/services/inventory/processing';
import { warehouseMovementEffects } from '@/services/inventory/warehouse';

const reservedKeys = new Set(Object.getOwnPropertyNames(Object.prototype));
const id = z.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/).refine((value) => !reservedKeys.has(value), 'Reserved object key cannot be an entity ID');
const dateTime = z.string().datetime({ offset: true });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value); });
const text = z.string().min(1).max(500);
const quantity = z.number().refine((value) => isQuantity(value), 'Invalid meter precision or quantity');
const positiveQuantity = quantity.refine((value) => value > 0);
const money = z.number().nonnegative().int().safe();
const category = z.enum(['GREY', 'INSPECTION_HOLD', 'QUARANTINED', 'PROCESSING_OUT', 'PROCESSED', 'PRODUCTION_WIP', 'CUT_COMPONENT', 'FINISHED_GOODS', 'REJECTED', 'DAMAGED']);
const meta = z.object({ id, createdAt: dateTime, updatedAt: dateTime, createdBy: id, updatedBy: id, origin: z.enum(['SEED', 'USER']) });
const active = meta.extend({ status: z.enum(['ACTIVE', 'INACTIVE']) });
const activeOnly = meta.extend({ status: z.literal('ACTIVE') });
const posted = meta.extend({ status: z.literal('POSTED') });
const document = meta.extend({ number: text });
const receiptDocument = document.extend({ status: z.enum(['DRAFT', 'APPROVED', 'POSTED', 'CANCELLED']) });
const childIds = z.array(id).min(1).refine((ids) => new Set(ids).size === ids.length, 'Duplicate child IDs');
const lengthUnit = z.enum(['METER', 'YARD']);
const entityMap = <T extends z.ZodTypeAny>(schema: T) => z.record(id, schema);

const rawStateSchema = z.object({
  finishing: finishingSchema.optional(),
  production: productionOperationsSchema.optional(),
  studio: designOperationsSchema.optional(),
  history: historySchema.optional(), processing: processingOperationsSchema.optional(),
  procurement: procurementSchema.optional(), warehouse: warehouseSchema.optional(),
  companies: entityMap(activeOnly.extend({ name: text, city: text, address: text, currency: z.literal('PKR'), locale: z.literal('ur-PK') }).strict()),
  employees: entityMap(active.extend({ companyId: id, name: text, roleId: id, departmentId: id.optional() }).strict()),
  roles: entityMap(active.extend({ name: text, permissionKeys: z.array(text) }).strict()),
  warehouses: entityMap(active.extend({ companyId: id, name: text }).strict()),
  locations: entityMap(active.extend({ name: text, warehouseId: id.optional(), contractorId: id.optional(), category }).strict()),
  suppliers: entityMap(active.extend({ name: text, city: text, phone: text, openingBalancePaisa: money }).strict()),
  fabrics: entityMap(active.extend({ name: text, composition: text, widthInches: z.number().positive().max(200), inventoryUnit: z.literal('METER'), specificationId: id.optional() }).strict()),
  lots: entityMap(active.extend({ code: text, fabricId: id, supplierId: id, sourceGoodsReceiptLineId: id }).strict()),
  rolls: entityMap(active.extend({ lotId: id, label: text, packagingUnit: z.enum(['ROLL', 'THAAN']), actualLengthMeters: positiveQuantity, originalUnit: lengthUnit, originalLength: positiveQuantity }).strict()),
  purchaseOrders: entityMap(document.extend({ status: z.enum(['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED']), supplierId: id, lineIds: childIds, orderDate: date }).strict()),
  purchaseOrderLines: entityMap(activeOnly.extend({ purchaseOrderId: id, fabricId: id, quantityMeters: positiveQuantity, originalQuantity: positiveQuantity, originalUnit: z.enum(['METER', 'YARD', 'ROLL', 'THAAN', 'PIECE', 'SUIT', 'CARTON']), conversionMetersPerUnit: z.number().positive().finite(), unitPricePaisaPerMeter: money }).strict()),
  goodsReceipts: entityMap(receiptDocument.extend({ purchaseOrderId: id, warehouseLocationId: id, lineIds: z.array(id).refine((ids) => new Set(ids).size === ids.length), receivedOn: date }).strict()),
  goodsReceiptLines: entityMap(activeOnly.extend({ goodsReceiptId: id, purchaseOrderLineId: id, lotId: id, quantityMeters: positiveQuantity, originalQuantity: positiveQuantity, originalUnit: lengthUnit, conversionMetersPerUnit: z.number().positive().finite() }).strict()),
  contractors: entityMap(active.extend({ name: text, city: text, phone: text, services: z.array(z.enum(PROCESSING_SERVICE)).min(1) }).strict()),
  challans: entityMap(document.extend({ status: z.enum(['DRAFT', 'APPROVED', 'POSTED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED']), contractorId: id, fromLocationId: id, contractorLocationId: id, serviceType: z.enum(PROCESSING_SERVICE), lineIds: childIds, jobId: id.optional() }).strict()),
  challanLines: entityMap(activeOnly.extend({ challanId: id, lotId: id, quantityMeters: positiveQuantity, rollId: id.optional() }).strict()),
  processingReceipts: entityMap(receiptDocument.extend({ challanId: id, destinationLocationId: id, lineIds: childIds }).strict()),
  processingReceiptLines: entityMap(activeOnly.extend({ processingReceiptId: id, challanLineId: id, outputMeters: quantity, lossMeters: quantity, lossReason: z.string().max(500), lossApprovedById: id.optional() }).strict()),
  processingLosses: entityMap(posted.extend({ receiptId: id, receiptLineId: id, challanId: id, challanLineId: id, lotId: id, quantityMeters: positiveQuantity, reason: text, approvedById: id }).strict()),
  movements: entityMap(posted.extend({ sourceType: z.enum(['GOODS_RECEIPT', 'PROCESSING_ISSUE', 'PROCESSING_RECEIPT', 'PROCESSING_LOSS', 'PURCHASE_RETURN', 'WAREHOUSE_TRANSFER', 'WAREHOUSE_ADJUSTMENT', 'QUALITY_CHANGE', 'PRODUCTION_ISSUE', 'PRODUCTION_RETURN', 'CUTTING_CONSUMPTION', 'CUTTING_SCRAP']), sourceDocumentId: id, sourceLineId: id, lotId: id, rollId: id.optional(), locationId: id, category, quantityMeters: z.number().refine((value) => value !== 0 && isQuantity(Math.abs(value), false)), occurredAt: dateTime, contractorId: id.optional(), companyId: id.optional(), fabricId: id.optional(), fromLocationId: id.optional(), toLocationId: id.optional(), role: z.enum(['owner','purchase','warehouse','production','sales','accounts']).optional(), reason: text.optional() }).strict()),
  reservations: entityMap(meta.extend({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']), lotId: id, locationId: id, category, quantityMeters: positiveQuantity, sourceDocumentId: id }).strict()),
  customers: entityMap(active.extend({ name: text, city: text, phone: text, openingBalancePaisa: money }).strict()),
  designs: entityMap(meta.extend({ status: z.enum(['DRAFT', 'APPROVED', 'INACTIVE']), code: text, name: text, pieceCount: z.union([z.literal(2), z.literal(3)]), imagePath: z.string().startsWith('/'), collectionId: id.optional(), bomId: id.optional() }).strict()),
  finishedSKUs: entityMap(active.extend({ code: text, designId: id, name: text, pieceCount: z.union([z.literal(2), z.literal(3)]), unit: z.literal('SUIT'), colorVariantId: id.optional(), catalogueOnly: z.boolean() }).strict()),
  activityLogs: entityMap(activeOnly.extend({ actorId: id, action: text, documentId: id, detail: text }).strict()),
}).strict();

type MovementEffect = Pick<InventoryMovement, 'sourceType' | 'sourceDocumentId' | 'sourceLineId' | 'lotId' | 'locationId' | 'category' | 'quantityMeters' | 'contractorId'>;
const effectKey = (effect: MovementEffect) => [effect.sourceType, effect.sourceDocumentId, effect.sourceLineId, effect.lotId, effect.locationId, effect.category, effect.quantityMeters, effect.contractorId ?? ''].join('|');
const isIssued = (status: string) => ['POSTED', 'PARTIALLY_RECEIVED', 'COMPLETED'].includes(status);

function checkRelationships(state: DomainState, context: z.RefinementCtx): void {
  const fail = (message: string) => context.addIssue({ code: z.ZodIssueCode.custom, message });
  const ref = (exists: unknown, description: string) => { if (!exists) fail(`Missing or inconsistent relationship: ${description}`); return Boolean(exists); };
  const expected: MovementEffect[] = [];
  const allIds = new Set<string>();
  const numberIds = new Set<string>();
  for (const [collection, entries] of Object.entries(state)) {
    if (collection === 'history' || collection === 'procurement' || collection === 'warehouse' || collection === 'processing' || collection === 'studio' || collection === 'production' || collection === 'finishing') continue;
    for (const [key, entity] of Object.entries(entries as Record<string, EntityMeta>)) {
      if (key !== entity.id || allIds.has(entity.id)) fail(`Duplicate or mismatched entity key: ${collection}/${key}`);
      allIds.add(entity.id);
      ref(state.employees[entity.createdBy], `${key}.createdBy`);
      ref(state.employees[entity.updatedBy], `${key}.updatedBy`);
      if (new Date(entity.updatedAt) < new Date(entity.createdAt)) fail(`Invalid audit timestamp: ${key}`);
    }
  }
  if (Object.keys(state.companies).length !== 1) fail('Exactly one company is required');
  if (Object.keys(state.employees).length === 0) fail('A demo employee is required');
  Object.values(state.employees).forEach((employee) => { ref(state.companies[employee.companyId], employee.id); ref(state.roles[employee.roleId], employee.id); if (employee.departmentId) fail('Department persistence starts in a future phase'); });
  Object.values(state.warehouses).forEach((warehouse) => ref(state.companies[warehouse.companyId], warehouse.id));
  Object.values(state.locations).forEach((location) => {
    if (location.category === 'PROCESSING_OUT') {
      ref(location.contractorId && state.contractors[location.contractorId], location.id);
      if (location.warehouseId) fail('Contractor location cannot also be a warehouse');
    } else {
      ref(location.warehouseId && state.warehouses[location.warehouseId], location.id);
      if (location.contractorId) fail('Warehouse location cannot also belong to a contractor');
    }
  });
  Object.values(state.fabrics).forEach((fabric) => { if (fabric.specificationId) fail('Specification persistence starts in a future phase'); });
  Object.values(state.lots).forEach((lot) => {
    ref(state.fabrics[lot.fabricId], lot.id); ref(state.suppliers[lot.supplierId], lot.id);
    const receiptLine = state.goodsReceiptLines[lot.sourceGoodsReceiptLineId];
    ref(receiptLine && (receiptLine.lotId === lot.id || Object.values(state.processing?.outputs ?? {}).some(o => o.lotId === lot.id && state.lots[o.parentLotId]?.sourceGoodsReceiptLineId === lot.sourceGoodsReceiptLineId)), lot.id);
    const orderLine = receiptLine && state.purchaseOrderLines[receiptLine.purchaseOrderLineId];
    ref(orderLine && orderLine.fabricId === lot.fabricId && state.purchaseOrders[orderLine.purchaseOrderId]?.supplierId === lot.supplierId, lot.id);
  });
  Object.values(state.rolls).forEach((roll) => {
    ref(state.lots[roll.lotId], roll.id);
    if (toMeters(roll.originalLength, roll.originalUnit) !== roll.actualLengthMeters) fail(`Roll measurement mismatch: ${roll.id}`);
  });
  Object.values(state.lots).forEach((lot) => {
    const rollTotal = roundQuantity(Object.values(state.rolls).filter((roll) => roll.lotId === lot.id).reduce((sum, roll) => sum + roll.actualLengthMeters, 0));
    if (rollTotal > (state.goodsReceiptLines[lot.sourceGoodsReceiptLineId]?.quantityMeters ?? 0)) fail(`Roll lengths exceed lot receipt: ${lot.id}`);
  });
  const documents = [...Object.values(state.purchaseOrders), ...Object.values(state.goodsReceipts), ...Object.values(state.challans), ...Object.values(state.processingReceipts)];
  documents.forEach((document) => { if (numberIds.has(document.number)) fail(`Duplicate document number: ${document.number}`); numberIds.add(document.number); });
  Object.values(state.purchaseOrders).forEach((order) => {
    ref(state.suppliers[order.supplierId], order.id);
    order.lineIds.forEach((lineId) => ref(state.purchaseOrderLines[lineId]?.purchaseOrderId === order.id, lineId));
    const totals = order.lineIds.map((lineId) => {
      const line = state.purchaseOrderLines[lineId];
      const received = roundQuantity(Object.values(state.goodsReceiptLines).filter((receiptLine) => receiptLine.purchaseOrderLineId === lineId && state.goodsReceipts[receiptLine.goodsReceiptId]?.status === 'POSTED').reduce((sum, receiptLine) => sum + receiptLine.quantityMeters, 0));
      if (line && received > line.quantityMeters) fail(`Goods receipts exceed ordered meters: ${lineId}`);
      return { received, ordered: line?.quantityMeters ?? 0 };
    });
    const any = totals.some((entry) => entry.received > 0);
    const complete = totals.every((entry) => entry.received === entry.ordered);
    if (any && order.status !== (complete ? 'COMPLETED' : 'PARTIALLY_RECEIVED')) fail(`Purchase order receipt status mismatch: ${order.id}`);
    if (!any && ['PARTIALLY_RECEIVED', 'COMPLETED'].includes(order.status)) fail(`Purchase order has no posted receipts: ${order.id}`);
  });
  Object.values(state.purchaseOrderLines).forEach((line) => {
    ref(state.purchaseOrders[line.purchaseOrderId]?.lineIds.includes(line.id), line.id); ref(state.fabrics[line.fabricId], line.id);
    if (!['METER', 'YARD'].includes(line.originalUnit)) fail('Phase 1 PO lines use meter/yard original quantities; actual rolls have separate measured-length records');
    else if (line.conversionMetersPerUnit !== (line.originalUnit === 'YARD' ? 0.9144 : 1) || roundQuantity(line.originalQuantity * line.conversionMetersPerUnit) !== line.quantityMeters) fail(`PO unit conversion mismatch: ${line.id}`);
  });
  Object.values(state.goodsReceipts).forEach((receipt) => {
    if (!receipt.lineIds.length && !Object.values(state.procurement?.receiptProfiles ?? {}).some((p) => p.goodsReceiptId === receipt.id)) fail('Empty receipt requires operational inspection evidence');
    const order = state.purchaseOrders[receipt.purchaseOrderId];
    ref(order, receipt.id);
    ref(state.locations[receipt.warehouseLocationId]?.category === 'GREY', receipt.id);
    receipt.lineIds.forEach((lineId) => {
      const line = state.goodsReceiptLines[lineId];
      ref(line?.goodsReceiptId === receipt.id, lineId);
      if (line) ref(state.purchaseOrderLines[line.purchaseOrderLineId]?.purchaseOrderId === receipt.purchaseOrderId, line.id);
      if (line && receipt.status === 'POSTED') expected.push({ sourceType: 'GOODS_RECEIPT', sourceDocumentId: receipt.id, sourceLineId: line.id, lotId: line.lotId, locationId: receipt.warehouseLocationId, category: 'GREY', quantityMeters: line.quantityMeters });
    });
    if (receipt.status === 'POSTED' && (!order || ['DRAFT', 'CANCELLED'].includes(order.status))) fail(`Receipt uses unapproved purchase order: ${receipt.id}`);
  });
  Object.values(state.goodsReceiptLines).forEach((line) => {
    ref(state.goodsReceipts[line.goodsReceiptId]?.lineIds.includes(line.id), line.id);
    ref(state.lots[line.lotId]?.sourceGoodsReceiptLineId === line.id, line.id);
    if (line.conversionMetersPerUnit !== (line.originalUnit === 'YARD' ? 0.9144 : 1) || roundQuantity(line.originalQuantity * line.conversionMetersPerUnit) !== line.quantityMeters) fail(`Receipt unit conversion mismatch: ${line.id}`);
  });
  Object.values(state.challans).forEach((challan) => {
    if (Object.values(state.processing?.issues ?? {}).some(r => r.challanId === challan.id)) return;
    ref(state.contractors[challan.contractorId]?.services.includes(challan.serviceType), challan.id);
    ref(state.locations[challan.fromLocationId]?.category === 'GREY', challan.id);
    ref(state.locations[challan.contractorLocationId]?.category === 'PROCESSING_OUT' && state.locations[challan.contractorLocationId]?.contractorId === challan.contractorId, challan.id);
    if (challan.jobId) fail('Processing job persistence starts in a future phase');
    let totalIssued = 0; let totalSettled = 0;
    challan.lineIds.forEach((lineId) => {
      const line = state.challanLines[lineId];
      ref(line?.challanId === challan.id, lineId);
      if (!line) return;
      totalIssued += line.quantityMeters;
      const settled = roundQuantity(Object.values(state.processingReceiptLines).filter((entry) => entry.challanLineId === lineId && state.processingReceipts[entry.processingReceiptId]?.status === 'POSTED').reduce((sum, entry) => sum + entry.outputMeters + entry.lossMeters, 0));
      totalSettled += settled;
      if (settled > line.quantityMeters || (settled > 0 && !isIssued(challan.status))) fail(`Processing receipt exceeds issued quantity: ${lineId}`);
      if (isIssued(challan.status)) {
        expected.push({ sourceType: 'PROCESSING_ISSUE', sourceDocumentId: challan.id, sourceLineId: line.id, lotId: line.lotId, locationId: challan.fromLocationId, category: 'GREY', quantityMeters: -line.quantityMeters, contractorId: challan.contractorId });
        expected.push({ sourceType: 'PROCESSING_ISSUE', sourceDocumentId: challan.id, sourceLineId: line.id, lotId: line.lotId, locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: line.quantityMeters, contractorId: challan.contractorId });
      }
    });
    totalIssued = roundQuantity(totalIssued); totalSettled = roundQuantity(totalSettled);
    if (isIssued(challan.status) && challan.status !== (totalSettled === 0 ? 'POSTED' : totalSettled === totalIssued ? 'COMPLETED' : 'PARTIALLY_RECEIVED')) fail(`Challan settlement status mismatch: ${challan.id}`);
  });
  Object.values(state.challanLines).forEach((line) => { ref(state.challans[line.challanId]?.lineIds.includes(line.id), line.id); ref(state.lots[line.lotId], line.id); if(line.rollId)ref(state.warehouse&&state.rolls[line.rollId]?.lotId===line.lotId,line.id); });
  Object.values(state.processingReceipts).forEach((receipt) => {
    if (Object.values(state.processing?.receipts ?? {}).some(r => r.receiptId === receipt.id)) return;
    const challan = state.challans[receipt.challanId];
    ref(challan, receipt.id); ref(state.locations[receipt.destinationLocationId]?.category === 'PROCESSED', receipt.id);
    receipt.lineIds.forEach((lineId) => {
      const line = state.processingReceiptLines[lineId];
      ref(line?.processingReceiptId === receipt.id, lineId);
      if (!line) return;
      const issuedLine = state.challanLines[line.challanLineId];
      ref(issuedLine?.challanId === receipt.challanId, lineId);
      if (line.outputMeters + line.lossMeters <= 0) fail(`Processing receipt has no output or explicit loss: ${lineId}`);
      if (line.lossMeters > 0) {
        ref(line.lossApprovedById && state.employees[line.lossApprovedById], lineId);
        if (!line.lossReason.trim()) fail(`Processing loss needs a reason: ${lineId}`);
      }
      if (receipt.status === 'POSTED' && challan && issuedLine) {
        const shared = { sourceDocumentId: receipt.id, sourceLineId: line.id, lotId: issuedLine.lotId, contractorId: challan.contractorId };
        if (line.outputMeters > 0) {
          expected.push({ ...shared, sourceType: 'PROCESSING_RECEIPT', locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: -line.outputMeters });
          expected.push({ ...shared, sourceType: 'PROCESSING_RECEIPT', locationId: receipt.destinationLocationId, category: 'PROCESSED', quantityMeters: line.outputMeters });
        }
        if (line.lossMeters > 0) expected.push({ ...shared, sourceType: 'PROCESSING_LOSS', locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: -line.lossMeters });
        const losses = Object.values(state.processingLosses).filter((loss) => loss.receiptLineId === line.id);
        if (losses.length !== (line.lossMeters > 0 ? 1 : 0)) fail(`Missing or duplicate explicit loss record: ${line.id}`);
      }
    });
  });
  Object.values(state.processingReceiptLines).forEach((line) => ref(state.processingReceipts[line.processingReceiptId]?.lineIds.includes(line.id), line.id));
  Object.values(state.processingLosses).forEach((loss) => {
    const receipt = state.processingReceipts[loss.receiptId];
    const line = state.processingReceiptLines[loss.receiptLineId];
    const challanLine = state.challanLines[loss.challanLineId];
    if (!receipt || !line || receipt.status !== 'POSTED' || line.processingReceiptId !== receipt.id || receipt.challanId !== loss.challanId || line.challanLineId !== loss.challanLineId || challanLine?.lotId !== loss.lotId || loss.quantityMeters !== line.lossMeters || loss.approvedById !== line.lossApprovedById || loss.reason !== line.lossReason) fail(`Invalid processing loss relationship: ${loss.id}`);
  });
  const expectedKeys = new Map<string, number>();
  Object.values(state.procurement?.returns ?? {}).filter((r) => r.status === 'POSTED').forEach((r) => expected.push({ sourceType: 'PURCHASE_RETURN', sourceDocumentId: r.id, sourceLineId: r.goodsReceiptLineId, lotId: r.lotId, locationId: r.locationId, category: 'GREY', quantityMeters: -r.quantityMeters }));
  expected.push(...warehouseMovementEffects(state), ...processingMovementEffects(state),...productionMeterEffects(state));
  expected.forEach((effect) => expectedKeys.set(effectKey(effect), (expectedKeys.get(effectKey(effect)) ?? 0) + 1));
  Object.values(state.movements).forEach((movement) => {
    ref(state.lots[movement.lotId], movement.id); ref(state.locations[movement.locationId]?.category === movement.category, movement.id);
    if (movement.rollId) ref(state.rolls[movement.rollId]?.lotId === movement.lotId, movement.id);
    const key = effectKey(movement); const remaining = expectedKeys.get(key) ?? 0;
    if (remaining < 1) fail(`Unexpected, changed or duplicate movement: ${movement.id}`); else expectedKeys.set(key, remaining - 1);
    if (movement.occurredAt !== movement.createdAt) fail(`Movement timestamp mismatch: ${movement.id}`);
  });
  if ([...expectedKeys.values()].some((count) => count !== 0)) fail('Posted document inventory history is incomplete');
  // All posting effects are additive and immutable. Check historical balances, as well as final balances.
  const timeline = new Map<number, InventoryMovement[]>();
  Object.values(state.movements).forEach((movement) => { const time = new Date(movement.occurredAt).valueOf(); timeline.set(time, [...(timeline.get(time) ?? []), movement]); });
  const running = new Map<string, number>();
  [...timeline.entries()].sort(([a], [b]) => a - b).forEach(([, movements]) => {
    movements.forEach((movement) => { const key = `${movement.lotId}|${movement.locationId}|${movement.category}`; running.set(key, roundQuantity((running.get(key) ?? 0) + movement.quantityMeters)); });
    if ([...running.values()].some((value) => value < 0)) fail('Inventory history contains negative stock');
  });
  // Reservation command contracts are defined for later phases; accepting imported reservations now would claim an unimplemented workflow.
  if (Object.keys(state.reservations).length && !state.warehouse) fail('Reservation posting requires warehouse workflow evidence');
  Object.values(state.designs).forEach((design) => { if (design.collectionId) ref(state.history?.collections[design.collectionId] || state.studio?.collections[design.collectionId],design.id); if(design.bomId)ref(state.history?.boms[design.bomId]?.designId===design.id,design.id); });
  Object.values(state.finishedSKUs).forEach((sku) => { ref(state.designs[sku.designId]?.pieceCount === sku.pieceCount, sku.id); if (!state.history && !state.finishing?.skus[sku.id] && (sku.colorVariantId || !sku.catalogueOnly)) fail('Finished production requires validated history'); });
  Object.values(state.activityLogs).forEach((log) => { ref(state.employees[log.actorId], log.id); ref(Boolean(state.contractors[log.documentId]) || Object.values(state.processing ?? {}).some(rows => typeof rows === 'object' && log.documentId in rows) || documents.some((document) => document.id === log.documentId) || Boolean(state.suppliers[log.documentId] || state.fabrics[log.documentId] || state.locations[log.documentId] || state.reservations[log.documentId]) || Object.values(state.warehouse ?? {}).some((rows) => typeof rows === 'object' && log.documentId in rows) || Object.values(state.procurement?.requests ?? {}).some((r) => r.id === log.documentId) || Object.values(state.procurement?.bills ?? {}).some((r) => r.id === log.documentId) || Object.values(state.procurement?.payments ?? {}).some((r) => r.id === log.documentId) || Object.values(state.procurement?.returns ?? {}).some((r) => r.id === log.documentId), log.id); });
  inspectInventoryInvariants(state).forEach(fail);
  inspectHistory(state).forEach((issue) => fail(issue.recordId + ': ' + issue.message));
  inspectProcurement(state).forEach(fail);
  inspectWarehouse(state).forEach(fail);
  inspectProcessing(state).forEach(fail);
  inspectDesigns(state).forEach(fail);
  inspectProduction(state).forEach(fail);
  inspectFinishing(state).forEach(fail);
}

export const domainStateSchema: z.ZodType<DomainState> = rawStateSchema.superRefine((state, context) => {
  try { checkRelationships(state, context); }
  catch { context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid quantity or relationship in saved records' }); }
});
export type DomainValidationResult = { ok: true; state: DomainState } | { ok: false; error: DomainError };
export function validateDomainState(input: unknown): DomainValidationResult {
  try {
    const result = domainStateSchema.safeParse(input);
    return result.success ? { ok: true, state: result.data } : { ok: false, error: { code: 'INVALID_STATE', message: result.error.issues.slice(0, 4).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('؛ ') } };
  } catch {
    return { ok: false, error: { code: 'INVALID_STATE', message: 'محفوظ شدہ ریکارڈ کی مقدار یا متعلقہ تفصیلات درست نہیں ہیں۔' } };
  }
}
