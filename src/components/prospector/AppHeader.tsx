import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/prospector/Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { useEffect,useState } from "react";

export function AppHeader({ onAddLead,onAddArea,onOpenNav,compactNav,onToggleCompactNav }: { onAddLead: () => void;onAddArea: () => void;onOpenNav:()=>void;compactNav:boolean;onToggleCompactNav:()=>void }) {
  const { profile, signOut, canEdit } = useAuth();
  const [dark,setDark]=useState(()=>localStorage.getItem("bolide-prospector:theme")==="dark");
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark);localStorage.setItem("bolide-prospector:theme",dark?"dark":"light");},[dark]);

  return (
    <header className="shrink-0 border-b border-line bg-card">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Button variant="outline" size="icon" className="rounded-xl lg:hidden" onClick={onOpenNav} aria-label="Open menu"><Menu className="h-5 w-5"/></Button>
        <Button variant="outline" size="icon" className="hidden rounded-xl lg:inline-flex" onClick={onToggleCompactNav} title={compactNav?"Show menu names":"Hide menu names"} aria-label={compactNav?"Show menu names":"Hide menu names"}>{compactNav?<PanelLeftOpen className="h-5 w-5"/>:<PanelLeftClose className="h-5 w-5"/>}</Button>
        <Link to="/" aria-label="Bolide home" className="lg:hidden">
          <Wordmark />
        </Link>
        <div className="hidden h-10 w-px bg-line sm:block lg:hidden" />
        <div className="min-w-0">
          <h1 className="font-display text-lg leading-tight">Township Prospector</h1>
          <p className="text-xs text-muted-foreground">Standalone high-energy businesses</p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={()=>setDark(value=>!value)} title={dark?"Use light mode":"Use dark mode"} aria-label={dark?"Use light mode":"Use dark mode"}>{dark?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</Button>
          <Button variant="outline" className="rounded-full" asChild>
            <a href="https://bolide.co.za/crm/" target="_blank" rel="noreferrer">
              Open CRM
            </a>
          </Button>
          {canEdit && (
            <Button variant="outline" className="rounded-full" onClick={onAddLead}>
              Add lead
            </Button>
          )}
          {canEdit && (
            <Button className="rounded-full bolide-gradient" onClick={onAddArea}>
              Add area
            </Button>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted-foreground sm:w-auto sm:border-0 sm:pt-0 lg:hidden">
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
