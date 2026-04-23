import { EventEmitter } from 'events'
import { AgentRole, ActivityAgent } from './ActivityAgent'
import { budgetGuard } from './BudgetGuard'
import { paymentEngine } from './PaymentEngine'
import { analyzeWorkComplexity, getAIGeneratedTask, validateWorkerOutput } from './aiAgent'

export interface Task {
  id: string
  type: string
  description: string
  difficulty: 'simple' | 'moderate' | 'complex'
  reward: number
  assignedWorker?: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
  output?: any
}

export interface WorkerStatus {
  workerId: string
  role: AgentRole
  isAvailable: boolean
  currentTask?: string
  performance: number
  earnedTotal: number
  tasksCompleted: number
}

export interface OrchestratorConfig {
  maxWorkers: number
  taskQueueSize: number
  autoScale: boolean
  balanceBudget: number
}

/**
 * Task Orchestrator Agent
 * 
 * Manages task distribution, worker assignment, and load balancing.
 * Ensures fair distribution of work and optimal resource utilization.
 */
export class TaskOrchestrator extends EventEmitter {
  private config: OrchestratorConfig
  private workers: Map<string, WorkerStatus> = new Map()
  private taskQueue: Map<string, Task> = new Map()
  private activeTasks: Map<string, Task> = new Map()

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super()
    this.config = {
      maxWorkers: 10,
      taskQueueSize: 100,
      autoScale: true,
      balanceBudget: 50,
      ...config,
    }
  }

  /**
   * Register a worker with the orchestrator
   */
  registerWorker(workerId: string, role: AgentRole): void {
    this.workers.set(workerId, {
      workerId,
      role,
      isAvailable: true,
      performance: 100,
      earnedTotal: 0,
      tasksCompleted: 0,
    })
    console.log(`[Orchestrator] Registered worker: ${workerId} (${role})`)
    this.emit('worker:registered', { workerId, role })
  }

  /**
   * Unregister a worker
   */
  unregisterWorker(workerId: string): void {
    const worker = this.workers.get(workerId)
    if (worker?.currentTask) {
      // Fail current task
      const task = this.activeTasks.get(worker.currentTask)
      if (task) {
        task.status = 'failed'
        this.activeTasks.delete(worker.currentTask)
      }
    }
    this.workers.delete(workerId)
    console.log(`[Orchestrator] Unregistered worker: ${workerId}`)
    this.emit('worker:unregistered', { workerId })
  }

  /**
   * Add a task to the queue
   */
  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: Date.now(),
    }

    if (this.taskQueue.size >= this.config.taskQueueSize) {
      throw new Error('Task queue full')
    }

    this.taskQueue.set(id, fullTask)
    console.log(`[Orchestrator] Added task: ${id} (${task.type})`)
    this.emit('task:added', fullTask)

    // Try to assign immediately
    this.assignTask(id)

    return id
  }

  /**
   * Assign a task to the best available worker
   */
  private assignTask(taskId: string): boolean {
    const task = this.taskQueue.get(taskId)
    if (!task || task.status !== 'pending') return false

    // Find best available worker
    const availableWorkers = Array.from(this.workers.values())
      .filter(w => w.isAvailable && !w.currentTask)

    if (availableWorkers.length === 0) {
      console.log(`[Orchestrator] No available workers for task: ${taskId}`)
      return false
    }

    // Select worker based on role and performance
    const bestWorker = this.selectWorker(availableWorkers, task)

    if (!bestWorker) return false

    // Assign task
    task.status = 'assigned'
    task.assignedWorker = bestWorker.workerId
    bestWorker.currentTask = taskId

    // Move from queue to active
    this.taskQueue.delete(taskId)
    this.activeTasks.set(taskId, task)

    console.log(`[Orchestrator] Assigned task ${taskId} to worker ${bestWorker.workerId}`)
    this.emit('task:assigned', { task, workerId: bestWorker.workerId })

    return true
  }

  /**
   * Select the best worker for a task
   */
  private selectWorker(workers: WorkerStatus[], task: Task): WorkerStatus | null {
    // Filter by role compatibility
    const compatibleWorkers = workers.filter(w => {
      if (task.type.includes('compute') && w.role === AgentRole.COMPUTE) return true
      if (task.type.includes('verify') && w.role === AgentRole.VERIFIER) return true
      if (task.type.includes('orchestrate') && w.role === AgentRole.ORCHESTRATOR) return true
      if (task.type.includes('monitor') && w.role === AgentRole.MONITOR) return true
      return true // Fallback: any worker
    })

    if (compatibleWorkers.length === 0) return workers[0]

    // Select worker with best performance
    compatibleWorkers.sort((a, b) => b.performance - a.performance)
    return compatibleWorkers[0]
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, output: any): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.status = 'completed'
    task.completedAt = Date.now()
    task.output = output

    // Update worker stats
    if (task.assignedWorker) {
      const worker = this.workers.get(task.assignedWorker)
      if (worker) {
        worker.currentTask = undefined
        worker.isAvailable = true
        worker.tasksCompleted++
        worker.earnedTotal += task.reward

        if (worker.tasksCompleted % 10 === 0) {
          worker.performance = Math.min(100, worker.performance + 5)
        }
      }
    }

    console.log(`[Orchestrator] Task completed: ${taskId} by ${task.assignedWorker}`)
    this.emit('task:completed', { task, output })

    // Try to assign next task
    this.processQueue()
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): void {
    const task = this.activeTasks.get(taskId)
    if (!task) return

    task.status = 'failed'

    // Update worker performance
    if (task.assignedWorker) {
      const worker = this.workers.get(task.assignedWorker)
      if (worker) {
        worker.currentTask = undefined
        worker.isAvailable = true
        worker.performance = Math.max(0, worker.performance - 10)
      }
    }

    console.log(`[Orchestrator] Task failed: ${taskId} - ${error}`)
    this.emit('task:failed', { task, error })

    // Retry or requeue
    this.processQueue()
  }

  /**
   * Process pending tasks in queue
   */
  private processQueue(): void {
    const pendingTasks = Array.from(this.taskQueue.values())
      .filter(t => t.status === 'pending')

    for (const task of pendingTasks) {
      this.assignTask(task.id)
    }
  }

  /**
   * Get available workers
   */
  getAvailableWorkers(): WorkerStatus[] {
    return Array.from(this.workers.values()).filter(w => w.isAvailable)
  }

  /**
   * Get worker status
   */
  getWorkerStatus(workerId: string): WorkerStatus | null {
    return this.workers.get(workerId) || null
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; active: number; completed: number } {
    return {
      pending: this.taskQueue.size,
      active: this.activeTasks.size,
      completed: 0, // Could track separately
    }
  }

  /**
   * Get orchestrator stats
   */
  getStats(): any {
    return {
      workers: {
        total: this.workers.size,
        available: this.getAvailableWorkers().length,
        roles: Array.from(this.workers.values()).reduce((acc, w) => {
          acc[w.role] = (acc[w.role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
      tasks: {
        pending: this.taskQueue.size,
        active: this.activeTasks.size,
      },
      budget: budgetGuard.getBudgetInfo('default'),
    }
  }
}

/**
 * Create a smart task for the AI compute marketplace
 */
export async function createSmartTask(): Promise<Omit<Task, 'id' | 'status' | 'createdAt'>> {
  const aiTask = await getAIGeneratedTask()
  
  return {
    type: aiTask.difficulty === 'complex' ? 'compute:complex' : 'compute:simple',
    description: aiTask.task,
    difficulty: aiTask.difficulty as any,
    reward: aiTask.reward,
  }
}

/**
 * Auto-balance: redistribute tasks based on worker performance
 */
export async function rebalanceTasks(orchestrator: TaskOrchestrator): Promise<void> {
  const stats = orchestrator.getStats()
  
  console.log('[Orchestrator] Rebalancing tasks...')
  
  // Check for underperforming workers
  const workers = Array.from(stats.workers)
  const underperformers = workers.filter((w: any) => w.performance < 50)
  
  if (underperformers.length > 0) {
    console.log(`[Orchestrator] Found ${underperformers.length} underperforming workers`)
  }
}

export default TaskOrchestrator