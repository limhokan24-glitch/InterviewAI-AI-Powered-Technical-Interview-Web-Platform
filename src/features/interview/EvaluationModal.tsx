import { useEffect, useState } from "react";
import { Sparkles, Loader2, X, ThumbsUp, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as api from "@/services/api";
import type { Evaluation } from "@/services/types";
import { cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171";
  const circ = 2 * Math.PI * 42;
  return (
    <div className="relative size-28">
      <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function EvaluationModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [evalData, setEvalData] = useState<Evaluation | null>(null);

  useEffect(() => {
    let active = true;
    api.getEvaluation(sessionId).then((e) => active && setEvalData(e));
    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-primary" /> AI Evaluation
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
          </div>

          {!evalData ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing the interview & generating feedback…</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <ScoreRing score={evalData.overall} />
                <div className="flex-1 space-y-3">
                  <Metric label="Correctness" value={evalData.correctness} />
                  <Metric label="Efficiency" value={evalData.efficiency} />
                  <Metric label="Code Quality" value={evalData.codeQuality} />
                  <Metric label="Communication" value={evalData.communication} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm leading-relaxed">{evalData.summary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-success">
                    <ThumbsUp className="size-4" /> Strengths
                  </h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {evalData.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
                    <TrendingUp className="size-4" /> Areas to Improve
                  </h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {evalData.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              </div>

              <Button className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
