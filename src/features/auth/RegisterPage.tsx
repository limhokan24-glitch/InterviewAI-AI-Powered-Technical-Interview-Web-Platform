import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Role } from "@/services/types";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("candidate");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      navigate("/app", { replace: true });
    } catch {
      /* error surfaced via store */
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-sm text-muted-foreground">Start running AI technical interviews.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); clearError(); }} placeholder="Jane Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} placeholder="At least 6 characters" />
        </div>

        <div className="space-y-2">
          <Label>I am a…</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["candidate", "interviewer"] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors",
                  role === r ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
