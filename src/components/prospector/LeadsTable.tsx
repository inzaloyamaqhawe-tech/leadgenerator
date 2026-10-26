import { useState } from "react";
import type { Lead } from "@/lib/prospector";
import { ProviderPill, RoofPill, StatusPill, TierBadge } from "@/components/prospector/pills";
import { Button } from "@/components/ui/button";

export function LeadsTable({ leads, onSelect }: { leads: Lead[]; onSelect: (id: string) => void }) {
  const [limit, setLimit] = useState(80);
  const visible = leads.slice(0, limit);
  const left = leads.length - visible.length;

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card p-10 text-center text-sm text-muted-foreground">
        No leads match these filters yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
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
      {left > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setLimit((n) => n + 80)}
          >
            Show more ({left} left)
          </Button>
        </div>
      )}
    </div>
  );
}
