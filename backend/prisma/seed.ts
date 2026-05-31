import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const problems = [
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
      "Given a string `s` containing just the characters '()[]{}', determine if the input string is valid. Brackets must close in the correct order.",
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
      "Design a data structure for a Least Recently Used (LRU) cache. Implement `get(key)` and `put(key, value)` in O(1) average time.",
    starterCode: {
      javascript: "class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}\n",
      python: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n",
    },
    examples: [{ input: "capacity = 2; put(1,1); put(2,2); get(1)", output: "1" }],
  },
  {
    id: "p4",
    title: "Merge Intervals",
    difficulty: "medium",
    tags: ["array", "sorting"],
    prompt:
      "Given an array of `intervals` where intervals[i] = [start, end], merge all overlapping intervals and return the non-overlapping intervals that cover them.",
    starterCode: {
      javascript: "function merge(intervals) {\n  // your code here\n}\n",
      python: "def merge(intervals):\n    # your code here\n    pass\n",
    },
    examples: [{ input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }],
  },
];

async function main() {
  console.log("Seeding database…");

  // Demo users (password: "password123")
  const hash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "interviewer@interviewai.dev" },
    update: {},
    create: { name: "Alex Interviewer", email: "interviewer@interviewai.dev", passwordHash: hash, role: "interviewer" },
  });
  await prisma.user.upsert({
    where: { email: "candidate@interviewai.dev" },
    update: {},
    create: { name: "Sokha Candidate", email: "candidate@interviewai.dev", passwordHash: hash, role: "candidate" },
  });

  // Problems
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        tags: JSON.stringify(p.tags),
        prompt: p.prompt,
        starterCode: JSON.stringify(p.starterCode),
        examples: JSON.stringify(p.examples),
      },
    });
  }

  // No sample sessions: the dashboard/analytics should reflect only real
  // interviews created through the app. (Use `npm run db:reset` to clear
  // interview activity at any time.)

  console.log("Seed complete ✓  (problem bank + demo logins: interviewer@interviewai.dev / candidate@interviewai.dev — password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
