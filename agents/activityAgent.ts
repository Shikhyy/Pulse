import 'dotenv/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface AgentConfig {
  workerId: string
  sessionId: string
  circleWalletId?: string
  activityProfile: 'always_active' | 'mostly_active' | 'intermittent' | 'mostly_idle'
  pingIntervalMs: number
  authToken: string
}

/**
 * Activity Agent — Demo simulation mode
 *
 * Simulates activity monitoring and sends signed pings to the Payment Engine.
 * In demo mode: uses deterministic random scores (no real keyboard monitoring).
 * In production mode: would use iohook for real input sampling.
 */
export function startActivityAgent(config: AgentConfig): NodeJS.Timeout {
  let pingSeq = 0
  console.log(`[ActivityAgent] Worker ${config.workerId} started (profile: ${config.activityProfile})`)

  const interval = setInterval(async () => {
    pingSeq++
    const activityScore = simulateActivity(config.activityProfile)

    if (activityScore < 10) {
      console.log(`[ActivityAgent:${config.workerId}] Ping ${pingSeq}: IDLE (score=${activityScore})`)
      return
    }

    const proof = {
      workerId: config.workerId,
      sessionId: config.sessionId,
      timestamp: Date.now().toString(),
      activityScore: activityScore.toString(),
    }

    // In demo mode: generate a mock signature
    // In production: use Circle SDK signTypedData
    const isStubMode =
      !process.env.CIRCLE_API_KEY ||
      process.env.CIRCLE_API_KEY === 'your_api_key' ||
      process.env.STUB_MODE === 'true'

    let signature = '0x' + 'a'.repeat(130) // mock EIP-712 signature for demo

    if (!isStubMode && config.circleWalletId) {
      try {
        const { initiateDeveloperControlledWalletsClient } = await import(
          '@circle-fin/developer-controlled-wallets'
        )
        const client = initiateDeveloperControlledWalletsClient({
          apiKey: process.env.CIRCLE_API_KEY!,
          entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
        })

        const signRes = await client.signTypedData({
          walletId: config.circleWalletId,
          data: {
            types: {
              ActivityProof: [
                { name: 'workerId', type: 'string' },
                { name: 'sessionId', type: 'string' },
                { name: 'timestamp', type: 'uint256' },
                { name: 'activityScore', type: 'uint256' },
              ],
            },
            primaryType: 'ActivityProof',
            message: proof,
          },
        })
        signature = signRes.data?.signature ?? signature
      } catch (err) {
        console.warn(`[ActivityAgent:${config.workerId}] Signing failed, using stub sig`)
      }
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/ping`,
        { proof, signature },
        { headers: { Authorization: `Bearer ${config.authToken}` } }
      )
      console.log(
        `[ActivityAgent:${config.workerId}] Ping ${pingSeq}: paid $${res.data.amount} | session total: $${res.data.sessionTotal?.toFixed(3)}`
      )
    } catch (err: any) {
      const reason = err.response?.data?.error ?? err.message
      console.log(`[ActivityAgent:${config.workerId}] Ping ${pingSeq}: BLOCKED (${reason})`)
    }
  }, config.pingIntervalMs)

  return interval
}

function simulateActivity(profile: string): number {
  switch (profile) {
    case 'always_active':
      return 85 + Math.floor(Math.random() * 15)
    case 'mostly_active':
      return Math.random() > 0.15 ? 75 : 5
    case 'intermittent':
      return Math.random() > 0.4 ? 65 : 5
    case 'mostly_idle':
      return Math.random() > 0.7 ? 60 : 5
    default:
      return 0
  }
}
