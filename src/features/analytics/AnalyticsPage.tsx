import { Users, Trophy, CheckCircle2, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { useAsync } from "@/lib/useAsync";
import * as api from "@/services/api";

const PIE_COLORS = ["#818cf8", "#4ade80", "#fbbf24", "#f87171", "#38bdf8"];

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function AnalyticsPage() {
  const stats = useAsync(() => api.getDashboardStats());
  const series = useAsync(() => api.getTimeseries());
  const dist = useAsync(() => api.getScoreDistribution());
  const langs = useAsync(() => api.getLanguageUsage());

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance, coding metrics, and AI evaluation results.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading || !stats.data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Total Candidates" value={stats.data.totalCandidates} icon={Users} />
            <StatCard label="Pass Rate" value={`${stats.data.passRate}%`} icon={CheckCircle2} accent="text-success" delta="+5%" trend="up" />
            <StatCard label="Avg Score" value={`${stats.data.avgScore}%`} icon={Trophy} accent="text-warning" />
            <StatCard label="Interviews" value={stats.data.totalInterviews} icon={Activity} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Avg score trend */}
        <Card>
          <CardHeader>
            <CardTitle>Average Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {series.loading || !series.data ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={series.data} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="avgScore" stroke="#4ade80" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {dist.loading || !dist.data ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={dist.data} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Language usage pie */}
        <Card>
          <CardHeader>
            <CardTitle>Language Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {langs.loading || !langs.data ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={langs.data} dataKey="value" nameKey="language" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {langs.data.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Interview volume bars */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Interview Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {series.loading || !series.data ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={series.data} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="interviews" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
