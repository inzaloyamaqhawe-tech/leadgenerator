import type { ReactNode } from "react";
import { providerTone, roofLabel } from "@/lib/prospector";

export function Pill({
  children,
  tone = "grey",
  title,
}: {
  children: ReactNode;
  tone?: "amber" | "blue" | "grey" | "green" | "pink" | "plum";
  title?: string;
}) {
  const tones: Record<string, string> = {
    amber: "bg-amberpill text-amberpill-foreground",
    blue: "bg-bluepill text-bluepill-foreground",
    green: "bg-greenpill text-greenpill-foreground",
    grey: "bg-secondary text-secondary-foreground",
    pink: "bg-pink text-accent-foreground",
    plum: "bg-plum text-plum-foreground",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProviderPill({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return <Pill tone={providerTone(value)}>{value}</Pill>;
}

export function RoofPill({ value }: { value: string | null | undefined }) {
  const v = value ?? "unknown";
  const tone = v === "yes" ? "green" : v === "partial" ? "amber" : v === "no" ? "blue" : "grey";
  return <Pill tone={tone}>{roofLabel(v)}</Pill>;
}

export function TierBadge({ tier, score }: { tier: string | null; score: number | null }) {
  const t = tier ?? "C";
  const base =
    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground";
  if (t === "A")
    return (
      <span className={`${base} bolide-gradient`} title={`Score ${score ?? "—"}`}>
        A
      </span>
    );
  if (t === "B")
    return (
      <span className={`${base} bg-pink text-accent-foreground`} title={`Score ${score ?? "—"}`}>
        B
      </span>
    );
  return (
    <span
      className={`${base} bg-secondary text-secondary-foreground`}
      title={`Score ${score ?? "—"}`}
    >
      C
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Won"
      ? "green"
      : status === "Not a fit"
        ? "grey"
        : status === "New"
          ? "pink"
          : "amber";
  return <Pill tone={tone}>{status}</Pill>;
}
