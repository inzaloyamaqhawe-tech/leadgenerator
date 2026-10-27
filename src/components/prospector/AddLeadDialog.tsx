import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { prospectorApi } from "@/lib/prospector-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ELECTRICITY_OPTIONS,
  INDUSTRIES,
  ROOFTOP_OPTIONS,
  newLeadId,
  scoreLead,
} from "@/lib/prospector";

export function AddLeadDialog({
  open,
  onOpenChange,
  areas,
  presetTownship,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  areas: string[];
  presetTownship?: string | undefined;
  onCreated: (id: string) => void;
}) {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    business_name: "",
    industry: INDUSTRIES[0] as string,
    township: presetTownship ?? "",
    suburb: "",
    address: "",
    phone: "",
    email: "",
    contact_person: "",
    brand: "",
    electricity: "unknown",
    water_provider: "",
    standalone: "unsure",
    rooftop_solar: "unknown",
  });

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.business_name.trim() || !f.township.trim() || !f.address.trim()) {
      toast.error("Business name, area and street address are required");
      return;
    }
    setBusy(true);
    try {
      const id = newLeadId();
      const electricity = f.electricity === "unknown" ? "Mixed — verify" : f.electricity;
      const standalone = f.standalone === "yes" ? true : f.standalone === "no" ? false : null;
      const base = {
        id,
        business_name: f.business_name.trim(),
        industry: f.industry,
        township: f.township.trim(),
        suburb: f.suburb.trim() || null,
        address: f.address.trim(),
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        contact_person: f.contact_person.trim() || null,
        brand: f.brand.trim() || null,
        electricity_provider: electricity,
        water_provider: f.water_provider.trim() || null,
        standalone,
        rooftop_solar: f.rooftop_solar,
        utility_confidence: "low",
        utility_rule: "Entered by team",
        status: "New",
        owner_user: user?.id ?? null,
        created_by: profile?.full_name || profile?.email || null,
      };
      const { score, tier } = scoreLead(base);
      await prospectorApi("create", { lead: { ...base, score, tier } });
      toast.success("Lead added");
      onOpenChange(false);
      onCreated(id);
      setF((p) => ({ ...p, business_name: "", address: "", phone: "", email: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the lead");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add referral or individual lead</DialogTitle>
          <DialogDescription>
            Capture a referral, walk-in discovery or specific business opportunity for work tracking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bn">Business name *</Label>
            <Input
              id="bn"
              value={f.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ind">Industry</Label>
            <Select value={f.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger id="ind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tw">Township / area *</Label>
            <Input
              id="tw"
              list="area-suggestions"
              value={f.township}
              onChange={(e) => set("township", e.target.value)}
              required
            />
            <datalist id="area-suggestions">
              {areas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb">Suburb / block / zone</Label>
            <Input id="sb" value={f.suburb} onChange={(e) => set("suburb", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad">Street address *</Label>
            <Input
              id="ad"
              value={f.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em">Email</Label>
            <Input
              id="em"
              type="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">Contact person</Label>
            <Input
              id="cp"
              value={f.contact_person}
              onChange={(e) => set("contact_person", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="br">Brand</Label>
            <Input id="br" value={f.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el">Electricity supplier</Label>
            <Select value={f.electricity} onValueChange={(v) => set("electricity", v)}>
              <SelectTrigger id="el">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown — verify</SelectItem>
                {ELECTRICITY_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wt">Water provider</Label>
            <Input
              id="wt"
              value={f.water_provider}
              onChange={(e) => set("water_provider", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa">Standalone</Label>
            <Select value={f.standalone} onValueChange={(v) => set("standalone", v)}>
              <SelectTrigger id="sa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes — own premises</SelectItem>
                <SelectItem value="no">No — in a centre</SelectItem>
                <SelectItem value="unsure">Not sure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rs">Solar on roof</Label>
            <Select value={f.rooftop_solar} onValueChange={(v) => set("rooftop_solar", v)}>
              <SelectTrigger id="rs">
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
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="rounded-full bolide-gradient">
              {busy ? "Saving…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
