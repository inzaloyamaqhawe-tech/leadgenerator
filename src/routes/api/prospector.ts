import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticatedProspectorUser, crmProspectorRequest } from "@/lib/crm-prospector.server";

async function allRows(client: SupabaseClient, table: string) {
  const rows: unknown[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

export const Route = createFileRoute("/api/prospector")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabase, actor } = await authenticatedProspectorUser(request);
          const body = (await request.json()) as Record<string, unknown>;
          let result = await crmProspectorRequest({ ...body, actor });
          if (body["action"] === "list" && result.response.ok) {
            const leads = Array.isArray(result.payload["leads"]) ? result.payload["leads"] : [];
            if (leads.length === 0 && actor.canEdit) {
              const [oldLeads, activity, photos] = await Promise.all([
                allRows(supabase, "leads"),
                allRows(supabase, "lead_activity"),
                allRows(supabase, "lead_photos"),
              ]);
              if (oldLeads.length) {
                result = await crmProspectorRequest({
                  action: "bootstrap",
                  actor,
                  leads: oldLeads,
                  activity,
                  photos,
                });
              }
            }
          }
          return Response.json(result.payload, { status: result.response.status });
        } catch (error) {
          if (error instanceof Response) return error;
          console.error(error);
          return Response.json(
            { ok: false, error: "The shared CRM database is unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
