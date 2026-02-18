'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowRight,
  Download,
  BarChart3,
  Clock,
  Target,
  MessageCircle,
  Brain,
  Smile,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface InterviewResult {
  id: string
  session_id: string
  interview_type: string
  difficulty: string
  job_role: string
  overall_score: number
  technical_score: number
  communication_score: number
  confidence_score: number
  emotion_score: number
  speech_score: number
  question_count: number
  questions_answered: number
  duration_seconds: number
  emotions: Record<string, number>
  per_question_scores: Array<{
    question: string
    answer_length: number
    duration: number
    had_response: boolean
  }>
  strengths: string[]
  improvements: string[]
  feedback: string
  transcript: Array<{
    questionIndex: number
    question: string
    answer: string
    duration: number
  }>
  created_at: string
}

function ScoreCircle({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600 border-green-500/30 bg-green-500/5'
    if (s >= 60) return 'text-yellow-600 border-yellow-500/30 bg-yellow-500/5'
    return 'text-red-500 border-red-500/30 bg-red-500/5'
  }

  const getBgBar = (s: number) => {
    if (s >= 80) return 'bg-green-600'
    if (s >= 60) return 'bg-yellow-600'
    return 'bg-red-500'
  }

  return (
    <Card className={`border p-5 ${getColor(score)}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${getColor(score).split(' ')[0]}`}>{Math.round(score)}</p>
      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${getBgBar(score)}`} style={{ width: `${score}%` }} />
      </div>
    </Card>
  )
}

export default function InterviewResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [result, setResult] = useState<InterviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/interview-results/${params.id}`, {
          credentials: 'include',
        })

        if (!res.ok) {
          setError('Failed to load interview results')
          return
        }

        const data = await res.json()
        setResult(data)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Something went wrong. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!result) return
    try {
      const res = await fetch('/api/interview/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: result.id }),
        credentials: 'include',
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `interview-report-${result.id}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      // PDF API not available yet -- generate client-side text fallback
      const text = generateTextReport(result)
      const blob = new Blob([text], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-report-${result.id}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }
  }

  const generateTextReport = (r: InterviewResult) => {
    let text = `OneselfAI Interview Report\n${'='.repeat(40)}\n\n`
    text += `Date: ${new Date(r.created_at).toLocaleDateString()}\n`
    text += `Role: ${r.job_role}\n`
    text += `Type: ${r.interview_type} | Difficulty: ${r.difficulty}\n`
    text += `Duration: ${formatDuration(r.duration_seconds)}\n\n`
    text += `SCORES\n${'-'.repeat(20)}\n`
    text += `Overall: ${Math.round(r.overall_score)}/100\n`
    text += `Technical: ${Math.round(r.technical_score)}/100\n`
    text += `Communication: ${Math.round(r.communication_score)}/100\n`
    text += `Confidence: ${Math.round(r.confidence_score)}/100\n`
    text += `Emotion: ${Math.round(r.emotion_score)}/100\n`
    text += `Speech: ${Math.round(r.speech_score)}/100\n\n`
    text += `STRENGTHS\n${'-'.repeat(20)}\n`
    r.strengths?.forEach((s) => { text += `+ ${s}\n` })
    text += `\nAREAS TO IMPROVE\n${'-'.repeat(20)}\n`
    r.improvements?.forEach((imp) => { text += `- ${imp}\n` })
    text += `\nFEEDBACK\n${'-'.repeat(20)}\n${r.feedback}\n`

    if (r.transcript?.length > 0) {
      text += `\nTRANSCRIPT\n${'-'.repeat(20)}\n`
      r.transcript.forEach((t) => {
        text += `\nQ: ${t.question}\nA: ${t.answer}\n`
      })
    }

    return text
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your interview...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'Interview results not found'}</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Outstanding'
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    if (score >= 50) return 'Needs Work'
    return 'Keep Practicing'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-2">
                Interview Results
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="capitalize">{result.interview_type} Interview</span>
                <span className="text-border">|</span>
                <span className="capitalize">{result.difficulty} Difficulty</span>
                <span className="text-border">|</span>
                <span>{result.job_role}</span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(result.duration_seconds)}
                </span>
              </div>
            </div>
            <Button onClick={handleDownloadPDF} variant="outline" className="border-purple-500/30 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>

          {/* Overall Score Hero */}
          <Card className="border-2 border-purple-500/20 p-8 mb-8 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                    <circle
                      cx="60" cy="60" r="54" fill="none" stroke="url(#scoreGradient)" strokeWidth="8"
                      strokeDasharray={`${(result.overall_score / 100) * 339.3} 339.3`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-4xl font-bold text-foreground">{Math.round(result.overall_score)}</span>
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-2xl font-bold text-foreground mb-1">
                  {getPerformanceLabel(result.overall_score)}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                  {result.feedback || `You completed a ${result.difficulty} difficulty ${result.interview_type} interview. Keep practicing to improve your scores.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{result.question_count} questions</span>
                  <span>{result.questions_answered} answered</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <ScoreCircle score={result.technical_score} label="Technical" icon={Brain} />
            <ScoreCircle score={result.communication_score} label="Communication" icon={MessageCircle} />
            <ScoreCircle score={result.confidence_score} label="Confidence" icon={Target} />
            <ScoreCircle score={result.emotion_score} label="Emotion" icon={Smile} />
            <ScoreCircle score={result.speech_score} label="Speech" icon={Volume2} />
          </div>

          {/* Emotion Distribution */}
          {result.emotions && Object.keys(result.emotions).length > 0 && (
            <Card className="border border-border p-6 mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Emotion Distribution
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(result.emotions)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([emotion, count]) => {
                    const total = Object.values(result.emotions).reduce((s: number, v) => s + (v as number), 0)
                    const pct = Math.round(((count as number) / total) * 100)
                    return (
                      <div key={emotion} className="flex items-center gap-3">
                        <span className="text-sm capitalize text-foreground w-20">{emotion}</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* Strengths & Improvements */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <Card className="border border-green-500/20 bg-green-500/5 p-6">
              <h2 className="text-lg font-bold text-green-600 mb-4">Strengths</h2>
              <ul className="space-y-2">
                {(result.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-0.5 font-bold shrink-0">+</span>
                    <span className="text-foreground">{s}</span>
                  </li>
                ))}
                {(!result.strengths || result.strengths.length === 0) && (
                  <li className="text-sm text-muted-foreground">No specific strengths identified.</li>
                )}
              </ul>
            </Card>

            <Card className="border border-orange-500/20 bg-orange-500/5 p-6">
              <h2 className="text-lg font-bold text-orange-600 mb-4">Areas to Improve</h2>
              <ul className="space-y-2">
                {(result.improvements || []).map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 mt-0.5 font-bold shrink-0">-</span>
                    <span className="text-foreground">{imp}</span>
                  </li>
                ))}
                {(!result.improvements || result.improvements.length === 0) && (
                  <li className="text-sm text-muted-foreground">No specific improvements identified.</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Per-Question Breakdown */}
          {result.per_question_scores && result.per_question_scores.length > 0 && (
            <Card className="border border-border p-6 mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4">Question Breakdown</h2>
              <div className="space-y-3">
                {result.per_question_scores.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{q.had_response ? 'Answered' : 'No response'}</span>
                        <span>{q.duration}s</span>
                        {q.answer_length > 0 && <span>{q.answer_length} chars</span>}
                      </div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${q.had_response ? 'text-green-600' : 'text-red-500'}`}>
                      {q.had_response ? 'Done' : 'Missed'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Transcript (collapsible) */}
          {result.transcript && result.transcript.length > 0 && (
            <Card className="border border-border p-6 mb-8">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-lg font-bold text-foreground">Interview Transcript</h2>
                {showTranscript ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              {showTranscript && (
                <div className="mt-4 space-y-6">
                  {result.transcript.map((t, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold text-purple-600 mb-1">
                        Q{idx + 1}: {t.question}
                      </p>
                      <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3 leading-relaxed">
                        {t.answer || '(No response captured)'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/interview')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              Take Another Interview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-purple-500/30">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
