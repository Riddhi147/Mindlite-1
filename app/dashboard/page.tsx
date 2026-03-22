"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Gamepad2, Heart,  TrendingUp, Calendar, ArrowRight, Brain, Clock, Target, Trophy } from "lucide-react"
// import { ProgressChart } from "@/components/progress-chart"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface Score {
  id: number
  game: string
  score: number
  created_at: string
}

const games = [
  {
  id: "face-recognition",
  name: "Face Recognition",
  description: "Look at photos of your family members and identify how they are related to you. Helps assess facial and relational memory.",
  icon: Heart,
  color: "bg-rose-500/10 text-rose-500",
  difficulty: "Easy",
  duration: "2-3 min",
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Test visual memory by matching pairs",
    icon: Brain,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "number-recall",
    name: "Number Recall",
    description: "Remember and repeat number sequences",
    icon: Target,
    color: "bg-success/10 text-success",
  },
  {
    id: "word-recall",
    name: "Word Recall",
    description: "Memorize and recall word lists",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
]

export default function DashboardPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ user_id: number; email: string } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      fetchScores(parsedUser.user_id)
    }
  }, [])

  const fetchScores = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/scores/${userId}`)
      const data = await res.json()
      setScores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAverageScore = () => {
    if (scores.length === 0) return 0
    const avg = scores.reduce((acc, s) => acc + s.score, 0) / scores.length
    return Math.round(avg * 10) / 10
  }

  const getTodaysGames = () => {
    const today = new Date().toDateString()
    return scores.filter((s) => new Date(s.created_at).toDateString() === today).length
  }

  const getStreak = () => {
    if (scores.length === 0) return 0
    const dates = [...new Set(scores.map((s) => new Date(s.created_at).toDateString()))]
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    let streak = 0
    const today = new Date()
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      if (dates[i] === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your cognitive health journey."}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "-" : getAverageScore()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{"Today's Games"}</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "-" : getTodaysGames()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "-" : getStreak()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Games</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "-" : scores.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> */}
      <div className="max-w-md">
        {/* Quick actions */}
        <div className="p-6 bg-card rounded-2xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-6">Quick Play</h2>
          <div className="space-y-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/dashboard/games/${game.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${game.color} flex items-center justify-center`}>
                  <game.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{game.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{game.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/games"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            View All Games
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
