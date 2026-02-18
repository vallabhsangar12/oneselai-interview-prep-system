import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

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

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = (payload as any).userId || (payload as any).sub

    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()
      const result = await pool.query(
        `SELECT ir.*, 
                is2.interview_type as session_type, 
                is2.difficulty as session_difficulty,
                is2.job_role as session_job_role,
                is2.tech_stack as session_tech_stack,
                is2.experience_years as session_experience_years
         FROM interview_results ir
         LEFT JOIN interview_sessions is2 ON ir.session_id = is2.id
         WHERE ir.id = $1 AND ir.user_id = $2`,
        [resultId, userId]
      )

      if (result.rows.length > 0) {
        const row = result.rows[0]
        return NextResponse.json({
          id: row.id,
          session_id: row.session_id,
          user_id: row.user_id,
          interview_type: row.interview_type || row.session_type || 'technical',
          difficulty: row.difficulty || row.session_difficulty || 'medium',
          job_role: row.job_role || row.session_job_role || 'Software Engineer',
          tech_stack: row.session_tech_stack || [],
          experience_years: row.session_experience_years || 0,
          overall_score: parseFloat(row.overall_score) || 0,
          technical_score: parseFloat(row.technical_score) || 0,
          communication_score: parseFloat(row.communication_score) || 0,
          confidence_score: parseFloat(row.confidence_score) || 0,
          emotion_score: parseFloat(row.emotion_score) || 0,
          speech_score: parseFloat(row.speech_score) || 0,
          question_count: row.question_count || 0,
          questions_answered: row.questions_answered || 0,
          duration_seconds: row.duration_seconds || 0,
          emotions: row.emotions || {},
          per_question_scores: row.per_question_scores || [],
          strengths: row.strengths || [],
          improvements: row.improvements || [],
          feedback: row.feedback || '',
          transcript: row.transcript || [],
          created_at: row.created_at,
        })
      }

      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    } catch (dbError) {
      console.error('Database error fetching result:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error fetching interview result:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview results' },
      { status: 500 }
    )
  }
}
