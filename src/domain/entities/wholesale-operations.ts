import { z } from 'zod';
import { procurementId as id, procurementDate as day, procurementMoney as money } from './procurement';
import { finishingMeta, count, positiveCount as qty, finishingText as text, finishingNotes as notes } from './finishing';
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
const doc=finishingMeta.extend({number:text,date:day});
export const basisPoints=z.number().int().min(0).max(10000);
export const paymentTerms=z.enum(['CREDIT','COD','ADVANCE']);
export const customerGroupKind=z.enum(['WHOLESALER','DISTRIBUTOR','RETAILER','RESELLER','AGENT','INSTITUTION']);
export const priceTier=z.object({from:qty,to:qty.optional(),unitPricePaisa:money.refine(n=>n>0),discountBps:basisPoints}).strict();
export const commercialInput=z.object({skuId:id,quantity:qty,priceListId:id.optional(),manualUnitPricePaisa:money.refine(n=>n>0).optional(),manualPriceReason:notes,discountKind:z.enum(['NONE','CUSTOMER','PROMOTION','MANUAL']),discountBps:basisPoints,fixedDiscountPaisa:money,discountReference:notes}).strict();
export const commercialLine=commercialInput.omit({manualUnitPricePaisa:true}).extend({id,unitPricePaisa:money.refine(n=>n>0),priceSnapshot:z.string().min(1).max(20000),basePaisa:money,tierDiscountPaisa:money,commercialDiscountPaisa:money,documentDiscountPaisa:money,chargePaisa:money,netPaisa:money}).strict();
export const commercialFields={customerId:id,warehouseId:id,salespersonId:id,requiredOn:day,paymentTerms,termDays:count,deliveryAddress:text,deliveryTerms:notes,transportPreference:notes,remarks:notes,documentDiscountBps:basisPoints,documentDiscountPaisa:money,chargesPaisa:money,lines:z.array(commercialLine).min(1).max(100),subtotalPaisa:money,discountPaisa:money,totalPaisa:money};
export const orderStatus=z.enum(['DRAFT','SUBMITTED','APPROVED','PARTIALLY_RESERVED','RESERVED','PARTIALLY_PICKED','PICKED','PARTIALLY_DISPATCHED','DISPATCHED','CLOSED','CANCELLED']);
export const dispatchStatus=z.enum(['DRAFT','READY','APPROVED','DISPATCHED','IN_TRANSIT','PARTIALLY_DELIVERED','DELIVERED','EXCEPTION','RETURNED_TO_SENDER','CANCELLED']);
export const pickPortion=z.object({reservationId:id,quantity:qty}).strict();
export const dispatchPortion=z.object({pickingId:id,reservationId:id,quantity:qty,netPaisa:money}).strict();
export const wholesaleSchema=z.object({version:z.literal(10),companyId:id,
 groups:map(finishingMeta.extend({code:text,name:text,nameEnglish:notes,kind:customerGroupKind,paymentTerms,termDays:count,discountBps:basisPoints,creditLimitPaisa:money,status:z.enum(['ACTIVE','INACTIVE'])})),
 customers:map(finishingMeta.extend({customerId:id,code:text,nameEnglish:notes,owner:text,alternatePhone:notes,email:z.union([z.literal(''),z.string().email().max(254)]),market:notes,address:text,groupId:id.optional(),paymentTerms,termDays:count,creditLimitPaisa:money,discountBps:basisPoints,creditHold:z.boolean(),creditNotes:notes,notes,status:z.enum(['ACTIVE','INACTIVE'])})),
 prices:map(doc.extend({name:text,scope:z.enum(['SKU','DESIGN','COLLECTION']),targetId:id,groupId:id.optional(),currency:z.literal('PKR'),validFrom:day,validUntil:day,tiers:z.array(priceTier).min(1).max(50),status:z.enum(['DRAFT','ACTIVE','INACTIVE'])})),
 quotations:map(doc.extend({...commercialFields,validUntil:day,status:z.enum(['DRAFT','SUBMITTED','APPROVED','PRESENTED','ACCEPTED','REJECTED','EXPIRED','CONVERTED','CANCELLED']),approvedById:id.optional(),orderId:id.optional(),approvedSnapshot:z.string().max(200000).optional()})),
 orders:map(doc.extend({...commercialFields,quotationId:id.optional(),quotationSnapshot:z.string().max(200000).optional(),replacesId:id.optional(),status:orderStatus,allowPartial:z.boolean(),approvedById:id.optional(),approvedSnapshot:z.string().max(200000).optional(),overrideId:id.optional()})),
 overrides:map(doc.extend({orderId:id,scope:z.enum(['ORDER','DISPATCH']),allowedExposurePaisa:money,expiresOn:day,reason:text,paymentEvidence:notes,approvedById:id,status:z.literal('APPROVED')})),
 reservations:map(doc.extend({orderId:id,lineId:id,skuId:id,lotId:id,locationId:id,quantity:qty,consumed:count,released:count,cartonId:id.optional(),status:z.enum(['ACTIVE','COMPLETED','RELEASED'])})),
 reservationReleases:map(doc.extend({reservationId:id,quantity:qty,reason:text})),
 picks:map(doc.extend({orderId:id,assignedToId:id,dueOn:day,lines:z.array(pickPortion).min(1).max(100),shortageNotes:notes,status:z.enum(['DRAFT','ASSIGNED','IN_PROGRESS','PARTIALLY_PICKED','PICKED','CANCELLED'])})),
 pickConfirmations:map(doc.extend({pickingId:id,reference:text,lines:z.array(pickPortion).min(1).max(100),status:z.literal('POSTED')})),
 cancellations:map(doc.extend({orderId:id,lineId:id,quantity:qty,reason:text,approvedById:id})),
 transports:map(finishingMeta.extend({code:text,name:text,contact:notes,vehicle:notes,notes,status:z.enum(['ACTIVE','INACTIVE'])})),
 dispatches:map(doc.extend({orderId:id,customerId:id,warehouseId:id,lines:z.array(dispatchPortion).min(1).max(100),transportId:id,vehicle:notes,driverReference:notes,consignment:text,expectedOn:day,address:text,transportChargePaisa:money,remarks:notes,status:dispatchStatus,approvedById:id.optional(),overrideId:id.optional(),approvedSnapshot:z.string().max(200000).optional(),postingIndex:qty.optional(),postedAt:z.string().datetime().optional(),invoiceReadyId:id.optional(),totalPaisa:money})),
 deliveries:map(doc.extend({dispatchId:id,sequence:qty,state:z.enum(['IN_TRANSIT','PARTIALLY_DELIVERED','DELIVERED','EXCEPTION','RETURNED_TO_SENDER']),received:count,shortage:count,damaged:count,receiver:notes,proof:notes,reason:notes})),
 events:map(finishingMeta.extend({documentId:id,action:text,detail:notes,role:z.enum(['owner','purchase','warehouse','production','sales','accounts'])})),
}).strict();
export type WholesaleState=z.infer<typeof wholesaleSchema>;
export type CommercialInput=z.infer<typeof commercialInput>;
export type CommercialLine=z.infer<typeof commercialLine>;
export type SalesOrder=WholesaleState['orders'][string];
export type SalesDispatch=WholesaleState['dispatches'][string];
export const emptyWholesale=(companyId:string):WholesaleState=>({version:10,companyId,groups:{},customers:{},prices:{},quotations:{},orders:{},overrides:{},reservations:{},reservationReleases:{},picks:{},pickConfirmations:{},cancellations:{},transports:{},dispatches:{},deliveries:{},events:{}});
