import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { prospectorApi } from "@/lib/prospector-api";
import { useAuth } from "@/hooks/useAuth";
import { formatDateZA } from "@/lib/prospector";
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

const ROLES = ["admin", "member"] as const;
type AdminUser = { id: string; name: string; email: string; role: "admin" | "rep"; created_at: string };

function AdminPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["crm-admin-users"],
    queryFn: async () => (await prospectorApi<{ users: AdminUser[] }>("users")).users,
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
    try {
      await prospectorApi("updateUserRole", { userId, role: role === "admin" ? "admin" : "rep" });
      toast.success("Role updated");
      await qc.invalidateQueries({ queryKey: ["crm-admin-users"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update role"); }
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
              <th className="px-3 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((p) => {
              const role = p.role === "admin" ? "admin" : "member";
              return (
                <tr key={p.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-3">{p.name}</td>
                  <td className="px-3 py-3 text-xs">{p.email}</td>
                  <td className="px-3 py-3">
                    Bolide
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
