import { z } from 'zod';
import { procurementId as id, procurementDate as day, procurementMoney as money, procurementQuantity as qty } from './procurement';
export const studioText=z.string().trim().min(1).max(500),studioNotes=z.string().max(1000);
export const seasonSchema=z.enum(['SPRING','SUMMER','FESTIVE','AUTUMN','WINTER','ALL_SEASON']);
export const designStatus=z.enum(['DRAFT','SAMPLE_REQUESTED','SAMPLE_IN_PROGRESS','UNDER_REVIEW','REVISION_REQUIRED','APPROVED','PRODUCTION_READY','INACTIVE','ARCHIVED']);
export const collectionFields={code:studioText,name:studioText,nameEnglish:studioNotes,season:seasonSchema,year:z.number().int().min(2000).max(9999),description:studioNotes,launchOn:day,status:z.enum(['DRAFT','PLANNING','ACTIVE','COMPLETED','ARCHIVED']),notes:studioNotes};
export const designFields={name:studioText,nameEnglish:studioNotes,collectionId:id,season:seasonSchema,pieceCount:z.union([z.literal(2),z.literal(3)]),fabricCategory:studioText,description:studioNotes,designerId:id,date:day,targetSuits:z.number().int().positive().max(1000000),targetPricePaisa:money,notes:studioNotes};
export const variantFields={code:studioText,name:studioText,nameEnglish:studioNotes,colorCode:studioText,colorHex:z.string().regex(/^#[0-9a-fA-F]{6}$/),colorId:id.optional(),shade:studioNotes,materialLotIds:z.array(id).max(30),notes:studioNotes};
export const componentSchema=z.enum(['SHIRT','SHIRT_FRONT','SHIRT_BACK','SLEEVES','TROUSER','DUPATTA','NECK_EMBROIDERY','FRONT_PANEL','BORDER','LACE','BUTTONS','LABEL','PACKAGING']);
export const costCategory=z.enum(['MATERIAL','PROCESSING','ACCESSORY','PRODUCTION','OVERHEAD']);
export const costSource=z.enum(['RECORDED_MATERIAL','CURRENT_RATE','CONTRACTOR_RATE','MANUAL']);
export const bomLineSchema=z.object({key:id,component:componentSchema,materialType:z.enum(['FABRIC','ACCESSORY']),fabricId:id.optional(),lotId:id.optional(),colorPolicy:z.enum(['MATCH_VARIANT','ANY']),quantity:qty.refine(v=>v>0),unit:z.enum(['METER','PIECE','SET']),wastePercent:z.number().min(0).max(100),ratePaisa:money.optional(),costSource:z.enum(['RECORDED_MATERIAL','CURRENT_RATE','MANUAL']),availabilityUntracked:z.boolean(),notes:studioNotes}).strict();
export const assumptionSchema=z.object({key:id,label:studioText,category:costCategory,amountPaisa:money.optional(),source:z.enum(['CURRENT_RATE','CONTRACTOR_RATE','MANUAL']),referenceId:id.optional(),notes:studioNotes}).strict();
export const reviewChecklist=z.object({color:z.enum(['PASS','REVISION','FAIL']),print:z.enum(['PASS','REVISION','FAIL']),fabric:z.enum(['PASS','REVISION','FAIL']),matching:z.enum(['PASS','REVISION','FAIL']),embroidery:z.enum(['PASS','REVISION','FAIL']),completeness:z.enum(['PASS','REVISION','FAIL']),market:z.enum(['PASS','REVISION','FAIL']),feasibility:z.enum(['PASS','REVISION','FAIL'])}).strict();
const meta=z.object({id,companyId:id,createdAt:z.string().datetime(),updatedAt:z.string().datetime(),createdBy:id,updatedBy:id,origin:z.literal('USER')});
const map=<T extends z.ZodRawShape>(s:z.ZodObject<T>)=>z.record(id,s.strict());
export const designOperationsSchema=z.object({version:z.literal(7),companyId:id,
 collections:map(meta.extend(collectionFields)),
 designs:map(meta.extend({...designFields,designId:id,status:designStatus,sourceDesignId:id.optional(),approvalId:id.optional(),unpricedAcknowledged:z.boolean()})),
 variants:map(meta.extend({...variantFields,designId:id,status:z.enum(['DRAFT','APPROVED','INACTIVE']),approvedBy:id.optional(),approvedAt:z.string().datetime().optional()})),
 boms:map(meta.extend({number:studioText,designId:id,variantId:id,version:z.number().int().positive(),effectiveOn:day,reason:studioText,previousId:id.optional(),status:z.enum(['DRAFT','SUBMITTED','APPROVED','SUPERSEDED']),lines:z.array(bomLineSchema).min(1).max(100),approvalId:id.optional()})),
 samples:map(meta.extend({number:studioText,designId:id,variantId:id,bomId:id,type:studioText,date:day,targetOn:day,requestedBy:id,notes:studioNotes,materialNotes:studioNotes,previewName:studioNotes,previewData:z.string().max(180000).refine(v=>v===''||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)),status:z.enum(['REQUESTED','IN_PROGRESS','SUBMITTED','UNDER_REVIEW','APPROVED','REVISION_REQUIRED','REJECTED','CANCELLED'])})),
 reviews:map(meta.extend({sampleId:id,result:z.enum(['PASS','REVISION','FAIL']),checklist:reviewChecklist,comments:studioNotes,role:z.enum(['owner','production'])})),
 costs:map(meta.extend({designId:id,variantId:id,bomId:id,assumptions:z.array(assumptionSchema).max(100),acknowledgeUnpriced:z.boolean(),notes:studioNotes})),
 approvals:map(meta.extend({documentId:id,kind:z.enum(['BOM','DESIGN']),role:z.enum(['owner','production']),snapshot:z.string().min(1).max(100000)})),
 events:map(meta.extend({documentId:id,action:studioText,detail:studioNotes,role:z.enum(['owner','purchase','warehouse','production','sales','accounts'])})),
}).strict();
export type DesignOperations=z.infer<typeof designOperationsSchema>;
export type StudioBOM=DesignOperations['boms'][string];
export type StudioVariant=DesignOperations['variants'][string];
export type StudioDesign=DesignOperations['designs'][string];
export type BOMLineInput=z.infer<typeof bomLineSchema>;
export function emptyStudio(companyId:string):DesignOperations{return{version:7,companyId,collections:{},designs:{},variants:{},boms:{},samples:{},reviews:{},costs:{},approvals:{},events:{}};}
