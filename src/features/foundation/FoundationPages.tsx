import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Construction, LayoutGrid } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { routeRegistry, routeGroupLabels, type ERPRoute, type RouteGroup } from '@/routes/registry';
import { t } from '@/locales/ur';

export function PlannedModulePage({ route }: { route: ERPRoute }) {
  const { id } = useParams();
  return <><PageHeading title={t(route.title)} description="یہ ماڈیول آئندہ ترقیاتی مرحلے کے لیے مختص ہے۔" eyebrow={`منصوبہ بند مرحلہ ${route.phase}`} /><Card className="mx-auto my-12 flex max-w-2xl flex-col items-center px-6 py-12 text-center"><div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Construction className="size-8" strokeWidth={1.4} /></div><Badge className="mb-4">{t('underDevelopment')} · مرحلہ {route.phase}</Badge><h2 className="text-2xl font-semibold">{t(route.title)} کا مکمل ماڈیول جلد آئے گا</h2><p className="mt-3 max-w-md text-base leading-8 text-muted-foreground">مرحلہ ۱ میں اس صفحے کا راستہ اور بنیادی ساخت تیار ہیں۔ عملی انوینٹری ٹرانزیکشنز کی جانچ تشخیصی منظر میں دستیاب ہے۔</p>{id && <p className="mt-3 text-sm text-muted-foreground">راستے کا حوالہ: <bdi className="number">{id}</bdi> · ابھی ریکارڈ لوڈ نہیں کیا گیا</p>}<div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/diagnostics">انوینٹری جانچ<ArrowLeft /></Link></Button><Button asChild variant="outline"><Link to="/modules"><LayoutGrid />تمام ماڈیولز</Link></Button></div></Card></>;
}

export function ModulesPage() {
  const groups = Object.entries(routeGroupLabels) as [RouteGroup, string][];
  return <><PageHeading title={t('modules')} description="تمام منصوبہ بند ماڈیولز، ان کے راستے اور ترقیاتی مراحل۔" eyebrow="نظام کا نقشہ" />{groups.map(([group, label]) => <section key={group} className="mb-8"><h2 className="mb-4 text-xl font-semibold">{label}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(routeRegistry as readonly ERPRoute[]).filter((route) => route.group === group && !route.detail).map((route) => <Link key={route.id} to={route.path} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/35 hover:shadow-card"><div><p className="text-lg font-medium">{t(route.title)}</p><p className="mt-1 text-sm text-muted-foreground">{route.implemented ? 'مرحلہ ۱ · دستیاب' : `مرحلہ ${route.phase} · ${t('underDevelopment')}`}</p></div><ArrowLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary" /></Link>)}</div></section>)}</>;
}

export function NotFoundPage() {
  return <Card className="mx-auto my-12 max-w-xl p-10 text-center"><span className="number text-5xl text-primary">404</span><h1 className="mt-5 text-2xl font-semibold">یہ صفحہ موجود نہیں ہے</h1><p className="mb-6 mt-3 text-muted-foreground">درست ماڈیول منتخب کریں یا ڈیش بورڈ پر واپس جائیں۔</p><Button asChild><Link to="/dashboard"><ArrowRight />ڈیش بورڈ پر جائیں</Link></Button></Card>;
}
