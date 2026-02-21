/**
 * Failure Coach AI — OpenAI-Compatible Gateway Worker
 *
 * Responsibilities:
 *  1. CORS enforcement (origin whitelist)
 *  2. Inject upstream API key and base URL from secrets (never exposed to browser)
 *  3. Forward /v1/chat/completions (and all /v1/* paths) to the upstream provider
 *  4. Stream passthrough support (SSE)
 *
 * Environment variables (wrangler.toml [vars]):
 *  ALLOWED_ORIGINS  — comma-separated list of allowed browser origins
 *
 * Secrets (wrangler secret put):
 *  OPENAI_API_URL   — upstream base URL (e.g. https://api.openai.com)
 *  OPENAI_API_KEY   — upstream API key
 *  OPENAI_MODEL     — default model name (e.g. gpt-4o); used when no model in body
 */

type Env = {
  /** Comma-separated allowed browser origins, e.g. "https://ai-failure-chat.nodove.com,http://localhost:8080" */
  ALLOWED_ORIGINS?: string;
  /** Upstream OpenAI-compatible base URL — managed as a secret */
  OPENAI_API_URL: string;
  /** Upstream API key — managed as a secret */
  OPENAI_API_KEY: string;
  /** Default model name — managed as a secret */
  OPENAI_MODEL: string;
};

const CORS_MAX_AGE = "600";

function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string, allowed: string[]): boolean {
  return allowed.includes("*") || allowed.includes(origin);
}

function applyCors(headers: Headers, origin: string, requestedHeaders?: string | null): void {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", CORS_MAX_AGE);

  const base = ["Content-Type", "Authorization"];
  const extra = (requestedHeaders ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  headers.set("Access-Control-Allow-Headers", [...new Set([...base, ...extra])].join(", "));
}

function jsonResponse(data: unknown, status = 200, corsOrigin?: string): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (corsOrigin) applyCors(headers, corsOrigin);
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = parseOrigins(env.ALLOWED_ORIGINS);
    const originAllowed = !!origin && isOriginAllowed(origin, allowed);

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        return jsonResponse({ error: "Forbidden: origin not allowed" }, 403);
      }
      const res = new Response(null, { status: 204 });
      applyCors(res.headers, origin, request.headers.get("Access-Control-Request-Headers"));
      return res;
    }

    // ── Origin check for non-preflight ─────────────────────────────────────
    if (!originAllowed) {
      return jsonResponse({ error: "Forbidden: origin not allowed" }, 403);
    }

    // ── Secret validation ───────────────────────────────────────────────────
    if (!env.OPENAI_API_URL || !env.OPENAI_API_KEY) {
      return jsonResponse(
        { error: "Worker misconfiguration: OPENAI_API_URL or OPENAI_API_KEY not set" },
        500,
        origin
      );
    }

    // ── Build upstream URL ──────────────────────────────────────────────────
    // Strip the worker's own hostname; keep path + search
    const incomingUrl = new URL(request.url);
    const baseUrl = env.OPENAI_API_URL.replace(/\/$/, "");
    const upstreamUrl = `${baseUrl}${incomingUrl.pathname}${incomingUrl.search}`;

    // ── Inject model default if not present in body ─────────────────────────
    let upstreamBody: BodyInit | undefined;
    if (
      request.method === "POST" &&
      request.headers.get("Content-Type")?.includes("application/json") &&
      env.OPENAI_MODEL
    ) {
      try {
        const body = await request.json() as Record<string, unknown>;
        if (!body.model) {
          body.model = env.OPENAI_MODEL;
        }
        upstreamBody = JSON.stringify(body);
      } catch {
        // If JSON parsing fails, forward the raw body as-is
        upstreamBody = request.body ?? undefined;
      }
    } else {
      upstreamBody = request.method === "GET" ? undefined : (request.body ?? undefined);
    }

    // ── Forward request ─────────────────────────────────────────────────────
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set("Authorization", `Bearer ${env.OPENAI_API_KEY}`);
    upstreamHeaders.delete("Origin");
    upstreamHeaders.delete("Host");
    upstreamHeaders.delete("CF-Connecting-IP");
    upstreamHeaders.delete("CF-Ray");
    upstreamHeaders.delete("CF-IPCountry");
    upstreamHeaders.delete("CF-Visitor");

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: upstreamBody,
      redirect: "follow",
    });

    try {
      const upstreamRes = await fetch(upstreamRequest);

      // Passthrough response (including streaming SSE)
      const resHeaders = new Headers(upstreamRes.headers);
      resHeaders.delete("Access-Control-Allow-Origin");
      applyCors(resHeaders, origin);

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      console.error("[gateway] upstream fetch failed", err);
      return jsonResponse({ error: "Upstream fetch failed" }, 502, origin);
    }
  },
};
