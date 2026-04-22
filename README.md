# Pulse 
> **AI Hackathon: Nanopayments on Arc** — *Autonomous payroll engine utilizing Circle Nanopayments. Stop paying by the hour. Pay by the second.*

Pulse is a fully decentralized, multi-agent AI system designed to route autonomous, fraction-of-a-cent micropayments to workers across the globe through the Circle Arc Testnet. 

By eliminating the rigid 30¢ floor of traditional Web2 gateways like Stripe, Pulse enables business models that previously couldn't exist: paying a contractor exactly `$0.009` every 30 seconds for their active labor, with 100% on-chain finality and zero transfer fees.

![Pulse Framework Schematic](https://img.shields.io/badge/Blockchain-Circle_Arc_Testnet-teal?style=for-the-badge) ![USDC](https://img.shields.io/badge/Settlement-USDC-blue?style=for-the-badge)

---

## ⚙️ Core Architecture

The system utilizes an autonomous 3-agent swarm operating across a Node.js backend and a Next.js `Turbopack` frontend:
1. **Activity Agent** (Frontend session layer): Operates a secure crypto-clock running a `setInterval(30_000)`. It transmits EIP-712 hashed micrologs directly down a Socket.io stream.
2. **Budget Guard Agent** (Middleware logic): A strict AI-constraint checker that validates an employer's `daily_cap` and isolates "idle worker" timeouts to instantly freeze financial streams.
3. **Payment Engine** (Circle layer): Utilizes `@circle-fin/developer-controlled-wallets` to dispatch synchronous, fully deterministic `$0.009` USDC payments from an Employer Master Wallet to independent, programmatically-generated User Wallets.

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
