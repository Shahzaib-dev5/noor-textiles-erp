import type { DocumentMeta, EntityID, EntityMeta, FabricLotID, Money, Quantity } from '@/types/common';
import type { ProcessingServiceType } from '@/domain/enums';

export interface Contractor extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; city: string; phone: string; services: ProcessingServiceType[] }
export interface ContractorService extends EntityMeta<'ACTIVE' | 'INACTIVE'> { contractorId: EntityID; serviceType: ProcessingServiceType }
export interface ProcessingRate extends EntityMeta<'ACTIVE' | 'INACTIVE'> { contractorServiceId: EntityID; fabricId: EntityID; ratePaisaPerMeter: Money; effectiveFrom: string }
export interface ProcessingJob extends DocumentMeta { contractorId: EntityID; serviceType: ProcessingServiceType; challanIds: EntityID[] }
export interface ProcessingChallan extends DocumentMeta { contractorId: EntityID; fromLocationId: EntityID; contractorLocationId: EntityID; serviceType: ProcessingServiceType; lineIds: EntityID[]; jobId?: EntityID }
export interface ProcessingChallanLine extends EntityMeta<'ACTIVE'> { challanId: EntityID; lotId: FabricLotID; quantityMeters: Quantity }
export interface ProcessingReceipt extends DocumentMeta { challanId: EntityID; destinationLocationId: EntityID; lineIds: EntityID[] }
export interface ProcessingReceiptLine extends EntityMeta<'ACTIVE'> { processingReceiptId: EntityID; challanLineId: EntityID; outputMeters: Quantity; lossMeters: Quantity; lossReason: string; lossApprovedById?: EntityID }
export interface ProcessingLoss extends EntityMeta<'POSTED'> { receiptId: EntityID; receiptLineId: EntityID; challanId: EntityID; challanLineId: EntityID; lotId: FabricLotID; quantityMeters: Quantity; reason: string; approvedById: EntityID }
export interface ProcessingCharge extends EntityMeta<'ACTIVE' | 'POSTED'> { receiptId: EntityID; contractorId: EntityID; serviceType: ProcessingServiceType; quantityMeters: Quantity; unitRatePaisa: Money; totalPaisa: Money }
