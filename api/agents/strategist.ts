import { getAuthenticatedAdmin, jsonResponse } from "../_lib/auth.js";
import { getLeadById } from "../_lib/leads.js";
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
    return sendWebResponse(
      jsonResponse({ error: "Método não permitido." }, { status: 405 }),
      response
    );
  
  if (!(await getAuthenticatedAdmin(webRequest)))
    return sendWebResponse(
      jsonResponse({ error: "Acesso restrito." }, { status: 401 }),
      response
    );

  const body = (await webRequest.json().catch(() => null)) as { leadId?: string };
  if (!body?.leadId) {
    return sendWebResponse(
      jsonResponse({ error: "Informe o lead para analisar." }, { status: 400 }),
      response
    );
  }

  try {
    const lead = await getLeadById(body.leadId.trim());
    if (!lead) {
      return sendWebResponse(
        jsonResponse({ error: "Lead não encontrado." }, { status: 404 }),
        response
      );
    }
    
    if (!lead.briefing) {
      return sendWebResponse(
        jsonResponse(
          { error: "Preencha e salve o briefing antes de gerar a análise." },
          { status: 400 }
        ),
        response
      );
    }

    const systemPrompt = `Você é um Estrategista de Marketing Digital Sênior. 
Seu papel é analisar o briefing do cliente e definir a estratégia macro: 
1. Posicionamento de Mercado
2. Oferta Irresistível
3. Público-alvo e Dores principais
Responda APENAS com a análise estratégica em formato Markdown, estruturada de forma clara e profissional. Não faça saudações.`;

    const userPrompt = `Lead: ${lead.name} (${lead.segment})
Objetivo: ${lead.goal}
Dores: ${lead.pain}
Já faz Ads: ${lead.ads}
Briefing Completo:\n${lead.briefing}`;

    const output = await runAgent(systemPrompt, userPrompt, "Estrategista");

    return sendWebResponse(
      jsonResponse({ success: true, result: output }),
      response
    );
  } catch (error) {
    console.error("[Agent:Strategist] Erro", error);
    return sendWebResponse(
      jsonResponse({ error: (error as Error).message }, { status: 500 }),
      response
    );
  }
}
