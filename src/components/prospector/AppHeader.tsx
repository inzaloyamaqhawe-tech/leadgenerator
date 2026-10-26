import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/prospector/Wordmark";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader({ onAddLead }: { onAddLead: () => void }) {
  const { profile, signOut, canEdit } = useAuth();

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <Link to="/" aria-label="Bolide home">
          <Wordmark />
        </Link>
        <div className="hidden h-10 w-px bg-line sm:block" />
        <div className="min-w-0">
          <h1 className="font-display text-lg leading-tight">Township Prospector</h1>
          <p className="text-xs text-muted-foreground">Standalone high-energy businesses</p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <a href="https://bolide.co.za/crm/" target="_blank" rel="noreferrer">
              Open CRM
            </a>
          </Button>
          {canEdit && (
            <Button className="rounded-full bolide-gradient" onClick={onAddLead}>
              Add lead
            </Button>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted-foreground sm:w-auto sm:border-0 sm:pt-0">
          <span>
            Signed in as {profile?.full_name || profile?.email} · {profile?.team}
          </span>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
