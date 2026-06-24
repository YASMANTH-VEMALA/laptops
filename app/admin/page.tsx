'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Laptop, Database, Activity, Cpu, Bot, PlusCircle, ExternalLink, RefreshCw } from 'lucide-react'
import type { Laptop as LaptopType } from '@/types/laptop'

export default function AdminDashboardPage() {
  const [laptops, setLaptops] = useState<LaptopType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/laptops')
      if (!res.ok) throw new Error('Failed to fetch catalog metrics.')
      const data = await res.json()
      setLaptops(data.laptops || [])
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard metrics.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Calculate metrics
  const totalCount = laptops.length
  const activeCount = laptops.filter((l) => l.is_active).length
  const inactiveCount = totalCount - activeCount

  const cpuBrandCounts = laptops.reduce((acc, l) => {
    const brand = l.cpu_brand || 'Other'
    acc[brand] = (acc[brand] || 0) + 1
    return acc;
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      {/* Welcome & Refresh Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of the Laptick catalog, database integrations, and stats</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 border-2 border-foreground bg-white px-4 py-2 text-sm font-bold text-foreground hover:bg-primary shadow-[2px_2px_0_var(--foreground)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="border-2 border-foreground bg-red-100 p-4 text-sm font-bold text-red-700 shadow-[2px_2px_0_var(--foreground)]">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Laptops */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Catalog Size</span>
            <div className="border border-foreground bg-primary p-2 text-foreground">
              <Laptop className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{isLoading ? '—' : totalCount}</span>
            <span className="text-xs text-muted-foreground font-semibold">laptops in DB</span>
          </div>
        </div>

        {/* Active Laptops */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Active Recommendations</span>
            <div className="border border-foreground bg-accent p-2 text-foreground">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{isLoading ? '—' : activeCount}</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-500 px-1.5 py-0.5">
              {isLoading ? '' : `${((activeCount / (totalCount || 1)) * 100).toFixed(0)}% visible`}
            </span>
          </div>
        </div>

        {/* Inactive Laptops */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Inactive/Hidden</span>
            <div className="border border-foreground bg-zinc-200 p-2 text-foreground">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{isLoading ? '—' : inactiveCount}</span>
            <span className="text-xs text-muted-foreground font-semibold">draft catalog status</span>
          </div>
        </div>

        {/* CPU Architectures */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Database Connection</span>
            <div className="border border-foreground bg-primary p-2 text-foreground">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">Supabase SQL</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-500 px-1.5 py-0.5">Online</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* CPU Brand Distribution */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none">
          <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-foreground" />
            CPU Brand Distribution
          </h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-zinc-200 w-full animate-pulse border border-zinc-300"></div>
                <div className="h-4 bg-zinc-200 w-5/6 animate-pulse border border-zinc-300"></div>
                <div className="h-4 bg-zinc-200 w-4/6 animate-pulse border border-zinc-300"></div>
              </div>
            ) : totalCount === 0 ? (
              <p className="text-sm text-muted-foreground">No laptops found in database.</p>
            ) : (
              ['Intel', 'AMD', 'Apple', 'Qualcomm'].map((brand) => {
                const count = cpuBrandCounts[brand] || 0
                const percent = Number(((count / totalCount) * 100).toFixed(0))
                return (
                  <div key={brand} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground">{brand}</span>
                      <span className="text-muted-foreground font-semibold">{count} laptops ({percent}%)</span>
                    </div>
                    <div className="h-3 w-full border border-foreground bg-zinc-100 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-primary border-r border-foreground transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="border-2 border-foreground bg-white p-6 shadow-[4px_4px_0_var(--foreground)] rounded-none space-y-6">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-foreground" />
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Action 1 */}
            <Link
              href="/admin/laptops"
              className="flex flex-col gap-2 border-2 border-foreground bg-white p-4 shadow-[3px_3px_0_var(--foreground)] hover:bg-primary/10 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer"
            >
              <PlusCircle className="h-6 w-6 text-foreground" />
              <div className="text-sm font-bold text-foreground">Add Laptop</div>
              <div className="text-xs text-muted-foreground font-semibold">Manually insert a laptop into the Supabase database.</div>
            </Link>

            {/* Action 2 */}
            <Link
              href="/admin/assistant"
              className="flex flex-col gap-2 border-2 border-foreground bg-white p-4 shadow-[3px_3px_0_var(--foreground)] hover:bg-accent/10 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer"
            >
              <Bot className="h-6 w-6 text-foreground" />
              <div className="text-sm font-bold text-foreground">Consult Agent</div>
              <div className="text-xs text-muted-foreground font-semibold">Use the AI Assistant to bulk add or parse tech specifications.</div>
            </Link>
          </div>

          <div className="border-t-2 border-foreground pt-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-foreground hover:underline hover:text-accent transition-colors"
            >
              View live recommendation website
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
