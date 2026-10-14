import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Construction, LayoutGrid } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { routeRegistry, routeGroupLabels, getRoute, type ERPRoute, type RouteGroup } from '@/routes/registry';
import { t } from '@/locales/ur';
import { RecordPreview } from './RecordPreview';
export function PlannedModulePage({ route }: { route: ERPRoute }) {
  const { id } = useParams(); const [params] = useSearchParams(); const recordId = id ?? params.get('record');
  return <><PageHeading title={t(route.title)} description="یہ کاروباری ماڈیول آئندہ مرحلے کے لیے مختص ہے۔" eyebrow={'منصوبہ بند مرحلہ ' + route.phase} />{recordId && ['suppliers', 'fabrics', 'contractors'].includes(route.module) && <RecordPreview id={recordId} />}<Card className="mx-auto my-10 flex max-w-2xl flex-col items-center px-6 py-10 text-center"><Construction className="mb-5 size-10 text-primary" /><Badge className="mb-4">{t('underDevelopment')} · مرحلہ {route.phase}</Badge><h2 className="text-xl font-semibold">{t(route.title)} کا مکمل ماڈیول جلد آئے گا</h2><p className="mt-3 max-w-md text-sm leading-8 text-muted-foreground">مرحلہ ۲ میں بصری اجزا اور راستہ دستیاب ہیں۔ اصل اسٹاک کے لین دین کی جانچ انوینٹری کے تشخیصی منظر میں کریں۔</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild><Link to={getRoute('diagnostics').path}>انوینٹری جانچ<ArrowLeft /></Link></Button><Button asChild variant="outline"><Link to={getRoute('design-system').path}><LayoutGrid />ڈیزائن سسٹم</Link></Button></div></Card></>;
}
export function ModulesPage() {
  const groups = Object.entries(routeGroupLabels) as [RouteGroup, string][];
  return <><PageHeading title={t('modules')} description="تمام منصوبہ بند ماڈیولز، موجودہ دستیابی اور ترقیاتی مراحل۔" eyebrow="نظام کا نقشہ" />{groups.map(([group, label]) => <section key={group} className="mb-8"><h2 className="mb-4 text-lg font-semibold">{label}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(routeRegistry as readonly ERPRoute[]).filter((route) => route.group === group && !route.detail).map((route) => <Link key={route.id} to={route.path} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/35"><div><p className="text-base font-medium">{t(route.title)}</p><p className="mt-1 text-xs text-muted-foreground">{'مرحلہ ' + route.phase + ' · ' + (route.implemented ? 'دستیاب' : t('underDevelopment'))}</p></div><ArrowLeft className="size-4 text-muted-foreground" /></Link>)}</div></section>)}</>;
}
export function NotFoundPage() { return <Card className="mx-auto my-12 max-w-xl p-10 text-center"><span className="number text-5xl text-primary">404</span><h1 className="mt-5 text-2xl font-semibold">یہ صفحہ موجود نہیں ہے</h1><p className="mb-6 mt-3 text-muted-foreground">درست ماڈیول منتخب کریں یا ڈیش بورڈ پر واپس جائیں۔</p><Button asChild><Link to={getRoute('dashboard').path}><ArrowRight />ڈیش بورڈ پر جائیں</Link></Button></Card>; }
