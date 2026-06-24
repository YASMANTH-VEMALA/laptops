'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Shield, Trash2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  created_at: string
  is_primary?: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [newEmail, setNewEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Revoke confirm state
  const [revokeConfirmEmail, setRevokeConfirmEmail] = useState<string | null>(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Could not retrieve authorized email permissions.')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message || 'Error fetching authorized emails.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setIsSaving(true)

    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize email.')
      }

      setNewEmail('')
      setFormSuccess(`Successfully authorized admin access for ${email}`)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.message || 'Error adding email authorization.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevokeEmail = async () => {
    if (!revokeConfirmEmail) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(revokeConfirmEmail)}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke permissions.')
      }

      setRevokeConfirmEmail(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to delete permission.')
      setRevokeConfirmEmail(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground font-display">Manage Admin Access</h1>
        <p className="text-sm text-muted-foreground">Control who can access this administrative panel. Only authorized emails can log in.</p>
      </div>

      {error && (
        <div className="border-2 border-foreground bg-red-100 p-4 text-sm font-bold text-red-700 shadow-[2px_2px_0_var(--foreground)] rounded-none">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Side: Users list */}
        <div className="space-y-6">
          <div className="border-2 border-foreground bg-white shadow-[4px_4px_0_var(--foreground)] rounded-none overflow-hidden">
            <div className="border-b-2 border-foreground bg-zinc-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-foreground" />
                Authorized Admin Emails
              </h2>
              <span className="text-[10px] font-bold bg-primary border border-foreground text-foreground px-2 py-0.5 rounded-none">
                {users.length} authorized
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">Querying permissions...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-semibold text-sm">
                No authorized admin emails found.
              </div>
            ) : (
              <div className="divide-y-2 divide-foreground">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center border-2 border-foreground rounded-none ${
                        user.is_primary ? 'bg-primary text-foreground' : 'bg-zinc-100 text-foreground'
                      }`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {user.email}
                          {user.is_primary && (
                            <span className="text-[9px] font-black tracking-widest uppercase bg-foreground text-primary px-1.5 py-0.5 border border-foreground rounded-none">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          Added: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {!user.is_primary && (
                      <button
                        onClick={() => setRevokeConfirmEmail(user.email)}
                        className="border border-foreground bg-white p-1.5 text-foreground hover:bg-red-100 hover:text-red-600 rounded-none shadow-[1px_1px_0_var(--foreground)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer transition-all"
                        title="Revoke Admin Access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Add form */}
        <div className="space-y-6">
          <div className="border-2 border-foreground bg-white p-5 shadow-[4px_4px_0_var(--foreground)] rounded-none space-y-4">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-foreground" />
              Authorize New Admin
            </h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Input their email address below. Once authorized, they can log in directly using their Google account.
            </p>

            {formError && (
              <div className="border-2 border-foreground bg-red-105 p-3 text-xs font-bold text-red-750 flex items-start gap-2 rounded-none bg-red-100">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="border-2 border-foreground bg-emerald-50 p-3 text-xs font-bold text-emerald-700 flex items-start gap-2 rounded-none shadow-[2px_2px_0_var(--foreground)]">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddEmail} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. colleague@gmail.com"
                  className="w-full border-2 border-foreground bg-white py-2.5 px-3 text-xs text-foreground placeholder-zinc-500 outline-none rounded-none focus:ring-2 focus:ring-accent"
                  disabled={isSaving}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || !newEmail.trim()}
                className="w-full flex items-center justify-center gap-1.5 border-2 border-foreground bg-primary py-2.5 text-xs font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] hover:bg-primary/90 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    Grant Admin Access
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeConfirmEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm border-2 border-foreground bg-white p-6 shadow-[6px_6px_0_var(--foreground)] rounded-none space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black text-foreground font-display">Revoke Permissions?</h3>
            </div>
            <p className="text-sm text-muted-foreground font-semibold leading-relaxed">
              Are you sure you want to revoke admin credentials for <strong className="text-foreground">{revokeConfirmEmail}</strong>? They will no longer be able to log in to the admin panel.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRevokeConfirmEmail(null)}
                className="border-2 border-foreground bg-white px-4 py-2 text-sm font-bold text-foreground shadow-[2px_2px_0_var(--foreground)] hover:bg-zinc-100 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeEmail}
                className="border-2 border-foreground bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)] hover:bg-red-700 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-none cursor-pointer"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
