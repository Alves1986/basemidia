import type { IncomingHttpHeaders } from "node:http";
import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import {
  deleteLead,
  getLeads,
  isLeadStorageConfigured,
  saveLead,
  updateLeadBriefing,
  updateLeadPipeline,
} from "./_lib/leads.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";
import type {
  LeadInput,
  LeadStatus,
  StrategicBriefing,
} from "../shared/leads.js";
import { leadStatuses } from "../shared/leads.js";
import { strategicBriefingMaxLengths } from "../shared/leads.js";
import { isBoltenConfigured, syncLeadToBolten } from "./_lib/bolten.js";

interface VercelRequest {
  method?: string;
  url?: string;
  headers: IncomingHttpHeaders;
  body?: unknown;
}

const MAX_LENGTHS: Record<keyof LeadInput, number> = {
  name: 120,
  whatsapp: 40,
  email: 160,
  segment: 80,
  ads: 120,
  pain: 1200,
  goal: 500,
};

function normalizeInput(body: unknown): LeadInput | null {
  if (!body || typeof body !== "object") return null;
  const source = body as Record<string, unknown>;
  const input = {} as LeadInput;

  for (const [key, maxLength] of Object.entries(MAX_LENGTHS) as Array<
    [keyof LeadInput, number]
  >) {
    const value = source[key];
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    if (!normalized || normalized.length > maxLength) return null;
    input[key] = normalized;
  }

  if (!/^\S+@\S+\.\S+$/.test(input.email)) return null;
  return input;
}

function normalizeBriefing(body: unknown): StrategicBriefing | null {
  if (!body || typeof body !== "object") return null;
  const source = body as Record<string, unknown>;
  const briefing = {} as StrategicBriefing;

  for (const [key, maxLength] of Object.entries(
    strategicBriefingMaxLengths
  ) as Array<[keyof StrategicBriefing, number]>) {
    const value = source[key];
    if (typeof value !== "string" || value.trim().length > maxLength)
      return null;
    briefing[key] = value.trim();
  }

  return briefing;
}

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function handleDeleteLead(request: Request, body: unknown) {
  if (!(await getAuthenticatedAdmin(request))) {
    return jsonResponse({ error: "Acesso restrito." }, { status: 401 });
  }
  if (!isLeadStorageConfigured()) {
    return jsonResponse(
      {
        error:
          "O armazenamento de leads ainda não foi configurado no Vercel Blob.",
      },
      { status: 503 }
    );
  }
  const source =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const leadId = typeof source.leadId === "string" ? source.leadId.trim() : "";
  if (!/^[0-9a-f-]{20,}$/i.test(leadId))
    return jsonResponse({ error: "Lead inválido." }, { status: 400 });
  try {
    await deleteLead(leadId);
    return jsonResponse({ success: true, deletedLeadId: leadId });
  } catch (error) {
    console.error("[Leads] Falha ao excluir lead", error);
    return jsonResponse(
      { error: "Não foi possível excluir este lead agora." },
      { status: 404 }
    );
  }
}

async function handleUpdatePipeline(request: Request, body: unknown) {
  if (!(await getAuthenticatedAdmin(request))) {
    return jsonResponse({ error: "Acesso restrito." }, { status: 401 });
  }
  if (!isLeadStorageConfigured()) {
    return jsonResponse(
      {
        error:
          "O armazenamento de leads ainda não foi configurado no Vercel Blob.",
      },
      { status: 503 }
    );
  }

  if (!body || typeof body !== "object") {
    return jsonResponse(
      { error: "Envie os dados do pipeline." },
      { status: 400 }
    );
  }
  const source = body as Record<string, unknown>;
  const leadId = typeof source.leadId === "string" ? source.leadId.trim() : "";
  const status = source.status as LeadStatus;
  const nextAction =
    typeof source.nextAction === "string" ? source.nextAction.trim() : "";
  const nextActionAt =
    typeof source.nextActionAt === "string" ? source.nextActionAt.trim() : "";

  if (
    !leadId ||
    !leadStatuses.includes(status) ||
    nextAction.length > 300 ||
    nextActionAt.length > 30
  ) {
    return jsonResponse(
      { error: "Revise o status e a próxima ação." },
      { status: 400 }
    );
  }

  try {
    const lead = await updateLeadPipeline(leadId, {
      status,
      nextAction,
      ...(nextActionAt ? { nextActionAt } : { nextActionAt: undefined }),
    });
    return jsonResponse({ success: true, lead });
  } catch (error) {
    console.error("[Leads] Falha ao atualizar pipeline", error);
    return jsonResponse(
      { error: "Não foi possível atualizar este lead agora." },
      { status: 500 }
    );
  }
}

async function handleSaveBriefing(request: Request, body: unknown) {
  if (!(await getAuthenticatedAdmin(request))) {
    return jsonResponse({ error: "Acesso restrito." }, { status: 401 });
  }
  if (!isLeadStorageConfigured()) {
    return jsonResponse(
      {
        error:
          "O armazenamento de leads ainda não foi configurado no Vercel Blob.",
      },
      { status: 503 }
    );
  }

  if (!body || typeof body !== "object") {
    return jsonResponse(
      { error: "Envie os dados do briefing." },
      { status: 400 }
    );
  }
  const source = body as Record<string, unknown>;
  const leadId = typeof source.leadId === "string" ? source.leadId.trim() : "";
  const briefing = normalizeBriefing(source.briefing);
  if (!leadId || !briefing) {
    return jsonResponse(
      { error: "Revise os campos do briefing antes de salvar." },
      { status: 400 }
    );
  }

  try {
    const lead = await updateLeadBriefing(leadId, briefing);
    return jsonResponse({ success: true, lead });
  } catch (error) {
    console.error("[Leads] Falha ao salvar briefing", error);
    return jsonResponse(
      { error: "Não foi possível salvar este briefing agora." },
      { status: 500 }
    );
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);

  if (webRequest.method === "POST") {
    const body = await readBody(webRequest);
    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).action === "delete-lead"
    ) {
      return sendWebResponse(
        await handleDeleteLead(webRequest, body),
        response
      );
    }

    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).action === "update-pipeline"
    ) {
      return sendWebResponse(
        await handleUpdatePipeline(webRequest, body),
        response
      );
    }

    if (
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).action === "save-briefing"
    ) {
      return sendWebResponse(
        await handleSaveBriefing(webRequest, body),
        response
      );
    }

    if (!isLeadStorageConfigured()) {
      return sendWebResponse(
        jsonResponse(
          {
            error:
              "O formulário ainda não está conectado ao armazenamento. Configure o Vercel Blob antes de publicar.",
          },
          { status: 503 }
        ),
        response
      );
    }

    const input = normalizeInput(body);
    if (!input) {
      return sendWebResponse(
        jsonResponse(
          {
            error:
              "Preencha todos os campos obrigatórios com informações válidas.",
          },
          { status: 400 }
        ),
        response
      );
    }

    try {
      const lead = await saveLead(input);
      let boltenSync: "skipped" | "synced" | "failed" = "skipped";
      if (isBoltenConfigured()) {
        try {
          boltenSync = await syncLeadToBolten(lead);
        } catch (syncError) {
          boltenSync = "failed";
          console.error(
            "[Leads] Falha ao sincronizar lead com a Bolten",
            syncError
          );
        }
      }
      return sendWebResponse(
        jsonResponse({ success: true, boltenSync }, { status: 201 }),
        response
      );
    } catch (error) {
      console.error("[Leads] Falha ao salvar briefing", error);
      return sendWebResponse(
        jsonResponse(
          {
            error:
              "Não foi possível registrar seu briefing agora. Tente novamente em instantes.",
          },
          { status: 500 }
        ),
        response
      );
    }
  }

  if (webRequest.method === "GET") {
    if (!(await getAuthenticatedAdmin(webRequest))) {
      return sendWebResponse(
        jsonResponse({ error: "Acesso restrito." }, { status: 401 }),
        response
      );
    }
    if (!isLeadStorageConfigured()) {
      return sendWebResponse(
        jsonResponse(
          {
            error:
              "O armazenamento de leads ainda não foi configurado no Vercel Blob.",
          },
          { status: 503 }
        ),
        response
      );
    }

    try {
      const leads = await getLeads();
      return sendWebResponse(jsonResponse({ leads }), response);
    } catch (error) {
      console.error("[Leads] Falha ao listar briefings", error);
      return sendWebResponse(
        jsonResponse(
          { error: "Não foi possível carregar os briefings agora." },
          { status: 500 }
        ),
        response
      );
    }
  }

  return sendWebResponse(
    jsonResponse({ error: "Método não permitido." }, { status: 405 }),
    response
  );
}
