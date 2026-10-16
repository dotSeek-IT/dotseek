"use client";

import type { Region } from "@/content/regions";
import { setRegionChoice, useRegion } from "./useRegion";
import styles from "./Currency.module.css";

/** "≈ £640" under a local amount (the commercial value in GBP); nothing when the currency is GBP. */
export function RefAmount({ gbp, className }: { gbp: number; className?: string }) {
  const { money } = useRegion();
  const ref = gbp ? money.ref(gbp) : null;
  if (!ref) return null;
  return <span className={[styles.ref, className].filter(Boolean).join(" ")}>{ref}</span>;
}

/** Emoji flag for a two-letter country code ("IN" gives the Indian flag). */
const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** A region's flag: its country, the EU flag for the euro area, a globe for "every other country". */
function regionFlag(region: Region, country?: string | null) {
  if (country && /^[A-Z]{2}$/i.test(country) && region.countries.includes(country.toUpperCase())) return flag(country);
  if (region.countries.includes("*")) return "🌐";
  if (region.currency === "EUR") return flag("EU");
  return region.countries[0] ? flag(region.countries[0]) : "🌐";
}

const countryName = (code: string | null) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};

/** "🇮🇳 Currency: INR ₹ ▼": automatic by location (with the visitor's flag), or any configured currency. Changing it refreshes every price. */
export function CurrencySelector({ className }: { className?: string }) {
  const { regions, choice, detected, region, country } = useRegion();
  // One entry per currency (International shares GBP with the UK).
  const options = regions.filter((r, i) => regions.findIndex((x) => x.currency === r.currency) === i);
  const where = countryName(country);
  const shown = choice === "auto" ? regionFlag(detected, country) : regionFlag(region);
  return (
    <label className={[styles.selector, className].filter(Boolean).join(" ")}>
      <span className={styles.flag} aria-hidden="true" title={where ? `Your location: ${where}` : undefined}>
        {shown}
      </span>
      <span>Currency</span>
      <select value={choice} onChange={(event) => setRegionChoice(event.target.value)}>
        <option value="auto">
          {regionFlag(detected, country)} {detected.currency} {detected.symbol !== detected.currency ? detected.symbol : ""} ({where ?? "your location"})
        </option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {regionFlag(r)} {r.currency} {r.symbol !== r.currency ? r.symbol : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
