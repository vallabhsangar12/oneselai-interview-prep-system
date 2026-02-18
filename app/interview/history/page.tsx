'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, ArrowLeft, Eye, Plus, Clock, Target } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

interface Interview {
  id: string
  session_id: string | null
  interview_type: string
  difficulty: string
  job_role: string
  overall_score: number | null
  duration_seconds: number
  created_at: string
}

export default function InterviewHistoryPage() {
  const router = useRouter()
  const { data, error, isLoading } = useSWR('/api/interviews', fetcher)

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
                <p className="mt-1 text-muted-foreground">
                  All your past interview sessions and results
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/interview')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> New Interview
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading history...</p>
            </div>
          )}

          {error && !isLoading && (
            <Card className="border border-destructive/20 bg-destructive/5 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Failed to load history</h3>
              <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
            </Card>
          )}

          {data && !error && !isLoading && (
            <>
              {data.interviews?.length === 0 ? (
                <Card className="border border-border p-12 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">No interviews yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                    Start your first AI-powered interview to see your history here.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(data.interviews as Interview[]).map((interview) => (
                    <Card
                      key={interview.id}
                      className="border border-border p-5 transition-colors hover:bg-secondary/30 cursor-pointer"
                      onClick={() => {
                        router.push(`/interview/results/${interview.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {interview.job_role || `${interview.interview_type} Interview`}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                            <span className="text-border">|</span>
                            <span className="capitalize">{interview.difficulty}</span>
                            <span className="text-border">|</span>
                            <span className="capitalize">{interview.interview_type}</span>
                            {interview.duration_seconds > 0 && (
                              <>
                                <span className="text-border">|</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(interview.duration_seconds)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {interview.overall_score !== null ? (
                            <div className="text-right">
                              <p className={`text-3xl font-bold ${getScoreColor(interview.overall_score)}`}>
                                {Math.round(interview.overall_score)}
                              </p>
                              <p className="text-xs text-muted-foreground">/100</p>
                            </div>
                          ) : (
                            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                              Incomplete
                            </span>
                          )}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
