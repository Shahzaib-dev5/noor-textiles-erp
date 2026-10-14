import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  { variants: {
    variant: { default: 'bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]', outline: 'border border-border bg-card hover:bg-muted', ghost: 'hover:bg-muted', destructive: 'bg-[var(--danger-button-bg)] text-[var(--danger-button-text)] hover:opacity-90' },
    size: { default: 'h-11 px-4', sm: 'h-9 rounded-lg px-3 text-sm', icon: 'size-10' },
  }, defaultVariants: { variant: 'default', size: 'default' } },
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...(asChild ? {} : { type })} {...props} />;
});
Button.displayName = 'Button';
