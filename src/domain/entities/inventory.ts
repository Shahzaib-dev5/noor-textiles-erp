import type { DocumentMeta, EntityID, EntityMeta, FabricLotID, InventoryLocationType, Quantity, RollID } from '@/types/common';

export interface FabricLot extends EntityMeta<'ACTIVE' | 'INACTIVE'> { code: string; fabricId: EntityID; supplierId: EntityID; sourceGoodsReceiptLineId: EntityID }
export interface StockLocation extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; warehouseId?: EntityID; contractorId?: EntityID; category: InventoryLocationType }
export type MovementSourceType = 'GOODS_RECEIPT' | 'PROCESSING_ISSUE' | 'PROCESSING_RECEIPT' | 'PROCESSING_LOSS' | 'PURCHASE_RETURN';
export interface InventoryMovement extends EntityMeta<'POSTED'> {
  sourceType: MovementSourceType;
  sourceDocumentId: EntityID;
  sourceLineId: EntityID;
  lotId: FabricLotID;
  rollId?: RollID;
  locationId: EntityID;
  category: InventoryLocationType;
  quantityMeters: Quantity;
  occurredAt: string;
  contractorId?: EntityID;
}
/** Derived projection, never the authoritative mutable stock record. */
export interface InventoryBalance { lotId: FabricLotID; locationId: EntityID; category: InventoryLocationType; onHandMeters: Quantity; reservedMeters: Quantity; availableMeters: Quantity }
export interface InventoryReservation extends EntityMeta<'ACTIVE' | 'CANCELLED' | 'COMPLETED'> { lotId: FabricLotID; locationId: EntityID; category: InventoryLocationType; quantityMeters: Quantity; sourceDocumentId: EntityID }
export interface StockAdjustment extends DocumentMeta { lotId: FabricLotID; locationId: EntityID; category: InventoryLocationType; quantityMeters: Quantity; reason: string; approvedById: EntityID }
export interface StockTransfer extends DocumentMeta { lotId: FabricLotID; fromLocationId: EntityID; toLocationId: EntityID; category: InventoryLocationType; quantityMeters: Quantity }

/** Future count-ledger contracts are separate from the active fabric/meter movement ledger. */
export interface FinishedInventoryMovement extends EntityMeta<'POSTED'> {
  skuId: EntityID; packagingBatchId: EntityID; locationId: EntityID; category: 'FINISHED_GOODS' | 'REJECTED' | 'DAMAGED';
  quantitySuits: number; unit: 'SUIT'; sourceDocumentId: EntityID; sourceLineId: EntityID;
  sourceType: 'PACKAGING_COMPLETION' | 'DISPATCH' | 'SALES_RETURN' | 'REVERSAL'; occurredAt: string;
}
export interface CutComponentInventoryMovement extends EntityMeta<'POSTED'> {
  cuttingOutputId: EntityID; workOrderId: EntityID; locationId: EntityID; category: 'CUT_COMPONENT' | 'REJECTED' | 'DAMAGED';
  component: 'SHIRT' | 'TROUSER' | 'DUPATTA'; quantityPieces: number; unit: 'PIECE';
  sourceDocumentId: EntityID; sourceLineId: EntityID; sourceType: 'CUTTING_OUTPUT' | 'ASSEMBLY_CONSUMPTION' | 'REVERSAL'; occurredAt: string;
}
export interface FinishedInventoryBalance { skuId: EntityID; locationId: EntityID; onHandSuits: number; reservedSuits: number; availableSuits: number; unit: 'SUIT' }
export interface CutComponentInventoryBalance { cuttingOutputId: EntityID; locationId: EntityID; onHandPieces: number; reservedPieces: number; unit: 'PIECE' }
