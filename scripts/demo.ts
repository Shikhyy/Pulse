/**
 * Pulse Demo Script
 * Self-contained: creates 1 employer + 5 workers in DB, clocks them all in,
 * then fires pings every 30 seconds for 10 minutes.
 *
 * Usage:
 *   npm run demo          — normal speed (30s intervals, 10 min)
 *   npm run demo:fast     — fast mode (3s intervals, 2 min)
 *
 * Prerequisites: Server must be running on port 3001.
 */

import 'dotenv/config'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const FAST = process.env.FAST_DEMO === 'true'
const INTERVAL_MS = FAST ? 3_000 : 30_000
const DURATION_MS = FAST ? 2 * 60 * 1000 : 10 * 60 * 1000

const DEMO_EMPLOYER = {
  email: `demo-employer-${Date.now()}@pulse.demo`,
  name: 'Demo Corp',
  password: 'demo1234',
  companyName: 'Pulse Demo Corp',
  dailyCap: 50,
}

const DEMO_WORKERS = [
  { name: 'Alice Chen',   email: `alice-${Date.now()}@pulse.demo`, password: 'demo1234', profile: 'always_active' },
  { name: 'Bob Patel',    email: `bob-${Date.now()}@pulse.demo`,   password: 'demo1234', profile: 'always_active' },
  { name: 'Carol Kim',    email: `carol-${Date.now()}@pulse.demo`, password: 'demo1234', profile: 'mostly_active' },
  { name: 'David Wu',     email: `david-${Date.now()}@pulse.demo`, password: 'demo1234', profile: 'intermittent' },
  { name: 'Eva Rodriguez',email: `eva-${Date.now()}@pulse.demo`,   password: 'demo1234', profile: 'intermittent' },
]

async function req(path: string, body?: any, token?: string) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${path}`)
  return data
}

function isActive(profile: string): boolean {
  switch (profile) {
    case 'always_active':  return true
    case 'mostly_active':  return Math.random() > 0.15
    case 'intermittent':   return Math.random() > 0.40
    default:               return false
  }
}

async function runDemo() {
  console.log('\n🚀 Pulse Demo — Autonomous Payroll Simulation')
  console.log(`   Mode: ${FAST ? 'FAST (3s intervals, 2 min)' : 'Normal (30s intervals, 10 min)'}`)
  console.log(`   API:  ${API}\n`)

  // 1. Create employer
  console.log('1. Creating demo employer...')
  let employerToken: string
  let inviteCode: string
  try {
    const empRes = await req('/api/auth/signup/employer', DEMO_EMPLOYER)
    employerToken = empRes.token
    inviteCode = empRes.employer.inviteCode
    console.log(`   ✓ Employer created. Invite code: ${inviteCode}`)
  } catch (err: any) {
    // Maybe already exists — try login
    if (err.message === 'email_exists') {
      const empLogin = await req('/api/auth/login', { email: DEMO_EMPLOYER.email, password: DEMO_EMPLOYER.password })
      employerToken = empLogin.token
      inviteCode = empLogin.employer?.inviteCode ?? ''
      console.log(`   ✓ Employer logged in. Invite code: ${inviteCode}`)
    } else {
      throw err
    }
  }

  // 2. Create workers and clock them in
  console.log('\n2. Creating & clocking in 5 workers...')
  const activeSessions: { workerId: string; sessionId: string; token: string; name: string; profile: string }[] = []

  for (const w of DEMO_WORKERS) {
    try {
      const signupRes = await req('/api/auth/signup/worker', { ...w, inviteCode })
      const workerToken = signupRes.token
      const workerId = signupRes.user.id

      const clockInRes = await req('/api/sessions/start', {}, workerToken)
      activeSessions.push({
        workerId,
        sessionId: clockInRes.sessionId,
        token: workerToken,
        name: w.name,
        profile: w.profile,
      })
      console.log(`   ✓ ${w.name} clocked in (session: ${clockInRes.sessionId.slice(0, 8)}...)`)
    } catch (err: any) {
      console.warn(`   ⚠ Failed to create ${w.name}: ${err.message}`)
    }
  }

  if (activeSessions.length === 0) {
    console.error('No workers clocked in. Aborting.')
    process.exit(1)
  }

  // 3. Ping loop
  console.log(`\n3. Starting ping loop (${INTERVAL_MS / 1000}s interval, ${DURATION_MS / 60000} min total)...\n`)
  let pingCycle = 0
  let totalPaid = 0
  let totalIdle = 0

  const runCycle = async () => {
    pingCycle++
    process.stdout.write(`\r   Cycle ${pingCycle} | Paid: ${totalPaid} | Idle: ${totalIdle} | Total: $${(totalPaid * 0.009).toFixed(3)}`)

    for (const session of activeSessions) {
      const active = isActive(session.profile)
      if (!active) {
        totalIdle++
        continue
      }

      const proof = {
        workerId: session.workerId,
        sessionId: session.sessionId,
        timestamp: Date.now().toString(),
        activityScore: '100',
      }
      const signature = '0x' + '0'.repeat(130)

      try {
        const res = await req('/api/ping', { proof, signature }, session.token)
        if (res.paid) totalPaid++
      } catch (err: any) {
        if (err.message?.includes('employer_daily_cap_exceeded')) {
          console.log('\n   ⚠ Daily cap reached — stopping pings.')
          clearInterval(interval)
          await finalize(activeSessions.map(s => ({ ...s, token: s.token })))
          process.exit(0)
        }
        totalIdle++
      }
    }
  }

  await runCycle()
  const interval = setInterval(runCycle, INTERVAL_MS)

  // 4. Auto-stop after duration
  setTimeout(async () => {
    clearInterval(interval)
    console.log('\n\n4. Demo complete! Clocking out workers...')
    await finalize(activeSessions.map(s => ({ ...s, token: s.token })))
  }, DURATION_MS)
}

async function finalize(sessions: { sessionId: string; token: string; name: string }[]) {
  for (const s of sessions) {
    try {
      const summary = await req('/api/sessions/end', { sessionId: s.sessionId }, s.token)
      console.log(`   ✓ ${s.name}: $${Number(summary.totalEarned).toFixed(3)} earned in ${summary.pingCount} pings`)
    } catch (err: any) {
      console.warn(`   ⚠ Clock-out failed for ${s.name}: ${err.message}`)
    }
  }

  const proof = await req('/api/demo/proof').catch(() => null)
  if (proof) {
    console.log(`\n📊 Final Stats:`)
    console.log(`   Total payments in DB: ${proof.dbPaymentCount}`)
    console.log(`   Total paid:           $${proof.totalPaid}`)
    console.log(`   Arc Explorer:         ${proof.arcExplorerLink}`)
    if (proof.dbPaymentCount >= 50) {
      console.log(`\n✅ ${proof.dbPaymentCount} transactions — submission ready!`)
    } else {
      console.log(`\n💡 Run again to hit 50+ transactions for submission.`)
    }
  }

  console.log('\n🏁 Done. Visit http://localhost:3000/demo for the proof screen.\n')
  process.exit(0)
}

runDemo().catch(err => {
  console.error('\n❌ Demo failed:', err.message)
  process.exit(1)
})
