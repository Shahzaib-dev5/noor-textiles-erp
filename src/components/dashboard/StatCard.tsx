import type { LucideIcon } from 'lucide-react';
import { ArrowDownLeft, ArrowUpLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps { title: string; value: string; subtitle?: string; icon: LucideIcon; trend?: number; trendLabel?: string; loading?: boolean; status?: 'available' | 'upcoming' | 'warning'; onClick?: () => void }
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, loading, status = 'available', onClick }: StatCardProps) {
  const content = <><div className="mb-4 flex items-start justify-between gap-2"><span className="text-sm text-muted-foreground">{title}</span><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/7 text-primary"><Icon className="size-[18px]" strokeWidth={1.7} /></span></div>{loading ? <div aria-label="لوڈ ہو رہا ہے" className="h-9 w-28 animate-pulse rounded-lg bg-muted" /> : <div className={cn('number min-h-9 text-start text-3xl font-semibold tracking-tight', status === 'upcoming' && 'font-sans text-base font-medium leading-9 text-muted-foreground', status === 'warning' && 'text-warning-foreground')} dir={status === 'upcoming' ? 'rtl' : 'ltr'}>{value}</div>}{subtitle && <p className="mt-3 text-xs leading-6 text-muted-foreground">{subtitle}</p>}{trend !== undefined && <p className="mt-2 flex items-center gap-1 text-xs"><span className={trend >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'}>{trend >= 0 ? <ArrowUpLeft className="inline size-3" /> : <ArrowDownLeft className="inline size-3" />}<bdi className="number">{Math.abs(trend)}%</bdi></span>{trendLabel}</p>}</>;
  return <Card className={cn('min-w-0 overflow-hidden', onClick && 'transition hover:border-primary/40')} >{onClick ? <button onClick={onClick} className="block w-full p-5 text-start" aria-label={title}>{content}</button> : <div className="p-5">{content}</div>}</Card>;
}
