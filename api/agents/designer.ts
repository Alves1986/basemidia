import { getAuthenticatedAdmin, jsonResponse } from "../_lib/auth.js";
import { runAgent } from "../_lib/agent.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "../_lib/vercel.js";

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
    return sendWebResponse(
      jsonResponse({ error: "Método não permitido." }, { status: 405 }),
      response
    );

  if (!(await getAuthenticatedAdmin(webRequest)))
    return sendWebResponse(
      jsonResponse({ error: "Acesso restrito." }, { status: 401 }),
      response
    );

  const body = (await webRequest.json().catch(() => null)) as {
    context?: string;
  };
  if (!body?.context) {
    return sendWebResponse(
      jsonResponse({ error: "Faltou a copy de contexto." }, { status: 400 }),
      response
    );
  }

  try {
    const systemPrompt = `Você é um Diretor de Arte e Especialista em Carrosséis no Instagram.
Receba os textos (copy) e transforme isso numa Estrutura de Carrossel de alto engajamento.
Descreva slide por slide (Slide 1 a 6):
1. O texto do slide (Headlines curtas e fortes)
2. A sugestão visual para o designer (ex: "Fundo escuro, foto da persona frustrada à direita").
Por fim, sugira uma paleta de cores e o tom das imagens. Responda APENAS em Markdown.`;

    const userPrompt = `Baseando-se nesta copy, crie o roteiro do Carrossel visual:\n\n${body.context}`;

    const output = await runAgent(systemPrompt, userPrompt, "Designer");

    return sendWebResponse(
      jsonResponse({ success: true, result: output }),
      response
    );
  } catch (error) {
    console.error("[Agent:Designer] Erro", error);
    return sendWebResponse(
      jsonResponse({ error: (error as Error).message }, { status: 500 }),
      response
    );
  }
}
