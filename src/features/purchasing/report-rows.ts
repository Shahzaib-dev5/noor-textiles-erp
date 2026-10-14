import type { DomainState } from '@/domain/entities';
import { procurementRows, blank, type Row } from './view-model';
import { supplierProfile, fabricProfile, receiptLineValue, purchaseSum, supplierBills } from '@/store/selectors/procurement';
import { getInventoryBalances } from '@/services/inventory';
import { formatQuantity } from '@/lib/formatters';
interface Filters { from:string;to:string;supplierId:string;fabricId:string }
export function purchaseReportRows(data:DomainState,kind:string,f:Filters):Row[] {
 const qualifies=(date:string,supplierId:string,fabricId:string)=>(!f.from||date>=f.from)&&(!f.to||date<=f.to)&&(!f.supplierId||f.supplierId===supplierId)&&(!f.fabricId||f.fabricId===fabricId);
 const lines=Object.values(data.goodsReceiptLines).filter((l)=>{const grn=data.goodsReceipts[l.goodsReceiptId],lot=data.lots[l.lotId];return grn.status==='POSTED'&&qualifies(grn.receivedOn,lot.supplierId,lot.fabricId);});
 if(kind==='supplier')return Object.values(data.suppliers).filter((s)=>!f.supplierId||s.id===f.supplierId).map((s)=>{const records=lines.filter((l)=>data.lots[l.lotId].supplierId===s.id);return{...blank,id:s.id,name:s.name,number:supplierProfile(data,s.id).code,status:s.status,supplierId:s.id,meters:purchaseSum(records,(l)=>l.quantityMeters),amount:purchaseSum(records,(l)=>receiptLineValue(data,l.id)),detail:'پوسٹ شدہ وصولی کی قدر؛ واجبات الگ ہیں'};});
 if(kind==='fabric')return Object.values(data.fabrics).filter((r)=>!f.fabricId||r.id===f.fabricId).map((r)=>{const records=lines.filter((l)=>data.lots[l.lotId].fabricId===r.id);return{...blank,id:r.id,name:r.name,number:fabricProfile(data,r.id).code,status:r.status,fabricId:r.id,meters:purchaseSum(records,(l)=>l.quantityMeters),amount:purchaseSum(records,(l)=>receiptLineValue(data,l.id))};});
 if(kind==='outstanding')return procurementRows(data,'supplier').filter((r)=>!f.supplierId||r.supplierId===f.supplierId).map((r)=>({...r,detail:'موجودہ واجبات؛ تاریخ فلٹر سے واجبات حذف نہیں ہوتے'}));
 if(kind==='monthly'){const totals=new Map<string,{meters:number;amount:number}>();for(const l of lines){const month=data.goodsReceipts[l.goodsReceiptId].receivedOn.slice(0,7),total=totals.get(month)??{meters:0,amount:0};total.meters+=l.quantityMeters;total.amount+=receiptLineValue(data,l.id);totals.set(month,total);}return[...totals].sort(([a],[b])=>a.localeCompare(b)).map(([month,total])=>({...blank,id:month,number:month,name:'ماہانہ پوسٹ شدہ وصولی',meters:total.meters,amount:total.amount,status:'POSTED'}));}
 if(kind==='roll')return Object.values(data.rolls).flatMap((r)=>{const lot=data.lots[r.lotId],line=data.goodsReceiptLines[lot.sourceGoodsReceiptLineId],grn=data.goodsReceipts[line.goodsReceiptId];if(!qualifies(grn.receivedOn,lot.supplierId,lot.fabricId))return[];const returned=purchaseSum(Object.values(data.procurement?.returns??{}).filter((a)=>a.status==='POSTED'&&a.rollId===r.id),(a)=>a.quantityMeters);return[{...blank,id:r.id,name:data.fabrics[lot.fabricId].name,number:r.label,date:grn.receivedOn,status:grn.status,supplierId:lot.supplierId,fabricId:lot.fabricId,meters:r.actualLengthMeters,detail:lot.code+' · '+grn.number+' · رول واپسی '+formatQuantity(returned)+' میٹر؛ اصل پیمائش موجودہ رول دستیابی نہیں'}];});
 if(kind==='price')return Object.values(data.purchaseOrderLines).filter((l)=>qualifies(data.purchaseOrders[l.purchaseOrderId].orderDate,data.purchaseOrders[l.purchaseOrderId].supplierId,l.fabricId)).map((l)=>({...blank,id:l.id,name:data.fabrics[l.fabricId].name,number:data.purchaseOrders[l.purchaseOrderId].number,date:data.purchaseOrders[l.purchaseOrderId].orderDate,status:data.purchaseOrders[l.purchaseOrderId].status,supplierId:data.purchaseOrders[l.purchaseOrderId].supplierId,fabricId:l.fabricId,meters:l.quantityMeters,amount:l.unitPricePaisaPerMeter,detail:'فی میٹر قیمت · '+data.suppliers[data.purchaseOrders[l.purchaseOrderId].supplierId].name}));
 if(kind==='lot')return getInventoryBalances(data).filter((b)=>b.category==='GREY').map((b)=>{const l=data.lots[b.lotId];return{...blank,id:b.lotId+'-'+b.locationId,number:l.code,name:data.fabrics[l.fabricId].name,supplierId:l.supplierId,fabricId:l.fabricId,meters:b.availableMeters,status:'ACTIVE',detail:data.locations[b.locationId].name+' · جسمانی '+formatQuantity(b.onHandMeters)+' میٹر'};}).filter((r)=>(!f.supplierId||r.supplierId===f.supplierId)&&(!f.fabricId||r.fabricId===f.fabricId));
 const family=kind==='pending'?'po':kind as 'po'|'grn'|'bill'|'payment'|'return';
 const includesFabric=(r:Row)=>{
   if(!f.fabricId)return true;
   if(r.fabricId)return r.fabricId===f.fabricId;
   if(family==='po')return data.purchaseOrders[r.id].lineIds.some((id)=>data.purchaseOrderLines[id].fabricId===f.fabricId);
   if(family==='grn')return data.goodsReceipts[r.id].lineIds.some((id)=>data.lots[data.goodsReceiptLines[id].lotId].fabricId===f.fabricId);
   // Payment/bill totals remain whole-document amounts when a related receipt matches.
   const bills=family==='bill'?[r.id]:data.procurement?.payments[r.id]?.allocations.map((a)=>a.billId)??[];
   return procurementRows(data,'bill').filter((b)=>bills.includes(b.id)).some((b)=>{
     const receipts=supplierBills(data).find((bill)=>bill.id===b.id)?.receiptIds??[];
     return receipts.some((id)=>data.goodsReceipts[id].lineIds.some((id)=>data.lots[data.goodsReceiptLines[id].lotId].fabricId===f.fabricId));
   });
 };
 return procurementRows(data,family).filter((r)=>(kind!=='pending'||['DRAFT','APPROVED','PARTIALLY_RECEIVED'].includes(r.status))&&qualifies(r.date,r.supplierId,f.fabricId)&&includesFabric(r));
}
