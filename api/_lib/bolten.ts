import type { Lead } from "../../shared/leads.js";

const DEFAULT_BOLTEN_API_BASE_URL = "https://app.bolten.io/kanban/api/v1";

type BoltenSyncResult = "skipped" | "synced";

export function isBoltenConfigured() {
  return Boolean(process.env.BOLTEN_API_KEY && process.env.BOLTEN_PROJECT_ID);
}

function buildOpportunityPayload(lead: Lead) {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.whatsapp,
    segment: lead.segment,
    ads: lead.ads,
    pain: lead.pain,
    goal: lead.goal,
    description: `Lead recebido pela BASE MÍDIA. Problema: ${lead.pain}. Objetivo: ${lead.goal}.`,
    source: "BASE MÍDIA — formulário público",
  };
}

export async function syncLeadToBolten(lead: Lead): Promise<BoltenSyncResult> {
  if (!isBoltenConfigured()) return "skipped";

  const apiBaseUrl = (
    process.env.BOLTEN_API_BASE_URL ?? DEFAULT_BOLTEN_API_BASE_URL
  ).replace(/\/$/, "");
  const endpoint = `${apiBaseUrl}/${encodeURIComponent(process.env.BOLTEN_PROJECT_ID!)}/opportunities`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BOLTEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOpportunityPayload(lead)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Bolten respondeu ${response.status}: ${detail}`);
    }

    return "synced";
  } finally {
    clearTimeout(timeout);
  }
}
