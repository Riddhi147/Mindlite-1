"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trophy, Heart, CheckCircle } from "lucide-react"
import { gameCompleted } from "@/lib/game-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface FamilyMember {
  name: string
  relation: string
  image: string
}

interface Question {
  member: FamilyMember
  options: string[]
  correct: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateQuestions(members: FamilyMember[]): Question[] {
  if (members.length < 2) return []
  const allRelations = members.map((m) => m.relation)

  return shuffle(members).map((member) => {
    const wrongOptions = shuffle(
      allRelations.filter((r) => r !== member.relation)
    ).slice(0, 2)

    const options = shuffle([member.relation, ...wrongOptions])
    return { member, options, correct: member.relation }
  })
}

export default function FaceRecognitionGame() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return
    const { user_id } = JSON.parse(storedUser)

    fetch(`${API_URL}/family-members/${user_id}`)
      .then((r) => r.json())
      .then((data: FamilyMember[]) => {
        if (!Array.isArray(data) || data.length < 2) {
          setError("You need at least 2 family members added to play this game.")
          setLoading(false)
          return
        }
        setMembers(data)
        setQuestions(generateQuestions(data))
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load family members. Make sure the backend is running.")
        setLoading(false)
      })
  }, [])

  const handleAnswer = (option: string) => {
    if (selected) return
    setSelected(option)

    const isCorrect = option === questions[currentIndex].correct
    if (isCorrect) setScore((s) => s + 1)

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setGameOver(true)
        saveScore(isCorrect ? score + 1 : score)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelected(null)
      }
    }, 1200)
  }

  const saveScore = async (finalScore: number) => {
    setSaving(true)
    try {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) return
      const { email } = JSON.parse(storedUser)
      const pct = Math.round((finalScore / questions.length) * 100)
      // Auto-save via game-store (handles local + backend + ML predict)
      await gameCompleted(email, "face-recognition", pct)
      setSaved(true)
    } catch (e) {
      console.error("Failed to save score", e)
    } finally {
      setSaving(false)
    }
  }

  const restart = () => {
    setQuestions(generateQuestions(members))
    setCurrentIndex(0)
    setSelected(null)
    setScore(0)
    setGameOver(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Not enough family members</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link
          href="/dashboard/family"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Go Add Family Members
        </Link>
      </div>
    )
  }

  if (gameOver) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Game Over!</h1>
        <p className="text-muted-foreground mb-8">You recognised your family members</p>

        <div className="bg-card rounded-2xl border border-border p-8 mb-8">
          <div className="text-6xl font-bold text-primary mb-2">{pct}%</div>
          <p className="text-muted-foreground">
            {score} out of {questions.length} correct
          </p>
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

const question = questions[currentIndex]

if (!question) return null 

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/games" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Face Recognition</h1>
          <p className="text-sm text-muted-foreground">Who is this person to you?</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">{score} pts</div>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-8">
        <div
          className="h-2 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      {/* Photo */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-8 border border-border">
        <img
          src={question.member.image}
          alt="Who is this?"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Options */}
      <p className="text-center text-lg font-semibold text-foreground mb-4">
        How is this person related to you?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          let style = "border-border hover:border-primary/50 hover:bg-muted"
          if (selected) {
            if (option === question.correct) {
              style = "border-green-500 bg-green-500/10 text-green-700"
            } else if (option === selected) {
              style = "border-red-500 bg-red-500/10 text-red-700"
            } else {
              style = "border-border opacity-50"
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={!!selected}
              className={`w-full py-4 px-6 rounded-xl border-2 font-semibold text-left transition-all ${style}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
