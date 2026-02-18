import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { generateQuestions, isAIAvailable } from '@/lib/ai-engine'

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

    const { interview_type, difficulty, job_role, experience_years, tech_stack, count } = await req.json()

    const questions = await generateQuestions({
      interviewType: interview_type || 'technical',
      difficulty: difficulty || 'medium',
      jobRole: job_role || 'Software Engineer',
      experienceYears: experience_years || 0,
      techStack: tech_stack || [],
      count: count || 5,
    })

    return NextResponse.json({
      questions,
      ai_powered: isAIAvailable(),
    })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
