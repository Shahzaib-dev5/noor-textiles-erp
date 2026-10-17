import type { DomainState } from '@/domain/entities';
import { dispatchEffects } from '@/services/wholesale/fulfillment';
import type { ComponentMovement } from '@/domain/entities/production-operations';
import type { FinishingState } from '@/domain/entities/finishing';
type ComponentEffect=Pick<ComponentMovement,'sourceType'|'sourceDocumentId'|'componentLotId'|'orderId'|'quantity'|'unit'|'state'|'custodyId'>;
export const assemblyCustody=(planId:string)=>'assembly:'+planId;
export const matchedCustody=(batchId:string)=>'matched:'+batchId;
export function assemblyComponentEffects(d:DomainState){const f=d.finishing,e:ComponentEffect[]=[];if(!f)return e;
 const add=(sourceType:ComponentEffect['sourceType'],documentId:string,lotId:string,state:ComponentEffect['state'],quantity:number,custodyId:string)=>{const lot=d.production?.componentLots[lotId];if(lot&&quantity)e.push({sourceType,sourceDocumentId:documentId,componentLotId:lotId,orderId:lot.orderId,quantity,unit:lot.unit,state,custodyId});};
 for(const i of Object.values(f.issues))if(i.status==='POSTED'){const r=f.reservations[i.reservationId];if(!r)continue;add('ASSEMBLY_ISSUE',i.id,r.componentLotId,'ACCEPTED',-i.quantity,r.sourceCustodyId);add('ASSEMBLY_ISSUE',i.id,r.componentLotId,'ACCEPTED',i.quantity,assemblyCustody(i.planId));}
 for(const r of Object.values(f.returns)){const lot=d.production?.componentLots[r.componentLotId];if(lot){add('ASSEMBLY_RETURN',r.id,lot.id,'ACCEPTED',-r.quantity,assemblyCustody(r.planId));add('ASSEMBLY_RETURN',r.id,lot.id,'ACCEPTED',r.quantity,'production:'+lot.orderId);}}
 for(const b of Object.values(f.batches))if(b.status==='POSTED')for(const l of b.inputs){add('MATCHING',b.id,l.componentLotId,'ACCEPTED',-l.quantity,assemblyCustody(b.planId));add('MATCHING',b.id,l.componentLotId,'ASSEMBLY_CONSUMED',l.quantity,matchedCustody(b.id));}
 for(const r of Object.values(f.replacements)){const rw=f.reworks[r.reworkId],b=rw&&f.batches[rw.batchId],lot=d.production?.componentLots[r.oldComponentLotId];if(!b||!lot)continue;add('ASSEMBLY_REPLACEMENT',r.id,lot.id,'ASSEMBLY_CONSUMED',-r.quantity,matchedCustody(b.id));add('ASSEMBLY_REPLACEMENT',r.id,lot.id,r.disposition==='RETURN'?'ACCEPTED':'SCRAP',r.quantity,r.disposition==='RETURN'?'production:'+lot.orderId:matchedCustody(b.id));add('ASSEMBLY_REPLACEMENT',r.id,r.newComponentLotId,'ACCEPTED',-r.quantity,assemblyCustody(b.planId));add('ASSEMBLY_REPLACEMENT',r.id,r.newComponentLotId,'ASSEMBLY_CONSUMED',r.quantity,matchedCustody(b.id));}
 return e;
}
type SetEffect=Pick<FinishingState['setMovements'][string],'batchId'|'state'|'quantity'|'sourceType'|'sourceDocumentId'>;
export function setEffects(d:DomainState){const f=d.finishing,e:SetEffect[]=[];if(!f)return e;const add=(sourceType:SetEffect['sourceType'],id:string,batchId:string,state:SetEffect['state'],quantity:number)=>{if(quantity)e.push({sourceType,sourceDocumentId:id,batchId,state,quantity});};
 for(const b of Object.values(f.batches))if(b.status==='POSTED')add('MATCHING',b.id,b.id,'QC_PENDING',b.quantity);
 for(const r of Object.values(f.inspections))if(r.status==='POSTED'){add('FINAL_QC',r.id,r.batchId,r.fromState,-r.quantity);for(const[state,n]of[['ACCEPTED',r.accepted],['HOLD',r.held],['REJECTED',r.rejected],['REWORK',r.rework]]as const)add('FINAL_QC',r.id,r.batchId,state,n);}
 for(const c of Object.values(f.completions))if(c.status==='POSTED'){const p=f.packaging[c.packagingId];if(p){add('PACKAGING',c.id,p.batchId,'ACCEPTED',-c.quantity);add('PACKAGING',c.id,p.batchId,'PACKAGED',c.quantity);}}
 return e;
}
type MaterialEffect=Pick<FinishingState['materialMovements'][string],'materialId'|'quantity'|'unitCostPaisa'|'costPaisa'|'sourceType'|'sourceDocumentId'>;
export function materialEffects(d:DomainState){const f=d.finishing,e:MaterialEffect[]=[];if(!f)return e;const add=(sourceType:MaterialEffect['sourceType'],id:string,materialId:string,quantity:number,unitCostPaisa:number,costPaisa:number)=>{if(quantity)e.push({sourceType,sourceDocumentId:id,materialId,quantity,unitCostPaisa,costPaisa});};
 for(const r of Object.values(f.materialReceipts))if(r.status==='POSTED')add('RECEIPT',r.id,r.materialId,r.quantity,r.unitCostPaisa,r.quantity*r.unitCostPaisa);
 for(const b of Object.values(f.batches))if(b.status==='POSTED')for(const r of b.materials)add('MATCHING',b.id,r.materialId,-r.quantity,r.unitCostPaisa,r.costPaisa);
 for(const c of Object.values(f.completions))if(c.status==='POSTED')for(const r of c.materials)add('PACKAGING',c.id,r.materialId,-r.quantity,r.unitCostPaisa,r.costPaisa);
 for(const c of Object.values(f.cartons))if(c.materialConsumed&&c.materialId)add('CARTON',c.id,c.materialId,-1,c.materialUnitCostPaisa??0,c.materialCostPaisa??0);
 for(const w of Object.values(f.materialWaste))add('WASTE',w.id,w.materialId,-w.quantity,w.unitCostPaisa,w.costPaisa);
 return e;
}
type FinishedEffect=Pick<FinishingState['finishedMovements'][string],'lotId'|'skuId'|'locationId'|'quality'|'quantity'|'sourceType'|'sourceDocumentId'>;
export function finishedEffects(d:DomainState){const f=d.finishing,e:FinishedEffect[]=[];if(!f)return e;const sku=(lotId:string)=>f.lots[lotId]?.skuId??(lotId.startsWith('historical:')?lotId.slice(11):'');const add=(sourceType:FinishedEffect['sourceType'],id:string,lotId:string,locationId:string,quality:FinishedEffect['quality'],quantity:number)=>{if(quantity)e.push({sourceType,sourceDocumentId:id,lotId,skuId:sku(lotId),locationId,quality,quantity});};
 for(const r of Object.values(f.receipts))add('RECEIPT',r.id,r.lotId,r.locationId,'ACCEPTED',r.quantity);
 for(const t of Object.values(f.transfers))if(t.status==='POSTED')for(const l of t.lines){add('TRANSFER',t.id,l.lotId,t.fromLocationId,t.quality,-l.quantity);add('TRANSFER',t.id,l.lotId,t.toLocationId,t.quality,l.quantity);}
 for(const a of Object.values(f.adjustments))if(a.status==='POSTED')add('ADJUSTMENT',a.id,a.lotId,a.locationId,a.quality,a.delta);
 for(const r of Object.values(f.quality))if(r.status==='POSTED'){add('QUALITY',r.id,r.lotId,r.locationId,r.fromState,-r.quantity);add('QUALITY',r.id,r.lotId,r.locationId,r.toState,r.quantity);}
 return [...e,...dispatchEffects(d)];
}
