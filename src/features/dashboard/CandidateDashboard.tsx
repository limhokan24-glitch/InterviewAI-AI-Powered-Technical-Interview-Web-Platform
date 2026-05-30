import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Award,
  ClipboardList,
  CalendarClock,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Code2,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, StatusDot } from "@/components/ui/misc";
import { useAsync } from "@/lib/useAsync";
import { timeAgo } from "@/lib/utils";
import * as api from "@/services/api";
import { problems } from "@/services/mock/data";
import type { InterviewSession, SessionStatus } from "@/services/types";
import { QuickLink } from "./shared";

const statusVariant: Record<SessionStatus, "default" | "success" | "secondary" | "destructive"> = {
  active: "success",
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

/** Personal overview for candidates: only their own interviews and results. */
export function CandidateDashboard({ firstName }: { firstName?: string }) {
  const { data: sessions, loading } = useAsync(() => api.listSessions());

  const { taken, avgScore, bestScore, upcoming, completed, active, perf } = useMemo(() => {
    const list = sessions ?? [];
    const done = list.filter((s) => s.status === "completed" && s.score != null);
    const scores = done.map((s) => s.score!);
    return {
      taken: done.length,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      bestScore: scores.length ? Math.max(...scores) : 0,
      active: list.filter((s) => s.status === "active"),
      upcoming: list.filter((s) => s.status === "scheduled"),
      completed: [...done].sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0)),
      perf: [...done]
        .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0))
        .map((s, i) => ({ label: `#${i + 1}`, score: s.score! })),
    };
  }, [sessions]);

  const next = active[0] ?? upcoming[0];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
        <p className="text-muted-foreground">Track your interviews, scores, and AI feedback.</p>
      </div>

      {/* Resume / next interview banner */}
      {next && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 to-transparent">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <PlayCircle className="size-6" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {next.status === "active" ? (
                    <>
                      <StatusDot pulse /> Interview in progress
                    </>
                  ) : (
                    <>
                      <CalendarClock className="size-4 text-muted-foreground" /> Upcoming interview
                    </>
                  )}
                </p>
                <p className="font-semibold">{next.title}</p>
              </div>
            </div>
            <Link to={`/app/interviews/${next.id}`}>
              <Button>
                {next.status === "active" ? "Resume" : "Join"} <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Personal stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Interviews Taken" value={taken} icon={ClipboardList} />
            <StatCard label="Average Score" value={`${avgScore}%`} icon={Trophy} accent="text-warning" />
            <StatCard label="Best Score" value={`${bestScore}%`} icon={Award} accent="text-success" />
            <StatCard label="Upcoming" value={active.length + upcoming.length} icon={CalendarClock} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal performance trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64" />
            ) : perf.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No scores yet"
                desc="Complete your first interview to see your performance trend here."
              />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={perf} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Your interviews list */}
        <Card>
          <CardHeader>
            <CardTitle>Your Interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : (
              <>
                {[...active, ...upcoming, ...completed].slice(0, 5).map((s) => (
                  <InterviewRow key={s.id} session={s} />
                ))}
                <Link to="/app/interviews" className="block pt-1 text-sm font-medium text-primary hover:underline">
                  View all interviews →
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidate quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/app/interviews" icon={PlayCircle} title="Join an Interview" desc="Enter a scheduled or active room" />
        <QuickLink to="/app/interviews" icon={BookOpen} title="Practice Problems" desc="Sharpen your skills before the real thing" />
        <QuickLink to="/app/analytics" icon={Sparkles} title="Your AI Feedback" desc="Review scores & improvement tips" />
      </div>
    </div>
  );
}

function InterviewRow({ session }: { session: InterviewSession }) {
  const problem = problems.find((p) => p.id === session.problemId);
  return (
    <Link to={`/app/interviews/${session.id}`} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Code2 className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{session.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {problem?.title} · {timeAgo(session.createdAt)}
        </p>
      </div>
      {session.score != null ? (
        <span className="text-sm font-semibold tabular-nums">{session.score}%</span>
      ) : (
        <Badge variant={statusVariant[session.status]} className="shrink-0 capitalize">
          {session.status === "active" && <StatusDot pulse />}
          <span className="ml-1">{session.status}</span>
        </Badge>
      )}
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: typeof Trophy; title: string; desc: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
