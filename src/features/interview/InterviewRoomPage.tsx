import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Unplug, Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAsync } from "@/lib/useAsync";
import * as api from "@/services/api";
import type { Language } from "@/services/types";
import { useRealtime } from "./useRealtime";
import { ConnectionBadge } from "./ConnectionBadge";
import { ProblemPanel } from "./ProblemPanel";
import { CodeEditor } from "./CodeEditor";
import { AIChat } from "./AIChat";
import { EvaluationModal } from "./EvaluationModal";

export function InterviewRoomPage() {
  const { id = "" } = useParams();
  const session = useAsync(() => api.getSession(id), [id]);
  const { state, simulateDrop } = useRealtime(id);
  const [language, setLanguage] = useState<Language | null>(null);
  const [showEval, setShowEval] = useState(false);

  const problem = useAsync(
    () => (session.data ? api.getProblem(session.data.problemId) : Promise.reject("no session")),
    [session.data?.problemId]
  );

  if (session.loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading interview room…
      </div>
    );
  }

  // Invalid / missing session — don't hang on a spinner.
  if (session.error || !session.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">Interview not found</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {session.error ?? "This interview session doesn’t exist or is no longer available."}
        </p>
        <Link to="/app/interviews">
          <Button variant="outline"><ArrowLeft className="size-4" /> Back to interviews</Button>
        </Link>
      </div>
    );
  }

  const s = session.data;
  const activeLang = language ?? s.language;
  const starter = problem.data?.starterCode[activeLang] ?? `// Write your ${activeLang} solution here\n`;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Room header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/app/interviews">
            <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold leading-tight">{s.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar name={s.candidateName} className="size-4 text-[8px]" />
              {s.candidateName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge state={state} />
          {/* Demo control: exercise the reconnect/error-handling path */}
          <Button variant="outline" size="sm" onClick={simulateDrop} title="Simulate a dropped connection">
            <Unplug className="size-4" /> Drop
          </Button>
          <Button size="sm" onClick={() => setShowEval(true)}>
            <Sparkles className="size-4" /> Evaluate
          </Button>
        </div>
      </div>

      {/* Desktop: 3-pane split. Mobile: tabbed. */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[1fr_1.4fr_1fr]">
        <div className="min-h-0 border-r border-border">
          {problem.data && <ProblemPanel problem={problem.data} />}
        </div>
        <div className="min-h-0 border-r border-border">
          <CodeEditor sessionId={s.id} initialCode={starter} language={activeLang} onLanguageChange={setLanguage} />
        </div>
        <div className="min-h-0">
          <AIChat sessionId={s.id} />
        </div>
      </div>

      {/* Mobile tabbed layout */}
      <div className="min-h-0 flex-1 lg:hidden">
        <Tabs defaultValue="code" className="flex h-full flex-col">
          <TabsList className="m-3 self-start">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>
          <div className="min-h-0 flex-1">
            <TabsContent value="problem" className="h-full">
              {problem.data && <ProblemPanel problem={problem.data} />}
            </TabsContent>
            <TabsContent value="code" className="h-full">
              <CodeEditor sessionId={s.id} initialCode={starter} language={activeLang} onLanguageChange={setLanguage} />
            </TabsContent>
            <TabsContent value="chat" className="h-full">
              <AIChat sessionId={s.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {showEval && <EvaluationModal sessionId={s.id} onClose={() => setShowEval(false)} />}
    </div>
  );
}
