import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useLeadActivity,
  useLeadPhotos,
  useProfiles,
  useCrmOwners,
  type UtilityRule,
} from "@/hooks/useProspectorData";
import {
  CHANNELS,
  DEFAULT_AREAS,
  ELECTRICITY_OPTIONS,
  LANGUAGES,
  ROOFTOP_OPTIONS,
  STATUSES,
  formatDateZA,
  indicativeSizing,
  roofLabel,
  scoreLead,
  type Lead,
} from "@/lib/prospector";
import { ProspectorApiError, appApiUrl, prospectorApi } from "@/lib/prospector-api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill, ProviderPill, TierBadge } from "@/components/prospector/pills";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-card p-4">
      <h3 className="mb-3 font-display text-sm uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type PromotionMatch = {
  potential: boolean;
  version: number;
  companyName: string;
  ownerName: string;
  deal: { id: string; title: string; site?: string | null };
};

function isPromotionMatch(value: unknown): value is PromotionMatch {
  if (!value || typeof value !== "object") return false;
  const match = value as Partial<PromotionMatch>;
  return typeof match.potential === "boolean" && !!match.deal && typeof match.deal.id === "string";
}

export function LeadDrawer({
  lead,
  rules,
  onClose,
}: {
  lead: Lead | null;
  rules: UtilityRule[];
  onClose: () => void;
}) {
  const { user, canEdit, profile } = useAuth();
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: crmOwners = [] } = useCrmOwners();
  const { data: activity = [] } = useLeadActivity(lead?.id ?? null);
  const { data: photos = [] } = useLeadPhotos(lead?.id ?? null);

  const [contact, setContact] = useState({
    contact_person: "",
    phone: "",
    email: "",
    owner_operator: "",
    rooftop_solar: "unknown",
    roof_area_m2: "",
    consent: false,
  });
  const [billProvider, setBillProvider] = useState<string>("Eskom");
  const [note, setNote] = useState("");
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promotion, setPromotion] = useState<{
    open: boolean;
    ownerId: string;
    matches: PromotionMatch[] | null;
    decision: "" | "link" | "separate";
    targetDealId: string;
    reason: string;
    requestId: string;
  }>({
    open: false,
    ownerId: "",
    matches: null,
    decision: "",
    targetDealId: "",
    reason: "",
    requestId: "",
  });

  useEffect(() => {
    if (!lead) return;
    setContact({
      contact_person: lead.contact_person ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      owner_operator: lead.owner_operator ?? "",
      rooftop_solar: lead.rooftop_solar ?? "unknown",
      roof_area_m2: lead.roof_area_m2 ? String(lead.roof_area_m2) : "",
      consent: !!lead.marketing_consent,
    });
    setDraft("");
    // The form resets only when another lead is opened, not on background polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  const province = lead ? (DEFAULT_AREAS[lead.township]?.[0] ?? "Gauteng") : "Gauteng";
  const appliedRule = useMemo(() => {
    if (!lead) return undefined;
    return (
      rules.find((r) => r.township === lead.township && r.suburb_or_zone === lead.suburb) ??
      rules.find((r) => r.township === lead.township && r.suburb_or_zone === "*")
    );
  }, [lead, rules]);

  if (!lead) return null;

  const owner = profiles.find((p) => p.id === lead.owner_user);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["leads"] });
    await qc.invalidateQueries({ queryKey: ["lead_activity", lead!.id] });
  }

  async function log(text: string) {
    await prospectorApi("addActivity", { leadId: lead!.id, text });
  }

  async function patch(values: Record<string, unknown>, activityText?: string) {
    try {
      await prospectorApi("update", {
        leadId: lead!.id,
        version: lead!.version,
        patch: values,
        activityText,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the lead");
      return false;
    }
    await refresh();
    return true;
  }

  async function saveContactAndRoof() {
    setSaving(true);
    const m2 = contact.roof_area_m2 ? Number(contact.roof_area_m2) : null;
    const next = {
      contact_person: contact.contact_person || null,
      phone: contact.phone || null,
      email: contact.email || null,
      owner_operator: contact.owner_operator || null,
      rooftop_solar: contact.rooftop_solar,
      roof_area_m2: Number.isFinite(m2) ? m2 : null,
      marketing_consent: contact.consent
        ? (lead!.marketing_consent ?? new Date().toISOString())
        : null,
    };
    const { score, tier } = scoreLead({ ...lead!, ...next });
    const ok = await patch(
      { ...next, score, tier },
      `Contact and roof details updated · roof: ${roofLabel(contact.rooftop_solar)}`,
    );
    if (ok) toast.success("Saved");
    setSaving(false);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const path = `${lead!.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("site-photos").upload(path, file);
      if (error) {
        toast.error(error.message);
        continue;
      }
      try {
        await prospectorApi("addPhoto", { leadId: lead!.id, storagePath: path });
      } catch (error) {
        await supabase.storage.from("site-photos").remove([path]);
        toast.error(error instanceof Error ? error.message : "Could not save the photo");
      }
    }
    await qc.invalidateQueries({ queryKey: ["lead_photos", lead!.id] });
    toast.success("Photos uploaded");
  }

  function openPromotion() {
    const matchingOwner = crmOwners.find(
      (owner) => owner.email.toLowerCase() === profile?.email?.toLowerCase(),
    );
    setPromotion({
      open: true,
      ownerId: matchingOwner?.id ?? "",
      matches: null,
      decision: "",
      targetDealId: "",
      reason: "",
      requestId: crypto.randomUUID(),
    });
  }

  async function submitPromotion() {
    if (!promotion.ownerId) {
      toast.error("Choose the responsible CRM owner.");
      return;
    }
    setSaving(true);
    try {
      if (promotion.matches === null) {
        const preview = await prospectorApi<{ matches: PromotionMatch[] }>("promotionPreview", {
          leadId: lead!.id,
          ownerId: promotion.ownerId,
        });
        const potential = preview.matches.filter((match) => match.potential);
        if (potential.length) {
          setPromotion((state) => ({ ...state, matches: potential }));
          return;
        }
      }
      if (promotion.matches?.length && !promotion.decision)
        throw new Error(
          "Choose whether to link the existing deal or create a separate opportunity.",
        );
      if (promotion.decision === "link" && !promotion.targetDealId)
        throw new Error("Choose the CRM deal to link.");
      if (promotion.decision === "separate" && promotion.reason.trim().length < 5)
        throw new Error("Explain why this is a separate opportunity.");
      const result = await prospectorApi<{ dealId: string }>("promote", {
        leadId: lead!.id,
        ownerId: promotion.ownerId,
        requestId: promotion.requestId,
        decision: promotion.decision || undefined,
        targetDealId: promotion.targetDealId || undefined,
        reason: promotion.reason || undefined,
      });
      await refresh();
      setPromotion((state) => ({ ...state, open: false }));
      toast.success("Interested lead moved to the CRM pipeline.");
      window.open(
        `https://bolide.co.za/crm/deals?open=${encodeURIComponent(result.dealId)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      const responseMatches =
        error instanceof ProspectorApiError ? error.details["matches"] : undefined;
      if (Array.isArray(responseMatches))
        setPromotion((state) => ({
          ...state,
          matches: responseMatches.filter(isPromotionMatch).filter((match) => match.potential),
        }));
      toast.error(error instanceof Error ? error.message : "Could not move the lead to CRM");
    } finally {
      setSaving(false);
    }
  }

  async function draftWithAi() {
    setDrafting(true);
    setDraft("");
    try {
      const res = await fetch(appApiUrl("ai-draft.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId: lead!.id, channel, language }),
      });
      const payload = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !payload.text) throw new Error(payload.error || "No draft was returned.");
      setDraft(payload.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft the message");
    } finally {
      setDrafting(false);
    }
  }

  const mapsSatellite = lead.lat
    ? `https://www.google.com/maps/@${lead.lat},${lead.lng},20z/data=!3m1!1e3`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${lead.business_name} ${lead.address ?? ""} ${lead.township}`)}`;
  const streetView = lead.lat
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lead.lat},${lead.lng}`
    : null;
  const listing = `https://www.google.com/maps/search/${encodeURIComponent(`${lead.business_name} ${lead.township}`)}`;

  return (
    <>
      <Sheet open={!!lead} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <TierBadge tier={lead.tier} score={lead.score} />
              <span className="font-display">{lead.business_name}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-10">
            <div className="text-sm text-muted-foreground">
              {lead.industry} · {lead.address} · {lead.suburb} {lead.township}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                className="rounded-full border border-line px-3 py-1.5 hover:bg-soft"
                href={mapsSatellite}
                target="_blank"
                rel="noreferrer"
              >
                Satellite roof view
              </a>
              {streetView && (
                <a
                  className="rounded-full border border-line px-3 py-1.5 hover:bg-soft"
                  href={streetView}
                  target="_blank"
                  rel="noreferrer"
                >
                  Street View
                </a>
              )}
              <a
                className="rounded-full border border-line px-3 py-1.5 hover:bg-soft"
                href={listing}
                target="_blank"
                rel="noreferrer"
              >
                Google Maps listing &amp; photos
              </a>
              <a
                className="rounded-full border border-line px-3 py-1.5 hover:bg-soft"
                href="https://helioscope.aurorasolar.com/"
                target="_blank"
                rel="noreferrer"
              >
                HelioScope
              </a>
            </div>

            <Section title="Status &amp; owner">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  disabled={!canEdit}
                  onValueChange={(v) =>
                    v === "Interested"
                      ? openPromotion()
                      : void patch({ status: v }, `Status changed to ${v}`)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Owner: {owner?.full_name ?? "Unassigned"}</span>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      void patch(
                        { owner_user: user?.id },
                        `Assigned to ${profile?.full_name ?? "a team member"}`,
                      )
                    }
                  >
                    Assign to me
                  </Button>
                )}
              </div>
              {lead.status === "Interested" && lead.crm_deal_id ? (
                <Button variant="outline" className="w-full rounded-full" asChild>
                  <a
                    href={`https://bolide.co.za/crm/deals?open=${encodeURIComponent(lead.crm_deal_id)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open linked CRM deal
                  </a>
                </Button>
              ) : canEdit ? (
                <Button className="w-full rounded-full bolide-gradient" onClick={openPromotion}>
                  Move to CRM pipeline
                </Button>
              ) : null}
            </Section>

            <Section title="Utilities">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <ProviderPill value={lead.electricity_provider} />
                <Pill
                  tone={
                    lead.utility_confidence === "high"
                      ? "green"
                      : lead.utility_confidence === "medium"
                        ? "amber"
                        : "grey"
                  }
                >
                  {lead.utility_confidence ?? "low"} confidence
                </Pill>
                <span className="text-muted-foreground">Water: {lead.water_provider ?? "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rule applied:{" "}
                {appliedRule
                  ? appliedRule.suburb_or_zone === "*"
                    ? "Township default"
                    : appliedRule.suburb_or_zone
                  : (lead.utility_rule ?? "—")}{" "}
                {appliedRule?.source_url && (
                  <a
                    href={appliedRule.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    source
                  </a>
                )}
              </p>
              {lead.utility_confirmed && (
                <p className="text-xs">Confirmed on bill: {lead.utility_confirmed}</p>
              )}
              {canEdit && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1 space-y-1.5">
                    <Label>Confirm supplier from bill…</Label>
                    <Select value={billProvider} onValueChange={setBillProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ELECTRICITY_OPTIONS.filter((o) => o !== "Other municipality").map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      void patch(
                        {
                          electricity_provider: billProvider,
                          utility_confidence: "high",
                          utility_confirmed: `${billProvider} (confirmed on bill)`,
                        },
                        `Supplier confirmed on bill: ${billProvider}`,
                      )
                    }
                  >
                    Save
                  </Button>
                </div>
              )}
            </Section>

            <Section title="Rooftop solar check">
              <p className="text-xs text-muted-foreground">
                Open the satellite view, look for panels, measure usable roof, then record it here.
                Upload site photos below.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Solar on roof</Label>
                  <Select
                    value={contact.rooftop_solar}
                    disabled={!canEdit}
                    onValueChange={(v) => setContact((c) => ({ ...c, rooftop_solar: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOFTOP_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m2">Usable roof area m²</Label>
                  <Input
                    id="m2"
                    inputMode="numeric"
                    disabled={!canEdit}
                    value={contact.roof_area_m2}
                    onChange={(e) => setContact((c) => ({ ...c, roof_area_m2: e.target.value }))}
                  />
                </div>
              </div>
              {Number(contact.roof_area_m2) > 0 && (
                <p className="rounded-lg bg-peach p-3 text-xs">
                  {indicativeSizing(Number(contact.roof_area_m2), province)}
                </p>
              )}
            </Section>

            <Section title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cp2">Contact person</Label>
                  <Input
                    id="cp2"
                    disabled={!canEdit}
                    value={contact.contact_person}
                    onChange={(e) => setContact((c) => ({ ...c, contact_person: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph2">Phone</Label>
                  <Input
                    id="ph2"
                    disabled={!canEdit}
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="em2">Email</Label>
                  <Input
                    id="em2"
                    disabled={!canEdit}
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="oo">Owner / operator</Label>
                  <Input
                    id="oo"
                    disabled={!canEdit}
                    value={contact.owner_operator}
                    onChange={(e) => setContact((c) => ({ ...c, owner_operator: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs">
                <Checkbox
                  checked={contact.consent}
                  disabled={!canEdit}
                  onCheckedChange={(v) => setContact((c) => ({ ...c, consent: v === true }))}
                />
                <span>Consent to electronic marketing recorded (POPIA s69)</span>
              </label>
              {canEdit && (
                <Button
                  className="rounded-full bolide-gradient"
                  disabled={saving}
                  onClick={() => void saveContactAndRoof()}
                >
                  {saving ? "Saving…" : "Save contact & roof"}
                </Button>
              )}
            </Section>

            <Section title="Site photos">
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                    <img
                      src={p.url}
                      alt={p.caption ?? "Site photo"}
                      className="h-24 w-full rounded-lg border border-line object-cover"
                    />
                  </a>
                ))}
                {photos.length === 0 && (
                  <p className="col-span-3 text-xs text-muted-foreground">No photos yet.</p>
                )}
              </div>
              {canEdit && (
                <div>
                  <Label htmlFor="up" className="sr-only">
                    Upload photos
                  </Label>
                  <Input
                    id="up"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void uploadPhotos(e.target.files)}
                  />
                </div>
              )}
            </Section>

            <Section title="Outreach">
              {!lead.marketing_consent && (
                <p className="rounded-lg bg-peach p-3 text-xs">
                  No marketing consent on file. POPIA section 69 allows one electronic message to
                  ask for consent; calling or visiting first is safer.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Channel</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={drafting}
                onClick={() => void draftWithAi()}
              >
                {drafting ? "Drafting…" : "Draft with AI"}
              </Button>
              {draft && (
                <div className="space-y-2">
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        void navigator.clipboard.writeText(draft);
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                    <span className="text-xs text-muted-foreground">Review before sending.</span>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Activity">
              {canEdit && (
                <div className="flex gap-2">
                  <Input
                    value={note}
                    placeholder="Log a call, visit or note"
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    className="rounded-full"
                    onClick={async () => {
                      if (!note.trim()) return;
                      await log(note.trim());
                      setNote("");
                      await qc.invalidateQueries({ queryKey: ["lead_activity", lead.id] });
                    }}
                  >
                    Log
                  </Button>
                </div>
              )}
              <ul className="space-y-2">
                {activity.map((a) => (
                  <li key={a.id} className="rounded-lg bg-soft p-3 text-sm">
                    <div>{a.text}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {profiles.find((p) => p.id === a.created_by)?.full_name ??
                        a.created_by_name ??
                        "Team"}{" "}
                      · {formatDateZA(a.created_at)}
                    </div>
                  </li>
                ))}
                {activity.length === 0 && (
                  <li className="text-xs text-muted-foreground">Nothing logged yet.</li>
                )}
              </ul>
            </Section>

            <Section title="Research record">
              <dl className="space-y-2 text-sm">
                <Field label="Brand" value={lead.brand} />
                <Field
                  label="Standalone"
                  value={
                    lead.standalone === true
                      ? "Yes"
                      : lead.standalone === false
                        ? "No"
                        : "To confirm"
                  }
                />
                <Field label="Energy profile" value={lead.energy_profile} />
                <Field label="Website" value={lead.website} link />
                <Field label="Notes" value={lead.notes} />
                <Field
                  label="Source"
                  value={lead.source_url ?? "Added by team"}
                  link={!!lead.source_url}
                />
                <Field label="Lead ID" value={lead.id} />
              </dl>
            </Section>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog
        open={promotion.open}
        onOpenChange={(open) => !saving && setPromotion((state) => ({ ...state, open }))}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Move interested lead to CRM</DialogTitle>
            <DialogDescription>
              Select the CRM owner. The system will check company, solution and location before
              creating the pipeline deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Responsible CRM owner</Label>
              <Select
                value={promotion.ownerId}
                onValueChange={(ownerId) =>
                  setPromotion((state) => ({
                    ...state,
                    ownerId,
                    matches: null,
                    decision: "",
                    targetDealId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an owner" />
                </SelectTrigger>
                <SelectContent>
                  {crmOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} · {owner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {promotion.matches && promotion.matches.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">A matching CRM opportunity already exists</p>
                {promotion.matches.map((match) => (
                  <button
                    key={match.deal.id}
                    type="button"
                    onClick={() =>
                      setPromotion((state) => ({
                        ...state,
                        decision: "link",
                        targetDealId: match.deal.id,
                      }))
                    }
                    className={`w-full rounded-xl border p-3 text-left text-sm ${promotion.targetDealId === match.deal.id ? "border-primary bg-pink" : "border-line"}`}
                  >
                    <span className="block font-semibold">{match.deal.title}</span>
                    <span className="text-muted-foreground">
                      {match.companyName} · {match.deal.site || "Location to confirm"} ·{" "}
                      {match.ownerName}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setPromotion((state) => ({ ...state, decision: "separate", targetDealId: "" }))
                  }
                  className={`w-full rounded-xl border p-3 text-left text-sm ${promotion.decision === "separate" ? "border-primary bg-pink" : "border-line"}`}
                >
                  <span className="block font-semibold">Create a separate opportunity</span>
                  <span className="text-muted-foreground">
                    Use this only when the location or project is genuinely different.
                  </span>
                </button>
                {promotion.decision === "separate" && (
                  <Textarea
                    value={promotion.reason}
                    onChange={(event) =>
                      setPromotion((state) => ({ ...state, reason: event.target.value }))
                    }
                    placeholder="Why is this a separate opportunity?"
                    rows={3}
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromotion((state) => ({ ...state, open: false }))}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="bolide-gradient"
              onClick={() => void submitPromotion()}
              disabled={saving}
            >
              {saving
                ? "Moving…"
                : promotion.matches === null
                  ? "Review and move"
                  : "Move to CRM pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, value, link }: { label: string; value: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="num break-words text-sm">
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
