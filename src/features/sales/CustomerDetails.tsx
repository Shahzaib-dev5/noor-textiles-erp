import { Link } from 'react-router-dom';
import { useERPStore } from '@/store';
import { wholesaleView,wholesalePath,wholesaleLabels as L,reportingDay } from '@/store/selectors/wholesale';
import { customerProfile } from '@/services/pricing/wholesale';
import { customerCredit } from '@/services/wholesale/credit';
import { selectInvoiceBalances } from '@/store/selectors/business';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/tables/DataTable';
import { formatPKR } from '@/lib/formatters';
export function CustomerDetails({id}:{id:string}){
 const d=useERPStore(s=>s.data),v=wholesaleView(d),p=customerProfile(d,id),credit=customerCredit(d,id,reportingDay()),invoices=selectInvoiceBalances(d).filter(i=>i.customerId===id),payments=Object.values(d.history?.payments??{}).filter(p=>p.customerId===id);
 const statement=[{id:'opening',number:'ابتدائی بقایا',date:'',debit:d.customers[id].openingBalancePaisa,credit:0},...invoices.map(i=>({id:i.id,number:i.number,date:i.date,debit:i.totalPaisa,credit:0})),...Object.values(d.history?.paymentAllocations??{}).filter(a=>d.history!.invoices[a.invoiceId].customerId===id).map(a=>({id:a.id,number:d.history!.payments[a.paymentId].number+' / '+d.history!.invoices[a.invoiceId].number,date:d.history!.payments[a.paymentId].date,debit:0,credit:a.amountPaisa}))].sort((a,b)=>a.date.localeCompare(b.date));
 let balance=0;const entries=statement.map(r=>({...r,balance:balance+=r.debit-r.credit}));
 const metrics:[string,number][]=[['کریڈٹ حد',credit.creditLimitPaisa],['اصل وصول طلب',credit.postedOutstanding],['غیر بل ترسیل',credit.unbilledPaisa],['باقی منظور آرڈر',credit.commitmentPaisa],['کل ایکسپوژر',credit.exposurePaisa],['دستیاب کریڈٹ',credit.availableCreditPaisa],['حد سے زائد',credit.excessPaisa],['تاخیر شدہ انوائس',credit.overduePaisa],['غیر مختص پرانی وصولی',credit.unappliedPaisa]];
 return <section className="space-y-4"><h3 className="text-lg font-semibold">گاہک کی کریڈٹ حد اور مالی خلاصہ</h3><p>{p.code} · {p.owner} · {d.customers[id].city} · {p.address} · {L[p.paymentTerms]}، {p.termDays} دن۔ {p.creditHold?'کریڈٹ ہولڈ فعال':'کریڈٹ ہولڈ نہیں'}۔ {p.creditNotes}</p>
 <div className="grid gap-3 md:grid-cols-3">{metrics.map(([label,value])=><Card className="p-3" key={label}><p>{label}</p><bdi>{formatPKR(value)}</bdi></Card>)}</div>
 <DataTable title="اصل انوائس اور مختص ادائیگی کا بیان" rows={entries} rowId={r=>r.id} columns={[{id:'number',label:'اصل حوالہ',value:r=>r.number},{id:'date',label:'تاریخ',value:r=>r.date},{id:'debit',label:'وصول طلب PKR',value:r=>formatPKR(r.debit),exportValue:r=>r.debit/100},{id:'credit',label:'مختص وصولی PKR',value:r=>formatPKR(r.credit),exportValue:r=>r.credit/100},{id:'balance',label:'باقی PKR',value:r=>formatPKR(r.balance),exportValue:r=>r.balance/100}]}/>
 <DataTable title="اصل نقد / بینک رسیدیں (انوائس سے الگ)" rows={payments} rowId={r=>r.id} columns={[{id:'number',label:'رسید',value:r=>r.number},{id:'date',label:'تاریخ',value:r=>r.date},{id:'amount',label:'اصل رقم PKR',value:r=>formatPKR(r.amountPaisa),exportValue:r=>r.amountPaisa/100},{id:'reference',label:'حوالہ',value:r=>r.reference}]}/>
 {(['orders','dispatches']as const).map(f=><DataTable key={f} title={f==='orders'?'گاہک کے تمام آرڈرز':'گاہک کی تمام ترسیل'} rows={v.rows[f].filter(r=>r.customerId===id)} rowId={r=>r.id} columns={[{id:'number',label:'اصل دستاویز',value:r=>r.number},{id:'status',label:'حالت',value:r=>L[r.status]??r.status},{id:'quantity',label:'سوٹ',value:r=>r.quantity},{id:'net',label:'تجارتی قیمت PKR',value:r=>formatPKR(r.valuePaisa),exportValue:r=>r.valuePaisa/100}]} onDetails={r=>window.location.assign(r.path)}/>)}
 <Link to={wholesalePath('orders')} className="text-primary underline">فروخت کے تمام آرڈرز</Link></section>;
}
