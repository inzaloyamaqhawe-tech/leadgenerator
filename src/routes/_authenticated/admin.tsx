import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProspectorData";
import { TEAMS, formatDateZA } from "@/lib/prospector";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Team admin — Township Prospector" },
      { name: "description", content: "Manage Bolide Township Prospector users, roles and teams." },
      { property: "og:title", content: "Team admin — Township Prospector" },
      {
        property: "og:description",
        content: "Manage Bolide Township Prospector users, roles and teams.",
      },
    ],
  }),
  component: AdminPage,
});

const ROLES = ["admin", "member", "viewer"] as const;

function AdminPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: roles = [] } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return (data ?? []) as { id: string; user_id: string; role: string }[];
    },
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h1 className="font-display text-xl">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have access to team administration.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to leads
        </Link>
      </div>
    );
  }

  async function setRole(userId: string, role: string) {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: role as "admin" | "member" | "viewer" });
    if (error) toast.error(error.message);
    else toast.success("Role updated");
    await qc.invalidateQueries({ queryKey: ["user_roles"] });
  }

  async function updateProfile(userId: string, values: Record<string, unknown>) {
    const { error } = await supabase
      .from("profiles")
      .update(values as never)
      .eq("id", userId);
    if (error) toast.error(error.message);
    else toast.success("Saved");
    await qc.invalidateQueries({ queryKey: ["profiles"] });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Team admin</h1>
          <p className="text-sm text-muted-foreground">Roles, teams and access for all users.</p>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">
          Back to leads
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Active</th>
              <th className="px-3 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const role = roles.find((r) => r.user_id === p.id)?.role ?? "member";
              return (
                <tr key={p.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-3">{p.full_name}</td>
                  <td className="px-3 py-3 text-xs">{p.email}</td>
                  <td className="px-3 py-3">
                    <Select
                      value={p.team}
                      onValueChange={(v) => void updateProfile(p.id, { team: v })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAMS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    <Select value={role} onValueChange={(v) => void setRole(p.id, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      size="sm"
                      variant={p.is_active ? "outline" : "default"}
                      className="rounded-full"
                      onClick={() => void updateProfile(p.id, { is_active: !p.is_active })}
                    >
                      {p.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {formatDateZA(p.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
