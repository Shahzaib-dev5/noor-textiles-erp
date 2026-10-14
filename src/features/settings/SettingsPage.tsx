import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, RotateCcw, Upload, Info, Sun, Moon } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultNotice } from '@/components/feedback/ResultNotice';
import { useERPStore, type ActionResult } from '@/store';
import { t } from '@/locales/ur';
import { MAX_IMPORT_BYTES } from '@/services/storage';
import { ConfirmationDialog } from '@/components/dialogs/Dialog';
import { useToast } from '@/store/toasts';
import { useUIStore } from '@/store/ui-preferences';

interface ImportForm { json: string; confirmed: boolean }

export default function SettingsPage() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const themePreference = useUIStore((s) => s.preferences.theme);
  const updatePreferences = useUIStore((s) => s.updatePreferences);
  const exportDemo = useERPStore((state) => state.exportDemo);
  const importDemo = useERPStore((state) => state.importDemo);
  const resetDemo = useERPStore((state) => state.resetDemo);
  const theme = useERPStore((state) => state.theme);
  const setTheme = useERPStore((state) => state.setTheme);
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ImportForm>({ defaultValues: { json: '', confirmed: false } });

  function downloadSnapshot() {
    try {
      const snapshot = exportDemo();
      const url = URL.createObjectURL(new Blob([snapshot], { type: 'application/json;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'noor-textiles-demo-v1.json';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResult({ ok: true, message: 'ڈیمو کی JSON نقل ڈاؤن لوڈ کے لیے تیار کر دی گئی۔' });
    } catch { setResult({ ok: false, message: 'ڈیٹا برآمد نہیں ہو سکا۔ براؤزر کی ڈاؤن لوڈ کی اجازت چیک کریں۔' }); }
  }

  return <>
    <PageHeading title={t('settings')} description="مقامی ڈیمو کی نقل محفوظ کریں، بحال کریں اور ظاہری تھیم بدلیں۔" eyebrow="بنیادی نظام" />
    <div className="mb-6"><ResultNotice result={result} /></div>
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6"><Card className="p-6"><div className="mb-3 flex items-center gap-3"><Upload className="size-5 text-primary" /><h2 className="text-xl font-semibold">ڈیمو ڈیٹا درآمد کریں</h2></div><p className="mb-5 text-base leading-8 text-muted-foreground">اسی ایپ سے برآمد کی گئی JSON نقل منتخب کریں یا اس کا متن درج کریں۔ درست فائل کی تصدیق کے بعد موجودہ محفوظ ڈیٹا تبدیل ہو گا۔</p>
        <form onSubmit={handleSubmit((values) => { const outcome = importDemo(values.json); setResult(outcome); useToast.getState().add(outcome.message, outcome.ok ? 'success' : 'error'); if (outcome.ok) reset(); })} className="space-y-4" noValidate>
          <div><label htmlFor="import-file" className="mb-2 block text-base">JSON فائل</label><input id="import-file" type="file" accept="application/json,.json" className="block w-full rounded-xl border border-border p-2 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > MAX_IMPORT_BYTES) { setResult({ ok: false, message: 'فائل ۵ میگابائٹ سے بڑی ہے۔ چھوٹی ڈیمو نقل منتخب کریں۔' }); return; } try { setValue('json', await file.text(), { shouldValidate: true }); setValue('confirmed', false); setResult(null); } catch { setResult({ ok: false, message: 'فائل پڑھی نہیں جا سکی۔' }); } }} /></div>
          <div><label htmlFor="import-json" className="mb-2 block text-base">ڈیمو JSON</label><textarea id="import-json" dir="ltr" rows={7} placeholder='{ "schemaVersion": 1, ... }' className="number w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-xs leading-6 focus:outline-none focus:ring-2 focus:ring-primary" {...register('json', { required: 'درآمد کے لیے JSON ڈیٹا درج کریں۔', maxLength: { value: MAX_IMPORT_BYTES, message: 'ڈیمو نقل بہت بڑی ہے۔' } })} aria-invalid={Boolean(errors.json)} aria-describedby={errors.json ? 'json-error' : undefined} />{errors.json && <p id="json-error" role="alert" className="text-sm text-destructive">{errors.json.message}</p>}</div>
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-7"><input type="checkbox" className="mt-1.5 size-4 accent-emerald-800" {...register('confirmed', { required: 'موجودہ ڈیٹا تبدیل کرنے کی تصدیق کریں۔' })} /><span>میں سمجھتا ہوں کہ درست درآمد میرے موجودہ ڈیمو ریکارڈ کی جگہ لے گی۔</span></label>{errors.confirmed && <p role="alert" className="text-sm text-destructive">{errors.confirmed.message}</p>}
          <Button type="submit" disabled={isSubmitting}><Upload />جانچ کر کے درآمد کریں</Button>
        </form>
      </Card><Card className="border-destructive/20 p-6"><div className="mb-3 flex items-center gap-3"><RotateCcw className="size-5 text-destructive" /><h2 className="text-xl font-semibold">ابتدائی ڈیمو بحال کریں</h2></div><p className="mb-4 text-base leading-8 text-muted-foreground">موجودہ مقامی ریکارڈ کی جگہ اصل مربوط نمونہ آ جائے گا۔ پہلے ضرورت کے مطابق اپنی JSON نقل محفوظ کر لیں۔</p><label className="mb-4 flex cursor-pointer items-start gap-2 text-sm leading-7"><input type="checkbox" className="mt-1.5 size-4 accent-red-700" checked={resetConfirmed} onChange={(event) => setResetConfirmed(event.target.checked)} /><span>میں موجودہ ڈیمو ڈیٹا تبدیل کر کے ابتدائی ریکارڈ بحال کرنا چاہتا ہوں۔</span></label><Button variant="destructive" disabled={!resetConfirmed} onClick={() => setResetOpen(true)}><RotateCcw />اصل ڈیمو ری سیٹ کریں</Button></Card></div>
      <div className="space-y-6"><Card className="p-6"><Download className="mb-4 size-6 text-primary" /><h2 className="text-xl font-semibold">اپنے ریکارڈ کی نقل</h2><p className="mb-5 mt-2 text-base leading-8 text-muted-foreground">محفوظ کاروباری ریکارڈ ایک فائل میں برآمد کریں۔ آزمائشی منظرنامہ، تھیم اور منتخب ڈیمو کردار اس نقل میں شامل نہیں ہوتے۔</p><Button variant="outline" className="w-full" onClick={downloadSnapshot}><Download />JSON نقل ڈاؤن لوڈ کریں</Button></Card>
        <Card className="p-6"><h2 className="mb-4 text-xl font-semibold">ظاہری تھیم</h2><div className="grid grid-cols-3 gap-3"><Button variant={theme === 'light' ? 'default' : 'outline'} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun />روشن</Button><Button variant={theme === 'dark' ? 'default' : 'outline'} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon />تاریک</Button><Button variant={themePreference === 'system' ? 'default' : 'outline'} aria-pressed={themePreference === 'system'} onClick={() => updatePreferences({ theme: 'system' })}>سسٹم</Button></div></Card>
        <div className="rounded-xl border border-border p-5"><div className="mb-2 flex items-center gap-2 text-muted-foreground"><Info className="size-4" /><h2 className="text-lg font-semibold">یہ مقامی ڈیمو ہے</h2></div><p className="text-sm leading-8 text-muted-foreground">ڈیٹا صرف اسی براؤزر میں محفوظ ہوتا ہے۔ براؤزر کا ڈیٹا صاف ہونے پر ریکارڈ مٹ سکتے ہیں۔ ایک وقت میں ایک ٹیب استعمال کریں۔ ڈیمو کردار صرف پیشکش کے لیے ہیں؛ یہ لاگ اِن یا محفوظ اجازت کا نظام نہیں ہے۔</p></div>
      </div>
    </div>
    <ConfirmationDialog open={resetOpen} onClose={() => setResetOpen(false)} title="اصل ڈیمو بحال کریں؟" description="موجودہ کاروباری نقل اصل گولڈن ریکارڈ سے تبدیل ہو گی۔ ظاہری ترجیحات برقرار رہیں گی۔" destructive confirmLabel="تصدیق کر کے ری سیٹ کریں" onConfirm={() => { const outcome = resetDemo(); setResult(outcome); setResetConfirmed(false); setResetOpen(false); useToast.getState().add(outcome.message, outcome.ok ? 'success' : 'error'); }} />
  </>;
}
