'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { LaptopCard } from '@/components/LaptopCard'
import type { Laptop } from '@/types/laptop'

interface LaptopsClientProps {
  laptops: Laptop[]
}

export function LaptopsClient({ laptops }: LaptopsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLaptops = useMemo(() => {
    if (!searchQuery.trim()) return laptops

    const query = searchQuery.toLowerCase()
    return laptops.filter(
      (laptop) =>
        laptop.name.toLowerCase().includes(query) ||
        laptop.brand.toLowerCase().includes(query) ||
        laptop.cpu_model.toLowerCase().includes(query) ||
        laptop.gpu_model.toLowerCase().includes(query)
    )
  }, [laptops, searchQuery])

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by laptop name, brand, CPU, or GPU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredLaptops.length} of {laptops.length} laptops
        </p>
      )}

      {/* Laptop grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredLaptops.map((laptop) => (
          <LaptopCard key={laptop.id} laptop={laptop} />
        ))}
      </div>

      {/* No results */}
      {filteredLaptops.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-5xl mb-4">🔍</p>
          <p>No laptops found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
