'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { Laptop, LaptopInsert, UseCaseTag } from '@/types/laptop'

const USE_CASE_TAGS: UseCaseTag[] = [
  'video-editing', 'programming', 'gaming', 'general', 'business', 'ai-ml', 'design', 'content', 'students'
]

const INITIAL_FORM: LaptopInsert = {
  name: '',
  brand: '',
  slug: '',
  price_inr: 0,
  price_usd: null,
  cpu_arch: 'x86',
  cpu_brand: 'Intel',
  cpu_series: 'H',
  cpu_model: '',
  gpu_type: 'integrated',
  gpu_model: 'Intel Iris Xe Graphics',
  gpu_tgp_watts: 0,
  ram_gb: 16,
  ram_type: 'LPDDR5',
  storage_gb: 512,
  storage_type: 'NVMe',
  display_size: 14,
  display_type: 'IPS',
  display_hz: 60,
  display_nits: 300,
  display_color_gamut: null,
  battery_wh: 60,
  weight_kg: 1.4,
  os_support: 'Windows',
  best_for: [],
  pros: '',
  cons: '',
  affiliate_amazon_in: '',
  affiliate_amazon_com: null,
  image_url: null,
  is_active: true
}

function parseStorageText(text: string): number {
  const clean = text.toLowerCase().replace(/\s/g, '')
  const num = parseFloat(clean)
  if (isNaN(num)) return 0
  if (clean.includes('tb')) {
    return Math.round(num * 1000)
  }
  return Math.round(num)
}

function parseRamText(text: string): number {
  const clean = text.toLowerCase().replace(/\s/g, '')
  const num = parseFloat(clean)
  if (isNaN(num)) return 0
  return Math.round(num)
}

export default function AdminLaptopsPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([])
  const [filteredLaptops, setFilteredLaptops] = useState<Laptop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LaptopInsert>({ ...INITIAL_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Local text input states for RAM & Storage
  const [ramInputText, setRamInputText] = useState('')
  const [storageInputText, setStorageInputText] = useState('')

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchLaptops = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/laptops')
      if (!res.ok) throw new Error('Could not fetch laptops catalog.')
      const data = await res.json()
      setLaptops(data.laptops || [])
    } catch (err: any) {
      setError(err.message || 'Error loading laptops.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLaptops()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = [...laptops]

    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.brand.toLowerCase().includes(query) ||
          l.cpu_model.toLowerCase().includes(query)
      )
    }

    if (brandFilter !== 'all') {
      result = result.filter((l) => l.brand.toLowerCase() === brandFilter.toLowerCase())
    }

    if (statusFilter !== 'all') {
      const wantActive = statusFilter === 'active'
      result = result.filter((l) => l.is_active === wantActive)
    }

    setFilteredLaptops(result)
  }, [searchTerm, brandFilter, statusFilter, laptops])

  // Open modal for add
  const handleAddClick = () => {
    setEditingId(null)
    setForm({ ...INITIAL_FORM })
    setStorageInputText('')
    setRamInputText('')
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open modal for edit
  const handleEditClick = (laptop: Laptop) => {
    setEditingId(laptop.id)
    setForm({
      name: laptop.name,
      brand: laptop.brand,
      slug: laptop.slug,
      price_inr: laptop.price_inr,
      price_usd: laptop.price_usd,
      cpu_arch: laptop.cpu_arch,
      cpu_brand: laptop.cpu_brand,
      cpu_series: laptop.cpu_series,
      cpu_model: laptop.cpu_model,
      gpu_type: laptop.gpu_type,
      gpu_model: laptop.gpu_model,
      gpu_tgp_watts: laptop.gpu_tgp_watts,
      ram_gb: laptop.ram_gb,
      ram_type: laptop.ram_type,
      storage_gb: laptop.storage_gb,
      storage_type: laptop.storage_type,
      display_size: laptop.display_size,
      display_type: laptop.display_type,
      display_hz: laptop.display_hz,
      display_nits: laptop.display_nits,
      display_color_gamut: laptop.display_color_gamut,
      battery_wh: laptop.battery_wh,
      weight_kg: laptop.weight_kg,
      os_support: laptop.os_support,
      best_for: laptop.best_for || [],
      pros: laptop.pros,
      cons: laptop.cons,
      affiliate_amazon_in: laptop.affiliate_amazon_in,
      affiliate_amazon_com: laptop.affiliate_amazon_com,
      image_url: laptop.image_url,
      is_active: laptop.is_active
    })
    // Initialize text inputs
    setRamInputText(laptop.ram_gb ? `${laptop.ram_gb}GB` : '')
    setStorageInputText(
      laptop.storage_gb 
        ? laptop.storage_gb >= 1000 
          ? `${laptop.storage_gb / 1000}TB` 
          : `${laptop.storage_gb}GB`
        : ''
    )
    setFormError(null)
    setIsModalOpen(true)
  }

  // Toggle active status directly
  const handleToggleActive = async (laptop: Laptop) => {
    try {
      const res = await fetch('/api/admin/laptops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: laptop.id, is_active: !laptop.is_active }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      fetchLaptops()
    } catch (err) {
      alert('Could not update active status.')
    }
  }

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    try {
      const res = await fetch(`/api/admin/laptops/${deleteConfirmId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteConfirmId(null)
      fetchLaptops()
    } catch (err) {
      alert('Failed to delete laptop.')
    }
  }

  // Handle submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    // Basic Validation
    if (!form.name || !form.brand || form.price_inr <= 0) {
      setFormError('Please enter a valid laptop name, brand, and pricing.')
      setIsSaving(false)
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const payload = editingId ? { id: editingId, ...form } : form

      const res = await fetch('/api/admin/laptops', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save laptop data.')
      }

      setIsModalOpen(false)
      fetchLaptops()
    } catch (err: any) {
      setFormError(err.message || 'Server error. Please check form fields.')
    } finally {
      setIsSaving(false)
    }
  }

  // Multi-select for best_for tags
  const handleBestForToggle = (tag: UseCaseTag) => {
    const current = [...form.best_for]
    const idx = current.indexOf(tag)
    if (idx === -1) {
      current.push(tag)
    } else {
      current.splice(idx, 1)
    }
    setForm({ ...form, best_for: current })
  }

  // Get distinct brands for filtering
  const distinctBrands = Array.from(new Set(laptops.map((l) => l.brand))).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground font-display">Laptops Catalog</h1>
          <p className="text-sm text-muted-foreground">View and update recommendations on your platform</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 border-2 border-foreground bg-primary px-4 py-2.5 text-sm font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] hover:bg-primary/95 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          Add Laptop Manually
        </button>
      </div>

      {error && (
        <div className="border-2 border-foreground bg-red-100 p-4 text-sm font-bold text-red-700 shadow-[2px_2px_0_var(--foreground)] rounded-none">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-2 border-foreground bg-white p-4 shadow-[4px_4px_0_var(--foreground)] rounded-none">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, brand, or processor..."
            className="w-full border-2 border-foreground bg-white py-2 pr-4 pl-10 text-sm text-foreground placeholder-zinc-500 outline-none rounded-none focus:ring-2 focus:ring-accent focus:border-foreground"
          />
        </div>

        {/* Brand Dropdown */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Brand</span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border-2 border-foreground bg-white px-3 py-2 text-sm text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Brands</option>
              {distinctBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-2 border-foreground bg-white px-3 py-2 text-sm text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Hidden (Draft)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-hidden border-2 border-foreground bg-white shadow-[4px_4px_0_var(--foreground)] rounded-none">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <span className="text-sm text-muted-foreground font-semibold">Loading catalog...</span>
          </div>
        ) : filteredLaptops.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground font-semibold">
            No matching laptops found in catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="border-b-2 border-foreground bg-zinc-100 text-xs font-bold uppercase tracking-wider text-foreground">
                <tr>
                  <th className="py-3.5 px-4 border-r border-foreground">Laptop Specs</th>
                  <th className="py-3.5 px-4 border-r border-foreground">Price (INR)</th>
                  <th className="py-3.5 px-4 border-r border-foreground">Processor</th>
                  <th className="py-3.5 px-4 border-r border-foreground">Graphics</th>
                  <th className="py-3.5 px-4 border-r border-foreground">RAM / Storage</th>
                  <th className="py-3.5 px-4 border-r border-foreground text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t border-foreground divide-foreground">
                {filteredLaptops.map((laptop) => (
                  <tr key={laptop.id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 border-r border-foreground">
                      <div className="font-bold text-foreground">{laptop.name}</div>
                      <div className="text-xs text-muted-foreground font-semibold">{laptop.brand} · slug: {laptop.slug}</div>
                    </td>
                    <td className="py-4 px-4 border-r border-foreground font-mono font-bold text-foreground">
                      ₹{laptop.price_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 border-r border-foreground text-xs">
                      <div className="font-semibold">{laptop.cpu_model}</div>
                      <div className="text-muted-foreground font-semibold">{laptop.cpu_brand} {laptop.cpu_series} ({laptop.cpu_arch})</div>
                    </td>
                    <td className="py-4 px-4 border-r border-foreground text-xs">
                      <div className="font-semibold">{laptop.gpu_model}</div>
                      <div className="text-muted-foreground font-semibold">{laptop.gpu_type} {laptop.gpu_tgp_watts > 0 ? `· ${laptop.gpu_tgp_watts}W` : ''}</div>
                    </td>
                    <td className="py-4 px-4 border-r border-foreground text-xs">
                      <div className="font-semibold">{laptop.ram_gb}GB {laptop.ram_type}</div>
                      <div className="text-muted-foreground font-semibold">{laptop.storage_gb}GB {laptop.storage_type}</div>
                    </td>
                    <td className="py-4 px-4 border-r border-foreground">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggleActive(laptop)}
                          className={`border-2 border-foreground p-1 transition-all rounded-none shadow-[1px_1px_0_var(--foreground)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer ${
                            laptop.is_active
                              ? 'bg-primary text-foreground'
                              : 'bg-white text-muted-foreground hover:bg-zinc-150'
                          }`}
                          title={laptop.is_active ? 'Active (Click to Hide)' : 'Hidden (Click to Activate)'}
                        >
                          {laptop.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(laptop)}
                          className="border border-foreground bg-white p-1.5 text-foreground hover:bg-primary shadow-[1px_1px_0_var(--foreground)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(laptop.id)}
                          className="border border-foreground bg-white p-1.5 text-foreground hover:bg-red-100 hover:text-red-700 shadow-[1px_1px_0_var(--foreground)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm border-2 border-foreground bg-white p-6 shadow-[6px_6px_0_var(--foreground)] rounded-none space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black text-foreground font-display">Delete Laptop?</h3>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              Are you sure you want to delete this laptop? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="border-2 border-foreground bg-white px-4 py-2 text-sm font-bold text-foreground shadow-[2px_2px_0_var(--foreground)] hover:bg-zinc-100 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="border-2 border-foreground bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)] hover:bg-red-700 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl border-2 border-foreground bg-white p-6 shadow-[8px_8px_0_var(--foreground)] max-h-[90vh] overflow-y-auto space-y-6 rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
              <h2 className="text-xl font-black text-foreground font-display">
                {editingId ? 'Edit Laptop Specifications' : 'Add New Laptop manually'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="border border-foreground bg-white p-1.5 text-foreground hover:bg-zinc-100 rounded-none cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="border-2 border-foreground bg-red-100 p-3.5 text-sm font-bold text-red-700 shadow-[2px_2px_0_var(--foreground)] rounded-none">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6 text-sm">
              {/* Section 1: Basic details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Laptop Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Asus Zenbook 14 OLED"
                    className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Brand</label>
                  <input
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Asus"
                    className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={form.price_inr || ''}
                    onChange={(e) => setForm({ ...form, price_inr: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 95000"
                    className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Price (USD - Optional)</label>
                  <input
                    type="number"
                    value={form.price_usd || ''}
                    onChange={(e) => setForm({ ...form, price_usd: parseInt(e.target.value) || null })}
                    placeholder="e.g. 1150"
                    className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="border-t-2 border-foreground pt-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Processor Specs (CPU)</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Architecture</label>
                    <select
                      value={form.cpu_arch}
                      onChange={(e) => setForm({ ...form, cpu_arch: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="x86">x86</option>
                      <option value="ARM">ARM</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Brand</label>
                    <select
                      value={form.cpu_brand}
                      onChange={(e) => setForm({ ...form, cpu_brand: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Intel">Intel</option>
                      <option value="AMD">AMD</option>
                      <option value="Apple">Apple</option>
                      <option value="Qualcomm">Qualcomm</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Series</label>
                    <select
                      value={form.cpu_series}
                      onChange={(e) => setForm({ ...form, cpu_series: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="U">U (Ultra-low power)</option>
                      <option value="P">P (Thin & Light Performance)</option>
                      <option value="H">H (High performance)</option>
                      <option value="HX">HX (Extreme desktop class)</option>
                      <option value="M-series">M-series (Apple Silicon)</option>
                      <option value="X-series">X-series (Qualcomm Snapdragon)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Model</label>
                    <input
                      type="text"
                      required
                      value={form.cpu_model}
                      onChange={(e) => setForm({ ...form, cpu_model: e.target.value })}
                      placeholder="e.g. Ryzen 7 7840U"
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-foreground pt-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Graphics & Memory (GPU & RAM)</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">GPU Type</label>
                    <select
                      value={form.gpu_type}
                      onChange={(e) => setForm({ ...form, gpu_type: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="integrated">Integrated</option>
                      <option value="dedicated">Dedicated</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">GPU Model</label>
                    <input
                      type="text"
                      required
                      value={form.gpu_model}
                      onChange={(e) => setForm({ ...form, gpu_model: e.target.value })}
                      placeholder="e.g. AMD Radeon 780M"
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">GPU TGP (Watts)</label>
                    <input
                      type="number"
                      value={form.gpu_tgp_watts}
                      onChange={(e) => setForm({ ...form, gpu_tgp_watts: parseInt(e.target.value) || 0 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">RAM (e.g. 16GB, 8GB)</label>
                    <input
                      type="text"
                      required
                      value={ramInputText}
                      onChange={(e) => {
                        const val = e.target.value
                        setRamInputText(val)
                        setForm({ ...form, ram_gb: parseRamText(val) })
                      }}
                      placeholder="e.g. 16GB"
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">RAM Type</label>
                    <select
                      value={form.ram_type}
                      onChange={(e) => setForm({ ...form, ram_type: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="LPDDR5X">LPDDR5X</option>
                      <option value="LPDDR5">LPDDR5</option>
                      <option value="DDR5">DDR5</option>
                      <option value="DDR4">DDR4</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Storage (e.g. 512GB, 1TB, 2TB)</label>
                    <input
                      type="text"
                      required
                      value={storageInputText}
                      onChange={(e) => {
                        const val = e.target.value
                        setStorageInputText(val)
                        setForm({ ...form, storage_gb: parseStorageText(val) })
                      }}
                      placeholder="e.g. 512GB or 1TB"
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Storage Type</label>
                    <select
                      value={form.storage_type}
                      onChange={(e) => setForm({ ...form, storage_type: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="NVMe">NVMe</option>
                      <option value="SATA">SATA</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-foreground pt-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Display & Battery</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Display Size (Inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={form.display_size || ''}
                      onChange={(e) => setForm({ ...form, display_size: parseFloat(e.target.value) || 0 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Panel Type</label>
                    <select
                      value={form.display_type}
                      onChange={(e) => setForm({ ...form, display_type: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="IPS">IPS</option>
                      <option value="OLED">OLED</option>
                      <option value="Mini-LED">Mini-LED</option>
                      <option value="AMOLED">AMOLED</option>
                      <option value="TN">TN</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Refresh Rate (Hz)</label>
                    <input
                      type="number"
                      required
                      value={form.display_hz || ''}
                      onChange={(e) => setForm({ ...form, display_hz: parseInt(e.target.value) || 60 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Brightness (Nits)</label>
                    <input
                      type="number"
                      required
                      value={form.display_nits || ''}
                      onChange={(e) => setForm({ ...form, display_nits: parseInt(e.target.value) || 300 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Battery Wh</label>
                    <input
                      type="number"
                      required
                      value={form.battery_wh || ''}
                      onChange={(e) => setForm({ ...form, battery_wh: parseInt(e.target.value) || 0 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Weight (KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.weight_kg || ''}
                      onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) || 0 })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">OS Support</label>
                    <select
                      value={form.os_support}
                      onChange={(e) => setForm({ ...form, os_support: e.target.value as any })}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Windows">Windows</option>
                      <option value="macOS">macOS</option>
                      <option value="Linux">Linux</option>
                      <option value="any">Any / Dual OS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-foreground pt-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Target Use Cases</h3>
                <div className="flex flex-wrap gap-2">
                  {USE_CASE_TAGS.map((tag) => {
                    const isSelected = form.best_for.includes(tag)
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleBestForToggle(tag)}
                        className={`border-2 border-foreground px-3.5 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-foreground shadow-[2px_2px_0_var(--foreground)]'
                            : 'bg-white text-foreground hover:bg-primary/20 hover:shadow-[1px_1px_0_var(--foreground)]'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t-2 border-foreground pt-4 space-y-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Pros, Cons & Links</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Pros (Explain what is good)</label>
                    <textarea
                      required
                      value={form.pros}
                      onChange={(e) => setForm({ ...form, pros: e.target.value })}
                      placeholder="e.g. Stunning OLED display. Incredible multi-core speed."
                      rows={3}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent resize-y"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Cons (Explain trade-offs)</label>
                    <textarea
                      required
                      value={form.cons}
                      onChange={(e) => setForm({ ...form, cons: e.target.value })}
                      placeholder="e.g. Mediocre battery life. Soldered RAM cannot be upgraded."
                      rows={3}
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent resize-y"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Amazon India Affiliate Link</label>
                    <input
                      type="text"
                      required
                      value={form.affiliate_amazon_in}
                      onChange={(e) => setForm({ ...form, affiliate_amazon_in: e.target.value })}
                      placeholder="e.g. https://www.amazon.in/dp/..."
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Amazon US Link (Optional)</label>
                    <input
                      type="text"
                      value={form.affiliate_amazon_com || ''}
                      onChange={(e) => setForm({ ...form, affiliate_amazon_com: e.target.value || null })}
                      placeholder="e.g. https://www.amazon.com/dp/..."
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground">Image URL (Optional)</label>
                    <input
                      type="text"
                      value={form.image_url || ''}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                      placeholder="e.g. https://images-na.ssl-images-amazon.com/images/I/..."
                      className="w-full border-2 border-foreground bg-white py-2 px-3 text-foreground outline-none rounded-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 border-t-2 border-foreground pt-4">
                <input
                  type="checkbox"
                  id="form-is-active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 border-2 border-foreground bg-white accent-primary"
                />
                <label htmlFor="form-is-active" className="text-sm font-bold text-foreground cursor-pointer">
                  Active (Visible on comparison lists)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t-2 border-foreground pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border-2 border-foreground bg-white px-5 py-2.5 font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] hover:bg-zinc-100 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 border-2 border-foreground bg-primary px-6 py-2.5 font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] hover:bg-primary/90 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Laptop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
