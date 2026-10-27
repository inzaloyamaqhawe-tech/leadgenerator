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

function RoofSketch(){const art=`${import.meta.env.BASE_URL}prospector-mall-lineart.png`;const drawPath="M170 28L530 28L530 82L170 82L170 136L530 136L530 190L170 190L170 244L530 244L530 298L170 298L170 352L530 352L530 406L170 406L170 470L530 470";return <div className="relative my-3 hidden min-h-72 flex-1 items-center justify-center lg:flex" aria-hidden="true">
  <svg viewBox="0 0 700 520" className="h-full max-h-[460px] w-full overflow-visible text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
   <defs><mask id="prospector-draw-mask" maskUnits="userSpaceOnUse"><path pathLength="1" d={drawPath} className="prospector-reveal-stroke"/></mask></defs>
   <image href={art} x="150" y="0" width="400" height="500" preserveAspectRatio="xMidYMid meet" mask="url(#prospector-draw-mask)"/>
   <g className="prospector-sun-rays" strokeWidth="3" opacity=".42"><path d="M286 3V18M286 101V116M229 59H244M328 59H343M246 19L257 30M316 88L327 99M326 19L315 30M257 88L246 99"/></g>
   <g className="prospector-pen" style={{offsetPath:`path('${drawPath}')`}}><g transform="translate(-70 -12) scale(.58)" strokeWidth="4"><rect x="0" y="0" width="78" height="24" rx="9" fill="#2b1b24"/><path d="M78 0L104 12L78 24Z" fill="white"/><path d="M104 12L113 12"/><path d="M12 0V-9H58"/><path d="M18 7H62" opacity=".65"/></g></g>
  </svg>
 </div>}
