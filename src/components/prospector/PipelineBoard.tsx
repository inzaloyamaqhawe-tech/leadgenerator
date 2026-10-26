import { useState } from "react";
import { STATUSES, type Lead } from "@/lib/prospector";
import { ProviderPill, TierBadge } from "@/components/prospector/pills";

export function PipelineBoard({
  leads,
  onSelect,
  canEdit,
  onStatusChange,
}: {
  leads: Lead[];
  onSelect: (id: string) => void;
  canEdit: boolean;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const column = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              if (!canEdit) return;
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              if (!canEdit) return;
              const id = e.dataTransfer.getData("text/plain");
              if (id) onStatusChange(id, status);
            }}
            className={`w-64 shrink-0 rounded-xl border p-3 ${
              dragOver === status ? "border-primary bg-pink" : "border-line bg-soft"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{status}</span>
              <span className="num text-xs text-muted-foreground">{column.length}</span>
            </div>
            <div className="space-y-2">
              {column.map((l) => (
                <div
                  key={l.id}
                  draggable={canEdit}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                  onClick={() => onSelect(l.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(l.id);
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer rounded-lg border border-line bg-card p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium leading-tight">{l.business_name}</span>
                    <TierBadge tier={l.tier} score={l.score} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.industry} · {l.township}
                  </div>
                  <div className="mt-2">
                    <ProviderPill value={l.electricity_provider} />
                  </div>
                </div>
              ))}
              {column.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Nothing here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
