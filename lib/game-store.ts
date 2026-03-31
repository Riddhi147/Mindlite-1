/**
 * game-store.ts — Centralized localStorage data layer for MindLite
 *
 * Stores scores, ML predictions, and alerts keyed by user email.
 * Works entirely without a database.  When the backend IS available,
 * callers can ALSO POST to the API — this module is purely local.
 *
 * Custom events are dispatched so the progress page can live-update
 * without polling.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GameScore {
  id: number
  game: string
  score: number
  created_at: string
}

export interface MLPrediction {
  cognitive_score: number
  risk: string
  timestamp: string
  inputs: {
    memory_match: number
    word_recall: number
    pattern_recognition: number
    face_recognition: number
    reaction_time: number
  }
}

export interface DeclineAlert {
  id: string
  type: "sharp" | "gradual" | "critical"
  message: string
  drop_amount: number
  current_score: number
  timestamp: string
  dismissed: boolean
}

// ─── Keys ────────────────────────────────────────────────────────────────────

const scoresKey = (email: string) => `mindlite_scores_${email.toLowerCase()}`
const predsKey = (email: string) => `mindlite_preds_${email.toLowerCase()}`
const alertsKey = (email: string) => `mindlite_alerts_${email.toLowerCase()}`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export async function syncToBackend(email: string) {
  if (!email || typeof window === "undefined") return
  
  try {
    const scores = getScores(email)
    const predictions = getPredictions(email)
    const alerts = getAlerts(email)
    
    await fetch(`${API_URL}/sync-patient-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        scores,
        predictions,
        alerts
      }),
    })
  } catch (err) {
    console.error("Failed to sync backend:", err)
  }
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export function getScores(email: string): GameScore[] {
  return read<GameScore>(scoresKey(email))
}

export function addScore(email: string, game: string, score: number): GameScore {
  const scores = getScores(email)
  const entry: GameScore = {
    id: Date.now(),
    game,
    score,
    created_at: new Date().toISOString(),
  }
  scores.push(entry)
  write(scoresKey(email), scores)

  // Dispatch custom event for live updates
  window.dispatchEvent(new CustomEvent("mindlite:score", { detail: entry }))
  syncToBackend(email)
  return entry
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export function getPredictions(email: string): MLPrediction[] {
  return read<MLPrediction>(predsKey(email))
}

export function addPrediction(email: string, pred: MLPrediction) {
  const preds = getPredictions(email)
  preds.push(pred)
  write(predsKey(email), preds)

  window.dispatchEvent(new CustomEvent("mindlite:prediction", { detail: pred }))
  syncToBackend(email)
}

export function clearPredictions(email: string) {
  write(predsKey(email), [])
  syncToBackend(email)
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function getAlerts(email: string): DeclineAlert[] {
  return read<DeclineAlert>(alertsKey(email))
}

export function getActiveAlerts(email: string): DeclineAlert[] {
  return getAlerts(email).filter((a) => !a.dismissed)
}

export function addAlert(email: string, alert: DeclineAlert) {
  const alerts = getAlerts(email)
  alerts.push(alert)
  write(alertsKey(email), alerts)

  window.dispatchEvent(new CustomEvent("mindlite:alert", { detail: alert }))
  syncToBackend(email)
}

export function dismissAlert(email: string, alertId: string) {
  const alerts = getAlerts(email)
  const updated = alerts.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
  write(alertsKey(email), updated)

  window.dispatchEvent(new CustomEvent("mindlite:alert-dismissed", { detail: alertId }))
  syncToBackend(email)
}

export function clearAlerts(email: string) {
  write(alertsKey(email), [])
  syncToBackend(email)
}

// ─── Aggregate latest scores per game (for ML prediction input) ──────────────

export function getLatestScoresPerGame(email: string) {
  const scores = getScores(email)

  const latest: Record<string, number> = {}
  // Walk backward to find the most recent score per game
  for (let i = scores.length - 1; i >= 0; i--) {
    const s = scores[i]
    if (!latest[s.game]) {
      latest[s.game] = s.score
    }
  }

  return {
    memory_match: latest["memory-match"] ?? 70,
    word_recall: latest["word-recall"] ?? 70,
    pattern_recognition: latest["pattern-recognition"] ?? 70,
    face_recognition: latest["face-recognition"] ?? 70,
    reaction_time: latest["reaction"] ? Math.round(1000 - latest["reaction"] * 8) : 900,
  }
}

// ─── Auto-predict after a game ───────────────────────────────────────────────

export async function autoPredict(email: string): Promise<MLPrediction | null> {
  const inputs = getLatestScoresPerGame(email)

  try {
    const res = await fetch(`${API_URL}/predict/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    })

    if (!res.ok) return null

    const data = await res.json()
    const pred: MLPrediction = {
      cognitive_score: data.cognitive_score,
      risk: data.risk,
      timestamp: new Date().toISOString(),
      inputs,
    }

    addPrediction(email, pred)
    return pred
  } catch (err) {
    console.error("Auto-predict failed:", err)
    return null
  }
}

// ─── Full auto-save + predict pipeline (called by each game) ─────────────────

export async function gameCompleted(email: string, game: string, score: number) {
  // 1. Save score locally
  addScore(email, game, score)

  // 2. Try to save to backend too (non-blocking)
  try {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const { user_id } = JSON.parse(storedUser)
      fetch(`${API_URL}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, game, score }),
      }).catch(() => {}) // silently fail if DB is down
    }
  } catch {}

  // Predictions are now doctor-only — triggered from Manage Patients page
}

// ─── Get all registered patient emails (for caregiver) ───────────────────────

export function getAllPatientEmails(): string[] {
  const emails: Set<string> = new Set()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith("mindlite_scores_")) {
      emails.add(key.replace("mindlite_scores_", ""))
    }
  }
  return Array.from(emails)
}
