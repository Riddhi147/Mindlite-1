/**
 * decline-detection.ts — Detect sharp/gradual cognitive decline
 *
 * Called automatically after each ML prediction.
 * Thresholds:
 *   Sharp:   latest score drops ≥15 points vs rolling avg of last 5
 *   Gradual: 3+ consecutive declining scores with total drop ≥10
 *   Critical: any score below 40
 */

import { getPredictions, addAlert, type MLPrediction, type DeclineAlert } from "./game-store"

export function detectDecline(email: string, latest: MLPrediction) {
  const preds = getPredictions(email)
  if (preds.length < 2) return // need at least 2 predictions

  const score = latest.cognitive_score

  // ── Critical: absolute threshold ────────────────────────────────────────
  if (score < 40) {
    const alert: DeclineAlert = {
      id: `critical_${Date.now()}`,
      type: "critical",
      message: `Critical: Cognitive score dropped to ${score}, which is below the safety threshold of 40. Immediate medical consultation is recommended.`,
      drop_amount: 0,
      current_score: score,
      timestamp: new Date().toISOString(),
      dismissed: false,
    }
    addAlert(email, alert)
    return // critical takes priority
  }

  // ── Sharp decline: vs rolling average of last 5 ─────────────────────────
  const recentPreds = preds.slice(-6, -1) // last 5 (excluding the latest which is already appended)
  if (recentPreds.length >= 2) {
    const rollingAvg =
      recentPreds.reduce((acc, p) => acc + p.cognitive_score, 0) / recentPreds.length
    const drop = rollingAvg - score

    if (drop >= 15) {
      const alert: DeclineAlert = {
        id: `sharp_${Date.now()}`,
        type: "sharp",
        message: `Sharp Decline Detected: Score dropped ${drop.toFixed(1)} points from an average of ${rollingAvg.toFixed(1)} to ${score}. This may indicate a sudden cognitive change.`,
        drop_amount: Math.round(drop * 10) / 10,
        current_score: score,
        timestamp: new Date().toISOString(),
        dismissed: false,
      }
      addAlert(email, alert)
      return
    }
  }

  // ── Gradual decline: 3+ consecutive decreasing scores, total ≥10 ────────
  if (preds.length >= 3) {
    const last3 = preds.slice(-3)
    const isDecreasing =
      last3[0].cognitive_score > last3[1].cognitive_score &&
      last3[1].cognitive_score > last3[2].cognitive_score
    const totalDrop = last3[0].cognitive_score - last3[2].cognitive_score

    if (isDecreasing && totalDrop >= 10) {
      const alert: DeclineAlert = {
        id: `gradual_${Date.now()}`,
        type: "gradual",
        message: `Gradual Decline Detected: Scores have dropped ${totalDrop.toFixed(1)} points over the last 3 sessions (${last3[0].cognitive_score} → ${last3[1].cognitive_score} → ${last3[2].cognitive_score}). Consider scheduling a cognitive assessment.`,
        drop_amount: Math.round(totalDrop * 10) / 10,
        current_score: score,
        timestamp: new Date().toISOString(),
        dismissed: false,
      }
      addAlert(email, alert)
    }
  }
}
