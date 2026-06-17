import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

/* ---------------------------------- Button --------------------------------- */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/25',
        outline: 'border border-border bg-white/[0.02] text-foreground hover:bg-white/[0.06]',
        ghost: 'text-foreground/75 hover:bg-white/[0.06] hover:text-foreground',
      },
      size: { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-7 text-base' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

/* ----------------------------------- Card ---------------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card/70 backdrop-blur-sm', className)}
      {...props}
    />
  )
}

/* ---------------------------------- Badge ---------------------------------- */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-white/[0.03] text-muted',
        approve: 'border-approve/30 bg-approve/10 text-approve',
        block: 'border-block/30 bg-block/10 text-block',
        caution: 'border-caution/30 bg-caution/10 text-caution',
        brand: 'border-primary/30 bg-primary/10 text-primary',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
