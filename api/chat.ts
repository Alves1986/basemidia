import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import { getLeadById } from "./_lib/leads.js";
import { getOperationSettings } from "./_lib/operation.js";
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

function openRouterConfig(settingsKey?: string, settingsModel?: string) {
  const apiKey = settingsKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api/v1"
    ).replace(/\/$/, ""),
    model: settingsModel || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  };
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
  const body = await readBody(webRequest) as any;
  const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  
  if (!leadId || messages.length === 0)
    return sendWebResponse(
      jsonResponse({ error: "Informe o lead e as mensagens." }, { status: 400 }),
      response
    );
    
  const settings = await getOperationSettings();
  const config = openRouterConfig(settings.openRouterApiKey, settings.openRouterModel);
  if (!config)
    return sendWebResponse(
      jsonResponse(
        {
          error:
            "A IA ainda não foi configurada. Insira OPENROUTER_API_KEY nas Configurações.",
        },
        { status: 503 }
      ),
      response
    );

  try {
    const lead = await getLeadById(leadId);
    if (!lead)
      return sendWebResponse(
        jsonResponse({ error: "Lead não encontrado." }, { status: 404 }),
        response
      );

    const prompt = JSON.stringify({
      lead: {
        name: lead.name,
        segment: lead.segment,
        ads: lead.ads,
        pain: lead.pain,
        goal: lead.goal,
      },
      briefing: lead.briefing,
      strategicAnalysis: lead.strategicAnalysis,
    });
    
    const systemMessage = {
      role: "system",
      content: `Você é estrategista sênior e copywriter da BASE MÍDIA. Você está conversando com o gestor de tráfego (usuário) sobre o seguinte lead:\n${prompt}\n\nAjude o gestor a criar anúncios, quebrar objeções, e planejar a campanha. Seja prático, direto e escreva copies persuasivas quando solicitado.`
    };

    const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_SITE_URL
          ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
          : {}),
        "X-OpenRouter-Title": "BASE MÍDIA — Assistente de IA",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [systemMessage, ...messages.slice(-10)], // Keep last 10 messages for context
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(45000), // longer timeout for chat
    });
    
    if (!upstream.ok) throw new Error(`OpenRouter respondeu ${upstream.status}`);
    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string, role?: string } }>;
    };
    
    const replyMessage = payload.choices?.[0]?.message;
    if (!replyMessage?.content) throw new Error("Resposta de IA vazia");
    
    return sendWebResponse(
      jsonResponse({ success: true, message: replyMessage }),
      response
    );
  } catch (error) {
    console.error("[Chat] Falha ao processar mensagem", error);
    return sendWebResponse(
      jsonResponse(
        { error: "Não foi possível processar a mensagem agora. Tente novamente." },
        { status: 502 }
      ),
      response
    );
  }
}
