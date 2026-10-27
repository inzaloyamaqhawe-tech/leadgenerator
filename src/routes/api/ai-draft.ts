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

        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey)
          return Response.json(
            { error: "AI drafting is not configured on this server." },
            { status: 503 },
          );

        const ai = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env["OPENAI_MODEL"] || "gpt-4.1-mini",
            instructions:
              "You write concise, respectful business outreach for Bolide, a South African infrastructure solutions company. Output only the requested message. Never invent names, prices, savings or facts.",
            input: prompt,
            max_output_tokens: 500,
          }),
        });

        if (!ai.ok) {
          const text = await ai.text();
          let code = "";
          try {
            code = (JSON.parse(text) as { error?: { code?: string } }).error?.code ?? "";
          } catch {
            // Keep the public error generic when the provider returns non-JSON content.
          }
          console.error("OpenAI error", ai.status, code);
          if (code === "credit_balance_exhausted" || code === "insufficient_quota")
            return Response.json(
              {
                error:
                  "AI drafting needs OpenAI API credits. Please contact the system administrator.",
              },
              { status: 503 },
            );
          return Response.json(
            { error: "AI drafting is temporarily unavailable." },
            { status: 502 },
          );
        }
        const result = (await ai.json()) as {
          output?: { type?: string; content?: { type?: string; text?: string }[] }[];
        };
        const text = (result.output ?? [])
          .filter((item) => item.type === "message")
          .flatMap((item) => item.content ?? [])
          .filter((content) => content.type === "output_text")
          .map((content) => content.text ?? "")
          .join("")
          .trim();
        if (!text) return Response.json({ error: "No draft was returned." }, { status: 502 });
        return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
