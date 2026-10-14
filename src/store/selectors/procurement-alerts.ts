import type { DomainState } from '@/domain/entities';
import { supplierBills, receivedMeters, fabricProfile, purchaseSum } from './procurement';
import { getInventoryBalances } from '@/services/inventory';
export function selectProcurementAlerts(data:DomainState,asOf:string) {
 if(!data.procurement)return [];
 const alerts:{id:string;title:string;description:string;path:string;tone:'warning'|'info'}[]=[];
 const add=(id:string,title:string,description:string,path:string)=>alerts.push({id:'procurement:'+id+':'+title,title,description,path,tone:'warning'});
 for(const request of Object.values(data.procurement.requests))if(request.status==='SUBMITTED')add(request.id,'خریداری درخواست کی منظوری باقی',request.number,'/purchases/requests/'+encodeURIComponent(request.id));
 for(const po of Object.values(data.purchaseOrders)){
   const terms=Object.values(data.procurement.orderProfiles).find((r)=>r.purchaseOrderId===po.id);
   if(po.status==='DRAFT'&&terms)add(po.id,'خریداری آرڈر کی منظوری باقی',po.number,'/purchases/'+encodeURIComponent(po.id));
   if(terms&&!terms.closedAt&&terms.expectedOn<asOf&&['APPROVED','PARTIALLY_RECEIVED'].includes(po.status))add(po.id,'متوقع مال وصولی میں تاخیر',po.number+' · '+terms.expectedOn,'/purchases/'+encodeURIComponent(po.id));
   if(po.status==='PARTIALLY_RECEIVED'&&!terms?.closedAt)add(po.id,'جزوی خریداری کی وصولی باقی',po.number+' · '+purchaseSum(po.lineIds,(id)=>data.purchaseOrderLines[id].quantityMeters-receivedMeters(data,id))+' میٹر','/purchases/'+encodeURIComponent(po.id));
 }
 for(const bill of supplierBills(data))if(bill.status==='POSTED'&&bill.outstanding>0&&bill.dueOn<=asOf)add(bill.id,bill.dueOn<asOf?'سپلائر بل کی ادائیگی میں تاخیر':'سپلائر بل آج واجب الادا ہے',bill.number+' · '+bill.dueOn,'/purchases/bills/'+encodeURIComponent(bill.id));
 for(const r of Object.values(data.procurement.inspectionRolls))if(r.result!=='ACCEPTED'&&r.resolution==='PENDING'&&data.goodsReceipts[r.goodsReceiptId].status==='POSTED')add(r.id,'مسترد / قرنطینہ کپڑا فیصلہ طلب',r.label+' · '+r.canonicalMeters+' میٹر','/purchases/receipts/'+encodeURIComponent(r.goodsReceiptId));
 const balances=getInventoryBalances(data);
 for(const fabric of Object.values(data.fabrics)){
   const profile=fabricProfile(data,fabric.id),grey=purchaseSum(balances.filter((b)=>b.category==='GREY'&&data.lots[b.lotId].fabricId===fabric.id),(b)=>b.availableMeters);
   if(fabric.status==='ACTIVE'&&grey<profile.reorderMeters)add(fabric.id,'کپڑے کی دوبارہ خریداری ضروری',fabric.name+' · '+grey+' / حد '+profile.reorderMeters+' میٹر','/fabrics/'+encodeURIComponent(fabric.id));
 }
 return alerts;
}

