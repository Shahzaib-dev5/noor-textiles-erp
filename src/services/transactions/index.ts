import { z } from 'zod';
import type { ActivityLog, DomainState, InventoryMovement } from '@/domain/entities';
import type { EntityMeta, TransactionStatus } from '@/types/common';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { validateDomainState } from '@/domain/validators/state';
import { getAvailableMeters } from '@/services/inventory';
import { movementEndpoints,hasKnownRollCustody } from '@/services/inventory/warehouse';
import type { TransactionContext, TransactionResult } from './contracts';

export type { TransactionContext, TransactionResult, FutureTransactionCommands } from './contracts';
const failure = (code: string, message: string): TransactionResult => ({ ok: false, error: { code, message } });
const issuedStatuses: TransactionStatus[] = ['POSTED', 'PARTIALLY_RECEIVED', 'COMPLETED'];

function prepare(state: DomainState, context: TransactionContext): TransactionResult {
  const validation = validateDomainState(state);
  if (!validation.ok) return validation;
  if (!z.string().datetime({ offset: true }).safeParse(context.at).success || state.employees[context.actorId]?.status !== 'ACTIVE') return failure('INVALID_CONTEXT', 'مجاز ڈیمو ملازم اور درست وقت ضروری ہیں۔');
  const lastPosting = Object.values(state.movements).reduce((maximum, movement) => Math.max(maximum, new Date(movement.occurredAt).valueOf()), 0);
  if (new Date(context.at).valueOf() < lastPosting) return failure('BACKDATED_TRANSACTION', 'لین دین کا وقت گزشتہ پوسٹنگ سے پہلے نہیں ہو سکتا۔');
  return { ok: true, state: validation.state };
}
function metadata<S extends EntityMeta['status']>(id: string, status: S, context: TransactionContext): EntityMeta<S> {
  return { id, status, createdAt: context.at, updatedAt: context.at, createdBy: context.actorId, updatedBy: context.actorId, origin: context.origin ?? 'USER' };
}
function changeStatus<T extends EntityMeta<TransactionStatus>>(document: T, status: T['status'], context: TransactionContext): T {
  return { ...document, status, updatedAt: context.at, updatedBy: context.actorId };
}
function addMovement(state: DomainState, suffix: string, effect: Omit<InventoryMovement, keyof EntityMeta | 'occurredAt'>, context: TransactionContext): void {
  const id = `movement:${effect.sourceType}:${effect.sourceDocumentId}:${effect.sourceLineId}:${suffix}`;
  state.movements[id] = { ...metadata(id, 'POSTED', context), ...effect, occurredAt: context.at };
  if(state.warehouse){const m=state.movements[id],endpoints=movementEndpoints(state,m);Object.assign(m,{companyId:state.warehouse.companyId,fabricId:state.lots[m.lotId].fabricId,fromLocationId:endpoints.from,toLocationId:endpoints.to,role:(context as TransactionContext & {role?:string}).role??'owner',reason:'اصل دستاویز سے مربوط اسٹاک کارروائی'});}
}
function addLog(state: DomainState, documentId: string, action: string, detail: string, context: TransactionContext): void {
  const id = `activity:${action}:${documentId}`;
  const log: ActivityLog = { ...metadata(id, 'ACTIVE', context), actorId: context.actorId, action, documentId, detail };
  state.activityLogs[id] = log;
}
function finish(state: DomainState): TransactionResult {
  const result = validateDomainState(state);
  return result.ok ? result : failure('INVARIANT_VIOLATION', result.error.message);
}

/** Posts all receipt lines and parent order status together, preserving the caller's state on any failure. */
function postGoodsReceiptOperation(input: DomainState, receiptId: string, context: TransactionContext): TransactionResult {
  const prepared = prepare(input, context); if (!prepared.ok) return prepared;
  const state = prepared.state;
  const receipt = state.goodsReceipts[receiptId];
  if (!receipt) return failure('NOT_FOUND', 'مال وصولی کی دستاویز نہیں ملی۔');
  if (receipt.status === 'POSTED') return failure('ALREADY_POSTED', 'یہ مال وصولی پہلے ہی پوسٹ ہو چکی ہے۔');
  if (receipt.status !== 'APPROVED') return failure('INVALID_STATUS', 'صرف منظور شدہ مال وصولی پوسٹ کی جا سکتی ہے۔');
  const order = state.purchaseOrders[receipt.purchaseOrderId];
  if (!['APPROVED', 'PARTIALLY_RECEIVED'].includes(order.status)) return failure('INVALID_STATUS', 'خریداری آرڈر وصولی کے لیے کھلا نہیں ہے۔');
  if (state.suppliers[order.supplierId].status !== 'ACTIVE' || state.locations[receipt.warehouseLocationId].status !== 'ACTIVE') return failure('INACTIVE_ENTITY', 'سپلائر اور گودام فعال ہونا ضروری ہیں۔');
  const proposedByOrderLine = new Map<string, number>();
  for (const lineId of receipt.lineIds) {
    const line = state.goodsReceiptLines[lineId];
    const lot = state.lots[line.lotId];
    if (lot.status !== 'ACTIVE' || state.fabrics[lot.fabricId].status !== 'ACTIVE') return failure('INACTIVE_ENTITY', 'کپڑا اور لاٹ فعال ہونا ضروری ہیں۔');
    proposedByOrderLine.set(line.purchaseOrderLineId, roundQuantity((proposedByOrderLine.get(line.purchaseOrderLineId) ?? 0) + line.quantityMeters));
  }
  for (const [lineId, proposed] of proposedByOrderLine) {
    const received = Object.values(state.goodsReceiptLines).filter((line) => line.purchaseOrderLineId === lineId && state.goodsReceipts[line.goodsReceiptId].status === 'POSTED').reduce((sum, line) => sum + line.quantityMeters, 0);
    if (roundQuantity(received + proposed) > state.purchaseOrderLines[lineId].quantityMeters) return failure('OVER_RECEIPT', 'وصول شدہ مقدار خریداری آرڈر سے زیادہ نہیں ہو سکتی۔');
  }
  for (const lineId of receipt.lineIds) {
    const line = state.goodsReceiptLines[lineId];
    addMovement(state, 'grey-in', { sourceType: 'GOODS_RECEIPT', sourceDocumentId: receipt.id, sourceLineId: line.id, lotId: line.lotId, locationId: receipt.warehouseLocationId, category: 'GREY', quantityMeters: line.quantityMeters }, context);
  }
  state.goodsReceipts[receipt.id] = changeStatus(receipt, 'POSTED', context);
  const complete = order.lineIds.every((lineId) => roundQuantity(Object.values(state.goodsReceiptLines).filter((line) => line.purchaseOrderLineId === lineId && state.goodsReceipts[line.goodsReceiptId].status === 'POSTED').reduce((sum, line) => sum + line.quantityMeters, 0)) === state.purchaseOrderLines[lineId].quantityMeters);
  state.purchaseOrders[order.id] = changeStatus(order, complete ? 'COMPLETED' : 'PARTIALLY_RECEIVED', context);
  addLog(state, receipt.id, 'POST_GOODS_RECEIPT', 'خرید شدہ کپڑا کورا گودام میں وصول کیا گیا۔', context);
  return finish(state);
}

/** Paired debit/credit movements transfer owned fabric to contractor custody without manufacturing suits. */
function issueProcessingOperation(input: DomainState, challanId: string, context: TransactionContext): TransactionResult {
  const prepared = prepare(input, context); if (!prepared.ok) return prepared;
  const state = prepared.state;
  const challan = state.challans[challanId];
  if (!challan) return failure('NOT_FOUND', 'پروسیسنگ چالان نہیں ملا۔');
  if (issuedStatuses.includes(challan.status)) return failure('ALREADY_POSTED', 'اس چالان کا کپڑا پہلے ہی جاری ہو چکا ہے۔');
  if (challan.status !== 'APPROVED') return failure('INVALID_STATUS', 'صرف منظور شدہ چالان جاری کیا جا سکتا ہے۔');
  if (state.contractors[challan.contractorId].status !== 'ACTIVE' || state.locations[challan.fromLocationId].status !== 'ACTIVE' || state.locations[challan.contractorLocationId].status !== 'ACTIVE') return failure('INACTIVE_ENTITY', 'ٹھیکیدار اور متعلقہ مقامات فعال ہونا ضروری ہیں۔');
  const proposedByLot = new Map<string, number>();
  for (const lineId of challan.lineIds) {
    const line = state.challanLines[lineId];
    if(state.warehouse&&hasKnownRollCustody(state,line.lotId)&&!line.rollId)return failure('ROLL_REQUIRED','معلوم تحویل والی لاٹ سے مخصوص تھان کا اجرا ضروری ہے۔');
    if (state.lots[line.lotId].status !== 'ACTIVE') return failure('INACTIVE_ENTITY', 'لاٹ فعال ہونا ضروری ہے۔');
    proposedByLot.set(line.lotId, roundQuantity((proposedByLot.get(line.lotId) ?? 0) + line.quantityMeters));
  }
  for (const [lotId, quantity] of proposedByLot) if (quantity > getAvailableMeters(state, lotId, challan.fromLocationId, 'GREY')) return failure('INSUFFICIENT_STOCK', 'جاری کرنے کے لیے کورے کپڑے کا دستیاب اسٹاک ناکافی ہے۔');
  for (const lineId of challan.lineIds) {
    const line = state.challanLines[lineId];
    const effect = { sourceType: 'PROCESSING_ISSUE' as const, sourceDocumentId: challan.id, sourceLineId: line.id, lotId: line.lotId, contractorId: challan.contractorId, ...(line.rollId ? { rollId:line.rollId } : {}) };
    addMovement(state, 'grey-out', { ...effect, locationId: challan.fromLocationId, category: 'GREY', quantityMeters: -line.quantityMeters }, context);
    addMovement(state, 'contractor-in', { ...effect, locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: line.quantityMeters }, context);
  }
  state.challans[challan.id] = changeStatus(challan, 'POSTED', context);
  addLog(state, challan.id, 'ISSUE_PROCESSING', 'کورا کپڑا پروسیسنگ کے لیے ٹھیکیدار کے حوالے کیا گیا۔', context);
  return finish(state);
}

/** Output and approved loss settle custody separately; any remaining fabric stays explicitly with the contractor. */
function receiveProcessingOperation(input: DomainState, receiptId: string, context: TransactionContext): TransactionResult {
  const prepared = prepare(input, context); if (!prepared.ok) return prepared;
  const state = prepared.state;
  const receipt = state.processingReceipts[receiptId];
  if (!receipt) return failure('NOT_FOUND', 'پروسیسنگ وصولی نہیں ملی۔');
  if (receipt.status === 'POSTED') return failure('ALREADY_POSTED', 'یہ پروسیسنگ وصولی پہلے ہی پوسٹ ہو چکی ہے۔');
  if (receipt.status !== 'APPROVED') return failure('INVALID_STATUS', 'صرف منظور شدہ پروسیسنگ وصولی پوسٹ کی جا سکتی ہے۔');
  const challan = state.challans[receipt.challanId];
  if (!['POSTED', 'PARTIALLY_RECEIVED'].includes(challan.status)) return failure('INVALID_STATUS', 'چالان کی حالت مزید وصولی کی اجازت نہیں دیتی۔');
  if (state.locations[receipt.destinationLocationId].status !== 'ACTIVE' || state.locations[challan.contractorLocationId].status !== 'ACTIVE' || state.contractors[challan.contractorId].status !== 'ACTIVE') return failure('INACTIVE_ENTITY', 'ٹھیکیدار اور وصولی کے مقامات فعال ہونا ضروری ہیں۔');
  const proposedByChallanLine = new Map<string, number>();
  const proposedByLot = new Map<string, number>();
  for (const lineId of receipt.lineIds) {
    const line = state.processingReceiptLines[lineId];
    const issuedLine = state.challanLines[line.challanLineId];
    if (line.lossMeters > 0 && (!line.lossApprovedById || state.employees[line.lossApprovedById]?.status !== 'ACTIVE' || !line.lossReason.trim())) return failure('LOSS_APPROVAL_REQUIRED', 'نقصان کی وجہ اور فعال منظور کنندہ ضروری ہیں۔');
    const settled = roundQuantity(line.outputMeters + line.lossMeters);
    proposedByChallanLine.set(line.challanLineId, roundQuantity((proposedByChallanLine.get(line.challanLineId) ?? 0) + settled));
    proposedByLot.set(issuedLine.lotId, roundQuantity((proposedByLot.get(issuedLine.lotId) ?? 0) + settled));
  }
  for (const [lineId, proposed] of proposedByChallanLine) {
    const previous = Object.values(state.processingReceiptLines).filter((line) => line.challanLineId === lineId && state.processingReceipts[line.processingReceiptId].status === 'POSTED').reduce((sum, line) => sum + line.outputMeters + line.lossMeters, 0);
    if (roundQuantity(previous + proposed) > state.challanLines[lineId].quantityMeters) return failure('OVER_RECEIPT', 'وصولی اور نقصان کا مجموعہ چالان کی باقی مقدار سے زیادہ ہے۔');
  }
  for (const [lotId, proposed] of proposedByLot) if (proposed > getAvailableMeters(state, lotId, challan.contractorLocationId, 'PROCESSING_OUT')) return failure('INSUFFICIENT_STOCK', 'ٹھیکیدار کے پاس متعلقہ کپڑا ناکافی ہے۔');
  for (const lineId of receipt.lineIds) {
    const line = state.processingReceiptLines[lineId];
    const issuedLine = state.challanLines[line.challanLineId];
    const effect = { sourceDocumentId: receipt.id, sourceLineId: line.id, lotId: issuedLine.lotId, contractorId: challan.contractorId, ...(issuedLine.rollId ? {rollId:issuedLine.rollId} : {}) };
    if (line.outputMeters > 0) {
      addMovement(state, 'contractor-out', { ...effect, sourceType: 'PROCESSING_RECEIPT', locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: -line.outputMeters }, context);
      addMovement(state, 'processed-in', { ...effect, sourceType: 'PROCESSING_RECEIPT', locationId: receipt.destinationLocationId, category: 'PROCESSED', quantityMeters: line.outputMeters }, context);
    }
    if (line.lossMeters > 0 && line.lossApprovedById) {
      addMovement(state, 'explicit-loss', { ...effect, sourceType: 'PROCESSING_LOSS', locationId: challan.contractorLocationId, category: 'PROCESSING_OUT', quantityMeters: -line.lossMeters }, context);
      const id = `loss:${receipt.id}:${line.id}`;
      state.processingLosses[id] = { ...metadata(id, 'POSTED', context), receiptId: receipt.id, receiptLineId: line.id, challanId: challan.id, challanLineId: issuedLine.id, lotId: issuedLine.lotId, quantityMeters: line.lossMeters, reason: line.lossReason, approvedById: line.lossApprovedById };
    }
  }
  state.processingReceipts[receipt.id] = changeStatus(receipt, 'POSTED', context);
  const totalIssued = roundQuantity(challan.lineIds.reduce((sum, lineId) => sum + state.challanLines[lineId].quantityMeters, 0));
  const totalSettled = roundQuantity(Object.values(state.processingReceiptLines).filter((line) => state.challanLines[line.challanLineId].challanId === challan.id && state.processingReceipts[line.processingReceiptId].status === 'POSTED').reduce((sum, line) => sum + line.outputMeters + line.lossMeters, 0));
  state.challans[challan.id] = changeStatus(challan, totalIssued === totalSettled ? 'COMPLETED' : 'PARTIALLY_RECEIVED', context);
  addLog(state, receipt.id, 'RECEIVE_PROCESSING', 'پروسیس شدہ کپڑا وصول ہوا اور منظور شدہ نقصان الگ درج کیا گیا۔', context);
  return finish(state);
}

/** Overflow or malformed runtime input also preserves the original snapshot and returns a failure. */
function transactionBoundary(operation: () => TransactionResult): TransactionResult {
  try { return operation(); }
  catch { return failure('TRANSACTION_REJECTED', 'لین دین کی مقدار یا متعلقہ معلومات محفوظ حدود کے اندر درست نہیں ہیں۔'); }
}
export function postGoodsReceipt(state: DomainState, receiptId: string, context: TransactionContext): TransactionResult {
  return transactionBoundary(() => postGoodsReceiptOperation(state, receiptId, context));
}
export function issueProcessing(state: DomainState, challanId: string, context: TransactionContext): TransactionResult {
  return transactionBoundary(() => issueProcessingOperation(state, challanId, context));
}
export function receiveProcessing(state: DomainState, receiptId: string, context: TransactionContext): TransactionResult {
  return transactionBoundary(() => receiveProcessingOperation(state, receiptId, context));
}
