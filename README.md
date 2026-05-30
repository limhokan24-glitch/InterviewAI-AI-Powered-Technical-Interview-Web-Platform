# InterviewAI — Frontend

The web client for **InterviewAI**, an AI-powered technical interview platform. This
repository contains the **frontend only** (Student A scope: Frontend UI, Coding Editor,
Dashboard). The backend, AI integration, and code-execution sandbox are owned by other
team members and plug into the service layer described below.

> Built with **React 18 + TypeScript + Vite**, **Tailwind CSS v4**, **Monaco Editor**,
> **Recharts**, **React Router**, and **Zustand**.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

The app runs **fully standalone** out of the box — it serves mock data and a simulated
WebSocket (`VITE_USE_MOCKS=true`). No backend required to develop or demo the UI.

Other scripts:

```bash
npm run build      # type-check + production build → dist/
npm run preview    # preview the production build
npm run typecheck  # tsc, no emit
```

### Demo login

Any email/password works. Use an address containing **`interviewer`** to sign in as an
interviewer; anything else signs in as a candidate.

---

## Architecture

Clean, **feature-based** structure. UI never talks to the network directly — it goes
through a single **service layer**, so swapping mocks for the real backend is a config flip.

```
src/
├── components/
│   ├── ui/            # Reusable primitives (Button, Card, Input, Tabs, Badge…)
│   ├── layout/        # AppLayout (sidebar + topbar shell)
│   └── StatCard.tsx
├── features/          # One folder per feature, self-contained
│   ├── auth/          # Zustand store, login/register, ProtectedRoute
│   ├── dashboard/     # Stats, charts, live activity feed
│   ├── analytics/     # Score distribution, language usage, trends
│   └── interview/     # Room: ProblemPanel · CodeEditor · AIChat · Evaluation
├── services/          # ← the boundary with the backend
│   ├── types.ts       # Shared domain types (the API contract)
│   ├── config.ts      # USE_MOCKS flag + endpoint URLs
│   ├── api.ts         # REST surface (mock-backed today)
│   ├── realtime.ts    # WebSocket client (simulated today)
│   └── mock/data.ts   # Seed data for standalone mode
├── lib/               # cn(), useAsync(), formatters
└── App.tsx            # Routes (lazy-loaded heavy pages)
```

### Required features — where they live

| Requirement                | Location |
|----------------------------|----------|
| Auth, roles, protected routes | `features/auth/*` |
| Streaming AI chat + history | `features/interview/AIChat.tsx`, `services/api.ts → streamAIReply` |
| In-browser code editor + run + autosave | `features/interview/CodeEditor.tsx` |
| Interview rooms / sessions | `features/interview/InterviewRoomPage.tsx`, `InterviewListPage.tsx` |
| Reconnect / WebSocket handling | `services/realtime.ts`, `features/interview/useRealtime.ts` |
| Analytics dashboard + charts | `features/dashboard/*`, `features/analytics/*` |
| Error handling | per-call try/catch + `useAsync` error state + reconnect badge |
| Performance (code-splitting) | `App.tsx` lazy routes |

---

## Connecting the real backend

The frontend is written against an abstract contract. To go live:

1. Set in `.env`:
   ```
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=https://your-api/api
   VITE_WS_URL=wss://your-api/ws
   ```
2. Each function in [`src/services/api.ts`](src/services/api.ts) already contains the
   `http(...)` call to the real endpoint (commented with the route above it). With
   `USE_MOCKS=false` those branches run automatically — **no UI changes needed.**

### REST contract (expected by the frontend)

| Method | Route | Returns |
|--------|-------|---------|
| POST | `/auth/login` | `User` |
| POST | `/auth/register` | `User` |
| GET  | `/problems/:id` | `Problem` |
| GET  | `/sessions` | `InterviewSession[]` |
| GET  | `/sessions/:id` | `InterviewSession` |
| POST | `/sessions` | `InterviewSession` |
| GET  | `/sessions/:id/messages` | `ChatMessage[]` |
| POST | `/sessions/:id/chat` | streamed AI tokens (SSE / chunked) |
| POST | `/sessions/:id/run` | `CodeRunResult` |
| PATCH | `/sessions/:id/code` | `204` (autosave) |
| POST | `/sessions/:id/evaluate` | `Evaluation` |
| GET  | `/analytics/stats` · `/timeseries` · `/score-distribution` · `/languages` · `/activity` | analytics payloads |

All payload shapes are defined in [`src/services/types.ts`](src/services/types.ts).

### WebSocket contract

Connect to `WS_URL?session=<id>`. Messages are JSON `WsEvent` objects
(`code:update`, `presence:join/leave`, `session:status`, `activity`). The client handles
reconnection with exponential backoff — see [`src/services/realtime.ts`](src/services/realtime.ts).

---

## Notes for the team

- **Code execution** is mocked in `api.runCode`. The backend/sandbox owner should
  implement `POST /sessions/:id/run` returning `CodeRunResult` (stdout, tests passed,
  runtime). The editor UI already renders that shape.
- **AI integration** is mocked in `api.streamAIReply`. The AI owner should stream tokens
  from `POST /sessions/:id/chat`; the chat UI consumes an async token stream.
- The **“Drop” button** in the interview room intentionally simulates a dropped
  connection to demonstrate the reconnect/error-handling path.
