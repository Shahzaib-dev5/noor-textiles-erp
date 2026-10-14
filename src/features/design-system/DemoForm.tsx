import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useERPStore } from '@/store';
import { Button } from '@/components/ui/button';
import { CheckboxField, CurrencyInput, DateInput, FileUploadPreview, FormActions, FormField, FormSection, QuantityInput, RadioField, SearchableSelect, SelectInput, SwitchField, TextArea, TextInput } from '@/components/forms/controls';
import { useToast } from '@/store/toasts';
import { rupeesToPaisa, multiplyMoney } from '@/domain/value-objects/money';
import { isQuantity } from '@/domain/value-objects/quantity';
import { formatPKR } from '@/lib/formatters';

const formSchema = z.object({
  name: z.string().trim().min(2, 'کم از کم دو حروف درج کریں۔').max(100, 'نام بہت لمبا ہے۔'),
  email: z.string().email('درست ای میل درج کریں۔'),
  phone: z.string().regex(/^0\d{10}$/, '۱۱ ہندسوں کا مقامی فون نمبر درج کریں۔'),
  code: z.string().regex(/^[A-Z0-9-]{3,30}$/, 'بڑے انگریزی حروف، ہندسے یا ہائفن درج کریں۔'),
  quantity: z.coerce.number().refine((value) => isQuantity(value, false) && value <= 100000, 'مقدار مثبت، ۱۰۰۰۰۰ تک اور چار اعشاری ہندسوں میں ہو۔'),
  price: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, 'روپے زیادہ سے زیادہ دو اعشاری ہندسوں میں درج کریں۔'),
  fabricId: z.string().min(1, 'موجودہ کپڑا منتخب کریں۔'),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'درست تاریخ منتخب کریں۔').refine((value) => { const date = new Date(value); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; }, 'تاریخ درست نہیں۔'),
  priority: z.enum(['normal', 'high']), packaging: z.enum(['roll', 'thaan']), notes: z.string().max(500, 'نوٹس ۵۰۰ حروف تک رکھیں۔'),
  reminders: z.boolean(), confirmed: z.boolean().refine(Boolean, 'یہ تصویری مثال ہونے کی تصدیق کریں۔'),
});
export type UIExampleRecord = z.infer<typeof formSchema> & { id: 'ui-example:1'; totalPaisa: number };
export function DemoForm({ onSaved, onDirty }: { onSaved: (record: UIExampleRecord) => void; onDirty?: (dirty: boolean) => void }) {
  const fabrics = useERPStore((s) => s.data.fabrics);
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema), defaultValues: { name: '', email: '', phone: '', code: '', quantity: 1, price: '250.00', fabricId: '', dueOn: '', priority: 'normal', packaging: 'roll', notes: '', reminders: true, confirmed: false },
  });
  useEffect(() => { onDirty?.(isDirty); }, [isDirty, onDirty]);
  const errorProps = (name: keyof z.input<typeof formSchema>) => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `example-${name}-error` : undefined });
  return <form noValidate className="space-y-5" onSubmit={handleSubmit((values) => {
    if (!fabrics[values.fabricId]) { useToast.getState().add('منتخب کپڑا موجود نہیں رہا۔', 'error'); return; }
    const record: UIExampleRecord = { ...values, id: 'ui-example:1', totalPaisa: multiplyMoney(rupeesToPaisa(values.price), values.quantity) };
    onSaved(record); reset(values); useToast.getState().add(`تصویری نمونہ محفوظ ہوا؛ کل ${formatPKR(record.totalPaisa)}۔`);
  })}>
    <FormSection title="رابطہ اور حوالہ" description="یہ عارضی UI مثال ہے؛ سپلائر، آرڈر یا اسٹاک کا ریکارڈ نہیں بنتا۔">
      <FormField id="example-name" label="نام" required error={errors.name?.message}><TextInput id="example-name" {...register('name')} {...errorProps('name')} /></FormField>
      <FormField id="example-code" label="دستاویز کا کوڈ" required error={errors.code?.message}><TextInput id="example-code" dir="ltr" className="number" placeholder="UI-001" {...register('code')} {...errorProps('code')} /></FormField>
      <FormField id="example-email" label="ای میل" required error={errors.email?.message}><TextInput id="example-email" type="email" dir="ltr" {...register('email')} {...errorProps('email')} /></FormField>
      <FormField id="example-phone" label="فون نمبر" required error={errors.phone?.message}><TextInput id="example-phone" type="tel" dir="ltr" className="number" placeholder="03000000000" {...register('phone')} {...errorProps('phone')} /></FormField>
    </FormSection>
    <FormSection title="پیمائش اور تفصیلات">
      <FormField id="example-fabricId" label="موجودہ کپڑا" required error={errors.fabricId?.message}><Controller name="fabricId" control={control} render={({ field }) => <SearchableSelect id="example-fabricId" label="موجودہ کپڑا" value={field.value} onValueChange={field.onChange} options={Object.values(fabrics).map((fabric) => ({ value: fabric.id, label: fabric.name }))} />} /></FormField>
      <FormField id="example-quantity" label="مقدار (میٹر)" required error={errors.quantity?.message}><QuantityInput id="example-quantity" {...register('quantity')} {...errorProps('quantity')} /></FormField>
      <FormField id="example-price" label="فی میٹر قیمت (روپے)" required error={errors.price?.message}><CurrencyInput id="example-price" {...register('price')} {...errorProps('price')} /></FormField>
      <FormField id="example-dueOn" label="تاریخ" required error={errors.dueOn?.message}><DateInput id="example-dueOn" {...register('dueOn')} {...errorProps('dueOn')} /></FormField>
      <FormField id="example-priority" label="ترجیح"><SelectInput id="example-priority" {...register('priority')}><option value="normal">معمول</option><option value="high">زیادہ</option></SelectInput></FormField>
      <div><p className="mb-2 text-sm">پیکنگ کا نمونہ</p><div className="flex gap-5"><RadioField label="رول" value="roll" {...register('packaging')} /><RadioField label="تھان" value="thaan" {...register('packaging')} /></div></div>
      <div className="sm:col-span-2"><FormField id="example-notes" label="نوٹس" error={errors.notes?.message}><TextArea id="example-notes" {...register('notes')} {...errorProps('notes')} /></FormField></div>
      <SwitchField label="نمونہ یاد دہانی" {...register('reminders')} /><CheckboxField label="یہ صرف UI مثال ہے" {...register('confirmed')} error={errors.confirmed?.message} />
      <FileUploadPreview />
    </FormSection>
    <FormActions><Button type="button" variant="outline" onClick={() => reset()}>فارم صاف کریں</Button><Button type="submit">نمونہ محفوظ کریں</Button></FormActions>
  </form>;
}
