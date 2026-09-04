import { getOperationSettings } from "./_lib/operation.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";
import { jsonResponse } from "./_lib/auth.js";

interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);
  if (webRequest.method !== "GET") {
    return sendWebResponse(
      jsonResponse({ error: "Método não permitido." }, { status: 405 }),
      response
    );
  }

  try {
    const settings = await getOperationSettings();
    return sendWebResponse(
      jsonResponse({
        settings: {
          googlePixelId: settings.googlePixelId,
          customSegments: settings.customSegments || [],
        },
      }),
      response
    );
  } catch (error) {
    console.error("[Public Settings] Falha ao processar", error);
    return sendWebResponse(
      jsonResponse(
        { error: "Erro interno no servidor." },
        { status: 500 }
      ),
      response
    );
  }
}
