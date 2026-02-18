import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

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

    const userId = payload.userId

    // Try to use database if available
    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()

      // Get total interviews
      const totalRes = await pool.query(
        'SELECT COUNT(*) as count FROM interview_sessions WHERE user_id = $1',
        [userId]
      )
      const totalInterviews = parseInt(totalRes.rows[0].count) || 0

      // Get average score
      const avgRes = await pool.query(
        'SELECT AVG(overall_score) as avg FROM interview_results WHERE user_id = $1',
        [userId]
      )
      const avgScore = Math.round((parseFloat(avgRes.rows[0].avg) || 0) * 100) / 100

      // Get best score
      const bestRes = await pool.query(
        'SELECT MAX(overall_score) as max FROM interview_results WHERE user_id = $1',
        [userId]
      )
      const bestScore = Math.round((parseFloat(bestRes.rows[0].max) || 0) * 100) / 100

      // Get last interview score
      const lastRes = await pool.query(
        `SELECT ir.overall_score, ir.created_at, ises.job_role
         FROM interview_results ir
         JOIN interview_sessions ises ON ir.session_id = ises.id
         WHERE ir.user_id = $1
         ORDER BY ir.created_at DESC
         LIMIT 1`,
        [userId]
      )
      const lastInterview = lastRes.rows[0] || null

      // Get user info
      const userRes = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      )
      const user = userRes.rows[0] || null

      // Get interview history (last 10)
      const historyRes = await pool.query(
        `SELECT ises.id, ises.job_role, ises.interview_type, ises.difficulty, ises.created_at,
                ir.duration_seconds,
                ir.overall_score as score, ir.id as result_id, ises.status
         FROM interview_sessions ises
         LEFT JOIN interview_results ir ON ises.id = ir.session_id
         WHERE ises.user_id = $1
         ORDER BY ises.created_at DESC
         LIMIT 10`,
        [userId]
      )
      const interviews = historyRes.rows.map((row) => ({
        id: row.id,
        result_id: row.result_id,
        job_role: row.job_role,
        interview_type: row.interview_type,
        difficulty: row.difficulty,
        created_at: row.created_at,
        duration_seconds: row.duration_seconds || 0,
        score: row.score ? Math.round(parseFloat(row.score)) : null,
        status: row.status,
      }))

      // Get score trend (last 10 completed interviews for chart)
      const trendRes = await pool.query(
        `SELECT ir.overall_score, ir.technical_score, ir.communication_score, ir.created_at
         FROM interview_results ir
         WHERE ir.user_id = $1
         ORDER BY ir.created_at ASC
         LIMIT 10`,
        [userId]
      )
      const scoreTrend = trendRes.rows.map((row, i) => ({
        name: `#${i + 1}`,
        overall: Math.round(parseFloat(row.overall_score) || 0),
        technical: Math.round(parseFloat(row.technical_score) || 0),
        communication: Math.round(parseFloat(row.communication_score) || 0),
        date: row.created_at,
      }))

      // Get score distribution by category
      const categoryRes = await pool.query(
        `SELECT 
           ROUND(AVG(technical_score)::numeric, 1) as technical,
           ROUND(AVG(communication_score)::numeric, 1) as communication,
           ROUND(AVG(confidence_score)::numeric, 1) as confidence,
           ROUND(AVG(emotion_score)::numeric, 1) as emotion,
           ROUND(AVG(speech_score)::numeric, 1) as speech
         FROM interview_results WHERE user_id = $1`,
        [userId]
      )
      const categoryAvg = categoryRes.rows[0] || {}
      const scoreBreakdown = [
        { category: 'Technical', score: parseFloat(categoryAvg.technical) || 0 },
        { category: 'Communication', score: parseFloat(categoryAvg.communication) || 0 },
        { category: 'Confidence', score: parseFloat(categoryAvg.confidence) || 0 },
        { category: 'Emotion', score: parseFloat(categoryAvg.emotion) || 0 },
        { category: 'Speech', score: parseFloat(categoryAvg.speech) || 0 },
      ]

      return NextResponse.json(
        {
          user,
          total_interviews: totalInterviews,
          avg_score: avgScore,
          best_score: bestScore,
          last_interview_score: lastInterview?.overall_score ? Math.round(parseFloat(lastInterview.overall_score)) : null,
          last_interview_role: lastInterview?.job_role || null,
          interviews,
          score_trend: scoreTrend,
          score_breakdown: scoreBreakdown,
        },
        { status: 200 }
      )
    } catch (dbError) {
      console.error('[v0] Database error in dashboard:', dbError)
      // Graceful fallback
      return NextResponse.json(
        {
          total_interviews: 0,
          avg_score: 0,
          best_score: 0,
          last_interview_score: null,
          interviews: [],
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('[v0] Error getting dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    )
  }
}
