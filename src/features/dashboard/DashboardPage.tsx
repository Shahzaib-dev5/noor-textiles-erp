import { ArrowLeft, ArrowUpLeft, Check, CircleCheck, FlaskConical, Layers3, PackageCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/common/PageHeading';
import { useERPStore } from '@/store';
import { selectDashboard, selectInspector } from '@/store/selectors';
import { formatQuantity } from '@/lib/formatters';
import { t } from '@/locales/ur';
import { workflowPreview } from '@/app/config/navigation';

export default function DashboardPage() {
  const data = useERPStore((state) => state.data);
  const summary = selectDashboard(data);
  const inspection = selectInspector(data);
  const distribution = [
    { name: t('grey'), value: summary.grey, color: '#255947' },
    { name: t('processed'), value: summary.processed, color: '#84ac92' },
    { name: t('contractor'), value: summary.contractor, color: '#c9ab73' },
    { name: t('loss'), value: summary.loss, color: '#d5dad5' },
  ];
  const stockCards = [
    { title: t('grey'), value: summary.grey, detail: 'گودام میں دستیاب', icon: Layers3, tone: 'green' },
    { title: t('processed'), value: summary.processed, detail: 'پروسیسنگ سے وصول شدہ', icon: PackageCheck, tone: 'sage' },
    { title: t('contractor'), value: summary.contractor, detail: 'وصول ہونا باقی', icon: FlaskConical, tone: 'sand' },
    { title: t('loss'), value: summary.loss, detail: 'واضح طور پر درج شدہ', icon: CircleCheck, tone: 'gray' },
  ];

  return <>
    <PageHeading title="کاروبار، ایک نظر میں" description="کپڑے کی ہر حرکت، ایک مربوط ریکارڈ کے ساتھ۔" eyebrow={summary.companyName} action={<Button asChild variant="outline"><Link to="/diagnostics">انوینٹری کی جانچ<ArrowUpLeft /></Link></Button>} />
    <section className="overview-banner relative mb-7 overflow-hidden rounded-2xl border border-primary/15 bg-[#eaf0e8] px-6 py-5 dark:bg-[#183c30] sm:px-7" aria-label="ڈیمو کی معلومات">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-5"><div><div className="mb-1 flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /><span className="text-sm font-medium text-primary dark:text-emerald-200">آپ کا بنیادی نظام تیار ہے</span></div><h2 className="text-xl font-semibold sm:text-2xl">خریداری سے پروسیسنگ تک، مکمل ربط</h2><p className="mt-1 max-w-xl text-base leading-8 text-muted-foreground">یہ اعداد محفوظ ڈیمو ریکارڈ سے حاصل ہوتے ہیں۔ نئی آزمائشی کارروائیوں کے لیے انوینٹری جانچ کھولیں۔</p></div><Badge className="border-primary/20 bg-white/60 px-4 py-1 text-primary dark:bg-white/5 dark:text-emerald-200">{t('phaseOne')} · بنیادی ساخت</Badge></div>
    </section>
    <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="کپڑے کے موجودہ بیلنس">
      {stockCards.map(({ title, value, detail, icon: Icon, tone }) => <Card key={title} className="p-5"><div className="mb-4 flex items-center justify-between"><span className="text-base text-muted-foreground">{title}</span><span className={`stat-icon stat-icon-${tone}`}><Icon className="size-5" strokeWidth={1.5} /></span></div><div className="flex items-baseline gap-2"><strong dir="ltr" className="number text-4xl font-semibold tracking-tight">{formatQuantity(value)}</strong><span className="text-sm text-muted-foreground">{t('meter')}</span></div><div className="mt-4 flex items-center gap-1.5 border-t border-border/70 pt-3 text-sm text-muted-foreground"><span className={`size-1.5 rounded-full ${tone === 'sand' ? 'bg-[#c9ab73]' : 'bg-primary/40'}`} />{detail}</div></Card>)}
    </section>
    <div className="mb-7 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card className="p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold">کپڑے کا حساب</h2><p className="mt-1 text-sm text-muted-foreground">خریدی گئی مقدار کی موجودہ تقسیم</p></div><Badge className={inspection.reconciled ? 'border-primary/20 bg-primary/5 text-primary' : 'border-destructive/20 text-destructive'}>{inspection.reconciled ? <Check className="size-3.5" /> : null}{inspection.reconciled ? 'حساب درست ہے' : 'جانچ درکار ہے'}</Badge></div>
        <div className="flex flex-col items-center gap-6 sm:flex-row"><div className="relative shrink-0" role="img" aria-label={`کل خرید ${formatQuantity(inspection.purchased)} میٹر؛ تقسیم نیچے درج ہے`}><PieChart width={172} height={172}><Pie data={distribution} dataKey="value" cx={81} cy={81} innerRadius={61} outerRadius={80} stroke="none" paddingAngle={2} isAnimationActive={false}>{distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span dir="ltr" className="number text-2xl font-semibold">{formatQuantity(inspection.purchased)}</span><span className="text-sm text-muted-foreground">کل خرید · میٹر</span></div></div><div className="w-full flex-1 space-y-3">{distribution.map((item) => <div className="flex items-center justify-between gap-3" key={item.name}><span className="flex items-center gap-2 text-base text-muted-foreground"><span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} />{item.name}</span><span dir="ltr" className="number text-sm font-semibold">{formatQuantity(item.value)} <span className="font-normal text-muted-foreground">m</span></span></div>)}</div></div>
        <div className="mt-5 border-t border-border pt-4 text-sm leading-7 text-muted-foreground">کورا + پروسیس شدہ + ٹھیکیدار کے پاس + منظور شدہ نقصان = کل خرید</div>
      </Card>
      <Card className="flex flex-col p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">مربوط کاروباری ریکارڈ</h2><Badge className="text-muted-foreground">گولڈن ڈیٹا</Badge></div><div className="grid grid-cols-2 gap-4"><div className="rounded-xl bg-muted/65 p-4"><Users className="mb-3 size-5 text-primary" strokeWidth={1.5} /><p dir="ltr" className="number text-start text-3xl font-semibold">{formatQuantity(summary.supplierCount)}</p><p className="mt-1 text-sm text-muted-foreground">رجسٹرڈ سپلائر</p></div><div className="rounded-xl bg-muted/65 p-4"><Layers3 className="mb-3 size-5 text-primary" strokeWidth={1.5} /><p dir="ltr" className="number text-start text-3xl font-semibold">{formatQuantity(summary.lotCount)}</p><p className="mt-1 text-sm text-muted-foreground">کپڑے کے لاٹس</p></div></div><p className="mb-4 mt-5 text-sm leading-7 text-muted-foreground">ایک کمپنی، متعلقہ دستاویزات اور مقدار کی مکمل جانچ۔ تیار سوٹ کا نمونہ، کپڑے کی وصولی سے الگ ہے۔</p><Link className="mt-auto flex items-center justify-between border-t border-border pt-4 text-base font-medium text-primary" to="/diagnostics">اصل ریکارڈ اور حرکات دیکھیں<ArrowLeft className="size-4" /></Link></Card>
    </div>
    <Card className="p-6"><div className="mb-6 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-semibold">کپڑے کا سفر</h2><p className="mt-1 text-sm text-muted-foreground">موجودہ بنیاد سے آنے والے کاروباری مراحل تک</p></div><Link to="/modules" className="flex items-center gap-2 text-sm text-primary">تمام ماڈیولز<ArrowLeft className="size-4" /></Link></div><ol className="grid gap-3 sm:grid-cols-5">{workflowPreview.map(({ label, icon: Icon, phase }, index) => <li key={label} className={`relative rounded-xl border p-4 ${phase === 1 ? 'border-primary/15 bg-primary/[0.035]' : 'border-dashed border-border bg-muted/25'}`}><div className="mb-4 flex items-center justify-between"><Icon className={`size-6 ${phase === 1 ? 'text-primary' : 'text-muted-foreground/60'}`} strokeWidth={1.4} /><span className="number text-xs text-muted-foreground/50" dir="ltr">0{index + 1}</span></div><p className="text-base font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{phase === 1 ? 'بنیادی ٹرانزیکشن فعال' : 'آئندہ مرحلے میں'}</p></li>)}</ol></Card>
  </>;
}
