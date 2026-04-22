# Pulse 
> **AI Hackathon: Nanopayments on Arc** — *Autonomous payroll engine utilizing Circle Nanopayments. Stop paying by the hour. Pay by the second.*

Pulse is a fully decentralized, multi-agent AI system designed to route autonomous, fraction-of-a-cent micropayments to workers across the globe through the Circle Arc Testnet. 

By eliminating the rigid 30¢ floor of traditional Web2 gateways like Stripe, Pulse enables business models that previously couldn't exist: paying a contractor exactly `$0.009` every 30 seconds for their active labor, with 100% on-chain finality and zero transfer fees.

![Pulse Framework Schematic](https://img.shields.io/badge/Blockchain-Circle_Arc_Testnet-teal?style=for-the-badge) ![USDC](https://img.shields.io/badge/Settlement-USDC-blue?style=for-the-badge)

---

## ⚙️ Core Architecture

Pulse operates as an autonomous multi-agent swarm, leveraging high-frequency telemetry to enable real-time payroll.

### 🧠 The Swarm
- **Activity Agent**: Resides in the worker's browser. It captures cryptographic "proof of work" every 30 seconds, signing EIP-712 sessions that are streamed via WebSockets.
- **Budget Guard Agent**: Monitors employer liquidity and daily constraints. It acts as a real-time circuit breaker, ensuring no payment is dispatched if budget caps are breached or if worker idleness is detected.
- **Payment Engine**: Orchestrates the Circle Arc Testnet. It natively dispatches USDC nanopayments ($0.009) directly into worker wallets with sub-cent precision and zero gas overhead.

---

## 🚀 Technology Stack

- **Frontend**: Next.js 15 (Turbopack), Tailwind CSS, Framer Motion, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Drizzle ORM
- **Database**: SQLite (Local persistence for agent telemetry)
- **Blockchain**: Circle Developer & Smart Contract Platform (Arc Testnet)
- **Payments**: Circle Programmable Wallets + Nanopayments API
- **Security**: EIP-712 Session Signing, JWT Authentication

---

## 🛠 Hackathon Integration Requirements
This repository maps entirely to the LabLab.ai submission criteria:

- **Circle Nanopayments API:** We execute high-frequency `dispatchNanopayment` triggers handling fractions of a cent ($0.009). Over traditional rails, this 30-sec loop would incur thousands of dollars in Stripe fees per worker shift. Here, gas cost is $0.
- **Developer-Controlled Wallets:** Employees log in frictionlessly via pure Email/Password. Pulse programmatically provisions frictionless Web3 sub-wallets via Native API hooks abstracting away seed phrases entirely.
- **Arc Testnet Finality:** Both the Employer funding mechanism and the worker micro-sessions are forcibly routed exclusively into the `ARC-TESTNET` via our execution hooks.
- **Stable USDC Peg:** The entire framework's mathematics settle specifically into digital dollars (`USDC`), removing volatility from the employment equation.

---

## 🚀 Installation & Local Environment

### 1. Prerequisites
Ensure you have `Node.js` installed and `bash` availability.
Ensure your Circle Developer Console has an active **API Key** and **Entity Secret**.

### 2. Environment Configuration
Create a `.env` in the root operating directory:
```env
CIRCLE_API_KEY="your_api_key"
CIRCLE_ENTITY_SECRET="your_entity_secret"

# Turn off stub testing to hit live Arc nodes
STUB_MODE=false 
```

### 3. Install & Bootstrap
Install dependencies across both environments and provision your Developer-Controlled Wallets natively using our headless script.
```bash
npm install
cd frontend && npm install && cd ..
npm run bootstrap
```
*Note: Make sure to fund your newly generated Employer wallet ID via the [Circle Arc Faucet](https://faucet.circle.com) before proceeding.*

### 4. Running the Main Node Loop
Pulse spins up both the Drizzle SQLite backend (with WebSockets) and the NextJS frontend via `concurrently`.
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 🎬 Generating Telemetry (The Demo)
To generate the 50+ on-chain transaction logs required to demonstrate scale:
We wrote a strictly autonomous multi-agent simulation file. It will hit live endpoints, register 1 Employer, provision 5 Workers, clock them all in, and fire a headless 30-second budget logic loop exactly replicating production constraints.

```bash
npm run demo:fast
```
The script will actively push micro-payments to your live Dashboard. Watch your Pulse frontend roll up numbers in real-time as the ledger updates.

---

*Built for the **LabLab.ai Nano Payments on Arc** Hackathon.*
