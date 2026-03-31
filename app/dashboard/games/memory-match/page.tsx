"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Trophy, Clock, CheckCircle } from "lucide-react"
import { gameCompleted } from "@/lib/game-store"


///////////////////////// change symbols here
const symbols = ["A", "B", "C", "D", "E", "F", "G", "H"]

interface Card {
  id: number
  symbol: string
  isFlipped: boolean
  isMatched: boolean
}

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [time, setTime] = useState(0)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)

  const initializeGame = () => {
    const gameSymbols = [...symbols, ...symbols]
    const shuffled = gameSymbols
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false,
      }))
    setCards(shuffled)
    setFlippedCards([])
    setMatches(0)
    setMoves(0)
    setTime(0)
    setGameOver(false)
    setGameStarted(false)
    setScore(0)
  }

  useEffect(() => {
    initializeGame()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameOver) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameOver])

  useEffect(() => {
    if (matches === symbols.length && matches > 0) {
      setGameOver(true)
      const calculatedScore = Math.max(0, 100 - moves * 2 - Math.floor(time / 5))
      setScore(calculatedScore)

      // Auto-save + auto-predict
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const { email } = JSON.parse(storedUser)
        gameCompleted(email, "memory-match", calculatedScore).then(() => setSaved(true))
      }
    }
  }, [matches, moves, time])

  const handleCardClick = (id: number) => {
    if (!gameStarted) setGameStarted(true)
    if (flippedCards.length === 2) return
    if (cards[id].isFlipped || cards[id].isMatched) return

    const newCards = [...cards]
    newCards[id].isFlipped = true
    setCards(newCards)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1)
      const [first, second] = newFlipped

      if (cards[first].symbol === cards[second].symbol) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isMatched: true }
                : card
            )
          )
          setMatches((prev) => prev + 1)
          setFlippedCards([])
        }, 500)
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  // Score is auto-saved on game completion

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard/games"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </Link>
        <button
          onClick={initializeGame}
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Memory Match</h1>
        <p className="mt-1 text-muted-foreground">
          Find all matching pairs of cards
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Moves</p>
          <p className="text-2xl font-bold text-foreground">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Matches</p>
          <p className="text-2xl font-bold text-foreground">{matches}/{symbols.length}</p>
        </div>
        <div className="flex items-center gap-2 text-center">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <p className="text-2xl font-bold text-foreground">{formatTime(time)}</p>
        </div>
      </div>

      {/* Game board */}
      {!gameOver ? (
        <div className="grid grid-cols-4 gap-3 p-6 bg-card rounded-2xl border border-border">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched}
              className={`aspect-square rounded-xl text-3xl font-bold transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? "bg-primary text-primary-foreground rotate-0"
                  : "bg-muted text-transparent hover:bg-muted/80"
              } ${card.isMatched ? "opacity-50" : ""}`}
              aria-label={card.isFlipped || card.isMatched ? card.symbol : "Hidden card"}
            >
              {card.isFlipped || card.isMatched ? card.symbol : "?"}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-card rounded-2xl border border-border">
          <Trophy className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Congratulations!</h2>
          <p className="text-muted-foreground mb-6">
            You completed the game in {moves} moves and {formatTime(time)}
          </p>

          <div className="inline-block p-6 bg-primary/10 rounded-xl mb-6">
            <p className="text-sm text-muted-foreground">Your Score</p>
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
              onClick={initializeGame}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
