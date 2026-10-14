import type { ReactNode } from 'react';

export function PageHeading({ title, description, action, eyebrow }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>{eyebrow && <p className="mb-1 text-sm font-semibold text-primary">{eyebrow}</p>}<h1 className="text-3xl font-bold leading-relaxed tracking-tight sm:text-4xl">{title}</h1><p className="mt-1 text-base leading-8 text-muted-foreground">{description}</p></div>
    {action}
  </div>;
}
