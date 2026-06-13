'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { LaptopCard } from '@/components/LaptopCard'
import type { Laptop } from '@/types/laptop'

interface LaptopsClientProps {
  laptops: Laptop[]
}

const TOP_BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI']

export function LaptopsClient({ laptops }: LaptopsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')

  const filteredLaptops = useMemo(() => {
    let filtered = laptops

    // Filter by brand
    if (selectedBrand !== 'all') {
      if (selectedBrand === 'other') {
        filtered = filtered.filter((laptop) => !TOP_BRANDS.includes(laptop.brand))
      } else {
        filtered = filtered.filter((laptop) => laptop.brand === selectedBrand)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (laptop) =>
          laptop.name.toLowerCase().includes(query) ||
          laptop.brand.toLowerCase().includes(query) ||
          laptop.cpu_model.toLowerCase().includes(query) ||
          laptop.gpu_model.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [laptops, searchQuery, selectedBrand])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, CPU, or GPU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Brand filter */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px]"
        >
          <option value="all">All Brands</option>
          {TOP_BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
          <option value="other">Other Brands</option>
        </select>
      </div>

      {/* Results count */}
      {(searchQuery || selectedBrand !== 'all') && (
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
