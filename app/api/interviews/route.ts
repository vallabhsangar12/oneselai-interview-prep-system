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

    const userId = (payload as any).userId || (payload as any).sub

    try {
      const { getPool } = await import('@/lib/postgres')
      const pool = getPool()

      const result = await pool.query(
        `SELECT 
          ir.id,
          ir.session_id,
          ir.interview_type,
          ir.difficulty,
          ir.job_role,
          ir.overall_score,
          ir.duration_seconds,
          ir.created_at
        FROM interview_results ir
        WHERE ir.user_id = $1
        ORDER BY ir.created_at DESC
        LIMIT 50`,
        [userId]
      )

      return NextResponse.json({
        interviews: result.rows,
      })
    } catch (dbError) {
      console.error('Database error fetching interviews:', dbError)
      return NextResponse.json({
        interviews: [],
      })
    }
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}
