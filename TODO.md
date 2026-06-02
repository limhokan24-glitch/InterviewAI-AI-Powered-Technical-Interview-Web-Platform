# InterviewAI — TODO (pick up here tomorrow)

Status as of today: **frontend + backend are feature-complete**, including all bonus
features (Redis cache, queue workers, Docker, load balancing, CI/CD, cheating
detection, collaborative editing). The full Docker stack was tested and works.

What's left is mostly **housekeeping + submission deliverables** (deploy, report, video).

---

## 🔴 FIRST THING TOMORROW — housekeeping (~10 min)

1. **The Docker stack may still be running.** Stop it:
   ```powershell
   cd c:\interviewAI
   docker compose down
   ```

2. **Go back to your normal dev setup** (two terminals):
   ```powershell
   # Terminal A
   cd c:\interviewAI\backend
   npm run dev
   # Terminal B
   cd c:\interviewAI
   npm run dev
   ```
   App at http://localhost:5173 (uses your real Groq AI + local SQLite data).

3. **Commit & push yesterday's uncommitted fixes** (cookie Secure flag, LB shared
   zone, /health instance id — real bug fixes found during Docker testing):
   ```powershell
   git add -A
   git commit -m "Fix cookie Secure flag for HTTP, LB shared zone, health instance id"
   git push
   ```

4. **Security: revoke the exposed Gemini key.** It was pasted in chat, so delete it
   at https://aistudio.google.com/apikey (you're using Groq now, so it's unused).

---

## 🟠 REQUIRED FOR SUBMISSION (the big remaining work)

### 1. Deploy publicly — the brief REQUIRES a public website URL
The app currently only runs on localhost. You need it live on the internet.
- **Frontend** → Vercel or Netlify (free). Connect the GitHub repo, set build env:
  `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=https://<your-api>/api`, `VITE_WS_URL=wss://<your-api>/ws`
- **Backend** → Railway or Render (free tier). Add a managed **Postgres** and **Redis**.
  Set env: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`,
  `CLIENT_ORIGIN=https://<your-frontend>`, `COOKIE_SECURE=true` (HTTPS in prod).
  Remember: the Prisma schema is SQLite locally — for Postgres in prod, either deploy
  via the Docker image (it swaps to postgresql automatically) or change the provider.
- Test login/chat/run on the live URL once deployed.

### 2. Write the PDF report — `YourFullName_InterviewAI_Report.pdf`
The brief requires these sections:
1. Cover Page
2. Team Member Information
3. Project Overview
4. Features Implemented
5. System Architecture Diagram  (frontend → LB → backend ×2 → Postgres/Redis + worker)
6. Database Design  (see `backend/prisma/schema.prisma` — 6 tables)
7. UI Screenshots  (login, dashboards, interview room, analytics)
8. API Documentation  (see `backend/README.md` — full endpoint table)
9. Engineering Challenges  (e.g. cookie-Secure-over-HTTP bug, LB worker-zone skew, AI provider fallbacks)
10. Performance Optimization  (code-splitting, Redis caching, queue workers)
11. Testing & Edge Cases  (22/22 endpoint test, error handling, reconnect)
12. Public GitHub Repo Link  ✅ have it
13. Public Website URL  ← from step 1
14. Public Demo Video Link  ← from step 3 below
15. Individual Contribution Report

### 3. Record a demo video (public link)
Screen-record a walkthrough: register → dashboard → interview room (code + AI chat +
run + evaluate) → analytics. Upload to YouTube (unlisted) or Drive (public link).

---

## 🟡 TEAM REQUIREMENT
The brief requires **commit history from all students**. Right now every commit is
yours. Make sure your teammates push their own commits to this repo, or you lose marks
on that criterion. (Add them as collaborators if not done: repo Settings → Collaborators.)

---

## 🟢 OPTIONAL POLISH (only if time)
- Pass `GROQ_API_KEY` into `docker-compose.yml` so the Docker/prod stack uses real AI.
- Add more problems to the seed bank (`backend/prisma/seed.ts`).
- Real multi-language code execution (currently JS/TS execute for real; others simulated).
- Wire a real per-problem test harness for `/run`.

---

## Quick reference
- **Frontend**: Vite + React + TS + Tailwind. Run: `npm run dev` (root).
- **Backend**: Express + Prisma + WS + JWT + Groq AI. Run: `cd backend && npm run dev`.
- **Full stack (Docker)**: `docker compose up --build` → http://localhost:5173
- **Reset interview data**: `cd backend && npm run db:reset`
- **View database**: `cd backend && npm run db:studio` → http://localhost:5555
- **Demo logins** (password `password123`): `interviewer@interviewai.dev`, `candidate@interviewai.dev`
- **Repo**: https://github.com/limhokan24-glitch/InterviewAI-AI-Powered-Technical-Interview-Web-Platform
