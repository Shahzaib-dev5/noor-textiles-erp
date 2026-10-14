import { Printer } from 'lucide-react';
import { useERPStore } from '@/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertBanner, EmptyState } from '@/components/feedback/states';
import { formatDate, formatPKR, formatQuantity } from '@/lib/formatters';
import { multiplyMoney } from '@/domain/value-objects/money';

export function PrintShowcase() {
  const data = useERPStore((s) => s.data); const company = Object.values(data.companies)[0]; const order = Object.values(data.purchaseOrders)[0];
  if (!order) return <EmptyState title="طباعت کے لیے خریداری آرڈر دستیاب نہیں" />;
  const lines = order.lineIds.map((id) => data.purchaseOrderLines[id]);
  let total: number;
  try {
    total = lines.reduce((sum, line) => sum + multiplyMoney(line.unitPricePaisaPerMeter, line.quantityMeters), 0);
    if (!Number.isSafeInteger(total)) throw new Error('Unsafe total');
  } catch { return <AlertBanner tone="error">اس آرڈر کی طباعتی قدر محفوظ عددی حد سے زیادہ ہے۔ کاروباری ریکارڈ تبدیل نہیں ہوا۔</AlertBanner>; }
  return <><div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">A4 طباعت کی بنیاد · موجودہ خریداری آرڈر کا نمونہ؛ نئی دستاویز نہیں بنتی۔</p><Button onClick={() => window.print()}><Printer />طباعت کریں</Button></div><Card className="print-document p-6 sm:p-10"><header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><h2 className="text-2xl font-bold text-primary">{company.name}</h2><p className="text-sm text-muted-foreground">{company.address}</p></div><div><h3 className="text-xl font-semibold">خریداری آرڈر</h3><p><bdi className="number text-sm">{order.number}</bdi></p><p className="text-sm">تاریخ: {formatDate(order.orderDate)}</p></div></header><p className="mb-4 text-sm">سپلائر: <strong>{data.suppliers[order.supplierId].name}</strong></p><div className="overflow-x-auto"><table className="erp-table"><thead><tr><th>کپڑے کی قسم</th><th>مقدار (میٹر)</th><th>فی میٹر قیمت</th><th>کل قدر</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id}><td>{data.fabrics[line.fabricId].name}</td><td><bdi className="number">{formatQuantity(line.quantityMeters)}</bdi></td><td><bdi className="number">{formatPKR(line.unitPricePaisaPerMeter)}</bdi></td><td><bdi className="number">{formatPKR(multiplyMoney(line.unitPricePaisaPerMeter, line.quantityMeters))}</bdi></td></tr>)}</tbody></table></div><div className="mt-6 flex justify-end border-t border-border pt-4"><p className="text-lg font-semibold">کل آرڈر کی قدر: <bdi className="number">{formatPKR(total)}</bdi></p></div><footer className="mt-12 border-t border-border pt-3 text-center text-xs leading-6 text-muted-foreground">نور ٹیکسٹائل ERP · مقامی ڈیمو کا طباعتی نمونہ · قانونی انوائس نہیں</footer></Card></>;
}
