import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
}

/** Generates a deterministic accent color from a name. */
function colorFromName(name: string) {
  const colors = [
    "bg-indigo-500/20 text-indigo-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
    "bg-sky-500/20 text-sky-400",
    "bg-violet-500/20 text-violet-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-medium select-none",
        colorFromName(name),
        className ?? "h-9 w-9 text-sm"
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
