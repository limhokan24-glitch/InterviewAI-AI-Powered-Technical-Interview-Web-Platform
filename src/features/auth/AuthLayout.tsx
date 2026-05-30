import type { ReactNode } from "react";
import { Bot, Code2, Sparkles } from "lucide-react";

/** Split-screen shell shared by login and register pages. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand / value panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600/20 via-background to-background p-12 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
          InterviewAI
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            AI-powered technical interviews, at scale.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Run live coding interviews with a real-time AI interviewer, an in-browser editor, and
            automated evaluation — all in one platform.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              { icon: Bot, label: "Real-time streaming AI conversation" },
              { icon: Code2, label: "In-browser multi-language code editor" },
              { icon: Sparkles, label: "Automated scoring & feedback" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </div>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Incubation Center — B12 S5 · Advanced Web Engineering Project
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
