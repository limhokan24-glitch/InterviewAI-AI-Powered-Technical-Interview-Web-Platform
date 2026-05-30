import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/misc";
import type { ConnectionState } from "@/services/types";

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  if (state === "connected")
    return (
      <Badge variant="success" className="gap-1.5">
        <StatusDot pulse /> Live
      </Badge>
    );
  if (state === "reconnecting")
    return (
      <Badge variant="warning" className="gap-1.5">
        <Loader2 className="size-3 animate-spin" /> Reconnecting…
      </Badge>
    );
  if (state === "connecting")
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Wifi className="size-3" /> Connecting…
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1.5">
      <WifiOff className="size-3" /> Offline
    </Badge>
  );
}
