import { del, get, list, put } from "@vercel/blob";
import {
  leadStatuses,
  type Lead,
  type LeadInput,
  type LeadStatus,
} from "../../shared/leads.js";

const LEADS_PREFIX = "base-midia/leads/";

export function isLeadStorageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

function assertStorageConfigured() {
  if (!isLeadStorageConfigured()) {
    throw new Error(
      "O armazenamento de leads ainda não foi configurado no Vercel Blob."
    );
  }
}

function parseStoredLead(value: unknown): Lead | null {
  if (!value || typeof value !== "object") return null;
  const lead = value as Partial<Lead>;
  if (
    typeof lead.id !== "string" ||
    typeof lead.createdAt !== "number" ||
    typeof lead.name !== "string" ||
    typeof lead.whatsapp !== "string" ||
    typeof lead.email !== "string" ||
    typeof lead.segment !== "string" ||
    typeof lead.ads !== "string" ||
    typeof lead.pain !== "string" ||
    typeof lead.goal !== "string"
  ) {
    return null;
  }
  const statusCandidate = lead.status as LeadStatus | undefined;
  const status =
    statusCandidate && leadStatuses.includes(statusCandidate)
      ? statusCandidate
      : lead.briefing
        ? "briefing"
        : "novo";
  return {
    ...lead,
    status,
    nextAction: typeof lead.nextAction === "string" ? lead.nextAction : "",
    ...(typeof lead.nextActionAt === "string"
      ? { nextActionAt: lead.nextActionAt }
      : {}),
  } as Lead;
}

export async function saveLead(input: LeadInput) {
  assertStorageConfigured();
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "novo",
    nextAction: "",
  };

  await put(`${LEADS_PREFIX}${lead.id}.json`, JSON.stringify(lead), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return lead;
}

export async function updateLeadPipeline(
  leadId: string,
  updates: Pick<Lead, "status" | "nextAction" | "nextActionAt">
) {
  assertStorageConfigured();
  const pathname = `${LEADS_PREFIX}${leadId}.json`;
  const lead = await readLead(pathname);
  if (!lead) throw new Error("Lead não encontrado.");

  const updatedLead: Lead = { ...lead, ...updates };
  await put(pathname, JSON.stringify(updatedLead), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return updatedLead;
}

export async function updateLeadBriefing(
  leadId: string,
  briefing: Lead["briefing"]
) {
  assertStorageConfigured();
  const pathname = `${LEADS_PREFIX}${leadId}.json`;
  const lead = await readLead(pathname);
  if (!lead) throw new Error("Lead não encontrado.");

  const updatedLead: Lead = {
    ...lead,
    status: lead.status === "novo" ? "briefing" : lead.status,
    briefing,
    briefingUpdatedAt: Date.now(),
  };

  await put(pathname, JSON.stringify(updatedLead), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return updatedLead;
}

async function readLead(pathname: string) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const parsed = JSON.parse(await new Response(result.stream).text());
  return parseStoredLead(parsed);
}

export async function getLeadById(leadId: string) {
  assertStorageConfigured();
  return readLead(`${LEADS_PREFIX}${leadId}.json`);
}

export async function saveLeadAnalysis(
  leadId: string,
  strategicAnalysis: Lead["strategicAnalysis"]
) {
  assertStorageConfigured();
  const pathname = `${LEADS_PREFIX}${leadId}.json`;
  const lead = await readLead(pathname);
  if (!lead) throw new Error("Lead não encontrado.");
  const updatedLead: Lead = { ...lead, strategicAnalysis };
  await put(pathname, JSON.stringify(updatedLead), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return updatedLead;
}

export async function deleteLead(leadId: string) {
  assertStorageConfigured();
  const pathname = `${LEADS_PREFIX}${leadId}.json`;
  const lead = await readLead(pathname);
  if (!lead) throw new Error("Lead não encontrado.");
  await del(pathname);
  return lead;
}

export async function getLeads() {
  assertStorageConfigured();
  const blobs: Array<{ pathname: string }> = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix: LEADS_PREFIX,
      limit: 1000,
      cursor,
    });
    blobs.push(...page.blobs.map(({ pathname }) => ({ pathname })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const leads = await Promise.all(
    blobs.map(({ pathname }) => readLead(pathname))
  );
  return leads
    .filter((lead): lead is Lead => Boolean(lead))
    .sort((left, right) => right.createdAt - left.createdAt);
}
