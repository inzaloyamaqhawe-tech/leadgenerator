import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wordmark } from "@/components/prospector/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Bolide Township Prospector" },
      {
        name: "description",
        content:
          "Sign in to the Bolide Township Prospector: one prospecting pipeline for Bolide, Airnergize Ventures, Fungi Energy and New GX.",
      },
      { property: "og:title", content: "Sign in — Bolide Township Prospector" },
      {
        property: "og:description",
        content:
          "One prospecting pipeline for Bolide, Airnergize Ventures, Fungi Energy and New GX.",
      },
    ],
  }),
  component: AuthPage,
});

function passwordHint(password: string) {
  if (password.length < 8) return { label: "Too short — use at least 8 characters", tone: "weak" };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) =>
    rule.test(password),
  ).length;
  if (password.length >= 12 && variety >= 3) return { label: "Strong password", tone: "strong" };
  if (variety >= 2) return { label: "Reasonable password", tone: "medium" };
  return { label: "Weak — mix letters, numbers and symbols", tone: "weak" };
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [resetMode, setResetMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setResetMode(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && session && !resetMode) void navigate({ to: "/" });
  }, [loading, session, resetMode, navigate]);

  const hint = passwordHint(password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (!resetMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        await navigate({ to: "/" });
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        if (password !== confirm) throw new Error("The two passwords do not match");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated");
        setResetMode(false);
        await navigate({ to: "/" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-plum px-8 py-10 text-plum-foreground lg:px-14 lg:py-16">
        <Wordmark size="lg" />
        <div className="mt-10">
          <h1 className="font-display text-3xl leading-tight lg:text-4xl">Township Prospector</h1>
          <p className="mt-4 max-w-md text-sm text-plum-foreground/75">
            One prospecting pipeline for Bolide, Airnergize Ventures, Fungi Energy and New GX.
          </p>
        </div>
        <p className="mt-10 text-xs text-plum-foreground/50">
          Standalone high-energy businesses · rooftop solar and battery on a power-purchase basis.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="font-display text-2xl">
            {resetMode ? "Choose a new password" : "Sign in"}
          </h2>

          {!resetMode && (
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={resetMode ? "new-password" : "current-password"}
            />
            {resetMode && password.length > 0 && (
              <p
                className={`text-xs ${hint.tone === "strong" ? "text-greenpill-foreground" : hint.tone === "medium" ? "text-amberpill-foreground" : "text-destructive"}`}
              >
                {hint.label}
              </p>
            )}
          </div>

          {resetMode && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full rounded-full bolide-gradient">
            {busy ? "Please wait…" : resetMode ? "Update password" : "Sign in"}
          </Button>

          {resetMode ? (
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => setResetMode(false)}
            >
              Back to sign in
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Accounts and temporary passwords are issued by the Bolide administrator during
              rollout. No verification email is required.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
