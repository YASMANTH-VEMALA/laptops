import { CheckCircle2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Laptop } from '@/types/laptop'

interface ComparisonTableProps {
  laptops: Laptop[]
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

type SpecRow = {
  label: string
  getValue: (l: Laptop) => string | number
  highlight?: (values: (string | number)[]) => number
  explain?: string
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'Price',
    getValue: (l) => formatPrice(l.price_inr),
    highlight: (vals) => {
      const prices = vals.map((v) => parseInt(String(v).replace(/[^0-9]/g, '')))
      return prices.indexOf(Math.min(...prices))
    },
  },
  { label: 'Processor', getValue: (l) => `${l.cpu_brand} (${l.cpu_series}-series)` },
  {
    label: 'GPU',
    getValue: (l) =>
      l.gpu_type === 'dedicated'
        ? `${l.gpu_model} @ ${l.gpu_tgp_watts}W`
        : `${l.gpu_model} (integrated)`,
    explain: 'Higher TGP wattage = faster performance',
  },
  {
    label: 'RAM',
    getValue: (l) => `${l.ram_gb}GB ${l.ram_type}`,
    highlight: (vals) => {
      const gb = vals.map((v) => parseInt(String(v)))
      return gb.indexOf(Math.max(...gb))
    },
  },
  { label: 'Storage', getValue: (l) => `${l.storage_gb}GB ${l.storage_type}` },
  {
    label: 'Display',
    getValue: (l) => `${l.display_size}" ${l.display_type} ${l.display_hz}Hz`,
  },
  {
    label: 'Brightness',
    getValue: (l) => `${l.display_nits} nits`,
    highlight: (vals) => {
      const nits = vals.map((v) => parseInt(String(v)))
      return nits.indexOf(Math.max(...nits))
    },
    explain: '300+ nits = usable outdoors',
  },
  {
    label: 'Battery',
    getValue: (l) => `${l.battery_wh}Wh`,
    highlight: (vals) => {
      const wh = vals.map((v) => parseInt(String(v)))
      return wh.indexOf(Math.max(...wh))
    },
    explain: 'Higher Wh = longer battery life',
  },
  {
    label: 'Weight',
    getValue: (l) => `${l.weight_kg}kg`,
    highlight: (vals) => {
      const kg = vals.map((v) => parseFloat(String(v)))
      return kg.indexOf(Math.min(...kg))
    },
  },
  { label: 'OS', getValue: (l) => l.os_support },
]

export function ComparisonTable({ laptops }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36 font-semibold">Spec</TableHead>
            {laptops.map((l) => (
              <TableHead key={l.id} className="font-semibold">
                {l.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {SPEC_ROWS.map((row) => {
            const values = laptops.map((l) => row.getValue(l))
            const winnerIdx = row.highlight ? row.highlight(values) : -1

            return (
              <TableRow key={row.label}>
                <TableCell className="font-medium text-sm">
                  <span>{row.label}</span>
                  {row.explain && (
                    <span className="block text-xs text-muted-foreground font-normal">
                      {row.explain}
                    </span>
                  )}
                </TableCell>
                {values.map((val, idx) => (
                  <TableCell
                    key={idx}
                    className={
                      winnerIdx === idx
                        ? 'text-green-400 font-semibold bg-green-500/5'
                        : 'text-muted-foreground'
                    }
                  >
                    {String(val)}
                    {winnerIdx === idx && (
                      <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-400" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
