import { productionReservationErrors } from '@/services/production/materials';
import { z } from 'zod';
import type { DomainState, InventoryMovement } from '@/domain/entities';
import { emptyWarehouse, warehouseCategory, qualityCategory, warehouseText as text, warehouseQuantity as positive, portionInput } from '@/domain/entities/warehouse';
import { procurementId as id, procurementDate as day, procurementQuantity as qty } from '@/domain/entities/procurement';
import { validateDomainState } from '@/domain/validators/state';
import { getInventoryBalances } from '@/services/inventory';
import { rollBalances, hasKnownRollCustody, locationProfile, stockScopeKey, warehouseSum, greyCategories, warehouseMovementEffects,qualityRemainingMeters } from '@/services/inventory/warehouse';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { issueProcessing } from './index';
import type { TransactionResult } from './contracts';
import type { ProcurementContext } from './procurement';
import { nextDocumentNumber } from '@/services/document-numbering';
const notes=z.string().max(1000), signed=z.number().refine((v)=>v!==0&&qty.safeParse(Math.abs(v)).success);
export const warehouseCommandSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('createStandardLayout'),warehouseId:id}).strict(),
 z.object({kind:z.literal('saveLocation'),id:id.optional(),name:text,code:text,warehouseCode:text,warehouseId:id,category:warehouseCategory,zone:notes,rack:notes,shelf:notes,bin:notes,area:z.enum(['STAGING','STORAGE','QUALITY']),capacityMeters:positive.optional(),fabricIds:z.array(id),status:z.enum(['ACTIVE','INACTIVE'])}).strict(),
 z.object({kind:z.literal('deactivateLocation'),id}).strict(),
 z.object({kind:z.literal('saveTransfer'),id:id.optional(),transferKind:z.enum(['TRANSFER','PUTAWAY']),date:day,fromLocationId:id,toLocationId:id,reason:text,lines:z.array(portionInput).min(1).max(100)}).strict(),
 z.object({kind:z.literal('transferAction'),id,action:z.enum(['SUBMIT','APPROVE','POST','CANCEL'])}).strict(),
 z.object({kind:z.literal('createReservation'),lotId:id,rollId:id.optional(),locationId:id,quantityMeters:positive,workOrderId:id.optional(),bomLineKey:id.optional(),date:day,purpose:text,reference:notes,expiresOn:day.optional(),reason:text}).strict(),
 z.object({kind:z.literal('reservationAction'),id,action:z.enum(['RELEASE','CANCEL','CONSUME']),quantityMeters:positive.optional(),challanId:id.optional()}).strict(),
 z.object({kind:z.literal('createStocktake'),date:day,locationId:id,fabricId:id.optional(),lotId:id.optional(),rollId:id.optional(),reason:text}).strict(),
 z.object({kind:z.literal('recordCounts'),id,lines:z.array(z.object({lineId:id,countedMeters:qty,notes}).strict()).min(1)}).strict(),
 z.object({kind:z.literal('stocktakeAction'),id,action:z.enum(['START','SUBMIT','REVIEW','APPROVE','POST','CANCEL'])}).strict(),
 z.object({kind:z.literal('createAdjustment'),date:day,lotId:id,rollId:id.optional(),locationId:id,quantityMeters:signed,reason:text,provenance:text,qualityHoldId:id.optional()}).strict(),
 z.object({kind:z.literal('adjustmentAction'),id,action:z.enum(['APPROVE','POST','CANCEL'])}).strict(),
 z.object({kind:z.literal('placeQualityHold'),date:day,lotId:id,rollId:id.optional(),fromLocationId:id,quantityMeters:positive,category:qualityCategory,reason:text}).strict(),
 z.object({kind:z.literal('releaseQualityHold'),id}).strict(),
 z.object({kind:z.literal('issueExistingChallan'),id,rollId:id.optional()}).strict(),
]);
export type WarehouseCommand=z.infer<typeof warehouseCommandSchema>;
export const canWarehouse=(role:ProcurementContext['role'],kind:WarehouseCommand['kind'],action?:string)=>role==='owner'||role==='warehouse'&&!['APPROVE','REVIEW'].includes(action??'')&&!['createAdjustment','deactivateLocation'].includes(kind)||role==='purchase'&&kind==='createReservation';
function operation(input:DomainState,raw:WarehouseCommand,ctx:ProcurementContext):TransactionResult{
 const valid=validateDomainState(input);if(!valid.ok)return valid;const parsed=warehouseCommandSchema.safeParse(raw);if(!parsed.success)return{ok:false,error:{code:'WAREHOUSE_INPUT',message:'لازمی معلومات، درست تاریخ اور چار اعشاری میٹر درج کریں۔'}};
 let data=valid.state;const c=parsed.data;
 const rule:(yes:unknown,message:string)=>asserts yes=(yes,message)=>{if(!yes)throw new Error(message);};
 rule(z.string().datetime().safeParse(ctx.at).success&&data.employees[ctx.actorId]?.status==='ACTIVE','فعال ملازم اور درست وقت ضروری ہیں۔');
 rule(canWarehouse(ctx.role,c.kind,'action'in c?c.action:undefined)||ctx.role==='production'&&(c.kind==='createReservation'&&Boolean(c.workOrderId)||c.kind==='reservationAction'&&c.action!=='CONSUME'&&Boolean(data.warehouse?.reservationProfiles[c.id]?.workOrderId)),'منتخب ڈیمو کردار اس کارروائی کا مجاز نہیں۔');
 rule(ctx.at>=Object.values(data.movements).reduce((max,m)=>m.occurredAt>max?m.occurredAt:max,''),'کارروائی کا وقت سابقہ پوسٹنگ سے پہلے نہیں ہو سکتا۔');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi'}).format(new Date(ctx.at));if('date'in c)rule(c.date<=today,'تاریخ موجودہ دن کے بعد نہیں ہو سکتی۔');
 data.warehouse??=emptyWarehouse(Object.keys(data.companies)[0]);let w=data.warehouse;
 const meta=<S extends string>(id:string,status:S)=>({id,status,companyId:w.companyId,origin:'USER' as const,createdAt:ctx.at,updatedAt:ctx.at,createdBy:ctx.actorId,updatedBy:ctx.actorId});
 const base=<S extends 'ACTIVE'|'INACTIVE'|'POSTED'|'COMPLETED'|'CANCELLED'>(id:string,status:S)=>{const{companyId:_,...r}=meta(id,status);void _;return r;};
 const touch=(r:{updatedAt:string;updatedBy:string})=>{r.updatedAt=ctx.at;r.updatedBy=ctx.actorId;};
 const next=(prefix:Parameters<typeof nextDocumentNumber>[0],date=today)=>{const numbers=Object.values(w).flatMap((rows)=>typeof rows==='object'?Object.values(rows).map((r)=>'number'in r?String(r.number):''):[]);return nextDocumentNumber(prefix,Number(date.slice(0,4)),numbers);};
 const occupied=(locationId:string)=>warehouseSum(getInventoryBalances(data).filter((b)=>b.locationId===locationId),(b)=>b.onHandMeters);
 const location=(id:string)=>{const l=data.locations[id];rule(l?.status==='ACTIVE'&&l.warehouseId&&greyCategories.includes(l.category),'فعال کورا گودام مقام منتخب کریں۔');return l;};
 const portion=(lotId:string,rollId:string|undefined,locationId:string,quantity:number,eligible=true)=>{
  const l=location(locationId);rule(data.lots[lotId]?.status==='ACTIVE','فعال لاٹ منتخب کریں۔');
  if('date'in c)rule(c.date>=data.goodsReceipts[data.goodsReceiptLines[data.lots[lotId].sourceGoodsReceiptLineId].goodsReceiptId].receivedOn,'گودام دستاویز کی تاریخ اصل وصولی سے پہلے نہیں ہو سکتی۔');
  rule(rollId||!hasKnownRollCustody(data,lotId),'معلوم تحویل والی لاٹ کے لیے مخصوص تھان / حصہ منتخب کریں۔');
  const b=getInventoryBalances(data).find((b)=>b.lotId===lotId&&b.locationId===locationId&&b.category===l.category);
  rule(quantity<=(eligible?b?.availableMeters??0:b?.onHandMeters??0),'مقام پر دستیاب مقدار ناکافی ہے؛ رزرو اور معیار کی جانچ کریں۔');
  if(rollId){rule(data.rolls[rollId]?.lotId===lotId&&hasKnownRollCustody(data,lotId),'رول کی درست شناخت / تحویل معلوم نہیں؛ مجموعی لاٹ استعمال کریں۔');const r=rollBalances(data).find((r)=>r.rollId===rollId&&r.locationId===locationId&&r.category===l.category);rule(quantity<=(eligible?r?.available??0:r?.physical??0),'اس مقام پر رول کی مقدار ناکافی ہے۔');}
 };
 const destination=(id:string,lotId:string,quantity:number)=>{const l=location(id),p=locationProfile(data,id);rule(!p.fabricIds.length||p.fabricIds.includes(data.lots[lotId].fabricId),'منزل اس کپڑے کے لیے موزوں نہیں۔');rule(p.capacityMeters===undefined||roundQuantity(occupied(id)+quantity)<=p.capacityMeters,'منزل کی گنجائش ناکافی ہے۔');return l;};
 const commitEffects=(docId:string,reason:string,stage='post')=>{for(const [index,e]of warehouseMovementEffects(data).filter((e)=>e.sourceDocumentId===docId).entries()){
  const mid='movement:warehouse:'+docId+':'+stage+':'+index;if(data.movements[mid])continue;
  if(stage==='release'&&!e.sourceLineId.endsWith(':release')||stage==='hold'&&!e.sourceLineId.endsWith(':hold'))continue;
  const from=e.quantityMeters<0?e.locationId:warehouseMovementEffects(data).find((a)=>a.sourceLineId===e.sourceLineId&&a.quantityMeters<0)?.locationId;
  const to=e.quantityMeters>0?e.locationId:warehouseMovementEffects(data).find((a)=>a.sourceLineId===e.sourceLineId&&a.quantityMeters>0)?.locationId;
  data.movements[mid]={...base(mid,'POSTED'),...e,occurredAt:ctx.at,companyId:w.companyId,fabricId:data.lots[e.lotId].fabricId,role:ctx.role,reason,...(from?{fromLocationId:from}:{}),...(to?{toLocationId:to}:{})} as InventoryMovement;
 }};
 let docId='',old='',status='',reason='گودام کی کارروائی محفوظ ہوئی۔';
 switch(c.kind){
 case 'createStandardLayout':{
  rule(data.warehouses[c.warehouseId]?.status==='ACTIVE','فعال گودام منتخب کریں۔');
  rule(['A','B','C','D','E'].some((zone)=>!data.locations['location:layout:'+c.warehouseId+':'+zone]),'نمونہ ترتیب پہلے سے موجود ہے۔');
  const templates=[['A','کاٹن / لان','STORAGE','GREY'],['B','کیمبرک','STORAGE','GREY'],['C','کھدر','STORAGE','GREY'],['D','وصولی / معائنہ','STAGING','GREY'],['E','قرنطینہ','QUALITY','QUARANTINED']]as const;
  for(const [zone,name,area,category]of templates){const code='MAIN-'+zone+'1-S1-B1',id='location:layout:'+c.warehouseId+':'+zone;if(data.locations[id])continue;rule(!Object.values(w.locationProfiles).some((p)=>p.code===code&&data.locations[p.locationId].warehouseId===c.warehouseId),'ترتیب کا مقام کوڈ پہلے سے موجود ہے۔');data.locations[id]={...base(id,'ACTIVE'),warehouseId:c.warehouseId,name:'زون '+zone+' — '+name,category};const pid='warehouse-location:'+id;w.locationProfiles[pid]={...meta(pid,'ACTIVE'),locationId:id,code,warehouseCode:'MAIN',zone,rack:zone+'1',shelf:'S1',bin:'B1',area,fabricIds:[]};}
  docId='location:layout:'+c.warehouseId+':A';status='ACTIVE';reason='گودام کے پانچ نمونہ مقامات بنائے گئے؛ کوئی اسٹاک نہیں بڑھا۔';break;
 }
 case 'saveLocation':{
  const existing=c.id?data.locations[c.id]:undefined;rule(!c.id||existing,'مقام نہیں ملا۔');rule(data.warehouses[c.warehouseId]?.status==='ACTIVE','فعال گودام منتخب کریں۔');
  rule(!Object.values(w.locationProfiles).some((p)=>p.locationId!==c.id&&data.locations[p.locationId].warehouseId===c.warehouseId&&p.code.toUpperCase()===c.code.trim().toUpperCase()),'مقام کوڈ پہلے سے موجود ہے۔');
  const id=c.id??'location:user:'+c.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'-');rule(c.id||!data.locations[id],'مقام کی شناخت پہلے سے موجود ہے۔');
  if(existing&&occupied(id)>0)rule(existing.category===c.category&&existing.warehouseId===c.warehouseId&&c.status==='ACTIVE','اسٹاک والے مقام کا گودام، کیٹیگری یا فعالیت تبدیل نہیں ہو سکتی۔');
  if(existing&&Object.values(data.movements).some((m)=>m.locationId===id))rule(existing.category===c.category&&existing.warehouseId===c.warehouseId,'تاریخی حرکت والے مقام کا گودام اور کیٹیگری محفوظ رہتے ہیں۔');
  if(c.status==='INACTIVE')rule(ctx.role==='owner','مقام غیر فعال کرنے کے لیے مالک کا ڈیمو کردار منتخب کریں۔');
  data.locations[id]={...(existing??base(id,c.status)),name:c.name,warehouseId:c.warehouseId,category:c.category,status:c.status};touch(data.locations[id]);
  const pid='warehouse-location:'+id;w.locationProfiles[pid]={...(w.locationProfiles[pid]??meta(pid,'ACTIVE')),locationId:id,code:c.code.trim(),warehouseCode:c.warehouseCode,zone:c.zone,rack:c.rack,shelf:c.shelf,bin:c.bin,area:c.area,fabricIds:c.fabricIds,...(c.capacityMeters?{capacityMeters:c.capacityMeters}:{})};if(!c.capacityMeters)delete w.locationProfiles[pid].capacityMeters;touch(w.locationProfiles[pid]);
  docId=id;old=existing?.status??'';status=c.status;break;
 }
 case 'deactivateLocation':{const l=location(c.id);rule(occupied(c.id)===0&&!Object.values(data.reservations).some((r)=>r.locationId===c.id&&r.status==='ACTIVE'),'اسٹاک / رزرو والا مقام غیر فعال نہیں ہو سکتا۔');old=l.status;l.status='INACTIVE';touch(l);docId=l.id;status=l.status;break;}
 case 'saveTransfer':{
  const from=location(c.fromLocationId),to=location(c.toLocationId);rule(from.id!==to.id&&from.category==='GREY'&&to.category==='GREY','اندرونی منتقلی کے لیے الگ قابلِ استعمال کورا مقامات منتخب کریں؛ ہولڈ پہلے حل کریں۔');
  if(c.transferKind==='PUTAWAY')rule(locationProfile(data,from.id).area==='STAGING'&&locationProfile(data,to.id).area==='STORAGE'&&from.category==='GREY','پٹ اوے کے لیے وصولی اسٹیجنگ اور ذخیرہ مقام منتخب کریں۔');
  for(const l of c.lines)portion(l.lotId,l.rollId,from.id,l.quantityMeters,from.category==='GREY');
  const existing=c.id?w.transfers[c.id]:undefined;rule(!c.id||existing?.status==='DRAFT','صرف مسودہ ٹرانسفر تبدیل ہو سکتا ہے۔');const num=existing?.number??next(c.transferKind==='PUTAWAY'?'PUT':'TRF',c.date),id=c.id??'warehouse-transfer:'+num;
  w.transfers[id]={...(existing??meta(id,'DRAFT')),number:num,date:c.date,reason:c.reason,kind:c.transferKind,fromLocationId:from.id,toLocationId:to.id,lines:c.lines};touch(w.transfers[id]);docId=id;old=existing?.status??'';status='DRAFT';reason=c.reason;break;
 }
 case 'transferAction':{
  const t=w.transfers[c.id];rule(t,'ٹرانسفر نہیں ملا۔');old=t.status;
  if(c.action==='SUBMIT'){rule(t.status==='DRAFT','صرف مسودہ جمع ہو سکتا ہے۔');t.status='SUBMITTED';}
  if(c.action==='APPROVE'){rule(t.status==='SUBMITTED','صرف جمع شدہ ٹرانسفر منظور ہو سکتا ہے۔');t.status='APPROVED';t.approvedById=ctx.actorId;}
  if(c.action==='CANCEL'){rule(t.status!=='POSTED'&&t.status!=='CANCELLED','پوسٹ شدہ / منسوخ ٹرانسفر تبدیل نہیں ہو سکتا۔');t.status='CANCELLED';}
  if(c.action==='POST'){
   rule(t.status==='APPROVED','صرف منظور شدہ ٹرانسفر پوسٹ ہوتا ہے۔');const source=location(t.fromLocationId);location(t.toLocationId);
   const lots=new Map<string,number>(),rolls=new Map<string,number>();for(const l of t.lines){lots.set(l.lotId,roundQuantity((lots.get(l.lotId)??0)+l.quantityMeters));if(l.rollId)rolls.set(l.rollId,roundQuantity((rolls.get(l.rollId)??0)+l.quantityMeters));}
   for(const [lot,total]of lots){const b=getInventoryBalances(data).find((b)=>b.lotId===lot&&b.locationId===t.fromLocationId&&b.category===source.category);rule(total<=(source.category==='GREY'?b?.availableMeters??0:b?.onHandMeters??0),'منتقلی کی مجموعی لاٹ مقدار ناکافی ہے۔');}for(const [roll,total]of rolls)portion(data.rolls[roll].lotId,roll,t.fromLocationId,total,source.category==='GREY');
   rule(source.category===data.locations[t.toLocationId].category,'کیٹیگری میں تبدیلی صرف معیار کی کارروائی سے ہو سکتی ہے۔');
   for(const l of t.lines)destination(t.toLocationId,l.lotId,warehouseSum(t.lines,(r)=>r.quantityMeters));t.status='POSTED';commitEffects(t.id,t.reason);
  }touch(t);docId=t.id;status=t.status;reason=t.reason;break;
 }
 case 'createReservation':{
  if(c.workOrderId){rule(c.bomLineKey,'پیداواری BOM لائن ضروری ہے۔');const errors=productionReservationErrors(data,{...c,workOrderId:c.workOrderId,bomLineKey:c.bomLineKey});rule(!errors.length,errors.join(' '));}else{rule(!c.bomLineKey,'ورک آرڈر ضروری ہے۔');rule(location(c.locationId).category==='GREY','بغیر پیداواری حوالے کے صرف گرے کپڑا رزرو ہوتا ہے۔');portion(c.lotId,c.rollId,c.locationId,c.quantityMeters);}rule(!c.expiresOn||c.expiresOn>=c.date,'اختتام کی تاریخ درست کریں۔');const num=next('RSV',c.date),pid='warehouse-reservation:'+num,rid='reservation:'+num;
  data.reservations[rid]={...base(rid,'ACTIVE'),lotId:c.lotId,locationId:c.locationId,category:c.workOrderId?'PROCESSED':'GREY',quantityMeters:c.quantityMeters,sourceDocumentId:pid};
  w.reservationProfiles[pid]={...meta(pid,'ACTIVE'),reservationId:rid,number:num,date:c.date,reason:c.reason,originalMeters:c.quantityMeters,releasedMeters:0,consumedMeters:0,purpose:c.purpose,reference:c.reference,consumedChallanIds:[],...(c.workOrderId?{workOrderId:c.workOrderId,bomLineKey:c.bomLineKey,consumedIssueIds:[]}:{}),...(c.rollId?{rollId:c.rollId}:{}),...(c.expiresOn?{expiresOn:c.expiresOn}:{})};docId=pid;status='ACTIVE';reason=c.reason;break;
 }
 case 'reservationAction':{
  const p=w.reservationProfiles[c.id],r=p&&data.reservations[p.reservationId];rule(p&&r?.status==='ACTIVE','فعال رزرو منتخب کریں۔');old=p.status;const amount=c.quantityMeters??r.quantityMeters;rule(amount<=r.quantityMeters,'رزرو سے زیادہ رہائی / استعمال نہیں ہو سکتا۔');
  if(c.action==='CONSUME'){
   rule(!p.workOrderId,'پیداواری رزرو صرف مربوط مواد اجرا سے استعمال ہوتا ہے۔');
   const challan=c.challanId?data.challans[c.challanId]:undefined;rule(challan?.status==='APPROVED'&&challan.lineIds.length===1&&challan.fromLocationId===r.locationId,'ایک منظور شدہ اسی مقام کا چالان ضروری ہے۔');const line=data.challanLines[challan.lineIds[0]];rule(line.lotId===r.lotId&&line.quantityMeters===amount,'چالان کی لاٹ اور اجرا مقدار رزرو سے ملنی چاہیے۔');
   if(p.rollId)line.rollId=p.rollId;
   // Temporarily release the owned portion for the existing issue reducer; the final commit records consumption.
   const left=roundQuantity(r.quantityMeters-amount);p.releasedMeters=roundQuantity(p.releasedMeters+amount);r.quantityMeters=left||p.originalMeters;r.status=left?'ACTIVE':'COMPLETED';p.status=left?(p.consumedMeters?'PARTIALLY_CONSUMED':'ACTIVE'):'RELEASED';touch(r);touch(p);
   const issued=issueProcessing(data,challan.id,ctx);rule(issued.ok,issued.ok?'':issued.error.message);data=issued.state;w=data.warehouse!;
   const consumed=w.reservationProfiles[p.id];consumed.releasedMeters=roundQuantity(consumed.releasedMeters-amount);consumed.consumedMeters=roundQuantity(consumed.consumedMeters+amount);consumed.consumedChallanIds.push(challan.id);consumed.status=left?'PARTIALLY_CONSUMED':'CONSUMED';touch(consumed);
  }else{const released=c.action==='CANCEL'?r.quantityMeters:amount;p.releasedMeters=roundQuantity(p.releasedMeters+released);const left=roundQuantity(r.quantityMeters-released);r.quantityMeters=left||p.originalMeters;r.status=left?'ACTIVE':c.action==='CANCEL'?'CANCELLED':'COMPLETED';p.status=left?(p.consumedMeters?'PARTIALLY_CONSUMED':'ACTIVE'):c.action==='CANCEL'?'CANCELLED':'RELEASED';touch(p);touch(r);}
  docId=p.id;status=w.reservationProfiles[p.id].status;reason=p.reason;break;
 }
 case 'createStocktake':{
  const l=location(c.locationId),num=next('STK',c.date),id='warehouse-stocktake:'+num;
  const balances=getInventoryBalances(data).filter((b)=>b.locationId===l.id&&b.onHandMeters>0&&(!c.fabricId||data.lots[b.lotId].fabricId===c.fabricId)&&(!c.lotId||b.lotId===c.lotId));
  const rows=balances.flatMap((b)=>hasKnownRollCustody(data,b.lotId)?rollBalances(data).filter((r)=>r.locationId===l.id&&r.lotId===b.lotId&&r.physical>0&&(!c.rollId||r.rollId===c.rollId)).map((r)=>({lotId:r.lotId,rollId:r.rollId,systemMeters:r.physical})):c.rollId?[]:[{lotId:b.lotId,systemMeters:b.onHandMeters}]);rule(rows.length,'اس مقام پر قابلِ گنتی اسٹاک نہیں ملا۔');
  const lineIds=rows.map((row,i)=>{const lid=id+':'+i;w.stocktakeLines[lid]={...meta(lid,'ACTIVE'),stocktakeId:id,...row,notes:''};return lid;});
  w.stocktakes[id]={...meta(id,'DRAFT'),number:num,date:c.date,reason:c.reason,locationId:l.id,...(c.fabricId?{fabricId:c.fabricId}:{}),snapshotKey:stockScopeKey(data,l.id,c.fabricId),lineIds,adjustmentIds:[]};docId=id;status='DRAFT';reason=c.reason;break;
 }
 case 'recordCounts':{const s=w.stocktakes[c.id];rule(s&&['DRAFT','IN_PROGRESS'].includes(s.status),'گنتی صرف مسودہ / جاری حالت میں درج ہو سکتی ہے۔');old=s.status;rule(new Set(c.lines.map((l)=>l.lineId)).size===c.lines.length,'گنتی کی لائن دہرائی گئی۔');for(const row of c.lines){rule(s.lineIds.includes(row.lineId),'گنتی کی لائن متعلقہ نہیں۔');const l=w.stocktakeLines[row.lineId];l.countedMeters=row.countedMeters;l.notes=row.notes;touch(l);}s.status='IN_PROGRESS';touch(s);docId=s.id;status=s.status;reason=s.reason;break;}
 case 'stocktakeAction':{
  const s=w.stocktakes[c.id];rule(s,'گنتی نہیں ملی۔');old=s.status;
  const transitions={START:['DRAFT','IN_PROGRESS'],SUBMIT:['IN_PROGRESS','SUBMITTED'],REVIEW:['SUBMITTED','REVIEWED'],APPROVE:['REVIEWED','APPROVED']}as const;
  if(c.action==='CANCEL'){rule(!['POSTED','CANCELLED'].includes(s.status),'پوسٹ شدہ گنتی منسوخ نہیں ہو سکتی۔');s.status='CANCELLED';}
  else if(c.action==='POST'){
   rule(s.status==='APPROVED','صرف منظور شدہ گنتی پوسٹ ہوتی ہے۔');rule(s.snapshotKey===stockScopeKey(data,s.locationId,s.fabricId),'اسٹاک / رزرو گنتی کے بعد بدل چکا ہے؛ نئی گنتی کریں۔');
   for(const lid of s.lineIds){const line=w.stocktakeLines[lid];rule(line.countedMeters!==undefined,'تمام پیمائشیں درج کریں۔');const variance=roundQuantity(line.countedMeters-line.systemMeters);if(!variance)continue; if(variance<0)portion(line.lotId,line.rollId,s.locationId,-variance,data.locations[s.locationId].category==='GREY');
    const holds=Object.values(w.qualityHolds).filter((h)=>h.status==='ACTIVE'&&h.toLocationId===s.locationId&&h.lotId===line.lotId&&h.rollId===line.rollId);if(data.locations[s.locationId].category!=='GREY'){rule(holds.length===1,'معیار کی گنتی کے فرق کے لیے ایک واضح ہولڈ ضروری ہے؛ الگ منظور شدہ ایڈجسٹمنٹ کریں۔');if(variance<0)rule(-variance<=qualityRemainingMeters(data,holds[0].id),'ہولڈ کی باقی مقدار ناکافی ہے۔');}
    const num=next('ADJ',s.date),aid='warehouse-adjustment:'+num;w.adjustments[aid]={...meta(aid,'POSTED'),number:num,date:s.date,reason:s.reason,lotId:line.lotId,...(line.rollId?{rollId:line.rollId}:{}),locationId:s.locationId,quantityMeters:variance,systemMeters:line.systemMeters,provenance:'منظور شدہ جسمانی گنتی '+s.number,approvedById:s.approvedById,stocktakeId:s.id,...(holds.length===1?{qualityHoldId:holds[0].id}:{})};s.adjustmentIds.push(aid);
   }s.status='POSTED';for(const aid of s.adjustmentIds)commitEffects(aid,s.reason);
  }else{const transition=transitions[c.action];rule(s.status===transition[0],'گنتی کی حالت اس کارروائی کے لیے درست نہیں۔');if(c.action==='SUBMIT')rule(s.lineIds.every((id)=>w.stocktakeLines[id].countedMeters!==undefined),'تمام لائنوں کی گنتی درج کریں۔');s.status=transition[1];if(c.action==='REVIEW')s.reviewedById=ctx.actorId;if(c.action==='APPROVE')s.approvedById=ctx.actorId;}
  touch(s);docId=s.id;status=s.status;reason=s.reason;break;
 }
 case 'createAdjustment':{
  const l=location(c.locationId);rule(data.lots[c.lotId],'لاٹ نہیں ملی۔');if(c.quantityMeters<0)portion(c.lotId,c.rollId,c.locationId,-c.quantityMeters,l.category==='GREY');if(c.rollId)rule(hasKnownRollCustody(data,c.lotId)&&data.rolls[c.rollId]?.lotId===c.lotId,'رول کی معلوم تحویل ضروری ہے۔');
  rule(c.date>=data.goodsReceipts[data.goodsReceiptLines[data.lots[c.lotId].sourceGoodsReceiptLineId].goodsReceiptId].receivedOn,'ایڈجسٹمنٹ کی تاریخ اصل وصولی سے پہلے نہیں ہو سکتی۔');
  rule(c.rollId||!hasKnownRollCustody(data,c.lotId),'معلوم تحویل والی لاٹ کی پیمائش میں مخصوص تھان ضروری ہے۔');
  const num=next('ADJ',c.date),id='warehouse-adjustment:'+num,system=c.rollId?rollBalances(data).find((r)=>r.rollId===c.rollId&&r.locationId===c.locationId)?.physical??0:getInventoryBalances(data).find((r)=>r.lotId===c.lotId&&r.locationId===c.locationId)?.onHandMeters??0;
  const candidates=Object.values(w.qualityHolds).filter((h)=>h.status==='ACTIVE'&&h.toLocationId===c.locationId&&h.lotId===c.lotId&&h.rollId===c.rollId),qualityHoldId=c.qualityHoldId??(candidates.length===1?candidates[0].id:undefined);
  if(l.category!=='GREY'){rule(qualityHoldId&&candidates.some((h)=>h.id===qualityHoldId),'معیار کی ایڈجسٹمنٹ کے لیے متعلقہ فعال ہولڈ منتخب کریں۔');if(c.quantityMeters<0)rule(-c.quantityMeters<=qualityRemainingMeters(data,qualityHoldId),'اس ہولڈ کی باقی مقدار ناکافی ہے۔');}
  w.adjustments[id]={...meta(id,'DRAFT'),number:num,date:c.date,reason:c.reason,lotId:c.lotId,...(c.rollId?{rollId:c.rollId}:{}),locationId:c.locationId,quantityMeters:c.quantityMeters,systemMeters:system,provenance:c.provenance,...(qualityHoldId?{qualityHoldId}:{})};docId=id;status='DRAFT';reason=c.reason;break;
 }
 case 'adjustmentAction':{
  const a=w.adjustments[c.id];rule(a,'ایڈجسٹمنٹ نہیں ملی۔');old=a.status;
  if(c.action==='APPROVE'){rule(a.status==='DRAFT','صرف مسودہ منظور ہو سکتا ہے۔');a.status='APPROVED';a.approvedById=ctx.actorId;}
  if(c.action==='CANCEL'){rule(!['POSTED','CANCELLED'].includes(a.status),'پوسٹ شدہ ایڈجسٹمنٹ منسوخ نہیں ہو سکتی۔');a.status='CANCELLED';}
  if(c.action==='POST'){rule(a.status==='APPROVED','صرف منظور شدہ ایڈجسٹمنٹ پوسٹ ہوتی ہے۔');const l=location(a.locationId);if(a.qualityHoldId){rule(w.qualityHolds[a.qualityHoldId].status==='ACTIVE','ہولڈ رہا ہو چکا ہے؛ ایڈجسٹمنٹ دوبارہ تیار کریں۔');if(a.quantityMeters<0)rule(-a.quantityMeters<=qualityRemainingMeters(data,a.qualityHoldId),'ہولڈ کی باقی مقدار ناکافی ہے۔');}if(a.quantityMeters<0)portion(a.lotId,a.rollId,a.locationId,-a.quantityMeters,l.category==='GREY');else destination(a.locationId,a.lotId,a.quantityMeters);a.status='POSTED';commitEffects(a.id,a.reason);}
  touch(a);docId=a.id;status=a.status;reason=a.reason;break;
 }
 case 'placeQualityHold':{
  const source=location(c.fromLocationId);rule(source.category==='GREY','قابلِ استعمال کورا کپڑا منتخب کریں۔');portion(c.lotId,c.rollId,source.id,c.quantityMeters);
  const target=Object.values(data.locations).find((l)=>l.status==='ACTIVE'&&l.warehouseId===source.warehouseId&&l.category===c.category&&locationProfile(data,l.id).area==='QUALITY')?.id??'location:quality:'+source.warehouseId+':'+c.category;
  if(!data.locations[target])data.locations[target]={...base(target,'ACTIVE'),warehouseId:source.warehouseId,name:{INSPECTION_HOLD:'معائنہ ہولڈ',QUARANTINED:'قرنطینہ',REJECTED:'مسترد',DAMAGED:'خراب کپڑا',GREY:'کورا'}[c.category],category:c.category};
  if(!Object.values(w.locationProfiles).some((p)=>p.locationId===target)){const pid='warehouse-location:'+target;w.locationProfiles[pid]={...meta(pid,'ACTIVE'),locationId:target,code:'QUALITY-'+c.category,warehouseCode:'MAIN',zone:'QUALITY',rack:'',shelf:'',bin:'',area:'QUALITY',fabricIds:[]};}
  destination(target,c.lotId,c.quantityMeters);
  const num=next('QH',c.date),id='warehouse-quality:'+num;w.qualityHolds[id]={...meta(id,'ACTIVE'),number:num,date:c.date,reason:c.reason,lotId:c.lotId,...(c.rollId?{rollId:c.rollId}:{}),fromLocationId:source.id,toLocationId:target,quantityMeters:c.quantityMeters,category:c.category};commitEffects(id,c.reason,'hold');docId=id;status='ACTIVE';reason=c.reason;break;
 }
 case 'releaseQualityHold':{
  const h=w.qualityHolds[c.id];rule(h?.status==='ACTIVE','فعال ہولڈ منتخب کریں۔');const remaining=qualityRemainingMeters(data,h.id);if(remaining>0){portion(h.lotId,h.rollId,h.toLocationId,remaining,false);destination(h.fromLocationId,h.lotId,remaining);}old=h.status;h.status='RELEASED';h.releasedMeters=remaining;h.releasedAt=ctx.at;touch(h);commitEffects(h.id,h.reason,'release');docId=h.id;status=h.status;reason=h.reason;break;
 }
 case 'issueExistingChallan':{
  const challan=data.challans[c.id];rule(challan?.status==='APPROVED'&&challan.lineIds.length===1,'ایک منظور شدہ چالان کی لائن ضروری ہے؛ مکمل پروسیسنگ ایڈیٹر اگلے مرحلے میں ہے۔');const l=data.challanLines[challan.lineIds[0]];portion(l.lotId,c.rollId,challan.fromLocationId,l.quantityMeters);if(c.rollId)l.rollId=c.rollId;const result=issueProcessing(data,challan.id,ctx);rule(result.ok,result.ok?'':result.error.message);data=result.state;w=data.warehouse!;docId=challan.id;old='APPROVED';status='POSTED';reason='شناخت شدہ کورا کپڑا موجودہ چالان سے جاری کیا گیا۔';break;
 }
 }
 const aid='warehouse-audit:'+(Object.keys(w.audits).length+1);w.audits[aid]={...meta(aid,'ACTIVE'),actorId:ctx.actorId,role:ctx.role,documentId:docId,action:c.kind,previousStatus:old,newStatus:status,reason};
 const log='activity:'+aid;data.activityLogs[log]={...base(log,'ACTIVE'),actorId:ctx.actorId,action:c.kind,documentId:docId,detail:reason};
 return validateDomainState(data);
}
export function executeWarehouse(input:DomainState,command:WarehouseCommand,ctx:ProcurementContext):TransactionResult{try{return operation(input,command,ctx);}catch(error){return{ok:false,error:{code:'WAREHOUSE_REJECTED',message:error instanceof Error?error.message:'گودام کی کارروائی درست نہیں۔'}};}}
