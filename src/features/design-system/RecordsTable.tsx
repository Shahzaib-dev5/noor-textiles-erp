import { useState } from 'react';
import { useERPStore } from '@/store';
import { DataTable, type TableColumn, type TableFilter } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/tables/StatusBadge';
import { DetailsDrawer } from '@/components/dialogs/Dialog';
import { formatQuantity } from '@/lib/formatters';
import { SelectInput } from '@/components/forms/controls';

export interface PreviewRow { id: string; name: string; code: string; quantity: number; status: string; detail: string }
const columns: TableColumn<PreviewRow>[] = [
  { id: 'code', label: 'حوالہ', value: (r) => r.code, technical: true },
  { id: 'name', label: 'نام', value: (r) => r.name },
  { id: 'quantity', label: 'میٹر / پیمائش', value: (r) => r.quantity, technical: true, render: (r) => formatQuantity(r.quantity) },
  { id: 'status', label: 'حالت', value: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
];
const filters: TableFilter<PreviewRow>[] = [{ id: 'status', label: 'حالت', options: [{ value: 'ACTIVE', label: 'فعال' }, { value: 'PARTIALLY_RECEIVED', label: 'جزوی وصولی' }, { value: 'COMPLETED', label: 'مکمل' }], matches: (row, value) => row.status === value }];
export function RecordsTable() {
  const data = useERPStore((s) => s.data); const [source, setSource] = useState('rolls'); const [record, setRecord] = useState<PreviewRow | null>(null);
  const rows: PreviewRow[] = source === 'rolls' ? Object.values(data.rolls).map((r) => ({ id: r.id, name: data.fabrics[data.lots[r.lotId].fabricId].name, code: r.label, quantity: r.actualLengthMeters, status: r.status, detail: 'اصل رول کی پیمائش؛ موجودہ دستیاب اسٹاک نہیں' }))
    : source === 'suppliers' ? Object.values(data.suppliers).map((r) => ({ id: r.id, name: r.name, code: r.phone, quantity: 0, status: r.status, detail: r.city + ' · یہ ماسٹر ریکارڈ ہے، پیمائش لاگو نہیں' }))
    : source === 'fabrics' ? Object.values(data.fabrics).map((r) => ({ id: r.id, name: r.name, code: r.id, quantity: 0, status: r.status, detail: r.widthInches + ' انچ · ' + r.composition + ' · پیمائش لاگو نہیں' }))
    : Object.values(data.challans).map((r) => ({ id: r.id, name: data.contractors[r.contractorId].name, code: r.number, quantity: r.lineIds.reduce((sum, id) => sum + data.challanLines[id].quantityMeters, 0), status: r.status, detail: 'جاری شدہ مقدار؛ بقایا کی جانچ ڈیش بورڈ میں' }));
  const actualColumns = source === 'suppliers' || source === 'fabrics' ? columns.filter((c) => c.id !== 'quantity') : columns;
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-7 text-muted-foreground">تلاش، ترتیب، انتخاب، فلٹر اور CSV اصل Phase 1 ریکارڈ پر کام کرتے ہیں۔</p><label className="flex items-center gap-2 text-sm">نمونہ جدول<SelectInput aria-label="نمونہ جدول" className="w-48" value={source} onChange={(e) => setSource(e.target.value)}><option value="rolls">اصل رول کی پیمائشیں</option><option value="suppliers">سپلائرز</option><option value="fabrics">کپڑے کی اقسام</option><option value="challans">پروسیسنگ چالان</option></SelectInput></label></div><DataTable key={source} title="اصل ریکارڈ کا جدول" rows={rows} columns={actualColumns} rowId={(r) => r.id} filters={filters} onDetails={setRecord} /><DetailsDrawer open={Boolean(record)} onClose={() => setRecord(null)} title="موجودہ ریکارڈ کی تفصیل">{record && <dl className="space-y-4"><div><dt className="text-xs text-muted-foreground">نام</dt><dd className="font-semibold">{record.name}</dd></div><div><dt className="text-xs text-muted-foreground">مستقل شناخت</dt><dd><bdi className="number break-all text-sm">{record.id}</bdi></dd></div><p className="text-sm leading-8 text-muted-foreground">{record.detail}</p><StatusBadge status={record.status} /></dl>}</DetailsDrawer></>;
}
