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

export async function prospectorApi<T = Record<string, unknown>>(
  action: string,
  values: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(appApiUrl("prospector.php"), {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
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
