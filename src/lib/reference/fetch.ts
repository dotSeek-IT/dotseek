import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Fetches a public web page a customer pasted as a reference, safely:
 * http(s) only on standard ports, public IP addresses only (no localhost,
 * private, link-local or metadata ranges), every redirect re-checked, and
 * strict time and size limits. Used only to read publicly visible HTML.
 */

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const USER_AGENT = "DotSeekReferenceBot/1.0 (+https://www.dotseek.co.uk; reference analysis requested by a visitor)";

function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? privateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export class ReferenceFetchError extends Error {}

/** Normalises what a visitor typed ("example.com", "https://example.com/app") into a safe URL, or throws. */
export function normaliseUrl(input: string): URL {
  let raw = input.trim();
  // An explicit non-web scheme (file:, ftp:, javascript: ...) is refused rather than guessed at.
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw) && !/^[^:/]+:\d+(\/|$)/.test(raw)) {
    throw new ReferenceFetchError("Only http and https links can be analysed.");
  }
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ReferenceFetchError("That doesn't look like a web address.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new ReferenceFetchError("Only http and https links can be analysed.");
  if (url.username || url.password) throw new ReferenceFetchError("Links with sign in details can't be analysed.");
  if (url.port && !["80", "443"].includes(url.port)) throw new ReferenceFetchError("Only standard web ports can be analysed.");
  if (!url.hostname.includes(".") || url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")) {
    throw new ReferenceFetchError("Please use a public website address.");
  }
  return url;
}

async function assertPublic(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw new ReferenceFetchError("We couldn't find that website.");
  if (addresses.some((a) => privateIp(a.address))) throw new ReferenceFetchError("Please use a public website address.");
}

/** Returns the final URL and up to 1.5 MB of text (HTML or XML). */
export async function fetchPublicText(input: URL, accept = "text/html,application/xhtml+xml"): Promise<{ url: URL; text: string; contentType: string }> {
  let url = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en-GB,en;q=0.8" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => {
      throw new ReferenceFetchError("We couldn't reach that website.");
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      if (!next) throw new ReferenceFetchError("That website redirected without a destination.");
      url = normaliseUrl(new URL(next, url).toString());
      continue;
    }
    if (!response.ok) throw new ReferenceFetchError(`That website responded with an error (${response.status}).`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!/html|xml|text\/plain/i.test(contentType)) throw new ReferenceFetchError("That link isn't a web page.");
    const reader = response.body?.getReader();
    if (!reader) return { url, text: "", contentType };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      size += value.length;
    }
    await reader.cancel().catch(() => undefined);
    return { url, text: new TextDecoder().decode(Buffer.concat(chunks)).slice(0, MAX_BYTES), contentType };
  }
  throw new ReferenceFetchError("That website redirected too many times.");
}
