import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, Factory, FlaskConical, Package, ReceiptText, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DonutChart, BarChart } from '@/components/charts/Charts';
import { DataTable, type TableColumn } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/tables/StatusBadge';
import { DetailsDrawer } from '@/components/dialogs/Dialog';
import { EmptyState } from '@/components/feedback/states';
import { useERPStore } from '@/store';
import { selectEnterpriseDashboard, selectNotifications } from '@/store/selectors/ui';
import { formatDate, formatPKR, formatQuantity } from '@/lib/formatters';
import { getRoute } from '@/routes/registry';

type RecentTransaction = ReturnType<typeof selectEnterpriseDashboard>['recent'][number];
const transactionColumns: TableColumn<RecentTransaction>[] = [
  { id: 'number', label: 'دستاویز', value: (r) => r.number, technical: true },
  { id: 'type', label: 'قسم', value: (r) => r.type },
  { id: 'quantity', label: 'مقدار (میٹر)', value: (r) => r.quantity, technical: true, render: (r) => formatQuantity(r.quantity) },
  { id: 'status', label: 'حالت', value: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  { id: 'date', label: 'تاریخ', value: (r) => r.date, render: (r) => formatDate(r.date) },
];
export default function DashboardPage() {
  const data = useERPStore((s) => s.data);
  const summary = selectEnterpriseDashboard(data); const notices = selectNotifications(data); const navigate = useNavigate();
  const [period, setPeriod] = useState('all'); const [transaction, setTransaction] = useState<RecentTransaction | null>(null);
  const years = [...new Set(summary.trend.map((row) => row.day.slice(0, 4)))];
  const trend = summary.trend.filter((row) => period === 'all' || row.day.startsWith(period));
  const unavailable = 'آئندہ مرحلے میں';
  return <>
    <PageHeading title="کاروباری ڈیش بورڈ" description={summary.companyName + ' — کاروبار کی مجموعی صورتحال'} eyebrow="آپ کے کاروبار کا مرکز" action={<Button asChild variant="outline"><Link to={getRoute('diagnostics').path}>انوینٹری کی جانچ<ArrowLeft /></Link></Button>} />
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-5 py-3 text-sm"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-success" />مربوط مقامی ڈیمو · {summary.reconciled ? 'اسٹاک کی مصالحت درست ہے' : 'اسٹاک کی جانچ درکار ہے'}</span><span className="text-xs text-muted-foreground">تاریخی ریکارڈ؛ براہِ راست کاروباری سرگرمی نہیں</span></div>
    <section aria-label="کپڑے کے موجودہ بیلنس" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="کل خریداری" value={summary.purchaseValuePaisa === null ? unavailable : formatPKR(summary.purchaseValuePaisa)} icon={ReceiptText} subtitle="پوسٹ شدہ مال وصولی کی قدر؛ سپلائر انوائس نہیں" status={summary.purchaseValuePaisa === null ? 'upcoming' : 'available'} onClick={() => navigate(getRoute('purchases').path)} />
      <StatCard title="کل فروخت" value={unavailable} icon={ShoppingBag} status="upcoming" subtitle="فروخت کے پوسٹ شدہ ریکارڈ ابھی دستیاب نہیں" onClick={() => navigate(getRoute('sales').path)} />
      <StatCard title="کل منافع" value={unavailable} icon={TrendingUp} status="upcoming" subtitle="فروخت اور لاگت کے ماڈیول کے بعد" />
      <StatCard title="زیرِ وصول رقم" value={unavailable} icon={Wallet} status="upcoming" subtitle="انوائس اور ادائیگی کے ریکارڈ کے بعد" onClick={() => navigate(getRoute('payments').path)} />
      <StatCard title="کورے کپڑے کا اسٹاک" value={formatQuantity(summary.grey)} icon={Boxes} subtitle="گودام میں دستیاب · میٹر" onClick={() => navigate(getRoute('grey-inventory').path)} />
      <StatCard title="پروسیس شدہ کپڑا" value={formatQuantity(summary.processed)} icon={Package} subtitle="اصل وصولی سے حاصل شدہ · میٹر" />
      <StatCard title="زیرِ پروسیسنگ کپڑا" value={formatQuantity(summary.contractor)} icon={FlaskConical} subtitle="ٹھیکیدار کے پاس بقایا · میٹر" onClick={() => navigate(getRoute('processing').path)} />
      <StatCard title="تیار سوٹ" value={formatQuantity(summary.finishedSuits)} icon={Factory} subtitle="نمونہ SKU کیٹلاگ ہے؛ تیار سوٹ کا اسٹاک صفر" onClick={() => navigate(getRoute('finished-inventory').path)} />
    </section>
    <div className="mb-6 grid min-w-0 gap-5 xl:grid-cols-[1.45fr_1fr]"><div className="min-w-0"><div className="mb-2 flex justify-end"><label className="flex items-center gap-2 text-xs text-muted-foreground">مدت<select className="control w-28 text-xs" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">تمام ریکارڈ</option><option value="recent">گزشتہ ۳۰ دن</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label></div><BarChart title="خریداری اور فروخت کا رجحان" description="مال وصولی کی قدر؛ فروخت کی سیریز آئندہ مرحلے میں دستیاب ہو گی۔" data={period === 'recent' ? summary.trend.filter((r) => new Date(r.day).valueOf() >= Date.now() - 30 * 86400000) : trend} valueLabel="وصول شدہ خریداری کی قدر" money /></div><div className="min-w-0 xl:pt-[52px]"><DonutChart title="کپڑے کی انوینٹری کی تقسیم" description="ہر مقدار اصل پوسٹ شدہ حرکات سے حاصل ہوتی ہے۔" data={summary.distribution} valueLabel="میٹر" /></div></div>
    <Card className="mb-6 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">مینوفیکچرنگ کا سفر</h2><p className="text-xs text-muted-foreground">تسلیم شدہ نقصان: <bdi className="number">{formatQuantity(summary.loss)}</bdi> میٹر</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
      ['وصول شدہ کپڑا', formatQuantity(summary.purchased) + ' میٹر', 'goodsReceipt'],
      ['کورا گودام', formatQuantity(summary.grey) + ' میٹر', 'grey'],
      ['پروسیسنگ میں', formatQuantity(summary.contractor) + ' میٹر', 'contractor'],
      ['پروسیس شدہ', formatQuantity(summary.processed) + ' میٹر', 'processed'],
      ['پیداوار و پیکنگ', unavailable, 'future'],
    ].map(([label, value, id], index) => <div key={id} className="rounded-xl border border-border bg-muted/35 p-4"><span className="number text-xs text-muted-foreground">0{index + 1}</span><p className="mt-3 text-sm font-medium">{label}</p><p className="mt-1 text-sm text-primary"><bdi>{value}</bdi></p></div>)}</div></Card>
    <div className="mb-6 grid gap-5 xl:grid-cols-3"><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">پروسیسنگ ملز کی صورتحال</h2>{summary.contractors.length ? <div className="space-y-4">{summary.contractors.map((contractor) => <div key={contractor.id} className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">{contractor.name}</p><p className="my-2 text-sm text-muted-foreground">بقایا <bdi className="number text-warning-foreground">{formatQuantity(contractor.held)}</bdi> میٹر · جاری <bdi className="number">{formatQuantity(contractor.issued)}</bdi> میٹر</p><progress className="h-1.5 w-full accent-primary" value={contractor.settled} max={contractor.issued || 1} aria-label={contractor.name + ' مکمل شدہ مقدار'} /><Link className="mt-3 block text-xs text-primary" to={getRoute('processing').path}>چالان کا ماڈیول دیکھیں ←</Link></div>)}</div> : <EmptyState title="کوئی ٹھیکیدار نہیں" />}</Card><ActivityFeed activities={summary.activities} /><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">زیرِ انتظار کارروائیاں اور اسٹاک انتباہات</h2>{notices.length ? <ul className="space-y-3">{notices.map((notice) => <li key={notice.id}><Link to={notice.path} className="block rounded-xl border border-border p-3 hover:bg-muted"><p className="text-sm font-medium">{notice.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{notice.description}</p></Link></li>)}</ul> : <EmptyState title="کوئی زیرِ انتظار کارروائی نہیں" />}<p className="mt-4 text-xs leading-6 text-muted-foreground">تاخیر کا انتباہ نہیں بنایا جاتا؛ موجودہ ماڈل میں متوقع وصولی کی تاریخ درج نہیں۔</p></Card></div>
    <div className="mb-6"><QuickActions /></div><DataTable title="تازہ دستیاب لین دین" rows={summary.recent} columns={transactionColumns} rowId={(row) => row.id} onDetails={setTransaction} />
    <DetailsDrawer open={Boolean(transaction)} onClose={() => setTransaction(null)} title="اصل لین دین کی تفصیل">{transaction && <dl className="space-y-4">{[['دستاویز', transaction.number], ['قسم', transaction.type], ['حوالہ', transaction.source], ['تاریخ', formatDate(transaction.date)], ['مقدار (میٹر)', formatQuantity(transaction.quantity)]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-base"><bdi>{value}</bdi></dd></div>)}<StatusBadge status={transaction.status} /></dl>}</DetailsDrawer>
  </>;
}
