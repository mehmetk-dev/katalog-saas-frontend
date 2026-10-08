import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statIconVariants = cva('flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4', {
  variants: {
    tone: {
      default: 'bg-muted text-foreground',
      brand: 'bg-brand-soft text-brand',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning-soft-foreground',
      info: 'bg-info-soft text-info',
      destructive: 'bg-destructive-soft text-destructive',
    },
  },
  defaultVariants: { tone: 'default' },
})

interface StatCardProps extends VariantProps<typeof statIconVariants> {
  label: React.ReactNode
  value: React.ReactNode
  icon?: LucideIcon
  /** Değerin altındaki küçük açıklama: "+12% geçen haftaya göre" gibi */
  hint?: React.ReactNode
  className?: string
}

/** Dashboard / analytics / admin istatistik kartı. */
function StatCard({ label, value, icon: Icon, hint, tone, className }: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn('flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-5', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className={statIconVariants({ tone })}>
            <Icon />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

export { StatCard }
