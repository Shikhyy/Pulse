export interface DemoMetrics {
  timestamp: string
  paymentsLast5Min: number
  paymentsLast15Min: number
  ratePerMinute: number
  ratePerSecond: number
  chartData: {
    time: string
    count: number
    volume: number
  }[]
}

export interface ProofData {
  arcTransactionCount: number
  dbPaymentCount: number
  totalPaid: string
  realtime: {
    paymentsLastHour: number
    volumeLastHour: string
    paymentsToday: number
    volumeToday: string
    paymentRatePerMinute: string
    volumeRatePerHour: string
    activeSessions: number
    uniqueWorkers: number
  }
  arcExplorerLink: string
  chainId: number
  network: string
  rpc: string
  faucet: string
  marginComparison: {
    nanopayments: { perPayment: string; feeRatio: string; minViable: string }
    stripe: { perPayment: string; feeRatio: string; minViable: string }
    savings: { at50Payments: string; at200Payments: string; at1000Payments: string }
  }
  circleProducts: string[]
  x402: {
    supported: boolean
    version: number
    endpoint: string
    pricePerRequest: string
    currency: string
    chain: string
    gatewayDomain: number
  }
  unitEconomics: {
    paymentAmount: string
    paymentInterval: string
    ratePerSecond: string
    ratePerHour: string
    ratePerDay_8h: string
    nodesInDemo: number
    paymentsIn10Min: number
    paymentsIn1Hr: number
  }
  smartContracts: {
    solidity: { name: string; network: string; chainId: number; features: string[] }
    agentIdentity: { name: string; features: string[] }
    vyper: { name: string; features: string[] }
  }
  recentTransactions: {
    id: number
    worker_id: string
    employer_id: string
    amount: number
    arc_tx_hash: string
    recorded_at: string
    worker_name: string
  }[]
}