import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as api from "@/services/api";
import type { IntegrityReport } from "@/services/types";

/**
 * Live cheating-detection indicator. Polls the integrity summary (paste / tab-
 * switch signals) and shows a colored risk badge with details on hover.
 */
export function IntegrityBadge({ sessionId }: { sessionId: string }) {
  const [report, setReport] = useState<IntegrityReport | null>(null);

  useEffect(() => {
    let active = true;
    const tick = () => api.getIntegrity(sessionId).then((r) => active && setReport(r)).catch(() => {});
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [sessionId]);

  if (!report) return null;

  const variant = report.level === "high" ? "destructive" : report.level === "medium" ? "warning" : "success";
  const Icon = report.level === "high" ? ShieldAlert : report.level === "medium" ? ShieldQuestion : ShieldCheck;

  return (
    <Badge variant={variant} className="gap-1.5 capitalize" title={report.signals.join("\n")}>
      <Icon className="size-3" /> Integrity: {report.level}
    </Badge>
  );
}
