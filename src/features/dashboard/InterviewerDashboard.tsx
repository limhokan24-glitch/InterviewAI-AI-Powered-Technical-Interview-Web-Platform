import {
  Activity,
  Users,
  Trophy,
  CheckCircle2,
  PlayCircle,
  Code2,
  Sparkles,
  UserPlus,
  Video,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/misc";
import { useAsync } from "@/lib/useAsync";
import { timeAgo } from "@/lib/utils";
import * as api from "@/services/api";
import type { ActivityEvent } from "@/services/types";
import { QuickLink } from "./shared";

const activityIcon: Record<ActivityEvent["type"], typeof Code2> = {
  session_started: PlayCircle,
  session_completed: CheckCircle2,
  code_run: Code2,
  evaluation: Sparkles,
  joined: UserPlus,
};

/** System-wide overview for interviewers: every candidate, every session. */
export function InterviewerDashboard({ firstName }: { firstName?: string }) {
  const stats = useAsync(() => api.getDashboardStats());
  const series = useAsync(() => api.getTimeseries());
  const activity = useAsync(() => api.getActivity());

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
        <p className="text-muted-foreground">Here’s what’s happening across your interviews.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading || !stats.data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Interviews" value={stats.data.totalInterviews} icon={Activity} delta="+12%" trend="up" />
            <StatCard label="Active Sessions" value={stats.data.activeSessions} icon={PlayCircle} accent="text-success" />
            <StatCard label="Avg Score" value={`${stats.data.avgScore}%`} icon={Trophy} delta="+3%" trend="up" accent="text-warning" />
            <StatCard label="Candidates" value={stats.data.totalCandidates} icon={Users} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Interview Volume — last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {series.loading || !series.data ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={series.data} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="interviews" stroke="var(--primary)" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Activity</CardTitle>
            <Badge variant="success">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.loading || !activity.data ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)
            ) : (
              activity.data.map((ev) => {
                const Icon = activityIcon[ev.type];
                return (
                  <div key={ev.id} className="flex gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{ev.message}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(ev.at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/app/analytics" className="block pt-1 text-sm font-medium text-primary hover:underline">
              View all analytics →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/app/interviews" icon={Video} title="Start an Interview" desc="Create a room and invite a candidate" />
        <QuickLink to="/app/interviews" icon={Users} title="View Candidates" desc="Browse session history & scores" />
        <QuickLink to="/app/analytics" icon={Sparkles} title="AI Evaluations" desc="Review automated scoring breakdowns" />
      </div>
    </div>
  );
}
