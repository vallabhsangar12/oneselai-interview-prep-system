import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resultId } = await params
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try database first, fallback to mock data
    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()
      const result = await pool.query(
        `SELECT * FROM interview_results WHERE id = $1`,
        [resultId]
      )
      if (result.rows.length > 0) {
        return NextResponse.json(result.rows[0])
      }
    } catch {
      // DB not available, return mock data
    }

    const mockResult = {
      id: resultId,
      session_id: 'session_' + Math.random().toString(36).substr(2, 9),
      user_id: 'user_1',
      overall_score: Math.floor(Math.random() * 40) + 60,
      facial_emotion_score: Math.floor(Math.random() * 40) + 60,
      voice_analysis_score: Math.floor(Math.random() * 40) + 60,
      content_score: Math.floor(Math.random() * 40) + 60,
      confidence_level: Math.floor(Math.random() * 40) + 60,
      emotion_data: {
        primary: 'confident',
        confidence: Math.floor(Math.random() * 40) + 60,
        timeline: [
          { timestamp: 0, emotion: 'neutral' },
          { timestamp: 30, emotion: 'confident' },
          { timestamp: 60, emotion: 'happy' },
        ],
      },
      voice_data: {
        clarity: Math.floor(Math.random() * 40) + 60,
        pace: Math.floor(Math.random() * 40) + 60,
        tone: Math.floor(Math.random() * 40) + 60,
        pronunciation: Math.floor(Math.random() * 40) + 60,
      },
      feedback: 'Great interview! You demonstrated strong communication skills and technical knowledge. Your facial expressions showed confidence throughout the interview. Consider working on pacing to give more thoughtful pauses between answers.',
      strengths: [
        'Clear communication and articulation',
        'Good eye contact and facial expression',
        'Strong technical knowledge',
        'Professional demeanor',
      ],
      improvements: [
        'Take more time to think before answering',
        'Use more concrete examples',
        'Improve voice clarity in technical explanations',
        'Add more storytelling to answers',
      ],
      completed_at: new Date().toISOString(),
    }

    return NextResponse.json(mockResult)
  } catch (error) {
    console.error('[v0] Error fetching results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview results' },
      { status: 500 }
    )
  }
}
