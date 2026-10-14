import type { DomainState } from '@/domain/entities';
import type { ERPRoute } from '@/routes/registry';
import type { EditorKind } from './ProcurementEditor';
import type { TableColumn } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/tables/StatusBadge';
import { supplierProfile, fabricProfile, supplierLedger, supplierBills, receivedMeters, orderLineTotal, receiptLineValue, purchaseSum } from '@/store/selectors/procurement';
import { formatPKR, formatQuantity } from '@/lib/formatters';
export type Family = EditorKind | 'ledger' | 'reports' | 'dashboard';
export interface Row { id:string; name:string; number:string; date:string; status:string; supplierId:string; fabricId:string; meters:number; amount:number; detail:string; city:string; paymentStatus?:string; debit?:number; credit?:number; balance?:number; type?:string }
export const blank:Row = { id:'',name:'',number:'',date:'',status:'',supplierId:'',fabricId:'',meters:0,amount:0,detail:'',city:'' };
export const paths:Record<EditorKind,string>={supplier:'/suppliers',fabric:'/fabrics',request:'/purchases/requests',po:'/purchases',grn:'/purchases/receipts',bill:'/purchases/bills',payment:'/purchases/payments',return:'/purchases/returns'};
export const labels:Record<Family,string>={supplier:'سپلائرز کا انتظام',fabric:'کپڑے کی اقسام',request:'خریداری کی درخواست',po:'خریداری کے آرڈرز',grn:'مال کی وصولی',bill:'سپلائر بل',payment:'سپلائر ادائیگیاں',return:'خریداری کی واپسی',ledger:'سپلائر کھاتہ',reports:'خریداری رپورٹس',dashboard:'خریداری کا ڈیش بورڈ'};
export const familyFor=(route:ERPRoute):Family=>route.path.includes('/ledger')?'ledger':route.path==='/purchases/reports'?'reports':route.path==='/purchases/dashboard'||route.id==='purchases'?'dashboard':route.module==='suppliers'?'supplier':route.module==='fabrics'?'fabric':route.path.includes('/requests')?'request':route.path.includes('/receipts')?'grn':route.path.includes('/bills')?'bill':route.path.includes('/payments')?'payment':route.path.includes('/returns')?'return':'po';
export const documentUrl=(family:EditorKind,id:string)=>family==='payment'?paths[family]+'?record='+encodeURIComponent(id):paths[family]+'/'+encodeURIComponent(id);
export const statusLabel=(value:string)=>({ACTIVE:'فعال',INACTIVE:'غیر فعال',DRAFT:'مسودہ',APPROVED:'منظور شدہ',POSTED:'پوسٹ شدہ',PARTIALLY_RECEIVED:'جزوی وصولی',COMPLETED:'مکمل وصولی',CANCELLED:'منسوخ',SUBMITTED:'جمع شدہ',REJECTED:'مسترد',CONVERTED:'آرڈر میں تبدیل',CLOSED:'بند',CONFIRMED:'تصدیق شدہ',ACCEPTED:'منظور شدہ',QUARANTINED:'قرنطینہ',PAID:'ادا شدہ',PARTIALLY_PAID:'جزوی ادائیگی',UNPAID:'غیر ادا شدہ'} as Record<string,string>)[value]??value;
export const columns:TableColumn<Row>[]=[
{id:'number',label:'کوڈ / دستاویز',value:(r)=>r.number,technical:true},
{id:'name',label:'نام / سپلائر',value:(r)=>r.name},
{id:'date',label:'تاریخ',value:(r)=>r.date,technical:true},
{id:'status',label:'حالت',value:(r)=>r.status,render:(r)=><StatusBadge status={r.status}/>},
{id:'meters',label:'مقدار — میٹر',value:(r)=>r.meters,render:(r)=>formatQuantity(r.meters)},
{id:'amount',label:'رقم — روپے',value:(r)=>r.amount,exportValue:(r)=>(r.amount/100).toFixed(2),render:(r)=>formatPKR(r.amount)},
{id:'detail',label:'تفصیل',value:(r)=>r.detail},
];
export function procurementRows(data:DomainState,family:EditorKind):Row[] {
 if(family==='supplier')return Object.values(data.suppliers).map((s)=>{const p=supplierProfile(data,s.id),l=supplierLedger(data,s.id);return{...blank,id:s.id,name:s.name,number:p.code,date:s.createdAt.slice(0,10),status:s.status,supplierId:s.id,city:s.city,amount:l.outstanding,detail:s.city+' · '+p.contact+' · '+s.phone+' · '+p.category+' · '+p.termDays+' دن'};});
 if(family==='fabric')return Object.values(data.fabrics).map((f)=>{const p=fabricProfile(data,f.id);return{...blank,id:f.id,name:f.name,number:p.code,date:f.createdAt.slice(0,10),status:f.status,fabricId:f.id,supplierId:p.supplierId,amount:p.ratePaisa,detail:f.composition+' · '+f.widthInches+' انچ · '+p.gsm+' جی ایس ایم'};});
 if(family==='request')return Object.values(data.procurement?.requests??{}).map((r)=>({...blank,id:r.id,name:data.fabrics[r.fabricId].name,number:r.number,date:r.date,status:r.status,fabricId:r.fabricId,meters:r.quantityMeters,detail:r.department+' · '+r.reason}));
 if(family==='po')return Object.values(data.purchaseOrders).map((p)=>({...blank,id:p.id,name:data.suppliers[p.supplierId].name,number:p.number,date:p.orderDate,status:Object.values(data.procurement?.orderProfiles??{}).find((r)=>r.purchaseOrderId===p.id)?.closedAt?'CLOSED':p.status,supplierId:p.supplierId,meters:purchaseSum(p.lineIds,(id)=>data.purchaseOrderLines[id].quantityMeters),amount:purchaseSum(p.lineIds,(id)=>orderLineTotal(data,id)),detail:'وصول '+formatQuantity(purchaseSum(p.lineIds,(id)=>receivedMeters(data,id)))+' · باقی '+formatQuantity(purchaseSum(p.lineIds,(id)=>data.purchaseOrderLines[id].quantityMeters-receivedMeters(data,id)))+' میٹر'}));
 if(family==='grn')return Object.values(data.goodsReceipts).map((r)=>({...blank,id:r.id,name:data.suppliers[data.purchaseOrders[r.purchaseOrderId].supplierId].name,number:r.number,date:r.receivedOn,status:r.status,supplierId:data.purchaseOrders[r.purchaseOrderId].supplierId,meters:purchaseSum(r.lineIds,(id)=>data.goodsReceiptLines[id].quantityMeters),amount:purchaseSum(r.lineIds,(id)=>receiptLineValue(data,id)),detail:data.purchaseOrders[r.purchaseOrderId].number}));
 if(family==='bill')return supplierBills(data).map((r)=>({...blank,id:r.id,name:data.suppliers[r.supplierId].name,number:r.number,date:r.date,status:r.status,supplierId:r.supplierId,amount:r.totalPaisa,detail:'باقی '+formatPKR(r.outstanding)+' · آخری تاریخ '+r.dueOn,paymentStatus:r.paymentStatus}));
 if(family==='payment')return Object.values(data.procurement?.payments??{}).map((r)=>({...blank,id:r.id,name:data.suppliers[r.supplierId].name,number:r.number,date:r.date,status:r.status,supplierId:r.supplierId,amount:r.amountPaisa,detail:'مختص '+formatPKR(purchaseSum(r.allocations,(a)=>a.amountPaisa))+' · غیر مختص '+formatPKR(r.amountPaisa-purchaseSum(r.allocations,(a)=>a.amountPaisa))}));
 return Object.values(data.procurement?.returns??{}).map((r)=>({...blank,id:r.id,name:data.suppliers[r.supplierId].name,number:r.number,date:r.date,status:r.status,supplierId:r.supplierId,fabricId:data.lots[r.lotId].fabricId,meters:r.quantityMeters,amount:r.creditPaisa,detail:r.reason+' · '+data.goodsReceipts[data.goodsReceiptLines[r.goodsReceiptLineId].goodsReceiptId].number}));
}
export function detailPrint(data:DomainState,family:EditorKind,id:string) {
 const row=procurementRows(data,family).find((r)=>r.id===id);
 let headers=columns.map((c)=>c.label),rows=row?[{id:row.id,cells:columns.map((c)=>c.id==='amount'?formatPKR(row.amount):c.id==='meters'?formatQuantity(row.meters):c.id==='status'?statusLabel(row.status):String(c.value(row)))}]:[];
 if(family==='po'){headers=['کپڑا','آرڈر — میٹر','وصول — میٹر','باقی — میٹر','فی میٹر قیمت','لائن قدر'];rows=data.purchaseOrders[id].lineIds.map((id)=>{const l=data.purchaseOrderLines[id];return{id,cells:[data.fabrics[l.fabricId].name,formatQuantity(l.quantityMeters),formatQuantity(receivedMeters(data,id)),formatQuantity(l.quantityMeters-receivedMeters(data,id)),formatPKR(l.unitPricePaisaPerMeter),formatPKR(orderLineTotal(data,id))]};});}
 if(family==='grn'){headers=['کپڑا','لاٹ','منظور شدہ مقدار — میٹر','وصولی قدر'];rows=data.goodsReceipts[id].lineIds.map((id)=>{const l=data.goodsReceiptLines[id];return{id,cells:[data.fabrics[data.lots[l.lotId].fabricId].name,data.lots[l.lotId].code,formatQuantity(l.quantityMeters),formatPKR(receiptLineValue(data,id))]};});}
 if(family==='bill'){const b=data.procurement?.bills[id];if(b){headers=['اصل وصولی','کپڑا','مقدار — میٹر','لائن رقم'];rows=b.lineIds.map((id)=>{const l=data.procurement!.billLines[id],source=data.goodsReceiptLines[l.goodsReceiptLineId];return{id,cells:[data.goodsReceipts[source.goodsReceiptId].number,data.fabrics[data.lots[source.lotId].fabricId].name,formatQuantity(l.quantityMeters),formatPKR(l.amountPaisa)]};});}}
 return{headers,rows};
}
