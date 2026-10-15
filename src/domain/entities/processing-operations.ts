import { z } from 'zod';
import { procurementId as id, procurementDate as day, procurementMoney as money, procurementQuantity as qty } from './procurement';
import { PROCESSING_SERVICE } from '@/domain/enums';
const text=z.string().trim().min(1).max(500), notes=z.string().max(1000), positive=qty.refine(v=>v>0);
const meta=z.object({id,companyId:id,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:id,updatedBy:id,origin:z.literal('USER')});
const doc=meta.extend({number:text,date:day});
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
export const rateUnit=z.enum(['METER','YARD','KILOGRAM','PIECE','SUIT','PANEL','BATCH']);
export const chargeBasis=z.enum(['ISSUED','ACCEPTED','RETURNED','SERVICE_QUANTITY']);
export const allocation=z.object({lotId:id,rollId:id.optional(),locationId:id,quantityMeters:positive,reservationId:id.optional()}).strict();
export const rateFields={contractorId:id,service:z.enum(PROCESSING_SERVICE),unit:rateUnit,ratePaisa:money,basis:chargeBasis,minimumPaisa:money,additionalPaisa:money,effectiveOn:day,validUntil:day,status:z.enum(['ACTIVE','INACTIVE'])};
export const contractorFields={name:text,nameEnglish:notes,code:text,contact:text,phone:text,city:text,address:text,services:z.array(z.enum(PROCESSING_SERVICE)).min(1),termDays:z.number().int().min(0).max(365),notes,status:z.enum(['ACTIVE','INACTIVE'])};
export const jobFields={contractorId:id,service:z.enum(PROCESSING_SERVICE),rateId:id,inputs:z.array(allocation).min(1),expectedMeters:positive,expectedOn:day,colorId:id.optional(),designId:id.optional(),collectionId:id.optional(),technique:notes,artwork:notes,colorway:notes,notes,serviceQuantity:qty};
export const returnedPart=z.object({challanLineId:id,accepted:qty,held:qty,rejected:qty,loss:qty,lossReason:notes,defect:notes,colorId:id.optional(),batchId:id.optional()}).strict();
export const processingOperationsSchema=z.object({
 version:z.literal(6),companyId:id,
 contractors:map(meta.extend({contractorId:id,...contractorFields})),
 rates:map(meta.extend(rateFields)),
 jobs:map(doc.extend({...jobFields,status:z.enum(['DRAFT','APPROVED','PARTIALLY_ISSUED','ISSUED','IN_PROCESS','PARTIALLY_RECEIVED','COMPLETED','CLOSED','CANCELLED']),rateSnapshot:z.object(rateFields).strict()})),
 issues:map(doc.extend({challanId:id,jobId:id,transport:notes,expectedOn:day,reservationIds:z.array(id)})),
 receipts:map(doc.extend({receiptId:id,jobId:id,inspectorId:id,parts:z.array(returnedPart).min(1),notes,lossKind:z.enum(['SHRINKAGE','SHORTAGE','DAMAGE','DISPOSAL','CLAIM'])})),
 outputs:map(meta.extend({receiptId:id,receiptLineId:id,lotId:id,parentLotId:id,rootLotId:id,jobId:id,quantityMeters:positive,category:z.enum(['PROCESSED','INSPECTION_HOLD','REJECTED']),locationId:id,stage:z.enum(PROCESSING_SERVICE),colorId:id.optional(),designId:id.optional(),batchId:id.optional()})),
 colors:map(meta.extend({code:text,name:text,nameEnglish:notes,status:z.enum(['ACTIVE','INACTIVE'])})),
 batches:map(doc.extend({jobId:id,colorId:id,shade:text,targetMeters:positive,status:z.enum(['PENDING','APPROVED','REJECTED','REWORK']),approvedById:id.optional(),notes})),
 quality:map(doc.extend({outputId:id,inspectorId:id,fromLocationId:id,toLocationId:id,quantityMeters:positive,result:z.enum(['ACCEPTED','QUALITY_HOLD','REJECTED','REWORK_REQUIRED','DAMAGED']),defect:notes,notes})),
 bills:map(doc.extend({contractorId:id,jobId:id,chargeQuantity:positive,unit:rateUnit,ratePaisa:money,additionalPaisa:money,discountPaisa:money,creditPaisa:money,totalPaisa:money,dueOn:day,status:z.enum(['DRAFT','POSTED','CANCELLED']),references:z.array(id)})),
 payments:map(doc.extend({contractorId:id,amountPaisa:money.refine(v=>v>0),method:z.enum(['CASH','BANK','CHEQUE']),reference:notes,notes:notes.optional(),allocations:z.array(z.object({billId:id,amountPaisa:money.refine(v=>v>0)}).strict()),status:z.enum(['DRAFT','POSTED','CANCELLED'])})),
}).strict();
export type ProcessingOperations=z.infer<typeof processingOperationsSchema>;
export type OperationalJob=ProcessingOperations['jobs'][string];
export function emptyProcessing(companyId:string):ProcessingOperations{return{version:6,companyId,contractors:{},rates:{},jobs:{},issues:{},receipts:{},outputs:{},colors:{},batches:{},quality:{},bills:{},payments:{}};}
