import { useToast } from '@/store/toasts';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ToastNotification() {
  const items = useToast((state) => state.items); const dismiss = useToast((state) => state.dismiss);
  return <div aria-label="پیغامات" className="no-print fixed inset-x-4 bottom-4 z-[100] flex max-w-sm flex-col gap-2 sm:start-auto sm:end-5 sm:w-96">{items.map((item) => <div key={item.id} role={item.tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border bg-card p-4 text-sm shadow-lg', item.tone === 'error' ? 'border-destructive/40' : 'border-success/30')}>
    {item.tone === 'error' ? <AlertCircle className="mt-1 size-4 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-1 size-4 shrink-0 text-success" />}<p className="flex-1 leading-7">{item.message}</p><Button size="icon" variant="ghost" className="size-7" aria-label="پیغام بند کریں" onClick={() => dismiss(item.id)}><X /></Button>
  </div>)}</div>;
}
