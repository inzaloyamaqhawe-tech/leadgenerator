export const STATUSES = [
  "New",
  "Researching",
  "Contacted",
  "Follow-up",
  "Interested",
  "Not interested",
  "Unreachable",
] as const;
export type Status = (typeof STATUSES)[number];

export const INDUSTRIES = [
  "Shopping centre / mall",
  "Residential estate / complex",
  "Fuel station",
  "Quick-service restaurant",
  "Butchery / shisanyama",
  "Hair & beauty salon",
  "Tyre fitment",
  "Motor repairs / panel beating",
  "Car wash",
  "Bottle store / liquor",
  "Private clinic / hospital",
  "Beverage distribution depot",
  "Bakery / food production",
  "Cold storage / ice",
  "Laundromat",
  "Other high-energy business",
] as const;

export const DEFAULT_AREAS: Record<string, [string, string]> = {
  Soweto: ["Gauteng", "Johannesburg"],
  Soshanguve: ["Gauteng", "Pretoria"],
  Mabopane: ["Gauteng", "Pretoria"],
  "Ga-Rankuwa": ["Gauteng", "Pretoria"],
  Khayelitsha: ["Western Cape", "Cape Town"],
  "Mitchells Plain": ["Western Cape", "Cape Town"],
};

export const INDUSTRY_WEIGHTS: Record<string, number> = {
  "Shopping centre / mall": 28,
  "Residential estate / complex": 20,
  "Private clinic / hospital": 30,
  "Beverage distribution depot": 30,
  "Cold storage / ice": 26,
  "Fuel station": 25,
  "Bakery / food production": 22,
  "Quick-service restaurant": 22,
  "Butchery / shisanyama": 20,
  Laundromat: 18,
  "Car wash": 18,
  "Bottle store / liquor": 17,
  "Other high-energy business": 15,
  "Tyre fitment": 12,
  "Motor repairs / panel beating": 12,
  "Hair & beauty salon": 10,
};

export const TEAMS = ["Bolide", "Airnergize Ventures", "Fungi Energy", "New GX"] as const;

export const ROOFTOP_OPTIONS = [
  { value: "unknown", label: "Not checked" },
  { value: "no", label: "No solar" },
  { value: "partial", label: "Partial system" },
  { value: "yes", label: "Full system" },
] as const;

export const ELECTRICITY_OPTIONS = [
  "Eskom",
  "City Power",
  "City of Tshwane",
  "City of Cape Town",
  "Other municipality",
] as const;

export const LANGUAGES = [
  "English",
  "isiZulu",
  "Sesotho",
  "Setswana",
  "isiXhosa",
  "Afrikaans",
] as const;

export const CHANNELS = [
  "WhatsApp message",
  "Email",
  "Phone call script",
  "Walk-in pitch (1 minute)",
] as const;

export type Lead = {
  id: string;
  business_name: string;
  brand: string | null;
  industry: string;
  township: string;
  suburb: string | null;
  address: string | null;
  standalone: boolean | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  owner_operator: string | null;
  energy_profile: string | null;
  notes: string | null;
  source_url: string | null;
  electricity_provider: string | null;
  water_provider: string | null;
  utility_confidence: string | null;
  utility_rule: string | null;
  utility_source: string | null;
  utility_confirmed: string | null;
  rooftop_solar: string;
  roof_area_m2: number | null;
  marketing_consent: string | null;
  status: string;
  owner_user: string | null;
  score: number | null;
  tier: string | null;
  created_by: string | null;
  crm_deal_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export function newLeadId(): string {
  const hex = "0123456789abcdef";
  let s = "L";
  const bytes = new Uint8Array(10);
  (globalThis.crypto ?? ({} as Crypto)).getRandomValues?.(bytes);
  for (let i = 0; i < 10; i++) s += hex[(bytes[i] ?? Math.floor(Math.random() * 256)) % 16];
  return s;
}

export function scoreLead(l: Partial<Lead>): { score: number; tier: "A" | "B" | "C" } {
  const weight = l.industry ? (INDUSTRY_WEIGHTS[l.industry] ?? 12) : 12;
  let score = weight;
  score += l.standalone === true ? 20 : l.standalone === null || l.standalone === undefined ? 8 : 0;
  score += l.phone ? 12 : 0;
  score += l.email ? 5 : 0;
  score += l.electricity_provider === "Eskom" ? 8 : 4;
  score += l.brand ? 5 : 0;
  const text = `${l.notes ?? ""} ${l.energy_profile ?? ""}`;
  if (/24|dialysis|cold room|mortuary|refrigerat|freez/i.test(text)) score += 10;
  score = Math.min(100, score);
  const tier = score >= 65 ? "A" : score >= 48 ? "B" : "C";
  return { score, tier };
}

export function providerTone(p: string | null | undefined): "amber" | "blue" | "grey" {
  if (!p) return "grey";
  if (p === "Eskom") return "amber";
  if (/^(City Power|City of Tshwane|City of Cape Town|.*[Mm]unicipality.*)$/.test(p)) return "blue";
  return "grey";
}

export function roofLabel(v: string | null | undefined) {
  return ROOFTOP_OPTIONS.find((o) => o.value === (v ?? "unknown"))?.label ?? "Not checked";
}

export function formatDateZA(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function indicativeSizing(m2: number, province: string) {
  const kWp = Math.round(m2 * 0.18);
  const yieldFactor = province === "Western Cape" ? 1550 : 1650;
  return `Indicative: about ${kWp} kWp on ${m2} m², roughly ${kWp * yieldFactor} kWh a year. Size properly in HelioScope before quoting.`;
}

/* ---------- Export helpers ---------- */

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HUBSPOT_COLUMNS: Array<[string, (l: Lead) => unknown]> = [
  ["Company name", (l) => l.business_name],
  ["Phone Number", (l) => l.phone],
  ["Street Address", (l) => l.address],
  ["City", (l) => DEFAULT_AREAS[l.township]?.[1] ?? ""],
  ["State/Region", (l) => DEFAULT_AREAS[l.township]?.[0] ?? ""],
  ["Country/Region", () => "South Africa"],
  ["Industry", (l) => l.industry],
  ["Website URL", (l) => l.website],
  ["Lead Status", (l) => l.status],
  ["Township", (l) => l.township],
  ["Suburb", (l) => l.suburb],
  ["Contact person", (l) => l.contact_person],
  ["Email", (l) => l.email],
  ["Owner / operator", (l) => l.owner_operator],
  ["Electricity provider", (l) => l.electricity_provider],
  ["Water provider", (l) => l.water_provider],
  ["Rooftop solar", (l) => l.rooftop_solar],
  ["Roof area m2", (l) => l.roof_area_m2],
  ["Bolide tier", (l) => l.tier],
  ["Bolide score", (l) => l.score],
  ["Marketing consent", (l) => l.marketing_consent],
  ["Latitude", (l) => l.lat],
  ["Longitude", (l) => l.lng],
  ["Source URL", (l) => l.source_url],
  ["Bolide lead ID", (l) => l.id],
];

export const HUBSPOT_FIELD_MAP = HUBSPOT_COLUMNS.map(([c]) => c);

export function leadsToCsv(leads: Lead[], flavour: "hubspot" | "generic") {
  const cols = HUBSPOT_COLUMNS.map(([name, get]) => {
    if (flavour === "generic") {
      if (name === "Company name") return ["Account Name", get] as [string, (l: Lead) => unknown];
      if (name === "Phone Number") return ["Phone", get] as [string, (l: Lead) => unknown];
    }
    return [name, get] as [string, (l: Lead) => unknown];
  });
  const head = cols.map(([n]) => csvEscape(n)).join(",");
  const rows = leads.map((l) => cols.map(([, get]) => csvEscape(get(l))).join(","));
  return [head, ...rows].join("\n");
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
