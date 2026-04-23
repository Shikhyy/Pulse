/**
 * Pulse Agent System
 * 
 * Centralized exports for all agent modules.
 * Each agent has a specific role in the autonomous compute network.
 */

export { 
  ActivityAgent, 
  startActivityAgent, 
  createAgentFleet, 
  stopAgentFleet,
  AgentRole, 
  AgentState,
  type ActivityMetrics,
  type AgentConfig 
} from './ActivityAgent'

export { 
  BudgetGuard, 
  budgetGuard,
  checkBudget,
  pauseWorker,
  resumeWorker,
  type BudgetInfo,
  type WorkerBudgetInfo,
  BudgetState 
} from './BudgetGuard'

export { 
  PaymentEngine, 
  paymentEngine,
  dispatchNanopayment,
  getGatewayBalance,
  depositToGateway,
  getSessionTotal,
  getWorkerTodayTotal,
  type NanopaymentParams,
  type NanopaymentResult,
  type PaymentMetrics,
  PaymentMethod,
  PaymentStatus
} from './PaymentEngine'

export { 
  TaskOrchestrator, 
  createSmartTask,
  rebalanceTasks,
  type Task,
  type WorkerStatus,
  type OrchestratorConfig 
} from './TaskOrchestrator'

export { 
  VerifierAgent, 
  verifier,
  verifyOutput,
  type VerificationResult,
  type VerificationRule,
  VerificationLevel,
  VerificationStatus 
} from './VerifierAgent'

export { 
  analyzeWorkComplexity, 
  validateWorkerOutput, 
  calculateDynamicPrice, 
  getAIGeneratedTask 
} from './aiAgent'

export { 
  OnChainVerifier, 
  quickVerify,
  type SessionInfo, 
  type WorkerConfig 
} from './onChainVerifier'

/**
 * Agent Roles in the Pulse Network:
 * 
 * 1. Activity Agent (Compute Node)
 *    - Monitors worker activity
 *    - Generates activity proofs
 *    - Sends signed pings every interval
 * 
 * 2. Payment Engine (Financial Layer)
 *    - Routes payments via Circle Nanopayments
 *    - Handles fallback mechanisms
 *    - Records all transactions
 * 
 * 3. Budget Guard (Safety Layer)
 *    - Enforces spending limits
 *    - Predictive analytics
 *    - Sends alerts
 * 
 * 4. Task Orchestrator (Coordination)
 *    - Distributes tasks to workers
 *    - Balances workload
 *    - Monitors performance
 * 
 * 5. Verifier Agent (Quality Control)
 *    - Validates worker output
 *    - Runs rule-based checks
 *    - Uses AI for quality assessment
 * 
 * 6. AI Agent (Intelligence)
 *    - Analyzes work complexity
 *    - Dynamic pricing
 *    - Task generation
 * 
 * 7. On-Chain Verifier (Trust Layer)
 *    - Verifies sessions on-chain
 *    - Confirms payments
 *    - Generates trust reports
 */