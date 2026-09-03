import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import {
  getOperationSettings,
  saveOperationSettings,
} from "./_lib/operation.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";

interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);
  if (!(await getAuthenticatedAdmin(webRequest)))
    return sendWebResponse(
      jsonResponse({ error: "Acesso restrito." }, { status: 401 }),
      response
    );
  try {
    if (webRequest.method === "GET")
      return sendWebResponse(
        jsonResponse({ settings: await getOperationSettings() }),
        response
      );
    if (webRequest.method === "POST")
      return sendWebResponse(
        jsonResponse({
          success: true,
          settings: await saveOperationSettings(await readBody(webRequest)),
        }),
        response
      );
    return sendWebResponse(
      jsonResponse({ error: "Método não permitido." }, { status: 405 }),
      response
    );
  } catch (error) {
    console.error("[Settings] Falha ao processar configurações", error);
    return sendWebResponse(
      jsonResponse(
        { error: "Não foi possível salvar as configurações agora." },
        { status: 500 }
      ),
      response
    );
  }
}
