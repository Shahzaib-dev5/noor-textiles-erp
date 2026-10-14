import { Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/states';
import { formatDate } from '@/lib/formatters';
import type { ActivityLog } from '@/domain/entities';
export function ActivityFeed({ activities }: { activities: readonly ActivityLog[] }) { return <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">حالیہ کاروباری سرگرمیاں</h2>{activities.length ? <ol className="space-y-4">{activities.slice(0, 5).map((activity) => <li key={activity.id} className="flex items-start gap-3"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/7 text-primary"><Clock3 className="size-3.5" /></span><div><p className="text-sm leading-7">{activity.detail}</p><p className="text-xs text-muted-foreground">{formatDate(activity.createdAt)} · {activity.origin === 'SEED' ? 'تاریخی ڈیمو' : 'ڈیمو کارروائی'}</p></div></li>)}</ol> : <EmptyState title="ابھی کوئی سرگرمی نہیں" />}</Card>; }
