import { getAuthenticatedAdmin, jsonResponse } from "../_lib/auth.js";
import { runAgent } from "../_lib/agent.js";
import { sendWebResponse, toWebRequest, type VercelResponseLike } from "../_lib/vercel.js";

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
  if (webRequest.method !== "POST")
    return sendWebResponse(jsonResponse({ error: "Método não permitido." }, { status: 405 }), response);
  
  if (!(await getAuthenticatedAdmin(webRequest)))
    return sendWebResponse(jsonResponse({ error: "Acesso restrito." }, { status: 401 }), response);

  const body = (await webRequest.json().catch(() => null)) as { context?: string };
  if (!body?.context) {
    return sendWebResponse(jsonResponse({ error: "Faltou o contexto do estrategista." }, { status: 400 }), response);
  }

  try {
    const systemPrompt = `Você é um Copywriter de Elite focado em conversão de resposta direta (Direct Response).
Seu papel é receber a estratégia do Maestro (Estrategista) e transformar em textos altamente persuasivos.
Crie:
1. 3 Títulos (Headlines) para anúncios que capturem a atenção da persona definida.
2. 2 Scripts curtos de vídeo (Hook, Body, CTA).
3. 2 Textos para anúncio de imagem/estático.
Mantenha a agressividade de vendas alta, mas natural. Responda APENAS com a copy final em formato Markdown, sem saudações.`;

    const userPrompt = `Baseando-se estritamente na seguinte estratégia:\n\n${body.context}`;

    const output = await runAgent(systemPrompt, userPrompt, "Copywriter");

    return sendWebResponse(
      jsonResponse({ success: true, result: output }),
      response
    );
  } catch (error) {
    console.error("[Agent:Copywriter] Erro", error);
    return sendWebResponse(
      jsonResponse({ error: (error as Error).message }, { status: 500 }),
      response
    );
  }
}
