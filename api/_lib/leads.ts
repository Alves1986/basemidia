import { get, list, put } from "@vercel/blob";
import type { Lead, LeadInput } from "../../shared/leads.js";

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
  return lead as Lead;
}

export async function saveLead(input: LeadInput) {
  assertStorageConfigured();
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  await put(`${LEADS_PREFIX}${lead.id}.json`, JSON.stringify(lead), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return lead;
}

async function readLead(pathname: string) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const parsed = JSON.parse(await new Response(result.stream).text());
  return parseStoredLead(parsed);
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
