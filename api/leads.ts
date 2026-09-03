import type { IncomingHttpHeaders } from "node:http";
import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import { getLeads, isLeadStorageConfigured, saveLead } from "./_lib/leads.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";
import type { LeadInput } from "../shared/leads.js";

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

export default async function handler(
  request: VercelRequest,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);

  if (webRequest.method === "POST") {
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

    let body: unknown;
    try {
      body = await webRequest.json();
    } catch {
      return sendWebResponse(
        jsonResponse(
          { error: "Não foi possível ler as respostas do formulário." },
          { status: 400 }
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
      await saveLead(input);
      return sendWebResponse(
        jsonResponse({ success: true }, { status: 201 }),
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
