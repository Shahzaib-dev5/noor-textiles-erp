import type { DocumentMeta, EntityID, EntityMeta, FabricLotID, Money, Quantity } from '@/types/common';
import type { SuitComponent } from '@/domain/enums';

export interface Season extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; year: number }
export interface Collection extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; seasonId: EntityID }
export interface Design extends EntityMeta<'DRAFT' | 'APPROVED' | 'INACTIVE'> { code: string; name: string; pieceCount: 2 | 3; imagePath: string; collectionId?: EntityID; bomId?: EntityID }
export interface DesignColorVariant extends EntityMeta<'ACTIVE' | 'INACTIVE'> { designId: EntityID; name: string; colorHex: string }
export interface DesignSample extends EntityMeta<'DRAFT' | 'APPROVED' | 'CANCELLED'> { designId: EntityID; lotId: FabricLotID; approvalNotes: string }
export interface BillOfMaterials extends EntityMeta<'DRAFT' | 'APPROVED' | 'INACTIVE'> { designId: EntityID; version: number; pieceCount: 2 | 3; lineIds: EntityID[] }
export interface BOMLine extends EntityMeta<'ACTIVE'> { bomId: EntityID; component: SuitComponent; fabricId: EntityID; widthInches: number; consumptionMetersPerSuit: Quantity; wastePercent: number }
export interface ProductionPlan extends DocumentMeta { designId: EntityID; plannedSuits: number; dueOn: string; workOrderIds: EntityID[] }
export interface ProductionWorkOrder extends DocumentMeta { productionPlanId: EntityID; bomId: EntityID; targetSuits: number; allocationIds: EntityID[] }
export interface MaterialAllocation extends DocumentMeta { workOrderId: EntityID; lotId: FabricLotID; component: SuitComponent; quantityMeters: Quantity; sourceLocationId: EntityID; wipLocationId: EntityID }
export interface CuttingOrder extends DocumentMeta { workOrderId: EntityID; allocationIds: EntityID[]; cutterId: EntityID }
export interface CuttingOutput extends EntityMeta<'DRAFT' | 'POSTED'> { cuttingOrderId: EntityID; component: SuitComponent; pieces: number; consumedMeters: Quantity; wasteMeters: Quantity }
export interface EmbroideryJob extends DocumentMeta { cuttingOutputId: EntityID; contractorId: EntityID; issuedPieces: number; receivedPieces: number; chargePaisa: Money }
export interface QualityInspection extends DocumentMeta { sourceType: 'CUTTING' | 'EMBROIDERY' | 'ASSEMBLY' | 'RETURN'; sourceId: EntityID; inspectedPieces: number; passedPieces: number; rejectedPieces: number; defectIds: EntityID[] }
export interface FabricQualityInspection extends DocumentMeta { lotId: FabricLotID; sourceReceiptId: EntityID; inspectedMeters: Quantity; acceptedMeters: Quantity; rejectedMeters: Quantity; notes: string }
export interface QualityDefect extends EntityMeta<'ACTIVE'> { inspectionId: EntityID; code: string; affectedPieces: number; disposition: 'REWORK' | 'REJECT' | 'DAMAGE' }
export interface SuitAssembly extends DocumentMeta { workOrderId: EntityID; skuId: EntityID; componentOutputIds: EntityID[]; assembledSuits: number; inspectionId: EntityID }
export interface PackagingBatch extends DocumentMeta { assemblyId: EntityID; inspectionId: EntityID; skuId: EntityID; packedSuits: number; suitsPerCarton: number; warehouseLocationId: EntityID }
export interface FinishedProductSKU extends EntityMeta<'ACTIVE' | 'INACTIVE'> { code: string; designId: EntityID; name: string; pieceCount: 2 | 3; unit: 'SUIT'; colorVariantId?: EntityID; catalogueOnly: boolean }
