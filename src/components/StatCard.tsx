import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  accent?: string;
}

export function StatCard({ label, value, icon: Icon, delta, trend = "neutral", accent = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 items-center justify-center rounded-lg bg-primary/10", accent)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {delta && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {delta}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
