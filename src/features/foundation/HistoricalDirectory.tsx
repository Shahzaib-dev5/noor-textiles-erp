import { useSearchParams } from 'react-router-dom';
import { useERPStore } from '@/store';
import { DataTable } from '@/components/tables/DataTable';
import { formatPKR } from '@/lib/formatters';
import { StatusBadge } from '@/components/tables/StatusBadge';
interface Row { id: string; name: string; code: string; detail: string }
export function HistoricalDirectory({ module }: { module: string }) {
  const data = useERPStore((s) => s.data); const [, setParams] = useSearchParams(); const h = data.history;
  if (!h) return null;
  let rows: Row[] = [];
  if (module === 'suppliers') rows = Object.values(data.suppliers).map((r) => { const p = Object.values(h.supplierProfiles).find((p) => p.supplierId === r.id); return { id: r.id, name: r.name, code: p?.code ?? r.id, detail: r.city + ' · ' + (p?.nameEnglish ?? '') + ' · ' + (p?.termDays ?? 0) + ' دن' }; });
  if (module === 'fabrics') rows = Object.values(data.fabrics).map((r) => { const p = Object.values(h.fabricProfiles).find((p) => p.fabricId === r.id); return { id: r.id, name: r.name, code: p?.code ?? r.id, detail: r.composition + ' · ' + r.widthInches + '″ · GSM ' + p?.gsm + ' · ' + formatPKR(p?.ratePaisa ?? 0) + '/میٹر' }; });
  if (module === 'customers') rows = Object.values(data.customers).map((r) => ({ id: r.id, name: r.name, code: r.id, detail: r.city + ' · فرضی کاروباری شناخت' }));
  if (module === 'contractors') rows = Object.values(data.contractors).map((r) => ({ id: r.id, name: r.name, code: r.id, detail: r.city + ' · ' + r.services.map((s) => ({ BLEACHING: 'بلیچنگ', DYEING: 'رنگائی', DIGITAL_PRINTING: 'ڈیجیٹل پرنٹنگ', ROTARY_PRINTING: 'روٹری پرنٹنگ', SCREEN_PRINTING: 'اسکرین پرنٹنگ', FINISHING: 'فنشنگ' })[s]).join('، ') }));
  if (module === 'designs') rows = Object.values(data.designs).map((r) => ({ id: r.id, name: r.name, code: r.code, detail: (r.collectionId ? h.collections[r.collectionId].name : '') + ' · ' + r.pieceCount + ' پیس · نمونہ مقامی خاکہ' }));
  if (!rows.length) return null;
  return <div className="mb-6"><DataTable title="مربوط نمونہ ڈائریکٹری — صرف مشاہدہ" rows={rows} rowId={(r) => r.id} columns={[{ id: 'name', label: 'نام', value: (r) => r.name }, { id: 'code', label: 'کوڈ', value: (r) => r.code, technical: true }, { id: 'detail', label: 'تفصیل', value: (r) => r.detail }]} onDetails={(r) => setParams({ record: r.id })} /></div>;
}
export function HistoricalRecordPreview({ id }: { id: string }) {
  const data = useERPStore((s) => s.data);
  const core = Object.entries(data).filter(([k]) => k !== 'history').flatMap(([, rows]) => Object.values(rows) as Record<string, unknown>[]);
  const related = data.history ? Object.values(data.history).filter((rows) => rows && typeof rows === 'object').flatMap((rows) => Object.values(rows) as Record<string, unknown>[]) : [];
  const r = [...core, ...related].find((r) => r.id === id);
  if (!r) return <p className="mb-6 text-sm">یہ حوالہ موجودہ کاروباری نقل میں نہیں ملا۔</p>;
  const labels: Record<string, string> = { id: 'شناخت', name: 'نام', number: 'دستاویز', code: 'کوڈ', date: 'تاریخ', dueOn: 'واجب الادا / متوقع تاریخ', status: 'حالت', customerId: 'خریدار', supplierId: 'سپلائر', designId: 'ڈیزائن', bomId: 'BOM', batchId: 'پیداواری بیچ', skuId: 'تیار SKU', receivedOn: 'مال وصولی', targetSuits: 'ہدف سوٹ', completedSuits: 'مکمل سوٹ', lineIds: 'لائن حوالہ جات', dispatchIds: 'ڈسپیچ حوالہ جات', allocationIds: 'مواد / ادائیگی تخصیص', amountPaisa: 'رقم', totalPaisa: 'کل رقم', openingBalancePaisa: 'ابتدائی بقایا' };
  return <section className="mb-6 rounded-xl border border-border bg-card p-5"><h2 className="mb-4 text-lg font-semibold">موجودہ تاریخی ریکارڈ کا پیش منظر</h2><dl className="grid gap-4 sm:grid-cols-2">{Object.entries(r).filter(([key]) => key in labels).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{labels[key]}</dt><dd className="mt-1 break-all text-sm"><bdi>{key === 'status' ? <StatusBadge status={String(value)} /> : key.endsWith('Paisa') ? formatPKR(Number(value)) : Array.isArray(value) ? value.join('، ') : String(value)}</bdi></dd></div>)}</dl><p className="mt-4 text-xs leading-6 text-muted-foreground">فرضی تاریخی ریکارڈ؛ ترمیم اور نئی عملی پوسٹنگ آئندہ ماڈیول میں آئے گی۔</p></section>;
}
