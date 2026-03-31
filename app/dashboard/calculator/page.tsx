"use client"

import { useState } from "react"
import {
  Brain,
  Clock,
  Eye,
  Users,
  Timer,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface PredictionResult {
  cognitive_score: number
  risk: string
}

export default function CalculatorPage() {
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<PredictionResult & { inputs: typeof formData; time: string }>>([])

  const [formData, setFormData] = useState({
    memory_match: 75,
    word_recall: 70,
    pattern_recognition: 72,
    face_recognition: 78,
    reaction_time: 900,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: Number(value) }))
  }

  const handlePredict = async () => {
    setPredicting(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/predict/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()
      const pred: PredictionResult = {
        cognitive_score: data.cognitive_score,
        risk: data.risk,
      }
      setResult(pred)
      setHistory((prev) => [
        { ...pred, inputs: { ...formData }, time: new Date().toLocaleTimeString() },
        ...prev,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get prediction. Make sure the backend is running.")
    } finally {
      setPredicting(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low Risk": return "text-emerald-500"
      case "Moderate Risk": return "text-amber-500"
      case "High Risk": return "text-red-500"
      default: return "text-muted-foreground"
    }
  }

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case "Low Risk": return "bg-emerald-500/10 border-emerald-500/20"
      case "Moderate Risk": return "bg-amber-500/10 border-amber-500/20"
      case "High Risk": return "bg-red-500/10 border-red-500/20"
      default: return "bg-muted border-border"
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "Low Risk": return CheckCircle
      case "Moderate Risk": return AlertCircle
      case "High Risk": return AlertTriangle
      default: return Activity
    }
  }

  const inputFields = [
    { key: "memory_match", label: "Memory Match", icon: Brain, min: 0, max: 100, step: 1, desc: "Visual memory card matching score" },
    { key: "word_recall", label: "Word Recall", icon: Clock, min: 0, max: 100, step: 1, desc: "Verbal memory recall score" },
    { key: "pattern_recognition", label: "Pattern Recognition", icon: Eye, min: 0, max: 100, step: 1, desc: "Logical reasoning score" },
    { key: "face_recognition", label: "Face Recognition", icon: Users, min: 0, max: 100, step: 1, desc: "Facial & relational memory score" },
    { key: "reaction_time", label: "Reaction Time (ms)", icon: Timer, min: 200, max: 1500, step: 10, desc: "Lower is better (200ms=fast, 1500ms=slow)" },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Score Calculator</h1>
        <p className="mt-1 text-muted-foreground">
          Manually calculate cognitive risk scores by adjusting game performance parameters.
        </p>
      </div>

      {/* Slider Input Section */}
      <div className="p-6 bg-card rounded-2xl border border-border mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Input Parameters</h2>
            <p className="text-sm text-muted-foreground">
              Adjust the sliders to simulate a patient&apos;s game scores
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {inputFields.map(({ key, label, icon: Icon, min, max, step, desc }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-24 px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground text-center font-semibold"
                />
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={formData[key as keyof typeof formData]}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{min}</span>
                <span className="italic">{desc}</span>
                <span>{max}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <button
          onClick={handlePredict}
          disabled={predicting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {predicting ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Activity className="w-5 h-5" />
              Calculate Cognitive Score
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className={`p-6 rounded-2xl border-2 mb-8 ${getRiskBg(result.risk)}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {(() => {
                const RiskIcon = getRiskIcon(result.risk)
                return (
                  <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-sm">
                    <RiskIcon className={`w-8 h-8 ${getRiskColor(result.risk)}`} />
                  </div>
                )
              })()}
              <div>
                <p className="text-sm text-muted-foreground">Predicted Cognitive Score</p>
                <p className="text-4xl font-bold text-foreground">{result.cognitive_score}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <p className={`text-2xl font-bold ${getRiskColor(result.risk)}`}>
                {result.risk}
              </p>
            </div>
          </div>

          {/* Score interpretation */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="w-full h-2 rounded-full bg-emerald-500/20 mb-1">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: result.cognitive_score > 75 ? "100%" : "0%" }} />
                </div>
                <span className="text-emerald-500 font-medium">Low Risk (75+)</span>
              </div>
              <div>
                <div className="w-full h-2 rounded-full bg-amber-500/20 mb-1">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: result.cognitive_score >= 50 && result.cognitive_score <= 75 ? "100%" : "0%" }} />
                </div>
                <span className="text-amber-500 font-medium">Moderate (50-75)</span>
              </div>
              <div>
                <div className="w-full h-2 rounded-full bg-red-500/20 mb-1">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: result.cognitive_score < 50 ? "100%" : "0%" }} />
                </div>
                <span className="text-red-500 font-medium">High Risk (&lt;50)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation History */}
      {history.length > 0 && (
        <div className="p-6 bg-card rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Calculation History ({history.length})
            </h2>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-muted-foreground font-medium">Score</th>
                  <th className="pb-3 text-muted-foreground font-medium">Risk</th>
                  <th className="pb-3 text-muted-foreground font-medium">Mem</th>
                  <th className="pb-3 text-muted-foreground font-medium">Word</th>
                  <th className="pb-3 text-muted-foreground font-medium">Pattern</th>
                  <th className="pb-3 text-muted-foreground font-medium">Face</th>
                  <th className="pb-3 text-muted-foreground font-medium">RT</th>
                  <th className="pb-3 text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-semibold text-foreground">{h.cognitive_score}</td>
                    <td className={`py-3 font-medium ${getRiskColor(h.risk)}`}>{h.risk}</td>
                    <td className="py-3 text-muted-foreground">{h.inputs.memory_match}</td>
                    <td className="py-3 text-muted-foreground">{h.inputs.word_recall}</td>
                    <td className="py-3 text-muted-foreground">{h.inputs.pattern_recognition}</td>
                    <td className="py-3 text-muted-foreground">{h.inputs.face_recognition}</td>
                    <td className="py-3 text-muted-foreground">{h.inputs.reaction_time}</td>
                    <td className="py-3 text-muted-foreground">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
