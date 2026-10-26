import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Profile = { id: string; full_name: string; email: string; team: string; is_active: boolean; created_at: string };
export type AppRole = "admin" | "member" | "viewer";
export type AuthUser = { id: string; name: string; email: string; role: "admin" | "rep" };

type AuthState = {
  loading: boolean;
  session: { user: AuthUser } | null;
  user: AuthUser | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  canEdit: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
export const crmAuthUrl = () => `${window.location.origin}/crm/api/auth.php`;

async function authRequest(values?: Record<string, unknown>) {
  const response = await fetch(crmAuthUrl(), {
    method: values ? "POST" : "GET",
    credentials: "same-origin",
    headers: values ? { "Content-Type": "application/json" } : undefined,
    body: values ? JSON.stringify(values) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; user?: AuthUser | null; error?: string };
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "Unable to authenticate.");
  return payload.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try { setUser(await authRequest()); } catch { setUser(null); }
  };

  useEffect(() => { void refresh().finally(() => setLoading(false)); }, []);

  const profile: Profile | null = user ? { id: user.id, full_name: user.name, email: user.email, team: "Bolide", is_active: true, created_at: "" } : null;
  const role: AppRole | null = user ? (user.role === "admin" ? "admin" : "member") : null;

  return (
    <AuthContext.Provider value={{
      loading,
      session: user ? { user } : null,
      user,
      profile,
      role,
      isAdmin: role === "admin",
      canEdit: role === "admin" || role === "member",
      refresh,
      signOut: async () => {
        const sessionResponse = await fetch(crmAuthUrl(), { credentials: "same-origin" });
        const sessionPayload = (await sessionResponse.json()) as { csrf?: string };
        const logoutResponse = await fetch(crmAuthUrl(), {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": sessionPayload.csrf ?? "" },
          body: JSON.stringify({ action: "logout" }),
        });
        if (!logoutResponse.ok) throw new Error("Unable to sign out.");
        setUser(null);
        window.location.assign(`${import.meta.env.BASE_URL}auth`);
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
