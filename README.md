# MyCompanionAvatar

An AI companion avatar platform built with **React 19, Vite, Tailwind CSS, Hono, tRPC, Drizzle ORM, and MySQL** — architected for both **Web** and **Mobile (iOS & Android)**.

## Tech Stack

- **Web Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS, shadcn/ui, React Router 7, TanStack Query + tRPC
- **Backend API:** Hono + tRPC v11 (`api/`) with dual Cookie + Bearer JWT authentication (web & mobile ready)
- **Database:** MySQL 8 + Drizzle ORM (`db/schema.ts`, `db/relations.ts`)
- **Validation & Contracts:** Shared Zod & TypeScript contracts (`contracts/`)

## Quick Start

### 1. Environment Setup
```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and OPENAI_API_KEY
```

### 2. Start Local MySQL
```bash
docker compose up -d
```

### 3. Push Schema & Seed Data
```bash
npm install
npm run db:push
npx tsx db/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite + Hono API dev server on port 3000 |
| `npm run check` | Run strict TypeScript project typecheck (`tsc -b`) |
| `npm run lint` | Run ESLint across frontend, API, and contracts |
| `npm test` | Run Vitest unit tests |
| `npm run build` | Build production web bundle + Node ESM API server |
| `npm start` | Start production server (`dist/boot.js`) |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:migrate` | Apply Drizzle SQL migrations |

## Production & Mobile Roadmap

- [x] Rebranded to **MyCompanionAvatar**
- [x] Dual Cookie + `Authorization: Bearer` JWT auth (mobile-ready)
- [x] Atomic credit deduction with automatic refund on AI failure
- [x] Health check (`/api/health`), CORS, security headers, and rate limiting
- [x] Responsive desktop sidebar + mobile bottom navigation
- [x] Account deletion endpoint (App Store / Google Play / GDPR compliance)
- [ ] S3 / Cloudflare R2 presigned avatar & generated image uploads
- [ ] Streaming LLM responses (SSE) + Replicate image generation worker
- [ ] Web payments (Stripe / Paystack) + Mobile IAP (RevenueCat)
- [ ] Mobile app (`apps/mobile` via Expo / React Native or Capacitor)
