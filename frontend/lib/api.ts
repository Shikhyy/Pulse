const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'request_failed')
  return data as T
}

export const api = {
  // Auth
  signupWorker: (body: any) =>
    request('/api/auth/signup/worker', { method: 'POST', body: JSON.stringify(body) }),
  signupEmployer: (body: any) =>
    request('/api/auth/signup/employer', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // Sessions
  clockIn: (token: string) =>
    request('/api/sessions/start', { method: 'POST', body: JSON.stringify({}) }, token),
  clockOut: (sessionId: string, token: string) =>
    request('/api/sessions/end', { method: 'POST', body: JSON.stringify({ sessionId }) }, token),
  getEarnings: (token: string) =>
    request('/api/worker/earnings', {}, token),

  // Employer
  getDashboard: (token: string) =>
    request('/api/employer/dashboard', {}, token),
  pauseWorker: (workerId: string, token: string) =>
    request(`/api/workers/${workerId}/pause`, { method: 'POST', body: JSON.stringify({}) }, token),
  resumeWorker: (workerId: string, token: string) =>
    request(`/api/workers/${workerId}/resume`, { method: 'POST', body: JSON.stringify({}) }, token),

  // Demo
  getDemoProof: () => request('/api/demo/proof'),
  getDemoMetrics: () => request('/api/demo/metrics'),
  getCsvUrl: () => `${API}/api/demo/csv`,
  getScenarios: () => request('/api/demo/scenarios'),

  // x402
  getPaymentStream: () => request('/api/x402/payment-stream'),
  initStream: (body: any) => request('/api/x402/init', { method: 'POST', body: JSON.stringify(body) }),
  getStreamStatus: (streamId: string) => request(`/api/x402/stream/${streamId}`),
  pauseStream: (streamId: string) => request(`/api/x402/stream/${streamId}/pause`, { method: 'POST' }),
  resumeStream: (streamId: string) => request(`/api/x402/stream/${streamId}/resume`, { method: 'POST' }),
  getPaymentRequirements: (path: string) => request(`/api/x402/requirements${path}`),
  getGatewayBalance: (address: string) => request(`/api/gateway/balance/${address}`),

  // Onboarding
  getOnboardingStatus: (token: string) => request('/api/onboarding/status', {}, token),
  getOnboardingNextStep: (token: string) => request('/api/onboarding/next-step', {}, token),
  completeOnboardingStep: (step: string, token: string) =>
    request('/api/onboarding/complete-step', { method: 'POST', body: JSON.stringify({ step }) }, token),
  getOnboardingGuide: (role: string) => request(`/api/onboarding/guide?role=${role}`),

  // Webhooks
  createWebhook: (body: any, token: string) =>
    request('/api/webhooks', { method: 'POST', body: JSON.stringify(body) }, token),
  listWebhooks: (token: string) => request('/api/webhooks', {}, token),
  getWebhook: (id: string, token: string) => request(`/api/webhooks/${id}`, {}, token),
  deleteWebhook: (id: string, token: string) =>
    request(`/api/webhooks/${id}`, { method: 'DELETE' }, token),
  testWebhook: (id: string, token: string) =>
    request(`/api/webhooks/${id}/test`, { method: 'POST' }, token),
  getWebhookEvents: (id: string, token: string) =>
    request(`/api/webhooks/${id}/events`, {}, token),
  updateWebhook: (id: string, active: boolean, token: string) =>
    request(`/api/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),

  // Ping — fires payment
  sendPing: (proof: Record<string, string>, signature: string, token: string) =>
    request('/api/ping', { method: 'POST', body: JSON.stringify({ proof, signature }) }, token),

  // Agents
  getAgentMetrics: (token: string) => request('/api/agents/metrics', {}, token),
  getAgentLogs: (limit?: number, agent?: string, level?: string) => 
    request(`/api/agents/logs?limit=${limit ?? 50}${agent ? `&agent=${agent}` : ''}${level ? `&level=${level}` : ''}`),
}
