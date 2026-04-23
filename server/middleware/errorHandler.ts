import { Router, Request, Response, NextFunction } from 'express'

const router = Router()

/**
 * Global Error Handler Middleware
 * Standardizes error responses across the API
 */

interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public code: string
  public statusCode: number
  public details?: any

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'ApiError'
  }
}

/**
 * Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(
    `Route ${req.method} ${req.path} not found`,
    'ROUTE_NOT_FOUND',
    404
  )
  next(error)
}

/**
 * Global Error Handler
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]', err.message, err.stack)

  // Handle known API errors
  if (err instanceof ApiError) {
    const errorResponse: ApiError = {
      code: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
    }
    return res.status(err.statusCode).json(errorResponse)
  }

  // Handle Circle API errors
  if (err.message.includes('Circle')) {
    const errorResponse: ApiError = {
      code: 'CIRCLE_ERROR',
      message: 'Payment service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    }
    return res.status(503).json(errorResponse)
  }

  // Handle blockchain errors
  if (err.message.includes('transaction') || err.message.includes('nonce')) {
    const errorResponse: ApiError = {
      code: 'CHAIN_ERROR',
      message: 'Blockchain transaction failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    }
    return res.status(502).json(errorResponse)
  }

  // Handle validation errors
  if (err.message.includes('validation') || err.message.includes('invalid')) {
    const errorResponse: ApiError = {
      code: 'VALIDATION_ERROR',
      message: err.message,
      timestamp: new Date().toISOString(),
    }
    return res.status(400).json(errorResponse)
  }

  // Default internal server error
  const errorResponse: ApiError = {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  }
  res.status(500).json(errorResponse)
}

/**
 * Async handler wrapper to catch errors automatically
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Validation helpers
 */
export function validateRequired(fields: string[], body: any): void {
  const missing = fields.filter(field => !body[field])
  if (missing.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missing.join(', ')}`,
      'MISSING_FIELDS',
      400
    )
  }
}

export function validateAmount(amount: string): void {
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) {
    throw new ApiError(
      'Invalid amount: must be a positive number',
      'INVALID_AMOUNT',
      400
    )
  }
  if (num > 10000) {
    throw new ApiError(
      'Amount exceeds maximum allowed ($10,000)',
      'AMOUNT_TOO_LARGE',
      400
    )
  }
}

export function validateAddress(address: string): void {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    throw new ApiError(
      'Invalid Ethereum address',
      'INVALID_ADDRESS',
      400
    )
  }
}

/**
 * Rate limiting helper (placeholder for production)
 */
export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  // In production, implement with Redis or similar
  // For now, allow all requests
  return true
}

export default router