import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

/** Small colored status dot used for live/connection indicators. */
export function StatusDot({ color = "success", pulse = true }: { color?: "success" | "warning" | "destructive" | "muted-foreground"; pulse?: boolean }) {
  const map: Record<string, string> = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    "muted-foreground": "bg-muted-foreground",
  };
  return (
    <span className={cn("inline-block size-2 rounded-full", map[color], pulse && "animate-pulse-dot")} />
  );
}
