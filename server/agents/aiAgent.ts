import 'dotenv/config'
import axios from 'axios'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

interface WorkAnalysis {
  complexity: 'simple' | 'moderate' | 'complex'
  suggestedRate: number
  reasoning: string
}

interface PingContext {
  workerId: string
  sessionId: string
  activityScore: number
  previousPings: number
  timeInSession: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[AI] No GEMINI_API_KEY - using fallback logic')
    return 'simple'
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'moderate'
  } catch (err) {
    console.warn('[AI] Gemini API error:', err)
    return 'moderate'
  }
}

export async function analyzeWorkComplexity(context: PingContext): Promise<WorkAnalysis> {
  const prompt = `Given this AI compute session:
- Worker ID: ${context.workerId}
- Activity Score: ${context.activityScore}/100
- Pings in session: ${context.previousPings}
- Time in session: ${Math.floor(context.timeInSession / 60)} minutes

Classify the work complexity as "simple", "moderate", or "complex" in ONE WORD.
Also suggest a fair nanopayment rate per 30s in dollars (e.g., 0.009, 0.015, 0.025).
Provide your response as: complexity,rate,reasoning`

  const result = await callGemini(prompt)
  
  try {
    const [complexity, rateStr, reasoning] = result.split(',').map(s => s.trim())
    return {
      complexity: complexity as 'simple' | 'moderate' | 'complex',
      suggestedRate: parseFloat(rateStr) || 0.009,
      reasoning: reasoning || 'Based on activity analysis',
    }
  } catch {
    return {
      complexity: 'moderate',
      suggestedRate: 0.009,
      reasoning: 'Default rate applied',
    }
  }
}

export async function validateWorkerOutput(
  workerId: string,
  workProduct: string,
  expectedQuality: string
): Promise<{ approved: boolean; qualityScore: number; feedback: string }> {
  if (!GEMINI_API_KEY) {
    return { approved: true, qualityScore: 85, feedback: 'Auto-approved (no AI)' }
  }

  const prompt = `Evaluate this AI worker output for quality:
Product: ${workProduct.slice(0, 500)}
Expected quality: ${expectedQuality}

Rate quality 0-100. Return format: score,feedback`

  const result = await callGemini(prompt)

  try {
    const [scoreStr, feedback] = result.split(',').map(s => s.trim())
    const score = parseInt(scoreStr) || 70
    return {
      approved: score >= 60,
      qualityScore: score,
      feedback: feedback || 'Quality check complete',
    }
  } catch {
    return { approved: true, qualityScore: 70, feedback: 'Default approval' }
  }
}

export async function calculateDynamicPrice(context: PingContext): Promise<number> {
  const baseRate = 0.009
  
  if (context.previousPings === 0) return baseRate

  const analysis = await analyzeWorkComplexity(context)
  
  let multiplier = 1.0
  switch (analysis.complexity) {
    case 'simple':
      multiplier = 0.8
      break
    case 'moderate':
      multiplier = 1.0
      break
    case 'complex':
      multiplier = 1.5
      break
  }

  return Math.min(0.025, baseRate * multiplier)
}

export async function getAIGeneratedTask(): Promise<{ task: string; difficulty: string; reward: number }> {
  const tasks = [
    { task: 'Analyze dataset and generate insights', difficulty: 'complex', reward: 0.025 },
    { task: 'Summarize meeting notes', difficulty: 'simple', reward: 0.009 },
    { task: 'Write unit tests for authentication module', difficulty: 'moderate', reward: 0.015 },
    { task: 'Review PR and provide feedback', difficulty: 'moderate', reward: 0.012 },
    { task: 'Generate API documentation', difficulty: 'simple', reward: 0.009 },
    { task: 'Refactor legacy code for performance', difficulty: 'complex', reward: 0.025 },
  ]

  if (!GEMINI_API_KEY) {
    return tasks[Math.floor(Math.random() * tasks.length)]
  }

  const prompt = `Select the most appropriate AI compute task from this list:
${tasks.map((t, i) => `${i + 1}. ${t.task} (${t.difficulty}) - $${t.reward}/30s`).join('\n')}

Return just the number (1-${tasks.length}) of the most complex task that would typically take 30 seconds.`

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    const idx = parseInt(response.data.candidates?.[0]?.content?.parts?.[0]?.text) - 1
    return tasks[Math.max(0, Math.min(idx, tasks.length - 1))]
  } catch {
    return tasks[Math.floor(Math.random() * tasks.length)]
  }
}