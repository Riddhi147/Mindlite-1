"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface Score {
  id: number
  game: string
  score: number
  created_at: string
}

interface ProgressChartProps {
  scores: Score[]
  loading: boolean
  predictions?: Score[]
}

export function ProgressChart({ scores, loading, predictions = [] }: ProgressChartProps) {
  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (scores.length === 0 && predictions.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">No data yet</p>
        <p className="text-sm">Play some games or run an ML prediction to see your progress</p>
      </div>
    )
  }

  // Group game scores by date and calculate daily average
  const gameScoresOnly = scores.filter((s) => s.game !== "ml-prediction")
  const groupedGameData = gameScoresOnly.reduce((acc, score) => {
    const date = new Date(score.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 }
    }
    acc[date].total += score.score
    acc[date].count++
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  // Build chart data from game scores
  const gameChartEntries = Object.entries(groupedGameData)
    .map(([date, { total, count }]) => ({
      date,
      score: Math.round((total / count) * 10) / 10,
      prediction: undefined as number | undefined,
      sortKey: new Date().getTime(), // placeholder
    }))
    .slice(-14)

  // Build prediction data points
  const predChartEntries = predictions.map((p) => {
    const date = new Date(p.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const time = new Date(p.created_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return {
      date: `${date} ${time}`,
      score: undefined as number | undefined,
      prediction: Math.round(p.score * 10) / 10,
      sortKey: new Date(p.created_at).getTime(),
    }
  })

  // Merge all data, sorted by time
  const allEntries = [...gameChartEntries, ...predChartEntries]

  // If we only have predictions (no game scores), number them sequentially
  const chartData =
    gameChartEntries.length === 0
      ? predChartEntries.map((entry, i) => ({
          ...entry,
          date: `Prediction ${i + 1}`,
        }))
      : allEntries

  const hasBothLines = gameChartEntries.length > 0 && predChartEntries.length > 0

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          {hasBothLines && (
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
          )}
          {/* Game scores line */}
          <Line
            type="monotone"
            dataKey="score"
            name="Game Scores"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
          {/* ML Prediction line */}
          <Line
            type="monotone"
            dataKey="prediction"
            name="ML Prediction"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "#10b981", strokeWidth: 0, r: 5 }}
            activeDot={{ r: 7, strokeWidth: 0 }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
