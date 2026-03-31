"use client"

import { useEffect, useState } from "react"
import { Plus, X, HeartPulse, Mail, User } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface Caregiver {
  id: number
  name: string
  email: string
}

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUserEmail(parsedUser.email)
      fetchCaregivers(parsedUser.email)
    }
  }, [])

  const fetchCaregivers = async (patientEmail: string) => {
    try {
      const res = await fetch(`${API_URL}/patient/${encodeURIComponent(patientEmail)}/caregivers`)
      if (res.ok) {
        const data = await res.json()
        setCaregivers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch caregivers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    
    setError(null)
    setSaving(true)
    
    try {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) return
      
      const parsedUser = JSON.parse(storedUser)
      
      const res = await fetch(`${API_URL}/patient/${encodeURIComponent(parsedUser.email)}/caregivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || "Failed to add caregiver")
        return
      }
      
      fetchCaregivers(parsedUser.email)
      setShowModal(false)
      setName("")
      setEmail("")
    } catch (err) {
      console.error(err)
      setError("Failed to connect to server")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Caregivers</h1>
          <p className="mt-1 text-muted-foreground">
            Add caregivers or emergency contacts that a doctor can notify about your cognitive health.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Caregiver
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : caregivers.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <HeartPulse className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No caregivers added</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Adding a caregiver allows your linked doctor to easily send them securely recorded notes regarding your health progress.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add First Caregiver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {caregivers.map((cg) => (
            <div key={cg.id} className="p-6 bg-card rounded-2xl border border-border flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg">{cg.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{cg.name}</h3>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-sm truncate">{cg.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Add Caregiver</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Caregiver Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="E.g. Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Caregiver Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !name.trim() || !email.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
                ) : "Save Caregiver"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
