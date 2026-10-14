import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AlertBanner({ children, tone = 'info', className }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' | 'error'; className?: string }) {
  const styles = { info: 'border-primary/20 bg-primary/5 text-primary', success: 'border-success/25 bg-success/10 text-success-foreground', warning: 'border-warning/30 bg-warning/10 text-warning-foreground', error: 'border-destructive/30 bg-destructive/10 text-destructive-foreground' };
  return <div role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm leading-7', styles[tone], className)}>{tone === 'success' ? <CheckCircle2 className="mt-1 size-4 shrink-0" /> : <AlertCircle className="mt-1 size-4 shrink-0" />}<div className="min-w-0">{children}</div></div>;
}
export function InlineError({ children }: { children: ReactNode }) { return <p role="alert" className="text-sm leading-7 text-destructive-foreground">{children}</p>; }
export function SuccessMessage({ children }: { children: ReactNode }) { return <AlertBanner tone="success">{children}</AlertBanner>; }
export function EmptyState({ title = 'ابھی کوئی ریکارڈ نہیں', description, action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-5 py-8 text-center"><Inbox className="mb-2 size-7 text-muted-foreground" /><h3 className="font-semibold">{title}</h3>{description && <p className="max-w-md text-sm leading-7 text-muted-foreground">{description}</p>}{action && <div className="mt-3">{action}</div>}</div>; }
export function LoadingOverlay({ label = 'ریکارڈ کھولے جا رہے ہیں…' }: { label?: string }) { return <div role="status" aria-live="polite" className="flex min-h-32 items-center justify-center gap-3 rounded-xl bg-muted/50 p-6 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /><span>{label}</span></div>; }
