import type { DomainState } from '@/domain/entities';
import { getInventoryBalances } from '@/services/inventory';
import { warehouseMovementEffects, warehouseSum, greyCategories, hasKnownRollCustody, rollBalances,qualityRemainingMeters,warehouseSummary } from '@/services/inventory/warehouse';
import { roundQuantity } from '@/domain/value-objects/quantity';
export function inspectWarehouse(data:DomainState):string[]{
 const w=data.warehouse;if(!w)return[];const errors:string[]=[],fail=(id:string,why:string)=>errors.push(id+': '+why),ref=(yes:unknown,id:string)=>{if(!yes)fail(id,'متعلقہ ریکارڈ درست نہیں۔');};
 const ids=new Set(Object.entries(data).filter(([key])=>!['warehouse','history','procurement','processing','studio'].includes(key)).flatMap(([,rows])=>Object.keys(rows)));
 const numbers=new Set([...Object.values(data.purchaseOrders),...Object.values(data.goodsReceipts),...Object.values(data.challans),...Object.values(data.processingReceipts)].map((r)=>r.number));
 for(const ext of [data.history,data.procurement])for(const rows of Object.values(ext??{}))if(typeof rows==='object')for(const r of Object.values(rows) as {id:string;number?:string}[]){ids.add(r.id);if(r.number)numbers.add(r.number);}
 ref(data.companies[w.companyId],w.companyId);
 for(const rows of Object.values(w))if(typeof rows==='object')for(const [key,raw]of Object.entries(rows)){
  const r=raw as {id:string;companyId:string;createdBy:string;updatedBy:string;createdAt:string;updatedAt:string;number?:string};
  if(key!==r.id||ids.has(r.id))fail(key,'شناخت دہرائی گئی ہے۔');ids.add(r.id);
  ref(r.companyId===w.companyId&&data.employees[r.createdBy]&&data.employees[r.updatedBy]&&r.createdAt<=r.updatedAt,key);
  if(r.number){if(numbers.has(r.number))fail(key,'دستاویز نمبر دہرایا گیا ہے۔');numbers.add(r.number);}
 }
 const profiles=new Set<string>(),codes=new Set<string>(),balances=getInventoryBalances(data);
 for(const p of Object.values(w.locationProfiles)){
  const l=data.locations[p.locationId];ref(l?.warehouseId&&data.warehouses[l.warehouseId]?.companyId===w.companyId&&greyCategories.includes(l.category),p.id);
  const code=l?.warehouseId+'|'+p.code.toUpperCase();if(profiles.has(p.locationId)||codes.has(code))fail(p.id,'مقام یا کوڈ دہرایا گیا ہے۔');profiles.add(p.locationId);codes.add(code);
  p.fabricIds.forEach((id)=>ref(data.fabrics[id],p.id));
  const occupied=warehouseSum(balances.filter((b)=>b.locationId===p.locationId),(b)=>b.onHandMeters);
  if(l?.status==='INACTIVE'&&occupied>0)fail(p.id,'اسٹاک والا مقام غیر فعال نہیں ہو سکتا۔');
  if(p.capacityMeters!==undefined&&occupied>p.capacityMeters)fail(p.id,'مقام کی گنجائش سے زیادہ اسٹاک۔');
  if(p.fabricIds.length&&balances.some((b)=>b.locationId===p.locationId&&b.onHandMeters>0&&!p.fabricIds.includes(data.lots[b.lotId].fabricId)))fail(p.id,'مقام کپڑے کے لیے موزوں نہیں۔');
 }
 const portion=(r:{lotId:string;rollId?:string},id:string)=>{ref(data.lots[r.lotId],id);if(r.rollId)ref(data.rolls[r.rollId]?.lotId===r.lotId,id);};
 const chronology=(lotId:string,date:string,id:string)=>{const lot=data.lots[lotId],line=lot&&data.goodsReceiptLines[lot.sourceGoodsReceiptLineId],grn=line&&data.goodsReceipts[line.goodsReceiptId];if(grn&&date<grn.receivedOn)fail(id,'گودام کی تاریخ اصل وصولی سے پہلے ہے۔');};
 for(const t of Object.values(w.transfers)){
  const from=data.locations[t.fromLocationId],to=data.locations[t.toLocationId];ref(from&&to&&from.warehouseId&&to.warehouseId&&from.category==='GREY'&&to.category==='GREY'&&t.fromLocationId!==t.toLocationId,t.id);
  if(['APPROVED','POSTED'].includes(t.status))ref(t.approvedById&&data.employees[t.approvedById],t.id);
  t.lines.forEach((l)=>{portion(l,t.id);chronology(l.lotId,t.date,t.id);});
 }
 const reservationIds=new Set<string>(),consumedChallans=new Set<string>();
 for(const p of Object.values(w.reservationProfiles)){
  const r=data.reservations[p.reservationId];ref(r&&r.sourceDocumentId===p.id&&r.category==='GREY',p.id);if(reservationIds.has(p.reservationId))fail(p.id,'رزرو کا پروفائل دہرایا گیا۔');reservationIds.add(p.reservationId);if(!r)continue;portion({...r,rollId:p.rollId},p.id);
  const remaining=roundQuantity(p.originalMeters-p.releasedMeters-p.consumedMeters);
  chronology(r.lotId,p.date,p.id);
  if(r.status==='ACTIVE'&&p.rollId&&!hasKnownRollCustody(data,r.lotId))fail(p.id,'انفرادی رزرو کے ساتھ غیر مختص رول اجرا نہیں ہو سکتا۔');
  if(remaining<0||r.status==='ACTIVE'&&r.quantityMeters!==remaining||remaining>0&&r.status!=='ACTIVE'||remaining===0&&r.status==='ACTIVE')fail(p.id,'رزرو مقدار مصالحت میں فرق۔');
  if(p.expiresOn&&p.expiresOn<p.date)fail(p.id,'اختتام کی تاریخ درست نہیں۔');
  if(p.consumedMeters>0){for(const id of p.consumedChallanIds){const c=data.challans[id];ref(c&&['POSTED','PARTIALLY_RECEIVED','COMPLETED'].includes(c.status)&&c.fromLocationId===r.locationId&&c.lineIds.every((id)=>data.challanLines[id].lotId===r.lotId&&(!p.rollId||data.challanLines[id].rollId===p.rollId)),p.id);if(consumedChallans.has(id))fail(p.id,'ایک چالان متعدد رزرو میں استعمال نہیں ہو سکتا۔');consumedChallans.add(id);}const total=warehouseSum(p.consumedChallanIds.map((id)=>data.challans[id]).filter(Boolean).flatMap((c)=>c.lineIds.map((id)=>data.challanLines[id])),(l)=>l.quantityMeters);if(total!==p.consumedMeters)fail(p.id,'رزرو اجرا کی مقدار مختلف ہے۔');}
 }
 for(const r of Object.values(data.reservations))if(!reservationIds.has(r.id))fail(r.id,'رزرو کی عملی دستاویز نہیں ملی۔');
 for(const s of Object.values(w.stocktakes)){
  ref(data.locations[s.locationId]?.warehouseId,s.id);if(s.fabricId)ref(data.fabrics[s.fabricId],s.id);
  if(new Set(s.lineIds).size!==s.lineIds.length)fail(s.id,'گنتی کی لائن دہرائی گئی۔');
  for(const id of s.lineIds){const l=w.stocktakeLines[id];ref(l?.stocktakeId===s.id,id);if(l)portion(l,id);if(!['DRAFT','IN_PROGRESS','CANCELLED'].includes(s.status)&&l?.countedMeters===undefined)fail(id,'گنتی مکمل نہیں۔');}
  if(['APPROVED','POSTED'].includes(s.status))ref(s.approvedById&&data.employees[s.approvedById],s.id);
  if(s.status==='POSTED'){const expected=s.lineIds.filter((id)=>w.stocktakeLines[id].countedMeters!==w.stocktakeLines[id].systemMeters);if(s.adjustmentIds.length!==expected.length)fail(s.id,'گنتی کی ایڈجسٹمنٹ مکمل نہیں۔');for(const id of s.adjustmentIds)ref(w.adjustments[id]?.stocktakeId===s.id&&w.adjustments[id].status==='POSTED',s.id);}
 }
 for(const l of Object.values(w.stocktakeLines))ref(w.stocktakes[l.stocktakeId]?.lineIds.includes(l.id),l.id);
 for(const a of Object.values(w.adjustments)){
  portion(a,a.id);ref(greyCategories.includes(data.locations[a.locationId]?.category),a.id);
  chronology(a.lotId,a.date,a.id);
  if(['APPROVED','POSTED'].includes(a.status))ref(a.approvedById&&data.employees[a.approvedById],a.id);
  if(a.qualityHoldId){const h=w.qualityHolds[a.qualityHoldId];ref(h&&h.lotId===a.lotId&&h.rollId===a.rollId&&h.toLocationId===a.locationId,a.id);}else if(data.locations[a.locationId]?.category!=='GREY')fail(a.id,'معیار کی ایڈجسٹمنٹ کا ہولڈ حوالہ ضروری ہے۔');
  if(a.stocktakeId){const s=w.stocktakes[a.stocktakeId],l=s?.lineIds.map((id)=>w.stocktakeLines[id]).find((l)=>l.lotId===a.lotId&&l.rollId===a.rollId);ref(s?.status==='POSTED'&&l&&a.quantityMeters===roundQuantity((l.countedMeters??0)-l.systemMeters),a.id);}
 }
 for(const h of Object.values(w.qualityHolds)){portion(h,h.id);ref(data.locations[h.fromLocationId]?.category==='GREY'&&data.locations[h.toLocationId]?.category===h.category,h.id);if(h.status==='RELEASED'&&!h.releasedAt)fail(h.id,'معیار کی رہائی کا وقت نہیں۔');if(qualityRemainingMeters(data,h.id)<0||h.status==='RELEASED'&&qualityRemainingMeters(data,h.id)!==0)fail(h.id,'ہولڈ کی مقدار، نقصان اور رہائی میں فرق ہے۔');}
 const effects=warehouseMovementEffects(data);
 for(const m of Object.values(data.movements)){
  if(m.companyId)ref(m.companyId===w.companyId&&m.fabricId===data.lots[m.lotId]?.fabricId,m.id);
  if(m.sourceType==='GOODS_RECEIPT'&&m.rollId)fail(m.id,'مجموعی رسید کی حرکت انفرادی رول کی پیمائش نہیں۔');
  if(['PROCESSING_ISSUE','PROCESSING_RECEIPT','PROCESSING_LOSS'].includes(m.sourceType)&&!Object.values(data.processing?.outputs??{}).some(o=>o.lotId===m.lotId)){const line=m.sourceType==='PROCESSING_ISSUE'?data.challanLines[m.sourceLineId]:data.challanLines[data.processingReceiptLines[m.sourceLineId]?.challanLineId];ref(m.rollId===line?.rollId,m.id);}
 }
 for(const m of Object.values(data.movements))if(['WAREHOUSE_TRANSFER','WAREHOUSE_ADJUSTMENT','QUALITY_CHANGE'].includes(m.sourceType)&&!data.processing?.quality[m.sourceDocumentId]){
  ref(m.companyId===w.companyId&&m.fabricId===data.lots[m.lotId]?.fabricId&&m.role&&m.reason,m.id);
  if(!m.rollId&&!Object.values(data.movements).some((a)=>a.lotId===m.lotId&&a.sourceType!=='GOODS_RECEIPT'&&!['WAREHOUSE_TRANSFER','WAREHOUSE_ADJUSTMENT','QUALITY_CHANGE'].includes(a.sourceType)&&!a.rollId&&!a.companyId))fail(m.id,'نئی معلوم تحویل میں غیر مختص رول حرکت نہیں ہو سکتی۔');
  const e=effects.find((e)=>e.sourceDocumentId===m.sourceDocumentId&&e.sourceLineId===m.sourceLineId&&e.locationId===m.locationId&&e.quantityMeters===m.quantityMeters);ref(e&&e.rollId===m.rollId,m.id);
  if(m.sourceType!=='WAREHOUSE_ADJUSTMENT'){const paired=effects.filter((e)=>e.sourceDocumentId===m.sourceDocumentId&&e.sourceLineId===m.sourceLineId);ref(m.fromLocationId===paired.find((e)=>e.quantityMeters<0)?.locationId&&m.toLocationId===paired.find((e)=>e.quantityMeters>0)?.locationId,m.id);}
 }
 const rollRows=rollBalances(data);
 for(const b of rollRows)if(b.physical<0||b.available<0||b.reserved>b.physical)fail(b.rollId,'رول کی دستیاب مقدار منفی ہے۔');
 // A known roll's total grey portions may grow only through approved adjustments; no split duplicates ownership.
 for(const roll of Object.values(data.rolls))if(hasKnownRollCustody(data,roll.lotId)){
  const rows=rollRows.filter((b)=>b.rollId===roll.id),gain=warehouseSum(Object.values(data.movements).filter((m)=>m.rollId===roll.id&&m.sourceType==='WAREHOUSE_ADJUSTMENT'),(m)=>m.quantityMeters);
  if(warehouseSum(rows,(r)=>r.physical)>roundQuantity(roll.actualLengthMeters+gain))fail(roll.id,'رول کی ملکیت دہرائی گئی ہے۔');
 }
 for(const a of Object.values(w.audits))ref(ids.has(a.documentId)&&data.employees[a.actorId],a.id);
 if(!Number.isSafeInteger(warehouseSummary(data).physicalValuePaisa))fail('warehouse','انوینٹری کی تخمینی قدر محفوظ رقم کی حد سے زیادہ ہے۔');
 return errors;
}
