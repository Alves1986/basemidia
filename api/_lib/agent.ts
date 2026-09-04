import { getOperationSettings } from "./operation.js";

export function openRouterConfig(settingsKey?: string, settingsModel?: string) {
  const apiKey = settingsKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api/v1"
    ).replace(/\/$/, ""),
    model:
      settingsModel ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash",
  };
}

export async function runAgent(
  systemPrompt: string,
  userPrompt: string,
  agentName: string
): Promise<string> {
  const settings = await getOperationSettings();
  const config = openRouterConfig(
    settings.openRouterApiKey,
    settings.openRouterModel
  );

  if (!config) {
    throw new Error("API Key do OpenRouter não configurada.");
  }

  const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
      "X-OpenRouter-Title": `BASE MÍDIA — Agente: ${agentName}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(45000), // Agents might take longer
  });

  if (!upstream.ok) {
    throw new Error(`OpenRouter respondeu com erro ${upstream.status}`);
  }

  const payload = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  
  if (!content) throw new Error(`Resposta vazia do agente ${agentName}`);

  return content;
}
