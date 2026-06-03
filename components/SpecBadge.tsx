import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SpecBadgeProps {
  label: string
  value: string
  highlight?: boolean
  className?: string
}

export function SpecBadge({ label, value, highlight, className }: SpecBadgeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-md border px-3 py-2 text-center',
        highlight ? 'border-accent/40 bg-accent/5' : 'border-border bg-secondary',
        className
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('mt-0.5 text-sm font-semibold', highlight && 'text-accent')}>
        {value}
      </span>
    </div>
  )
}

interface SpecGridProps {
  specs: { label: string; value: string; highlight?: boolean }[]
}

export function SpecGrid({ specs }: SpecGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
      {specs.map((spec) => (
        <SpecBadge key={spec.label} {...spec} />
      ))}
    </div>
  )
}
