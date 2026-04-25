# Pulse — Autonomous Agent Compute Network

Real-time USDC payroll for AI agent compute on Arc Testnet, powered by Circle Nanopayments.

## The Problem

Traditional payment rails like Stripe have a ~$0.30 minimum per transaction. This makes it economically impossible to pay for:
- Individual AI inferences ($0.001-0.01 each)
- Per-second compute time
- Micro-tasks in agent workflows

## The Solution

Pulse uses **Circle Nanopayments** to enable true fractional micropayments at **$0.009 per ping** on **Arc Testnet**. Workers receive continuous payments for compute time, not lump sums.

### How It Works

1. **Employer** funds their wallet with USDC on Arc
2. **Worker** runs an AI agent and sends proof-of-work pings every ~30 seconds
3. **PaymentEngine** verifies the signature and routes a nanopayment
4. **Arc** settles on-chain in USDC

### Payment Flow

```
Worker (Activity Agent) → Signs EIP-712 proof → Budget Guard (checks cap) → 
PaymentEngine (Circle transfer) → Arc Testnet (USDC settle)
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Blockchain | Arc Testnet (Chain ID: 5042002) |
| Payments | Circle Developer-Controlled Wallets |
| Protocol | x402 (Web Native Payments) |
| Backend | Node.js + Express + Socket.io |
| Database | SQLite (Drizzle ORM) |
| Frontend | Next.js 15 |
| AI | Gemini 2.0 Flash |

## Architecture

### Circle Integration

- **Wallet**: `0x6a8bf2d11ce41f29dd7b102adb4bc42748f5acf9` (employer)
- **USDC**: `0x3600000000000000000000000000000000000000` (native on Arc)
- **RPC**: `https://rpc.testnet.arc.network`

### Payment Calculation

- **$0.009 per ping** × 120 pings/hour = $1.08/hour
- 97% cheaper than traditional payment rails

## Quick Start

### Prerequisites
- Node.js 22+
- Circle API key (for real payments) or use STUB_MODE=true

### Installation

```bash
git clone https://github.com/Shikhyy/Pulse.git
cd Pulse
npm install
cd frontend && npm install && cd ..
```

### Configuration

Copy `.env.example` to `.env.local`:

```bash
# Circle Nanopayments (get from https://console.circle.com)
CIRCLE_API_KEY=your_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret

# Or use demo mode without real payments
STUB_MODE=true
```

### Run

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

## API Endpoints

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/auth/signup/worker` | POST | Register a worker |
| `/api/auth/signup/employer` | POST | Register an employer |
| `/api/auth/login` | POST | Login |
| `/api/ping` | POST | Submit proof of work |
| `/api/sessions/start` | POST | Start work session |
| `/api/sessions/end` | POST | End work session |
| `/api/employer/dashboard` | GET | Get employer metrics |

## Demo Mode

For testing without real Circle payments:

```bash
STUB_MODE=true npm run demo
```

This generates simulated pings and payments for demonstration.

## On-Chain Settlement

View transactions on [ArcScan](https://testnet.arcscan.app/address/0x6a8bf2d11ce41f29dd7b102adb4bc42748f5acf9)

## Security

- **EIP-712 Signatures**: Cryptographic proof of work
- **JWT Auth**: Session management  
- **Budget Guards**: Daily spending caps
- **Idempotency Keys**: Prevent duplicate payments

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

### Backend (Render/Railway/Render)

```bash
npm run server
# Set environment variables in your dashboard
```

## Files

```
pulse/
├── server/          # Backend API (Node.js)
├── frontend/      # Next.js app
├── scripts/       # Demo and bootstrap scripts
├── contracts/     # Smart contracts (Solidity/Vyper)
└── .env          # Configuration
```

## Resources

- [Arc Documentation](https://docs.arc.network)
- [Circle Developer Docs](https://developers.circle.com)
- [x402 Protocol](https://x402.org)

## License

MIT