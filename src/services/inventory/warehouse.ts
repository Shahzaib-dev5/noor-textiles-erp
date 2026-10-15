import type { DomainState, InventoryMovement } from '@/domain/entities';
import type { WarehouseCategory } from '@/domain/entities/warehouse';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { getInventoryBalances } from './index';
import { receiptLineValue, fabricProfile } from '@/store/selectors/procurement';
export function isProcessingOutput(data:DomainState,lotId:string){return Object.values(data.processing?.outputs??{}).some(o=>o.lotId===lotId);}
export const greyCategories:readonly string[]=['GREY','INSPECTION_HOLD','QUARANTINED','REJECTED','DAMAGED'];
export const warehouseSum=<T>(rows:readonly T[],f:(r:T)=>number)=>roundQuantity(rows.reduce((n,r)=>n+f(r),0));
export function locationProfile(data:DomainState,id:string){const p=Object.values(data.warehouse?.locationProfiles??{}).find((p)=>p.locationId===id);return p??{locationId:id,code:id,warehouseCode:data.locations[id]?.warehouseId??'',zone:'',rack:'',shelf:'',bin:'',area:'LEGACY' as const,capacityMeters:undefined,fabricIds:[] as string[]};}
export function knownRollLots(data:DomainState){const totals=new Map<string,number>(),unassigned=new Set(Object.values(data.movements).filter((m)=>m.sourceType!=='GOODS_RECEIPT'&&!m.rollId).map((m)=>m.lotId));for(const r of Object.values(data.rolls))totals.set(r.lotId,roundQuantity((totals.get(r.lotId)??0)+r.actualLengthMeters));return new Map(Object.values(data.lots).map((l)=>[l.id,!unassigned.has(l.id)&&(totals.get(l.id)??0)===data.goodsReceiptLines[l.sourceGoodsReceiptLineId]?.quantityMeters]));}
export function hasKnownRollCustody(data:DomainState,lotId:string){return knownRollLots(data).get(lotId)??false;}
export function lotCostPaisa(data:DomainState,lotId:string,meters:number){const line=data.goodsReceiptLines[data.lots[lotId].sourceGoodsReceiptLineId],whole=BigInt(Math.round(line.quantityMeters*10000)),part=BigInt(Math.round(meters*10000));return Number((BigInt(receiptLineValue(data,line.id))*part+whole/2n)/whole);}
export function rollBalances(data:DomainState){
 const result=new Map<string,{rollId:string;lotId:string;locationId:string;category:WarehouseCategory;physical:number;reserved:number;available:number}>();
 const add=(rollId:string,locationId:string,category:WarehouseCategory,quantity:number)=>{const roll=data.rolls[rollId];if(!roll)return;const key=rollId+'|'+locationId+'|'+category, row=result.get(key)??{rollId,lotId:roll.lotId,locationId,category,physical:0,reserved:0,available:0};row.physical=roundQuantity(row.physical+quantity);result.set(key,row);};
 const known=knownRollLots(data);
 for(const roll of Object.values(data.rolls)){
  const line=data.goodsReceiptLines[data.lots[roll.lotId].sourceGoodsReceiptLineId],grn=data.goodsReceipts[line.goodsReceiptId];
  if(grn.status==='POSTED'&&known.get(roll.lotId))add(roll.id,grn.warehouseLocationId,'GREY',roll.actualLengthMeters);
 }
 for(const m of Object.values(data.movements))if(m.sourceType!=='GOODS_RECEIPT'&&m.rollId&&known.get(m.lotId)&&greyCategories.includes(m.category))add(m.rollId,m.locationId,m.category as WarehouseCategory,m.quantityMeters);
 for(const profile of Object.values(data.warehouse?.reservationProfiles??{})){
  const r=data.reservations[profile.reservationId];if(r?.status!=='ACTIVE'||!profile.rollId)continue;
  const row=result.get(profile.rollId+'|'+r.locationId+'|GREY');if(row)row.reserved=roundQuantity(row.reserved+r.quantityMeters);
 }
 const lots=new Map(getInventoryBalances(data).map((b)=>[b.lotId+'|'+b.locationId+'|'+b.category,b.availableMeters]));
 return [...result.values()].map((r)=>({...r,available:r.category==='GREY'?roundQuantity(Math.min(r.physical-r.reserved,lots.get(r.lotId+'|'+r.locationId+'|GREY')??0)):0}));
}
export function availableRollMeters(data:DomainState,rollId:string,locationId:string){return rollBalances(data).find((r)=>r.rollId===rollId&&r.locationId===locationId&&r.category==='GREY')?.available??0;}
export function rollPhysicalMeters(data:DomainState,rollId:string,locationId:string){return rollBalances(data).find((r)=>r.rollId===rollId&&r.locationId===locationId)?.physical??0;}
export function stockScopeKey(data:DomainState,locationId:string,fabricId?:string){
 const relevant=(lotId:string)=>!fabricId||data.lots[lotId]?.fabricId===fabricId;
 const movements=Object.values(data.movements).filter((m)=>m.locationId===locationId&&relevant(m.lotId)).map((m)=>m.id+':'+m.quantityMeters).sort();
 const reservations=Object.values(data.reservations).filter((r)=>r.locationId===locationId&&relevant(r.lotId)).map((r)=>r.id+':'+r.status+':'+r.quantityMeters).sort();
 // Deterministic compact fingerprint; quantity snapshot comparison is an additional guard.
 const value=[...movements,...reservations].join('|');let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619)>>>0;
 return movements.length+':'+reservations.length+':'+hash;
}
export function qualityRemainingMeters(data:DomainState,id:string){const h=data.warehouse?.qualityHolds[id];if(!h)return 0;return roundQuantity(h.quantityMeters+warehouseSum(Object.values(data.warehouse?.adjustments??{}).filter((a)=>a.status==='POSTED'&&a.qualityHoldId===id),(a)=>a.quantityMeters)-(h.status==='RELEASED'?h.releasedMeters??h.quantityMeters:0));}
export function contractorCustody(data:DomainState){return Object.values(data.challanLines).filter((l)=>['POSTED','PARTIALLY_RECEIVED','COMPLETED'].includes(data.challans[l.challanId].status)).map((l)=>{const c=data.challans[l.challanId],receipts=Object.values(data.processingReceiptLines).filter((r)=>r.challanLineId===l.id&&data.processingReceipts[r.processingReceiptId].status==='POSTED'),returned=warehouseSum(receipts,(r)=>r.outputMeters),loss=warehouseSum(receipts,(r)=>r.lossMeters);return{id:l.id,challanId:c.id,number:c.number,contractorId:c.contractorId,contractor:data.contractors[c.contractorId].name,lotId:l.lotId,fabricId:data.lots[l.lotId].fabricId,issued:l.quantityMeters,returned,loss,held:roundQuantity(l.quantityMeters-returned-loss),status:c.status,expectedOn:Object.values(data.processing?.issues??{}).find(i=>i.challanId===c.id)?.expectedOn??Object.values(data.history?.processingSchedules??{}).find((j)=>j.challanId===c.id)?.dueOn??''};});}
export function warehouseSummary(data:DomainState){
 const balances=getInventoryBalances(data).filter((r)=>greyCategories.includes(r.category)&&!isProcessingOutput(data,r.lotId)),by=(category:string)=>warehouseSum(balances.filter((r)=>r.category===category),(r)=>r.onHandMeters);
 const eligible=balances.filter((r)=>r.category==='GREY'),lots=new Set(balances.filter((r)=>r.onHandMeters>0).map((r)=>r.lotId));
 const low=Object.values(data.fabrics).filter((f)=>f.status==='ACTIVE').map((f)=>({id:f.id,name:f.name,threshold:fabricProfile(data,f.id).reorderMeters,available:warehouseSum(eligible.filter((b)=>data.lots[b.lotId].fabricId===f.id),(b)=>b.availableMeters)})).filter((r)=>r.available<r.threshold);
 const value=(available:boolean)=>{const quantities=new Map<string,number>();for(const b of balances)quantities.set(b.lotId,roundQuantity((quantities.get(b.lotId)??0)+(available?b.availableMeters:b.onHandMeters)));return [...quantities].reduce((n,[lot,qty])=>n+lotCostPaisa(data,lot,qty),0);};
 const variances=Object.values(data.warehouse?.stocktakes??{}).filter((s)=>s.status!=='CANCELLED'&&s.lineIds.some((id)=>{const l=data.warehouse!.stocktakeLines[id];return l.countedMeters!==undefined&&l.countedMeters!==l.systemMeters;})).length;
 return{physical:warehouseSum(balances,(r)=>r.onHandMeters),available:warehouseSum(eligible,(r)=>r.availableMeters),reserved:warehouseSum(eligible,(r)=>r.reservedMeters),held:by('INSPECTION_HOLD'),quarantined:by('QUARANTINED'),rejected:by('REJECTED'),damaged:by('DAMAGED'),lots:lots.size,rolls:Object.values(data.rolls).filter((r)=>lots.has(r.lotId)).length,knownActiveRolls:new Set(rollBalances(data).filter((r)=>r.physical>0).map((r)=>r.rollId)).size,variances,pendingPutaway:warehouseSum(eligible.filter((r)=>locationProfile(data,r.locationId).area==='STAGING'),(r)=>r.onHandMeters),contractor:warehouseSum(contractorCustody(data),(r)=>r.held),low,physicalValuePaisa:value(false),availableValuePaisa:value(true)};
}
export function movementEndpoints(data:DomainState,m:InventoryMovement){
 const quality=data.processing?.quality[m.sourceDocumentId];if(quality)return{from:quality.fromLocationId,to:quality.toLocationId};
 const output=Object.values(data.processing?.outputs??{}).find(o=>o.lotId===m.lotId&&o.receiptId===m.sourceDocumentId);if(output){const receipt=data.processingReceipts[output.receiptId],challan=data.challans[receipt.challanId];return{from:challan.contractorLocationId,to:output.locationId};}
 if(m.fromLocationId||m.toLocationId)return{from:m.fromLocationId??'',to:m.toLocationId??''};
 if(m.sourceType==='GOODS_RECEIPT')return{from:'supplier:'+data.lots[m.lotId].supplierId,to:data.goodsReceipts[m.sourceDocumentId].warehouseLocationId};
 if(m.sourceType==='PURCHASE_RETURN')return{from:m.locationId,to:'supplier:'+data.lots[m.lotId].supplierId};
 if(m.sourceType==='PROCESSING_ISSUE'){const c=data.challans[m.sourceDocumentId];return{from:c.fromLocationId,to:c.contractorLocationId};}
 const r=data.processingReceipts[m.sourceDocumentId],c=r&&data.challans[r.challanId];return{from:c?.contractorLocationId??'',to:m.sourceType==='PROCESSING_LOSS'?'recognized-loss':r?.destinationLocationId??''};
}
export function warehouseMovementEffects(data:DomainState){
 const effects:Pick<InventoryMovement,'sourceType'|'sourceDocumentId'|'sourceLineId'|'lotId'|'rollId'|'locationId'|'category'|'quantityMeters'>[]=[];
 const pair=(sourceType:'WAREHOUSE_TRANSFER'|'QUALITY_CHANGE',id:string,lineId:string,lotId:string,rollId:string|undefined,from:string,to:string,qty:number)=>{effects.push({sourceType,sourceDocumentId:id,sourceLineId:lineId,lotId,rollId,locationId:from,category:data.locations[from].category,quantityMeters:-qty},{sourceType,sourceDocumentId:id,sourceLineId:lineId,lotId,rollId,locationId:to,category:data.locations[to].category,quantityMeters:qty});};
 for(const t of Object.values(data.warehouse?.transfers??{}))if(t.status==='POSTED')t.lines.forEach((l,i)=>pair('WAREHOUSE_TRANSFER',t.id,t.id+':'+i,l.lotId,l.rollId,t.fromLocationId,t.toLocationId,l.quantityMeters));
 for(const h of Object.values(data.warehouse?.qualityHolds??{})){pair('QUALITY_CHANGE',h.id,h.id+':hold',h.lotId,h.rollId,h.fromLocationId,h.toLocationId,h.quantityMeters);if(h.status==='RELEASED'&&(h.releasedMeters??h.quantityMeters)>0)pair('QUALITY_CHANGE',h.id,h.id+':release',h.lotId,h.rollId,h.toLocationId,h.fromLocationId,h.releasedMeters??h.quantityMeters);}
 for(const a of Object.values(data.warehouse?.adjustments??{}))if(a.status==='POSTED')effects.push({sourceType:'WAREHOUSE_ADJUSTMENT',sourceDocumentId:a.id,sourceLineId:a.id,lotId:a.lotId,rollId:a.rollId,locationId:a.locationId,category:data.locations[a.locationId].category,quantityMeters:a.quantityMeters});
 return effects;
}
export function warehouseReconciliation(data:DomainState){
 const balances=getInventoryBalances(data),movements=Object.values(data.movements);
 const lots=Object.values(data.lots).filter(l=>!isProcessingOutput(data,l.id)).map((lot)=>{const ms=movements.filter((m)=>m.lotId===lot.id),purchased=warehouseSum(ms.filter((m)=>m.sourceType==='GOODS_RECEIPT'),(m)=>m.quantityMeters),adjusted=warehouseSum(ms.filter((m)=>m.sourceType==='WAREHOUSE_ADJUSTMENT'),(m)=>m.quantityMeters),issued=-warehouseSum(ms.filter((m)=>m.sourceType==='PROCESSING_ISSUE'&&m.category==='GREY'),(m)=>m.quantityMeters),returned=-warehouseSum(ms.filter((m)=>m.sourceType==='PURCHASE_RETURN'),(m)=>m.quantityMeters),physical=warehouseSum(balances.filter((b)=>b.lotId===lot.id&&greyCategories.includes(b.category)),(b)=>b.onHandMeters),transferNet=warehouseSum(ms.filter((m)=>m.sourceType==='WAREHOUSE_TRANSFER'||m.sourceType==='QUALITY_CHANGE'),(m)=>m.quantityMeters);return{lotId:lot.id,purchased,adjusted,issued,returned,physical,transferNet,difference:roundQuantity(purchased+adjusted-issued-returned+transferNet-physical)};});
 const portions=rollBalances(data),rolls=Object.values(data.rolls).map((r)=>{if(!hasKnownRollCustody(data,r.lotId))return{rollId:r.id,known:false,difference:null};const ms=movements.filter((m)=>m.rollId===r.id),adjusted=warehouseSum(ms.filter((m)=>m.sourceType==='WAREHOUSE_ADJUSTMENT'),(m)=>m.quantityMeters),loss=-warehouseSum(ms.filter((m)=>m.sourceType==='PROCESSING_LOSS'),(m)=>m.quantityMeters),returned=-warehouseSum(ms.filter((m)=>m.sourceType==='PURCHASE_RETURN'),(m)=>m.quantityMeters),contractor=warehouseSum(ms.filter((m)=>m.category==='PROCESSING_OUT'),(m)=>m.quantityMeters),processed=warehouseSum(ms.filter((m)=>m.category==='PROCESSED'),(m)=>m.quantityMeters)+warehouseSum(Object.values(data.processing?.outputs??{}).filter(o=>data.challanLines[data.processingReceiptLines[o.receiptLineId]?.challanLineId]?.rollId===r.id),o=>o.quantityMeters),grey=warehouseSum(portions.filter((p)=>p.rollId===r.id),(p)=>p.physical);return{rollId:r.id,known:true,original:r.actualLengthMeters,adjusted,loss,returned,contractor,processed,grey,difference:roundQuantity(r.actualLengthMeters+adjusted-loss-returned-contractor-processed-grey)};});
 return{lots,rolls,balanced:lots.every((l)=>l.difference===0)&&rolls.every((r)=>r.difference===null||r.difference===0),unknownRolls:rolls.filter((r)=>!r.known).length};
}
