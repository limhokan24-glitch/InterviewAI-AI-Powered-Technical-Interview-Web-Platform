// ─────────────────────────────────────────────────────────────────────────────
// AI service. Uses Anthropic when ANTHROPIC_API_KEY is set, otherwise a built-in
// deterministic fallback so the whole app runs without any API key.
// ─────────────────────────────────────────────────────────────────────────────

import { env } from "../config/env";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Calls Anthropic's Messages API and returns the full text (non-streaming). */
async function anthropicComplete(system: string, user: string, maxTokens = 400): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = (await res.json()) as { content: { text: string }[] };
  return data.content.map((c) => c.text).join("");
}

/** Yields a string token-by-token to simulate a live stream for the UI. */
async function* streamText(text: string): AsyncGenerator<string> {
  for (const tok of text.split(/(\s+)/)) {
    await sleep(15 + Math.random() * 30);
    yield tok;
  }
}

const SYSTEM_INTERVIEWER =
  "You are a friendly but rigorous technical interviewer. Keep replies short (2-4 sentences), ask guiding questions, never give away the full solution, and prompt the candidate to reason about time/space complexity and edge cases.";

/** Streams an AI interviewer reply to a candidate message. */
export async function* streamReply(userText: string, history: { role: string; content: string }[] = []): AsyncGenerator<string> {
  if (env.ANTHROPIC_API_KEY) {
    const ctx = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
    const text = await anthropicComplete(SYSTEM_INTERVIEWER, `${ctx}\ncandidate: ${userText}`);
    yield* streamText(text);
    return;
  }
  yield* streamText(fallbackReply(userText));
}

/** Streams a proactive follow-up after the candidate runs their code. */
export async function* streamFollowUp(passed: number, total: number): AsyncGenerator<string> {
  const allPassed = passed === total && total > 0;
  const text = allPassed
    ? `Nice — ${passed}/${total} tests passing. Before we wrap up: what's the time and space complexity of your solution, and can you think of an input that would make it slow?`
    : `You're at ${passed}/${total}. Let's debug together — which test case is failing, and what does your code return for it versus what you expected?`;
  yield* streamText(text);
}

function fallbackReply(userText: string): string {
  const t = userText.toLowerCase();
  if (/(hint|stuck|help)/.test(t))
    return "Think about what data structure gives you O(1) lookups. If you store each value you've seen along with its index, you can check the complement in constant time. Want to try sketching that?";
  if (/(hash|map|dictionary)/.test(t))
    return "Exactly the right instinct — a hash map trades space for time, taking you from O(n²) to O(n). How would you handle the case where the complement equals the current element?";
  if (/(time|complex|o\()/.test(t))
    return "Good. The brute-force nested loop is O(n²) time, O(1) space; the hash-map approach is O(n) time, O(n) space. Calling out that trade-off explicitly is exactly what I want to hear.";
  if (/(done|finished|complete)/.test(t))
    return "Nice work. Let's run it against the test cases, then I'll ask about edge cases — duplicates, negatives, empty input. Go ahead and hit Run.";
  return "Reasonable direction. Walk me through your approach step by step, and tell me the time and space complexity. Reasoning out loud matters as much as the final code.";
}

export interface ReviewComment {
  line?: number;
  severity: "info" | "warning" | "suggestion";
  message: string;
}
export interface CodeReview {
  rating: number;
  summary: string;
  comments: ReviewComment[];
}

/** Heuristic code review (fallback). The real provider path could ask the model
 *  for structured JSON; we keep the deterministic version for reliability. */
export function reviewCode(_language: string, code: string): CodeReview {
  const lines = code.split("\n");
  const comments: ReviewComment[] = [];

  const empty = /\/\/\s*your code here|^\s*pass\s*$/m.test(code) && lines.length < 8;
  if (empty) {
    return {
      rating: 0,
      summary: "There's no implementation to review yet. Write your solution, then ask for a review.",
      comments: [{ severity: "warning", message: "The function body is still empty / a stub." }],
    };
  }

  if ((code.match(/for\b/g)?.length ?? 0) >= 2)
    comments.push({ severity: "warning", line: lines.findIndex((l) => /for\b/.test(l)) + 1, message: "Nested loops detected — this looks O(n²). Consider a hash map for O(n)." });
  if (!/(\/\/|#)/.test(code))
    comments.push({ severity: "suggestion", message: "Add a couple of comments explaining the core idea — readable reasoning scores well." });
  if (/\bvar\s/.test(code))
    comments.push({ severity: "suggestion", line: lines.findIndex((l) => /\bvar\s/.test(l)) + 1, message: "Prefer `let`/`const` over `var` for block scoping." });
  if (!/(return|print|console\.)/.test(code))
    comments.push({ severity: "warning", message: "No return / output found — make sure the function returns its result." });
  comments.push({ severity: "info", message: "Edge cases to confirm: empty input, duplicates, and negative numbers." });

  const warnings = comments.filter((c) => c.severity === "warning").length;
  const rating = Math.max(40, 92 - warnings * 18);
  return {
    rating,
    summary:
      rating >= 80
        ? "Clean, idiomatic solution. A few small refinements would make it production-ready."
        : "Working start with a clear structure, but there are efficiency/readability improvements worth making.",
    comments,
  };
}

export interface EvaluationResult {
  overall: number;
  correctness: number;
  efficiency: number;
  codeQuality: number;
  communication: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

/** Produces a scored evaluation for a finished session (fallback). */
export function evaluate(passedRatio = 0.85): EvaluationResult {
  const base = Math.round(passedRatio * 100);
  const jitter = () => Math.max(40, Math.min(100, base + Math.floor((Math.random() - 0.5) * 24)));
  const correctness = Math.round(passedRatio * 100);
  const efficiency = jitter();
  const codeQuality = jitter();
  const communication = jitter();
  const overall = Math.round((correctness + efficiency + codeQuality + communication) / 4);
  return {
    overall,
    correctness,
    efficiency,
    codeQuality,
    communication,
    summary:
      "The candidate demonstrated solid problem-solving and arrived at an optimal approach. Communication was clear, with good articulation of time/space trade-offs. Some hesitation on edge cases suggests room to grow in defensive thinking.",
    strengths: [
      "Identified the optimal approach quickly",
      "Clear verbal reasoning while coding",
      "Handled the happy path cleanly",
    ],
    improvements: [
      "Consider edge cases (duplicates, empty input) earlier",
      "Add brief inline comments for clarity",
      "Verify against examples before running",
    ],
  };
}

const TOPICS = ["arrays", "strings", "graphs", "dynamic-programming", "trees"];

const CHALLENGE_POOL = [
  {
    title: "Group Anagrams",
    tags: ["hash-map", "string"],
    prompt: "Given an array of strings `strs`, group the anagrams together. Two strings are anagrams if they contain the same characters with the same frequency.",
    starterCode: { javascript: "function groupAnagrams(strs) {\n  // your code here\n}\n", python: "def group_anagrams(strs):\n    pass\n" },
    examples: [{ input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    tags: ["sliding-window", "string"],
    prompt: "Given a string `s`, find the length of the longest substring without repeating characters.",
    starterCode: { javascript: "function lengthOfLongestSubstring(s) {\n  // your code here\n}\n", python: "def length_of_longest_substring(s):\n    pass\n" },
    examples: [{ input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' }],
  },
  {
    title: "Course Schedule",
    tags: ["graph", "topological-sort"],
    prompt: "Given `numCourses` and `prerequisites` where [a,b] means b must come before a, return true if all courses can be finished.",
    starterCode: { javascript: "function canFinish(numCourses, prerequisites) {\n  // your code here\n}\n", python: "def can_finish(n, prerequisites):\n    pass\n" },
    examples: [{ input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" }],
  },
];

/** Generates a coding challenge of the requested difficulty/topic (fallback). */
export function generateChallenge(difficulty: string, topic?: string) {
  const base = CHALLENGE_POOL[Math.floor(Math.random() * CHALLENGE_POOL.length)];
  const tags = topic ? [topic, ...base.tags] : [TOPICS[Math.floor(Math.random() * TOPICS.length)], ...base.tags];
  return { ...base, difficulty, tags };
}
