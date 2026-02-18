import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { evaluateAnswer, isAIAvailable } from '@/lib/ai-engine'

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

    const { question, answer, job_role, difficulty } = await req.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Missing question or answer' },
        { status: 400 }
      )
    }

    const evaluation = await evaluateAnswer(
      question,
      answer,
      job_role || 'Software Engineer',
      difficulty || 'medium'
    )

    return NextResponse.json({
      ...evaluation,
      ai_powered: isAIAvailable(),
    })
  } catch (error) {
    console.error('Error evaluating answer:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    )
  }
}
