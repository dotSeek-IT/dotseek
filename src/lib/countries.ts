/** Emoji flag for a two-letter country code ("IN" gives the Indian flag); a globe when unknown. */
export const flagEmoji = (code: string | null | undefined) =>
  code && /^[A-Z]{2}$/i.test(code) && code.toUpperCase() !== "XX"
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌐";

/** "GB" -> "United Kingdom" (English names); null for unknown codes. */
export function countryName(code: string | null | undefined): string | null {
  if (!code || !/^[A-Z]{2}$/i.test(code) || code.toUpperCase() === "XX") return null;
  try {
    return new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
