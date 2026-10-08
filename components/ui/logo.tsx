import { cn } from '@/lib/utils'

const sizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
} as const

interface LogoProps {
  size?: keyof typeof sizes
  /** false → yalnızca "FOG" (dar alanlar, katalog başlığı) */
  showSuffix?: boolean
  /** Sadece "F" harfi — daraltılmış sidebar gibi çok dar alanlar için */
  markOnly?: boolean
  /** Metin rengi ("Catalog" kısmı) için: koyu zeminde className="text-white" */
  className?: string
}

function Logo({ size = 'md', showSuffix = true, markOnly = false, className }: LogoProps) {
  return (
    <span
      data-slot="logo"
      className={cn('font-montserrat inline-flex items-center tracking-tighter text-foreground', sizes[size], className)}
    >
      <span className="font-black uppercase text-brand">{markOnly ? 'F' : 'Fog'}</span>
      {!markOnly && showSuffix && <span className="font-light">Catalog</span>}
    </span>
  )
}

export { Logo }
