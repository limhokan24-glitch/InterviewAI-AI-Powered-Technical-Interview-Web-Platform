import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Check, Save, ChevronDown, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as api from "@/services/api";
import { realtime } from "@/services/realtime";
import type { CodeRunResult, Language } from "@/services/types";
import { roomBus } from "./roomBus";
import { CodeReviewModal } from "./CodeReviewModal";

const LANGS: Language[] = ["javascript", "typescript", "python", "java", "cpp", "go"];

// Monaco uses different ids for a couple of our languages.
const monacoLang: Record<Language, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
};

type SaveState = "idle" | "saving" | "saved";

export function CodeEditor({
  sessionId,
  initialCode,
  language,
  onLanguageChange,
}: {
  sessionId: string;
  initialCode: string;
  language: Language;
  onLanguageChange: (l: Language) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeRunResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showConsole, setShowConsole] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset editor content when switching sessions / starter code.
  useEffect(() => setCode(initialCode), [initialCode]);

  // Debounced autosave + broadcast over the realtime channel.
  function handleChange(value: string | undefined) {
    const next = value ?? "";
    setCode(next);
    setSaveState("saving");
    realtime.send({ type: "code:update", sessionId, code: next });
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.saveCode(sessionId, next);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 800);
  }

  async function run() {
    setRunning(true);
    setResult(null);
    setShowConsole(true);
    try {
      const r = await api.runCode(sessionId, language, code);
      setResult(r);
      // Let the AI chat react with a follow-up question.
      roomBus.emit("code:ran", { result: r });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="h-8 w-36 text-xs capitalize"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
          <SaveIndicator state={saveState} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowReview(true)} title="Ask the AI to review your code">
            <ScanLine className="size-4" /> AI Review
          </Button>
          <Button size="sm" onClick={run} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "Running…" : "Run"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={monacoLang[language]}
          value={code}
          onChange={handleChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            smoothScrolling: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Console / results */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowConsole((s) => !s)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            Console
            {result && (
              <Badge variant={result.status === "success" ? "success" : "destructive"}>
                {result.testsPassed}/{result.testsTotal} tests
              </Badge>
            )}
          </span>
          <ChevronDown className={cn("size-4 transition-transform", showConsole && "rotate-180")} />
        </button>
        {showConsole && (
          <div className="max-h-40 overflow-y-auto bg-[#0d0d10] px-3 pb-3 font-mono text-xs">
            {!result && !running && <p className="py-2 text-muted-foreground">Run your code to see output.</p>}
            {running && <p className="py-2 text-muted-foreground">Executing in sandbox…</p>}
            {result && (
              <div className="space-y-1 py-1">
                <pre className="whitespace-pre-wrap text-foreground/90">{result.stdout}</pre>
                {result.stderr && <pre className="whitespace-pre-wrap text-destructive">{result.stderr}</pre>}
                <p className="text-muted-foreground">Finished in {result.runtimeMs}ms · status: {result.status}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showReview && (
        <CodeReviewModal sessionId={sessionId} language={language} code={code} onClose={() => setShowReview(false)} />
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Save className="size-3 animate-pulse" /> Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <Check className="size-3" /> Saved
      </span>
    );
  return <span className="text-xs text-muted-foreground">Auto-saved</span>;
}
