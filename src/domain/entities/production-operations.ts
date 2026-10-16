import { z } from 'zod';
import { procurementId as id,procurementDate as day,procurementQuantity as qty,procurementMoney as money } from './procurement';
import { bomLineSchema } from './design-operations';
export const productionText=z.string().trim().min(1).max(500),productionNotes=z.string().max(1000);
const text=productionText,notes=productionNotes,positive=qty.refine(v=>v>0),count=z.number().int().nonnegative().safe(),positiveCount=count.refine(v=>v>0);
export const componentUnit=z.enum(['PIECE','PANEL','SET']);
export const componentState=z.enum(['QC_PENDING','EMBROIDERY_OUT','QC_HOLD','REWORK','ACCEPTED','REJECTED','SCRAP','ASSEMBLY_CONSUMED']);
export const productionStatus=z.enum(['DRAFT','APPROVED','PARTIALLY_RESERVED','MATERIAL_RESERVED','MATERIALS_ISSUED','CUTTING','EMBROIDERY','QUALITY_CONTROL','COMPONENTS_READY','CLOSED','CANCELLED']);
const meta=z.object({id,companyId:id,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:id,updatedBy:id,origin:z.literal('USER')});
const doc=meta.extend({number:text,date:day});
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
export const planFields={collectionId:id,designId:id,variantId:id,bomId:id,targetSuits:positiveCount,startOn:day,finishOn:day,priority:z.enum(['LOW','NORMAL','HIGH','URGENT']),managerId:id,remarks:notes};
export const sourcePortion=z.object({bomLineKey:id,lotId:id,rollId:id.optional(),locationId:id,quantityMeters:positive}).strict();
export const embroideryInput=z.object({componentLotId:id,quantity:positiveCount,fromState:z.enum(['QC_PENDING','ACCEPTED'])}).strict();
export const receiptPart=z.object({componentLotId:id,accepted:count,held:count,rejected:count,loss:count,reason:notes}).strict();
export const productionOperationsSchema=z.object({version:z.literal(8),companyId:id,
 plans:map(doc.extend({...planFields,estimatedCostPaisa:money,estimateIncomplete:z.boolean(),status:z.enum(['DRAFT','SUBMITTED','APPROVED','CONVERTED','REJECTED','CANCELLED']),approvedById:id.optional(),orderId:id.optional(),bomSnapshot:z.string().min(1).max(200000)})),
 orders:map(doc.extend({...planFields,planId:id,status:productionStatus,bomSnapshot:z.string().min(1).max(200000),lines:z.array(bomLineSchema.extend({widthInches:z.number().positive().optional(),composition:notes})).min(1),estimatedCostPaisa:money,estimateIncomplete:z.boolean(),untrackedAcknowledged:z.boolean(),approvedById:id.optional()})),
 allowances:map(doc.extend({orderId:id,bomLineKey:id,extraMeters:qty,extraComponents:count,reason:text,approvedById:id})),
 issues:map(doc.extend({orderId:id,reservationProfileId:id,bomLineKey:id,lotId:id,rollId:id.optional(),fromLocationId:id,wipLocationId:id,quantityMeters:positive,receiverId:id,section:text,remarks:notes,unitCostPaisa:money.optional(),costSource:z.enum(['RECORDED_MATERIAL','CURRENT_RATE','UNPRICED']),status:z.enum(['DRAFT','POSTED','CANCELLED'])})),
 returns:map(doc.extend({orderId:id,issueId:id,quantityMeters:positive,reason:text})),
 cuttings:map(doc.extend({orderId:id,issueId:id,bomLineKey:id,inputMeters:positive,usableMeters:qty,leftoverMeters:qty,scrapMeters:qty,remainingMeters:qty,outputQuantity:count,unit:componentUnit,method:text,operatorId:id,startOn:day,finishOn:day,reason:notes,approvedById:id.optional(),status:z.enum(['DRAFT','IN_PROGRESS','POSTED','CANCELLED'])})),
 componentLots:map(meta.extend({orderId:id,designId:id,variantId:id,bomId:id,bomLineKey:id,component:text,sourceLotId:id,sourceRollId:id.optional(),issueId:id,cuttingId:id,quantity:positiveCount,unit:componentUnit,consumedMeters:positive})),
 componentMovements:map(meta.extend({status:z.literal('POSTED'),sourceType:z.enum(['CUTTING','EMBROIDERY_ISSUE','EMBROIDERY_RECEIPT','INSPECTION','DISPOSAL','ASSEMBLY_ISSUE','ASSEMBLY_RETURN','MATCHING','ASSEMBLY_REPLACEMENT']),sourceDocumentId:id,componentLotId:id,orderId:id,quantity:z.number().int().safe().refine(v=>v!==0),unit:componentUnit,state:componentState,custodyId:id,occurredAt:z.string().datetime()})),
 embroidery:map(doc.extend({orderId:id,contractorId:id,service:text,pattern:text,expectedOn:day,lines:z.array(embroideryInput).min(1).max(100),unit:componentUnit,rateUnit:z.enum(['PIECE','PANEL','SET','SUIT','METER','DESIGN','BATCH']),ratePaisa:money,serviceQuantity:positive,rateBasis:notes,additionalPaisa:money,discountPaisa:money,status:z.enum(['DRAFT','ISSUED','PARTIALLY_RECEIVED','COMPLETED','CANCELLED'])})),
 embroideryReceipts:map(doc.extend({jobId:id,inspectorId:id,parts:z.array(receiptPart).min(1).max(100),approvedById:id.optional(),status:z.enum(['DRAFT','POSTED','CANCELLED']),remarks:notes})),
 inspections:map(doc.extend({orderId:id,componentLotId:id,stage:z.enum(['CUTTING','EMBROIDERY','PREPARATION','PRE_ASSEMBLY']),fromState:z.enum(['QC_PENDING','ACCEPTED','QC_HOLD','REWORK']),inspectorId:id,quantity:positiveCount,accepted:count,held:count,rejected:count,rework:count,defect:notes,remarks:notes,reworkId:id.optional(),status:z.enum(['DRAFT','POSTED','CANCELLED'])})),
 reworks:map(doc.extend({orderId:id,componentLotId:id,quantity:positiveCount,team:text,contractorId:id.optional(),defect:text,correction:text,dueOn:day,costPaisa:money,status:z.enum(['OPEN','IN_PROGRESS','AWAITING_INSPECTION','COMPLETED','CANCELLED'])})),
 disposals:map(doc.extend({orderId:id,componentLotId:id,fromState:z.enum(['REJECTED','QC_HOLD','REWORK']),quantity:positiveCount,reason:text,approvedById:id})),
 expenses:map(doc.extend({orderId:id,category:z.enum(['CUTTING','TRANSPORT','REWORK','OVERHEAD','OTHER']),amountPaisa:money.refine(v=>v>0),reference:text,reason:text,approvedById:id,reworkId:id.optional()})),
 events:map(meta.extend({documentId:id,action:text,detail:notes,role:z.enum(['owner','purchase','warehouse','production','sales','accounts'])})),
}).strict();
export type ProductionOperations=z.infer<typeof productionOperationsSchema>;
export type ProductionOrder=ProductionOperations['orders'][string];
export type ComponentMovement=ProductionOperations['componentMovements'][string];
export function emptyProduction(companyId:string):ProductionOperations{return{version:8,companyId,plans:{},orders:{},allowances:{},issues:{},returns:{},cuttings:{},componentLots:{},componentMovements:{},embroidery:{},embroideryReceipts:{},inspections:{},reworks:{},disposals:{},expenses:{},events:{}};}
