import * as React from 'react'

import { cn } from '@/lib/utils'

type StatTone = 'default' | 'success' | 'warning' | 'destructive'

const DOT_TONE: Record<StatTone, string> = {
  default: 'bg-muted-foreground/40',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

/**
 * İstatistik şeridi: hücreler tek bir kutuda yan yana, aralarında ince çizgi (panel, analitik,
 * ürünler, admin hepsi bunu kullanır). Mobilde 2 sütun; tek kalan son hücre tam genişlik olur.
 */
function StatStrip({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="stat-strip"
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-sm sm:flex',
        '[&>*:last-child:nth-child(odd)]:col-span-2',
        className,
      )}
      {...props}
    />
  )
}

interface StatItemProps {
  label: React.ReactNode
  value: React.ReactNode
  /** Değerin altındaki küçük açıklama: "+12% geçen aya göre" gibi */
  hint?: React.ReactNode
  /** Etiketin önündeki durum noktası (stok durumları gibi) */
  dot?: StatTone
  className?: string
  /** Verilirse hücre düğme olur (ürünlerde stok filtresi) */
  onClick?: () => void
  active?: boolean
  title?: string
}

function StatItem({ label, value, hint, dot, className, onClick, active, title }: StatItemProps) {
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {dot && <span aria-hidden className={cn('size-1.5 rounded-full', DOT_TONE[dot])} />}
        {label}
      </span>
      <span
        className="max-w-full truncate text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl"
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </>
  )

  const cellClass = cn('relative flex min-w-0 flex-1 flex-col items-start gap-1 bg-card px-4 py-3 text-left sm:min-w-[8.5rem]', className)

  if (!onClick) {
    return (
      <div data-slot="stat-item" className={cellClass}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      data-slot="stat-item"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        cellClass,
        'min-h-0 transition-colors hover:bg-muted focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active && 'bg-muted hover:bg-muted',
      )}
    >
      {content}
      {active && <span aria-hidden className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-foreground" />}
    </button>
  )
}

export { StatStrip, StatItem }
export type { StatTone }
