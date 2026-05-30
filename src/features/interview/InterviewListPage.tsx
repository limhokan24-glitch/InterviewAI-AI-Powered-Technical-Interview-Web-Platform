import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Plus, Clock, Trophy, Loader2, X, Sparkles, Library, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton, StatusDot } from "@/components/ui/misc";
import { useAsync } from "@/lib/useAsync";
import { timeAgo } from "@/lib/utils";
import * as api from "@/services/api";
import { problems } from "@/services/mock/data";
import { cn } from "@/lib/utils";
import type { InterviewSession, Language, SessionStatus, Difficulty, Problem } from "@/services/types";

const statusVariant: Record<SessionStatus, "default" | "success" | "secondary" | "destructive"> = {
  active: "success",
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function InterviewListPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading } = useAsync(() => api.listSessions(), [refreshKey]);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-muted-foreground">Create rooms, join active sessions, and review history.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          New Interview
        </Button>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateInterviewModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setRefreshKey((k) => k + 1);
            navigate(`/app/interviews/${id}`);
          }}
        />
      )}
    </div>
  );
}

function SessionCard({ session }: { session: InterviewSession }) {
  const problem = problems.find((p) => p.id === session.problemId);
  return (
    <Link to={`/app/interviews/${session.id}`}>
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{session.title}</h3>
            <Badge variant={statusVariant[session.status]} className="shrink-0 capitalize">
              {session.status === "active" && <StatusDot pulse />}
              <span className="ml-1">{session.status}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={session.candidateName} className="size-7 text-xs" />
            <span className="text-sm text-muted-foreground">{session.candidateName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{problem?.title ?? "Problem"}</Badge>
            <Badge variant="outline" className="capitalize">{session.language}</Badge>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(session.createdAt)}
            </span>
            {session.score != null && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Trophy className="size-3 text-warning" />
                {session.score}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

type ProblemSource = "library" | "ai";

function CreateInterviewModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [submitting, setSubmitting] = useState(false);

  // Problem source: pick from the library, or generate one with AI.
  const [source, setSource] = useState<ProblemSource>("library");
  const [libraryId, setLibraryId] = useState(problems[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Problem | null>(null);

  async function generate() {
    setGenerating(true);
    try {
      const p = await api.generateChallenge({ difficulty, topic: topic.trim() || undefined });
      setGenerated(p);
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // In AI mode, generate a challenge first if the user hasn't previewed one.
      let problemId = libraryId;
      if (source === "ai") {
        const p = generated ?? (await api.generateChallenge({ difficulty, topic: topic.trim() || undefined }));
        problemId = p.id;
      }
      const s = await api.createSession({ title: title || "Untitled Interview", candidateName: candidateName || "Anonymous", problemId, language });
      onCreated(s.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Video className="size-5 text-primary" /> New Interview
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Interview title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend Engineer — Round 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidate name</Label>
              <Input id="candidate" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Jane Doe" />
            </div>
            {/* Problem source toggle */}
            <div className="space-y-2">
              <Label>Problem</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "library", label: "Library", icon: Library },
                  { key: "ai", label: "AI-generated", icon: Sparkles },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSource(key)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      source === key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {source === "library" ? (
              <Select value={libraryId} onChange={(e) => setLibraryId(e.target.value)}>
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} · {p.difficulty}</option>
                ))}
              </Select>
            ) : (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Difficulty</Label>
                    <Select value={difficulty} onChange={(e) => { setDifficulty(e.target.value as Difficulty); setGenerated(null); }}>
                      {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Topic (optional)</Label>
                    <Input value={topic} onChange={(e) => { setTopic(e.target.value); setGenerated(null); }} placeholder="e.g. graphs" />
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={generate} disabled={generating}>
                  {generating ? <Loader2 className="size-4 animate-spin" /> : generated ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
                  {generating ? "Generating…" : generated ? "Regenerate" : "Generate challenge"}
                </Button>
                {generated && (
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="capitalize">{generated.difficulty}</Badge>
                      <p className="text-sm font-medium">{generated.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{generated.prompt}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                {(["javascript", "typescript", "python", "java", "cpp", "go"] as Language[]).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || generating}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {source === "ai" && !generated ? "Generate & Join" : "Create & Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
