export interface VercelRequestLike {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelResponseLike {
  status(code: number): VercelResponseLike;
  setHeader(name: string, value: string | string[]): void;
  json(body: unknown): void;
  send(body: string): void;
}

export function toWebRequest(request: VercelRequestLike) {
  const headers = new Headers();
  for (const [name, rawValue] of Object.entries(request.headers)) {
    if (rawValue === undefined) continue;
    headers.set(name, Array.isArray(rawValue) ? rawValue.join(", ") : rawValue);
  }

  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost";
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const method = (request.method ?? "GET").toUpperCase();
  const body =
    method === "POST" || method === "PUT" || method === "PATCH"
      ? typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body ?? {})
      : undefined;

  return new Request(`${protocol}://${host}${request.url ?? "/"}`, {
    method,
    headers,
    body,
  });
}

export async function sendWebResponse(
  response: Response,
  target: VercelResponseLike
) {
  target.status(response.status);
  response.headers.forEach((value, key) => target.setHeader(key, value));
  target.send(await response.text());
}
