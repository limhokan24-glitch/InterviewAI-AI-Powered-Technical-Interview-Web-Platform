// ─────────────────────────────────────────────────────────────────────────────
// API service — the single boundary between the UI and the backend.
//
// Every function here is mock-backed today. When the backend is ready, replace
// the body of each function with the matching `http(...)` call (the REST routes
// are written in comments above each function) and the UI keeps working as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { sleep } from "@/lib/utils";
import { config } from "./config";
import type {
  User,
  Role,
  Problem,
  InterviewSession,
  ChatMessage,
  CodeRunResult,
  Evaluation,
  CodeReview,
  Difficulty,
  ProctorEventType,
  IntegrityReport,
  DashboardStats,
  TimeseriesPoint,
  ScoreDistribution,
  LanguageUsage,
  ActivityEvent,
  Language,
} from "./types";
import { problems, sessions, seedMessages, activityFeed, challengeTemplates } from "./mock/data";

const LATENCY = 280; // simulated network latency for realism

// ── Auth token (header-based) ────────────────────────────────────────────────
// We use a Bearer token in localStorage rather than relying on cross-site
// cookies, which browsers increasingly block. The token persists across reloads.
const TOKEN_KEY = "interviewai-token";

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeader(): Record<string, string> {
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Thin fetch wrapper. Sends the Bearer token (and cookie, as a fallback). */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// In-memory mock stores (reset on reload, like a session).
const sessionStore = [...sessions];
const messageStore: Record<string, ChatMessage[]> = {};
const codeStore: Record<string, string> = {};
const generatedProblems: Record<string, Problem> = {}; // AI-generated challenges

// ── Auth ─────────────────────────────────────────────────────────────────────

// POST /auth/login
export async function login(email: string, password: string): Promise<User> {
  if (!config.USE_MOCKS) {
    const data = await http<User & { token?: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (data.token) setToken(data.token);
    return data;
  }
  await sleep(LATENCY);
  if (!email || !password) throw new Error("Email and password are required.");
  const role: Role = email.toLowerCase().includes("interviewer") ? "interviewer" : "candidate";
  return {
    id: "u_" + btoa(email).slice(0, 8),
    name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    email,
    role,
    createdAt: Date.now(),
  };
}

// POST /auth/register
export async function register(name: string, email: string, password: string, role: Role): Promise<User> {
  if (!config.USE_MOCKS) {
    const data = await http<User & { token?: string }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
    if (data.token) setToken(data.token);
    return data;
  }
  await sleep(LATENCY);
  if (!name || !email || !password) throw new Error("All fields are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  return { id: "u_" + btoa(email).slice(0, 8), name, email, role, createdAt: Date.now() };
}

// ── Problems ─────────────────────────────────────────────────────────────────

// GET /problems/:id
export async function getProblem(id: string): Promise<Problem> {
  if (!config.USE_MOCKS) return http(`/problems/${id}`);
  await sleep(LATENCY);
  const p = problems.find((x) => x.id === id) ?? generatedProblems[id];
  if (!p) throw new Error("Problem not found");
  return p;
}

// POST /ai/challenges  — AI-generated coding challenge
export async function generateChallenge(opts: { difficulty: Difficulty; topic?: string }): Promise<Problem> {
  if (!config.USE_MOCKS) return http("/ai/challenges", { method: "POST", body: JSON.stringify(opts) });
  await sleep(1100 + Math.random() * 600); // generation feels slower than a normal fetch
  const template = challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)];
  const id = "gen_" + Math.random().toString(36).slice(2, 8);
  const problem: Problem = {
    ...template,
    id,
    difficulty: opts.difficulty,
    tags: opts.topic ? [opts.topic, ...template.tags] : template.tags,
  };
  generatedProblems[id] = problem;
  return problem;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

// GET /sessions
export async function listSessions(): Promise<InterviewSession[]> {
  if (!config.USE_MOCKS) return http("/sessions");
  await sleep(LATENCY);
  return [...sessionStore].sort((a, b) => b.createdAt - a.createdAt);
}

// GET /sessions/:id
export async function getSession(id: string): Promise<InterviewSession> {
  if (!config.USE_MOCKS) return http(`/sessions/${id}`);
  await sleep(LATENCY);
  const s = sessionStore.find((x) => x.id === id);
  if (!s) throw new Error("Session not found");
  return s;
}

// POST /sessions
export async function createSession(input: {
  title: string;
  candidateName: string;
  problemId: string;
  language: Language;
}): Promise<InterviewSession> {
  if (!config.USE_MOCKS) return http("/sessions", { method: "POST", body: JSON.stringify(input) });
  await sleep(LATENCY);
  const s: InterviewSession = {
    id: "s_" + Math.random().toString(36).slice(2, 8),
    title: input.title,
    candidateName: input.candidateName,
    interviewerName: "AI Interviewer",
    problemId: input.problemId,
    status: "active",
    language: input.language,
    createdAt: Date.now(),
    startedAt: Date.now(),
  };
  sessionStore.unshift(s);
  return s;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

// GET /sessions/:id/messages
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!config.USE_MOCKS) return http(`/sessions/${sessionId}/messages`);
  await sleep(LATENCY);
  if (!messageStore[sessionId]) messageStore[sessionId] = seedMessages(sessionId);
  return [...messageStore[sessionId]];
}

function persistMessage(m: ChatMessage) {
  if (!messageStore[m.sessionId]) messageStore[m.sessionId] = seedMessages(m.sessionId);
  messageStore[m.sessionId].push(m);
}

/**
 * Reads a chunked/streamed fetch response body and yields decoded text chunks.
 * Used by the real-backend chat endpoints (which stream tokens as plain text).
 */
async function* streamFetch(path: string, body: object): AsyncGenerator<string> {
  const res = await fetch(`${config.API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) yield chunk;
  }
}

/**
 * Streams an AI reply token-by-token. Against the real backend this reads the
 * streamed body of POST /sessions/:id/chat; in mock mode it generates locally.
 */
export async function* streamAIReply(sessionId: string, userText: string): AsyncGenerator<string> {
  if (!config.USE_MOCKS) {
    // The backend persists both the user message and the AI reply.
    yield* streamFetch(`/sessions/${sessionId}/chat`, { content: userText });
    return;
  }
  // Persist the user's message first.
  persistMessage({
    id: "m_" + Math.random().toString(36).slice(2, 8),
    sessionId,
    role: "user",
    content: userText,
    createdAt: Date.now(),
  });

  const reply = generateMockReply(userText);
  let full = "";
  const tokens = reply.split(/(\s+)/);
  for (const t of tokens) {
    await sleep(18 + Math.random() * 40);
    full += t;
    yield t;
  }
  // Persist the completed AI message.
  persistMessage({
    id: "m_" + Math.random().toString(36).slice(2, 8),
    sessionId,
    role: "ai",
    content: full,
    createdAt: Date.now(),
  });
}

/**
 * The AI proactively asks a follow-up question after the candidate runs code.
 * Streams like a normal reply but is initiated by the system, not a user turn.
 * Real impl: POST /sessions/:id/followup with the run result as context.
 */
export async function* streamAIFollowUp(sessionId: string, passed: number, total: number): AsyncGenerator<string> {
  if (!config.USE_MOCKS) {
    yield* streamFetch(`/sessions/${sessionId}/followup`, { passed, total });
    return;
  }
  await sleep(500);
  const allPassed = passed === total;
  const reply = allPassed
    ? `Nice — ${passed}/${total} tests passing. Before we call it done: what's the time and space complexity of your solution, and can you think of an input that would make it slow?`
    : `You're at ${passed}/${total}. Let's debug together — which test case is failing, and what does your code currently return for it versus what you expected?`;
  let full = "";
  for (const t of reply.split(/(\s+)/)) {
    await sleep(18 + Math.random() * 35);
    full += t;
    yield t;
  }
  persistMessage({
    id: "m_" + Math.random().toString(36).slice(2, 8),
    sessionId,
    role: "ai",
    content: full,
    createdAt: Date.now(),
  });
}

function generateMockReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("hint") || t.includes("stuck") || t.includes("help"))
    return "Sure — think about what data structure gives you O(1) lookups. If you store each value you've seen so far along with its index, you can check in constant time whether the complement (target − current) already exists. Want to try sketching that?";
  if (t.includes("hash") || t.includes("map") || t.includes("dictionary"))
    return "Exactly the right instinct. A hash map lets you trade space for time here, bringing the solution from O(n²) down to O(n). Walk me through how you'd handle the case where the complement equals the current element.";
  if (t.includes("time") || t.includes("complexity") || t.includes("o("))
    return "Good — let's reason about it. The brute-force nested loop is O(n²) time and O(1) space. The hash-map approach is O(n) time and O(n) space. For an interview, calling out that trade-off explicitly is exactly what I'm looking for.";
  if (t.includes("done") || t.includes("finished") || t.includes("complete"))
    return "Nice work. Let's run your solution against the test cases, then I'll ask a follow-up about edge cases — like duplicate values or negative numbers. Go ahead and hit Run.";
  return "That's a reasonable direction. Can you walk me through your approach step by step, and tell me what the time and space complexity would be? Talking through your reasoning is just as important as the final code.";
}

// ── Code execution ───────────────────────────────────────────────────────────

// POST /sessions/:id/run
export async function runCode(sessionId: string, _language: Language, code: string): Promise<CodeRunResult> {
  if (!config.USE_MOCKS) return http(`/sessions/${sessionId}/run`, { method: "POST", body: JSON.stringify({ language: _language, code }) });
  await sleep(700 + Math.random() * 900); // execution is slower than API calls
  const empty = /\/\/\s*your code here|pass\s*$|return \[\];/.test(code) && code.trim().split("\n").length < 6;
  if (empty) {
    return { status: "error", stdout: "", stderr: "RuntimeError: function returned undefined / not implemented", runtimeMs: 12, testsPassed: 0, testsTotal: 12 };
  }
  const passed = 8 + Math.floor(Math.random() * 5);
  const total = 12;
  return {
    status: passed === total ? "success" : "error",
    stdout: `Running ${total} test cases...\n${passed === total ? "All tests passed ✓" : `${passed}/${total} passed`}\n`,
    stderr: passed === total ? undefined : `Test ${passed + 1} failed: expected output did not match.`,
    runtimeMs: 40 + Math.floor(Math.random() * 120),
    testsPassed: passed,
    testsTotal: total,
  };
}

// PATCH /sessions/:id/code  (autosave)
export async function saveCode(sessionId: string, code: string): Promise<void> {
  if (!config.USE_MOCKS) { await http(`/sessions/${sessionId}/code`, { method: "PATCH", body: JSON.stringify({ code }) }); return; }
  await sleep(120);
  codeStore[sessionId] = code;
}

// ── AI code review ───────────────────────────────────────────────────────────

// POST /sessions/:id/review  — AI reviews the current code (distinct from final evaluation)
export async function reviewCode(sessionId: string, _language: Language, code: string): Promise<CodeReview> {
  if (!config.USE_MOCKS) return http(`/sessions/${sessionId}/review`, { method: "POST", body: JSON.stringify({ language: _language, code }) });
  await sleep(900 + Math.random() * 700);

  const lines = code.split("\n");
  const comments: CodeReview["comments"] = [];

  const notImplemented = /\/\/\s*your code here|^\s*pass\s*$/m.test(code) && lines.length < 8;
  if (notImplemented) {
    return {
      rating: 0,
      summary: "There's no implementation to review yet. Write your solution, then ask for a review.",
      comments: [{ severity: "warning", message: "The function body is still empty / a stub." }],
    };
  }

  // Heuristic, mock "review" comments — the real backend would send AI output.
  const nestedLoop = (code.match(/for\b/g)?.length ?? 0) >= 2;
  if (nestedLoop)
    comments.push({ severity: "warning", line: lines.findIndex((l) => /for\b/.test(l)) + 1, message: "Nested loops detected — this looks O(n²). Consider a hash map to reach O(n)." });
  if (!/\/\//.test(code) && !/#/.test(code))
    comments.push({ severity: "suggestion", message: "Add a couple of comments explaining the core idea — interviewers value readable reasoning." });
  if (/var\s/.test(code))
    comments.push({ severity: "suggestion", line: lines.findIndex((l) => /var\s/.test(l)) + 1, message: "Prefer `let`/`const` over `var` for block scoping." });
  if (!/(return|print|console\.)/.test(code))
    comments.push({ severity: "warning", message: "No return / output found — make sure the function returns its result." });
  comments.push({ severity: "info", message: "Edge cases to confirm: empty input, duplicates, and negative numbers." });

  const rating = Math.max(40, 92 - comments.filter((c) => c.severity === "warning").length * 18);
  return {
    rating,
    summary:
      rating >= 80
        ? "Clean, idiomatic solution. A few small refinements would make it production-ready."
        : "Working start with a clear structure, but there are efficiency/readability improvements worth making before finalizing.",
    comments,
  };
}

// ── Evaluation ───────────────────────────────────────────────────────────────

// POST /sessions/:id/evaluate
export async function getEvaluation(sessionId: string): Promise<Evaluation> {
  if (!config.USE_MOCKS) return http(`/sessions/${sessionId}/evaluate`, { method: "POST" });
  await sleep(1200);
  const r = (min: number) => min + Math.floor(Math.random() * (100 - min));
  const correctness = r(70), efficiency = r(60), codeQuality = r(65), communication = r(72);
  const overall = Math.round((correctness + efficiency + codeQuality + communication) / 4);
  return {
    sessionId,
    overall,
    correctness,
    efficiency,
    codeQuality,
    communication,
    summary:
      "The candidate demonstrated solid problem-solving and arrived at an optimal hash-map solution. Communication was clear, with good articulation of time/space trade-offs. Some hesitation on edge cases suggests room to grow in defensive thinking.",
    strengths: [
      "Identified the optimal O(n) approach quickly",
      "Clear verbal reasoning while coding",
      "Handled the happy path cleanly",
    ],
    improvements: [
      "Consider edge cases (duplicates, empty input) earlier",
      "Add brief inline comments for clarity",
      "Verify the solution against examples before running",
    ],
  };
}

// ── Cheating detection / proctoring ──────────────────────────────────────────

const proctorStore: Record<string, { type: string }[]> = {};

function analyzeIntegrityLocal(events: { type: string }[]): IntegrityReport {
  const largePastes = events.filter((e) => e.type === "large_paste").length;
  const smallPastes = events.filter((e) => e.type === "paste").length;
  const tabSwitches = events.filter((e) => e.type === "blur").length;
  const signals: string[] = [];
  let risk = 0;
  if (largePastes > 0) { risk += largePastes * 28; signals.push(`${largePastes} large paste${largePastes > 1 ? "s" : ""} detected (possible copied solution)`); }
  if (smallPastes > 0) risk += smallPastes * 6;
  if (tabSwitches >= 3) { risk += tabSwitches * 7; signals.push(`${tabSwitches} times the candidate left the interview tab`); }
  risk = Math.min(100, risk);
  const level: IntegrityReport["level"] = risk >= 60 ? "high" : risk >= 25 ? "medium" : "low";
  if (signals.length === 0) signals.push("No integrity concerns detected");
  return { risk, level, signals, pasteCount: largePastes + smallPastes, tabSwitches };
}

// POST /sessions/:id/proctor
export async function logProctorEvent(sessionId: string, type: ProctorEventType, detail?: string): Promise<void> {
  if (!config.USE_MOCKS) { await http(`/sessions/${sessionId}/proctor`, { method: "POST", body: JSON.stringify({ type, detail }) }); return; }
  (proctorStore[sessionId] ??= []).push({ type });
}

// GET /sessions/:id/integrity
export async function getIntegrity(sessionId: string): Promise<IntegrityReport> {
  if (!config.USE_MOCKS) return http(`/sessions/${sessionId}/integrity`);
  await sleep(150);
  return analyzeIntegrityLocal(proctorStore[sessionId] ?? []);
}

// ── Analytics ────────────────────────────────────────────────────────────────

// GET /analytics/stats
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!config.USE_MOCKS) return http("/analytics/stats");
  await sleep(LATENCY);
  const completed = sessionStore.filter((s) => s.status === "completed");
  const avg = completed.length ? Math.round(completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length) : 0;
  return {
    totalInterviews: sessionStore.length + 137,
    activeSessions: sessionStore.filter((s) => s.status === "active").length,
    avgScore: avg || 81,
    passRate: 73,
    totalCandidates: 96,
    avgDurationMin: 44,
  };
}

// GET /analytics/timeseries
export async function getTimeseries(): Promise<TimeseriesPoint[]> {
  if (!config.USE_MOCKS) return http("/analytics/timeseries");
  await sleep(LATENCY);
  const days = 14;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400_000);
    return {
      date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      interviews: 4 + Math.floor(Math.random() * 12),
      avgScore: 65 + Math.floor(Math.random() * 28),
    };
  });
}

// GET /analytics/score-distribution
export async function getScoreDistribution(): Promise<ScoreDistribution[]> {
  if (!config.USE_MOCKS) return http("/analytics/score-distribution");
  await sleep(LATENCY);
  return [
    { bucket: "0-20", count: 3 },
    { bucket: "21-40", count: 7 },
    { bucket: "41-60", count: 18 },
    { bucket: "61-80", count: 41 },
    { bucket: "81-100", count: 27 },
  ];
}

// GET /analytics/languages
export async function getLanguageUsage(): Promise<LanguageUsage[]> {
  if (!config.USE_MOCKS) return http("/analytics/languages");
  await sleep(LATENCY);
  return [
    { language: "JavaScript", value: 38 },
    { language: "Python", value: 31 },
    { language: "TypeScript", value: 18 },
    { language: "Java", value: 8 },
    { language: "Go", value: 5 },
  ];
}

// GET /analytics/activity
export async function getActivity(): Promise<ActivityEvent[]> {
  if (!config.USE_MOCKS) return http("/analytics/activity");
  await sleep(LATENCY);
  return [...activityFeed].sort((a, b) => b.at - a.at);
}
