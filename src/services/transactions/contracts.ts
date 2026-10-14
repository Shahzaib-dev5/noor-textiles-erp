import type { DomainState } from '@/domain/entities';
import type { DomainError, EntityID, Money, Quantity } from '@/types/common';

export interface TransactionContext { at: string; actorId: EntityID; origin?: 'SEED' | 'USER' }
export type TransactionResult = { ok: true; state: DomainState } | { ok: false; error: DomainError };
/** Future operations deliberately expose input contracts only: there is no callable success stub. */
export interface FutureTransactionCommands {
  recognizeProcessingLoss: { challanLineId: EntityID; quantityMeters: Quantity; reason: string; approvedById: EntityID };
  allocateProduction: { allocationId: EntityID; workOrderId: EntityID; lotId: EntityID; quantityMeters: Quantity };
  completeProduction: { packagingBatchId: EntityID; assemblyId: EntityID; inspectionId: EntityID; skuId: EntityID; suits: number };
  reserveFinishedSuits: { reservationId: EntityID; salesOrderLineId: EntityID; skuId: EntityID; suits: number };
  dispatchFinishedSuits: { dispatchChallanId: EntityID };
  allocateCustomerPayment: { paymentId: EntityID; invoiceId: EntityID; amountPaisa: Money };
  processSalesReturn: { returnId: EntityID; inspectionId: EntityID; disposition: 'SALEABLE' | 'INSPECTION_HOLD' | 'REJECTED' | 'DAMAGED' };
}
