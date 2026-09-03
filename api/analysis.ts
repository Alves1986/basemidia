import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import { getLeadById, saveLeadAnalysis } from "./_lib/leads.js";
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
    diagnosis: { type: "string" },
    campaignAngles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          hook: { type: "string" },
          callToAction: { type: "string" },
        },
        required: ["title", "rationale", "hook", "callToAction"],
        additionalProperties: false,
      },
    },
    audienceHypotheses: { type: "array", items: { type: "string" } },
    meetingQuestions: { type: "array", items: { type: "string" } },
    risksAndGaps: { type: "array", items: { type: "string" } },
    recommendedNextStep: { type: "string" },
  },
  required: [
    "diagnosis",
    "campaignAngles",
    "audienceHypotheses",
    "meetingQuestions",
    "risksAndGaps",
    "recommendedNextStep",
  ],
  additionalProperties: false,
} as const;

function openRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api/v1"
    ).replace(/\/$/, ""),
    model: process.env.OPENROUTER_MODEL || "openrouter/free",
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
  const campaignAngles = Array.isArray(source.campaignAngles)
    ? source.campaignAngles.slice(0, 6).flatMap(item => {
        if (!item || typeof item !== "object") return [];
        const angle = item as Record<string, unknown>;
        return [
          {
            title: text(angle.title),
            rationale: text(angle.rationale),
            hook: text(angle.hook),
            callToAction: text(angle.callToAction),
          },
        ];
      })
    : [];
  return {
    diagnosis: text(source.diagnosis),
    campaignAngles,
    audienceHypotheses: strings(source.audienceHypotheses),
    meetingQuestions: strings(source.meetingQuestions),
    risksAndGaps: strings(source.risksAndGaps),
    recommendedNextStep: text(source.recommendedNextStep),
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
  const config = openRouterConfig();
  if (!config)
    return sendWebResponse(
      jsonResponse(
        {
          error:
            "A análise por IA ainda não foi configurada. Insira OPENROUTER_API_KEY no Vercel.",
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
        "X-OpenRouter-Title": "BASE MÍDIA — Análise estratégica",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "Você é estrategista sênior da BASE MÍDIA. Analise o contexto comercial e o briefing. Seja prático, específico e responsável: não invente dados, sinalize lacunas e não trate hipóteses como fatos. Responda exclusivamente no JSON solicitado.",
          },
          {
            role: "user",
            content: `Transforme este lead e briefing em um diagnóstico para reunião e planejamento de campanha:\n${prompt}`,
          },
        ],
        max_tokens: 2800,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "strategic_analysis",
            strict: true,
            schema: analysisSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!upstream.ok) throw new Error(`Forge respondeu ${upstream.status}`);
    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta de IA vazia");
    const analysis = cleanAnalysis(JSON.parse(content));
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
