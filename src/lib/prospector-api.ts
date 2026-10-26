export class ProspectorApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function appApiUrl(name: string) {
  if (import.meta.env.DEV) return `/api/${name.replace(/\.php$/, "")}`;
  return `${import.meta.env.BASE_URL}api/${name.endsWith(".php") ? name : `${name}.php`}`;
}

let csrfPromise: Promise<string> | null = null;
async function crmCsrf() {
  csrfPromise ??= fetch(`${window.location.origin}/crm/api/auth.php`, {
    credentials: "same-origin",
  }).then(async (response) => {
    const payload = (await response.json()) as { csrf?: string };
    if (!response.ok || !payload.csrf) throw new Error("Please sign in again.");
    return payload.csrf;
  });
  return csrfPromise;
}

export async function prospectorApi<T = Record<string, unknown>>(
  action: string,
  values: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${window.location.origin}/crm/api/township-prospects.php`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": await crmCsrf() },
    body: JSON.stringify({ action, ...values }),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || payload["ok"] === false)
    throw new ProspectorApiError(
      String(payload["error"] || "The request failed."),
      response.status,
      payload,
    );
  return payload as T;
}
