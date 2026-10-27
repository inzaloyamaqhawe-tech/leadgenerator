import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { crmAuthUrl, useAuth } from "@/hooks/useAuth";
import { Wordmark } from "@/components/prospector/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Bolide Township Prospector" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => { if (!loading && user) void navigate({ to: "/" }); }, [loading, user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (signup && password !== confirm) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch(crmAuthUrl(), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: signup ? "signup" : "login", name, email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || payload.ok === false) throw new Error(payload.error || "Unable to sign in.");
      await refresh();
      toast.success(signup ? "Account created" : "Welcome back");
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-plum px-8 py-10 text-plum-foreground lg:px-14 lg:py-16">
        <Wordmark size="lg" />
        <RoofSketch />
        <div className="mt-auto pt-8">
          <h1 className="font-display text-3xl leading-tight lg:text-4xl">Township Prospector</h1>
          <p className="mt-4 max-w-md text-sm text-plum-foreground/75">One prospecting pipeline for Bolide, Airnergize Ventures, Fungi Energy and New GX.</p>
        </div>
        <p className="mt-10 text-xs text-plum-foreground/50">Standalone high-energy businesses · rooftop solar and battery on a power-purchase basis.</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="font-display text-2xl">{signup ? "Create account" : "Sign in"}</h2>
          {signup && <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
          <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={signup ? "new-password" : "current-password"} /></div>
          {signup && <div className="space-y-1.5"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /></div>}
          <Button type="submit" disabled={busy} className="w-full rounded-full bolide-gradient">{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</Button>
          <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => setSignup((value) => !value)}>{signup ? "Already registered? Sign in" : "Invited user? Create account"}</button>
          <p className="text-xs text-muted-foreground">Use the same invited account as Bolide CRM. No verification email is required.</p>
        </form>
      </div>
    </div>
  );
}

function RoofSketch(){return <div className="relative my-6 hidden min-h-72 flex-1 items-center justify-center lg:flex" aria-hidden="true"><svg viewBox="0 0 700 360" className="h-full max-h-[360px] w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><g className="prospector-sketch"><path pathLength="1" d="M90 245L350 105L610 245"/><path pathLength="1" d="M125 226V302H575V226"/><path pathLength="1" d="M350 105V302"/><path pathLength="1" d="M185 238L316 167L316 237L185 284Z"/><path pathLength="1" d="M384 167L515 238L515 284L384 237Z"/><path pathLength="1" d="M207 226L294 179M207 250L294 203M406 180L493 227M406 204L493 251"/><path pathLength="1" d="M250 202V261M450 202V261"/></g><g className="prospector-pen" fill="currentColor" stroke="none"><path d="M0 0L34 8L12 30L0 0Z"/><rect x="23" y="-2" width="58" height="16" rx="7" transform="rotate(45 23 -2)"/></g></svg></div>}
