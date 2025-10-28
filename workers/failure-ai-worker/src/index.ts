type Env = {
  AI_GATEWAY_ALLOWED_ORIGINS?: string;
  AI_GATEWAY_BACKEND_HOST: string;
  SECRET_INTERNAL_KEY: string;
  SECRET_CALLER_KEY?: string;
  GITHUB_TOKEN?: string;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    status: init?.status ?? 200,
  });
}

function applyCors(headers: Headers, origin: string, requestHeaders?: string | null) {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Method");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  const incoming = (requestHeaders || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const base = ["Content-Type", "X-API-KEY"];
  const merged = Array.from(new Set([...base, ...incoming])).join(", ");
  headers.set("Access-Control-Allow-Headers", merged);
  headers.set("Access-Control-Max-Age", "600");
}

async function streamBody(request: Request) {
  if (["GET", "HEAD"].includes(request.method)) {
    return undefined;
  }

  // Cloudflare Workers supports request.arrayBuffer or request.text.
  // Using arrayBuffer to support binary payloads if needed.
  const buf = await request.arrayBuffer();
  return buf;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const callerKey = request.headers.get("X-Gateway-Caller-Key") || "";
    const allowed = (env.AI_GATEWAY_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const isBrowserAllowed = !!origin && (allowed.includes("*") || allowed.includes(origin));
    const isWorkerAllowed = !origin && !!env.SECRET_CALLER_KEY && callerKey === env.SECRET_CALLER_KEY;

    if (request.method === "OPTIONS") {
      if (!isBrowserAllowed) {
        return json({ error: "Forbidden: Invalid origin" }, { status: 403 });
      }
      const res = new Response(null, { status: 204 });
      applyCors(res.headers, origin, request.headers.get("Access-Control-Request-Headers"));
      return res;
    }

    if (!(isBrowserAllowed || isWorkerAllowed)) {
      return json({ error: "Forbidden: Invalid origin" }, { status: 403 });
    }

    if (!env.SECRET_INTERNAL_KEY || !env.GITHUB_TOKEN) {
      const res = json({ error: "Server misconfiguration: missing required secrets" }, { status: 500 });
      if (isBrowserAllowed && origin) {
        applyCors(res.headers, origin, request.headers.get("Access-Control-Request-Headers"));
      }
      return res;
    }

    const url = new URL(request.url);
    url.hostname = env.AI_GATEWAY_BACKEND_HOST;
    url.protocol = "https:";

    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("Host", env.AI_GATEWAY_BACKEND_HOST);

    reqHeaders.delete("X-API-KEY");
    reqHeaders.delete("X-Gateway-Caller-Key");
    reqHeaders.delete("X-Internal-Gateway-Key");
    reqHeaders.delete("Authorization");

    reqHeaders.set("X-Internal-Gateway-Key", env.SECRET_INTERNAL_KEY);
    reqHeaders.set("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
    reqHeaders.set("X-Forwarded-Authorization", `Bearer ${env.GITHUB_TOKEN}`);

    const forwarded = new Request(url.toString(), {
      method: request.method,
      headers: reqHeaders,
      body: await streamBody(request),
      redirect: "manual",
    });

    try {
      const backendRes = await fetch(forwarded);
      const headers = new Headers(backendRes.headers);
      if (isBrowserAllowed && origin) {
        applyCors(headers, origin);
      }
      return new Response(backendRes.body, { status: backendRes.status, headers });
    } catch (err) {
      console.error("ai-check-gateway: upstream fetch failed", err);
      const res = json({ error: "Upstream fetch failed" }, { status: 502 });
      if (isBrowserAllowed && origin) {
        applyCors(res.headers, origin, request.headers.get("Access-Control-Request-Headers"));
      }
      return res;
    }
  },
};
