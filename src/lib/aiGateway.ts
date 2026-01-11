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

export type GatewaySessionMessage = {
  id?: string;
  role?: "user" | "assistant" | "system";
  content?: string;
  noReply?: boolean;
  metadata?: Record<string, unknown>;
  parts?: Array<{ type?: string; text?: string }>;
};

// Cache session ids per conversation so we reuse server-side context
const sessionCache = new Map<string, string>();

async function createSession(
  title: string,
  metadata?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ id: string; raw: unknown }> {
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
    body: JSON.stringify({ title, metadata }),
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

type MessageBody = {
  kind?: string;
  content: string;
  noReply?: boolean;
  parts?: Array<{ type: string; text: string }>;
  metadata?: Record<string, unknown>;
};

async function postMessage(sessionId: string, body: MessageBody, signal?: AbortSignal): Promise<unknown> {
  const endpoint = `${getGatewayUrl()}/session/${encodeURIComponent(sessionId)}/message`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const apiKey = getGatewayKey();
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const payload: MessageBody = {
    kind: body.kind ?? "prompt",
    content: body.content,
    noReply: body.noReply,
    parts: body.parts ?? [
      {
        type: "text",
        text: body.content,
      },
    ],
    metadata: body.metadata,
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

export async function getSessionMessages(sessionId: string, signal?: AbortSignal): Promise<GatewaySessionMessage[]> {
  const endpoint = `${getGatewayUrl()}/session/${encodeURIComponent(sessionId)}/message`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = getGatewayKey();
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, { method: "GET", headers, signal });
  if (!response.ok) {
    throw new Error(`Message list error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json().catch(() => {
    throw new Error("Message list API returned non-JSON response");
  });

  const list: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : Array.isArray(data?.data) ? data.data : [];
  return list as GatewaySessionMessage[];
}

interface AnyRecord {
  [key: string]: unknown;
}

function extractReply(data: unknown): string | undefined {
  const d = data as AnyRecord | null | undefined;
  // Common shapes first
  if (typeof d?.reply === "string") return d.reply;
  if (typeof d?.content === "string") return d.content;
  if (typeof d?.result === "string") return d.result;

  // OpenAI-like
  const choices = d?.choices as AnyRecord[] | undefined;
  const openai = Array.isArray(choices) ? choices[0] : undefined;
  const openaiMessage = openai?.message as AnyRecord | undefined;
  if (typeof openaiMessage?.content === "string") return openaiMessage.content;
  if (typeof openai?.text === "string") return openai.text;

  // message object
  const messageObj = d?.message as AnyRecord | undefined;
  if (typeof messageObj?.content === "string") return messageObj.content;

  // arrays of messages or parts
  const dataData = d?.data as AnyRecord | undefined;
  const messages = Array.isArray(d?.messages) ? (d.messages as AnyRecord[]) : Array.isArray(dataData?.messages) ? (dataData.messages as AnyRecord[]) : undefined;
  if (Array.isArray(messages) && messages.length) {
    const assistant = messages.find((m) => m?.role === "assistant" && typeof m?.content === "string");
    if (typeof assistant?.content === "string") return assistant.content;
    const firstWithContent = messages.find((m) => typeof m?.content === "string");
    if (typeof firstWithContent?.content === "string") return firstWithContent.content;
  }

  const messageParts = messageObj?.parts as unknown[] | undefined;
  const parts = Array.isArray(d?.parts) ? (d.parts as unknown[]) : Array.isArray(messageParts) ? messageParts : undefined;
  if (Array.isArray(parts) && parts.length) {
    const textParts = parts
      .map((p) => {
        if (typeof p === "string") return p;
        const pObj = p as AnyRecord | null | undefined;
        if (typeof pObj?.text === "string") return pObj.text;
        return undefined;
      })
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
  const latestUser = [...messages].reverse().find((m) => m.role === "user");
  if (!latestUser || !latestUser.content?.trim()) {
    throw new Error("No user message content to send");
  }

  const meta = (metadata as AnyRecord) || {};
  const conversationId = meta.conversationId as string | undefined;
  const mode = meta.sessionMode as ("GUIDED" | "CUSTOM" | undefined);
  const customSystemPrompt = meta.customSystemPrompt as string | undefined;
  const personaTitle = meta.personaTitle as string | undefined;
  const providedSessionId = meta.sessionId as string | undefined;

  // Prefer provided sessionId (e.g., from store) then cache
  let sessionId: string | undefined = providedSessionId || (conversationId ? sessionCache.get(conversationId) : undefined);
  let sessionCreateRaw: unknown | undefined;

  if (!sessionId) {
    // Title rules: prefix for CUSTOM, otherwise from first user message
    const firstUserContent = messages.find((m) => m.role === "user")?.content || "Conversation";
    const titleSource = mode === "CUSTOM" ? `Persona: ${personaTitle || "커스텀 세션"}` : firstUserContent.slice(0, 80);

    // Only include metadata for CUSTOM mode
    const sessionMetadata: Record<string, unknown> | undefined = mode === "CUSTOM"
      ? {
          sessionMode: mode,
          customSystemPrompt,
          personaTitle,
          conversationId,
        }
      : undefined;

    const created = await createSession(titleSource, sessionMetadata, signal);
    sessionId = created.id;
    sessionCreateRaw = created.raw;

    // Inject seed system prompt for CUSTOM if provided
    if (mode === "CUSTOM" && customSystemPrompt?.trim()) {
      try {
        await postMessage(sessionId, {
          kind: "prompt",
          content: customSystemPrompt,
          noReply: true,
          metadata: { source: "custom-mode-seed", personaTitle, customSystemPrompt },
        }, signal);
      } catch (e) {
        // Rollback cache entry on seed failure
        if (conversationId) sessionCache.delete(conversationId);
        throw e instanceof Error ? e : new Error("Failed to send seed prompt");
      }
    }

    if (conversationId) {
      sessionCache.set(conversationId, sessionId);
    }
  }

  // Send the actual user message (include metadata for policy/IRL)
  const messageData = await postMessage(
    sessionId!,
    { content: latestUser.content, metadata: meta },
    signal
  );
  const reply = extractReply(messageData);

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Gateway response missing reply text");
  }

  return {
    reply: reply.trim(),
    raw: { sessionCreate: sessionCreateRaw, sessionId, message: messageData },
  };
}

// ---- Optional IRL helper APIs ----
export interface IRLPolicyInfo {
  id?: string;
  version?: string;
  label?: string;
  description?: string;
}

export async function listPolicies(signal?: AbortSignal): Promise<IRLPolicyInfo[]> {
  const endpoint = `${getGatewayUrl()}/irl/policies`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = getGatewayKey();
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(endpoint, { headers, method: "GET", signal });
  if (!res.ok) throw new Error(`Policies error: ${res.status} ${res.statusText}`);
  const data = await res.json().catch(() => []);
  const arr: AnyRecord[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.policies)
    ? data.policies
    : Array.isArray(data?.data)
    ? data.data
    : [];
  return arr.map((p) => ({
    id: p?.id ?? p?.policyId ?? p?.name,
    version: p?.version ?? p?.policyVersion,
    label: p?.label ?? p?.title ?? p?.name,
    description: p?.description ?? p?.details ?? undefined,
  }));
}

export interface FeedbackEvent {
  conversationId?: string;
  sessionId?: string;
  messageId?: string;
  candidateId?: string;
  action: string; // e.g., "like" | "unlike" | "regenerate" | "copy" | "save"
  traceId?: string;
  policyId?: string;
  scores?: Record<string, unknown>;
  comment?: string;
}

const getFeedbackPath = () => {
  const configured = import.meta.env.VITE_IRL_FEEDBACK_PATH?.trim();
  const path = configured && configured.length > 0 ? configured : "/v1/irl/feedback";
  return path.startsWith("/") ? path : `/${path}`;
};

export async function sendFeedback(event: FeedbackEvent, signal?: AbortSignal): Promise<void> {
  const endpoint = `${getGatewayUrl()}${getFeedbackPath()}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const apiKey = getGatewayKey();
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(event), signal });
  if (!res.ok) throw new Error(`Feedback error: ${res.status} ${res.statusText}`);
}

export type IRLMetadata = {
  policyId?: string;
  irlScore?: number;
  safetyScore?: number;
  rank?: number;
  reason?: string;
  traceId?: string;
  candidateId?: string;
  candidateSet?: AnyRecord[];
  [key: string]: unknown;
};

export function extractIRLMetadata(raw: unknown): IRLMetadata {
  const r = (raw || {}) as AnyRecord;
  const candidates: AnyRecord[] = [];
  // Ordered search for metadata across common shapes
  const messageObj = r?.message as AnyRecord | undefined;
  const messageData = messageObj?.data as AnyRecord | undefined;
  const dataObj = r?.data as AnyRecord | undefined;
  const rMetadata = r?.metadata as AnyRecord | undefined;
  const messageMetadata = messageObj?.metadata as AnyRecord | undefined;

  const metaCandidate =
    rMetadata ||
    messageMetadata ||
    messageData?.metadata ||
    dataObj?.metadata ||
    rMetadata?.chosen ||
    messageMetadata?.chosen ||
    undefined;

  const m = (metaCandidate && typeof metaCandidate === "object") ? (metaCandidate as AnyRecord) : {};
  const chosen = (m?.chosen && typeof m.chosen === "object") ? (m.chosen as AnyRecord) : undefined;
  const mScores = m?.scores as AnyRecord | undefined;
  const chosenScores = chosen?.scores as AnyRecord | undefined;
  const scores = (mScores && typeof mScores === "object") ? mScores : (chosenScores || {});

  const pick = (obj: AnyRecord | undefined, keys: string[]) => keys.map((k) => obj?.[k]).find((v) => v != null);

  const result: IRLMetadata = {
    policyId: (pick(m, ["policyId", "policy_id"]) ?? pick(chosen, ["policyId", "policy_id"]) ?? undefined) as string | undefined,
    irlScore: (pick(m, ["irlScore"]) ?? pick(scores, ["irl"]) ?? pick(chosen, ["irlScore"])) as number | undefined,
    safetyScore: (pick(m, ["safetyScore"]) ?? pick(scores, ["safety"]) ?? pick(chosen, ["safetyScore"])) as number | undefined,
    rank: (pick(m, ["rank"]) ?? pick(chosen, ["rank"])) as number | undefined,
    reason: (pick(m, ["reason"]) ?? pick(chosen, ["reason"])) as string | undefined,
    traceId: (pick(m, ["traceId", "trace_id", "traceID"]) ?? pick(chosen, ["traceId", "trace_id", "traceID"])) as string | undefined,
    candidateId: (pick(m, ["candidateId"]) ?? pick(chosen, ["id", "candidateId"])) as string | undefined,
    candidateSet: Array.isArray(m?.candidates) ? (m.candidates as AnyRecord[]) : Array.isArray(r?.candidates) ? (r.candidates as AnyRecord[]) : candidates,
  };

  return result;
}

export async function sendFeedbackReliable(event: FeedbackEvent, opts?: { onFinalFailure?: (err: unknown) => void }): Promise<void> {
  const delays = [500, 1000, 2000];
  let attempt = 0;
  const tryOnce = async (): Promise<void> => {
    try {
      await sendFeedback(event);
    } catch (err) {
      if (attempt >= delays.length) {
        console.warn("IRL feedback failed after retries", err);
        opts?.onFinalFailure?.(err);
        return;
      }
      const delay = delays[attempt++];
      console.warn(`IRL feedback failed, retrying in ${delay}ms`, err);
      await new Promise((res) => setTimeout(res, delay));
      return tryOnce();
    }
  };
  return tryOnce();
}
