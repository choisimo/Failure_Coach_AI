const DEFAULT_GATEWAY_URL = "https://ai-serve.nodove.com";

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

// Cache session ids per conversation so we reuse server-side context
const sessionCache = new Map<string, string>();

async function createSession(title: string, signal?: AbortSignal): Promise<{ id: string; raw: unknown }> {
  const endpoint = `${getGatewayUrl()}/session`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const apiKey = getGatewayKey();
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Session create error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json().catch(() => {
    throw new Error("Session API returned non-JSON response");
  });

  const id = data?.id ?? data?.sessionId ?? data?.session?.id ?? data?.data?.id;
  if (typeof id !== "string" || !id) {
    throw new Error("Session API response missing id");
  }
  return { id, raw: data };
}

async function sendMessage(sessionId: string, content: string, signal?: AbortSignal): Promise<unknown> {
  const endpoint = `${getGatewayUrl()}/session/${encodeURIComponent(sessionId)}/message`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const apiKey = getGatewayKey();
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const payload = {
    content,
    parts: [
      {
        type: "text",
        text: content,
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Message send error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json().catch(() => {
    throw new Error("Message API returned non-JSON response");
  });

  return data;
}

function extractReply(data: any): string | undefined {
  // Common shapes first
  if (typeof data?.reply === "string") return data.reply;
  if (typeof data?.content === "string") return data.content;
  if (typeof data?.result === "string") return data.result;

  // OpenAI-like
  const openai = data?.choices?.[0];
  if (openai?.message?.content) return openai.message.content;
  if (typeof openai?.text === "string") return openai.text;

  // message object
  if (typeof data?.message?.content === "string") return data.message.content;

  // arrays of messages or parts
  const messages = Array.isArray(data?.messages) ? data.messages : Array.isArray(data?.data?.messages) ? data.data.messages : undefined;
  if (Array.isArray(messages) && messages.length) {
    const assistant = messages.find((m: any) => m?.role === "assistant" && typeof m?.content === "string");
    if (assistant?.content) return assistant.content;
    const firstWithContent = messages.find((m: any) => typeof m?.content === "string");
    if (firstWithContent?.content) return firstWithContent.content;
  }

  const parts = Array.isArray(data?.parts) ? data.parts : Array.isArray(data?.message?.parts) ? data.message.parts : undefined;
  if (Array.isArray(parts) && parts.length) {
    const textParts = parts
      .map((p: any) => (typeof p === "string" ? p : typeof p?.text === "string" ? p.text : undefined))
      .filter(Boolean);
    if (textParts.length) return textParts.join("\n\n");
  }

  return undefined;
}

export async function requestGatewayCompletion(payload: GatewayPayload, signal?: AbortSignal): Promise<GatewayResponse> {
  const { messages, metadata } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("No messages provided to gateway");
  }

  // Identify the latest user message to send
  const latestUser = [...messages].reverse().find(m => m.role === "user");
  if (!latestUser || !latestUser.content?.trim()) {
    throw new Error("No user message content to send");
  }

  const conversationId = (metadata as any)?.conversationId as string | undefined;

  let sessionId: string | undefined = conversationId ? sessionCache.get(conversationId) : undefined;
  let sessionCreateRaw: unknown | undefined;

  if (!sessionId) {
    const titleSource = messages.find(m => m.role === "user")?.content || "Conversation";
    const { id, raw } = await createSession(titleSource.slice(0, 80), signal);
    sessionId = id;
    sessionCreateRaw = raw;
    if (conversationId) {
      sessionCache.set(conversationId, sessionId);
    }
  }

  const messageData = await sendMessage(sessionId!, latestUser.content, signal);
  const reply = extractReply(messageData);

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Gateway response missing reply text");
  }

  return {
    reply: reply.trim(),
    raw: { sessionCreate: sessionCreateRaw, message: messageData },
  };
}
