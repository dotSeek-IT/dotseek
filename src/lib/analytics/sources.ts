/** Classifies where a visit came from: a named source (Google, LinkedIn...) and a channel. */

export type Channel = "Search" | "Social" | "AI assistants" | "Referral" | "Campaign" | "Direct";

const RULES: [RegExp, string, Channel][] = [
  [/(^|\.)gemini\.google\./, "AI assistants", "AI assistants"],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com|you\.com)$/, "AI assistants", "AI assistants"],
  [/(^|\.)google\.[a-z.]+$/, "Google", "Search"],
  [/(^|\.)bing\.com$/, "Bing", "Search"],
  [/(^|\.)(duckduckgo\.com|search\.yahoo\.com|yahoo\.com|ecosia\.org|search\.brave\.com|yandex\.[a-z]+|baidu\.com)$/, "Other search", "Search"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "Facebook", "Social"],
  [/(^|\.)instagram\.com$/, "Instagram", "Social"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn", "Social"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X", "Social"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube", "Social"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp", "Social"],
  [/(^|\.)(reddit\.com|tiktok\.com|pinterest\.[a-z.]+)$/, "Other social", "Social"],
];

const UTM: Record<string, [string, Channel]> = {
  google: ["Google", "Search"],
  bing: ["Bing", "Search"],
  facebook: ["Facebook", "Social"],
  fb: ["Facebook", "Social"],
  instagram: ["Instagram", "Social"],
  ig: ["Instagram", "Social"],
  linkedin: ["LinkedIn", "Social"],
  twitter: ["X", "Social"],
  x: ["X", "Social"],
  youtube: ["YouTube", "Social"],
  whatsapp: ["WhatsApp", "Social"],
  email: ["Email", "Campaign"],
  newsletter: ["Email", "Campaign"],
  chatgpt: ["AI assistants", "AI assistants"],
};

/** `referrer` is the full referrer URL (only its host is kept); `utm` is utm_source from the landing URL. */
export function classifySource(referrer: string | null, utm: string | null, ownHost: string): { source: string; channel: Channel; host?: string } {
  const tag = utm?.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 30);
  if (tag) {
    const known = UTM[tag];
    return known ? { source: known[0], channel: known[1] } : { source: "Campaign", channel: "Campaign", host: tag };
  }
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  if (!host || host === ownHost.split(":")[0]!.toLowerCase().replace(/^www\./, "")) return { source: "Direct", channel: "Direct" };
  for (const [re, source, channel] of RULES) if (re.test(host)) return { source, channel, host };
  return { source: "Referral", channel: "Referral", host: host.slice(0, 60) };
}

/** Friendly landing page names for the paths this site has. */
export function landingLabel(path: string, quoteLink: boolean): string {
  if (quoteLink) return "Quote link (email)";
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return "Homepage";
  if (p === "/about") return "About";
  if (p === "/contact") return "Contact";
  if (p === "/careers") return "Careers";
  if (p === "/insights") return "Insights";
  if (["/privacy", "/cookies", "/terms"].includes(p)) return "Legal pages";
  return "Other page";
}

export function browserOf(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/crios|chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

export const deviceOf = (ua: string): "desktop" | "mobile" | "tablet" =>
  /ipad|tablet/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop";
