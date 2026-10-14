import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { statusPresentation, type DisplayStatus } from '@/locales/ur/status';
export function StatusBadge({ status }: { status: string }) {
  const presentation = Object.prototype.hasOwnProperty.call(statusPresentation, status) ? statusPresentation[status as DisplayStatus] : [status, 'neutral'];
  const tones: Record<string, string> = { neutral: 'bg-muted text-muted-foreground', warning: 'bg-warning/10 text-warning-foreground border-warning/20', success: 'bg-success/10 text-success-foreground border-success/20', info: 'bg-primary/10 text-primary border-primary/20', error: 'bg-destructive/10 text-destructive-foreground border-destructive/20' };
  return <Badge className={cn('whitespace-nowrap', tones[presentation[1]])}>{presentation[0]}</Badge>;
}
