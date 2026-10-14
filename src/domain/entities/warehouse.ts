import { z } from 'zod';
import { procurementId as id, procurementDate as day, procurementQuantity as qty } from './procurement';
export const warehouseCategory = z.enum(['GREY','INSPECTION_HOLD','QUARANTINED','REJECTED','DAMAGED']);
export type WarehouseCategory = z.infer<typeof warehouseCategory>;
export const qualityCategory=z.enum(['INSPECTION_HOLD','QUARANTINED','REJECTED','DAMAGED']);
export const warehouseText = z.string().max(500).refine((v)=>Boolean(v.trim()));
export const warehouseQuantity = qty.refine((v)=>v>0);
const notes=z.string().max(1000);
const meta=z.object({id,companyId:id,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:id,updatedBy:id,origin:z.literal('USER')});
const doc=meta.extend({number:warehouseText,date:day,reason:warehouseText});
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
export const portionInput=z.object({lotId:id,rollId:id.optional(),quantityMeters:warehouseQuantity}).strict();
export const warehouseSchema=z.object({
 version:z.literal(5),companyId:id,
 locationProfiles:map(meta.extend({status:z.literal('ACTIVE'),locationId:id,code:warehouseText,warehouseCode:warehouseText,zone:notes,rack:notes,shelf:notes,bin:notes,area:z.enum(['STAGING','STORAGE','QUALITY']),capacityMeters:warehouseQuantity.optional(),fabricIds:z.array(id)})),
 transfers:map(doc.extend({status:z.enum(['DRAFT','SUBMITTED','APPROVED','POSTED','CANCELLED']),kind:z.enum(['TRANSFER','PUTAWAY']),fromLocationId:id,toLocationId:id,lines:z.array(portionInput).min(1),approvedById:id.optional()})),
 reservationProfiles:map(doc.extend({status:z.enum(['ACTIVE','PARTIALLY_CONSUMED','CONSUMED','RELEASED','CANCELLED']),reservationId:id,rollId:id.optional(),originalMeters:warehouseQuantity,releasedMeters:qty,consumedMeters:qty,purpose:warehouseText,reference:notes,expiresOn:day.optional(),consumedChallanIds:z.array(id)})),
 stocktakes:map(doc.extend({status:z.enum(['DRAFT','IN_PROGRESS','SUBMITTED','REVIEWED','APPROVED','POSTED','CANCELLED']),locationId:id,fabricId:id.optional(),snapshotKey:warehouseText,lineIds:z.array(id).min(1),reviewedById:id.optional(),approvedById:id.optional(),adjustmentIds:z.array(id)})),
 stocktakeLines:map(meta.extend({status:z.literal('ACTIVE'),stocktakeId:id,lotId:id,rollId:id.optional(),systemMeters:qty,countedMeters:qty.optional(),notes})),
 adjustments:map(doc.extend({status:z.enum(['DRAFT','APPROVED','POSTED','CANCELLED']),lotId:id,rollId:id.optional(),locationId:id,quantityMeters:z.number().refine((v)=>v!==0&&Math.abs(v)<=Number.MAX_SAFE_INTEGER/10000&&qty.safeParse(Math.abs(v)).success),systemMeters:qty,provenance:warehouseText,approvedById:id.optional(),stocktakeId:id.optional(),qualityHoldId:id.optional()})),
 qualityHolds:map(doc.extend({status:z.enum(['ACTIVE','RELEASED']),lotId:id,rollId:id.optional(),fromLocationId:id,toLocationId:id,quantityMeters:warehouseQuantity,category:qualityCategory,releasedAt:z.string().datetime().optional(),releasedMeters:qty.optional()})),
 audits:map(meta.extend({status:z.literal('ACTIVE'),actorId:id,role:z.enum(['owner','purchase','warehouse','production','sales','accounts']),documentId:id,action:warehouseText,previousStatus:notes,newStatus:warehouseText,reason:warehouseText})),
}).strict();
export type WarehouseState=z.infer<typeof warehouseSchema>;
export function emptyWarehouse(companyId:string):WarehouseState{return{version:5,companyId,locationProfiles:{},transfers:{},reservationProfiles:{},stocktakes:{},stocktakeLines:{},adjustments:{},qualityHolds:{},audits:{}};}
