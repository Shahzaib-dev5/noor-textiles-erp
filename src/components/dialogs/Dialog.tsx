import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DialogProps { id?: string; open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; drawer?: boolean; className?: string }
/** Native modal dialogs supply browser focus trapping, inert background and focus restoration. */
export function FormDialog({ id, open, onClose, title, description, children, drawer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);
  return <dialog id={id} ref={ref} dir="rtl" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn('erp-dialog', drawer && 'erp-drawer', className)} onKeyDown={(event) => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')].filter((element) => element.getClientRects().length > 0);
    const first = controls[0]; const last = controls[controls.length - 1];
    // Native modal inertness excludes background controls; cycle the boundary before browser chrome.
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget) && last) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget) && first) { event.preventDefault(); first.focus(); }
  }} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}>
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4"><div><h2 id={titleId} className="font-semibold">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>}</div><Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="بند کریں"><X /></Button></div>
    <div className="p-5">{children}</div>
  </dialog>;
}
export function DetailsDrawer(props: Omit<DialogProps, 'drawer'>) { return <FormDialog {...props} drawer />; }
export interface ConfirmationProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; destructive?: boolean }
export function ConfirmationDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'تصدیق کریں', destructive }: ConfirmationProps) {
  return <FormDialog open={open} onClose={onClose} title={title} description={description}><div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>منسوخ کریں</Button><Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>{confirmLabel}</Button></div></FormDialog>;
}
export function DeleteConfirmationDialog(props: Omit<ConfirmationProps, 'destructive'>) { return <ConfirmationDialog {...props} destructive />; }
export function UnsavedChangesDialog(props: Pick<ConfirmationProps, 'open' | 'onClose' | 'onConfirm'>) { return <ConfirmationDialog {...props} destructive title="غیر محفوظ تبدیلیاں" description="آپ کی تبدیلیاں ابھی محفوظ نہیں ہوئیں۔ کیا انہیں چھوڑ کر بند کرنا چاہتے ہیں؟" confirmLabel="تبدیلیاں چھوڑ دیں" />; }
