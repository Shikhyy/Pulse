import 'dotenv/config'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const ARC_CHAIN_ID = 5042002
const GATEWAY_DOMAIN = 26

interface PaymentRequirement {
  protocol: string
  version: number
  scheme: string
  chainId: number
  domain: number
  verifyingContract: string
  maxAmount: string
  payer: string
  fee: string
  deadline: number
}

interface PaymentResult {
  success: boolean
  amount?: string
  payer?: string
  error?: string
}

/**
 * x402 Client for AI Agents
 * 
 * Handles payment flow for autonomous agents purchasing compute/resources.
 * Based on circle-titanoboa-sdk patterns: https://github.com/vyperlang/circle-titanoboa-sdk
 */
export class X402Client {
  private signerAddress: string
  private privateKey: string

  constructor(signerAddress: string, privateKey: string) {
    this.signerAddress = signerAddress
    this.privateKey = privateKey
  }

  /**
   * Check if a resource accepts payments
   */
  async supports(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/api/x402/requirements/inference`)
      return response.data.accepts?.some((a: any) => a.chainId === ARC_CHAIN_ID) ?? false
    } catch {
      return false
    }
  }

  /**
   * Get payment requirements for a resource
   */
  async getRequirements(path: string): Promise<PaymentRequirement | null> {
    try {
      const response = await axios.get(`${API_URL}/api/x402/requirements${path}`)
      return response.data.requirement
    } catch {
      return null
    }
  }

  /**
   * Pay for a resource with x402 protocol
   */
  async pay(
    url: string,
    path: string,
    amount: string
  ): Promise<PaymentResult> {
    try {
      // 1. Get payment requirements
      const requirements = await this.getRequirements(path)
      if (!requirements) {
        return { success: false, error: 'Failed to get requirements' }
      }

      // 2. Create EIP-712 payment authorization
      const authorization = await this.createPaymentAuthorization(
        requirements,
        amount
      )

      // 3. Make request with payment header
      const response = await axios.post(`${API_URL}${path}`, {
        // request body
      }, {
        headers: {
          'PAYMENT-SIGNATURE': authorization,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 402) {
        return {
          success: false,
          error: 'Payment required',
          amount: response.data.price,
        }
      }

      return {
        success: true,
        amount: response.headers['payment-response'] ? 
          JSON.parse(response.headers['payment-response']).amount : 
          amount,
        payer: this.signerAddress,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      }
    }
  }

  /**
   * Create EIP-712 payment authorization signature
   */
  private async createPaymentAuthorization(
    requirements: PaymentRequirement,
    amount: string
  ): Promise<string> {
    const domain = {
      name: 'Pulse x402',
      version: '1',
      chainId: ARC_CHAIN_ID,
      verifyingContract: requirements.verifyingContract,
    }

    const types = {
      PaymentAuthorization: [
        { name: 'scheme', type: 'string' },
        { name: 'domain', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'maxAmount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    }

    const message = {
      scheme: 'EVM',
      domain: GATEWAY_DOMAIN,
      verifyingContract: requirements.verifyingContract,
      maxAmount: this.parseAmount(amount),
      fee: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    }

    // Sign using local key (in production, use proper EIP-712 signing)
    const signature = await this.signTypedData(domain, types, message)

    // Format as x402 header
    const payload = JSON.stringify({
      ...message,
      payer: this.signerAddress,
      signature,
    })

    return `x402:2:${Buffer.from(payload).toString('base64')}`
  }

  /**
   * Sign typed data (EIP-712)
   * In production, use proper wallet signing
   */
  private async signTypedData(
    domain: any,
    types: any,
    message: any
  ): Promise<string> {
    // Simplified signing for demo
    // In production: use @circle-fin/developer-controlled-wallets or ethers.js
    const { ethers } = await import('ethers')
    
    const signer = new ethers.Wallet(this.privateKey)
    const signature = await signer.signMessage(
      JSON.stringify({ domain, types, message })
    )
    
    return signature
  }

  /**
   * Parse amount string to uint256 (USDC = 6 decimals)
   */
  private parseAmount(amount: string): string {
    const [whole, fraction = ''] = amount.split('.')
    const padded = fraction.padEnd(6, '0').slice(0, 6)
    return (BigInt(whole) * 1000000n + BigInt(padded)).toString()
  }

  /**
   * Get Gateway balance
   */
  async getBalance(): Promise<{ balance: string; currency: string }> {
    try {
      const response = await axios.get(
        `${API_URL}/api/gateway/balance/${this.signerAddress}`
      )
      return {
        balance: response.data.balance,
        currency: response.data.currency,
      }
    } catch {
      return { balance: '0', currency: 'USDC' }
    }
  }
}

/**
 * Create a payment stream for recurring compute
 */
export async function createPaymentStream(
  workerWallet: string,
  sessionId: string,
  amountPerInterval: string = '0.009',
  intervalSeconds: number = 30
): Promise<{ streamId: string; status: string }> {
  const response = await axios.post(`${API_URL}/api/x402/init`, {
    worker_wallet: workerWallet,
    session_id: sessionId,
    amount_per_interval: amountPerInterval,
    interval_seconds: intervalSeconds,
  })

  return response.data
}

/**
 * Pause a payment stream
 */
export async function pausePaymentStream(streamId: string): Promise<{ status: string }> {
  const response = await axios.post(`${API_URL}/api/x402/stream/${streamId}/pause`)
  return response.data
}

/**
 * Resume a payment stream
 */
export async function resumePaymentStream(streamId: string): Promise<{ status: string }> {
  const response = await axios.post(`${API_URL}/api/x402/stream/${streamId}/resume`)
  return response.data
}

/**
 * Get stream status
 */
export async function getStreamStatus(streamId: string): Promise<any> {
  const response = await axios.get(`${API_URL}/api/x402/stream/${streamId}`)
  return response.data
}

/**
 * Example: AI Agent paying for compute
 */
export async function exampleAgentPayment() {
  const client = new X402Client(
    '0xAgentAddress...',
    '0xPrivateKey...'
  )

  // Check if service accepts payments
  const supported = await client.supports('https://api.pulse.ai/inference')
  console.log('Service supports payments:', supported)

  // Get balance
  const balance = await client.getBalance()
  console.log('Gateway balance:', balance)

  // Pay for inference
  const result = await client.pay(
    'https://api.pulse.ai/inference',
    '/api/inference',
    '0.009'
  )

  console.log('Payment result:', result)
}