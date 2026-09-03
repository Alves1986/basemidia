import type { IncomingHttpHeaders } from "node:http";
import {
  canLogin,
  clearSessionCookie,
  createSessionCookie,
  getAuthenticatedAdmin,
  isAdminConfigured,
  jsonResponse,
} from "./_lib/auth";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel";

interface VercelRequest {
  method?: string;
  url?: string;
  headers: IncomingHttpHeaders;
  body?: unknown;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);

  if (webRequest.method === "GET") {
    const admin = await getAuthenticatedAdmin(webRequest);
    return sendWebResponse(
      jsonResponse({
        configured: isAdminConfigured(),
        authenticated: Boolean(admin),
        user: admin ? { email: admin.email } : null,
      }),
      response
    );
  }

  if (webRequest.method === "POST") {
    if (!isAdminConfigured()) {
      return sendWebResponse(
        jsonResponse(
          {
            error:
              "A área administrativa ainda não foi configurada. Defina ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET no Vercel.",
          },
          { status: 503 }
        ),
        response
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = await webRequest.json();
    } catch {
      return sendWebResponse(
        jsonResponse(
          { error: "Envie e-mail e senha para entrar." },
          { status: 400 }
        ),
        response
      );
    }

    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!(await canLogin(email, password))) {
      return sendWebResponse(
        jsonResponse({ error: "E-mail ou senha inválidos." }, { status: 401 }),
        response
      );
    }

    return sendWebResponse(
      jsonResponse(
        { authenticated: true, user: { email: email.trim().toLowerCase() } },
        {
          headers: {
            "Set-Cookie": await createSessionCookie(
              webRequest,
              email.trim().toLowerCase()
            ),
          },
        }
      ),
      response
    );
  }

  if (webRequest.method === "DELETE") {
    return sendWebResponse(
      jsonResponse(
        { success: true },
        { headers: { "Set-Cookie": clearSessionCookie(webRequest) } }
      ),
      response
    );
  }

  return sendWebResponse(
    jsonResponse({ error: "Método não permitido." }, { status: 405 }),
    response
  );
}
