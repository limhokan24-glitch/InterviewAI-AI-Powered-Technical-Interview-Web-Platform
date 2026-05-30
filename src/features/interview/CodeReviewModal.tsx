import { useEffect, useState } from "react";
import { ScanLine, Loader2, X, AlertTriangle, Lightbulb, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as api from "@/services/api";
import type { CodeReview, Language, ReviewComment } from "@/services/types";
import { cn } from "@/lib/utils";

const severityMeta: Record<ReviewComment["severity"], { icon: typeof Info; color: string; label: string }> = {
  warning: { icon: AlertTriangle, color: "text-warning", label: "Warning" },
  suggestion: { icon: Lightbulb, color: "text-primary", label: "Suggestion" },
  info: { icon: Info, color: "text-muted-foreground", label: "Note" },
};

export function CodeReviewModal({
  sessionId,
  language,
  code,
  onClose,
}: {
  sessionId: string;
  language: Language;
  code: string;
  onClose: () => void;
}) {
  const [review, setReview] = useState<CodeReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .reviewCode(sessionId, language, code)
      .then((r) => active && setReview(r))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [sessionId, language, code]);

  const ratingColor = !review
    ? ""
    : review.rating >= 80
    ? "text-success"
    : review.rating >= 50
    ? "text-warning"
    : "text-destructive";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ScanLine className="size-5 text-primary" /> AI Code Review
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Couldn’t complete the review: {error}</p>
            </div>
          ) : !review ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Reviewing your code…</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
                <p className="max-w-sm text-sm leading-relaxed">{review.summary}</p>
                <div className="text-right">
                  <p className={cn("text-3xl font-bold tabular-nums", ratingColor)}>{review.rating}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{review.comments.length} observations</p>
                {review.comments.map((c, i) => {
                  const meta = severityMeta[c.severity];
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex gap-3 rounded-md border border-border p-3">
                      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">{meta.label}</Badge>
                          {c.line != null && <span className="text-xs text-muted-foreground">line {c.line}</span>}
                        </div>
                        <p className="text-sm">{c.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full" onClick={onClose}>Got it</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
