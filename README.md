# ⚡ Pulse — Real-Time Payroll for Freelancers

<p align="center">
  <a href="https://testnet.arcscan.app/address/0x6a8bf2d11ce41f29dd7b102adb4bc42748f5acf9">
    <img src="https://img.shields.io/badge/Arc-Testnet-5042002-teal?style=for-the-badge&logo=Ethereum" />
  </a>
  <img src="https://img.shields.io/badge/Payments-Circle_Nanopayments-purple?style=for-the-badge" />
  <a href="https://github.com/Shikhyy/Pulse">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
  </a>
  <img src="https://img.shields.io/badge/Framework-Next.js_15-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Backend-Node.js_22-blue?style=for-the-badge&logo=node.js" />
</p>

---

<p align="center">
  <b>Pay freelancers per second of work using Circle Nanopayments on Arc Testnet.</b><br />
  No minimums. No waiting. Real-time.
</p>

---

## 🎯 The Problem

Traditional payment rails have a **$0.30 minimum** per transaction. This breaks freelancer payments:

| Payment Method | Minimum | Can Pay $2 Task? |
|:------------|:-------:|:-------------:|
| Stripe | $0.30 | ❌ No |
| PayPal | $0.30 | ❌ No |
| Bank Wire | $25.00 | ❌ No |
| **Pulse** | **$0.009** | ✅ Yes |

**Also:** Freelancers wait 30 days to get paid. Employers ghost. Small tasks can't be economically paid.

---

## 💡 The Solution

**Pulse** enables per-second payments at **$0.009 per ping** (~30 seconds of work):

```
Freelancer clocks in → Pings while working → Gets paid instantly → Clocks out
```

Each ping = immediate USDC transfer to freelancer's wallet on Arc.

### Payment Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true}}}%%
flowchart LR
    subgraph Employer
        E1[💰 Wallet]
        E2[📊 Dashboard]
        E3[⛔ Budget Cap]
    end
    
    subgraph Freelancer
        F1[🔔 Session]
        F2[📡 Pinger]
        F3[🏦 Wallet]
    end
    
    subgraph Pulse
        P1[✓ Verify Signature]
        P2[💳 Circle Transfer]
    end
    
    subgraph Arc
        A[🔗 USDC on Chain]
    end
    
    F1 -->|Start| F2
    F2 -->|Ping| P1
    P1 --> E3
    E3 -->|Check| P2
    P2 -->|Transfer| A
    A -->|To| F3
    
    style E1 fill:#1e3a5f,color:#fff
    style E2 fill:#1e3a5f,color:#fff
    style E3 fill:#f97316,color:#fff
    style F1 fill:#1e3a5f,color:#fff
    style F2 fill:#1e3a5f,color:#fff
    style F3 fill:#1e3a5f,color:#fff
    style P1 fill:#334155,color:#fff
    style P2 fill:#334155,color:#fff
    style A fill:#10b981,color:#fff
```

### Session State

```mermaid
%%{init: {'theme': 'dark'}}%%
stateDiagram-v2
    [*] --> Idle
    Idle --> ClockIn: Clock in
    ClockIn --> Working: Pinging
    Working --> Working: Every 30s = $0.009
    Working --> Pause: Take break
    Pause --> Working: Resume
    Working --> ClockOut: Clock out
    ClockOut --> Idle
    
    style Idle fill:#1e293b,color:#fff
    style ClockIn fill:#10b981,color:#fff
    style Working fill:#10b981,color:#fff
    style Pause fill:#f97316,color:#fff
    style ClockOut fill:#64748b,color:#fff
```

---

## 📊 Unit Economics

| Work Time | Pings | Amount Paid |
|:---------|:-----:|:---------:|
| 30 seconds | 1 | $0.009 |
| 1 hour | 120 | $1.08 |
| 8 hours | 960 | $8.64 |
| 20 days | 19,200 | $172.80 |

**Savings:** 97% cheaper than Stripe/PayPal ($0.30 min)

---

## 🛠️ Tech Stack

### Frontend
<p>
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=flat&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Framer_Motion-000000?style=flat&logo=framer" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat&logo=typescript" />
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Node.js_22-339933?style=flat&logo=node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io" />
  <img src="https://img.shields.io/badge/SQLite-003545?style=flat&logo=sqlite" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-ffffff?style=flat" />
</p>

### Blockchain & Payments
<p>
  <img src="https://img.shields.io/badge/Arc_Testnet-14b8a6?style=flat" />
  <img src="https://img.shields.io/badge/Circle_Nanopayments-8b5cf6?style=flat" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285f4?style=flat&logo=google" />
</p>

| Layer | Technology |
|:------|:----------|
| **Frontend** | Next.js 15, Tailwind CSS, Framer Motion |
| **Backend** | Node.js 22, Express, Socket.io |
| **Database** | SQLite + Drizzle ORM |
| **Blockchain** | Arc Testnet (Chain ID: 5042002) |
| **Payments** | Circle Nanopayments |
| **Wallet** | Circle Developer-Controlled |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Shikhyy/Pulse.git
cd Pulse
npm install
cd frontend && npm install && cd ..
```

### 2. Configure
```bash
cp .env.example .env.local
# Add Circle keys, or use STUB_MODE=true for demo
```

### 3. Run
```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001

---

## 🔗 Important Links

| Resource | URL |
|:--------|:---|
| Arc RPC | `https://rpc.testnet.arc.network` |
| Arc Explorer | https://testnet.arcscan.app |
| Circle Console | https://console.circle.com |
| USDC (Arc) | `0x3600000000000000000000000000000000000000` |

---

## 📡 API Reference

| Endpoint | Method | Description |
|:---------|:------:|:-----------|
| `/api/auth/signup/worker` | POST | Freelancer signup |
| `/api/auth/signup/employer` | POST | Employer signup |
| `/api/auth/login` | POST | Login |
| `/api/sessions/start` | POST | Clock in |
| `/api/sessions/end` | POST | Clock out |
| `/api/ping` | POST | Submit work proof |
| `/api/employer/dashboard` | GET | View freelancers |

---

## 📁 Project Structure

```
pulse/
├── server/           # Backend API (Node.js + Express)
│   ├── routes/      # API routes
│   ├── agents/    # Business logic
│   └── db/        # SQLite + Drizzle
├── frontend/        # Next.js 15 app
├── scripts/        # Demo & bootstrap
└── contracts/     # Smart contracts (optional)
```

---

## 🔐 Security

- **EIP-712 Signatures** — Cryptographic proof of work
- **JWT Authentication** — Secure sessions
- **Budget Guards** — Daily spending caps
- **Idempotency Keys** — Prevent duplicate payments
- **Circle MPC Wallets** — No private key exposure

---

## 👏 Acknowledgments

<p align="center">
  <a href="https://circle.com">
    <img src="https://img.shields.io/badge/Circle-Nanopayments-purple?style=for-the-badge" />
  </a>
  <a href="https://arc.network">
    <img src="https://img.shields.io/badge/Arc-Network-teal?style=for-the-badge" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs" />
  </a>
</p>

---

<p align="center">
  <b>Built for freelancers — because waiting 30 days for payment is broken.</b>
</p>