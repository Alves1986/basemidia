import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth";
import { getLeads, isLeadStorageConfigured, saveLead } from "./_lib/leads";
import type { LeadInput } from "../shared/leads";

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

async function handlePost(request: Request) {
  if (!isLeadStorageConfigured()) {
    return jsonResponse(
      {
        error:
          "O formulário ainda não está conectado ao armazenamento. Configure o Vercel Blob antes de publicar.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: "Não foi possível ler as respostas do formulário." },
      { status: 400 }
    );
  }

  const input = normalizeInput(body);
  if (!input) {
    return jsonResponse(
      {
        error: "Preencha todos os campos obrigatórios com informações válidas.",
      },
      { status: 400 }
    );
  }

  try {
    await saveLead(input);
    return jsonResponse({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Leads] Falha ao salvar briefing", error);
    return jsonResponse(
      {
        error:
          "Não foi possível registrar seu briefing agora. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}

async function handleGet(request: Request) {
  if (!getAuthenticatedAdmin(request)) {
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

  try {
    const leads = await getLeads();
    return jsonResponse({ leads });
  } catch (error) {
    console.error("[Leads] Falha ao listar briefings", error);
    return jsonResponse(
      { error: "Não foi possível carregar os briefings agora." },
      { status: 500 }
    );
  }
}

export default {
  async fetch(request: Request) {
    if (request.method === "GET") return handleGet(request);
    if (request.method === "POST") return handlePost(request);
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  },
};
