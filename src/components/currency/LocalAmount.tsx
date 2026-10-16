"use client";

import { displayCurrencies, formatLocal, localNote } from "@/content/currencies";
import { setCurrencyChoice, useDisplayCurrency, type CurrencyChoice } from "./useDisplayCurrency";
import styles from "./LocalAmount.module.css";

/** "≈ $9,210" beside a GBP amount when a display currency applies (nothing for GBP only). */
export function LocalAmount({ gbp, className }: { gbp: number; className?: string }) {
  const { currency } = useDisplayCurrency();
  if (!currency || !gbp) return null;
  return (
    <span className={[styles.local, className].filter(Boolean).join(" ")} title={`Approximate, at ${currency.perGbp} ${currency.currency} per GBP`}>
      ≈ {formatLocal(gbp, currency)}
    </span>
  );
}

/** "≈ $4,820–$15,700" for a GBP range. */
export function LocalRange({ min, max, className }: { min: number; max: number; className?: string }) {
  const { currency } = useDisplayCurrency();
  if (!currency || !max) return null;
  return (
    <span className={[styles.local, className].filter(Boolean).join(" ")}>
      ≈ {formatLocal(min, currency)}–{formatLocal(max, currency)}
    </span>
  );
}

/** For documents: "Approx. $9,210 at 1.27 USD per GBP … The quotation is in GBP." (nothing for GBP only). */
export function LocalNote({ gbp, className }: { gbp: number; className?: string }) {
  const { currency } = useDisplayCurrency();
  if (!currency || !gbp) return null;
  return <p className={className}>{localNote(gbp, currency)}</p>;
}

/** Small select: show prices in GBP only, or with an approximate local amount (auto from location by default). */
export function CurrencyPicker({ className }: { className?: string }) {
  const { choice, detected } = useDisplayCurrency();
  return (
    <label className={[styles.picker, className].filter(Boolean).join(" ")}>
      <span>Also show</span>
      <select value={choice} onChange={(event) => setCurrencyChoice(event.target.value as CurrencyChoice)} aria-label="Also show prices in">
        <option value="auto">{detected ? `${detected.currency} (your location)` : "Automatic (by location)"}</option>
        <option value="gbp">GBP only</option>
        {displayCurrencies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.currency}: {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
