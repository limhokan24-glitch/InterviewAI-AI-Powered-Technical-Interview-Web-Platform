# InterviewAI — Backend

REST + WebSocket API for the InterviewAI platform. Built to match the contract the
frontend already expects (see `../src/services/types.ts`), so the two connect with
zero frontend changes once `VITE_USE_MOCKS=false`.

**Stack:** Node + Express + TypeScript · Prisma + SQLite · `ws` WebSockets ·
JWT auth (httpOnly cookie) · Zod validation · optional Anthropic AI (deterministic
fallback when no API key is set).

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # defaults work out of the box
npm run db:push             # create the SQLite schema
npm run db:seed             # demo users, problems, sample sessions
npm run dev                 # http://localhost:4000
```

**Demo logins** (password `password123`):
- `interviewer@interviewai.dev` — interviewer role
- `candidate@interviewai.dev` — candidate role

### Connect the frontend
In the project root, set the frontend env and restart it:
```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

---

## Architecture

```
backend/
├── prisma/
│   ├── schema.prisma     # data model (User, Problem, Session, Message, …)
│   └── seed.ts           # demo data
└── src/
    ├── config/           # env, prisma client
    ├── lib/              # errors, JWT auth middleware, serializers
    ├── services/         # ai.ts (chat/review/eval/gen), runner.ts (code exec)
    ├── routes/           # auth, problems, sessions, analytics
    ├── realtime/ws.ts    # WebSocket server (presence, code sync, activity)
    ├── app.ts            # express wiring
    └── server.ts         # http + ws bootstrap
```

## API reference

All routes are under `/api`. Auth is via an httpOnly cookie set on login/register
(the frontend sends `credentials: "include"`). Protected routes return `401` without it.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | – | Create account, returns `User` + sets cookie |
| POST | `/auth/login` | – | Log in, returns `User` + sets cookie |
| POST | `/auth/logout` | – | Clears the cookie |
| GET  | `/auth/me` | ✓ | Current user |
| GET  | `/problems/:id` | ✓ | A problem |
| POST | `/ai/challenges` | ✓ | Generate + persist a challenge |
| GET  | `/sessions` | ✓ | List sessions |
| POST | `/sessions` | ✓ | Create a session |
| GET  | `/sessions/:id` | ✓ | A session |
| GET  | `/sessions/:id/messages` | ✓ | Chat history |
| POST | `/sessions/:id/chat` | ✓ | **Streams** the AI reply (chunked text) |
| POST | `/sessions/:id/run` | ✓ | Execute code → `CodeRunResult` |
| PATCH| `/sessions/:id/code` | ✓ | Autosave code (`204`) |
| POST | `/sessions/:id/review` | ✓ | AI code review |
| POST | `/sessions/:id/evaluate` | ✓ | Final evaluation; marks session complete |
| GET  | `/analytics/stats` · `/timeseries` · `/score-distribution` · `/languages` · `/activity` | ✓ | Dashboard data |

### WebSocket
Connect to `ws://host/ws?session=<id>`. Exchanges JSON `WsEvent` objects:
`code:update`, `presence:join`, `presence:leave`, `session:status`, `activity`.

## Notes & production TODOs
- **Code execution** runs JS/TS in a child Node process with a 5s timeout. This is
  safe enough for local/demo use, but untrusted multi-tenant execution needs real
  sandboxing (Docker/Judge0, resource limits, no network). Other languages are
  simulated until a sandbox is wired in.
- **AI**: set `ANTHROPIC_API_KEY` in `.env` to use a real model; otherwise a
  deterministic fallback keeps everything working offline.
- **Database**: SQLite for zero-config dev. For production, change the Prisma
  `provider` to `postgresql` and point `DATABASE_URL` at Postgres — no code changes.
