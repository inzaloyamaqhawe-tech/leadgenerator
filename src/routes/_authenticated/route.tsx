import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/prospector/Wordmark";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const response = await fetch(`${window.location.origin}/crm/api/auth.php`, { credentials: "same-origin" });
    if (!response.ok) throw redirect({ to: "/auth" });
    const payload = (await response.json()) as { user?: unknown };
    if (!payload.user) throw redirect({ to: "/auth" });
    return { user: payload.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, profile, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (profile && !profile.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <Wordmark size="lg" />
        <h1 className="font-display text-2xl">Your access has been paused</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your access has been paused — contact the administrator.
        </p>
        <Button variant="outline" className="rounded-full" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
