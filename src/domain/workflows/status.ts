import type { TransactionStatus } from '@/types/common';

export type WorkflowKind = 'RECEIPT' | 'PURCHASE_ORDER' | 'PROCESSING_CHALLAN';
const transitions: Record<WorkflowKind, Partial<Record<TransactionStatus, readonly TransactionStatus[]>>> = {
  RECEIPT: { DRAFT: ['APPROVED', 'CANCELLED'], APPROVED: ['POSTED', 'CANCELLED'], POSTED: ['REVERSED'] },
  PURCHASE_ORDER: { DRAFT: ['APPROVED', 'CANCELLED'], APPROVED: ['PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'], PARTIALLY_RECEIVED: ['PARTIALLY_RECEIVED', 'COMPLETED'] },
  PROCESSING_CHALLAN: { DRAFT: ['APPROVED', 'CANCELLED'], APPROVED: ['POSTED', 'CANCELLED'], POSTED: ['PARTIALLY_RECEIVED', 'COMPLETED'], PARTIALLY_RECEIVED: ['PARTIALLY_RECEIVED', 'COMPLETED'] },
};
export function canTransition(kind: WorkflowKind, from: TransactionStatus, to: TransactionStatus): boolean {
  return transitions[kind][from]?.includes(to) ?? false;
}
export function assertTransition(kind: WorkflowKind, from: TransactionStatus, to: TransactionStatus): void {
  if (!canTransition(kind, from, to)) throw new Error(`Invalid ${kind} transition: ${from} → ${to}`);
}
