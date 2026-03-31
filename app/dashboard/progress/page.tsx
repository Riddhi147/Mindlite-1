"use client"

import { useEffect, useState, useCallback } from "react"
import { ProgressChart } from "@/components/progress-chart"
import { getScores, syncToBackend, type GameScore } from "@/lib/game-store"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Clock,
  Calendar,
  Eye,
  Users,
  Timer,
} from "lucide-react"

export default function ProgressPage() {
  const [scores, setScores] = useState<GameScore[]>([])
  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(() => {
    if (!email) return
    setScores(getScores(email))
  }, [email])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setEmail(parsed.email)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!email) return
    refreshData()
    syncToBackend(email)

    const handleScore = () => refreshData()
    window.addEventListener("mindlite:score", handleScore)
    const interval = setInterval(refreshData, 3000)

    return () => {
      window.removeEventListener("mindlite:score", handleScore)
      clearInterval(interval)
    }
  }, [email, refreshData])

  const getScoresByGame = () => {
    const grouped: Record<string, GameScore[]> = {}
    scores.forEach((score) => {
      if (!grouped[score.game]) grouped[score.game] = []
      grouped[score.game].push(score)
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

  const formatGameName = (id: string) =>
    id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const gameIcons: Record<string, React.ElementType> = {
    "memory-match": Brain,
    "word-recall": Clock,
    "pattern-recognition": Eye,
    "face-recognition": Users,
    reaction: Timer,
  }

  const scoresByGame = getScoresByGame()

  // Calculate overall average
  const overallAvg = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b.score, 0) / scores.length) * 10) / 10
    : 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
        <p className="mt-1 text-muted-foreground">
          Track your cognitive game performance over time.
        </p>
        {scores.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live — updates automatically when you play games
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {scores.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <p className="text-sm text-muted-foreground">Total Games</p>
            <p className="text-2xl font-bold text-foreground">{scores.length}</p>
          </div>
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold text-foreground">{overallAvg}</p>
          </div>
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <p className="text-sm text-muted-foreground">Games Types</p>
            <p className="text-2xl font-bold text-foreground">{Object.keys(scoresByGame).length}</p>
          </div>
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-2xl font-bold text-primary">
              {scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0}
            </p>
          </div>
        </div>
      )}

      {/* Overall Performance Chart — game scores only, no predictions */}
      <div className="p-6 bg-card rounded-2xl border border-border mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Overall Performance</h2>
        <ProgressChart scores={scores} loading={loading} />
      </div>

      {/* Performance by Game */}
      <h2 className="text-xl font-semibold text-foreground mb-4">Performance by Game</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : Object.keys(scoresByGame).length === 0 ? (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">No games played yet</p>
          <p className="text-muted-foreground">Play some games — scores will appear here automatically</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(scoresByGame).map(([game, gameScores]) => {
            const trend = getTrend(gameScores)
            const avgScore = Math.round((gameScores.reduce((a, b) => a + b.score, 0) / gameScores.length) * 10) / 10
            const bestScore = Math.max(...gameScores.map((s) => s.score))
            const Icon = gameIcons[game] || Brain

            return (
              <div key={game} className="p-6 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{formatGameName(game)}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average</span>
                    <span className="font-semibold text-foreground">{avgScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Best</span>
                    <span className="font-semibold text-foreground">{bestScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Played</span>
                    <span className="font-semibold text-foreground">{gameScores.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trend</span>
                    <span className={`flex items-center gap-1 font-semibold ${
                      trend.direction === "up" ? "text-emerald-500" :
                      trend.direction === "down" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {trend.direction === "up" && <TrendingUp className="w-4 h-4" />}
                      {trend.direction === "down" && <TrendingDown className="w-4 h-4" />}
                      {trend.direction === "stable" && <Minus className="w-4 h-4" />}
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
