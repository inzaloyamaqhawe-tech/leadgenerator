import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { prospectorApi } from "@/lib/prospector-api";
import type { Lead } from "@/lib/prospector";

export type UtilityRule = {
  id: string;
  township: string;
  suburb_or_zone: string;
  electricity_provider: string | null;
  water_provider: string | null;
  confidence: string | null;
  source_url: string | null;
  note: string | null;
};

export type UtilityContext = {
  id: string;
  utility: string;
  tariff_increase: string | null;
  reliability: string | null;
  sseg_rules: string | null;
  verify_how: string | null;
  source_url: string | null;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  team: string;
  is_active: boolean;
  created_at: string;
};

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const result = await prospectorApi<{ leads: Lead[] }>("list");
      return result.leads;
    },
    refetchInterval: 30_000,
  });
}

export type CrmOwner = { id: string; name: string; email: string };
export function useCrmOwners() {
  return useQuery({
    queryKey: ["crm-owners"],
    queryFn: async () => (await prospectorApi<{ owners: CrmOwner[] }>("owners")).owners,
    staleTime: 5 * 60_000,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const owners = (await prospectorApi<{ owners: CrmOwner[] }>("owners")).owners;
      return owners.map((owner) => ({ id: owner.id, full_name: owner.name, email: owner.email, team: "Bolide", is_active: true, created_at: "" })) as ProfileRow[];
    },
  });
}

export function useUtilityRules() {
  return useQuery({
    queryKey: ["utility_rules"],
    queryFn: async () => {
      return (await prospectorApi<{ rules: UtilityRule[] }>("utilityData")).rules;
    },
  });
}

export function useUtilityContext() {
  return useQuery({
    queryKey: ["utility_context"],
    queryFn: async () => {
      return (await prospectorApi<{ context: UtilityContext[] }>("utilityData")).context;
    },
  });
}

export function useLeadActivity(leadId: string | null) {
  return useQuery({
    queryKey: ["lead_activity", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const result = await prospectorApi<{
        activity: {
          id: string;
          lead_id: string;
          text: string;
          created_by: string | null;
          created_by_name: string | null;
          created_at: string;
        }[];
      }>("activity", { leadId });
      return result.activity;
    },
  });
}

export function useLeadPhotos(leadId: string | null) {
  return useQuery({
    queryKey: ["lead_photos", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const result = await prospectorApi<{
        photos: {
          id: string;
          storage_path: string;
          caption: string | null;
        }[];
      }>("photos", { leadId });
      const rows = result.photos;
      const signed = await Promise.all(
        rows.map(async (r) => {
          const { data: s } = await supabase.storage
            .from("site-photos")
            .createSignedUrl(r.storage_path, 3600);
          return { ...r, url: s?.signedUrl ?? "" };
        }),
      );
      return signed;
    },
  });
}

/** Refresh shared Xneelo records while the app is open. */
export function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () => void qc.invalidateQueries({ queryKey: ["leads"] });
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [qc]);
}
