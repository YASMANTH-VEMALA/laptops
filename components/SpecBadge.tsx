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
        'flex flex-col border-2 border-foreground px-3 py-2 text-left',
        highlight ? 'bg-primary text-foreground' : 'bg-secondary',
        className
      )}
    >
      <span className="font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className={cn('mt-1 text-sm font-black', highlight && 'text-foreground')}>
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {specs.map((spec) => (
        <SpecBadge key={spec.label} {...spec} />
      ))}
    </div>
  )
}
