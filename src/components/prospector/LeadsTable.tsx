import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/prospector";
import { ProviderPill, RoofPill, StatusPill, TierBadge } from "@/components/prospector/pills";
import { Button } from "@/components/ui/button";

export function LeadsTable({ leads, onSelect }: { leads: Lead[]; onSelect: (id: string) => void }) {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(leads.length / pageSize));
  useEffect(() => setPage(1), [leads, pageSize]);
  const visible = useMemo(() => leads.slice((page - 1) * pageSize, page * pageSize), [leads,page,pageSize]);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card p-10 text-center text-sm text-muted-foreground">
        No leads match these filters yet.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--line)]">
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3">Tier</th>
              <th className="px-3 py-3">Business</th>
              <th className="px-3 py-3">Industry</th>
              <th className="px-3 py-3">Area</th>
              <th className="px-3 py-3">Electricity</th>
              <th className="px-3 py-3">Water</th>
              <th className="px-3 py-3">Roof solar</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr
                key={l.id}
                tabIndex={0}
                role="button"
                onClick={() => onSelect(l.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(l.id);
                  }
                }}
                className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-soft focus:bg-soft focus:outline-none"
              >
                <td className="px-3 py-3">
                  <TierBadge tier={l.tier} score={l.score} />
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium">{l.business_name}</div>
                  <div className="text-xs text-muted-foreground">{l.address}</div>
                </td>
                <td className="px-3 py-3">
                  <div>{l.industry}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.standalone === false
                      ? "In centre"
                      : l.standalone === null
                        ? "Standalone?"
                        : ""}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div>{l.township}</div>
                  <div className="text-xs text-muted-foreground">{l.suburb}</div>
                </td>
                <td className="px-3 py-3">
                  <ProviderPill value={l.electricity_provider} />
                </td>
                <td className="px-3 py-3 text-xs">{l.water_provider ?? "—"}</td>
                <td className="px-3 py-3">
                  <RoofPill value={l.rooftop_solar} />
                </td>
                <td className="num px-3 py-3 text-xs">{l.phone ?? "—"}</td>
                <td className="px-3 py-3">
                  <StatusPill status={l.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">Rows per page<select value={pageSize} onChange={(event)=>setPageSize(Number(event.target.value))} className="rounded-lg border border-line bg-card px-3 py-2 text-foreground"><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
        <span className="text-muted-foreground">{leads.length?`${(page-1)*pageSize+1}–${Math.min(page*pageSize,leads.length)} of ${leads.length}`:"0 leads"}</span>
        <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" className="rounded-full" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</Button><span className="num min-w-20 text-center">Page {page} of {pageCount}</span><Button type="button" variant="outline" size="sm" className="rounded-full" disabled={page===pageCount} onClick={()=>setPage(value=>Math.min(pageCount,value+1))}>Next</Button></div>
      </div>
    </div>
  );
}
