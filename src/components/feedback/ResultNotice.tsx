import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ResultNotice({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  const Icon = result.ok ? CheckCircle2 : AlertCircle;
  return <div role={result.ok ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-xl border p-3 text-base ${result.ok ? 'border-primary/20 bg-primary/5 text-primary' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}><Icon className="mt-1 size-4 shrink-0" /><span>{result.message}</span></div>;
}
