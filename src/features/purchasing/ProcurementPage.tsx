import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useERPStore, type ActionResult } from '@/store';
import { executeProcurement, canProcure, type ProcurementCommand } from '@/services/transactions/procurement';
import { ProcurementEditor, type EditorKind } from './ProcurementEditor';
import { ProcurementDetails } from './ProcurementDetails';
import { PurchaseDashboard } from './PurchaseDashboard';
import { PurchaseReports } from './PurchaseReports';
import { familyFor, paths, labels, documentUrl, procurementRows, columns, statusLabel } from './view-model';
import { PageHeading } from '@/components/common/PageHeading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmationDialog } from '@/components/dialogs/Dialog';
import { ResultNotice } from '@/components/feedback/ResultNotice';
import { useToast } from '@/store/toasts';
import type { DomainState } from '@/domain/entities';
import type { ERPRoute } from '@/routes/registry';
function idsFor(data:DomainState,family:EditorKind) {return family==='supplier'?Object.keys(data.suppliers):family==='fabric'?Object.keys(data.fabrics):family==='po'?Object.keys(data.purchaseOrders):family==='grn'?Object.keys(data.goodsReceipts):Object.keys(data.procurement?.[family==='request'?'requests':family==='bill'?'bills':family==='payment'?'payments':'returns']??{});}
export default function ProcurementPage({route}:{route:ERPRoute}) {
 const data=useERPStore((s)=>s.data),role=useERPStore((s)=>s.role),navigate=useNavigate(),params=useParams(),[query]=useSearchParams();
 const family=familyFor(route),id=params.id??query.get('record')??undefined,editing=route.path.endsWith('/new')||route.path.endsWith('/edit')||query.get('edit')==='1';
 const [result,setResult]=useState<ActionResult|null>(null),[pending,setPending]=useState<ProcurementCommand|null>(null);
 const action=(command:ProcurementCommand):ActionResult=>{
   const outcome=useERPStore.getState().applyTransaction((state)=>executeProcurement(state,command,{at:new Date().toISOString(),actorId:Object.values(state.employees).find((e)=>e.status==='ACTIVE')!.id,role:useERPStore.getState().role}));
   setResult(outcome);useToast.getState().add(outcome.message,outcome.ok?'success':'error');return outcome;
 };
 const save=(command:ProcurementCommand)=>{
   if(family==='ledger'||family==='reports'||family==='dashboard')return{ok:false,message:'اس صفحے پر فارم موجود نہیں۔'};
   const beforeIds=idsFor(useERPStore.getState().data,family),outcome=action(command);
   if(outcome.ok){const next=useERPStore.getState().data,destination=('id'in command&&command.id)||idsFor(next,family).find((id)=>!beforeIds.includes(id));navigate(destination?documentUrl(family,destination):paths[family]);}
   return outcome;
 };
 const button=(label:string,command:ProcurementCommand)=><Button key={label} disabled={!canProcure(role,command.kind,'action'in command?command.action:undefined)} onClick={()=>setPending(command)}>{label}</Button>;
 const isFormFamily=family!=='ledger'&&family!=='reports'&&family!=='dashboard';
 const missing=id&&isFormFamily&&!procurementRows(data,family).some((r)=>r.id===id);
 const mainTitle=missing&&family==='supplier'?'سپلائرز':editing?(id?'ترمیم کریں — ':'نیا ریکارڈ — ')+labels[family]:labels[family];
 const rows=isFormFamily?procurementRows(data,family):[];
 const cities=[...new Set(rows.map((r)=>r.city))].filter(Boolean);
 return <>
 <PageHeading title={mainTitle} description="ایک کمپنی کا مربوط مقامی خریداری نظام؛ رقم پیسے اور کپڑا میٹر میں محفوظ ہوتا ہے۔" action={!editing&&isFormFamily?<Button asChild><Link to={paths[family]+'/new'}>نیا ریکارڈ شامل کریں</Link></Button>:undefined}/>
 <nav aria-label="خریداری کے صفحات" className="no-print mb-6 flex flex-wrap gap-2">{[...Object.entries(paths).map(([key,path])=>({label:labels[key as EditorKind],path})),{label:labels.reports,path:'/purchases/reports'}].map((r)=><Button key={r.path} asChild variant="outline" size="sm"><Link to={r.path}>{r.label}</Link></Button>)}</nav>
 <div className="mb-4"><ResultNotice result={result}/></div><p className="no-print mb-4 text-xs text-muted-foreground">منتخب کردار صرف نمائشی عملی اجازت ہے؛ محفوظ مالیاتی اختیار نہیں۔</p>
 {editing&&isFormFamily?<ProcurementEditor key={route.path+(id??'')} kind={family} data={data} id={id} onSave={save} onCancel={()=>navigate(paths[family])}/>:family==='dashboard'?<PurchaseDashboard data={data}/>:family==='ledger'?id&&data.suppliers[id]?<PurchaseReports data={data} supplierId={id}/>:<p role="alert">سپلائر نہیں ملا۔</p>:family==='reports'?<PurchaseReports data={data}/>:id&&isFormFamily?<ProcurementDetails data={data} family={family} id={id} button={button}/>:isFormFamily?<DataTable title={family==='supplier'?'سپلائرز کا رجسٹر':labels[family]} rows={rows} columns={[...columns,...(family==='supplier'||family==='fabric'?[{id:'actions',label:'عملی کارروائیاں',value:()=>'',sortable:false,render:(r:typeof rows[number])=><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to={documentUrl(family,r.id)+'/edit'}>ترمیم</Link></Button>{family==='supplier'&&<Button asChild variant="outline" size="sm"><Link to={documentUrl('supplier',r.id)+'/ledger'}>کھاتہ</Link></Button>}{r.status==='ACTIVE'&&button('غیر فعال کریں',{kind:family==='supplier'?'deactivateSupplier':'deactivateFabric',id:r.id})}</div>}]:[])]} rowId={(r)=>r.id} filters={[{id:'status',label:'حالت',options:[...new Set(rows.map((r)=>r.status))].filter(Boolean).map((value)=>({value,label:statusLabel(value)})),matches:(r,v)=>r.status===v},...(cities.length?[{id:'city',label:'شہر',options:cities.map((value)=>({value,label:value})),matches:(r:typeof rows[number],v:string)=>r.city===v}]:[])]} onDetails={(r)=>navigate(documentUrl(family,r.id))}/>:null}
 <ConfirmationDialog open={Boolean(pending)} onClose={()=>setPending(null)} title="خریداری کارروائی کی تصدیق" description="کارروائی کی جانچ کے بعد مربوط کاروباری ریکارڈ ایک ساتھ محفوظ ہوں گے۔ پوسٹ شدہ ریکارڈ کی سابقہ تاریخ برقرار رہے گی۔" confirmLabel="تصدیق کریں" onConfirm={()=>{if(pending)action(pending);setPending(null);}}/>
 </>;
}

