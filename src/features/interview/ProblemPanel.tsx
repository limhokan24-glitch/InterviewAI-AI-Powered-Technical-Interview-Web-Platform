import { Badge } from "@/components/ui/badge";
import type { Problem, Difficulty } from "@/services/types";

const difficultyVariant: Record<Difficulty, "success" | "warning" | "destructive"> = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
};

export function ProblemPanel({ problem }: { problem: Problem }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{problem.title}</h2>
        <Badge variant={difficultyVariant[problem.difficulty]} className="capitalize">
          {problem.difficulty}
        </Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {problem.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{problem.prompt}</p>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Examples</h3>
      <div className="space-y-3">
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="font-mono text-xs">
              <span className="text-muted-foreground">Input: </span>
              {ex.input}
            </p>
            <p className="mt-1 font-mono text-xs">
              <span className="text-muted-foreground">Output: </span>
              {ex.output}
            </p>
            {ex.explanation && (
              <p className="mt-1 text-xs text-muted-foreground">{ex.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
