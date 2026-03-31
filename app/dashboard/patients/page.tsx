"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Users,
  Plus,
  X,
  Mail,
  Trash2,
  ChevronRight,
  Calendar,
  Gamepad2,
  Search,
  Brain,
  Clock,
  Eye,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Bell,
  Send,
  MessageSquare,
} from "lucide-react"
import { ProgressChart } from "@/components/progress-chart"
import {
  getScores,
  getPredictions,
  getAlerts,
  getActiveAlerts,
  dismissAlert,
  getAllPatientEmails,
  autoPredict,
  type GameScore,
  type MLPrediction,
  type DeclineAlert,
} from "@/lib/game-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface Patient {
  patient_id: number
  email: string
  total_games: number
  last_played: string | null
}

export default function ManagePatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const [doctorId, setDoctorId] = useState<number | null>(null)

  // Patient lookup state
  const [lookupEmail, setLookupEmail] = useState("")
  const [viewingPatient, setViewingPatient] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState("")
  const [knownPatients, setKnownPatients] = useState<string[]>([])

  const refreshKnownPatients = useCallback(() => {
    setKnownPatients(getAllPatientEmails())
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return
    const user = JSON.parse(storedUser)
    setDoctorId(user.user_id)
    fetchPatients(user.user_id)
    refreshKnownPatients()

    // Poll for new patient data every 5 seconds
    const interval = setInterval(refreshKnownPatients, 5000)
    return () => clearInterval(interval)
  }, [refreshKnownPatients])

  const fetchPatients = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/doctor/${id}/patients`)
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch {
      console.error("Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) return
    setAdding(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/doctor/add-patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || "Failed to add patient")
        return
      }
      await fetchPatients(doctorId)
      setShowModal(false)
      setEmail("")
      setPassword("")
    } catch {
      setError("Could not connect to server")
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (patientId: number) => {
    if (!doctorId) return
    await fetch(`${API_URL}/doctor/${doctorId}/patients/${patientId}`, { method: "DELETE" })
    setPatients((prev) => prev.filter((p) => p.patient_id !== patientId))
  }

  const handleLookup = (emailToLookup?: string) => {
    const searchEmail = (emailToLookup || lookupEmail).toLowerCase().trim()
    if (!searchEmail) {
      setLookupError("Please enter a patient email")
      return
    }

    const scores = getScores(searchEmail)
    if (scores.length === 0) {
      setLookupError(`No data found for "${searchEmail}". The patient may not have played any games yet on this device.`)
      return
    }

    setLookupError("")
    setViewingPatient(searchEmail)
  }

  const handleLookupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never"
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // ── Patient Data View ────────────────────────────────────────────────
  if (viewingPatient) {
    return (
      <PatientDataView
        email={viewingPatient}
        onBack={() => { setViewingPatient(null); refreshKnownPatients() }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Patients</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor cognitive progress and access patient data.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      {/* ── Patient Lookup ──────────────────────────────────────────── */}
      <div className="p-6 bg-card rounded-2xl border border-border mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Patient Data Lookup</h2>
            <p className="text-sm text-muted-foreground">
              Enter a patient&apos;s email to view their complete cognitive data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={lookupEmail}
              onChange={(e) => { setLookupEmail(e.target.value); setLookupError("") }}
              onKeyDown={handleLookupKeyDown}
              placeholder="Enter patient email..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              list="patient-emails"
            />
            <datalist id="patient-emails">
              {knownPatients.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>
          <button
            onClick={() => handleLookup()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            View Data
          </button>
        </div>

        {lookupError && (
          <p className="mt-3 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">{lookupError}</p>
        )}

        {/* Quick access to known patients */}
        {knownPatients.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Patients with data on this device:</p>
            <div className="flex flex-wrap gap-2">
              {knownPatients.map((pe) => (
                <button
                  key={pe}
                  onClick={() => { setLookupEmail(pe); handleLookup(pe) }}
                  className="px-3 py-1.5 text-xs bg-muted rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {pe}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Linked Patient List ────────────────────────────────────── */}
      <h2 className="text-lg font-semibold text-foreground mb-3">Linked Patients (via Backend)</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No linked patients</h3>
          <p className="text-sm text-muted-foreground">
            Use the lookup above to view patient data, or add patients via the backend.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.patient_id}
              className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border hover:border-primary/40 transition-all group"
            >
              <div
                className="flex-1 flex items-center gap-4 cursor-pointer"
                onClick={() => handleLookup(patient.email)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-lg">
                    {patient.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{patient.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      {patient.total_games} games
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(patient.last_played)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <button
                onClick={() => handleRemove(patient.patient_id)}
                className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                title="Remove patient"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add patient modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Add Patient</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
              Enter the patient&apos;s registered email and password to link their account.
            </p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Patient Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="patient@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Patient Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">{error}</p>
              )}
              <button
                type="submit"
                disabled={adding}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
                ) : "Link Patient"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// Patient Data View Component — full data panel for caregiver
// ════════════════════════════════════════════════════════════════════════════════

interface Caregiver {
  id: number
  email: string
  name: string
}

function PatientDataView({ email, onBack }: { email: string; onBack: () => void }) {
  const [scores, setScores] = useState<GameScore[]>([])
  const [predictions, setPredictions] = useState<MLPrediction[]>([])
  const [alerts, setAlerts] = useState<DeclineAlert[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [predicting, setPredicting] = useState(false)

  // Email / caregiver state
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loadingCaregivers, setLoadingCaregivers] = useState(false)
  const [selectedCaregivers, setSelectedCaregivers] = useState<string[]>([])
  const [emailMessage, setEmailMessage] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showEmailSection, setShowEmailSection] = useState(false)

  const loadPatientData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/patient/${encodeURIComponent(email)}/data`)
      if (res.ok) {
        const data = await res.json()
        setScores(data.scores || [])
        setPredictions(data.predictions || [])
        setAlerts(data.alerts || [])
      } else {
        // Fallback or empty if patient not found on backend yet
        setScores(getScores(email))
        setPredictions(getPredictions(email))
        setAlerts(getAlerts(email))
      }
    } catch (err) {
      console.error("Failed to fetch backend profile:", err)
      setScores(getScores(email))
      setPredictions(getPredictions(email))
      setAlerts(getAlerts(email))
    }
  }, [email])

  useEffect(() => {
    loadPatientData()
    const interval = setInterval(loadPatientData, 3000)
    return () => clearInterval(interval)
  }, [loadPatientData])

  // Fetch caregivers linked to this patient
  useEffect(() => {
    const fetchCaregivers = async () => {
      setLoadingCaregivers(true)
      try {
        const res = await fetch(`${API_URL}/patient/${encodeURIComponent(email)}/caregivers`)
        if (res.ok) {
          const data = await res.json()
          setCaregivers(Array.isArray(data) ? data : [])
        }
      } catch {
        console.error("Failed to fetch caregivers")
      } finally {
        setLoadingCaregivers(false)
      }
    }
    fetchCaregivers()
  }, [email])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPatientData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleRunPrediction = async () => {
    setPredicting(true)
    await autoPredict(email)
    loadPatientData()
    setPredicting(false)
  }

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(email, alertId)
    loadPatientData()
  }

  const toggleCaregiverSelection = (caregiverEmail: string) => {
    setSelectedCaregivers((prev) =>
      prev.includes(caregiverEmail)
        ? prev.filter((e) => e !== caregiverEmail)
        : [...prev, caregiverEmail]
    )
  }

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      setEmailResult({ type: "error", text: "Please enter a message" })
      return
    }
    if (selectedCaregivers.length === 0) {
      setEmailResult({ type: "error", text: "Please select at least one caregiver" })
      return
    }

    setSendingEmail(true)
    setEmailResult(null)

    try {
      const storedUser = localStorage.getItem("user")
      const doctorEmail = storedUser ? JSON.parse(storedUser).email : "unknown"

      const res = await fetch(`${API_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_email: email,
          caregiver_emails: selectedCaregivers,
          message: emailMessage,
          doctor_email: doctorEmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setEmailResult({ type: "error", text: data.detail || "Failed to send email" })
      } else {
        setEmailResult({
          type: "success",
          text: data.status === "logged"
            ? "Email logged to server console (SMTP not configured)"
            : `Email sent to ${data.sent?.length || 0} caregiver(s)`,
        })
        setEmailMessage("")
        setSelectedCaregivers([])
      }
    } catch {
      setEmailResult({ type: "error", text: "Failed to connect to server" })
    } finally {
      setSendingEmail(false)
    }
  }

  const gameIcons: Record<string, React.ElementType> = {
    "memory-match": Brain,
    "word-recall": Clock,
    "pattern-recognition": Eye,
    "face-recognition": Users,
    reaction: Timer,
  }

  const formatGameName = (id: string) =>
    id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const getScoresByGame = () => {
    const grouped: Record<string, GameScore[]> = {}
    scores.forEach((s) => {
      if (!grouped[s.game]) grouped[s.game] = []
      grouped[s.game].push(s)
    })
    return grouped
  }

  const getTrend = (gameScores: GameScore[]) => {
    if (gameScores.length < 2) return { direction: "stable", percentage: 0 }
    const recent = gameScores.slice(-5)
    const older = gameScores.slice(-10, -5)
    if (older.length === 0) return { direction: "stable", percentage: 0 }
    const recentAvg = recent.reduce((a, b) => a + b.score, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b.score, 0) / older.length
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    if (Math.abs(change) < 5) return { direction: "stable", percentage: 0 }
    return { direction: change > 0 ? "up" : "down", percentage: Math.abs(Math.round(change)) }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low Risk": return "text-emerald-500"
      case "Moderate Risk": return "text-amber-500"
      case "High Risk": return "text-red-500"
      default: return "text-muted-foreground"
    }
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "critical": return "bg-red-500/10 border-red-500/30 text-red-500"
      case "sharp": return "bg-orange-500/10 border-orange-500/30 text-orange-500"
      case "gradual": return "bg-amber-500/10 border-amber-500/30 text-amber-500"
      default: return "bg-muted border-border text-muted-foreground"
    }
  }

  const scoresByGame = getScoresByGame()
  const predictionScores: GameScore[] = predictions.map((p, i) => ({
    id: 10000 + i,
    game: "ml-prediction",
    score: p.cognitive_score,
    created_at: p.timestamp,
  }))
  const allScores = [...scores, ...predictionScores]
  const latestPred = predictions.length > 0 ? predictions[predictions.length - 1] : null
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b.score, 0) / scores.length) * 10) / 10
    : 0
  const activeAlerts = alerts.filter((a) => !a.dismissed)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{email}</h1>
              <p className="text-muted-foreground">
                {scores.length} games played • {predictions.length} AI predictions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors ${refreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleRunPrediction}
              disabled={predicting || scores.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {predicting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              Run AI Prediction
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live — auto-refreshes every 3 seconds
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground">Total Games</p>
          <p className="text-2xl font-bold text-foreground">{scores.length}</p>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground">Avg Game Score</p>
          <p className="text-2xl font-bold text-foreground">{avgScore}</p>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground">AI Predictions</p>
          <p className="text-2xl font-bold text-foreground">{predictions.length}</p>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground">Latest AI Risk</p>
          <p className={`text-lg font-bold ${latestPred ? getRiskColor(latestPred.risk) : "text-muted-foreground"}`}>
            {latestPred?.risk || "N/A"}
          </p>
        </div>
      </div>

      {/* ── Email Caregiver Section ─────────────────────────────────── */}
      <div className="p-6 bg-card rounded-2xl border border-border mb-8">
        <button
          onClick={() => setShowEmailSection(!showEmailSection)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-foreground">Email Caregivers</h2>
              <p className="text-sm text-muted-foreground">
                Send a note to caregivers linked to this patient
                {caregivers.length > 0 && ` (${caregivers.length} found)`}
              </p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showEmailSection ? 'rotate-90' : ''}`} />
        </button>

        {showEmailSection && (
          <div className="mt-5 pt-5 border-t border-border">
            {/* Caregiver list */}
            {loadingCaregivers ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : caregivers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No caregivers linked to this patient in the database.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Link caregivers via the backend to enable email.
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Caregivers to Notify
                </label>
                <div className="space-y-2 mb-5">
                  {caregivers.map((cg) => {
                    const isSelected = selectedCaregivers.includes(cg.email)
                    return (
                      <button
                        key={cg.id}
                        onClick={() => toggleCaregiverSelection(cg.email)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{cg.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{cg.name}</p>
                          <p className="text-xs text-muted-foreground">{cg.email}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Message input */}
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message / Note
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => { setEmailMessage(e.target.value); setEmailResult(null) }}
                  placeholder="Write your note to the caregiver(s)..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                />

                {/* Result message */}
                {emailResult && (
                  <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${
                    emailResult.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {emailResult.type === 'success'
                      ? <CheckCircle className="w-4 h-4 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    {emailResult.text}
                  </div>
                )}

                {/* Send button */}
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || selectedCaregivers.length === 0 || !emailMessage.trim()}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingEmail ? 'Sending...' : `Send to ${selectedCaregivers.length} Caregiver${selectedCaregivers.length !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Active Alerts ({activeAlerts.length})
          </h2>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border-2 ${getAlertStyle(alert.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.type === "critical" ? <AlertTriangle className="w-5 h-5" /> :
                     alert.type === "sharp" ? <AlertCircle className="w-5 h-5" /> :
                     <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold uppercase">
                        {alert.type === "critical" ? "⚠ Critical Alert" :
                         alert.type === "sharp" ? "🔴 Sharp Decline" :
                         "📉 Gradual Decline"}
                      </span>
                      {alert.drop_amount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-card font-mono">-{alert.drop_amount} pts</span>
                      )}
                    </div>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-1.5 rounded-lg hover:bg-card/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest AI Prediction */}
      {latestPred && (
        <div className={`p-5 rounded-2xl border mb-8 ${
          latestPred.risk === "Low Risk" ? "bg-emerald-500/10 border-emerald-500/20" :
          latestPred.risk === "Moderate Risk" ? "bg-amber-500/10 border-amber-500/20" :
          "bg-red-500/10 border-red-500/20"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shadow-sm">
                <Activity className={`w-7 h-7 ${getRiskColor(latestPred.risk)}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest AI Cognitive Score</p>
                <p className="text-3xl font-bold text-foreground">{latestPred.cognitive_score}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <p className={`text-xl font-bold ${getRiskColor(latestPred.risk)}`}>{latestPred.risk}</p>
              <p className="text-xs text-muted-foreground">{new Date(latestPred.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="p-6 bg-card rounded-2xl border border-border mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Performance Over Time</h2>
          {predictionScores.length > 0 && (
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]"></span>
                Game Scores
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                AI Predictions
              </span>
            </div>
          )}
        </div>
        <ProgressChart scores={allScores} loading={false} predictions={predictionScores} />
      </div>

      {/* Prediction History */}
      {predictions.length > 0 && (
        <div className="p-6 bg-card rounded-2xl border border-border mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Prediction History ({predictions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-muted-foreground font-medium">#</th>
                  <th className="pb-3 text-muted-foreground font-medium">Score</th>
                  <th className="pb-3 text-muted-foreground font-medium">Risk</th>
                  <th className="pb-3 text-muted-foreground font-medium">Memory</th>
                  <th className="pb-3 text-muted-foreground font-medium">Word</th>
                  <th className="pb-3 text-muted-foreground font-medium">Pattern</th>
                  <th className="pb-3 text-muted-foreground font-medium">Face</th>
                  <th className="pb-3 text-muted-foreground font-medium">RT</th>
                  <th className="pb-3 text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...predictions].reverse().map((p, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5">{predictions.length - i}</td>
                    <td className="py-2.5 font-semibold">{p.cognitive_score}</td>
                    <td className={`py-2.5 font-medium ${getRiskColor(p.risk)}`}>{p.risk}</td>
                    <td className="py-2.5 text-muted-foreground">{p.inputs.memory_match}</td>
                    <td className="py-2.5 text-muted-foreground">{p.inputs.word_recall}</td>
                    <td className="py-2.5 text-muted-foreground">{p.inputs.pattern_recognition}</td>
                    <td className="py-2.5 text-muted-foreground">{p.inputs.face_recognition}</td>
                    <td className="py-2.5 text-muted-foreground">{p.inputs.reaction_time}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{new Date(p.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Game Breakdown */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Performance by Game</h2>
      {Object.keys(scoresByGame).length === 0 ? (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <p className="text-muted-foreground">No game data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(scoresByGame).map(([game, gameScores]) => {
            const trend = getTrend(gameScores)
            const avg = Math.round((gameScores.reduce((a, b) => a + b.score, 0) / gameScores.length) * 10) / 10
            const best = Math.max(...gameScores.map((s) => s.score))
            const worst = Math.min(...gameScores.map((s) => s.score))
            const Icon = gameIcons[game] || Brain

            return (
              <div key={game} className="p-5 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{formatGameName(game)}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-semibold">{avg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best</span>
                    <span className="font-semibold text-emerald-500">{best}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Worst</span>
                    <span className="font-semibold text-red-500">{worst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Played</span>
                    <span className="font-semibold">{gameScores.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Played</span>
                    <span className="font-semibold text-xs">
                      {new Date(gameScores[gameScores.length - 1].created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trend</span>
                    <span className={`flex items-center gap-1 font-semibold ${
                      trend.direction === "up" ? "text-emerald-500" :
                      trend.direction === "down" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {trend.direction === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                      {trend.direction === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                      {trend.direction === "stable" && <Minus className="w-3.5 h-3.5" />}
                      {trend.percentage > 0 ? `${trend.percentage}%` : "Stable"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
