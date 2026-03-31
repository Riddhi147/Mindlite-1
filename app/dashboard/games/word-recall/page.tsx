"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trophy, Play, Check, X, CheckCircle } from "lucide-react"
import { gameCompleted } from "@/lib/game-store"

const wordLists = [
  ["apple", "house", "river", "chair", "phone", "garden", "coffee", "window"],
  ["ocean", "music", "bread", "forest", "camera", "pencil", "mirror", "sunset"],
  ["bridge", "flower", "laptop", "kitchen", "travel", "silver", "orange", "planet"],
]

type GameState = "ready" | "memorize" | "recall" | "results"

export default function WordRecallGame() {
  const [gameState, setGameState] = useState<GameState>("ready")
  const [words, setWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState("")
  const [recalledWords, setRecalledWords] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)

  const startGame = () => {
    const randomList = wordLists[Math.floor(Math.random() * wordLists.length)]
    const shuffled = [...randomList].sort(() => Math.random() - 0.5).slice(0, 6)
    setWords(shuffled)
    setRecalledWords([])
    setCurrentWord("")
    setTimeLeft(30)
    setGameState("memorize")
  }

  useEffect(() => {
    if (gameState === "memorize" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameState === "memorize" && timeLeft === 0) {
      setTimeLeft(60)
      setGameState("recall")
    }
  }, [gameState, timeLeft])

  useEffect(() => {
    if (gameState === "recall" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameState === "recall" && timeLeft === 0) {
      calculateScore()
    }
  }, [gameState, timeLeft])

  const handleSubmitWord = () => {
    const word = currentWord.toLowerCase().trim()
    if (word && !recalledWords.includes(word)) {
      setRecalledWords((prev) => [...prev, word])
    }
    setCurrentWord("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitWord()
    }
  }

  const calculateScore = () => {
    const correctWords = recalledWords.filter((w) =>
      words.map((word) => word.toLowerCase()).includes(w.toLowerCase())
    )
    const calculatedScore = Math.round((correctWords.length / words.length) * 100)
    setScore(calculatedScore)
    setGameState("results")

    // Auto-save + auto-predict
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const { email } = JSON.parse(storedUser)
      gameCompleted(email, "word-recall", calculatedScore).then(() => setSaved(true))
    }
  }

  // Score is auto-saved on game completion

  const getCorrectWords = () => {
    return recalledWords.filter((w) =>
      words.map((word) => word.toLowerCase()).includes(w.toLowerCase())
    )
  }

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
        {gameState !== "ready" && (
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
        <h1 className="text-3xl font-bold text-foreground">Word Recall</h1>
        <p className="mt-1 text-muted-foreground">
          Memorize words, then recall as many as you can
        </p>
      </div>

      <div className="p-8 bg-card rounded-2xl border border-border">
        {gameState === "ready" && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Ready to play?</h2>
            <p className="text-muted-foreground mb-6">
              {"You'll have 30 seconds to memorize a list of words, then 60 seconds to recall as many as you can."}
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === "memorize" && (
          <div className="text-center">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Time to memorize</p>
              <div className="text-4xl font-bold text-primary">{timeLeft}s</div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">Memorize these words:</p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {words.map((word, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-lg"
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-1000"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        )}

        {gameState === "recall" && (
          <div className="text-center">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Time remaining</p>
              <div className="text-4xl font-bold text-primary">{timeLeft}s</div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Type the words you remember ({recalledWords.length} entered):
            </p>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a word..."
                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleSubmitWord}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>

            {recalledWords.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {recalledWords.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={calculateScore}
              className="px-6 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Finish Early
            </button>
          </div>
        )}

        {gameState === "results" && (
          <div className="text-center">
            <Trophy className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Results</h2>
            <p className="text-muted-foreground mb-6">
              You recalled {getCorrectWords().length} out of {words.length} words
            </p>

            <div className="inline-block p-6 bg-primary/10 rounded-xl mb-6">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-4xl font-bold text-primary">{score}</p>
            </div>

            <div className="text-left mb-6 p-4 bg-muted/50 rounded-xl">
              <p className="font-medium text-foreground mb-3">Word Results:</p>
              <div className="space-y-2">
                {words.map((word, index) => {
                  const wasRecalled = recalledWords
                    .map((w) => w.toLowerCase())
                    .includes(word.toLowerCase())
                  return (
                    <div key={index} className="flex items-center gap-2">
                      {wasRecalled ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                      <span className={wasRecalled ? "text-foreground" : "text-muted-foreground"}>
                        {word}
                      </span>
                    </div>
                  )
                })}
              </div>
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
