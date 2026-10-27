import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLeads, useRealtimeSync, useUtilityRules } from "@/hooks/useProspectorData";
import { ROOFTOP_OPTIONS, STATUSES, type Lead } from "@/lib/prospector";
import { prospectorApi } from "@/lib/prospector-api";
import { AppHeader } from "@/components/prospector/AppHeader";
import { LeadsTable } from "@/components/prospector/LeadsTable";
import { PipelineBoard } from "@/components/prospector/PipelineBoard";
import { UtilityMapTab } from "@/components/prospector/UtilityMapTab";
import { CrmTab } from "@/components/prospector/CrmTab";
import { LeadDrawer } from "@/components/prospector/LeadDrawer";
import { AddLeadDialog } from "@/components/prospector/AddLeadDialog";
import { ProspectorDashboard } from "@/components/prospector/ProspectorDashboard";
import { ProspectorSidebar, type ProspectorSection } from "@/components/prospector/ProspectorSidebar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Township Prospector — Bolide" },
      {
        name: "description",
        content:
          "Find and work standalone high-energy township businesses as rooftop solar and battery PPA leads.",
      },
      { property: "og:title", content: "Township Prospector — Bolide" },
      {
        property: "og:description",
        content:
          "Find and work standalone high-energy township businesses as rooftop solar and battery PPA leads.",
      },
    ],
  }),
  component: Prospector,
});

const TABS:ProspectorSection[] = ["Dashboard","Leads", "Work board", "Utility map", "CRM sync"];

function Prospector() {
  useRealtimeSync();
  const { user, isAdmin, canEdit } = useAuth();
  const { data: leads = [], isLoading } = useLeads();
  const { data: rules = [] } = useUtilityRules();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<ProspectorSection>("Dashboard");
  const [compactNav,setCompactNav]=useState(()=>localStorage.getItem("bolide-prospector:compact-nav")==="1");
  const [area, setArea] = useState<string>("All areas");
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [presetTownship, setPresetTownship] = useState<string | undefined>(undefined);

  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("any");
  const [supplier, setSupplier] = useState("any");
  const [tier, setTier] = useState("any");
  const [status, setStatus] = useState("any");
  const [roof, setRoof] = useState("any");
  const [standaloneOnly, setStandaloneOnly] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bolide.area");
    if (saved) setArea(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("bolide.area", area);
  }, [area]);
  function toggleCompactNav(){setCompactNav(value=>{const next=!value;localStorage.setItem("bolide-prospector:compact-nav",next?"1":"0");return next;});}

  const areas = useMemo(
    () => Array.from(new Set(leads.map((l) => l.township).filter(Boolean))).sort(),
    [leads],
  );
  const industries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.industry).filter(Boolean))).sort(),
    [leads],
  );
  const suppliers = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.electricity_provider).filter((v): v is string => !!v)),
      ).sort(),
    [leads],
  );

  const areaLeads = useMemo(
    () => (area === "All areas" ? leads : leads.filter((l) => l.township === area)),
    [leads, area],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return areaLeads
      .filter((l) => {
        if (needle) {
          const hay = [
            l.business_name,
            l.address,
            l.brand,
            l.suburb,
            l.township,
            l.owner_operator,
            l.industry,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (industry !== "any" && l.industry !== industry) return false;
        if (supplier !== "any" && l.electricity_provider !== supplier) return false;
        if (tier !== "any" && l.tier !== tier) return false;
        if (status !== "any" && l.status !== status) return false;
        if (roof !== "any" && (l.rooftop_solar ?? "unknown") !== roof) return false;
        if (standaloneOnly && l.standalone !== true) return false;
        if (hasPhone && !l.phone) return false;
        if (mine && l.owner_user !== user?.id) return false;
        return true;
      })
      .sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0) || a.business_name.localeCompare(b.business_name),
      );
  }, [
    areaLeads,
    q,
    industry,
    supplier,
    tier,
    status,
    roof,
    standaloneOnly,
    hasPhone,
    mine,
    user?.id,
  ]);

  const kpis = useMemo(() => {
    const count = (fn: (l: Lead) => boolean) => areaLeads.filter(fn).length;
    return {
      total: areaLeads.length,
      tierA: count((l) => l.tier === "A"),
      eskom: count((l) => l.electricity_provider === "Eskom"),
      roofs: count((l) => (l.rooftop_solar ?? "unknown") === "unknown"),
      talking: count((l) => ["Contacted", "Follow-up"].includes(l.status)),
      won: count((l) => l.status === "Interested"),
    };
  }, [areaLeads]);

  async function changeStatus(id: string, newStatus: string) {
    const lead = leads.find((row) => row.id === id);
    if (!lead) return;
    if (newStatus === "Interested") {
      setSelected(id);
      toast.info(
        "Open the lead and use Move to CRM pipeline so an owner and duplicate decision are recorded.",
      );
      return;
    }
    try {
      await prospectorApi("update", {
        leadId: id,
        version: lead.version,
        patch: { status: newStatus },
        activityText: `Status changed to ${newStatus}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the status");
    }
  }

  const selectedLead = leads.find((l) => l.id === selected) ?? null;

  return (
    <div className="flex min-h-screen bg-background">
      <ProspectorSidebar section={tab} onSection={setTab} compact={compactNav} onToggle={toggleCompactNav}/>
      <div className="min-w-0 flex-1">
       <AppHeader onAddLead={() => setAddOpen(true)} />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-2 lg:hidden" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm ${
                tab === t
                  ? "bg-plum text-plum-foreground"
                  : "border border-line bg-card hover:bg-soft"
              }`}
            >
              {t}
            </button>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full border border-line bg-card px-4 py-2 text-sm hover:bg-soft"
            >
              Admin
            </Link>
          )}
        </nav>

        {tab === "Dashboard"&&<ProspectorDashboard leads={leads} onArea={value=>{setArea(value);setTab("Leads");}} onOpen={setSelected}/>}

        {tab!=="Dashboard"&&<><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-xl bg-plum p-4 text-plum-foreground sm:col-span-2 lg:col-span-1">
            <div className="text-xs opacity-80">Leads</div>
            <div className="num bolide-gradient-text text-4xl font-bold">{kpis.total}</div>
          </div>
          <Kpi label="Tier A priority" value={kpis.tierA} />
          <Kpi label="Eskom-supplied" hint="load reduction risk" value={kpis.eskom} />
          <Kpi label="Roofs still to check" value={kpis.roofs} />
          <Kpi label="In conversation" value={kpis.talking} />
          <Kpi label="Moved to CRM" value={kpis.won} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={area === "All areas"} onClick={() => setArea("All areas")}>
            All areas ({leads.length})
          </Chip>
          {areas.map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(a)}>
              {a} ({leads.filter((l) => l.township === a).length})
            </Chip>
          ))}
          {canEdit && (
            <Chip
              active={false}
              onClick={() => {
                setPresetTownship("");
                setAddOpen(true);
              }}
            >
              + Add area
            </Chip>
          )}
        </div></>}

        {(tab === "Leads" || tab === "Work board") && (
          <div className="grid gap-3 rounded-xl border border-line bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
            <Input
              placeholder="Search businesses"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="md:col-span-3 lg:col-span-2"
              aria-label="Search leads"
            />
            <Filter value={industry} onChange={setIndustry} label="Industry" options={industries} />
            <Filter value={supplier} onChange={setSupplier} label="Supplier" options={suppliers} />
            <Filter value={tier} onChange={setTier} label="Tier" options={["A", "B", "C"]} />
            <Filter value={status} onChange={setStatus} label="Status" options={[...STATUSES]} />
            <div className="lg:col-span-2">
              <Select value={roof} onValueChange={setRoof}>
                <SelectTrigger aria-label="Rooftop solar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Rooftop solar: any</SelectItem>
                  {ROOFTOP_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.value === "unknown" ? "Not yet checked" : o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm md:col-span-3 lg:col-span-4">
              <Toggle
                label="Standalone only"
                checked={standaloneOnly}
                onChange={setStandaloneOnly}
              />
              <Toggle label="Has phone" checked={hasPhone} onChange={setHasPhone} />
              <Toggle label="Mine" checked={mine} onChange={setMine} />
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading leads…</p>}

        {tab === "Leads" && <LeadsTable leads={filtered} onSelect={setSelected} />}
        {tab === "Work board" && (
          <PipelineBoard
            leads={filtered}
            onSelect={setSelected}
            canEdit={canEdit}
            onStatusChange={(id, s) => void changeStatus(id, s)}
          />
        )}
        {tab === "Utility map" && <UtilityMapTab />}
        {tab === "CRM sync" && <CrmTab />}
      </main>

      </div>

      <LeadDrawer lead={selectedLead} rules={rules} onClose={() => setSelected(null)} />
      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        areas={areas}
        presetTownship={presetTownship}
        onCreated={(id) => setSelected(id)}
      />
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num text-2xl font-bold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs ${
        active
          ? "bolide-gradient text-primary-foreground"
          : "border border-line bg-card hover:bg-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>{label}</span>
    </label>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">{label}: any</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
