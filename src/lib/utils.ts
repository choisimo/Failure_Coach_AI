import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Stable serialize role/content history for hashing
export function serializeHistory(
  history: Array<{ role: string; content: string }>
): string {
  // Map to tuples to avoid key order issues and reduce size
  return JSON.stringify(history.map((m) => [m.role, m.content]));
}

// Simple non-cryptographic fallback hash (53-bit) as hex
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch: number; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  // Combine to 53-bit and return hex
  const x = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return x.toString(16);
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  try {
    const subtle = (globalThis as any)?.crypto?.subtle as SubtleCrypto | undefined;
    if (!subtle) throw new Error("no subtle crypto");
    const data = enc.encode(input);
    const digest = await subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback to non-crypto hash
    return cyrb53(input);
  }
}

export async function computeHistoryHash(
  history: Array<{ role: string; content: string }>
): Promise<string> {
  return sha256Hex(serializeHistory(history));
}
