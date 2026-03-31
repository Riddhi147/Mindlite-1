"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trophy, Play, CheckCircle } from "lucide-react"
import { gameCompleted } from "@/lib/game-store"

type GameState = "ready" | "playing" | "result" | "gameover"

interface Pattern {
  sequence: string[]
  answer: string
  options: string[]
}

const generatePatterns = (): Pattern[] => {
  const patterns: Pattern[] = [
    {
      sequence: ["A", "B", "C", "D"],
      answer: "E",
      options: ["E", "F", "A", "Z"],
    },
    {
      sequence: ["2", "4", "6", "8"],
      answer: "10",
      options: ["10", "9", "12", "11"],
    },
    {
      sequence: ["1", "1", "2", "3", "5"],
      answer: "8",
      options: ["8", "7", "6", "9"],
    },
    {
      sequence: ["O", "T", "T", "F", "F"],
      answer: "S",
      options: ["S", "E", "N", "T"],
    },
    {
      sequence: ["J", "F", "M", "A", "M"],
      answer: "J",
      options: ["J", "A", "S", "O"],
    },
    {
      sequence: ["3", "6", "9", "12"],
      answer: "15",
      options: ["15", "14", "16", "18"],
    },
    {
      sequence: ["Z", "Y", "X", "W"],
      answer: "V",
      options: ["V", "U", "T", "S"],
    },
    {
      sequence: ["1", "4", "9", "16"],
      answer: "25",
      options: ["25", "24", "36", "20"],
    },
  ]
  return patterns.sort(() => Math.random() - 0.5)
}

export default function PatternRecognitionGame() {
  const [gameState, setGameState] = useState<GameState>("ready")
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const startGame = () => {
    setPatterns(generatePatterns())
    setCurrentIndex(0)
    setScore(0)
    setSelected(null)
    setGameState("playing")
  }

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    const correct = option === patterns[currentIndex].answer
    setIsCorrect(correct)
    if (correct) {
      setScore((prev) => prev + 20)
    }
    setGameState("result")
  }

  const nextQuestion = () => {
    if (currentIndex < patterns.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelected(null)
      setGameState("playing")
    } else {
      setGameState("gameover")
      // Auto-save + auto-predict
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const { email } = JSON.parse(storedUser)
        gameCompleted(email, "pattern-recognition", score).then(() => setSaved(true))
      }
    }
  }

  // Score is auto-saved on game completion

  const currentPattern = patterns[currentIndex]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard/games"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </Link>
        {gameState !== "ready" && gameState !== "gameover" && (
          <button
            onClick={() => setGameState("ready")}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Pattern Recognition</h1>
        <p className="mt-1 text-muted-foreground">
          Find the next item in each sequence
        </p>
      </div>

      {gameState !== "ready" && gameState !== "gameover" && (
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Question</p>
            <p className="text-2xl font-bold text-foreground">
              {currentIndex + 1}/{patterns.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
        </div>
      )}

      <div className="p-8 bg-card rounded-2xl border border-border">
        {gameState === "ready" && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Ready to play?</h2>
            <p className="text-muted-foreground mb-6">
              {"You'll be shown sequences and need to identify the next item in the pattern."}
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {(gameState === "playing" || gameState === "result") && currentPattern && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {"What comes next in this sequence?"}
            </p>

            <div className="flex items-center justify-center gap-3 mb-8">
              {currentPattern.sequence.map((item, index) => (
                <div
                  key={index}
                  className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary"
                >
                  {item}
                </div>
              ))}
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center text-xl font-bold text-primary">
                ?
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
              {currentPattern.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`py-4 rounded-xl text-xl font-bold transition-all ${
                    selected === null
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      : option === currentPattern.answer
                      ? "bg-success text-success-foreground"
                      : selected === option
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {gameState === "result" && (
              <div className="mb-6">
                <p
                  className={`text-lg font-semibold ${
                    isCorrect ? "text-success" : "text-destructive"
                  }`}
                >
                  {isCorrect ? "Correct!" : `Wrong! The answer was ${currentPattern.answer}`}
                </p>
              </div>
            )}

            {gameState === "result" && (
              <button
                onClick={nextQuestion}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                {currentIndex < patterns.length - 1 ? "Next Question" : "See Results"}
              </button>
            )}
          </div>
        )}

        {gameState === "gameover" && (
          <div className="text-center">
            <Trophy className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Game Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You answered {score / 20} out of {patterns.length} questions correctly
            </p>

            <div className="inline-block p-6 bg-primary/10 rounded-xl mb-6">
              <p className="text-sm text-muted-foreground">Final Score</p>
              <p className="text-4xl font-bold text-primary">{score}</p>
            </div>

            {saved && (
              <div className="flex items-center justify-center gap-2 text-emerald-500 mb-4 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Score saved & AI prediction updated
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={startGame}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
