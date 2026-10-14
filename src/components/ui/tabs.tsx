import { useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
export function Tabs({ items, value, onChange, children }: { items: readonly { id: string; label: string }[]; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = useId(); const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return <><div role="tablist" aria-label="زمرے" className="no-print mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">{items.map((item, index) => <button ref={(element) => { refs.current[index] = element; }} key={item.id} role="tab" id={`${id}-${item.id}`} aria-selected={value === item.id} aria-controls={`${id}-panel`} tabIndex={value === item.id ? 0 : -1} className={cn('rounded-lg px-4 py-2 text-sm', value === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')} onClick={() => onChange(item.id)} onKeyDown={(event) => {
    let next = index;
    if (event.key === 'ArrowLeft') next = (index + 1) % items.length;
    else if (event.key === 'ArrowRight') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault(); onChange(items[next].id); refs.current[next]?.focus();
  }}>{item.label}</button>)}</div><section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} className="min-w-0">{children}</section></>;
}
