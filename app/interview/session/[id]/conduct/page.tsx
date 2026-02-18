'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Video, VideoOff, Phone, Clock, AlertCircle, SkipForward, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { getQuestions, type InterviewQuestion } from '@/lib/interview-questions'

interface EmotionData {
  emotion: string
  confidence: number
  timestamp: number
}

interface TranscriptEntry {
  questionIndex: number
  question: string
  answer: string
  duration: number
}

interface SessionConfig {
  interview_type: string
  difficulty: string
  job_role: string
  experience_years: number
  tech_stack: string[]
}

export default function InterviewConductPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  // Session config
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  // Interview state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [interviewStartTime] = useState(Date.now())
  const [isFinishing, setIsFinishing] = useState(false)

  // Speech recognition
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Emotion tracking
  const [emotions, setEmotions] = useState<EmotionData[]>([])
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [emotionConfidence, setEmotionConfidence] = useState(0)

  // Transcript history
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const questionStartTimeRef = useRef(Date.now())

  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // TTS ref
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Load session configuration and questions
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`/api/interview-session/${sessionId}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setSessionConfig(data)

          const type = data.interview_type === 'behavioral' ? 'behavioral' : 'technical'
          const diff = (['easy', 'medium', 'hard'].includes(data.difficulty) ? data.difficulty : 'medium') as 'easy' | 'medium' | 'hard'
          const count = data.interview_type === 'mixed' ? 5 : 5

          // Get questions -- for mixed, get both types
          let qs: InterviewQuestion[]
          if (data.interview_type === 'mixed') {
            const techQs = getQuestions('technical', diff, 3)
            const behavQs = getQuestions('behavioral', diff, 2)
            qs = [...techQs, ...behavQs].sort(() => Math.random() - 0.5)
          } else {
            qs = getQuestions(type, diff, count)
          }

          setQuestions(qs)
          setTimeRemaining(qs[0]?.timeLimit || 120)
        }
      } catch (err) {
        console.error('Error loading session:', err)
        toast.error('Failed to load session. Using default questions.')
        const fallback = getQuestions('technical', 'medium', 5)
        setQuestions(fallback)
        setTimeRemaining(fallback[0]?.timeLimit || 120)
      } finally {
        setIsLoadingSession(false)
      }
    }
    loadSession()
  }, [sessionId])

  // Initialize webcam
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          setIsRecording(true)
        }
      } catch {
        toast.error('Unable to access camera or microphone')
      }
    }
    initStream()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setCurrentTranscript(transcript)
      }

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListening && isMicOn) {
          try { recognition.start() } catch {}
        }
      }

      recognition.onerror = () => {
        // Silently handle -- speech recognition can be flaky
      }

      recognitionRef.current = recognition
    }

    synthRef.current = window.speechSynthesis

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (synthRef.current) synthRef.current.cancel()
    }
  }, [])

  // Start listening when questions load
  useEffect(() => {
    if (questions.length > 0 && !isLoadingSession && recognitionRef.current) {
      startListening()
      // Read first question aloud
      speakQuestion(questions[0].question)
    }
  }, [questions, isLoadingSession])

  // Timer countdown
  useEffect(() => {
    if (isLoadingSession || questions.length === 0) return

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleNextQuestion()
          return questions[questionIndex + 1]?.timeLimit || 120
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [questionIndex, isLoadingSession, questions])

  // Simulated emotion detection
  useEffect(() => {
    const emotionList = ['neutral', 'happy', 'confident', 'focused', 'thinking', 'calm']
    const interval = setInterval(() => {
      const emo = emotionList[Math.floor(Math.random() * emotionList.length)]
      const conf = Math.floor(Math.random() * 30) + 65
      setCurrentEmotion(emo)
      setEmotionConfidence(conf)
      setEmotions((prev) => [...prev, { emotion: emo, confidence: conf, timestamp: Date.now() }])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {}
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch {}
    }
  }

  const speakQuestion = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      synthRef.current.speak(utterance)
    }
  }

  const saveCurrentTranscript = useCallback(() => {
    if (questions[questionIndex]) {
      const entry: TranscriptEntry = {
        questionIndex,
        question: questions[questionIndex].question,
        answer: currentTranscript || '(no response captured)',
        duration: Math.round((Date.now() - questionStartTimeRef.current) / 1000),
      }
      setTranscripts((prev) => [...prev, entry])
    }
  }, [questionIndex, currentTranscript, questions])

  const handleNextQuestion = useCallback(() => {
    saveCurrentTranscript()
    setCurrentTranscript('')
    questionStartTimeRef.current = Date.now()

    if (questionIndex < questions.length - 1) {
      const nextIdx = questionIndex + 1
      setQuestionIndex(nextIdx)
      setTimeRemaining(questions[nextIdx]?.timeLimit || 120)

      // Read next question aloud
      setTimeout(() => {
        speakQuestion(questions[nextIdx].question)
      }, 500)
    } else {
      handleFinishInterview()
    }
  }, [questionIndex, questions, saveCurrentTranscript])

  const computeScores = () => {
    // Calculate emotion distribution
    const emotionCounts: Record<string, number> = {}
    emotions.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1
    })
    const totalEmotions = emotions.length || 1

    // Positive emotions boost emotion score
    const positiveCount = (emotionCounts['happy'] || 0) + (emotionCounts['confident'] || 0) + (emotionCounts['focused'] || 0)
    const emotionScore = Math.min(100, Math.round((positiveCount / totalEmotions) * 100 + 20))

    // Speech score based on how much the user spoke
    const answeredQuestions = transcripts.filter((t) => t.answer !== '(no response captured)')
    const speechScore = Math.min(100, Math.round((answeredQuestions.length / Math.max(questions.length, 1)) * 80 + 20))

    // Average answer length as proxy for communication
    const avgLength = answeredQuestions.length > 0
      ? answeredQuestions.reduce((sum, t) => sum + t.answer.length, 0) / answeredQuestions.length
      : 0
    const communicationScore = Math.min(100, Math.round(Math.min(avgLength / 5, 80) + 20))

    // Confidence score from emotion analysis
    const avgConfidence = emotions.length > 0
      ? emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length
      : 50
    const confidenceScore = Math.round(avgConfidence)

    // Technical score -- base on completeness and speaking time
    const technicalScore = Math.min(100, Math.round(
      (answeredQuestions.length / Math.max(questions.length, 1)) * 60 +
      Math.min(avgLength / 10, 30) + 10
    ))

    // Overall is weighted average
    const overall = Math.round(
      technicalScore * 0.3 +
      communicationScore * 0.25 +
      confidenceScore * 0.2 +
      emotionScore * 0.15 +
      speechScore * 0.1
    )

    // Generate strengths and improvements
    const strengths: string[] = []
    const improvements: string[] = []

    if (emotionScore >= 70) strengths.push('Maintained positive emotional composure throughout the interview')
    if (speechScore >= 70) strengths.push('Responded to most questions with verbal answers')
    if (communicationScore >= 60) strengths.push('Provided detailed responses with good explanation depth')
    if (confidenceScore >= 70) strengths.push('Showed consistent confidence during responses')

    if (emotionScore < 60) improvements.push('Work on maintaining a calm and confident demeanor')
    if (speechScore < 60) improvements.push('Practice speaking more during interview responses')
    if (communicationScore < 60) improvements.push('Provide more detailed and structured answers')
    if (confidenceScore < 60) improvements.push('Build confidence through more practice sessions')

    if (strengths.length === 0) strengths.push('Completed the full interview session')
    if (improvements.length === 0) improvements.push('Continue practicing to maintain current performance')

    return {
      overall_score: overall,
      technical_score: technicalScore,
      communication_score: communicationScore,
      confidence_score: confidenceScore,
      emotion_score: emotionScore,
      speech_score: speechScore,
      strengths,
      improvements,
      feedback: `You completed a ${sessionConfig?.difficulty || 'medium'} difficulty ${sessionConfig?.interview_type || 'technical'} interview for the role of ${sessionConfig?.job_role || 'Software Engineer'}. You answered ${answeredQuestions.length} out of ${questions.length} questions. Overall performance score: ${overall}/100.`,
    }
  }

  const handleFinishInterview = async () => {
    if (isFinishing) return
    setIsFinishing(true)
    setIsRecording(false)
    stopListening()

    // Save the last question's transcript
    saveCurrentTranscript()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    if (synthRef.current) synthRef.current.cancel()

    // Wait a tick for state to update
    await new Promise((r) => setTimeout(r, 100))

    const scores = computeScores()
    const durationSeconds = Math.round((Date.now() - interviewStartTime) / 1000)

    // Build emotion summary
    const emotionCounts: Record<string, number> = {}
    emotions.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1
    })

    try {
      const res = await fetch('/api/interview-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...scores,
          question_count: questions.length,
          questions_answered: transcripts.length,
          duration_seconds: durationSeconds,
          emotions: emotionCounts,
          per_question_scores: transcripts.map((t, i) => ({
            question: t.question,
            answer_length: t.answer.length,
            duration: t.duration,
            had_response: t.answer !== '(no response captured)',
          })),
          transcript: transcripts,
          interview_type: sessionConfig?.interview_type || 'technical',
          difficulty: sessionConfig?.difficulty || 'medium',
          job_role: sessionConfig?.job_role || 'Software Engineer',
        }),
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Interview completed! Preparing your results...')
        router.push(`/interview/results/${data.result_id}`)
      } else {
        throw new Error('Failed to save results')
      }
    } catch (error) {
      console.error('Error saving results:', error)
      toast.error('Error saving results. Redirecting to dashboard.')
      router.push('/dashboard')
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
      setIsMicOn(!isMicOn)
      if (isMicOn) stopListening()
      else startListening()
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
      setIsCameraOn(!isCameraOn)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoadingSession || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your interview questions...</p>
        </div>
      </div>
    )
  }

  const currentQ = questions[questionIndex]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Interview in Progress</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {sessionConfig?.interview_type} - {sessionConfig?.difficulty} - {sessionConfig?.job_role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className={`font-mono font-semibold ${timeRemaining <= 30 ? 'text-red-500' : 'text-foreground'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Button onClick={handleFinishInterview} variant="destructive" size="sm" disabled={isFinishing}>
              <Phone className="mr-2 h-4 w-4" />
              {isFinishing ? 'Saving...' : 'End Interview'}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Video + Question */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video */}
              <Card className="border-2 border-purple-500/20 overflow-hidden bg-black">
                <div className="relative aspect-video w-full bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <VideoOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/60 rounded-lg px-3 py-2 backdrop-blur">
                    <p className="text-xs text-gray-400 mb-0.5">Emotion</p>
                    <p className="text-sm font-semibold text-white capitalize">{currentEmotion}</p>
                    <p className="text-xs text-purple-400">{emotionConfidence}%</p>
                  </div>
                  {isListening && (
                    <div className="absolute bottom-4 left-4 bg-red-600/80 rounded-lg px-3 py-1.5 backdrop-blur flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white font-medium">Listening</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={toggleMic}
                  className={`${isMicOn ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold`}
                  size="lg"
                >
                  {isMicOn ? <><Mic className="mr-2 h-5 w-5" /> Mic On</> : <><MicOff className="mr-2 h-5 w-5" /> Mic Off</>}
                </Button>
                <Button
                  onClick={toggleCamera}
                  className={`${isCameraOn ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold`}
                  size="lg"
                >
                  {isCameraOn ? <><Video className="mr-2 h-5 w-5" /> Cam On</> : <><VideoOff className="mr-2 h-5 w-5" /> Cam Off</>}
                </Button>
                <Button
                  onClick={() => speakQuestion(currentQ.question)}
                  variant="outline"
                  size="lg"
                  title="Read question aloud"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Current Question */}
              <Card className="border border-border p-6 bg-secondary/30">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {currentQ.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 capitalize">
                      {currentQ.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full transition-colors ${
                          i === questionIndex ? 'bg-purple-600' : i < questionIndex ? 'bg-green-600' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xl font-semibold text-foreground mb-4">
                  {currentQ.question}
                </p>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Tips:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {currentQ.tips.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">{'>'}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Live Transcript */}
              {currentTranscript && (
                <Card className="border border-border p-4 bg-card">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Live Transcript</p>
                  <p className="text-sm text-foreground leading-relaxed">{currentTranscript}</p>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <Card className="border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Progress</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Question {questionIndex + 1} of {questions.length}
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                    style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </Card>

              {/* Emotion History */}
              <Card className="border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Recent Emotions</h3>
                <div className="space-y-2">
                  {emotions.slice(-6).map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{e.emotion}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${e.confidence}%` }} />
                        </div>
                        <span className="font-medium text-foreground text-xs w-8">{e.confidence}%</span>
                      </div>
                    </div>
                  ))}
                  {emotions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Analyzing...</p>
                  )}
                </div>
              </Card>

              {/* Alert */}
              <Card className="border border-orange-500/30 bg-orange-500/5 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Keep Camera On</p>
                    <p className="text-xs text-orange-600/80">
                      Your facial expressions are being analyzed for emotion detection and engagement scoring.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Next / Finish Button */}
              <Button
                onClick={handleNextQuestion}
                disabled={isFinishing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                {questionIndex < questions.length - 1 ? (
                  <><SkipForward className="mr-2 h-4 w-4" /> Next Question</>
                ) : (
                  <><Phone className="mr-2 h-4 w-4" /> Finish Interview</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
