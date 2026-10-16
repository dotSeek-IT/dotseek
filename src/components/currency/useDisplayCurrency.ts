"use client";

import { useEffect, useSyncExternalStore } from "react";
import { currencyById, currencyForCountry, type DisplayCurrency, type DisplayCurrencyId } from "@/content/currencies";

/**
 * Which currency to show next to GBP prices: "auto" (from the visitor's
 * country), "gbp" (GBP only) or a chosen currency. The choice is remembered on
 * this device; the detected country only for this tab.
 */
export type CurrencyChoice = "auto" | "gbp" | DisplayCurrencyId;

const CHOICE_KEY = "dotseek-currency";
const COUNTRY_KEY = "dotseek-country";

type Store = { choice: CurrencyChoice; country: string | null; ready: boolean };
let store: Store = { choice: "auto", country: null, ready: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: Store = { choice: "auto", country: null, ready: false };

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let choice: CurrencyChoice = "auto";
  let country: string | null = null;
  try {
    const saved = window.localStorage.getItem(CHOICE_KEY);
    if (saved === "gbp" || saved === "auto" || currencyById(saved)) choice = saved as CurrencyChoice;
    country = window.sessionStorage.getItem(COUNTRY_KEY);
  } catch {
    // Storage blocked: defaults apply.
  }
  store = { choice, country, ready: true };
  emit();
  if (country !== null) return;
  fetch("/api/geo")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { country?: string | null } | null) => {
      const found = data?.country ?? "";
      try {
        window.sessionStorage.setItem(COUNTRY_KEY, found);
      } catch {
        // Not kept: asked again next time.
      }
      store = { ...store, country: found };
      emit();
    })
    .catch(() => undefined);
}

export function setCurrencyChoice(choice: CurrencyChoice) {
  store = { ...store, choice };
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // Not kept: applies to this page only.
  }
  emit();
}

/** The display currency right now (outside React, e.g. when sending an enquiry). */
export function currentDisplayCurrencyId(): DisplayCurrencyId | null {
  const detected = currencyForCountry(store.country);
  const c = store.choice === "auto" ? detected : store.choice === "gbp" ? null : currencyById(store.choice);
  return c?.id ?? null;
}

/** The currency to show beside GBP (null: GBP only), the choice, and the auto-detected currency. */
export function useDisplayCurrency(): { currency: DisplayCurrency | null; choice: CurrencyChoice; detected: DisplayCurrency | null } {
  const s = useSyncExternalStore(subscribe, () => store, () => SERVER);
  useEffect(start, []);
  const detected = currencyForCountry(s.country);
  const currency = s.choice === "auto" ? detected : s.choice === "gbp" ? null : currencyById(s.choice);
  return { currency, choice: s.choice, detected };
}
