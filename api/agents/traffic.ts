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
    contextCopy?: string;
    contextStrategy?: string;
  };
  if (!body?.contextCopy || !body?.contextStrategy) {
    return sendWebResponse(
      jsonResponse(
        { error: "Faltou a estratégia ou a copy de contexto." },
        { status: 400 }
      ),
      response
    );
  }

  try {
    const systemPrompt = `Você é um Gestor de Tráfego de Alta Performance (Media Buyer).
Seu papel é pegar a estratégia macro e os criativos (copy) e transformar na Estrutura Tática da Campanha.
Defina:
1. Nomenclatura da Campanha
2. Orçamento sugerido (CBO ou ABO?)
3. Conjuntos de Anúncios (Segmentação detalhada, Lookalike, Interesses)
4. Evento de Otimização (Purchase, Lead?)
Entregue o Plano de Mídia em um formato direto e técnico. Responda APENAS em Markdown.`;

    const userPrompt = `Estratégia:\n${body.contextStrategy}\n\nCopy/Criativos:\n${body.contextCopy}\n\nMonte a estrutura da campanha:`;

    const output = await runAgent(systemPrompt, userPrompt, "GestorDeTrafego");

    return sendWebResponse(
      jsonResponse({ success: true, result: output }),
      response
    );
  } catch (error) {
    console.error("[Agent:Traffic] Erro", error);
    return sendWebResponse(
      jsonResponse({ error: (error as Error).message }, { status: 500 }),
      response
    );
  }
}
