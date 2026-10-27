import { useUtilityContext, useUtilityRules } from "@/hooks/useProspectorData";
import { Pill, ProviderPill } from "@/components/prospector/pills";

function splitName(utility: string) {
  const match = /^(.*?)\s*\((.*)\)\s*$/.exec(utility);
  if (match) return { name: match[1], subtitle: match[2] };
  return { name: utility, subtitle: "" };
}

export function UtilityMapTab() {
  const { data: context = [] } = useUtilityContext();
  const { data: rules = [] } = useUtilityRules();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      <div className="shrink-0">
        <h2 className="font-display text-xl">Who supplies electricity and water</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Suppliers are assigned from Eskom and municipal outage notices, load-reduction lists and
          news reports. No utility publishes a full supplier-by-suburb list, so confirm on the
          customer's latest bill or prepaid token slip before quoting savings.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {context.map((c) => {
          const { name, subtitle } = splitName(c.utility);
          return (
            <div key={c.id} className="rounded-xl border border-line bg-card p-4">
              <h3 className="font-display text-base">{name}</h3>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Tariff" value={c.tariff_increase} />
                <Row label="Reliability" value={c.reliability} />
                <Row label="Solar rules" value={c.sseg_rules} />
                <Row label="How to verify" value={c.verify_how} />
              </dl>
              {c.source_url && (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
                >
                  Source
                </a>
              )}
            </div>
          );
        })}
        {context.length === 0 && (
          <p className="text-sm text-muted-foreground">No utility context loaded yet.</p>
        )}
      </div>

      <div className="min-h-0">
        <h3 className="mb-3 font-display text-lg">Rules by township and suburb</h3>
        <div className="max-h-[55vh] overflow-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--line)]">
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3">Township</th>
                <th className="px-3 py-3">Suburb / block / zone</th>
                <th className="px-3 py-3">Electricity</th>
                <th className="px-3 py-3">Water</th>
                <th className="px-3 py-3">Confidence</th>
                <th className="px-3 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-3">{r.township}</td>
                  <td className="px-3 py-3">
                    <div>
                      {r.suburb_or_zone === "*" ? "Default for township" : r.suburb_or_zone}
                    </div>
                    {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <ProviderPill value={r.electricity_provider} />
                  </td>
                  <td className="px-3 py-3 text-xs">{r.water_provider ?? "—"}</td>
                  <td className="px-3 py-3">
                    <Pill
                      tone={
                        r.confidence === "high"
                          ? "green"
                          : r.confidence === "medium"
                            ? "amber"
                            : "grey"
                      }
                    >
                      {r.confidence ?? "low"}
                    </Pill>
                  </td>
                  <td className="px-3 py-3">
                    {r.source_url ? (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Source
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No utility rules loaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
