"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trophy, Zap, CheckCircle } from "lucide-react"
import { gameCompleted } from "@/lib/game-store"
const TOTAL_ROUNDS = 5
const MIN_DELAY = 1500 // ms before green
const MAX_DELAY = 4000

type Phase = "idle" | "waiting" | "go" | "result" | "early" | "done"

export default function ReactionGame() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const startRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const startRound = () => {
    setPhase("waiting")
    setCurrentTime(null)
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
    timerRef.current = setTimeout(() => {
      setPhase("go")
      startRef.current = performance.now()
    }, delay)
  }

  const handleClick = () => {
    if (phase === "idle") {
      setRound(1)
      startRound()
      return
    }

    if (phase === "waiting") {
      // clicked too early
      clearTimer()
      setPhase("early")
      return
    }

    if (phase === "go") {
      const elapsed = performance.now() - startRef.current
      setCurrentTime(elapsed)
      setTimes((prev) => {
        const updated = [...prev, elapsed]
        if (updated.length === TOTAL_ROUNDS) {
          setPhase("done")
          saveScore(updated)
        } else {
          setPhase("result")
        }
        return updated
      })
      return
    }

    if (phase === "result") {
      setRound((r) => r + 1)
      startRound()
      return
    }

    if (phase === "early") {
      startRound()
      return
    }
  }

  const saveScore = async (allTimes: number[]) => {
    setSaving(true)
    try {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) return
      const { email } = JSON.parse(storedUser)
      const avg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length
      const score = Math.max(0, Math.min(100, Math.round(((1000 - avg) / 800) * 100)))
      await gameCompleted(email, "reaction", score)
      setSaved(true)
    } catch (e) {
      console.error("Failed to save score", e)
    } finally {
      setSaving(false)
    }
  }

  const restart = () => {
    clearTimer()
    setPhase("idle")
    setRound(0)
    setTimes([])
    setCurrentTime(null)
  }

  useEffect(() => () => clearTimer(), [])

  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null

  const finalScore = avgTime !== null
    ? Math.max(0, Math.min(100, Math.round(((1000 - avgTime) / 800) * 100)))
    : null

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const millis = Math.round(ms % 1000)
    return `${seconds}.${String(millis).padStart(3, "0")}s`
  }

  // Button styles per phase
  const buttonStyle = () => {
    if (phase === "go") return "bg-green-500 hover:bg-green-400 scale-105 shadow-green-500/40"
    if (phase === "early") return "bg-yellow-500"
    if (phase === "waiting") return "bg-red-500"
    return "bg-red-500 hover:bg-red-400"
  }

  const buttonLabel = () => {
    if (phase === "idle") return "Tap to Start"
    if (phase === "waiting") return "Wait..."
    if (phase === "go") return "TAP NOW!"
    if (phase === "early") return "Too early! Tap to retry"
    if (phase === "result") return "Tap for next round"
    return ""
  }

  if (phase === "done") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Game Over!</h1>
        <p className="text-muted-foreground mb-8">Here are your reaction times</p>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="space-y-3 mb-6">
            {times.map((t, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Round {i + 1}</span>
                <span className="font-semibold text-foreground">{formatTime(t)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Average</span>
              <span className="text-xl font-bold text-primary">{formatTime(avgTime!)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Score</span>
              <span className="text-xl font-bold text-foreground">{finalScore}/100</span>
            </div>
          </div>
        </div>

        {saving && <p className="text-sm text-muted-foreground mb-4">Saving score...</p>}
        {saved && (
          <div className="flex items-center justify-center gap-2 text-emerald-500 mb-4 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Score saved & AI prediction updated
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={restart}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <Link
            href="/dashboard/games"
            className="px-6 py-3 border border-border rounded-xl font-semibold hover:bg-muted transition-colors"
          >
            All Games
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/games" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Reaction Time</h1>
          <p className="text-sm text-muted-foreground">Tap as fast as you can when it turns green</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">
            {round > 0 ? `${Math.min(round, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}` : `${TOTAL_ROUNDS} rounds`}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < times.length
                ? "bg-primary"
                : i === times.length && phase !== "idle"
                ? "bg-primary/40 scale-125"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Big reaction button */}
      <button
        onClick={handleClick}
        className={`w-full aspect-square rounded-3xl text-white font-bold text-3xl shadow-2xl transition-all duration-100 select-none ${buttonStyle()}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Zap className={`w-16 h-16 ${phase === "go" ? "animate-bounce" : ""}`} />
          <span>{buttonLabel()}</span>
        </div>
      </button>

      {/* Last result */}
      {phase === "result" && currentTime !== null && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm mb-1">Your time</p>
          <p className="text-4xl font-bold text-primary">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground mt-2">Tap the button for round {round + 1}</p>
        </div>
      )}

      {phase === "early" && (
        <div className="mt-8 text-center">
          <p className="text-yellow-600 font-semibold">You tapped too early!</p>
          <p className="text-sm text-muted-foreground mt-1">Tap the button to try this round again</p>
        </div>
      )}

      {phase === "idle" && (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          The button will turn green after a random delay. Tap it as fast as possible!
        </div>
      )}

      {/* Previous times */}
      {times.length > 0 && (
        <div className="mt-8 bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-medium text-foreground mb-3">Previous rounds</p>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Round {i + 1}</span>
                <span className="font-semibold text-foreground">{formatTime(t)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
