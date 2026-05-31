// ─────────────────────────────────────────────────────────────────────────────
// Domain types shared across the frontend.
// These mirror the contract the backend team is expected to implement.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "candidate" | "interviewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export type Difficulty = "easy" | "medium" | "hard";
export type Language = "javascript" | "typescript" | "python" | "java" | "cpp" | "go";

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  prompt: string; // markdown-ish description
  starterCode: Partial<Record<Language, string>>;
  examples: { input: string; output: string; explanation?: string }[];
}

export type SessionStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface InterviewSession {
  id: string;
  title: string;
  candidateName: string;
  interviewerName?: string;
  problemId: string;
  status: SessionStatus;
  language: Language;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  durationMin?: number;
  score?: number; // 0-100
}

export type ChatRole = "ai" | "user" | "system";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  streaming?: boolean;
}

export interface CodeRunResult {
  status: "success" | "error" | "timeout";
  stdout: string;
  stderr?: string;
  runtimeMs: number;
  testsPassed?: number;
  testsTotal?: number;
}

export interface ReviewComment {
  line?: number;
  severity: "info" | "warning" | "suggestion";
  message: string;
}

export interface CodeReview {
  rating: number; // 0-100
  summary: string;
  comments: ReviewComment[];
}

export type ProctorEventType = "paste" | "large_paste" | "blur" | "focus" | "devtools";

export interface IntegrityReport {
  risk: number; // 0-100
  level: "low" | "medium" | "high";
  signals: string[];
  pasteCount: number;
  tabSwitches: number;
}

export interface Evaluation {
  sessionId: string;
  overall: number; // 0-100
  correctness: number;
  efficiency: number;
  codeQuality: number;
  communication: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

// Analytics ------------------------------------------------------------------

export interface DashboardStats {
  totalInterviews: number;
  activeSessions: number;
  avgScore: number;
  passRate: number;
  totalCandidates: number;
  avgDurationMin: number;
}

export interface TimeseriesPoint {
  date: string;
  interviews: number;
  avgScore: number;
}

export interface ScoreDistribution {
  bucket: string;
  count: number;
}

export interface LanguageUsage {
  language: string;
  value: number;
}

export interface ActivityEvent {
  id: string;
  type: "session_started" | "session_completed" | "code_run" | "evaluation" | "joined";
  message: string;
  at: number;
}

// Realtime -------------------------------------------------------------------

export type WsEvent =
  | { type: "code:update"; sessionId: string; code: string; senderId?: string }
  | { type: "cursor:update"; sessionId: string; senderId: string; user: string; line: number; column: number }
  | { type: "presence:join"; sessionId: string; user: string }
  | { type: "presence:leave"; sessionId: string; user: string }
  | { type: "session:status"; sessionId: string; status: SessionStatus }
  | { type: "activity"; event: ActivityEvent };

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";
