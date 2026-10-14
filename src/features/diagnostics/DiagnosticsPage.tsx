import { useState } from 'react';
import { Check, CheckCircle2, FileText, FlaskConical, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResultNotice } from '@/components/feedback/ResultNotice';
import { useERPStore, type ActionResult, type ScenarioAction } from '@/store';
import { selectInspector, selectScenarioStep } from '@/store/selectors';
import { formatQuantity } from '@/lib/formatters';
import { inventoryCategoryLabels, t } from '@/locales/ur';
import { cn } from '@/lib/utils';

const scenarioSteps: { action: ScenarioAction; title: string; detail: string; quantity: string }[] = [
  { action: 'goodsReceipt', title: 'خریدی گئی مقدار وصول کریں', detail: 'وصولی پوسٹ ہو گی اور کورے کپڑے کا اسٹاک بڑھے گا۔', quantity: '1,000 m' },
  { action: 'processingIssue', title: 'پروسیسنگ کے لیے جاری کریں', detail: 'کورا کپڑا گودام سے ٹھیکیدار کے پاس منتقل ہو گا۔', quantity: '400 m' },
  { action: 'processingReceipt', title: 'جزوی وصولی درج کریں', detail: '۳۸۰ میٹر کپڑا اور ۱۰ میٹر منظور شدہ نقصان درج ہو گا۔', quantity: '380 m + 10 m' },
];

export default function DiagnosticsPage() {
  const [source, setSource] = useState<'saved' | 'scenario'>('saved');
  const [result, setResult] = useState<ActionResult | null>(null);
  const data = useERPStore((state) => state.data);
  const scenario = useERPStore((state) => state.scenario);
  const runScenario = useERPStore((state) => state.runScenario);
  const resetScenario = useERPStore((state) => state.resetScenario);
  const inspection = selectInspector(source === 'saved' ? data : scenario);
  const step = selectScenarioStep(scenario);
  const balances = [
    { label: t('grey'), quantity: inspection.balances.grey },
    { label: t('processed'), quantity: inspection.balances.processed },
    { label: t('contractor'), quantity: inspection.balances.contractor },
    { label: t('loss'), quantity: inspection.balances.loss },
  ];
  const total = balances.reduce((sum, entry) => sum + entry.quantity, 0);

  return <>
    <PageHeading title={t('diagnostics')} description="بنیادی لین دین، اسٹاک کی حرکات اور مقدار کے حساب کی جانچ۔" eyebrow="مرحلہ ۱ · تشخیصی منظر" />
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5" role="group" aria-label="ڈیٹا کا انتخاب">
      <Button variant={source === 'saved' ? 'default' : 'ghost'} aria-pressed={source === 'saved'} onClick={() => { setSource('saved'); setResult(null); }}><FileText />محفوظ گولڈن ریکارڈ</Button>
      <Button variant={source === 'scenario' ? 'default' : 'ghost'} aria-pressed={source === 'scenario'} onClick={() => { setSource('scenario'); setResult(null); }}><FlaskConical />آزمائشی منظرنامہ</Button>
    </div>
    {source === 'scenario' ? <Card className="mb-6 p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">صفر اسٹاک سے شروع کریں</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">یہ الگ، عارضی منظرنامہ ہے۔ مرکزی ڈیمو ڈیٹا تبدیل نہیں ہو گا۔ ہر مرحلہ صرف ایک بار پوسٹ ہوتا ہے۔</p></div><Button variant="outline" onClick={() => { resetScenario(); setResult({ ok: true, message: 'آزمائشی منظرنامہ ابتدائی حالت میں آ گیا۔' }); }}><RotateCcw />منظرنامہ ری سیٹ کریں</Button></div><ol className="grid gap-4 lg:grid-cols-3">{scenarioSteps.map((item, index) => {
      const complete = step > index;
      const active = step === index;
      return <li key={item.action} className={cn('rounded-xl border border-border p-4', active && 'border-primary/40 bg-primary/5')}><div className="mb-3 flex items-center justify-between"><span className={cn('flex size-8 items-center justify-center rounded-full text-sm', complete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{complete ? <Check className="size-4" /> : index + 1}</span><span dir="ltr" className="number text-xs text-muted-foreground">{item.quantity}</span></div><h3 className="text-lg font-semibold">{item.title}</h3><p className="mb-4 mt-1 min-h-14 text-sm leading-7 text-muted-foreground">{item.detail}</p><Button className="w-full" variant={complete ? 'outline' : 'default'} disabled={!active} onClick={() => setResult(runScenario(item.action))}>{complete ? <CheckCircle2 /> : <Play />}{complete ? 'پوسٹ ہو چکا ہے' : active ? 'لین دین پوسٹ کریں' : 'پچھلا مرحلہ مکمل کریں'}</Button></li>;
    })}</ol><div className="mt-4"><ResultNotice result={result} /></div></Card> : <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-primary"><ShieldCheck className="mt-1 size-5 shrink-0" /><p className="text-base leading-7">یہ مرکزی محفوظ ریکارڈ ہے۔ دوبارہ پوسٹنگ سے بچنے کے لیے تجرباتی لین دین الگ منظرنامے میں چلائیں۔</p></div>}
    <section aria-label="منتخب ریکارڈ کے بیلنس" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{balances.map((balance) => <Card className="p-5" key={balance.label}><p className="mb-3 text-base text-muted-foreground">{balance.label}</p><p className="flex items-baseline gap-2"><span dir="ltr" className="number text-3xl font-semibold">{formatQuantity(balance.quantity)}</span><span className="text-sm text-muted-foreground">{t('meter')}</span></p></Card>)}</section>
    <Card className="mb-6 p-5 sm:p-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">مقدار کی مصالحت</h2><Badge className={inspection.reconciled ? 'border-primary/20 bg-primary/5 text-primary' : 'text-destructive'}>{inspection.reconciled ? 'مقدار کا حساب درست ہے' : 'مقدار میں فرق موجود ہے'}</Badge></div><p className="text-base leading-8 text-muted-foreground">کل خرید: <bdi className="number font-semibold text-foreground">{formatQuantity(inspection.purchased)}</bdi> میٹر · ٹھیکیدار کو جاری: <bdi className="number font-semibold text-foreground">{formatQuantity(inspection.issued)}</bdi> میٹر</p><div dir="ltr" className="number mt-4 overflow-x-auto rounded-xl bg-muted px-4 py-3 text-center text-base sm:text-lg">{balances.map((item) => formatQuantity(item.quantity)).join(' + ')} = {formatQuantity(total)} m</div><p className="mt-2 text-center text-sm text-muted-foreground">کورا + پروسیس شدہ + ٹھیکیدار کے پاس + منظور شدہ نقصان</p><p className="mt-4 text-sm leading-7 text-muted-foreground">ٹھیکیدار کا بقایا = جاری مقدار − اصل وصولی − واضح طور پر منظور شدہ نقصان۔ پروسیس شدہ کپڑے کی وصولی سے تیار سوٹ نہیں بنتے۔</p></Card>
    <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
      <Card className="overflow-hidden"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">متعلقہ دستاویزات</h2><p className="text-sm text-muted-foreground">ایک ہی ڈیٹا اسٹور سے مربوط ریکارڈ</p></div><dl className="divide-y divide-border">{inspection.records.map((record, index) => <div key={`${record.label}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><dt className="text-sm text-muted-foreground">{record.label}</dt><dd className="max-w-full break-words text-base"><bdi>{record.value}</bdi></dd></div>)}</dl></Card>
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border p-5"><h2 className="text-xl font-semibold">انوینٹری کی حرکات</h2><Badge><bdi className="number">{inspection.movements.length}</bdi> اندراجات</Badge></div><div className="overflow-x-auto"><table className="erp-table"><caption className="sr-only">منتخب ریکارڈ سے حاصل شدہ انوینٹری کی حرکات</caption><thead><tr><th scope="col">دستاویز</th><th scope="col">اسٹاک کی قسم</th><th scope="col">مقدار</th><th scope="col">حوالہ</th></tr></thead><tbody>{inspection.movements.length ? inspection.movements.map((movement) => <tr key={movement.id}><td><bdi className="number text-xs">{movement.documentNumber}</bdi></td><td>{inventoryCategoryLabels[movement.category] ?? movement.category}</td><td><bdi className="number font-semibold">{formatQuantity(movement.quantity)}</bdi><span className="ms-1 text-xs text-muted-foreground">{movement.unit === 'METER' || movement.unit === 'meter' ? t('meter') : movement.unit}</span></td><td><bdi className="number text-xs text-muted-foreground" title={movement.sourceDocumentId}>{movement.sourceDocumentId}</bdi></td></tr>) : <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">ابھی کوئی حرکت نہیں۔ پہلا لین دین پوسٹ کریں۔</td></tr>}</tbody></table></div></Card>
    </div>
  </>;
}
