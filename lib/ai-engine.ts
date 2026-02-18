/**
 * AI Engine for OneselfAI Interview Prep System
 * 
 * Uses OpenAI when OPENAI_API_KEY is set.
 * Falls back to rule-based evaluation when OpenAI is not available.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface QuestionGenerationParams {
  interviewType: string
  difficulty: string
  jobRole: string
  experienceYears: number
  techStack: string[]
  count: number
}

interface GeneratedQuestion {
  id: string
  category: string
  difficulty: string
  question: string
  timeLimit: number
  tips: string[]
  expectedTopics: string[]
}

interface AnswerEvaluation {
  score: number
  technicalAccuracy: number
  communicationClarity: number
  feedback: string
  keyPointsCovered: string[]
  missedPoints: string[]
}

export function isAIAvailable(): boolean {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')
}

// ============================
// QUESTION GENERATION
// ============================

async function generateQuestionsWithAI(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert technical interviewer. Generate ${params.count} interview questions for a ${params.difficulty} difficulty ${params.interviewType} interview. 
          
The candidate is applying for a ${params.jobRole} role with ${params.experienceYears} years of experience.
${params.techStack.length > 0 ? `Their tech stack includes: ${params.techStack.join(', ')}` : ''}

Return a JSON array of questions. Each question object must have:
- id: unique string
- category: "technical" or "behavioral"
- difficulty: "${params.difficulty}"
- question: the interview question
- timeLimit: seconds (easy=120, medium=180, hard=300)
- tips: array of 3-4 tips for answering
- expectedTopics: array of key topics a good answer should cover

Return ONLY the JSON array, no markdown formatting.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '[]'

  // Parse JSON, handling potential markdown code blocks
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ============================
// ANSWER EVALUATION
// ============================

async function evaluateAnswerWithAI(
  question: string,
  answer: string,
  jobRole: string,
  difficulty: string
): Promise<AnswerEvaluation> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert interviewer evaluating a candidate's answer for a ${jobRole} position (${difficulty} difficulty).

Evaluate the answer and return a JSON object with:
- score: 0-100 overall score
- technicalAccuracy: 0-100
- communicationClarity: 0-100
- feedback: 2-3 sentences of constructive feedback
- keyPointsCovered: array of key points the candidate covered well
- missedPoints: array of important points that were missed

Return ONLY the JSON object, no markdown formatting.`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nCandidate's Answer: ${answer}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ============================
// FEEDBACK GENERATION
// ============================

async function generateFeedbackWithAI(
  jobRole: string,
  difficulty: string,
  scores: Record<string, number>,
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ strengths: string[]; improvements: string[]; overallFeedback: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert career coach providing feedback on an interview performance for a ${jobRole} position (${difficulty} difficulty).

Scores: ${JSON.stringify(scores)}

Generate a JSON object with:
- strengths: array of 3-5 specific strengths demonstrated
- improvements: array of 3-5 specific areas to improve
- overallFeedback: 3-4 sentence comprehensive feedback paragraph

Return ONLY the JSON object, no markdown formatting.`,
        },
        {
          role: 'user',
          content: `Interview Q&A:\n${questionsAndAnswers.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join('\n\n')}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ============================
// RULE-BASED FALLBACKS
// ============================

function evaluateAnswerRuleBased(question: string, answer: string): AnswerEvaluation {
  const wordCount = answer.split(/\s+/).filter(Boolean).length
  const sentenceCount = answer.split(/[.!?]+/).filter(Boolean).length
  const hasExamples = /for example|for instance|such as|like when/i.test(answer)
  const hasStructure = /first|second|third|additionally|furthermore|in conclusion/i.test(answer)
  const hasTechnicalTerms = /api|database|server|client|function|component|algorithm|complexity|architecture|scalability|pattern|testing|deployment/i.test(answer)

  let score = 30 // base score for any response

  // Word count scoring
  if (wordCount > 20) score += 10
  if (wordCount > 50) score += 10
  if (wordCount > 100) score += 10
  if (wordCount > 150) score += 5

  // Quality signals
  if (hasExamples) score += 10
  if (hasStructure) score += 10
  if (hasTechnicalTerms) score += 10
  if (sentenceCount >= 3) score += 5

  score = Math.min(100, score)

  const technicalAccuracy = hasTechnicalTerms ? Math.min(100, score + 10) : Math.max(20, score - 15)
  const communicationClarity = sentenceCount >= 2 && wordCount > 30 ? Math.min(100, score + 5) : Math.max(20, score - 10)

  const keyPointsCovered: string[] = []
  const missedPoints: string[] = []

  if (hasExamples) keyPointsCovered.push('Provided concrete examples')
  if (hasStructure) keyPointsCovered.push('Used structured approach')
  if (hasTechnicalTerms) keyPointsCovered.push('Included relevant technical terminology')
  if (wordCount > 50) keyPointsCovered.push('Gave a sufficiently detailed response')

  if (!hasExamples) missedPoints.push('Could include more concrete examples')
  if (!hasStructure) missedPoints.push('Structure your answer with clear beginning, middle, and end')
  if (wordCount < 30) missedPoints.push('Provide more detailed explanations')

  let feedback = ''
  if (score >= 80) feedback = 'Strong answer with good depth and relevant detail.'
  else if (score >= 60) feedback = 'Decent answer. Try adding more specific examples and structured reasoning.'
  else if (score >= 40) feedback = 'Basic answer. Work on providing more detailed, structured responses with examples.'
  else feedback = 'Brief response. Practice elaborating your answers with examples and technical depth.'

  return { score, technicalAccuracy, communicationClarity, feedback, keyPointsCovered, missedPoints }
}

// ============================
// PUBLIC API
// ============================

export async function generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
  if (isAIAvailable()) {
    try {
      return await generateQuestionsWithAI(params)
    } catch (err) {
      console.error('AI question generation failed, using fallback:', err)
    }
  }

  // Fallback: use the static question bank
  const { getQuestions } = await import('./interview-questions')
  const type = params.interviewType === 'behavioral' ? 'behavioral' : 'technical'
  const diff = (['easy', 'medium', 'hard'].includes(params.difficulty) ? params.difficulty : 'medium') as 'easy' | 'medium' | 'hard'
  
  const questions = getQuestions(type, diff, params.count)
  return questions.map((q) => ({
    ...q,
    expectedTopics: q.tips,
  }))
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  jobRole: string = 'Software Engineer',
  difficulty: string = 'medium'
): Promise<AnswerEvaluation> {
  if (isAIAvailable()) {
    try {
      return await evaluateAnswerWithAI(question, answer, jobRole, difficulty)
    } catch (err) {
      console.error('AI answer evaluation failed, using fallback:', err)
    }
  }

  return evaluateAnswerRuleBased(question, answer)
}

export async function generateOverallFeedback(
  jobRole: string,
  difficulty: string,
  scores: Record<string, number>,
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ strengths: string[]; improvements: string[]; overallFeedback: string }> {
  if (isAIAvailable()) {
    try {
      return await generateFeedbackWithAI(jobRole, difficulty, scores, questionsAndAnswers)
    } catch (err) {
      console.error('AI feedback generation failed, using fallback:', err)
    }
  }

  // Rule-based fallback
  const strengths: string[] = []
  const improvements: string[] = []

  if ((scores.overall || 0) >= 70) strengths.push('Demonstrated solid overall interview performance')
  if ((scores.technical || 0) >= 70) strengths.push('Showed strong technical knowledge and understanding')
  if ((scores.communication || 0) >= 70) strengths.push('Communicated ideas clearly and effectively')
  if ((scores.confidence || 0) >= 70) strengths.push('Maintained confidence and composure throughout')
  if ((scores.emotion || 0) >= 70) strengths.push('Showed positive engagement and emotional intelligence')

  if ((scores.overall || 0) < 60) improvements.push('Practice mock interviews to improve overall performance')
  if ((scores.technical || 0) < 60) improvements.push('Strengthen technical fundamentals and problem-solving approach')
  if ((scores.communication || 0) < 60) improvements.push('Work on structuring answers more clearly with examples')
  if ((scores.confidence || 0) < 60) improvements.push('Build confidence through repeated practice and preparation')
  if ((scores.emotion || 0) < 60) improvements.push('Practice maintaining positive body language and engagement')

  if (strengths.length === 0) strengths.push('Completed the interview session')
  if (improvements.length === 0) improvements.push('Continue practicing to maintain performance')

  return {
    strengths,
    improvements,
    overallFeedback: `You completed a ${difficulty} difficulty interview for the ${jobRole} role. Your overall score was ${scores.overall || 0}/100. ${strengths.length > 2 ? 'You showed several strong areas.' : 'Focus on the improvement areas to boost your scores.'} Keep practicing to build confidence and refine your answers.`,
  }
}
