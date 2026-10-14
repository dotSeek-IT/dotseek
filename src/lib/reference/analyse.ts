import "server-only";
import type { ReferenceAnalysis, ReferenceFeature } from "@/lib/plan/reference";
import { fetchPublicText, normaliseUrl } from "./fetch";

/**
 * Reads a reference page's public HTML for evidence of features and
 * complexity. The result feeds the AI (which refines it) or is used directly
 * when the AI isn't available. Only public, visible information is used.
 */

export type ReferenceSignals = Omit<ReferenceAnalysis, "summary" | "costDrivers" | "source"> & {
  /** Visible text sample for the AI (trimmed). */
  text: string;
  platform?: string;
};

const SERVICES: [RegExp, string][] = [
  [/js\.stripe\.com|stripe\.com\/v3/i, "Stripe"],
  [/paypal\.com\/sdk|paypalobjects/i, "PayPal"],
  [/intercom/i, "Intercom"],
  [/drift\.com|js\.driftt/i, "Drift"],
  [/tidio/i, "Tidio"],
  [/zendesk|zdassets/i, "Zendesk"],
  [/crisp\.chat/i, "Crisp"],
  [/tawk\.to/i, "Tawk.to"],
  [/hubspot|hs-scripts|hsforms/i, "HubSpot"],
  [/salesforce|pardot/i, "Salesforce"],
  [/mailchimp|list-manage\.com/i, "Mailchimp"],
  [/klaviyo/i, "Klaviyo"],
  [/calendly/i, "Calendly"],
  [/maps\.googleapis|google\.com\/maps|mapbox/i, "Maps"],
  [/youtube\.com\/embed|player\.vimeo/i, "Video embeds"],
  [/googletagmanager|google-analytics|gtag\(/i, "Analytics"],
  [/recaptcha|hcaptcha|turnstile/i, "Bot protection"],
  [/algolia/i, "Algolia search"],
  [/firebase/i, "Firebase"],
  [/supabase/i, "Supabase"],
  [/auth0|clerk\.|cognito/i, "Hosted sign-in"],
];

const PLATFORMS: [RegExp, string][] = [
  [/wp-content|wordpress/i, "WordPress"],
  [/cdn\.shopify|shopify/i, "Shopify"],
  [/webflow/i, "Webflow"],
  [/wix\.com|wixstatic/i, "Wix"],
  [/squarespace/i, "Squarespace"],
  [/__next|_next\/static/i, "Next.js"],
  [/ng-version|angular/i, "Angular"],
  [/data-reactroot|react/i, "React"],
  [/nuxt|vue/i, "Vue"],
];

const strip = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

async function sitemapCount(origin: string): Promise<number> {
  try {
    const { text } = await fetchPublicText(normaliseUrl(`${origin}/sitemap.xml`), "application/xml,text/xml");
    const locs = (text.match(/<loc>/gi) ?? []).length;
    // A sitemap index lists other sitemaps; treat each as several pages.
    return /<sitemapindex/i.test(text) ? locs * 20 : locs;
  } catch {
    return 0;
  }
}

/** App Store / Google Play listing: scope comes from the app's own description, not the store page. */
function readStoreListing(url: URL, html: string): ReferenceSignals {
  type App = { name?: string; description?: string; applicationCategory?: string; offers?: { price?: number | string } };
  let app: App = {};
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]) as App & { "@type"?: string };
      if (data["@type"] === "SoftwareApplication" || data["@type"] === "MobileApplication") app = data;
    } catch {
      /* ignore malformed blocks */
    }
  }
  const name = app.name ?? (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "App").replace(/^\u200e/, "").split(" - ")[0].trim();
  const description = (app.description ?? html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? "").slice(0, 5000);
  const d = description.toLowerCase();
  const has = (re: RegExp) => re.test(d);
  const store = url.hostname.includes("apple") ? "App Store" : "Google Play";
  const category = (app.applicationCategory ?? "").replace(/Application$/, "");
  const evidence = [`${store} listing: ${name}${category ? ` (${category})` : ""}`];
  const features: Partial<Record<ReferenceFeature, boolean>> = { mobileApp: true, backend: true, database: true };
  const services: string[] = [];
  const mark = (f: ReferenceFeature, ok: boolean, why: string) => {
    if (!ok) return;
    features[f] = true;
    evidence.push(why);
  };
  mark("auth", has(/\b(account|profile|sign ?in|log ?in|sign ?up|community|clubs?|members?)\b/), "User accounts and profiles");
  mark("realtime", has(/real[- ]time|live (stats|activities|tracking|updates)|instant/), "Real-time updates");
  mark("payments", has(/subscription|premium|in-app purchase|\bpay(ment)?s?\b|checkout|wallet/) || /In-App Purchases/i.test(html), "Payments or subscriptions");
  mark("booking", has(/\bbook(ing)?s?\b|appointment|reserv/), "Bookings");
  mark("chatbot", has(/chatbot|virtual assistant/), "Chat assistant");
  mark("ai", has(/\b(ai|artificial intelligence|machine learning|smart (coach|suggestions|recommendations)|personalis|personaliz)/), "AI or personalisation");
  mark("reporting", has(/stats|statistics|analytics|insights|progress|history|reports?|charts?/), "Stats, progress and reporting");
  mark("roles", has(/\b(clubs?|teams?|groups?|coaches|trainers|admins?)\b/), "Clubs, teams or groups");
  mark("customerPortal", has(/leaderboard|challenges?|rewards?|points|badges/), "Challenges, leaderboards and rewards");
  mark("search", has(/\bsearch|discover|explore\b/), "Search and discovery");
  mark("multilang", has(/languages|multilingual/), "Multiple languages");
  if (has(/gps|map|location|route/)) services.push("Maps and location");
  if (has(/healthkit|apple health/)) services.push("Apple HealthKit");
  if (has(/google fit|health connect/)) services.push("Google Fit / Health Connect");
  if (has(/apple music|spotify/)) services.push("Music integration");
  if (has(/strava|garmin|fitbit|wear ?os|apple watch/)) services.push("Wearables");
  if (has(/push|notification|reminder/)) services.push("Push notifications");
  if (has(/share|social/)) services.push("Social sharing");
  if (services.length) {
    features.integrations = true;
    evidence.push(`Integrations: ${services.join(", ")}`);
  }
  // Rewards, challenges and communities need content and user management behind the app.
  features.admin = Boolean(features.customerPortal || features.roles || features.payments);
  const detected = Object.values(features).filter(Boolean).length;
  return {
    url: url.toString(),
    host: `${name} (${store})`,
    title: name,
    kind: "mobile",
    pages: Math.min(60, 8 + detected * 2),
    design: has(/beautiful|stunning|immersive|data-rich|polished|premium design/) ? "rich" : "moderate",
    animations: has(/animation|interactive|live activities|dynamic island/) ? "some" : "none",
    responsive: true,
    features,
    services,
    evidence: evidence.slice(0, 14),
    text: `${name}. ${category}. ${description}`.slice(0, 6000),
    platform: store,
  };
}

export async function readReference(input: string): Promise<ReferenceSignals> {
  const start = normaliseUrl(input);
  const { url, text: html } = await fetchPublicText(start);
  if (/^(apps\.apple\.com|play\.google\.com)$/i.test(url.hostname)) return readStoreListing(url, html);
  const lower = html.toLowerCase();
  const visible = strip(html);
  const words = visible.toLowerCase();
  const hit = (re: RegExp) => re.test(lower) || re.test(words);
  const evidence: string[] = [];
  const features: Partial<Record<ReferenceFeature, boolean>> = {};
  const mark = (f: ReferenceFeature, ok: boolean, why: string) => {
    if (!ok) return;
    features[f] = true;
    evidence.push(why);
  };

  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? url.hostname).trim().slice(0, 120);
  const internalLinks = new Set(
    [...html.matchAll(/href=["']([^"'#?]+)["']/gi)]
      .map((m) => m[1])
      .filter((h) => h.startsWith("/") || h.includes(url.hostname))
      .map((h) => h.replace(/^https?:\/\/[^/]+/i, "").replace(/\/$/, "") || "/")
      .filter((h) => !/\.(png|jpe?g|svg|webp|gif|css|js|ico|pdf|xml)$/i.test(h)),
  );
  const fromSitemap = await sitemapCount(url.origin);
  const pages = Math.max(1, Math.min(200, fromSitemap || internalLinks.size));

  // Platforms and third-party services are read from the page's own scripts, embeds and meta tags only,
  // so a list of logos or names in the copy (e.g. "we integrate with Shopify") isn't mistaken for them.
  const assets = [
    ...[...html.matchAll(/<(script|iframe|link|img|source)\b[^>]*\b(src|href)=["']([^"']+)["']/gi)].map((m) => m[3]),
    // Inline vendor snippets are small; framework data payloads (Next.js __next_f, JSON, JSON-LD) carry the page copy, so skip them.
    ...[...html.matchAll(/<script\b(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter((m) => !/application\/(ld\+)?json/i.test(m[1]) && !/__next_f|__NEXT_DATA__|__NUXT__/.test(m[2]) && m[2].length < 4000)
      .map((m) => m[2]),
    html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)/i)?.[1] ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const services = SERVICES.filter(([re]) => re.test(assets)).map(([, name]) => name);
  const platform = PLATFORMS.find(([re]) => re.test(assets))?.[1];

  // Evidence from what visitors can actually do (links, buttons, inputs, scripts), not from words in the
  // copy: a marketing page that *talks about* dashboards or checkout doesn't have them.
  const actions = [...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)]
    .map((m) => `${m[2].match(/href=["']([^"']*)/i)?.[1] ?? ""} ${strip(m[3])}`)
    .join(" | ")
    .toLowerCase();
  const act = (re: RegExp) => re.test(actions);
  const hasPassword = /type=["']password["']/i.test(html);
  const signIn = hasPassword || act(/\/(login|log-in|signin|sign-in|account|my-account|register|signup|sign-up)\b|\b(log ?in|sign ?in|sign ?up|my account|create account)\b/);

  mark("forms", /<form[\s>]/i.test(html) || act(/contact|enquir|get in touch|quote/), "Contact or enquiry forms");
  mark("auth", signIn, "Sign-in or account links");
  mark("search", /type=["']search["']|role=["']search["']|name=["'](q|s|search|query)["']/i.test(html), "Search box");
  mark("ecommerce", act(/\/(cart|basket|checkout|shop|products?)\b|add to (cart|basket|bag)|view (cart|basket)/) || platform === "Shopify", "Shop, basket or checkout");
  mark("payments", services.some((sname) => /Stripe|PayPal/.test(sname)) || (Boolean(features.ecommerce) && hit(/apple pay|google pay|secure (payment|checkout)/)), "Online payments");
  mark("booking", act(/\/(book|booking|appointments?|reserve|schedule)\b|book (now|online|an appointment|a table|a session)|reserve/) || services.includes("Calendly"), "Booking or scheduling");
  mark("chatbot", services.some((sname) => /Intercom|Drift|Tidio|Zendesk|Crisp|Tawk/.test(sname)) || act(/\b(live chat|chat with us|ask (our )?(assistant|ai))\b/) || /aria-label=["'][^"']*(assistant|chat)[^"']*["']/i.test(html), "Chat widget");
  mark("ai", hit(/\b(ai|gpt|llm)[- ](powered|assistant|agent|chatbot)|artificial intelligence|machine learning/) && Boolean(features.chatbot || signIn), "AI features in the product");
  mark("dashboard", signIn && act(/\/(dashboard|app|workspace|portal)\b|\b(dashboard|go to app|open app)\b/), "Dashboard or app area");
  mark("customerPortal", signIn && act(/customer (portal|area)|client (portal|area)|my orders|track (your )?order|my bookings/), "Customer area");
  mark("roles", signIn && hit(/\b(teams?|roles?|permissions|admin(istrator)?s?)\b.{0,40}\b(invite|manage|access)/), "Teams, roles or permissions");
  mark("reporting", Boolean(features.dashboard) && hit(/\breports?\b|\breporting\b|insights|analytics/), "Reporting or analytics");
  mark("realtime", /socket\.io|wss:\/\/|pusher|ably|firebaseio|supabase.*realtime/i.test(html), "Real-time connections");
  mark("multilang", /hreflang=/i.test(html), "Multiple languages");
  mark("blog", act(/\/(blog|news|insights|articles|journal)\b/), "Blog or news section");
  mark("mobileApp", /apps\.apple\.com|play\.google\.com\/store/i.test(html), "App Store or Google Play links");
  if (services.filter((sname) => !/Analytics|Bot protection|Video embeds/.test(sname)).length) {
    features.integrations = true;
    evidence.push(`Third-party services: ${services.join(", ")}`);
  }

  const appLike = Boolean(features.dashboard || (features.auth && hit(/pricing|free trial|start for free|per (user|seat|month)/)));
  const kind: ReferenceAnalysis["kind"] = features.ecommerce ? "ecommerce" : appLike ? (hit(/pricing|free trial|per (user|seat)/) ? "saas" : "webapp") : "website";
  if (appLike) {
    features.backend = true;
    features.database = true;
    features.admin = Boolean(features.roles || features.dashboard);
  } else if (features.auth || features.booking || features.ecommerce || features.customerPortal) {
    features.backend = true;
    features.database = true;
  }

  const animationLibs = (lower.match(/gsap|framer-motion|lottie|swiper|aos\.js|data-aos|three\.js|scrolltrigger|locomotive|barba|webgl/g) ?? []).length;
  const animations: ReferenceAnalysis["animations"] = animationLibs >= 3 ? "heavy" : animationLibs >= 1 || /@keyframes|animation:/i.test(html) ? "some" : "none";
  if (animations !== "none") evidence.push(animations === "heavy" ? "Heavy animation and interaction libraries" : "Some animation");
  const sections = (html.match(/<section[\s>]/gi) ?? []).length;
  const design: ReferenceAnalysis["design"] = animations === "heavy" || sections > 14 ? "rich" : sections > 6 || animations === "some" ? "moderate" : "simple";
  const responsive = /name=["']viewport["']/i.test(html);
  if (platform) evidence.push(`Built with ${platform}`);
  evidence.unshift(`About ${pages} page${pages === 1 ? "" : "s"} found`);

  return {
    url: url.toString(),
    host: url.hostname.replace(/^www\./, ""),
    title,
    kind,
    pages,
    design,
    animations,
    responsive,
    features,
    services,
    evidence: evidence.slice(0, 14),
    text: `${title}. ${(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? "")} ${visible}`.slice(0, 6000),
    platform,
  };
}
