// Re-export from new location for backward compatibility
import { startActivityAgent as _startActivityAgent, AgentRole } from '../server/agents/ActivityAgent'

export function startActivityAgent(config: any): NodeJS.Timeout {
  return _startActivityAgent({
    ...config,
    role: config.role || 'compute',
  })
}

export const Role = {
  COMPUTE: 'compute',
  VERIFIER: 'verifier',
  ORCHESTRATOR: 'orchestrator',
  MONITOR: 'monitor',
}
