/** Persisted IDs are stable strings. Money is an integer count of PKR paisa. */
export type EntityID = string;
export type CompanyID = EntityID;
export type FabricLotID = EntityID;
export type RollID = EntityID;
export type Quantity = number;
export type Money = number;
export type DateString = string;
export type DocumentNumber = string;
export type TransactionStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED' | 'REVERSED';
export type EntityStatus = TransactionStatus | 'ACTIVE' | 'INACTIVE';
export type InventoryLocationType = 'GREY' | 'PROCESSING_OUT' | 'PROCESSED' | 'PRODUCTION_WIP' | 'CUT_COMPONENT' | 'FINISHED_GOODS' | 'REJECTED' | 'DAMAGED';
export type FabricUnit = 'METER' | 'YARD' | 'ROLL' | 'THAAN' | 'PIECE' | 'SUIT' | 'CARTON';
export interface EntityMeta<S extends EntityStatus = EntityStatus> {
  id: EntityID;
  createdAt: DateString;
  updatedAt: DateString;
  createdBy: EntityID;
  updatedBy: EntityID;
  status: S;
  origin: 'SEED' | 'USER';
}
export interface DocumentMeta extends EntityMeta<TransactionStatus> { number: DocumentNumber }
export type EntityMap<T extends EntityMeta> = Record<EntityID, T>;
export interface DomainError { code: string; message: string }
export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };
