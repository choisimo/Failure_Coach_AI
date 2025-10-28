const DEFAULT_GATEWAY_URL = "https://ai-check.nodove.com";

const getGatewayUrl = () => {
  const configured = import.meta.env.VITE_AI_GATEWAY_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return DEFAULT_GATEWAY_URL;
};

const getGatewayKey = () => import.meta.env.VITE_AI_GATEWAY_KEY?.trim();

export interface GatewayMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GatewayPayload {
  messages: GatewayMessage[];
  metadata?: Record<string, unknown>;
}

export interface GatewayResponse {
  reply: string;
  raw: unknown;
}

export async function requestGatewayCompletion(payload: GatewayPayload, signal?: AbortSignal): Promise<GatewayResponse> {
  const endpoint = `${getGatewayUrl()}/v1/chat`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = getGatewayKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json().catch(() => {
    throw new Error("Gateway returned non-JSON response");
  });

  const reply =
    data?.reply ??
    data?.message ??
    data?.result ??
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Gateway response missing reply text");
  }

  return {
    reply: reply.trim(),
    raw: data,
  };
}
