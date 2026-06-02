# Deploying InterviewAI (Vercel + Render)

Deploy order matters: **backend first** (you need its URL), then **frontend**, then
connect them. ~20-30 min total.

---

## STEP 1 — Backend + Postgres on Render

1. Go to **https://render.com** → sign up / log in with GitHub.
2. **New → Blueprint** → pick your repo
   `InterviewAI-AI-Powered-Technical-Interview-Web-Platform`.
3. Render reads `render.yaml` and shows: 1 web service + 1 Postgres database.
   Click **Apply**. It builds the Docker image and creates the DB (~5-10 min first time).
4. When the service exists, open it → **Environment** → set the two secrets:
   - `GROQ_API_KEY` = your `gsk_...` key (from backend/.env)
   - `CLIENT_ORIGIN` = leave as a placeholder for now (e.g. `https://example.com`);
     you'll set the real Vercel URL in Step 3.
5. Wait for the deploy to go **Live**. Copy your backend URL — it looks like:
   `https://interviewai-backend.onrender.com`
6. Verify it's up: open `https://<your-backend>.onrender.com/health` →
   should show `{"ok":true,...}`.

> Render free tier sleeps after 15 min idle; the first request then takes ~30-60s to
> wake. Fine for a demo — just warm it up before recording.

---

## STEP 2 — Frontend on Vercel

1. Go to **https://vercel.com** → sign up / log in with GitHub.
2. **Add New → Project** → import the same repo.
3. Vercel auto-detects Vite (the `vercel.json` handles build + SPA routing).
   **Do not change** the build settings.
4. Expand **Environment Variables** and add these 3 (use your Render URL from Step 1):
   ```
   VITE_USE_MOCKS      = false
   VITE_API_BASE_URL   = https://<your-backend>.onrender.com/api
   VITE_WS_URL         = wss://<your-backend>.onrender.com/ws
   ```
5. Click **Deploy** (~1-2 min). Copy your frontend URL, e.g.
   `https://interviewai-xxxx.vercel.app`

---

## STEP 3 — Connect them (CORS / cookies)

1. Back in **Render** → backend service → **Environment** → set:
   ```
   CLIENT_ORIGIN = https://<your-frontend>.vercel.app   (your real Vercel URL, no trailing slash)
   ```
2. Save → Render redeploys (~1 min). This lets the browser send the auth cookie
   cross-domain.

---

## STEP 4 — Test the live site

1. Open your Vercel URL.
2. Log in with a seeded account: `interviewer@interviewai.dev` / `password123`.
3. Create an interview, chat with the AI, run code, evaluate. If login works and
   data loads, **you're live.** 🎉

This Vercel URL is your **"Public Website URL"** deliverable.

---

## Troubleshooting

- **Login fails / "Failed to fetch"** → `CLIENT_ORIGIN` (Render) must exactly match the
  Vercel URL, and `VITE_API_BASE_URL` (Vercel) must match the Render URL. Re-check both,
  no trailing slashes.
- **Logged out on every request** → cookie not crossing domains. Confirm `COOKIE_SECURE=true`
  is set on Render (it is, via render.yaml) and both sites are HTTPS.
- **No problems to start an interview** → the DB didn't seed. In Render, the service has
  `RUN_MIGRATIONS=true`; check the deploy logs for "Seeding database". Redeploy if needed.
- **First request very slow** → Render free tier cold start. Refresh after ~30s.
- **AI gives generic replies** → `GROQ_API_KEY` not set on Render, or rate-limited (it
  falls back gracefully).
