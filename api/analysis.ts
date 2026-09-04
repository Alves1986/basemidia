import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import { getLeadById, saveLeadAnalysis } from "./_lib/leads.js";
import { getOperationSettings } from "./_lib/operation.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";
import type { StrategicAnalysis } from "../shared/operation.js";

interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

const analysisSchema = {
  type: "object",
  properties: {
    funnelDiagnosis: { type: "string" },
    irresistibleOffer: { type: "string" },
    audienceAndTargeting: { type: "array", items: { type: "string" } },
    copywritingHooks: { type: "array", items: { type: "string" } },
    closingScript: { type: "string" },
  },
  required: [
    "funnelDiagnosis",
    "irresistibleOffer",
    "audienceAndTargeting",
    "copywritingHooks",
    "closingScript",
  ],
  additionalProperties: false,
} as const;

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

function cleanAnalysis(value: unknown): StrategicAnalysis {
  const source = value as Record<string, unknown>;
  const text = (candidate: unknown, fallback = "") =>
    typeof candidate === "string" ? candidate.trim() : fallback;
  const strings = (candidate: unknown) =>
    Array.isArray(candidate)
      ? candidate
          .filter(item => typeof item === "string")
          .map(item => item.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];
  
  return {
    funnelDiagnosis: text(source.funnelDiagnosis),
    irresistibleOffer: text(source.irresistibleOffer),
    audienceAndTargeting: strings(source.audienceAndTargeting),
    copywritingHooks: strings(source.copywritingHooks),
    closingScript: text(source.closingScript),
    generatedAt: Date.now(),
  };
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
  const body = await readBody(webRequest);
  const leadId =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).leadId === "string"
      ? (body as Record<string, string>).leadId.trim()
      : "";
  if (!leadId)
    return sendWebResponse(
      jsonResponse({ error: "Informe o lead para analisar." }, { status: 400 }),
      response
    );
  const settings = await getOperationSettings();
  const config = openRouterConfig(settings.openRouterApiKey, settings.openRouterModel);
  if (!config)
    return sendWebResponse(
      jsonResponse(
        {
          error:
            "A análise por IA ainda não foi configurada. Insira OPENROUTER_API_KEY no Vercel ou Configurações.",
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
    if (!lead.briefing)
      return sendWebResponse(
        jsonResponse(
          { error: "Preencha e salve o briefing antes de gerar a análise." },
          { status: 400 }
        ),
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
    });
    const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_SITE_URL
          ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
          : {}),
        "X-OpenRouter-Title": "BASE MÍDIA — Playbook de Aceleração",
      },
      body: JSON.stringify({
        model: config.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Você é estrategista sênior da BASE MÍDIA, focado em acelerar vendas através de tráfego pago. Construa um Playbook de Aceleração para este lead com base no briefing. Seja ultra-específico, sem jargões genéricos. Responda EXCLUSIVAMENTE em formato JSON aderindo a esta estrutura:\n${JSON.stringify(analysisSchema)}`,
          },
          {
            role: "user",
            content: `Gere o Playbook de Aceleração para o seguinte lead:\n${prompt}`,
          },
        ],
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!upstream.ok) throw new Error(`Forge respondeu ${upstream.status}`);
    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta de IA vazia");
    
    // Attempt to extract JSON if model included markdown blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const rawJson = jsonMatch ? jsonMatch[0] : content;
    
    const analysis = cleanAnalysis(JSON.parse(rawJson));
    const updatedLead = await saveLeadAnalysis(leadId, analysis);
    return sendWebResponse(
      jsonResponse({ success: true, lead: updatedLead, analysis }),
      response
    );
  } catch (error) {
    console.error("[Analysis] Falha ao gerar análise estratégica", error);
    return sendWebResponse(
      jsonResponse(
        { error: "Não foi possível gerar a análise agora. Tente novamente." },
        { status: 502 }
      ),
      response
    );
  }
}
