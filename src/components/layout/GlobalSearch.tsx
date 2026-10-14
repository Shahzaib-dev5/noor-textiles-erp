import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { FormDialog } from '@/components/dialogs/Dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/states';
import { useERPStore } from '@/store';
import { selectGlobalSearch } from '@/store/selectors/ui';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [active, setActive] = useState(0);
  const data = useERPStore((s) => s.data); const navigate = useNavigate(); const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = selectGlobalSearch(data, query);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value); setQuery(''); setActive(0); } };
    document.addEventListener('keydown', shortcut); return () => document.removeEventListener('keydown', shortcut);
  }, []);
  const choose = (path: string) => { setOpen(false); navigate(path); };
  return <><Button variant="outline" size="sm" className="gap-2 text-muted-foreground" aria-label="عالمی تلاش کھولیں" onClick={() => { setOpen(true); setQuery(''); setActive(0); }}><Search /><span className="hidden xl:inline">ماڈیول یا ریکارڈ تلاش کریں</span><kbd dir="ltr" className="number hidden rounded border border-border px-1 text-[10px] sm:inline">Ctrl K</kbd></Button><FormDialog open={open} onClose={() => setOpen(false)} title="عالمی تلاش" description="موجودہ ماڈیولز، سپلائرز، کپڑے اور ٹھیکیدار تلاش کریں۔"><input ref={input} className="control" role="combobox" aria-label="عالمی تلاش" aria-expanded="true" aria-controls="global-results" aria-activedescendant={results[active] ? `search-${active}` : undefined} aria-autocomplete="list" placeholder="نام، حوالہ یا ماڈیول…" value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={(event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const next = Math.max(0, Math.min(results.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))); setActive(next); list.current?.querySelector(`#search-${next}`)?.scrollIntoView({ block: 'nearest' }); }
    if (event.key === 'Enter' && results[active]) { event.preventDefault(); choose(results[active].path); }
  }} /><div ref={list} id="global-results" role="listbox" aria-label="نتائج تلاش" className="mt-3 max-h-[55dvh] overflow-y-auto">{results.length ? results.map((result, index) => <div key={result.id} role="option" id={`search-${index}`} aria-selected={active === index}><button className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-start', active === index && 'bg-muted')} onClick={() => choose(result.path)}><div><span className="text-sm font-semibold">{result.title}</span><span className="ms-2 text-xs text-muted-foreground">{result.type}</span><p className="text-xs text-muted-foreground"><bdi>{result.description}</bdi></p></div><ArrowLeft className="size-4 shrink-0 text-muted-foreground" /></button></div>) : <EmptyState title="کوئی نتیجہ نہیں ملا" description="دوسرا نام یا ماڈیول تلاش کریں۔" />}</div></FormDialog></>;
}
