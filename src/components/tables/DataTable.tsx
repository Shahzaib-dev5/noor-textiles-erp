import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, InlineError } from '@/components/feedback/states';
import { useToast } from '@/store/toasts';
import { useUIStore } from '@/store/ui-preferences';
import { buildCSV, downloadText } from '@/lib/csv';

export interface TableColumn<T> { id: string; label: string; value: (row: T) => string | number; exportValue?: (row: T) => string | number; render?: (row: T) => ReactNode; sortable?: boolean; technical?: boolean }
export interface TableFilter<T> { id: string; label: string; options: { value: string; label: string }[]; matches: (row: T, value: string) => boolean }
export interface DataTableProps<T> { title: string; rows: readonly T[]; columns: readonly TableColumn<T>[]; rowId: (row: T) => string; filters?: readonly TableFilter<T>[]; loading?: boolean; error?: string; onDetails?: (row: T) => void; onPrint?: (rows: readonly T[]) => void; emptyDescription?: string; initialPageSize?: 5 | 10 | 25 | 50 }
export function DataTableColumnHeader({ label, direction, onSort }: { label: string; direction?: 'asc' | 'desc'; onSort?: () => void }) { return onSort ? <button className="inline-flex items-center gap-2" onClick={onSort}>{label}{direction === 'asc' ? <ArrowUp className="size-3" /> : direction === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 text-muted-foreground" />}</button> : <span>{label}</span>; }
export function DataTableRowActions({ onDetails }: { onDetails: () => void }) { return <Button variant="ghost" size="sm" onClick={onDetails}><Eye />تفصیل</Button>; }
export function TableSkeleton() { return <div role="status" aria-label="ریکارڈ لوڈ ہو رہے ہیں" className="space-y-4 p-6">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />)}</div>; }
export function TableEmptyState({ description }: { description?: string }) { return <EmptyState title="کوئی ریکارڈ نہیں ملا" description={description ?? 'تلاش یا فلٹر بدل کر دوبارہ کوشش کریں۔'} />; }
export function TableErrorState({ message }: { message: string }) { return <div className="p-5"><InlineError>{message}</InlineError></div>; }
export function DataTableFilters<T>({ filters, values, onChange }: { filters: readonly TableFilter<T>[]; values: Record<string, string>; onChange: (id: string, value: string) => void }) { return <>{filters.map((filter) => <label key={filter.id} className="flex items-center gap-2 text-sm"><span className="shrink-0">{filter.label}</span><select aria-label={filter.label} className="control min-w-32" value={values[filter.id] ?? ''} onChange={(e) => onChange(filter.id, e.target.value)}><option value="">تمام</option>{filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</>; }
export function DataTableToolbar({ search, onSearch, children }: { search: string; onSearch: (value: string) => void; children: ReactNode }) { return <div className="flex flex-wrap items-center gap-3 border-b border-border p-4"><label className="relative flex min-w-44 flex-1 items-center"><Search className="absolute start-3 size-4 text-muted-foreground" /><input className="control ps-9" aria-label="جدول میں تلاش" placeholder="نام یا حوالہ تلاش کریں…" value={search} onChange={(e) => onSearch(e.target.value)} /></label>{children}</div>; }
export function DataTablePagination({ page, totalPages, totalRows, pageSize, onPage, onSize }: { page: number; totalPages: number; totalRows: number; pageSize: number; onPage: (page: number) => void; onSize: (size: 5 | 10 | 25 | 50) => void }) { return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm"><span>کل <bdi className="number">{totalRows}</bdi> ریکارڈ · صفحہ <bdi className="number">{page} / {totalPages}</bdi></span><div className="flex items-center gap-2"><label className="flex items-center gap-2">فی صفحہ<select aria-label="فی صفحہ ریکارڈ" className="control w-20" value={pageSize} onChange={(e) => onSize(Number(e.target.value) as 5 | 10 | 25 | 50)}>{[5, 10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label><Button variant="outline" size="icon" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="پچھلا صفحہ"><ChevronRight /></Button><Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="اگلا صفحہ"><ChevronLeft /></Button></div></div>; }

export function DataTable<T>({ title, rows, columns, rowId, filters = [], loading, error, onDetails, onPrint, emptyDescription, initialPageSize }: DataTableProps<T>) {
  const preferred = useUIStore((s) => s.preferences.preferredPageSize);
  const update = useUIStore((s) => s.updatePreferences);
  const [pageSize, setPageSize] = useState(initialPageSize ?? preferred);
  const [search, setSearch] = useState(''); const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null);
  const [requestedPage, setPage] = useState(1); const [hidden, setHidden] = useState(new Set<string>()); const [selected, setSelected] = useState(new Set<string>());
  const visibleColumns = columns.filter((column) => !hidden.has(column.id));
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ur-PK');
    const result = rows.filter((row) => (!query || columns.some((c) => String(c.value(row)).toLocaleLowerCase('ur-PK').includes(query))) && filters.every((f) => !filterValues[f.id] || f.matches(row, filterValues[f.id])));
    const column = columns.find((c) => c.id === sort?.id);
    if (column && sort) result.sort((a, b) => {
      const av = column.value(a); const bv = column.value(b);
      const order = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ur', { numeric: true });
      return sort.direction === 'asc' ? order : -order;
    });
    return result;
  }, [rows, columns, filters, search, filterValues, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const page = Math.min(requestedPage, totalPages);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedRows = rows.filter((row) => selected.has(rowId(row)));
  const allSelected = filtered.length > 0 && filtered.every((row) => selected.has(rowId(row)));
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  function exportRows() {
    try {
      const exporting = selectedRows.length ? selectedRows : filtered;
      downloadText(buildCSV(visibleColumns.map((c) => c.label), exporting.map((row) => visibleColumns.map((c) => (c.exportValue ?? c.value)(row)))), 'noor-textiles-records.csv');
      useToast.getState().add(`${exporting.length} ریکارڈ کی CSV نقل تیار ہو گئی۔`);
    } catch { useToast.getState().add('CSV برآمد نہیں ہو سکی۔', 'error'); }
  }
  return <Card className="min-w-0 overflow-visible"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><h2 className="text-lg font-semibold">{title}</h2><span className="text-sm text-muted-foreground">اصل محفوظ ریکارڈ · ترمیم آئندہ مرحلے میں</span></div>
    <DataTableToolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }}><DataTableFilters filters={filters} values={filterValues} onChange={(id, value) => { setFilterValues({ ...filterValues, [id]: value }); setPage(1); }} /><details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><SlidersHorizontal className="size-4" />کالم</summary><div className="absolute end-0 top-full z-20 mt-2 min-w-44 rounded-xl border border-border bg-card p-3 shadow-lg">{columns.map((column) => <label key={column.id} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={!hidden.has(column.id)} disabled={!hidden.has(column.id) && visibleColumns.length === 1} onChange={() => setHidden((current) => { const next = new Set(current); if (next.has(column.id)) next.delete(column.id); else next.add(column.id); return next; })} />{column.label}</label>)}</div></details><Button variant="outline" size="sm" disabled={loading || Boolean(error) || (!filtered.length && !selectedRows.length)} onClick={exportRows}><Download />{selectedRows.length ? 'منتخب CSV' : 'CSV برآمد کریں'}</Button>{onPrint&&<Button variant="outline" size="sm" disabled={loading||Boolean(error)} onClick={()=>onPrint(filtered)}>رپورٹ پرنٹ کریں</Button>}</DataTableToolbar>
    {selectedRows.length > 0 && <div role="status" className="flex items-center justify-between bg-primary/5 px-4 py-2 text-sm"><span>{selectedRows.length} ریکارڈ منتخب</span><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>انتخاب صاف کریں</Button></div>}
    {loading ? <TableSkeleton /> : error ? <TableErrorState message={error} /> : !filtered.length ? <div className="p-5"><TableEmptyState description={emptyDescription} /></div> : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${title} — افقی اسکرول`}><table className="erp-table"><caption className="sr-only">{title}</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="تمام فلٹر شدہ ریکارڈ منتخب کریں" checked={allSelected} onChange={() => setSelected((current) => { const next = new Set(current); filtered.forEach((row) => allSelected ? next.delete(rowId(row)) : next.add(rowId(row))); return next; })} /></th>{visibleColumns.map((column) => <th key={column.id} scope="col" aria-sort={sort?.id === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><DataTableColumnHeader label={column.label} direction={sort?.id === column.id ? sort.direction : undefined} onSort={column.sortable === false ? undefined : () => { setSort({ id: column.id, direction: sort?.id === column.id && sort.direction === 'asc' ? 'desc' : 'asc' }); setPage(1); }} /></th>)}{onDetails && <th scope="col">کارروائی</th>}</tr></thead><tbody>{pageRows.map((row) => <tr key={rowId(row)}><td><input type="checkbox" aria-label={`ریکارڈ ${rowId(row)} منتخب کریں`} checked={selected.has(rowId(row))} onChange={() => toggle(rowId(row))} /></td>{visibleColumns.map((column) => <td key={column.id}>{column.technical ? <bdi className="number">{column.render?.(row) ?? column.value(row)}</bdi> : column.render?.(row) ?? column.value(row)}</td>)}{onDetails && <td><DataTableRowActions onDetails={() => onDetails(row)} /></td>}</tr>)}</tbody></table></div>}
    <DataTablePagination page={page} totalPages={totalPages} totalRows={filtered.length} pageSize={pageSize} onPage={setPage} onSize={(size) => { setPageSize(size); update({ preferredPageSize: size }); setPage(1); }} />
  </Card>;
}
