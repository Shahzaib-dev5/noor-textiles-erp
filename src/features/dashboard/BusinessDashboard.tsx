import { finishedReconciliation } from '@/services/finished-goods/inventory';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Boxes, Factory, ReceiptText } from 'lucide-react';
import { useERPStore } from '@/store';
import { emptyFilters, selectBusinessDashboard, selectReconciliationReport, type DashboardFilters } from '@/store/selectors/business';
import { PageHeading } from '@/components/common/PageHeading';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChart, LineChart, AreaChart, DonutChart, ProgressChart } from '@/components/charts/Charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/DataTable';
import { formatPKR, formatQuantity, formatDate } from '@/lib/formatters';
import { getRoute } from '@/routes/registry';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function BusinessDashboard() {
  const data = useERPStore((s) => s.data); const navigate = useNavigate();
  const [draft, setDraft] = useState<DashboardFilters>(emptyFilters); const [filters, setFilters] = useState<DashboardFilters>(emptyFilters);
  const view = useMemo(() => selectBusinessDashboard(data, filters), [data, filters]);
  const reconciliation = useMemo(() => selectReconciliationReport(data), [data]);
  if (!data.history || !view) return null;
  const finished=finishedReconciliation(data);
  const h = data.history; const invalidDates = Boolean(draft.from && draft.to && draft.from > draft.to);
  const update = (key: keyof DashboardFilters, value: string) => setDraft((f) => ({ ...f, [key]: value }));
  const options: { key: keyof DashboardFilters; label: string; rows: { id: string; name: string }[] }[] = [
    { key: 'collectionId', label: 'کلیکشن', rows: Object.values(h.collections) },
    { key: 'fabricId', label: 'کپڑے کی قسم', rows: Object.values(data.fabrics) },
    { key: 'warehouseId', label: 'گودام', rows: Object.values(data.warehouses) },
    { key: 'contractorId', label: 'ٹھیکیدار', rows: Object.values(data.contractors) },
    { key: 'customerId', label: 'خریدار', rows: Object.values(data.customers) },
    { key: 'pieceCount', label: 'پروڈکٹ کی قسم', rows: [{ id: '2', name: 'دو پیس' }, { id: '3', name: 'تین پیس' }] },
  ];
  const active = [filters.from && 'از ' + filters.from, filters.to && 'تا ' + filters.to, ...options.map((o) => filters[o.key] && o.label + ': ' + o.rows.find((r) => r.id === filters[o.key])?.name)].filter(Boolean).join(' · ');
  const cards: { title: string; value: string; note: string; route: Parameters<typeof getRoute>[0]; finance?: boolean }[] = [
    { title: 'کل انوائس شدہ فروخت', value: formatPKR(view.financial.invoiced), note: 'پوسٹ شدہ انوائس لائنیں؛ آرڈرز کی قدر نہیں', route: 'invoices', finance: true },
    { title: 'وصول شدہ ادائیگیاں', value: formatPKR(view.financial.collections), note: 'نقد / بینک / چیک؛ غیر مختص کریڈٹ سمیت، فروخت نہیں', route: 'payments', finance: true },
    { title: 'خریداروں سے وصول طلب', value: formatPKR(view.financial.outstanding), note: 'ابتدائی بقایا + منتخب انوائسز − مختص ادائیگیاں', route: 'invoices', finance: true },
    { title: 'ریکارڈ شدہ خریداری', value: formatPKR(view.financial.purchases), note: 'پوسٹ شدہ مال وصولی کی قدر', route: 'purchases', finance: true },
    { title: 'ریکارڈ شدہ کاروباری اخراجات', value: formatPKR(view.financial.expenses), note: 'سروس چارجز اور اخراجات؛ مال خریداری الگ', route: 'expenses', finance: true },
    { title: 'محدود مجموعی شراکت', value: formatPKR(view.financial.contribution), note: 'مکمل بیچوں کی فروخت ' + formatPKR(view.financial.contributionSales) + ' پر؛ خالص منافع نہیں، عمومی خرچ / نقصان جذب الگ', route: 'production', finance: true },
    { title: 'کورا کپڑا — میٹر', value: formatQuantity(view.inventory.grey), note: 'موجودہ جسمانی اسٹاک', route: 'grey-inventory' },
    { title: 'پروسیس شدہ کپڑا — میٹر', value: formatQuantity(view.inventory.processed), note: 'تاریخی پیداوار کے مختص مواد کے بعد', route: 'grey-inventory' },
    { title: 'ٹھیکیدار کی تحویل — میٹر', value: formatQuantity(view.inventory.contractor), note: 'جاری منفی واپسی منفی منظور شدہ نقصان', route: 'processing' },
    { title: 'تیار سوٹ کا جسمانی اسٹاک', value: formatQuantity(view.inventory.finished), note: 'فروخت کے لیے دستیاب: ' + view.inventory.available + ' سوٹ', route: 'finished-inventory' },
    { title: 'محفوظ سوٹ', value: formatQuantity(view.inventory.reserved), note: 'ریزرویشن جسمانی اسٹاک کی نئی حرکت نہیں', route: 'sales' },
    { title: 'خراب سوٹ', value: formatQuantity(view.inventory.damaged), note: 'فروخت کے قابل اسٹاک سے الگ', route: 'finished-inventory' },
  ];
  return <>
    <PageHeading title="کاروباری ڈیش بورڈ" eyebrow="مربوط تاریخی کاروباری نمونہ" description={Object.values(data.companies)[0].name + ' · حساب کی تاریخ ' + formatDate(h.asOf)} action={<Button asChild variant="outline"><Link to={getRoute('settings').path}>نمونہ ڈیٹا کی ترتیبات</Link></Button>} />
    <Card className="mb-6 p-5"><h2 className="mb-4 text-lg font-semibold">ڈیش بورڈ فلٹرز</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm">ابتدائی تاریخ<input type="date" aria-label="ابتدائی تاریخ" dir="ltr" className="control mt-1" value={draft.from} max={draft.to || h.asOf} onChange={(e) => update('from', e.target.value)} /></label>
      <label className="text-sm">آخری تاریخ<input type="date" aria-label="آخری تاریخ" dir="ltr" className="control mt-1" value={draft.to} min={draft.from} max={h.asOf} onChange={(e) => update('to', e.target.value)} /></label>
      {options.map((o) => <label key={o.key} className="text-sm">{o.label}<select aria-label={o.label} className="control mt-1" value={draft[o.key]} onChange={(e) => update(o.key, e.target.value)}><option value="">سب</option>{o.rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>)}
    </div>{invalidDates && <p role="alert" className="mt-3 text-sm text-destructive">ابتدائی تاریخ آخری تاریخ کے بعد نہیں ہو سکتی۔</p>}<div className="mt-4 flex flex-wrap gap-3"><Button disabled={invalidDates} onClick={() => setFilters(draft)}>فلٹرز لاگو کریں</Button><Button variant="outline" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); }}>فلٹرز صاف کریں</Button></div>
    <p aria-live="polite" className="mt-4 text-sm">فعال فلٹرز: {active || 'تمام ریکارڈ'}</p><p className="mt-2 text-xs leading-7 text-muted-foreground">تاریخ آمد و خرچ اور سرگرمی پر ہے؛ اسٹاک اور کھلے چالان حساب کی تاریخ پر ہیں۔ خریدار کا فلٹر فروخت / ادائیگیوں پر ہے۔ کلیکشن / پروڈکٹ فلٹر نقد رقم کو تقسیم نہیں کرتا۔ جزوی مصنوعات پر انوائس کی وصول طلب تناسب سے دکھائی جاتی ہے۔ تمام ریکارڈ فرضی ہیں، کوئی ٹیکس شامل نہیں۔</p></Card>
    <section aria-label="کاروباری اشاریے" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((c) => <StatCard key={c.title} title={c.title} value={c.value} subtitle={c.note} icon={c.finance ? Banknote : Boxes} onClick={() => navigate(getRoute(c.route).path)} />)}</section>
    <div className="mb-6 grid gap-5 xl:grid-cols-3"><Card className="p-5"><h2 className="text-lg font-semibold">پروسیسنگ کا خلاصہ</h2><dl className="mt-4 grid grid-cols-2 gap-4">{[['کھلے چالان', view.processing.open], ['جزوی وصولی', view.processing.partial], ['تاخیر والے کام', view.processing.late], ['واپسی — میٹر', view.processing.returned], ['منظور شدہ نقصان — میٹر', view.processing.loss]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="number mt-1 text-xl">{formatQuantity(Number(value))}</dd></div>)}</dl></Card>
      <Card className="p-5"><Factory className="mb-2 size-5 text-primary" /><h2 className="text-lg font-semibold">پیداوار کا خلاصہ</h2><p className="mt-3 text-sm leading-8">فعال بیچ {view.production.active} · منصوبہ بند {view.production.planned} · مکمل {view.production.completed} · مسترد {view.production.rejected} · جاری سوٹ {view.production.inProgress}</p><p className="mt-2 text-sm">WIP مواد: <bdi>{formatQuantity(view.inventory.wip)}</bdi> میٹر</p><progress className="mt-4 h-2 w-full" value={view.production.completed} max={view.production.target || 1} aria-label="پیداوار کی تکمیل" /><p className="mt-2 text-sm">{view.production.completion}% مکمل</p></Card>
      <Card className="p-5"><ReceiptText className="mb-2 size-5 text-primary" /><h2 className="text-lg font-semibold">فروخت اور وصول طلب</h2><p className="mt-3 text-sm leading-8">آرڈرز {view.sales.orders} · کھلے {view.sales.open} · ڈسپیچ شدہ {view.sales.dispatched} · انوائسز {view.sales.invoices}</p><p className="text-sm leading-8">اوسط انوائس: <bdi>{formatPKR(view.financial.averageInvoice)}</bdi></p><p className="text-sm leading-8">موجودہ وصول طلب: <bdi>{formatPKR(view.financial.current)}</bdi></p><p className="text-sm leading-8 text-warning-foreground">تاخیر والی وصول طلب: <bdi>{formatPKR(view.financial.overdue)}</bdi></p></Card></div>
    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <BarChart title="ماہانہ خریداری" data={view.charts.purchases} money valueLabel="مال وصولی کی قدر" />
      <LineChart title="ماہانہ انوائس شدہ فروخت" data={view.charts.sales} money valueLabel="انوائس قدر" />
      <AreaChart title="ماہانہ ادائیگیوں کی وصولی" data={view.charts.collections} money valueLabel="وصولی" />
      <DonutChart title="کپڑے کی انوینٹری — میٹر" data={view.charts.inventory} valueLabel="میٹر" />
      <DonutChart title="پیداواری بیچوں کی حالت" data={view.charts.production} valueLabel="بیچ" />
      <ProgressChart title="ٹھیکیدار کے کھلے پروسیسنگ کام" data={view.charts.contractors} valueLabel="کام" />
      <BarChart title="سب سے زیادہ فروخت شدہ ڈیزائن" data={view.charts.topDesigns} valueLabel="انوائس شدہ سوٹ" />
      <ProgressChart title="خریدار کی وصول طلب" data={view.charts.outstanding} money valueLabel="وصول طلب" />
      <BarChart title="کلیکشن کے لحاظ سے دستیاب سوٹ" data={view.charts.collectionStock} valueLabel="سوٹ" />
      <DonutChart title="ریکارڈ شدہ اخراجات کی تقسیم" data={view.charts.expenses} money valueLabel="خرچ" />
      <BarChart title="کلیکشن کے لحاظ سے مکمل پیداوار" data={view.charts.collectionProduction} valueLabel="سوٹ" />
    </div>
    <div className="mb-6"><DataTable title="خریداروں کے حساب" rows={view.customers} rowId={(r) => r.id} columns={[{ id: 'name', label: 'خریدار', value: (r) => r.name, sortable: true }, { id: 'sales', label: 'انوائس شدہ فروخت', value: (r) => r.sales, render: (r) => formatPKR(r.sales), sortable: true }, { id: 'balance', label: 'وصول طلب', value: (r) => r.outstanding, render: (r) => formatPKR(r.outstanding), sortable: true }]} onDetails={(r) => navigate(getRoute('customers').path + '?record=' + encodeURIComponent(r.id))} /></div>
    <div className="mb-6 grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">کاروباری انتباہات</h2><p className="mb-3 text-xs text-muted-foreground">پورے کاروبار کے انتباہات · حساب کی تاریخ {h.asOf}؛ فلٹرز سے چھپائے نہیں جاتے۔</p><ul className="max-h-96 space-y-3 overflow-auto">{view.alerts.map((a) => <li key={a.id + a.title}><Link className="block rounded-xl border border-border p-3 hover:bg-muted" to={a.path}><p className="text-sm font-semibold">{a.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{a.description}</p></Link></li>)}</ul></Card>
      <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">حالیہ کاروباری سرگرمیاں</h2><ul className="space-y-3">{view.activity.slice(0, 10).map((a) => <li key={a.id}><Link className="block rounded-xl border border-border p-3 hover:bg-muted" to={a.path + '?record=' + encodeURIComponent(a.id)}><p className="text-sm">{a.label} · <bdi className="number">{a.number}</bdi></p><p className="mt-1 text-xs text-muted-foreground">{formatDate(a.date)}</p></Link></li>)}</ul></Card></div>
    <Card className="mb-6 p-5"><h2 className="mb-3 text-lg font-semibold">مکمل کاروباری مصالحت</h2><p className="text-sm leading-8">مواد: خرید {formatQuantity(reconciliation.fabric.purchased)} + خالص گودام ایڈجسٹمنٹ {formatQuantity(reconciliation.fabric.adjustmentNet??0)} = کورا {formatQuantity(reconciliation.fabric.grey)} + پروسیس شدہ {formatQuantity(reconciliation.fabric.processed)} + تحویل {formatQuantity(reconciliation.fabric.contractor)} + پروسیسنگ نقصان {formatQuantity(reconciliation.fabric.loss)} + پیداوار میں مختص {formatQuantity(reconciliation.production.consumed)} + خریداری واپسی {formatQuantity(reconciliation.fabric.returned ?? 0)} + پیداواری WIP {formatQuantity(reconciliation.fabric.productionWIP??0)} + کٹنگ ضیاع {formatQuantity(reconciliation.fabric.productionScrap??0)} میٹر۔</p><p className="text-sm leading-8">مختص مواد = مصنوعات / مسترد میں شامل {formatQuantity(reconciliation.production.embedded)} + WIP {formatQuantity(reconciliation.production.wip)} + کٹنگ نقصان {formatQuantity(reconciliation.production.waste)} میٹر۔</p>{data.finishing?<p className="text-sm leading-8">تیار سوٹ: ابتدائی {finished.opening} + نئی وصولی {finished.receipts} + منظور خالص درستگی {finished.adjustments} − نئی ترسیل {finished.dispatched} = جسمانی {finished.physical}؛ دستیاب {finished.available} + محفوظ {finished.reserved} + ہولڈ {finished.held} + خراب / قرنطینہ {finished.damaged}۔ کارٹن کے {finished.cartoned} سوٹ اسی جسمانی اسٹاک کا حصہ ہیں۔</p>:<p className="text-sm leading-8">تیار سوٹ: پیک {reconciliation.finished.produced} − ڈسپیچ {reconciliation.finished.dispatched} − خراب {reconciliation.finished.damaged} = جسمانی {reconciliation.finished.physical}؛ دستیاب {reconciliation.finished.available} + محفوظ {reconciliation.finished.reserved}۔</p>}<p className="text-sm leading-8">ابتدائی بقایا <bdi>{formatPKR(reconciliation.financial.openingReceivable)}</bdi> + انوائس <bdi>{formatPKR(reconciliation.financial.invoiced)}</bdi> = مختص ادائیگی <bdi>{formatPKR(reconciliation.financial.allocated)}</bdi> + وصول طلب <bdi>{formatPKR(reconciliation.financial.outstanding)}</bdi>۔ غیر مختص خریدار کریڈٹ: <bdi>{formatPKR(reconciliation.financial.unappliedCredit)}</bdi>۔</p><p className="mt-2 text-xs leading-6 text-muted-foreground">سپلائر کے پوسٹ شدہ بل: {formatPKR(reconciliation.financial.supplierPayable)}؛ مختص سپلائر ادائیگیاں اور منظور شدہ کریڈٹ کھاتے میں شامل ہیں۔ یہ مکمل مصالحت فلٹرز سے آزاد ہے۔ اخراجات، تخمینہ اور نقد وصولی الگ ہیں۔</p></Card>
    <QuickActions />
  </>;
}
