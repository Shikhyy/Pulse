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
  getCsvUrl: () => `${API}/api/demo/csv`,

  // Ping — fires payment
  sendPing: (proof: Record<string, string>, signature: string, token: string) =>
    request('/api/ping', { method: 'POST', body: JSON.stringify({ proof, signature }) }, token),
}
