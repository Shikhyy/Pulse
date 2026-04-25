# Pulse Deployment Guide

## Quick Deploy

### Frontend Only (Vercel)

```bash
cd frontend
vercel deploy --prod
```

Or connect your GitHub repo to Vercel for automatic deploys.

### Full Stack (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init
railway add

# Deploy
railway up
```

## Environment Variables

Copy `.env.example` and fill in your values:

| Variable | Description | Required |
|---------|-------------|----------|
| `CIRCLE_API_KEY` | Circle API key | Yes (live) |
| `CIRCLE_ENTITY_SECRET` | Circle entity secret | Yes (live) |
| `GEMINI_API_KEY` | Google Gemini API | No |
| `STUB_MODE` | Use mock payments | No |

## Production Checklist

- [ ] Set `JWT_SECRET` to a secure random string
- [ ] Configure Circle API keys for live payments
- [ ] Update `NEXT_PUBLIC_API_URL` to production URL
- [ ] Set `STUB_MODE=false`

## Architecture

```
┌─────────────┐     Railway / Vercel
│   Frontend   │ ──────────┐
│  (Next.js)  │           │
└─────────────┘           ▼
                  ┌─────────────┐
                  │  Backend    │
                  │  (Express)  │
                  └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Arc Testnet │
                  │ (Payments)  │
                  └─────────────┘
```