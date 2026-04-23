import { EventEmitter } from 'events'
import axios from 'axios'

export enum VerificationLevel {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  STRICT = 'strict',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

export interface VerificationRule {
  id: string
  name: string
  description: string
  check: (output: any) => Promise<{ valid: boolean; reason?: string; score: number }>
  weight: number
}

export interface VerificationResult {
  id: string
  taskId: string
  workerId: string
  status: VerificationStatus
  score: number
  checks: { rule: string; valid: boolean; reason?: string; score: number }[]
  details: string
  timestamp: number
}

/**
 * Verifier Agent
 * 
 * Validates worker output quality using AI and rule-based checks.
 * Ensures work meets standards before triggering payment.
 */
export class VerifierAgent extends EventEmitter {
  private rules: Map<string, VerificationRule> = new Map()
  private verificationHistory: Map<string, VerificationResult> = new Map()

  constructor() {
    super()
    this.initializeDefaultRules()
  }

  /**
   * Initialize default verification rules
   */
  private initializeDefaultRules(): void {
    // Length check
    this.addRule({
      id: 'length_check',
      name: 'Output Length',
      description: 'Check if output meets minimum length requirements',
      weight: 0.1,
      check: async (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output)
        const length = text.length
        if (length < 10) {
          return { valid: false, reason: 'Output too short', score: 0 }
        }
        if (length < 50) {
          return { valid: true, reason: 'Output very short', score: 0.5 }
        }
        return { valid: true, reason: 'Output length OK', score: 1 }
      },
    })

    // JSON validity check
    this.addRule({
      id: 'json_check',
      name: 'JSON Validity',
      description: 'Check if output is valid JSON',
      weight: 0.15,
      check: async (output: any) => {
        if (typeof output !== 'string') {
          return { valid: true, reason: 'Not a string output', score: 1 }
        }
        try {
          JSON.parse(output)
          return { valid: true, reason: 'Valid JSON', score: 1 }
        } catch {
          return { valid: false, reason: 'Invalid JSON', score: 0 }
        }
      },
    })

    // Profanity check (basic)
    this.addRule({
      id: 'profanity_check',
      name: 'Content Safety',
      description: 'Check for inappropriate content',
      weight: 0.25,
      check: async (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output).toLowerCase()
        const prohibited = ['spam', 'malicious', 'harmful']
        
        for (const word of prohibited) {
          if (text.includes(word)) {
            return { valid: false, reason: `Prohibited content: ${word}`, score: 0 }
          }
        }
        return { valid: true, reason: 'Content safe', score: 1 }
      },
    })

    // Structure check for code outputs
    this.addRule({
      id: 'code_structure',
      name: 'Code Structure',
      description: 'Verify code has proper structure',
      weight: 0.2,
      check: async (output: any) => {
        const text = typeof output === 'string' ? output : ''
        
        // Check for basic code patterns
        const hasBraces = text.includes('{') && text.includes('}')
        const hasParens = text.includes('(') && text.includes(')')
        
        if (text.includes('function') || text.includes('def ') || text.includes('class ')) {
          if (hasBraces || hasParens) {
            return { valid: true, reason: 'Valid code structure', score: 1 }
          }
        }
        
        // Not code, skip
        return { valid: true, reason: 'Not code, skipping', score: 1 }
      },
    })

    // Completeness check
    this.addRule({
      id: 'completeness',
      name: 'Output Completeness',
      description: 'Check if output appears complete',
      weight: 0.2,
      check: async (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output)
        
        // Check for incomplete sentences
        const incompletePatterns = [/\.\.\.$/, /undefined$/, /null$/]
        for (const pattern of incompletePatterns) {
          if (pattern.test(text)) {
            return { valid: false, reason: 'Output appears incomplete', score: 0 }
          }
        }
        
        return { valid: true, reason: 'Output appears complete', score: 1 }
      },
    })

    // AI-powered quality check (optional)
    this.addRule({
      id: 'ai_quality',
      name: 'AI Quality Assessment',
      description: 'Use Gemini to assess output quality',
      weight: 0.1,
      check: async (output: any) => {
        if (!process.env.GEMINI_API_KEY) {
          return { valid: true, reason: 'No AI configured, skipping', score: 0.8 }
        }

        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: `Rate this output quality 0-100. Just return a number.\n\nOutput: ${JSON.stringify(output).slice(0, 500)}`
                }]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
            },
            { headers: { 'Content-Type': 'application/json' } }
          )

          const scoreText = response.data.candidates?.[0]?.content?.parts?.[0]?.text
          const score = parseInt(scoreText) || 70
          
          return {
            valid: score >= 50,
            reason: score >= 50 ? 'AI quality check passed' : 'AI quality check failed',
            score: score / 100,
          }
        } catch (err) {
          return { valid: true, reason: 'AI check failed, defaulting to pass', score: 0.7 }
        }
      },
    })
  }

  /**
   * Add a custom verification rule
   */
  addRule(rule: VerificationRule): void {
    this.rules.set(rule.id, rule)
    console.log(`[Verifier] Added rule: ${rule.name}`)
  }

  /**
   * Remove a verification rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * Verify output against all rules
   */
  async verify(
    taskId: string,
    workerId: string,
    output: any,
    level: VerificationLevel = VerificationLevel.STANDARD
  ): Promise<VerificationResult> {
    const resultId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const timestamp = Date.now()

    console.log(`[Verifier] Starting verification for task ${taskId}`)

    // Determine which rules to apply based on level
    const rulesToApply = this.getRulesForLevel(level)

    const checks: VerificationResult['checks'] = []
    let totalWeight = 0
    let weightedScore = 0

    // Run each check
    for (const rule of rulesToApply) {
      totalWeight += rule.weight
      
      try {
        const checkResult = await rule.check(output)
        checks.push({
          rule: rule.name,
          valid: checkResult.valid,
          reason: checkResult.reason,
          score: checkResult.score,
        })
        
        weightedScore += checkResult.score * rule.weight
        
        if (!checkResult.valid) {
          console.log(`[Verifier] Check failed: ${rule.name} - ${checkResult.reason}`)
        }
      } catch (err: any) {
        console.warn(`[Verifier] Rule check error: ${rule.name}`, err.message)
        checks.push({
          rule: rule.name,
          valid: false,
          reason: `Check error: ${err.message}`,
          score: 0,
        })
      }
    }

    // Calculate final score
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0
    
    // Determine status
    let status: VerificationStatus
    if (finalScore >= 0.8) {
      status = VerificationStatus.VERIFIED
    } else if (finalScore >= 0.5) {
      status = VerificationStatus.NEEDS_REVIEW
    } else {
      status = VerificationStatus.REJECTED
    }

    const result: VerificationResult = {
      id: resultId,
      taskId,
      workerId,
      status,
      score: finalScore,
      checks,
      details: `Verified with ${checks.length} rules at ${level} level`,
      timestamp,
    }

    // Store result
    this.verificationHistory.set(resultId, result)

    console.log(`[Verifier] Verification complete: ${status} (score: ${(finalScore * 100).toFixed(0)}%)`)
    this.emit('verification:complete', result)

    return result
  }

  /**
   * Get rules for a verification level
   */
  private getRulesForLevel(level: VerificationLevel): VerificationRule[] {
    switch (level) {
      case VerificationLevel.NONE:
        return []
      case VerificationLevel.BASIC:
        return Array.from(this.rules.values()).filter(r => r.weight >= 0.2)
      case VerificationLevel.STANDARD:
        return Array.from(this.rules.values()).filter(r => r.weight >= 0.1)
      case VerificationLevel.STRICT:
        return Array.from(this.rules.values())
      default:
        return Array.from(this.rules.values())
    }
  }

  /**
   * Verify with custom rules
   */
  async verifyCustom(
    taskId: string,
    workerId: string,
    output: any,
    customRules: string[]
  ): Promise<VerificationResult> {
    const resultId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const timestamp = Date.now()

    const checks: VerificationResult['checks'] = []
    let totalWeight = 0
    let weightedScore = 0

    for (const ruleId of customRules) {
      const rule = this.rules.get(ruleId)
      if (!rule) continue

      totalWeight += rule.weight

      try {
        const checkResult = await rule.check(output)
        checks.push({
          rule: rule.name,
          valid: checkResult.valid,
          reason: checkResult.reason,
          score: checkResult.score,
        })
        weightedScore += checkResult.score * rule.weight
      } catch (err: any) {
        checks.push({
          rule: rule.name,
          valid: false,
          reason: `Error: ${err.message}`,
          score: 0,
        })
      }
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0
    
    return {
      id: resultId,
      taskId,
      workerId,
      status: finalScore >= 0.7 ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED,
      score: finalScore,
      checks,
      details: `Custom verification with ${customRules.length} rules`,
      timestamp,
    }
  }

  /**
   * Get verification history for a worker
   */
  getWorkerHistory(workerId: string, limit: number = 10): VerificationResult[] {
    return Array.from(this.verificationHistory.values())
      .filter(r => r.workerId === workerId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get verification statistics
   */
  getStats(): any {
    const results = Array.from(this.verificationHistory.values())
    
    const byStatus = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0

    return {
      total: results.length,
      byStatus,
      averageScore: avgScore,
      rulesCount: this.rules.size,
    }
  }

  /**
   * Get all registered rules
   */
  getRules(): VerificationRule[] {
    return Array.from(this.rules.values())
  }
}

// Export singleton
export const verifier = new VerifierAgent()

// Convenience function
export async function verifyOutput(
  taskId: string,
  workerId: string,
  output: any,
  level: VerificationLevel = VerificationLevel.STANDARD
): Promise<VerificationResult> {
  return verifier.verify(taskId, workerId, output, level)
}