import { get, put } from "@vercel/blob";
import {
  defaultOperationSettings,
  type FunnelStageSettings,
  type OperationSettings,
  type OperationMessageSettings,
} from "../../shared/operation.js";
import { leadStatuses, type LeadStatus } from "../../shared/leads.js";

const SETTINGS_PATH = "base-midia/config/operation.json";

function storageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

function cloneDefaults(): OperationSettings {
  return JSON.parse(
    JSON.stringify(defaultOperationSettings)
  ) as OperationSettings;
}

function cleanText(value: unknown, max: number, fallback: string) {
  return typeof value === "string" && value.trim().length <= max
    ? value.trim()
    : fallback;
}

function parseSettings(value: unknown): OperationSettings {
  const defaults = cloneDefaults();
  if (!value || typeof value !== "object") return defaults;
  const source = value as Partial<OperationSettings>;
  const incomingStages = Array.isArray(source.stages) ? source.stages : [];
  const stages: FunnelStageSettings[] = leadStatuses.map((id, index) => {
    const incoming = incomingStages.find(
      item =>
        item && typeof item === "object" && (item as { id?: string }).id === id
    ) as Partial<FunnelStageSettings> | undefined;
    const fallback = defaults.stages[index];
    return {
      id,
      label: cleanText(incoming?.label, 80, fallback.label),
      color: /^#[0-9a-f]{6}$/i.test(incoming?.color ?? "")
        ? incoming!.color!
        : fallback.color,
      defaultNextAction: cleanText(
        incoming?.defaultNextAction,
        160,
        fallback.defaultNextAction
      ),
      deadlineDays:
        typeof incoming?.deadlineDays === "number" &&
        Number.isInteger(incoming.deadlineDays) &&
        incoming.deadlineDays >= 0 &&
        incoming.deadlineDays <= 90
          ? incoming.deadlineDays
          : fallback.deadlineDays,
    };
  });
  const incomingMessages =
    source.messages && typeof source.messages === "object"
      ? (source.messages as Partial<OperationMessageSettings>)
      : {};
  const messages = Object.fromEntries(
    (
      Object.keys(defaults.messages) as Array<keyof OperationMessageSettings>
    ).map(key => [
      key,
      cleanText(incomingMessages[key], 800, defaults.messages[key]),
    ])
  ) as unknown as OperationMessageSettings;
  return {
    stages,
    messages,
    defaultFollowUpDays:
      typeof source.defaultFollowUpDays === "number" &&
      Number.isInteger(source.defaultFollowUpDays) &&
      source.defaultFollowUpDays >= 0 &&
      source.defaultFollowUpDays <= 90
        ? source.defaultFollowUpDays
        : defaults.defaultFollowUpDays,
    openRouterApiKey: cleanText(
      source.openRouterApiKey,
      200,
      defaults.openRouterApiKey ?? ""
    ),
    openRouterModel: cleanText(
      source.openRouterModel,
      200,
      defaults.openRouterModel ?? "google/gemini-2.5-flash"
    ),
    agencySettings: source.agencySettings
      ? {
          name: cleanText(source.agencySettings.name, 150, defaults.agencySettings?.name ?? ""),
          cnpj: cleanText(source.agencySettings.cnpj, 30, defaults.agencySettings?.cnpj ?? ""),
          address: cleanText(source.agencySettings.address, 250, defaults.agencySettings?.address ?? ""),
          legalRepresentative: cleanText(source.agencySettings.legalRepresentative, 150, defaults.agencySettings?.legalRepresentative ?? ""),
          email: cleanText(source.agencySettings.email, 150, defaults.agencySettings?.email ?? ""),
          forumCity: cleanText(source.agencySettings.forumCity, 100, defaults.agencySettings?.forumCity ?? ""),
        }
      : defaults.agencySettings,
  };
}

export async function getOperationSettings() {
  if (!storageConfigured()) return cloneDefaults();
  const result = await get(SETTINGS_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200) return cloneDefaults();
  return parseSettings(JSON.parse(await new Response(result.stream).text()));
}

export async function saveOperationSettings(input: unknown) {
  if (!storageConfigured())
    throw new Error(
      "O armazenamento de leads ainda não foi configurado no Vercel Blob."
    );
  const settings = parseSettings(input);
  await put(SETTINGS_PATH, JSON.stringify(settings), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return settings;
}

export { parseSettings };
