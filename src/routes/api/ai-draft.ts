import { createFileRoute } from "@tanstack/react-router";
import { authenticatedProspectorUser, crmProspectorRequest } from "@/lib/crm-prospector.server";
import type { Lead } from "@/lib/prospector";

export const Route = createFileRoute("/api/ai-draft")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { actor } = await authenticatedProspectorUser(request);

        const body = (await request.json()) as {
          leadId?: string;
          channel?: string;
          language?: string;
        };
        if (!body.leadId || !body.channel || !body.language)
          return new Response("Missing fields", { status: 400 });

        const crm = await crmProspectorRequest({ action: "get", actor, leadId: body.leadId });
        if (!crm.response.ok || !crm.payload["lead"])
          return new Response("Lead not found", { status: 404 });
        const lead = crm.payload["lead"] as Lead;

        const consentClause = lead["marketing_consent"]
          ? ""
          : " The business has not yet consented to marketing: if this is a written electronic message, make it a single request asking whether they would like information, and offer an easy opt-out.";

        const prompt = `You write short, respectful outreach for Bolide, a South African company (part of New GX Capital) that installs rooftop solar and battery storage on a power-purchase basis (no upfront capex; the business pays per kWh below its grid tariff), plus smart sub-metering and billing, fibre, AI security and water solutions. Write a ${body.channel} in ${body.language} to the business below. Keep it under 120 words for messages (a call script may use short bullet prompts). Mention one concrete benefit tied to its industry and its electricity supplier (Eskom load reduction and tariff increases of about 9% a year; City Power/Tshwane outages; City of Cape Town tariffs). Do not invent savings figures, prices, names or facts not given. Ask for a short site visit.${consentClause} Sign off as "The Bolide team". Output only the message. Business: ${lead["business_name"]}; industry: ${lead["industry"]}; area: ${lead["suburb"] ?? ""} ${lead["township"]}; electricity supplier: ${lead["electricity_provider"] ?? "unknown"}; energy profile: ${lead["energy_profile"] ?? "unknown"}; contact person: ${lead["contact_person"] ?? "unknown"}.`;

        const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!ai.ok || !ai.body) {
          const text = await ai.text();
          console.error("AI gateway error", ai.status, text);
          return new Response(`AI request failed [${ai.status}]: ${text}`, { status: 502 });
        }

        return new Response(ai.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
