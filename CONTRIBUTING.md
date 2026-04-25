# Contributing to Pulse

Thank you for your interest in contributing to Pulse!

## Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Shikhyy/Pulse.git
cd Pulse

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Run the app
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

## Project Structure

```
Pulse/
├── server/           # Backend API
│   ├── routes/      # API endpoints
│   ├── agents/      # Agent system
│   └── db/         # Database
├── frontend/        # Next.js app
│   ├── app/        # Pages
│   ├── components/ # UI components
│   └── lib/        # Utilities
├── contracts/       # Smart contracts
└── docs/           # Documentation
```

## Getting Started

### Adding a New API Endpoint

1. Create route file in `server/routes/`
2. Register in `server/index.ts`
3. Add to `frontend/lib/api.ts`

### Adding a New Page

1. Create page in `frontend/app/`
2. Follow existing page patterns
3. Add loading/error states

### Code Style

- Use TypeScript
- Follow existing naming conventions
- Add proper error handling

## Testing

```bash
# Backend
npm run server

# Frontend  
cd frontend && npm run dev

# Build
npm run build
```

## Submitting Changes

1. Create a feature branch
2. Make your changes
3. Push to GitHub
4. Open a pull request

## Questions?

- Open an issue for bugs/feature requests
- Check existing issues before opening new ones

---

**Note:** This is a hackathon project. APIs and configuration may change.