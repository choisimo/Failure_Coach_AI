const DEFAULT_GATEWAY_URL = "https://ai-failure.nodove.com";

const getGatewayUrl = (): string => {
  const configured = import.meta.env.VITE_AI_GATEWAY_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : DEFAULT_GATEWAY_URL;
};

const getGatewayKey = (): string | undefined =>
  import.meta.env.VITE_AI_GATEWAY_KEY?.trim() || undefined;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionPayload {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionResponse {
  reply: string;
}

export async function requestCompletion(
  payload: CompletionPayload,
  signal?: AbortSignal
): Promise<CompletionResponse> {
  const { messages, model, temperature, max_tokens } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("No messages provided");
  }

  const endpoint = `${getGatewayUrl()}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const apiKey = getGatewayKey();
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body: Record<string, unknown> = { messages };
  if (model) body.model = model;
  if (temperature !== undefined) body.temperature = temperature;
  if (max_tokens !== undefined) body.max_tokens = max_tokens;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Completion error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json().catch(() => {
    throw new Error("Completion API returned non-JSON response");
  }) as Record<string, unknown>;

  const reply = extractReplyFromOpenAI(data);
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Completion response missing reply text");
  }

  return { reply: reply.trim() };
}

function extractReplyFromOpenAI(data: Record<string, unknown>): string | undefined {
  const choices = data?.choices as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    const message = choices[0]?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") return message.content;
    if (typeof choices[0]?.text === "string") return choices[0].text as string;
  }
  if (typeof data?.content === "string") return data.content;
  if (typeof data?.reply === "string") return data.reply;
  return undefined;
}

export interface GatewayPayload {
  messages: ChatMessage[];
  metadata?: {
    customSystemPrompt?: string;
    sessionMode?: "GUIDED" | "CUSTOM";
    [key: string]: unknown;
  };
}

export interface GatewayResponse {
  reply: string;
}

export async function requestGatewayCompletion(
  payload: GatewayPayload,
  signal?: AbortSignal
): Promise<GatewayResponse> {
  const { messages, metadata } = payload;
  const customSystemPrompt = metadata?.customSystemPrompt?.trim();
  const sessionMode = metadata?.sessionMode;

  const augmentedMessages: ChatMessage[] = [];

  if (sessionMode === "CUSTOM" && customSystemPrompt) {
    augmentedMessages.push({ role: "system", content: customSystemPrompt });
  }

  for (const m of messages) {
    if (m.role === "system") continue;
    augmentedMessages.push(m);
  }

  return requestCompletion({ messages: augmentedMessages }, signal);
}
