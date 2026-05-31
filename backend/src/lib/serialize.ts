// Converts Prisma rows into the exact JSON shapes the frontend's types expect
// (dates → epoch-ms numbers, JSON-string columns → parsed objects/arrays).

import type { Problem, Session, Message, User, Evaluation } from "@prisma/client";

export function toUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.getTime(),
  };
}

export function toProblem(p: Problem) {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    tags: JSON.parse(p.tags) as string[],
    prompt: p.prompt,
    starterCode: JSON.parse(p.starterCode) as Record<string, string>,
    examples: JSON.parse(p.examples) as { input: string; output: string; explanation?: string }[],
  };
}

export function toSession(s: Session) {
  return {
    id: s.id,
    title: s.title,
    candidateName: s.candidateName,
    interviewerName: s.interviewerName ?? undefined,
    problemId: s.problemId,
    status: s.status,
    language: s.language,
    score: s.score ?? undefined,
    durationMin: s.durationMin ?? undefined,
    createdAt: s.createdAt.getTime(),
    startedAt: s.startedAt?.getTime(),
    endedAt: s.endedAt?.getTime(),
  };
}

export function toMessage(m: Message) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.getTime(),
  };
}

export function toEvaluation(e: Evaluation) {
  return {
    sessionId: e.sessionId,
    overall: e.overall,
    correctness: e.correctness,
    efficiency: e.efficiency,
    codeQuality: e.codeQuality,
    communication: e.communication,
    summary: e.summary,
    strengths: JSON.parse(e.strengths) as string[],
    improvements: JSON.parse(e.improvements) as string[],
  };
}
