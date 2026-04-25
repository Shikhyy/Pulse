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
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'darkMode': true,
      'primaryColor': '#10b981',
      'edgeLabelBackground': '#1e293b',
      'tertiaryColor': '#334155'
    },
    ' flowchart': {
      'curve': 'basis',
      'padding': 20
    }
  }
}%%
flowchart LR
    subgraph Employer_Side["👔 Employer"]
        direction TB
        E1["💰 Wallet\nFunds account"]
        E2["📊 Dashboard\nViews work"]
        E3["⛔ Budget Cap\nSets limits"]
    end
    
    subgraph Freelancer_Side["👷 Freelancer"]
        direction TB
        F1["🔔 Session\nClock in"]
        F2["📡 Pinger\nSends pings"]
        F3["🏦 Wallet\nReceives USDC"]
    end
    
    subgraph Pulse_Engine["⚡ Pulse"]
        P1["✓ Verify\nEIP-712 sig"]
        P2["💳 Circle\nTransfer"]
    end
    
    subgraph Arc_Chain["🔗 Arc Testnet"]
        A["⛽ USDC\nOn-chain"]
    end
    
    F1 --> F2
    F2 ==Ping ($0.009)==> P1
    P1 -->|Check| E3
    E3 -->|OK| P2
    P2 ==Transfer==> A
    A ==To freelancer==> F3
    
    classDef employer fill:#1e3a5f,stroke:#3b82f6,color:#fff,stroke-width:2px
    classDef freelancer fill:#1e3a5f,stroke:#f97316,color:#fff,stroke-width:2px
    classDef engine fill:#1e293b,stroke:#10b981,color:#fff,stroke-width:2px
    classDef chain fill:#064e3b,stroke:#10b981,color:#10b981,stroke-width:3px
    
    class Employer_Side employer
    class Freelancer_Side freelancer
    class Pulse_Engine engine
    class Arc_Chain chain
```

### Session State Machine

```mermaid
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'darkMode': true
    }
  }
}%%
stateDiagram-v2
    [*] --> Idle: Not working
    
    Idle --> ClockIn: 👆 Clock in
    ClockIn --> Working: 🟢 Session active
    Working --> Working: 📡 Ping ($0.009)
    Working --> Pause: ☕ Break
    Pause --> Working: ▶ Resume
    Working --> ClockOut: ⏹ Clock out
    ClockOut --> Idle: 💤 Done
    
    note right of Working
        Pings every ~30 seconds
        Each ping = $0.009 USDC
        ~120 pings per hour
    end note
    
    classDef idle fill:#1e293b,stroke:#64748b,color:#fff
    classDef active fill:#064e3b,stroke:#10b981,color:#fff,stroke-width:2px
    classDef paused fill:#451a03,stroke:#f97316,color:#fff
    
    class ClockIn,Working active
    class Pause paused
    class ClockOut,Idle idle
```

### Sequence Diagram

```mermaid
%%{
  init: {
    'theme': 'dark'
  }
}%%
sequenceDiagram
    participant E as 👔 Employer
    participant P as ⚡ Pulse API
    participant C as 💳 Circle
    participant A as 🔗 Arc
    
    Note over E: Funds wallet with USDC
    
    E->>P: Start session for freelancer
    P->>P: Verify employer auth
    
    rect rgb(6, 78, 59)
        Note over P,A: Worker is pinging every 30s
        loop Every 30 seconds
            P->>P: Verify EIP-712 signature
            P->>P: Check budget remaining
            P->>C: Initiate transfer
            C->>A: Submit transaction
            A-->>C: Confirm on-chain
            C-->>P: Transfer complete
            P-->>E: 💰 $0.009 transferred
        end
    end rect
    
    E->>P: End session
    P->>P: Final settlement
    P-->>E: 📊 Session summary
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

## 📜 License

MIT License

Copyright (c) 2026 Pulse

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.