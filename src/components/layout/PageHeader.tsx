import type { ReactNode } from 'react';
import { PageActions } from './AppLayout';

export function PageHeader({ title, description, eyebrow, action }: { title: string; description?: string; eyebrow?: string; action?: ReactNode }) { return <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div>{eyebrow && <p className="mb-1 text-xs text-primary">{eyebrow}</p>}<h1 className="font-bold">{title}</h1>{description && <p className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>}</div>{action && <PageActions>{action}</PageActions>}</div>; }
