"use client"

import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  Award,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  Clock,
  Eye,
} from "lucide-react"

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  })

interface Interview {
  id: string
  result_id: string | null
  created_at: string
  interview_type: string
  difficulty: string
  status: string
  score: number | null
  job_role: string
  duration_seconds: number
}

interface ScoreTrend {
  name: string
  overall: number
  technical: number
  communication: number
  date: string
}

interface ScoreBreakdown {
  category: string
  score: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { data, error, isLoading } = useSWR("/api/dashboard-stats", fetcher)

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="mt-1 text-muted-foreground">
                {data?.user
                  ? `Welcome back, ${data.user.name}`
                  : "Track your interview preparation progress"}
              </p>
            </div>
            <Button
              onClick={() => router.push("/interview")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> New Interview
            </Button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading your data...</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card className="border border-destructive/20 bg-destructive/5 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">
                Failed to load dashboard
              </h3>
              <p className="mt-2 text-muted-foreground">
                Please check your connection and try again.
              </p>
            </Card>
          )}

          {/* Empty State */}
          {data && !error && !isLoading && data.total_interviews === 0 && (
            <Card className="border border-border p-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                No interviews yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Start your first AI-powered interview to see your performance
                data here.
              </p>
              <Button
                className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                onClick={() => router.push("/interview")}
              >
                Start Your First Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* Data Loaded */}
          {data && !error && !isLoading && data.total_interviews > 0 && (
            <>
              {/* Stats Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  label="Average Score"
                  value={data.avg_score || 0}
                  suffix="/100"
                  icon={
                    <Award className="h-6 w-6 text-purple-600" />
                  }
                />
                <StatCard
                  label="Total Interviews"
                  value={data.total_interviews || 0}
                  icon={
                    <Target className="h-6 w-6 text-blue-600" />
                  }
                />
                <StatCard
                  label="Best Score"
                  value={data.best_score || 0}
                  suffix="/100"
                  icon={
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  }
                />
                <StatCard
                  label="Last Score"
                  value={data.last_interview_score ?? "N/A"}
                  suffix={data.last_interview_score ? "/100" : ""}
                  icon={
                    <Clock className="h-6 w-6 text-orange-600" />
                  }
                />
              </div>

              {/* Charts Row */}
              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                {/* Score Trend Line Chart */}
                {data.score_trend && data.score_trend.length > 1 && (
                  <Card className="border border-border p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                      Score Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data.score_trend as ScoreTrend[]}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="name"
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="overall"
                          stroke="#9333ea"
                          strokeWidth={2}
                          dot={{ fill: "#9333ea", r: 4 }}
                          name="Overall"
                        />
                        <Line
                          type="monotone"
                          dataKey="technical"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ fill: "#2563eb", r: 3 }}
                          name="Technical"
                        />
                        <Line
                          type="monotone"
                          dataKey="communication"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={{ fill: "#16a34a", r: 3 }}
                          name="Communication"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Category Breakdown Bar Chart */}
                {data.score_breakdown && data.score_breakdown.some((s: ScoreBreakdown) => s.score > 0) && (
                  <Card className="border border-border p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                      Average by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.score_breakdown as ScoreBreakdown[]}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="category"
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar
                          dataKey="score"
                          fill="url(#barGradient)"
                          radius={[4, 4, 0, 0]}
                          name="Avg Score"
                        />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>

              {/* Recent Interviews */}
              {data.interviews?.length > 0 && (
                <Card className="border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Recent Interviews
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/interview/history")}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      View All
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(data.interviews as Interview[]).map((interview) => (
                      <div
                        key={interview.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/30 cursor-pointer"
                        onClick={() => {
                          if (interview.result_id) {
                            router.push(`/interview/results/${interview.result_id}`)
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {interview.job_role ||
                              `${interview.interview_type} Interview`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>
                              {new Date(
                                interview.created_at
                              ).toLocaleDateString()}
                            </span>
                            <span className="text-border">-</span>
                            <span className="capitalize">{interview.difficulty}</span>
                            <span className="text-border">-</span>
                            <span className="capitalize">{interview.interview_type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {interview.score !== null ? (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground">
                                {interview.score}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Score
                              </p>
                            </div>
                          ) : (
                            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
                              {interview.status}
                            </span>
                          )}
                          {interview.result_id && (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string
  value: string | number
  suffix?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {value}
            {suffix && (
              <span className="text-base font-normal text-muted-foreground">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
      </div>
    </Card>
  )
}
