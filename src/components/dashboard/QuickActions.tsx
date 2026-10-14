import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getRoute, type RouteId } from '@/routes/registry';
const actions: { id: RouteId; label: string }[] = [{ id: 'purchase-new', label: 'نئی خریداری' }, { id: 'processing', label: 'نیا پروسیسنگ چالان' }, { id: 'production', label: 'نیا پیداواری آرڈر' }, { id: 'sales', label: 'نیا سیلز آرڈر' }, { id: 'invoices', label: 'نئی انوائس' }, { id: 'payments', label: 'نئی وصولی' }];
export function QuickActions() { return <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">فوری کارروائیاں</h2><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{actions.map(({ id, label }) => <Link key={id} to={getRoute(id).path} className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm transition hover:border-primary/30 hover:bg-primary/5"><Plus className="size-4 text-primary" /><span className="flex-1">{label}<span className="mt-0.5 block text-xs text-muted-foreground">منصوبہ بند مرحلہ {getRoute(id).phase}</span></span><ArrowLeft className="size-3 text-muted-foreground" /></Link>)}</div></Card>; }
