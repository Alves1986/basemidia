import { get, put } from "@vercel/blob";
import webpush from "web-push";
import { getAuthenticatedAdmin, jsonResponse } from "./_lib/auth.js";
import {
  sendWebResponse,
  toWebRequest,
  type VercelResponseLike,
} from "./_lib/vercel.js";

const SUBSCRIPTIONS_PATH = "base-midia/config/subscriptions.json";

function storageConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

// Config web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:contato@basemidia.com.br",
    vapidPublicKey,
    vapidPrivateKey
  );
}

async function getSubscriptions(): Promise<any[]> {
  if (!storageConfigured()) return [];
  try {
    const result = await get(SUBSCRIPTIONS_PATH, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) || [];
  } catch {
    return [];
  }
}

async function saveSubscriptions(subscriptions: any[]) {
  if (!storageConfigured()) return;
  await put(SUBSCRIPTIONS_PATH, JSON.stringify(subscriptions), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function sendPushNotification(payload: any) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured, skipping push.");
    return;
  }
  const subs = await getSubscriptions();
  if (!subs.length) return;

  const stringPayload = JSON.stringify(payload);
  const invalidSubs: Set<string> = new Set();

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, stringPayload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid
          invalidSubs.add(sub.endpoint);
        } else {
          console.error("[Push] Falha ao enviar notificação", err);
        }
      }
    })
  );

  // Clean up invalid subscriptions
  if (invalidSubs.size > 0) {
    const activeSubs = subs.filter((s) => !invalidSubs.has(s.endpoint));
    await saveSubscriptions(activeSubs);
  }
}

export default async function handler(
  request: any,
  response: VercelResponseLike
) {
  const webRequest = toWebRequest(request);

  if (webRequest.method !== "POST") {
    return sendWebResponse(
      jsonResponse({ error: "Método não permitido." }, { status: 405 }),
      response
    );
  }

  if (!(await getAuthenticatedAdmin(webRequest))) {
    return sendWebResponse(
      jsonResponse({ error: "Acesso restrito." }, { status: 401 }),
      response
    );
  }

  try {
    const body: any = await webRequest.json();
    if (body.action === "subscribe") {
      const { subscription } = body;
      if (!subscription) {
        return sendWebResponse(
          jsonResponse({ error: "Assinatura inválida." }, { status: 400 }),
          response
        );
      }
      const subs = await getSubscriptions();
      const exists = subs.find((s) => s.endpoint === subscription.endpoint);
      if (!exists) {
        subs.push(subscription);
        await saveSubscriptions(subs);
      }
      return sendWebResponse(jsonResponse({ success: true }), response);
    }
    
    if (body.action === "unsubscribe") {
      const { endpoint } = body;
      const subs = await getSubscriptions();
      const filtered = subs.filter((s) => s.endpoint !== endpoint);
      await saveSubscriptions(filtered);
      return sendWebResponse(jsonResponse({ success: true }), response);
    }

    return sendWebResponse(
      jsonResponse({ error: "Ação desconhecida." }, { status: 400 }),
      response
    );
  } catch (err) {
    console.error("[Push] Erro", err);
    return sendWebResponse(
      jsonResponse({ error: "Erro interno no servidor." }, { status: 500 }),
      response
    );
  }
}
