import type { FabricUnit, InventoryLocationType, TransactionStatus } from '@/types/common';

export const TRANSACTION_STATUS = {
  DRAFT: 'DRAFT', APPROVED: 'APPROVED', POSTED: 'POSTED', PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED', REVERSED: 'REVERSED',
} as const satisfies Record<TransactionStatus, TransactionStatus>;
export const INVENTORY_CATEGORY = {
  GREY: 'GREY', PROCESSING_OUT: 'PROCESSING_OUT', PROCESSED: 'PROCESSED', PRODUCTION_WIP: 'PRODUCTION_WIP',
  CUT_COMPONENT: 'CUT_COMPONENT', FINISHED_GOODS: 'FINISHED_GOODS', REJECTED: 'REJECTED', DAMAGED: 'DAMAGED',
} as const satisfies Record<InventoryLocationType, InventoryLocationType>;
export const FABRIC_UNIT = {
  METER: 'METER', YARD: 'YARD', ROLL: 'ROLL', THAAN: 'THAAN', PIECE: 'PIECE', SUIT: 'SUIT', CARTON: 'CARTON',
} as const satisfies Record<FabricUnit, FabricUnit>;
export const PROCESSING_SERVICE = ['BLEACHING', 'DYEING', 'DIGITAL_PRINTING', 'ROTARY_PRINTING', 'SCREEN_PRINTING', 'FINISHING'] as const;
export type ProcessingServiceType = typeof PROCESSING_SERVICE[number];
export type SuitComponent = 'SHIRT' | 'TROUSER' | 'DUPATTA';
export type ReturnDisposition = 'SALEABLE' | 'INSPECTION_HOLD' | 'REJECTED' | 'DAMAGED';
