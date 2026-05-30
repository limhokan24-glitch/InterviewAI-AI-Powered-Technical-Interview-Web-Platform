import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
