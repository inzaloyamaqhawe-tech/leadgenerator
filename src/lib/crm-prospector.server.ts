import { createClient } from "@supabase/supabase-js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

export async function authenticatedProspectorUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Response("Unauthorized", { status: 401 });
  const key = required("SUPABASE_PUBLISHABLE_KEY");
  const supabase = createClient(required("SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new Response("Unauthorized", { status: 401 });
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,is_active")
      .eq("id", userData.user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
  ]);
  if (!profile?.is_active) throw new Response("Account inactive", { status: 403 });
  const roleNames = (roles ?? []).map((row) => row.role);
  return {
    supabase,
    actor: {
      id: userData.user.id,
      email: profile.email || userData.user.email || "",
      name: profile.full_name || profile.email || userData.user.email || "Team member",
      active: true,
      canEdit: roleNames.includes("admin") || roleNames.includes("member"),
    },
  };
}

export async function crmProspectorRequest(body: Record<string, unknown>) {
  const response = await fetch(
    process.env["CRM_API_URL"] || "https://bolide.co.za/crm/api/township-prospects.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bolide-Api-Secret": required("CRM_API_SECRET"),
      },
      body: JSON.stringify(body),
    },
  );
  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    payload = { ok: false, error: "The CRM integration returned an invalid response." };
  }
  return { response, payload };
}
