import type {
  Problem,
  InterviewSession,
  ChatMessage,
  ActivityEvent,
} from "@/services/types";

export const problems: Problem[] = [
  {
    id: "p1",
    title: "Two Sum",
    difficulty: "easy",
    tags: ["array", "hash-map"],
    prompt:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume exactly one solution, and you may not use the same element twice.",
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // your code here\n}\n",
      python: "def two_sum(nums, target):\n    # your code here\n    pass\n",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n  // your code here\n  return [];\n}\n",
    },
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
  },
  {
    id: "p2",
    title: "Valid Parentheses",
    difficulty: "easy",
    tags: ["stack", "string"],
    prompt:
      "Given a string `s` containing just the characters '()[]{}', determine if the input string is valid. An input string is valid if open brackets are closed by the same type, and in the correct order.",
    starterCode: {
      javascript: "function isValid(s) {\n  // your code here\n}\n",
      python: "def is_valid(s):\n    # your code here\n    pass\n",
    },
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
  },
  {
    id: "p3",
    title: "LRU Cache",
    difficulty: "hard",
    tags: ["design", "hash-map", "linked-list"],
    prompt:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement `get(key)` and `put(key, value)` in O(1) average time complexity.",
    starterCode: {
      javascript: "class LRUCache {\n  constructor(capacity) {\n    // your code here\n  }\n  get(key) {}\n  put(key, value) {}\n}\n",
      python: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass\n",
    },
    examples: [
      { input: "capacity = 2; put(1,1); put(2,2); get(1)", output: "1" },
    ],
  },
  {
    id: "p4",
    title: "Merge Intervals",
    difficulty: "medium",
    tags: ["array", "sorting"],
    prompt:
      "Given an array of `intervals` where intervals[i] = [start, end], merge all overlapping intervals and return an array of non-overlapping intervals covering all the input intervals.",
    starterCode: {
      javascript: "function merge(intervals) {\n  // your code here\n}\n",
      python: "def merge(intervals):\n    # your code here\n    pass\n",
    },
    examples: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
    ],
  },
];

/** Seed pool the mock AI "generates" new challenges from. */
export const challengeTemplates: Omit<Problem, "id">[] = [
  {
    title: "Group Anagrams",
    difficulty: "medium",
    tags: ["hash-map", "string"],
    prompt:
      "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order. Two strings are anagrams if they contain the same characters with the same frequency.",
    starterCode: {
      javascript: "function groupAnagrams(strs) {\n  // your code here\n}\n",
      python: "def group_anagrams(strs):\n    # your code here\n    pass\n",
    },
    examples: [{ input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }],
  },
  {
    title: "Binary Tree Level Order",
    difficulty: "medium",
    tags: ["tree", "bfs", "queue"],
    prompt:
      "Given the root of a binary tree, return the level-order traversal of its nodes' values (i.e. from left to right, level by level).",
    starterCode: {
      javascript: "function levelOrder(root) {\n  // your code here\n}\n",
      python: "def level_order(root):\n    # your code here\n    pass\n",
    },
    examples: [{ input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" }],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    tags: ["sliding-window", "hash-set", "string"],
    prompt:
      "Given a string `s`, find the length of the longest substring without repeating characters.",
    starterCode: {
      javascript: "function lengthOfLongestSubstring(s) {\n  // your code here\n}\n",
      python: "def length_of_longest_substring(s):\n    # your code here\n    pass\n",
    },
    examples: [{ input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", length 3.' }],
  },
  {
    title: "Course Schedule",
    difficulty: "hard",
    tags: ["graph", "topological-sort", "dfs"],
    prompt:
      "There are `numCourses` courses labeled 0..numCourses-1. Given `prerequisites` where prerequisites[i] = [a, b] means you must take b before a, return true if you can finish all courses.",
    starterCode: {
      javascript: "function canFinish(numCourses, prerequisites) {\n  // your code here\n}\n",
      python: "def can_finish(num_courses, prerequisites):\n    # your code here\n    pass\n",
    },
    examples: [{ input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" }],
  },
];

const now = Date.now();
const hr = 3600_000;

export const sessions: InterviewSession[] = [
  {
    id: "s1",
    title: "Frontend Engineer — Round 1",
    candidateName: "Sokha Pich",
    interviewerName: "AI Interviewer",
    problemId: "p1",
    status: "active",
    language: "javascript",
    createdAt: now - 0.2 * hr,
    startedAt: now - 0.2 * hr,
  },
  {
    id: "s2",
    title: "Backend Engineer — Systems",
    candidateName: "Dara Chan",
    interviewerName: "AI Interviewer",
    problemId: "p3",
    status: "scheduled",
    language: "python",
    createdAt: now - 1 * hr,
  },
  {
    id: "s3",
    title: "Fullstack — Algorithms",
    candidateName: "Lina Sok",
    interviewerName: "AI Interviewer",
    problemId: "p4",
    status: "completed",
    language: "typescript",
    createdAt: now - 26 * hr,
    startedAt: now - 26 * hr,
    endedAt: now - 25.3 * hr,
    durationMin: 42,
    score: 84,
  },
  {
    id: "s4",
    title: "Junior Dev — Screening",
    candidateName: "Visal Heng",
    interviewerName: "AI Interviewer",
    problemId: "p2",
    status: "completed",
    language: "javascript",
    createdAt: now - 50 * hr,
    startedAt: now - 50 * hr,
    endedAt: now - 49.5 * hr,
    durationMin: 31,
    score: 67,
  },
  {
    id: "s5",
    title: "Senior Engineer — Design",
    candidateName: "Maly Ros",
    interviewerName: "AI Interviewer",
    problemId: "p3",
    status: "completed",
    language: "go",
    createdAt: now - 74 * hr,
    startedAt: now - 74 * hr,
    endedAt: now - 73.2 * hr,
    durationMin: 55,
    score: 91,
  },
];

export const seedMessages = (sessionId: string): ChatMessage[] => [
  {
    id: `${sessionId}-m1`,
    sessionId,
    role: "ai",
    content:
      "Hi! I'm your AI interviewer today. We'll work through a coding problem together. Take your time, think out loud, and feel free to ask clarifying questions. Ready to start with the problem on the right?",
    createdAt: now - 0.18 * hr,
  },
  {
    id: `${sessionId}-m2`,
    sessionId,
    role: "user",
    content: "Yes, ready. Can I assume the input array is never empty?",
    createdAt: now - 0.17 * hr,
  },
  {
    id: `${sessionId}-m3`,
    sessionId,
    role: "ai",
    content:
      "Good question — yes, assume the array has at least two elements and exactly one valid answer. What's your first instinct for the approach?",
    createdAt: now - 0.16 * hr,
  },
];

export const activityFeed: ActivityEvent[] = [
  { id: "a1", type: "session_started", message: "Sokha Pich started 'Frontend Engineer — Round 1'", at: now - 0.2 * hr },
  { id: "a2", type: "code_run", message: "Code executed in s1 — 12/12 tests passed", at: now - 0.1 * hr },
  { id: "a3", type: "evaluation", message: "AI evaluation completed for Lina Sok (84%)", at: now - 25.3 * hr },
  { id: "a4", type: "session_completed", message: "Maly Ros completed 'Senior Engineer — Design' (91%)", at: now - 73.2 * hr },
  { id: "a5", type: "joined", message: "New candidate Dara Chan registered", at: now - 1 * hr },
];
