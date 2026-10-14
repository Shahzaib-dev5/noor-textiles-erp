import { useId, useState, useEffect, type ComponentProps, type ReactNode } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ValidationMessage({ id, children }: { id?: string; children?: ReactNode }) { return children ? <p id={id} role="alert" className="mt-1 text-sm text-destructive-foreground">{children}</p> : null; }
export function FormField({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) { return <div><label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}{required && <span className="ms-1 text-destructive-foreground" aria-label="لازمی">*</span>}</label>{children}{hint && <p id={`${id}-hint`} className="mt-1 text-xs leading-6 text-muted-foreground">{hint}</p>}<ValidationMessage id={`${id}-error`}>{error}</ValidationMessage></div>; }
export function TextInput(props: ComponentProps<'input'>) { return <input {...props} className={cn('control', props.className)} />; }
export function NumberInput(props: ComponentProps<'input'>) { return <TextInput type="number" inputMode="decimal" dir="ltr" {...props} className={cn('number', props.className)} />; }
export function CurrencyInput(props: ComponentProps<'input'>) { return <div className="relative" dir="ltr"><TextInput inputMode="decimal" dir="ltr" {...props} className={cn('number pe-14', props.className)} /><span className="pointer-events-none absolute end-3 top-2.5 text-sm text-muted-foreground">PKR</span></div>; }
export function QuantityInput(props: ComponentProps<'input'>) { return <NumberInput min={0} step="0.0001" {...props} />; }
export function DateInput(props: ComponentProps<'input'>) { return <TextInput type="date" dir="ltr" {...props} className={cn('number', props.className)} />; }
export function SelectInput(props: ComponentProps<'select'>) { return <select {...props} className={cn('control', props.className)} />; }
export function TextArea(props: ComponentProps<'textarea'>) { return <textarea rows={3} {...props} className={cn('control resize-y', props.className)} />; }
export function CheckboxField({ label, error, ...props }: ComponentProps<'input'> & { label: string; error?: string }) { const fallback = useId(); const id = props.id ?? fallback; return <div><label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm leading-7"><input {...props} id={id} type="checkbox" className="size-4" />{label}</label><ValidationMessage>{error}</ValidationMessage></div>; }
export function RadioField({ label, ...props }: ComponentProps<'input'> & { label: string }) { const fallback = useId(); const id = props.id ?? fallback; return <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm"><input {...props} id={id} type="radio" className="size-4" />{label}</label>; }
export function SwitchField({ label, error, ...props }: ComponentProps<'input'> & { label: string; error?: string }) { const fallback = useId(); const id = props.id ?? fallback; return <div><label htmlFor={id} className="relative flex cursor-pointer items-center gap-3 text-sm"><input {...props} id={id} type="checkbox" role="switch" className="sr-only" /><span className="switch-track" aria-hidden="true" /><span>{label}</span></label><ValidationMessage>{error}</ValidationMessage></div>; }
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) { return <fieldset className="min-w-0 rounded-xl border border-border p-5"><legend className="px-2 text-lg font-semibold">{title}</legend>{description && <p className="mb-4 text-sm leading-7 text-muted-foreground">{description}</p>}<div className="grid gap-4 sm:grid-cols-2">{children}</div></fieldset>; }
export function FormActions({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">{children}</div>; }
export function SearchableSelect({ id, label, value, options, onValueChange, disabled }: { id: string; label: string; value: string; options: readonly { value: string; label: string }[]; onValueChange: (value: string) => void; disabled?: boolean }) {
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const [active, setActive] = useState(0);
  const choices = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected = options.find((option) => option.value === value);
  const select = (choice: typeof options[number]) => { onValueChange(choice.value); setOpen(false); setQuery(''); };
  return <div className="relative"><div className="relative"><Search className="absolute start-3 top-3 size-4 text-muted-foreground" /><input id={id} role="combobox" aria-label={label} aria-expanded={open} aria-autocomplete="list" aria-controls={`${id}-list`} aria-activedescendant={open && choices[active] ? `${id}-option-${active}` : undefined} className="control ps-9" disabled={disabled} value={open ? query : selected?.label ?? ''} placeholder="تلاش کر کے منتخب کریں" onFocus={() => { setOpen(true); setQuery(''); setActive(0); }} onBlur={() => setOpen(false)} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0); }} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((current) => Math.min(current + 1, choices.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((current) => Math.max(0, current - 1)); }
    if (event.key === 'Enter' && open) { event.preventDefault(); if (choices[active]) select(choices[active]); }
  }} /></div>{open && <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">{choices.length ? choices.map((choice, index) => <li role="option" id={`${id}-option-${index}`} key={choice.value} aria-selected={value === choice.value} className={cn('cursor-pointer rounded-lg px-3 py-2 text-sm', active === index && 'bg-muted')} onMouseDown={(event) => event.preventDefault()} onClick={() => select(choice)}>{choice.label}</li>) : <li className="p-3 text-sm text-muted-foreground">کوئی نتیجہ نہیں ملا</li>}</ul>}</div>;
}
export function FileUploadPreview() {
  const [file, setFile] = useState<File | null>(null); const [url, setURL] = useState<string | null>(null); const [error, setError] = useState(''); const id = useId();
  useEffect(() => {
    if (!file) return;
    const local = URL.createObjectURL(file); setURL(local);
    return () => URL.revokeObjectURL(local);
  }, [file]);
  return <div className="sm:col-span-2"><label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-medium"><Upload className="size-4" />تصویر کا مقامی پیش منظر</label><input id={id} type="file" accept="image/png,image/jpeg,image/webp" className="control" onChange={(event) => {
    const selected = event.target.files?.[0]; if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 2 * 1024 * 1024) { setError('PNG، JPEG یا WebP تصویر منتخب کریں؛ حد ۲ میگا بائٹ ہے۔'); return; }
    setError(''); setFile(selected);
  }} /><p className="mt-1 text-xs text-muted-foreground">تصویر صرف اسی پیش منظر میں ہے؛ اپ لوڈ یا کاروباری ڈیٹا میں محفوظ نہیں ہوتی۔</p><ValidationMessage>{error}</ValidationMessage>{file && <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3">{url && <img src={url} alt="منتخب نمونہ" className="size-16 rounded-lg object-cover" />}<span className="min-w-0 flex-1 break-all text-sm">{file.name}</span><Button type="button" size="icon" variant="ghost" aria-label="تصویر ہٹائیں" onClick={() => { setFile(null); setURL(null); const input = document.getElementById(id) as HTMLInputElement | null; if (input) input.value = ''; }}><X /></Button></div>}</div>;
}
