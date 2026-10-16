import { z } from 'zod';
import { procurementId as id,procurementDate as day,procurementMoney as money } from './procurement';
import { componentUnit } from './production-operations';
export const finishingText=z.string().trim().min(1).max(500),finishingNotes=z.string().max(1000);
export const count=z.number().int().nonnegative().safe(),positiveCount=count.refine(n=>n>0);
const text=finishingText,notes=finishingNotes,n=positiveCount;
export const finishingMeta=z.object({id,companyId:id,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:id,updatedBy:id,origin:z.literal('USER')});
const doc=finishingMeta.extend({number:text,date:day});
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
export const costSnapshot=z.object({recordedPaisa:money,estimatedPaisa:money,incomplete:z.boolean()}).strict();
export const assemblyRequirement=z.object({key:id,perSet:n,unit:componentUnit,embroideryRequired:z.boolean(),materialId:id.optional()}).strict();
export const componentPortion=z.object({componentLotId:id,quantity:n}).strict();
export const materialRequirement=z.object({materialId:id,perSet:n}).strict();
export const finishedPortion=z.object({lotId:id,quantity:n}).strict();
export const setQuality=z.enum(['QC_PENDING','ACCEPTED','HOLD','REJECTED','REWORK','PACKAGED']);
export const finishedQuality=z.enum(['ACCEPTED','HOLD','DAMAGED']);
export const stagedStatus=z.enum(['DRAFT','APPROVED','POSTED','CANCELLED']);
export const finishingSchema=z.object({version:z.literal(9),companyId:id,
 plans:map(doc.extend({orderId:id,collectionId:id,designId:id,variantId:id,bomId:id,bomSnapshot:z.string().min(1).max(200000),targetSets:n,startOn:day,finishOn:day,team:text,remarks:notes,requirements:z.array(assemblyRequirement).min(1).max(100),status:z.enum(['DRAFT','SUBMITTED','APPROVED','COMPONENTS_RESERVED','IN_PROGRESS','PARTIALLY_ASSEMBLED','COMPLETED','CANCELLED']),approvedById:id.optional()})),
 reservations:map(doc.extend({planId:id,componentLotId:id,quantity:n,consumed:count,released:count,sourceCustodyId:id,reworkId:id.optional(),status:z.enum(['ACTIVE','COMPLETED','RELEASED'])})),
 issues:map(doc.extend({planId:id,reservationId:id,quantity:n,status:stagedStatus,cost:costSnapshot,approvedById:id.optional()})),
 returns:map(doc.extend({planId:id,componentLotId:id,quantity:n,reason:text,cost:costSnapshot})),
 mismatches:map(doc.extend({planId:id,requirementKey:id,quantity:n,reason:text,correction:notes,status:z.enum(['OPEN','CORRECTED'])})),
 batches:map(doc.extend({planId:id,quantity:n,inputs:z.array(componentPortion.extend({cost:costSnapshot})).min(1),materials:z.array(z.object({materialId:id,quantity:n,unitCostPaisa:money,costPaisa:money}).strict()),cost:costSnapshot,status:stagedStatus,approvedById:id.optional()})),
 inspections:map(doc.extend({batchId:id,fromState:z.enum(['QC_PENDING','ACCEPTED','HOLD','REWORK']),quantity:n,accepted:count,held:count,rejected:count,rework:count,inspectorId:id,defect:notes,remarks:notes,reworkId:id.optional(),status:stagedStatus,approvedById:id.optional()})),
 reworks:map(doc.extend({batchId:id,quantity:n,team:text,defect:text,correction:text,dueOn:day,costPaisa:money,status:z.enum(['OPEN','IN_PROGRESS','AWAITING_INSPECTION','COMPLETED','CANCELLED'])})),
 replacements:map(doc.extend({reworkId:id,oldComponentLotId:id,newComponentLotId:id,quantity:n,disposition:z.enum(['RETURN','SCRAP']),reason:text,cost:costSnapshot,returnedCost:costSnapshot,approvedById:id})),
 setMovements:map(finishingMeta.extend({batchId:id,state:setQuality,quantity:z.number().int().safe().refine(n=>n!==0),sourceType:z.enum(['MATCHING','FINAL_QC','PACKAGING']),sourceDocumentId:id,occurredAt:z.string().datetime()})),
 materials:map(finishingMeta.extend({name:text,unit:z.enum(['PIECE','SET','ROLL','CARTON']),kind:z.enum(['ASSEMBLY','PACKAGING']),supplierId:id.optional(),reorderLevel:count,defaultCostPaisa:money,status:z.enum(['ACTIVE','INACTIVE'])})),
 materialReceipts:map(doc.extend({materialId:id,quantity:n,unitCostPaisa:money,kind:z.enum(['OPENING','RECEIPT']),reference:text,status:stagedStatus,approvedById:id.optional()})),
 materialAllocations:map(doc.extend({packagingId:id,materialId:id,quantity:n,consumed:count,released:count,status:z.enum(['ACTIVE','COMPLETED','RELEASED'])})),
 materialWaste:map(doc.extend({materialId:id,quantity:n,unitCostPaisa:money,costPaisa:money,reason:text,approvedById:id})),
 materialMovements:map(finishingMeta.extend({materialId:id,quantity:z.number().int().safe().refine(n=>n!==0),unitCostPaisa:money,costPaisa:money,sourceType:z.enum(['RECEIPT','MATCHING','PACKAGING','CARTON','WASTE']),sourceDocumentId:id,occurredAt:z.string().datetime()})),
 skus:map(finishingMeta.extend({skuId:id,collectionId:id,variantId:id,bomId:id,specification:z.string().min(1).max(200000),identityKey:z.string().min(1).max(200000),care:notes,reorderLevel:count,targetPricePaisa:money})),
 packaging:map(doc.extend({batchId:id,skuId:id,quantity:n,method:text,team:text,startOn:day,finishOn:day,requirements:z.array(materialRequirement).max(50),materialsAcknowledged:z.boolean(),laborPerSetPaisa:money,overheadPerSetPaisa:money,status:z.enum(['DRAFT','APPROVED','MATERIALS_ALLOCATED','IN_PROGRESS','PARTIALLY_PACKED','COMPLETED','CANCELLED']),approvedById:id.optional()})),
 completions:map(doc.extend({packagingId:id,quantity:n,locationId:id,materials:z.array(z.object({allocationId:id,materialId:id,quantity:n,unitCostPaisa:money,costPaisa:money}).strict()),cost:costSnapshot,inheritedCost:costSnapshot,status:stagedStatus,approvedById:id.optional(),lotId:id.optional()})),
 lots:map(finishingMeta.extend({number:text,completionId:id,packagingId:id,batchId:id,skuId:id,quantity:n,cost:costSnapshot,date:day})),
 receipts:map(doc.extend({completionId:id,lotId:id,quantity:n,locationId:id,status:z.literal('POSTED')})),
 locations:map(finishingMeta.extend({locationId:id,code:text,zone:notes,rack:notes,shelf:notes,bin:notes,area:z.enum(['STAGING','STORAGE','QUALITY']),capacity:count.optional(),status:z.enum(['ACTIVE','INACTIVE'])})),
 transfers:map(doc.extend({fromLocationId:id,toLocationId:id,lines:z.array(finishedPortion).min(1).max(100),quality:finishedQuality,cartonId:id.optional(),reason:text,status:stagedStatus,approvedById:id.optional()})),
 adjustments:map(doc.extend({lotId:id,locationId:id,quality:finishedQuality,systemQuantity:count,countedQuantity:count,delta:z.number().int().safe().refine(n=>n!==0),scopeKey:z.string().min(1).max(200000),provenance:text,reason:text,status:stagedStatus,approvedById:id.optional()})),
 quality:map(doc.extend({lotId:id,locationId:id,quantity:n,fromState:finishedQuality,toState:finishedQuality,reason:text,status:stagedStatus,approvedById:id.optional()})),
 finishedMovements:map(finishingMeta.extend({lotId:id,skuId:id,locationId:id,quality:finishedQuality,quantity:z.number().int().safe().refine(n=>n!==0),sourceType:z.enum(['RECEIPT','TRANSFER','ADJUSTMENT','QUALITY']),sourceDocumentId:id,occurredAt:z.string().datetime()})),
 cartons:map(doc.extend({identifier:text,locationId:id,lines:z.array(finishedPortion).min(1).max(100),allowMixed:z.boolean(),type:text,grossWeightKg:z.number().positive().optional(),materialId:id.optional(),materialUnitCostPaisa:money.optional(),materialCostPaisa:money.optional(),materialConsumed:z.boolean(),notes:notes,status:z.enum(['DRAFT','PACKED','UNPACKED','CANCELLED'])})),
 events:map(finishingMeta.extend({documentId:id,action:text,detail:notes,role:z.enum(['owner','purchase','warehouse','production','sales','accounts'])})),
}).strict();
export type FinishingState=z.infer<typeof finishingSchema>;
export type AssemblyPlan=FinishingState['plans'][string];
export function emptyFinishing(companyId:string):FinishingState{return{version:9,companyId,plans:{},reservations:{},issues:{},returns:{},mismatches:{},batches:{},inspections:{},reworks:{},replacements:{},setMovements:{},materials:{},materialReceipts:{},materialAllocations:{},materialWaste:{},materialMovements:{},skus:{},packaging:{},completions:{},lots:{},receipts:{},locations:{},transfers:{},adjustments:{},quality:{},finishedMovements:{},cartons:{},events:{}};}
