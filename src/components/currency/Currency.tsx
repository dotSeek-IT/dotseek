"use client";

import { setRegionChoice, useRegion } from "./useRegion";
import styles from "./Currency.module.css";

/** "≈ £640" under a local amount (the commercial value in GBP); nothing when the currency is GBP. */
export function RefAmount({ gbp, className }: { gbp: number; className?: string }) {
  const { money } = useRegion();
  const ref = gbp ? money.ref(gbp) : null;
  if (!ref) return null;
  return <span className={[styles.ref, className].filter(Boolean).join(" ")}>{ref}</span>;
}

/** "Currency: INR ₹ ▼" — automatic by location, or any configured currency. Changing it refreshes every price. */
export function CurrencySelector({ className }: { className?: string }) {
  const { regions, choice, detected } = useRegion();
  // One entry per currency (International shares GBP with the UK).
  const options = regions.filter((r, i) => regions.findIndex((x) => x.currency === r.currency) === i);
  return (
    <label className={[styles.selector, className].filter(Boolean).join(" ")}>
      <span>Currency</span>
      <select value={choice} onChange={(event) => setRegionChoice(event.target.value)}>
        <option value="auto">
          {detected.currency} {detected.symbol !== detected.currency ? detected.symbol : ""} (your location)
        </option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.currency} {r.symbol !== r.currency ? r.symbol : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
