import { Link } from "@tanstack/react-router";
import { BarChart3, Building2, KanbanSquare, MapPinned, RefreshCw, ShieldCheck, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useAuth } from "@/hooks/useAuth";

export type ProspectorSection="Dashboard"|"Leads"|"Work board"|"Utility map"|"CRM sync";
const items:[ProspectorSection,typeof BarChart3][]=[
 ["Dashboard",BarChart3],["Leads",Building2],["Work board",KanbanSquare],["Utility map",MapPinned],["CRM sync",RefreshCw],
];

export function ProspectorSidebar({section,onSection,compact,onToggle}:{section:ProspectorSection;onSection:(value:ProspectorSection)=>void;compact:boolean;onToggle:()=>void}){
 const {profile,isAdmin,signOut}=useAuth();
 return <aside className={`hidden min-h-screen shrink-0 flex-col border-r border-line bg-card transition-[width] duration-200 lg:flex ${compact?"w-20":"w-64"}`}>
  <div className={`flex h-24 items-center border-b border-line ${compact?"justify-center px-3":"px-6"}`}>
   {compact?<img src={`${import.meta.env.BASE_URL}faviconbolide.png`} className="h-11 w-11 object-contain" alt="Bolide"/>:<Wordmark/>}
  </div>
  <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Township Prospector sections">
   {items.map(([label,Icon])=><button key={label} type="button" onClick={()=>onSection(label)} title={compact?label:undefined} className={`group relative flex items-center rounded-xl py-3 text-sm font-semibold transition ${compact?"justify-center px-2":"gap-3 px-3"} ${section===label?"bolide-gradient text-white shadow-sm":"text-muted-foreground hover:bg-soft hover:text-foreground"}`}>
    <Icon className="h-5 w-5 shrink-0"/><span className={compact?"hidden":""}>{label}</span>
    {compact&&<span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-xl group-hover:block">{label}</span>}
   </button>)}
   {isAdmin&&<Link to="/admin" title={compact?"Team admin":undefined} className={`group relative flex items-center rounded-xl py-3 text-sm font-semibold text-muted-foreground transition hover:bg-soft hover:text-foreground ${compact?"justify-center px-2":"gap-3 px-3"}`}><ShieldCheck className="h-5 w-5"/><span className={compact?"hidden":""}>Team admin</span>{compact&&<span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-xl group-hover:block">Team admin</span>}</Link>}
  </nav>
  <button type="button" onClick={onToggle} className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-xl border border-line p-2.5 text-sm font-semibold hover:bg-soft" title={compact?"Show menu names":"Hide menu names"}>{compact?<PanelLeftOpen className="h-5 w-5"/>:<><PanelLeftClose className="h-5 w-5"/>Hide menu names</>}</button>
  <div className={`border-t border-line p-3 ${compact?"text-center":""}`}>
   <div className={`mb-2 ${compact?"text-xs font-bold":"text-sm font-semibold"}`}>{compact?(profile?.full_name||profile?.email||"U").slice(0,2).toUpperCase():profile?.full_name||profile?.email}</div>
   <button type="button" onClick={()=>void signOut()} title="Sign out" className={`flex w-full items-center rounded-xl p-2 text-xs text-muted-foreground hover:bg-soft ${compact?"justify-center":"gap-2"}`}><LogOut className="h-4 w-4"/>{!compact&&"Sign out"}</button>
  </div>
 </aside>;
}
