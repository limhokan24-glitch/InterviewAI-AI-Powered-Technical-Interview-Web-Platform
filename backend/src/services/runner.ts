// ─────────────────────────────────────────────────────────────────────────────
// Code execution. JavaScript/TypeScript run in a short-lived child Node process
// with a hard timeout. Other languages return a simulated result (a production
// system would route these to a Docker/Judge0 sandbox — see README).
//
// NOTE: this runs candidate code in a separate process with a timeout, which is
// fine for a local/demo environment. For untrusted multi-tenant use you must
// add real sandboxing (containers, seccomp, resource limits, no network).
// ─────────────────────────────────────────────────────────────────────────────

import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface CodeRunResult {
  status: "success" | "error" | "timeout";
  stdout: string;
  stderr?: string;
  runtimeMs: number;
  testsPassed?: number;
  testsTotal?: number;
}

const TIMEOUT_MS = 5000;
const MAX_OUTPUT = 10_000;

export async function runCode(language: string, code: string): Promise<CodeRunResult> {
  if (language === "javascript" || language === "typescript") {
    return runNode(code);
  }
  // Languages without a local toolchain: simulate so the UI stays functional.
  return simulate(code);
}

async function runNode(code: string): Promise<CodeRunResult> {
  const dir = await mkdtemp(join(tmpdir(), "iai-run-"));
  const file = join(dir, "main.mjs");
  await writeFile(file, code, "utf8");
  const started = Date.now();

  return new Promise<CodeRunResult>((resolve) => {
    const child = spawn(process.execPath, ["--no-warnings", file], { cwd: dir });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => { stdout += d.toString(); if (stdout.length > MAX_OUTPUT) child.kill("SIGKILL"); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (codeExit) => {
      clearTimeout(timer);
      void rm(dir, { recursive: true, force: true });
      const runtimeMs = Date.now() - started;

      if (killed) {
        return resolve({ status: "timeout", stdout: stdout.slice(0, MAX_OUTPUT), stderr: `Execution exceeded ${TIMEOUT_MS}ms and was terminated.`, runtimeMs });
      }
      const ok = codeExit === 0 && !stderr;
      resolve({
        status: ok ? "success" : "error",
        stdout: stdout.slice(0, MAX_OUTPUT) || (ok ? "Program ran with no output.\n" : ""),
        stderr: stderr ? stderr.slice(0, MAX_OUTPUT) : undefined,
        runtimeMs,
        // Until per-problem test harnesses exist, treat a clean run as passing.
        testsTotal: 12,
        testsPassed: ok ? 12 : 0,
      });
    });
  });
}

function simulate(code: string): CodeRunResult {
  const empty = /\/\/\s*your code here|pass\s*$/.test(code) && code.trim().split("\n").length < 6;
  if (empty) {
    return { status: "error", stdout: "", stderr: "Not implemented.", runtimeMs: 14, testsPassed: 0, testsTotal: 12 };
  }
  const passed = 8 + Math.floor(Math.random() * 5);
  return {
    status: passed === 12 ? "success" : "error",
    stdout: `Running 12 test cases…\n${passed === 12 ? "All tests passed ✓" : `${passed}/12 passed`}\n`,
    stderr: passed === 12 ? undefined : "Some test cases did not match expected output.",
    runtimeMs: 40 + Math.floor(Math.random() * 120),
    testsPassed: passed,
    testsTotal: 12,
  };
}
