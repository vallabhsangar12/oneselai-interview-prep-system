import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = (payload as any).userId || (payload as any).sub
    const body = await req.json()

    const {
      session_id,
      overall_score,
      technical_score,
      communication_score,
      confidence_score,
      emotion_score,
      speech_score,
      question_count,
      questions_answered,
      duration_seconds,
      emotions,
      per_question_scores,
      strengths,
      improvements,
      feedback,
      transcript,
      interview_type,
      difficulty,
      job_role,
    } = body

    if (!session_id || overall_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id and overall_score' },
        { status: 400 }
      )
    }

    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()

      const result = await pool.query(
        `INSERT INTO interview_results 
         (user_id, session_id, interview_type, difficulty, job_role,
          overall_score, technical_score, communication_score, confidence_score, emotion_score, speech_score,
          question_count, questions_answered, duration_seconds,
          emotions, per_question_scores, strengths, improvements, feedback, transcript)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         RETURNING id`,
        [
          userId,
          session_id,
          interview_type || null,
          difficulty || null,
          job_role || null,
          overall_score,
          technical_score || 0,
          communication_score || 0,
          confidence_score || 0,
          emotion_score || 0,
          speech_score || 0,
          question_count || 0,
          questions_answered || 0,
          duration_seconds || 0,
          JSON.stringify(emotions || {}),
          JSON.stringify(per_question_scores || []),
          strengths || [],
          improvements || [],
          feedback || null,
          JSON.stringify(transcript || []),
        ]
      )

      // Update session status
      await pool.query(
        `UPDATE interview_sessions SET status = 'completed', ended_at = NOW(), duration_seconds = $1 WHERE id = $2`,
        [duration_seconds || 0, session_id]
      )

      return NextResponse.json({
        success: true,
        result_id: result.rows[0].id,
        message: 'Interview result saved',
      })
    } catch (dbError) {
      console.error('Database error saving interview result:', dbError)
      return NextResponse.json(
        { error: 'Database error saving results' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error saving interview result:', error)
    return NextResponse.json(
      { error: 'Failed to save interview result' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = (payload as any).userId || (payload as any).sub
    const resultId = req.nextUrl.searchParams.get('result_id')

    if (!resultId) {
      return NextResponse.json({ error: 'Missing result_id' }, { status: 400 })
    }

    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()

      const result = await pool.query(
        `SELECT * FROM interview_results WHERE id = $1 AND user_id = $2`,
        [resultId, userId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Result not found' }, { status: 404 })
      }

      return NextResponse.json(result.rows[0])
    } catch (dbError) {
      console.error('Database error fetching interview result:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error getting interview result:', error)
    return NextResponse.json({ error: 'Failed to get interview result' }, { status: 500 })
  }
}
